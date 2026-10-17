/* Load vendor/signalr.min.js before this module. No CDN or build step required. */
import { normalize } from './contracts.js';
export class HudClient {
  constructor(address = location.href) {
    this.address = new URL(address);
    const parts = this.address.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'hud-packages' || parts.length < 3) throw new Error('Open the installed sOU package URL.');
    this.identity = Object.freeze({ id: parts[1], version: parts[2] });
  }
  media(path) {
    if (!path.startsWith('/cast-media/') || /\.\.|[\\?#%]/.test(path) || path.slice(12).includes('/')) throw new Error('Expected a local cast-media path.');
    return new URL(path, this.address).href;
  }
  // Returns a cancellation function. State is replayed; past actions are never replayed.
  watch(receive, { signal, status = () => {}, error = console.error } = {}) {
    return this.stream('live', '/hud-live/v2', [], receive, { signal, status, error });
  }
  watchPanel(receive, { signal, status = () => {}, error = console.error } = {}) {
    return this.stream('panel', '/hud-live/panels', [this.identity.id, this.identity.version], receive, { signal, status, error });
  }
  stream(channel, path, args, receive, { signal, status, error }) {
    if (!globalThis.signalR) throw new Error('Load the bundled Microsoft SignalR client first.');
    let stopped = false, hub, wake, timer;
    const stop = () => { stopped = true; clearTimeout(timer); wake?.(); void hub?.stop(); };
    if (signal?.aborted) { status(channel, 'stopped'); return stop; }
    signal?.addEventListener('abort', stop, { once: true });
    const run = async () => {
      let retry = false;
      try {
        while (!stopped) {
          status(channel, retry ? 'reconnecting' : 'connecting');
          try {
            const response = await fetch(new URL('/hud-browser/session', this.address), { method: 'POST', headers: { 'X-SOU-HUD': '1' }, credentials: 'same-origin', signal });
            if (!response.ok) throw new Error(`sOU session: ${response.status}`);
            if (stopped) break;
            hub = new signalR.HubConnectionBuilder().withUrl(new URL(path, this.address).href).configureLogging(signalR.LogLevel.None).build();
            await hub.start();
            if (stopped) break;
            status(channel, 'connected');
            await new Promise(resolve => {
              wake = resolve;
              hub.onclose(resolve);
              hub.stream('Watch', ...args).subscribe({ next: value => { try { receive(normalize(channel === 'live' ? 'LiveSnapshot' : 'HudPanelMessage', value)); } catch (e) { error(e); } }, error: resolve, complete: resolve });
            });
          } catch (e) { if (!stopped) error(e); }
          finally { await hub?.stop(); hub = undefined; }
          if (stopped) break;
          retry = true; status(channel, 'reconnecting');
          await new Promise(resolve => { wake = resolve; timer = setTimeout(resolve, 1000); });
        }
      } finally { signal?.removeEventListener('abort', stop); status(channel, 'stopped'); }
    };
    void run();
    return stop;
  }
}
