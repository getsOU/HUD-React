import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createPreviewClient } from '../src/preview/fixture.js';
import { adaptOptions } from '../src/model/metadata.js';
import { panelSettings, SCENES } from '../src/model/panel.js';
import manifest from '../hud.json' with { type: 'json' };
import boltCatalog from '../public/assets/boltobserv/catalog.json' with { type: 'json' };
import { readRadarCatalog } from '../src/model/assets.js';
import { createRadarFlashTracker } from '../src/model/radar-flashes.js';

let server, Hud, PlayerRow, ObservedPlayer, Inventory, Icon, RoundHistory, KillFeed;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null }, logLevel: 'error' });
  ({ Hud } = await server.ssrLoadModule('/src/ui/Hud.jsx'));
  ({ PlayerRow, ObservedPlayer, Inventory } = await server.ssrLoadModule('/src/ui/components/Players.jsx'));
  ({ Icon } = await server.ssrLoadModule('/src/ui/components/Icons.jsx'));
  ({ RoundHistory, KillFeed } = await server.ssrLoadModule('/src/ui/components/Match.jsx'));
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
    radarCatalog: readRadarCatalog(boltCatalog), radarFlashes: createRadarFlashTracker().update(snapshot, Date.now()), radarTimelineAccepted: true, lowerThirdVisible: false };
}

for (const scene of SCENES) test(`${scene} view renders real components with the complete synthetic contract`, () => {
  const address = `http://127.0.0.1/hud-packages/${manifest.id}/${manifest.version}/${scene === 'live' ? '' : `views/${scene}`}`;
  const html = renderToStaticMarkup(createElement(Hud, { state: fixture(scene), address }));
  assert.ok(html.includes(`sOU Showcase HUD · ${scene}`));
  assert.ok(html.includes(scene === 'live' ? 'sOU BASIC · PREVIEW' : 'EXAMPLE CHAMPIONSHIP'));
  assert.doesNotMatch(html, /NaN|undefined|\[object Object\]|OPTIONS\.CAPTION/);
  if (scene === 'lineups') assert.ok(html.includes('Example CT 1'));
  if (scene === 'postmatch') assert.ok(html.includes('EXAMPLE ALPHA WIN THE SERIES'));
  if (scene === 'live') {
    for (const label of ['World position radar', 'Killfeed', 'Observed player', 'counterTerrorists economy']) assert.ok(html.includes(label), label);
    assert.ok(!html.includes('Round history'));
  }
});

for (const scene of SCENES) test(`${scene} view tolerates a waiting snapshot without game or match data`, () => {
  const state = { ...fixture(scene), snapshot: null, metadata: null };
  const address = `http://127.0.0.1/hud-packages/${manifest.id}/${manifest.version}/${scene === 'live' ? '' : `views/${scene}`}`;
  const html = renderToStaticMarkup(createElement(Hud, { state, address }));
  assert.ok(html.includes(`sOU Showcase HUD · ${scene}`));
  assert.doesNotMatch(html, /NaN|undefined|\[object Object\]|WIN THE SERIES/);
});

