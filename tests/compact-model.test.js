import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRadarCatalog, packageAsset, radarLayer, readRadarCatalog, weaponAsset, weaponLabel } from '../src/model/assets.js';
import { sourceName } from '../src/model/source-name.js';
import { playerName, radarView } from '../src/model/showcase.js';
import { teamName } from '../src/model.js';
import { radarPresentation } from '../src/model/radar-presentation.js';

const catalogSource = JSON.parse(await readFile(new URL('../public/assets/radar/catalog.json', import.meta.url)));
const catalog = readRadarCatalog(catalogSource);
const snapshot = (map, position) => ({ sessionId: 'isolated', game: { map, observedPlayer: { steamId: '1', position }, players: [{ steamId: '1', name: 'Player', health: 100, position }] } });

test('source names decode one pass as text while saved profile names remain untouched', () => {
  assert.equal(sourceName('&lt;A&gt; &amp; &#39; &#x1f3af;'), "<A> & ' 🎯");
  assert.equal(sourceName('&amp;lt;script&amp;gt;'), '&lt;script&gt;');
  assert.equal(sourceName('&#0; &#xD800; &#x110000;'), '� � �');
  assert.equal(sourceName('&Auml; &uuml; &CounterClockwiseContourIntegral;'), 'Ä ü ∳');
  assert.equal(playerName({ name: 'GSI &amp; Name' }, null), 'GSI & Name');
  assert.equal(playerName({ name: 'GSI &amp; Name' }, { name: 'Profile &amp; Name' }), 'Profile &amp; Name');
});
test('generic unrecognized GSI team labels are compact without changing actual managed names', () => {
  assert.equal(teamName({ game: { ct: { name: 'COUNTER-TERRORISTS' } } }, 'counterTerrorists'), 'CT');
  assert.equal(teamName({ game: { t: { name: 'TERRORISTS' } } }, 'terrorists'), 'T');
  assert.equal(teamName({ game: { t: { name: 'Actual team name' } } }, 'terrorists'), 'Actual team name');
});
test('actual catalog supplies fixed Dust2 calibration independent of player movement', () => {
  const dust = radarLayer(catalog, 'de_dust2', 64);
  assert.ok(dust?.image.endsWith('/de_dust2.png'));
  const position = { x: dust.posX + dust.width * dust.scale / 2, y: dust.posY - dust.height * dust.scale / 2, z: 64 };
  const source = snapshot('de_dust2', position);
  const first = radarView(source, {}, Date.now(), true, catalog);
  assert.equal(first.calibrated, true); assert.equal(first.packagedOverview, true);
  assert.equal(first.players[0].x, 50); assert.equal(first.players[0].y, 50);
  source.game.players.push({ steamId: 'far', position: { x: 1e6, y: -1e6, z: 64 } });
  const next = radarView(source, {}, Date.now(), true, catalog);
  assert.equal(next.players.length, 1); assert.equal(next.players[0].x, first.players[0].x);
});
test('catalog floors use observed height with inclusive minimum and exclusive maximum', () => {
  const nuke = catalog.find(map => map.map === 'de_nuke');
  const lower = nuke.layers.find(layer => layer.id === 'lower');
  assert.ok(lower && Number.isFinite(lower.maxZ));
  assert.equal(radarLayer(catalog, 'de_nuke', lower.maxZ - 1).id, 'lower');
  assert.notEqual(radarLayer(catalog, 'de_nuke', lower.maxZ).id, 'lower');
  const position = { x: lower.posX + 100, y: lower.posY - 100, z: lower.maxZ - 1 };
  const source = snapshot('de_nuke', position);
  source.game.players.push({ steamId: 'upstairs', position: { ...position, z: lower.maxZ + 1 } });
  const view = radarView(source, {}, Date.now(), true, catalog);
  assert.equal(view.layer, 'lower'); assert.equal(view.players[1].otherFloor, true);
});
test('valid custom overview overrides automatic maps while unknown maps remain explicit', () => {
  const source = snapshot('de_dust2', { x: 0, y: 0, z: 0 });
  const view = radarView(source, { overview: '/cast-media/own.png', mapName: 'de_dust2', minX: '-100', maxX: '100', minY: '-100', maxY: '100' }, Date.now(), true, catalog);
  assert.equal(view.overview, '/cast-media/own.png'); assert.equal(view.packagedOverview, false);
  const unknown = radarView(snapshot('unknown_map', { x: 0, y: 0, z: 0 }), {}, Date.now(), true, catalog);
  assert.equal(unknown.calibrated, false); assert.match(unknown.label, /Map unavailable/);
});

