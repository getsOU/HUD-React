import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { broadcastCaption, liveSeries, recentRounds, roundHistoryVisible, roundLabel, seriesPips } from '../src/model/broadcast.js';
import { boltBombVisible, boltBuyzonesVisible, boltFlashVisible, boltMarkerScale, boltPoint, boltProjectileImage, boltProjectileVisible, boltSmokeVisible } from '../src/model/boltobserv.js';
import { canonicalMapName, packageAsset, readRadarCatalog } from '../src/model/assets.js';
import { radarView } from '../src/model/showcase.js';

const catalog = readRadarCatalog(JSON.parse(await readFile(new URL('../public/assets/boltobserv/catalog.json', import.meta.url))));
const snapshot = () => ({ managedMatch: { bestOf: 3, teamA: { id: 'a', name: 'Alpha', seriesWins: 1 }, teamB: { id: 'b', name: 'Bravo', seriesWins: 0 },
  ct: { side: 'counterTerrorists', status: 'recognized', teamId: 'a' }, t: { side: 'terrorists', status: 'recognized', teamId: 'b' },
  maps: [{ id: 'one', number: 1, name: 'Ancient', gameName: 'de_ancient', status: 'completed', scoreA: 13, scoreB: 8 },
    { id: 'two', number: 2, name: 'Inferno', gameName: 'de_inferno', status: 'live', scoreA: 3, scoreB: null },
    { id: 'three', number: 3, name: '', gameName: 'de_nuke', status: 'pending' }] }, game: { map: 'de_dust2' } });

test('caption selects exactly one public title without an invented brand fallback', () => {
  const state = { settings: { caption: 'Chosen caption' }, snapshot: snapshot() };
  state.snapshot.managedMatch.competition = { name: 'Competition', season: 'Season', sections: [{ name: 'Division' }] };
  assert.equal(broadcastCaption(state), 'Chosen caption');
  state.settings.caption = ' '; assert.equal(broadcastCaption(state), 'Competition');
  state.snapshot.managedMatch.competition.name = null; assert.equal(broadcastCaption(state), '');
});

test('round number is visible during normal play while actual bomb and timeout override it', () => {
  assert.equal(roundLabel({ roundNumber: 5, roundPhase: 'live', countdown: { phase: 'live' } }), 'ROUND 5');
  assert.equal(roundLabel({ roundPhase: 'live' }), '');
  assert.equal(roundLabel({ roundNumber: 5, bomb: { state: 'planted' } }), 'BOMB PLANTED');
  assert.equal(roundLabel({ roundNumber: 5, countdown: { phase: 'timeoutCounterTerrorists' } }), 'CT TIMEOUT');
});

test('series pips follow reliable team identity through side changes', () => {
  const source = snapshot();
  assert.deepEqual(seriesPips(source, 'counterTerrorists'), [true, false]);
  source.managedMatch.ct.teamId = 'b'; source.managedMatch.t.teamId = 'a';
  assert.deepEqual(seriesPips(source, 'counterTerrorists'), [false, false]);
  assert.deepEqual(seriesPips(source, 'terrorists'), [true, false]);
  source.managedMatch.t.status = 'conflicting'; assert.deepEqual(seriesPips(source, 'terrorists'), []);
});

test('invalid best-of or unavailable series wins never fabricate pips', () => {
  for (const bestOf of [null, 0, 1, 2, 4, 3.5, Infinity]) { const source = snapshot(); source.managedMatch.bestOf = bestOf; assert.deepEqual(seriesPips(source, 'counterTerrorists'), []); }
  for (const wins of [null, -1, 3, 1.5]) { const source = snapshot(); source.managedMatch.teamA.seriesWins = wins; assert.deepEqual(seriesPips(source, 'counterTerrorists'), []); }
});

test('Dust2 does not become configured Map 2 just because Inferno is marked live', () => {
  const source = snapshot();
  const maps = liveSeries(source);
  assert.equal(maps.some(map => map.current), false);
  assert.deepEqual(maps.map(map => map.label), ['Ancient', 'Inferno', 'Nuke']);
  assert.deepEqual(maps.map(map => map.score), ['13:8', null, null]);
  source.game.map = 'de_inferno'; assert.deepEqual(liveSeries(source).map(map => map.current), [false, true, false]);
  source.managedMatch.maps[0].scoreB = null; assert.equal(liveSeries(source)[0].score, null);
});

