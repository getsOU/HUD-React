import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createPreviewClient } from '../src/preview/fixture.js';
import { adaptOptions } from '../src/model/metadata.js';
import { panelSettings, SCENES } from '../src/model/panel.js';

let server, Hud;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null }, logLevel: 'error' });
  ({ Hud } = await server.ssrLoadModule('/src/ui/Hud.jsx'));
});
after(async () => { await server?.close(); });

function fixture(scene) {
  const client = createPreviewClient(scene);
  const lifetime = new AbortController();
  let snapshot, panel;
  const stop = client.watch(value => { snapshot = value; }, { signal: lifetime.signal, status() {} });
  client.watchPanel(message => { if (message.state) panel = message.state; }, { signal: lifetime.signal, status() {} });
  stop(); lifetime.abort();
  return { snapshot, settings: panelSettings(panel), metadata: adaptOptions(client.options, snapshot),
    now: Date.now(), media: client.media, liveStatus: 'connected', panelStatus: 'connected', preview: true,
    radarTimelineAccepted: true, lowerThirdVisible: false };
}

for (const scene of SCENES) test(`${scene} view renders real components with the complete synthetic contract`, () => {
  const address = `http://127.0.0.1/hud-packages/sou-basic-react/0.2.0/${scene === 'live' ? '' : `views/${scene}`}`;
  const html = renderToStaticMarkup(createElement(Hud, { state: fixture(scene), address }));
  assert.ok(html.includes(`sOU Showcase HUD · ${scene}`));
  assert.ok(html.includes('EXAMPLE CHAMPIONSHIP'));
  assert.doesNotMatch(html, /NaN|undefined|\[object Object\]|OPTIONS\.CAPTION/);
  if (scene === 'lineups') assert.ok(html.includes('Example CT 1'));
  if (scene === 'postmatch') assert.ok(html.includes('EXAMPLE ALPHA WIN THE SERIES'));
  if (scene === 'live') {
    for (const label of ['World position radar', 'Killfeed', 'Round history', 'Observed player', 'counterTerrorists economy']) assert.ok(html.includes(label), label);
  }
});

for (const scene of SCENES) test(`${scene} view tolerates a waiting snapshot without game or match data`, () => {
  const state = { ...fixture(scene), snapshot: null, metadata: null };
  const address = `http://127.0.0.1/hud-packages/sou-basic-react/0.2.0/${scene === 'live' ? '' : `views/${scene}`}`;
  const html = renderToStaticMarkup(createElement(Hud, { state, address }));
  assert.ok(html.includes(`sOU Showcase HUD · ${scene}`));
  assert.doesNotMatch(html, /NaN|undefined|\[object Object\]|WIN THE SERIES/);
});