test('failed custom and packaged overviews degrade in order without alternating failed sources', () => {
  const custom = 'http://localhost/cast-media/custom.png';
  const state = { snapshot: snapshot('de_dust2', { x: 0, y: 0, z: 0 }), settings: { radar: { overview: '/cast-media/custom.png', mapName: 'de_dust2', minX: '-100', maxX: '100', minY: '-100', maxY: '100' } },
    now: Date.now(), radarTimelineAccepted: true, radarCatalog: catalog, assetBase: 'http://localhost/pkg/', media: path => path?.startsWith('/cast-media/') ? new URL(path, 'http://localhost/').href : null };
  assert.equal(radarPresentation(state).overview, custom);
  const automatic = radarPresentation(state, [custom]);
  assert.equal(automatic.view.packagedOverview, true);
  assert.match(automatic.overview, /assets\/radar\/de_dust2\.png$/);
  const failed = [custom, automatic.overview];
  const relative = radarPresentation(state, failed);
  assert.equal(relative.overview, null); assert.equal(relative.view.calibrated, false);
  assert.deepEqual(radarPresentation(state, failed), relative);
});
test('catalog refuses external paths, invalid calibration and fabricated site coordinates', () => {
  const invalid = structuredClone(catalogSource);
  for (const map of invalid.maps) for (const layer of map.layers) layer.image = 'https://remote.invalid/map.png';
  assert.deepEqual(readRadarCatalog(invalid), []);
  const badNumbers = structuredClone(catalogSource);
  for (const map of badNumbers.maps) for (const layer of map.layers) layer.scale = 0;
  assert.deepEqual(readRadarCatalog(badNumbers), []);
  assert.equal(packageAsset('assets/../remote.svg', 'http://localhost/pkg/'), null);
  assert.equal(weaponAsset('weapon_../../remote', 'http://localhost/pkg/'), null);
  assert.equal(weaponAsset('KNIFE_SURVIVAL_BOWIE', 'http://localhost/pkg/'), 'http://localhost/pkg/assets/weapons/knife_survival_bowie.svg');
  assert.equal(weaponLabel('KNIFE_SURVIVAL_BOWIE'), 'Knife');
});
test('packaged catalog request stays at package base and enforces a streamed body limit', async () => {
  const lifetime = new AbortController();
  let called = 0;
  const result = await loadRadarCatalog('http://127.0.0.1/hud-packages/id/0.3.0/', lifetime.signal, async (address, options) => {
    called++; assert.match(address, /^http:\/\/127\.0\.0\.1\/hud-packages\/id\/0\.3\.0\/assets\/(?:radar|boltobserv)\/catalog\.json$/);
    assert.equal(options.redirect, 'error'); assert.equal(options.credentials, 'same-origin');
    return new Response(JSON.stringify(address.includes('/boltobserv/') ? { schemaVersion: 1, maps: [] } : catalogSource));
  });
  assert.equal(called, 2); assert.equal(result.length, catalog.length);
  assert.deepEqual(await loadRadarCatalog('http://localhost/pkg/', lifetime.signal, async () => new Response('x'.repeat(128 * 1024 + 1))), []);
});
test('disposing the output aborts an in-flight catalog load and degrades cleanly', async () => {
  const lifetime = new AbortController();
  let requested;
  const started = new Promise(resolve => { requested = resolve; });
  const work = loadRadarCatalog('http://localhost/pkg/', lifetime.signal, async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }); requested();
  }));
  await started; lifetime.abort(); assert.deepEqual(await work, []);
});
test('all original artwork bytes match their supplied Valve provenance inventory', async () => {
  const inventory = JSON.parse(await readFile(new URL('../public/assets/valve-assets.json', import.meta.url)));
  assert.match(inventory.rights, /Not covered by the HUD source license/);
  for (const file of inventory.files) {
    assert.match(file.path, /^assets\/[a-z0-9_./-]+$/); assert.ok(!file.path.includes('..'));
    const bytes = await readFile(new URL(`../public/${file.path}`, import.meta.url));
    assert.equal(bytes.length, file.bytes, file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  }
});
