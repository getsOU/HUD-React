import { panelSettings } from './model.js';

const initial = () => ({
  snapshot: null,
  settings: panelSettings(null),
  liveStatus: 'connecting',
  panelStatus: 'connecting',
  message: null,
  preview: false,
});

/** A single pair of SDK streams shared by React subscribers. No network on import. */
export function createHudStore(clientFactory) {
  let state = initial();
  let lifetime;
  let generation = 0;
  let stops = [];
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
      if (valid()) publish({ [channel === 'live' ? 'liveStatus' : 'panelStatus']: value });
    };
    // Errors can contain request context. Keep console/UI messages generic.
    const error = () => { if (valid()) publish({ message: 'Connection interrupted · retrying' }); };
    Promise.resolve().then(clientFactory).then(client => {
      if (!valid()) return;
      publish({ preview: client.preview === true });
      const stopLive = client.watch(snapshot => {
        if (!valid()) return;
        if (snapshot?.schemaVersion !== 2) {
          publish({ snapshot: null, message: 'Unsupported HUD protocol' });
          return;
        }
        // A new session replaces all prior match/roster state. Never merge snapshots.
        if (snapshot.sessionId === state.snapshot?.sessionId && snapshot.revision < state.snapshot.revision) return;
        publish({ snapshot, message: null });
      }, { signal, status, error });
      if (typeof stopLive === 'function') stops.push(stopLive);
      const stopPanel = client.watchPanel(message => {
        if (!valid() || !message?.state) return;
        if (message.hudId !== client.identity.id || message.version !== client.identity.version) return;
        publish({ settings: panelSettings(message.state) });
      }, { signal, status, error });
      if (typeof stopPanel === 'function') stops.push(stopPanel);
    }).catch(() => {
      if (valid()) {
        for (const stop of stops) stop();
        stops = [];
        publish({ liveStatus: 'disconnected', panelStatus: 'disconnected', message: 'Open this HUD from sOU to connect' });
      }
    });
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
          for (const stop of stops) stop();
          stops = [];
          state = initial();
        }
      };
    },
  };
}
