import { panelSettings } from './model.js';
import { adaptOptions, metadataKey, startMetadataPolling } from './model/metadata.js';
import { loadRadarCatalog } from './model/assets.js';
import { createRadarFlashTracker } from './model/radar-flashes.js';

const initial = () => ({
  snapshot: null,
  settings: panelSettings(null),
  liveStatus: 'connecting',
  panelStatus: 'connecting',
  message: null,
  preview: false,
  metadata: null,
  metadataAvailable: false,
  lowerThirdVisible: false,
  radarTimelineAccepted: true,
  radarCatalog: [],
  radarFlashes: [],
  assetBase: null,
  now: Date.now(),
  media: () => null,
});

/** A single pair of SDK streams shared by React subscribers. No network on import. */
export function createHudStore(clientFactory) {
  let state = initial();
  let lifetime;
  let generation = 0;
  let stops = [];
  let ticker;
  let radarCursor;
  let panelRevision = -1;
  const actions = new Set();
  const radarFlashTracker = createRadarFlashTracker();
  const listeners = new Set();
  const publish = patch => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };

  function start() {
    const current = ++generation;
    lifetime = new AbortController();
    const { signal } = lifetime;
    const valid = () => current === generation && !signal.aborted;
    const status = (channel, value) => {
      if (!valid()) return;
      const changed = { [channel === 'live' ? 'liveStatus' : 'panelStatus']: value };
      if (value === 'connecting' || value === 'reconnecting' || value === 'stopped') {
        changed.lowerThirdVisible = false;
        if (channel === 'panel') panelRevision = -1;
        if (channel === 'live') { changed.metadata = null; changed.metadataAvailable = false; }
      }
      publish(changed);
    };
    // Errors can contain request context. Keep console/UI messages generic.
    const error = () => { if (valid()) publish({ message: 'Connection interrupted · retrying' }); };
    Promise.resolve().then(clientFactory).then(client => {
      if (!valid()) return;
      if (client.packageBase) {
        publish({ assetBase: client.packageBase });
        void loadRadarCatalog(client.packageBase, signal).then(radarCatalog => { if (valid()) publish({ radarCatalog }); });
      }
      publish({ preview: client.preview === true, previewScene: client.previewScene, media: path => {
        try { return typeof path === 'string' && path ? client.media(path) : null; } catch { return null; }
      } });
      const stopLive = client.watch(snapshot => {
        if (!valid()) return;
        if (snapshot?.schemaVersion !== 2) {
          radarFlashTracker.clear();
          publish({ snapshot: null, radarFlashes: [], message: 'Unsupported HUD protocol' });
          return;
        }
        // A new session replaces all prior match/roster state. Never merge snapshots.
        if (snapshot.sessionId === state.snapshot?.sessionId && snapshot.revision < state.snapshot.revision) return;
        const contextChanged = metadataKey(snapshot) !== metadataKey(state.snapshot) || snapshot.sessionId !== state.snapshot?.sessionId;
        const reset = contextChanged ? { metadata: null, metadataAvailable: false, lowerThirdVisible: false } : {};
        if (contextChanged) radarCursor = null;
        const radar = snapshot.game?.radar;
        let radarTimelineAccepted = false;
        if (radar) {
          const key = [snapshot.sessionId, snapshot.game.map, snapshot.game.roundNumber, radar.connectionId, radar.epoch].join('|');
          radarTimelineAccepted = !radarCursor || radarCursor.key !== key ||
            (radar.sequence >= radarCursor.sequence && radar.gameTimeSeconds >= radarCursor.gameTimeSeconds);
          if (radarTimelineAccepted) radarCursor = { key, sequence: radar.sequence, gameTimeSeconds: radar.gameTimeSeconds };
        }
        const now = Date.now();
        publish({ ...reset, snapshot, now, radarFlashes: radarFlashTracker.update(snapshot, now), message: null, radarTimelineAccepted });
        if (client.preview && client.options) {
          const metadata = adaptOptions(client.options, snapshot);
          publish({ metadata, metadataAvailable: metadata !== null });
        }
      }, { signal, status, error });
      if (typeof stopLive === 'function') stops.push(stopLive);
      const stopPanel = client.watchPanel(message => {
        if (!valid() || !message) return;
        if (message.hudId !== client.identity.id || message.version !== client.identity.version) return;
        if (message.state && message.state.revision >= panelRevision) {
          panelRevision = message.state.revision;
          publish({ settings: panelSettings(message.state) });
        }
        const action = message.action;
        const actionId = typeof action?.id === 'string' ? action.id.toLowerCase() : '';
        if (action?.section === 'production' && action.name === 'lowerThird' && ['show', 'hide'].includes(action.value) &&
          /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(actionId) && !actions.has(actionId)) {
          actions.add(actionId);
          if (actions.size > 128) actions.delete(actions.values().next().value);
          publish({ lowerThirdVisible: action.value === 'show' });
        }
      }, { signal, status, error });
      if (typeof stopPanel === 'function') stops.push(stopPanel);
      if (!client.preview && client.address) stops.push(startMetadataPolling({
        address: client.address, signal, snapshot: () => state.snapshot,
        receive: metadata => { if (valid()) publish({ metadata, metadataAvailable: metadata !== null }); },
      }));
    }).catch(() => {
      if (valid()) {
        for (const stop of stops) stop();
        stops = [];
        publish({ liveStatus: 'disconnected', panelStatus: 'disconnected', message: 'Open this HUD from sOU to connect', metadata: null, metadataAvailable: false });
      }
    });
    ticker = setInterval(() => { if (valid()) { const now = Date.now(); publish({ now, radarFlashes: radarFlashTracker.read(now) }); } }, 250);
    ticker.unref?.();
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) start();
      let removed = false;
      return () => {
        if (removed) return;
        removed = true;
        listeners.delete(listener);
        if (listeners.size === 0) {
          ++generation;
          lifetime?.abort();
          clearInterval(ticker);
          for (const stop of stops) stop();
          stops = [];
          radarCursor = null;
          panelRevision = -1;
          actions.clear();
          radarFlashTracker.clear();
          state = initial();
        }
      };
    },
  };
}