test('only the documented numeric workshop path canonicalizes an exact map identifier', () => {
  assert.equal(canonicalMapName('workshop/123456/de_dust2'), 'de_dust2');
  for (const value of ['de_dust2_custom', 'prefix/de_dust2', 'https://example.test/de_dust2', 'workshop/abc/de_dust2', 'workshop/123/de_dust2/', 'DE_DUST2']) assert.equal(canonicalMapName(value), value);
  const source = snapshot(); source.game.map = 'workshop/123456/de_inferno'; assert.equal(liveSeries(source)[1].current, true);
  source.game.map = 'workshop/123456/de_inferno_custom'; assert.equal(liveSeries(source).some(map => map.current), false);
  const radar = { game: { map: 'workshop/123456/de_dust2', players: [] } };
  assert.equal(radarView(radar, {}, Date.now(), true, catalog).kind, 'boltobserv');
  radar.game.map = 'workshop/123456/de_dust2_custom'; assert.equal(radarView(radar, {}, Date.now(), true, catalog).kind, 'unavailable');
});

test('active play, bomb, defuse and round-over remove history; real pauses expose it', () => {
  for (const phase of ['live', 'bomb', 'defuse', 'over']) assert.equal(roundHistoryVisible({ roundPhase: 'freezeTime', countdown: { phase } }), false);
  for (const phase of ['freezeTime', 'paused', 'timeoutCounterTerrorists', 'timeoutTerrorists']) assert.equal(roundHistoryVisible({ countdown: { phase } }), true);
  assert.equal(roundHistoryVisible({ phase: 'intermission' }), true);
  assert.equal(roundHistoryVisible({ roundPhase: 'over' }), false);
  assert.equal(roundHistoryVisible({ roundPhase: 'freezeTime', bomb: { state: 'planted' } }), false);
  assert.equal(roundHistoryVisible(null), false);
});

test('history shows the last twelve actual numbered results; statistics can show all', () => {
  const game = { roundWins: Array.from({ length: 20 }, (_, i) => ({ roundNumber: 20 - i, winner: 'terrorists', reason: 'unknown' })) };
  assert.deepEqual(recentRounds(game).map(round => round.roundNumber), Array.from({ length: 12 }, (_, i) => i + 9));
  assert.equal(recentRounds(game, null).length, 20);
});

test('original Dust2 calibration uses logical 1024 dimensions, not original PNG pixel size', () => {
  assert.equal(catalog.length, 10);
  const dust = catalog.find(map => map.map === 'de_dust2');
  const position = { x: dust.metadata.resolution * 1024 / 2 - dust.metadata.offset.x, y: dust.metadata.resolution * 1024 / 2 - dust.metadata.offset.y, z: 0 };
  assert.deepEqual(boltPoint(position, dust.metadata), { x: 50, y: 50 });
  const source = { game: { map: 'de_dust2', observedPlayer: { steamId: 'one' }, players: [{ steamId: 'one', name: 'One', side: 'counterTerrorists', health: 100, flashed: 32, position, forward: { x: 1, y: 0, z: 0 }, weapons: [{ kind: 'c4' }] }] } };
  const view = radarView(source, {}, Date.now(), true, catalog);
  assert.equal(view.kind, 'boltobserv'); assert.equal(view.overview, dust.image);
  assert.equal(view.players[0].x, 50); assert.equal(view.players[0].y, 50);
  assert.equal(view.players[0].observed, true); assert.equal(view.players[0].flashed, true); assert.equal(view.players[0].bombCarrier, true);
});

test('malformed Boltobserv calibration or external overlays cannot become an available map', () => {
  const dust = catalog.find(map => map.map === 'de_dust2');
  for (const mutate of [map => { map.metadata.resolution = 1e308; }, map => { map.metadata.splits = [null]; }, map => { map.buyzones = 'https://example.test/zones.png'; }]) {
    const map = structuredClone(dust); mutate(map);
    assert.deepEqual(readRadarCatalog({ schemaVersion: 1, maps: [map] }), []);
  }
});

for (const [name, lower, boundary] of [['de_nuke', -600, -482], ['de_vertigo', 11500, 11680]]) test(`${name} composes per-object split offsets with strict original bounds`, () => {
  const map = catalog.find(map => map.map === name), span = map.metadata.resolution * 1024;
  const origin = { x: span / 2 - map.metadata.offset.x, y: span * .8 - map.metadata.offset.y, z: lower };
  const upper = boltPoint({ ...origin, z: boundary }, map.metadata), down = boltPoint(origin, map.metadata);
  const split = map.metadata.splits[0];
  assert.ok(Math.abs(down.x - upper.x - split.offset.x) < 1e-9);
  assert.ok(Math.abs(down.y - upper.y + split.offset.y) < 1e-9);
  assert.deepEqual(boltPoint({ ...origin, z: split.bounds.bottom }, map.metadata), upper);
  const source = { game: { map: name, players: [{ steamId: 'lower', position: origin }, { steamId: 'upper', position: { ...origin, z: boundary } }], observedPlayer: { position: { ...origin } } } };
  const first = radarView(source, {}, Date.now(), true, catalog); source.game.observedPlayer.position.z = boundary;
  const second = radarView(source, {}, Date.now(), true, catalog);
  assert.equal(first.overview, second.overview); assert.deepEqual(first.players.map(player => [player.x, player.y]), second.players.map(player => [player.x, player.y]));
});

