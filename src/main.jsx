import { StrictMode, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createHudStore } from './hud-store.js';
import { localPreviewMode } from './model.js';
import { Hud } from './ui/Hud.jsx';
import './styles.css';

async function createClient() {
  const mode = localPreviewMode(location.href, import.meta.env.DEV);
  if (import.meta.env.DEV && mode) {
    const { createPreviewClient } = await import('./preview/fixture.js');
    return Object.assign(createPreviewClient(mode), { packageBase: document.baseURI });
  }
  // Kept outside Vite's bundle so the official SDK remains byte-for-byte intact.
  const sdkAddress = new URL('sdk/sou-hud.js', document.baseURI).href;
  const { HudClient } = await import(/* @vite-ignore */ sdkAddress);
  return Object.assign(new HudClient(), { packageBase: document.baseURI });
}

const store = createHudStore(createClient);
function App() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return <Hud state={state} />;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