test('compact live view omits missing portraits/logos and full detail boxes while keeping real icons', () => {
  const state = fixture('live');
  state.metadata = null;
  state.snapshot.managedMatch.teamA.logo = null; state.snapshot.managedMatch.teamB.logo = null;
  const html = renderToStaticMarkup(createElement(Hud, { state, address: 'http://localhost/hud-packages/sou-basic-react/0.3.0/' }));
  assert.equal((html.match(/class="player-row/g) ?? []).length, 10);
  assert.doesNotMatch(html, /image-fallback roster-avatar|image-fallback observed-avatar|class="map-series|class="economy |recorded rounds|round-numbers/);
  assert.match(html, /assets\/weapons\/[^" ]+\.svg/);
  assert.match(html, /assets\/killfeed\/icon_headshot\.svg/);
});

test('source name markup remains escaped React text after exactly one decode', () => {
  const state = fixture('live'); state.metadata = null;
  const player = state.snapshot.game.players[0]; player.name = '&lt;script&gt;alert(1)&lt;/script&gt; &amp;amp;';
  const html = renderToStaticMarkup(createElement(Hud, { state, address: 'http://localhost/pkg/' }));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp;amp;'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
});

test('offline Spotlight keeps a saved reference name encoded literally as profile text', () => {
  const state = fixture('spotlight'); state.snapshot = null; state.metadata = null;
  state.settings.feature.player = { id: state.settings.feature.playerId, name: 'Profile &amp; Name', missing: false };
  const html = renderToStaticMarkup(createElement(Hud, { state, address: 'http://localhost/pkg/views/spotlight' }));
  assert.ok(html.includes('<h2>Profile &amp;amp; Name</h2>'));
  assert.ok(html.includes('No matching live player statistics supplied'));
});

const renderLive = state => renderToStaticMarkup(createElement(Hud, { state, address: 'http://localhost/pkg/' }));
test('broadcast header renders one selected caption, central round and no technical metadata strip', () => {
  const state = fixture('live'); state.settings.caption = 'Chosen broadcast'; state.snapshot.game.roundNumber = 5;
  const html = renderLive(state);
  assert.match(html, /broadcast-caption[^>]*>Chosen broadcast<\/p>/);
  assert.ok(html.includes('ROUND 5')); assert.ok(!html.includes('EXAMPLE CHAMPIONSHIP'));
  assert.doesNotMatch(html, /class="live-meta|mini-series|class="phase"|class="map"|class="round"/);
  state.settings.caption = ''; assert.ok(renderLive(state).includes('EXAMPLE CHAMPIONSHIP'));
  state.snapshot.managedMatch.competition.name = ''; assert.doesNotMatch(renderLive(state), /broadcast-caption|SOU BASIC/);
});
test('live history is absent from the DOM except an actual pause and statistics stays independent', () => {
  const state = fixture('live');
  state.snapshot.game.roundPhase = 'freezeTime'; state.snapshot.game.countdown.phase = 'freezeTime';
  assert.match(renderLive(state), /class="round-history"/);
  for (const phase of ['live', 'bomb', 'defuse', 'over']) {
    state.snapshot.game.countdown.phase = phase;
    assert.doesNotMatch(renderLive(state), /class="round-history"/);
  }
  const stats = renderToStaticMarkup(createElement(Hud, { state, address: 'http://localhost/pkg/views/statistics' }));
  assert.match(stats, /class="round-history"/);
});
test('missing round number leaves no invented round label and time-expiry uses a clock', () => {
  const state = fixture('live'); state.snapshot.game.roundNumber = null;
  assert.doesNotMatch(renderLive(state), /ROUND (?:–|undefined|null)/);
  state.snapshot.game.roundPhase = 'freezeTime'; state.snapshot.game.countdown.phase = 'freezeTime';
  state.snapshot.game.roundWins = [{ roundNumber: 1, winner: 'counterTerrorists', reason: 'timeExpired' }, { roundNumber: 2, winner: 'unknown', reason: 'unknown' }];
  const html = renderLive(state);
  assert.ok(html.includes('aria-label="Time expired"')); assert.ok(html.includes('aria-label="Unknown round result"'));
});
test('compact map cells do not mark Inferno current for a real Dust2 game or publish partial scores', () => {
  const state = fixture('live'); state.snapshot.game.map = 'de_dust2';
  state.snapshot.managedMatch.maps = [{ id: 'ancient', number: 1, name: 'Ancient', gameName: 'de_ancient', status: 'completed', scoreA: 13, scoreB: 8 }, { id: 'inferno', number: 2, name: 'Inferno', gameName: 'de_inferno', status: 'live', scoreA: 3, scoreB: null }];
  const html = renderLive(state);
  assert.match(html, /class="live-map-series"/); assert.doesNotMatch(html, /aria-current="step"|3:–|13:–/);
  state.snapshot.game.map = 'de_inferno'; assert.match(renderLive(state), /aria-current="step"/);
});
test('original radar terrain is transparent with actual active marker and no technical captions', () => {
  const state = fixture('live'); state.snapshot.game.map = 'de_dust2';
  const html = renderLive(state);
  assert.match(html, /class="radar boltobserv"/); assert.match(html, /assets\/boltobserv\/maps\/de_dust2\/radar\.png/);
  assert.match(html, /class="bolt-player [^"]*active/);
  assert.doesNotMatch(html, /radar-base|radar-grid|<header><strong>de_dust2|<p>.*GSI|overlay_buyzones/);
  state.snapshot.game.roundPhase = 'freezeTime'; state.snapshot.game.countdown.phase = 'freezeTime';
  assert.match(renderLive(state), /overlay_buyzones\.png/);
});
test('unknown maps use a compact availability indicator instead of an invented positions grid', () => {
  const state = fixture('live'); state.snapshot.game.map = 'de_unknown';
  const html = renderLive(state);
  assert.match(html, /class="radar-unavailable"/); assert.doesNotMatch(html, /radar-grid|class="radar "/);
});
test('deployed smoke has its original effect circle without a flying icon; exploded bomb is absent', () => {
  const state = fixture('live');
  state.snapshot.game.grenades = [{ id: 'smoke', type: 'smoke', position: { ...state.snapshot.game.players[0].position }, ownerSteamId: state.snapshot.game.players[0].steamId, effectTimeSeconds: 3 }];
  state.snapshot.game.bomb.state = 'exploded';
  const html = renderLive(state);
  assert.match(html, /class="bolt-smoke ct"/);
  assert.doesNotMatch(html, /projectile-img-smoke|bomb-dropped\.webp|bomb-planted\.webp|bomb-defused\.webp/);
  for (const effectTimeSeconds of [0, null]) {
    state.snapshot.game.grenades[0].effectTimeSeconds = effectTimeSeconds;
    const flying = renderLive(state);
    assert.match(flying, /projectile-img-smoke-CT\.webp/); assert.doesNotMatch(flying, /class="bolt-smoke/);
  }
});
test('real flash lifetime controls the effect without requiring a smoke effect timer', () => {
  const state = fixture('live');
  state.snapshot.game.grenades = [{ id: 'flash', type: 'flashbang', position: { ...state.snapshot.game.players[0].position }, ownerSteamId: state.snapshot.game.players[0].steamId, lifetimeSeconds: 1.5, effectTimeSeconds: null }];
  state.radarFlashes = createRadarFlashTracker().update(state.snapshot, state.now);
  const detonated = renderLive(state);
  assert.match(detonated, /class="bolt-flash pending"/); assert.doesNotMatch(detonated, /projectile-img-flashbang/);
  state.snapshot.game.grenades[0].lifetimeSeconds = .5;
  state.radarFlashes = [];
  const flying = renderLive(state);
  assert.match(flying, /projectile-img-flashbang-CT\.webp/); assert.doesNotMatch(flying, /class="bolt-flash/);
});

const staleCurrentWeapon = () => ({ slot: 'primary', name: 'weapon_m4a1_silencer', kind: 'm4A1S', type: 'rifle', state: 'active', ammoClip: 73, ammoReserve: 99 });
const renderPlayer = (component, player, props = {}) => renderToStaticMarkup(createElement(component, { player, state: fixture('live'), ...props }));
for (const life of [{ health: 0 }, { health: -1 }, { health: 100, isAlive: false }]) test(`dead player ${JSON.stringify(life)} never displays stale current weapon or inventory`, () => {
  const state = fixture('live'), player = { ...state.snapshot.game.players[0], ...life, activeWeapon: staleCurrentWeapon(), weapons: [staleCurrentWeapon(), { slot: 'utility', name: 'weapon_smokegrenade', type: 'grenade', state: 'holstered' }, { slot: 'bomb', name: 'weapon_c4', kind: 'c4', type: 'bomb', state: 'holstered' }] };
  for (const [component, props] of [[PlayerRow, {}], [ObservedPlayer, {}], [ObservedPlayer, { expanded: true }], [Inventory, { full: true }]]) {
    const html = renderPlayer(component, player, props);
    assert.doesNotMatch(html, /m4a1_silencer|M4A1-S|smokegrenade|weapons\/c4|Unknown weapon|Weapon unavailable|73|99/);
  }
});
test('alive unarmed players leave roster empty and holstered weapons do not replace the observer held weapon', () => {
  const base = fixture('live').snapshot.game.players[0];
  for (const weapons of [[], [{ name: 'weapon_awp', type: 'sniperRifle', state: 'holstered' }]]) {
    const player = { ...base, health: 100, isAlive: true, weapons, activeWeapon: staleCurrentWeapon() };
    for (const component of weapons.length ? [ObservedPlayer] : [PlayerRow, ObservedPlayer]) {
      const html = renderPlayer(component, player);
      assert.doesNotMatch(html, /m4a1_silencer|M4A1-S|weapon-icon|weapons\/awp|Unknown weapon|Weapon unavailable|73|99/);
    }
  }
  const empty = renderPlayer(Inventory, { ...base, health: 100, weapons: [] }, { full: true });
  assert.equal(empty, '');
});
test('actually present unknown weapon keeps its fallback distinct from an absent weapon', () => {
  const base = fixture('live').snapshot.game.players[0];
  for (const state of ['active', 'reloading']) {
    const player = { ...base, health: 100, isAlive: true, weapons: [{ slot: 'primary', type: 'rifle', name: '', kind: 'unknown', state, ammoClip: 73, ammoReserve: 99 }] };
    for (const [component, props] of [[PlayerRow, {}], [ObservedPlayer, {}], [ObservedPlayer, { expanded: true }]]) assert.match(renderPlayer(component, player, props), /Unknown weapon/);
    assert.match(renderPlayer(ObservedPlayer, player), /73/);
  }
});

test('roster shows the carried primary while observer shows the held knife, then falls back after drops', () => {
  const base = fixture('live').snapshot.game.players[0];
  const knife = { name: 'weapon_knife', type: 'knife', state: 'active' };
  const pistol = { name: 'weapon_glock', type: 'pistol', state: 'holstered' };
  const primary = { name: 'weapon_awp', type: 'sniperRifle', state: 'holstered' };
  const player = { ...base, health: 100, weapons: [knife, pistol, primary] };
  assert.match(renderPlayer(PlayerRow, player), /weapons\/awp\.svg/);
  assert.match(renderPlayer(ObservedPlayer, player), /weapons\/knife\.svg/);
  assert.match(renderPlayer(PlayerRow, { ...player, weapons: [knife, pistol] }), /weapons\/glock\.svg/);
  assert.match(renderPlayer(PlayerRow, { ...player, weapons: [knife] }), /weapons\/knife\.svg/);
});
test('missing weapon icon renders no unknown box while real named unknown equipment remains labeled', () => {
  assert.equal(renderToStaticMarkup(createElement(Icon, { weapon: null })), '');
  assert.equal(renderToStaticMarkup(createElement(Icon, {})), '');
  const html = renderToStaticMarkup(createElement(Icon, { weapon: { name: 'weapon_future_blaster', state: 'active' } }));
  assert.match(html, /FUTURE BLASTER|future_blaster/);
});
test('unknown health does not suppress an actual active weapon', () => {
  const player = { ...fixture('live').snapshot.game.players[0], health: null, isAlive: null, weapons: [staleCurrentWeapon()] };
  assert.match(renderPlayer(ObservedPlayer, player), /m4a1_silencer/);
});


test('round results use original clock and hostage SVGs without hand-drawn fallback paths', () => {
  const state = fixture('live');
  state.snapshot = { ...state.snapshot, game: { ...state.snapshot.game, roundNumber: 4, roundWins: [{roundNumber:1,winner:'counterTerrorists',reason:'timeExpired'}, {roundNumber:2,winner:'counterTerrorists',reason:'hostageRescued'}, {roundNumber:3,winner:'terrorists',reason:'unknown'}] } };
  const html = renderToStaticMarkup(createElement(RoundHistory, {state,always:true}));
  assert.match(html,/ui\/clock\.svg/); assert.match(html,/ui\/hostage_rescued\.svg/);
  assert.match(html,/Unknown round result/);assert.doesNotMatch(html,/<svg|<path|<circle/);
});
test('an unknown artwork reference retains text without drawing a replacement symbol', () => {
  const html = renderToStaticMarkup(createElement(Icon, {weapon:{name:null},label:'Unknown weapon'}));
  assert.match(html,/Unknown weapon/);assert.doesNotMatch(html,/<img|<svg|<path/);
});

test('observer reserves empty data cells and does not duplicate an original weapon icon with visible text', () => {
  const base = fixture('live').snapshot.game.players[0];
  const armed = { ...base, health: 100, weapons: [{ name: 'weapon_awp', type: 'sniperRifle', state: 'active', ammoClip: 5, ammoReserve: 30 }] };
  const html = renderPlayer(ObservedPlayer, armed);
  assert.match(html, /alt="AWP"/);
  assert.doesNotMatch(html, />AWP</);
  assert.match(html, /aria-label="5 \/ 30"/);
  for (const weapons of [[], armed.weapons]) {
    const markup = renderPlayer(ObservedPlayer, { ...armed, weapons });
    for (const cell of ['weapon-cell', 'ammo-cell', 'utility-cell']) assert.match(markup, new RegExp(`class="${cell}"`));
  }
});

test('utility renders two flashbang icons without a count label', () => {
  const player = { ...fixture('live').snapshot.game.players[0], health: 100, weapons: [{ name: 'weapon_flashbang', type: 'grenade', ammoReserve: 2 }] };
  for (const full of [false, true]) {
    const html = renderPlayer(Inventory, player, { full });
    assert.equal((html.match(/alt="Flashbang"/g) ?? []).length, 2);
    assert.doesNotMatch(html, /utility-count|>2<|×/);
  }
});

test('killfeed keeps full names, the assister side and meaningful icon order', () => {
  const state = fixture('live');
  const name = 'Complete player name without any abbreviation or ellipsis';
  const entry = { id: 1, connectionId: 'connection', epoch: 1, killer: { name, side: 'counterTerrorists' }, assister: { name: `${name} assist`, side: 'terrorists' }, victim: { name: `${name} victim`, side: 'terrorists' }, weapon: 'weapon_ak47', attackerBlind: true, flashAssist: true, throughSmoke: true, noScope: true, wallbang: true, headshot: true };
  state.snapshot = { ...state.snapshot, game: { ...state.snapshot.game, killFeed: [entry] } };
  const html = renderToStaticMarkup(createElement(KillFeed, { state }));
  assert.match(html, /class="kill-assist t"/);
  assert.ok(html.includes(`${name} assist`));
  assert.ok(html.includes(`${name} victim`));
  assert.deepEqual([...html.matchAll(/alt="([^"]+)"/g)].map(match => match[1]), ['Attacker blind', 'Flash assist', 'AK47', 'Through smoke', 'No scope', 'Wallbang', 'Headshot']);
  state.snapshot.game.killFeed = [{ ...entry, assister: null }];
  assert.doesNotMatch(renderToStaticMarkup(createElement(KillFeed, { state })), /alt="Flash assist"/);
});

test('reference card separates kill/death icons and keeps assists in its accessible statistics', () => {
  const base = fixture('live').snapshot.game.players[0];
  const html = renderPlayer(PlayerRow, { ...base, health: 44, stats: { kills: 8, deaths: 5, assists: 3 } });
  assert.match(html, /ui\/crosshair_circle\.svg/);
  assert.match(html, /killfeed\/icon_suicide\.svg/);
  assert.match(html, /aria-label="Kills \/ deaths \/ assists: 8 \/ 5 \/ 3"/);
  assert.ok(html.indexOf('class="card-loadout"') < html.indexOf('class="meter"'));
});

test('dead reference card removes health and loadout while retaining identity and the large death cue', () => {
  const base = fixture('live').snapshot.game.players[0];
  const html = renderPlayer(PlayerRow, { ...base, health: 0 });
  assert.match(html, /class="card-death"/);
  assert.match(html, /class="card-identity"/);
  assert.doesNotMatch(html, /class="card-health"|class="card-loadout"|class="card-equipment"/);
  assert.match(renderPlayer(PlayerRow, { ...base, health: null, isAlive: null }), /class="card-loadout"/);
});