test('buyzone overlay requires actual freeze or warmup and marker heights stay bounded', () => {
  assert.equal(boltBuyzonesVisible({ countdown: { phase: 'freezeTime' } }), true);
  assert.equal(boltBuyzonesVisible({ phase: 'warmup' }), true);
  assert.equal(boltBuyzonesVisible({ roundPhase: 'live', countdown: { phase: 'live', secondsRemaining: 115 } }), false);
  const dust = catalog.find(map => map.map === 'de_dust2').metadata;
  assert.equal(boltMarkerScale(null, dust), .7);
  assert.ok(boltMarkerScale(-1e6, dust) >= .525 - 1e-9); assert.ok(boltMarkerScale(1e6, dust) <= .875 + 1e-9);
});

test('original projectile names preserve CT/T case and never guess an owner team', () => {
  assert.equal(boltProjectileImage('smoke', 'counterTerrorists'), 'assets/boltobserv/img/projectile-img-smoke-CT.webp');
  assert.equal(boltProjectileImage('highExplosive', 'terrorists'), 'assets/boltobserv/img/projectile-img-frag-T.webp');
  assert.equal(boltProjectileImage('smoke', 'unknown'), null);
  assert.ok(packageAsset(boltProjectileImage('smoke', 'counterTerrorists'), 'http://localhost/pkg/').endsWith('-CT.webp'));
});

test('smoke uses positive effect time while zero and absent effect time remain flight', () => {
  for (const effectTimeSeconds of [0, null, -1, Infinity]) {
    assert.equal(boltSmokeVisible({ type: 'smoke', effectTimeSeconds }), false);
    assert.equal(boltProjectileVisible({ type: 'smoke', effectTimeSeconds }), true);
  }
  assert.equal(boltSmokeVisible({ type: 'smoke', effectTimeSeconds: 3 }), true);
  assert.equal(boltProjectileVisible({ type: 'smoke', effectTimeSeconds: 3 }), false);
});
test('flash detonates at original lifetime threshold independently of absent effect time', () => {
  for (const lifetimeSeconds of [1.4, 1.5]) {
    const grenade = { type: 'flashbang', lifetimeSeconds, effectTimeSeconds: null };
    assert.equal(boltFlashVisible(grenade), true); assert.equal(boltProjectileVisible(grenade), false);
  }
  for (const lifetimeSeconds of [.5, null, -1, Infinity]) {
    const grenade = { type: 'flashbang', lifetimeSeconds, effectTimeSeconds: 3 };
    assert.equal(boltFlashVisible(grenade), false); assert.equal(boltProjectileVisible(grenade), true);
  }
});
test('inferno only renders supplied flames and known stationary projectiles remain hidden', () => {
  assert.equal(boltProjectileVisible({ type: 'inferno' }), false);
  assert.equal(boltProjectileVisible({ type: 'decoy' }), false);
  assert.equal(boltProjectileVisible({ type: 'highExplosive', effectTimeSeconds: 3 }), true);
  assert.equal(boltProjectileVisible({ type: 'highExplosive', velocity: { x: 0, y: 0, z: 0 } }), false);
  assert.equal(boltProjectileVisible({ type: 'highExplosive', velocity: { x: 1, y: 0, z: 0 } }), true);
});
test('exploded bombs never become dropped bombs', () => {
  for (const state of ['exploded', 'carried', 'unknown', null]) assert.equal(boltBombVisible({ state }), false);
  for (const state of ['dropped', 'planting', 'planted', 'defusing', 'defused']) assert.equal(boltBombVisible({ state }), true);
});

test('all original Boltobserv artwork, calibrated catalogs and full source ZIP match provenance', async () => {
  const inventory = JSON.parse(await readFile(new URL('../licenses/boltobserv-origins.json', import.meta.url)));
  assert.equal(inventory.assets.length, 65);
  for (const file of [...inventory.assets, ...inventory.generated]) {
    assert.match(file.path, /^assets\/boltobserv\/[a-zA-Z0-9_./-]+$/); assert.ok(!file.path.includes('..'));
    const bytes = await readFile(new URL(`../public/${file.path}`, import.meta.url));
    assert.equal(bytes.length, file.bytes, file.path); assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  }
  const bytes = await readFile(new URL(`../${inventory.sourceArchive.packagePaths.react}`, import.meta.url));
  assert.equal(bytes.length, inventory.sourceArchive.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), inventory.sourceArchive.sha256);
});
