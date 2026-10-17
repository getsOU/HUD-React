import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptOptions, metadataKey, readOptionsResponse, startMetadataPolling } from '../src/model/metadata.js';
import { panelSettings, sceneFor, SCENES } from '../src/model/panel.js';
import { aliveSummary, economy, killEntries, playerCoverage, radarView, seriesWinner, teamLineup, vetoEntries } from '../src/model/showcase.js';
import { createHudStore } from '../src/hud-store.js';

const snapshot = (sessionId = 'session-1') => ({
  sessionId,
  managedMatch: { id: 'match-1', teamA: { id: 'alpha' }, teamB: { id: 'bravo' } },
  game: { players: [{ steamId: 'live-player' }] },
});
const options = () => ({
  match: {
    left: { id: 'bravo', name: 'Bravo', steamIds: ['bravo-1', 'bravo-1'] },
    right: { id: 'alpha', name: 'Alpha', steamIds: ['alpha-1'] },
  },
  players: {
    'alpha-1': { name: 'Alpha player', avatar: '/cast-media/alpha.png' },
    'bravo-1': { name: 'Bravo player' },
    'live-player': { name: 'Observed public player' },
    'unrelated-player': { name: 'Must not leak into this match' },
  },
});

test('all eight views resolve beneath the package root independently of the main scene', () => {
  const base = 'http://127.0.0.1:5085/hud-packages/sou-basic-react/0.2.0/';
  assert.equal(SCENES.length, 8);
  for (const scene of SCENES.filter(value => value !== 'live')) {
    assert.equal(sceneFor(`${base}views/${scene}?output=1`, 'break'), scene);
    assert.equal(sceneFor(`${base}views/${scene}/`, 'live'), scene);
  }
  assert.equal(sceneFor(`${base}index.html`, 'statistics'), 'statistics');
  assert.equal(sceneFor(base, ''), 'live');
  assert.equal(sceneFor(base, 'unsupported'), 'live');
});

test('host-initialized false checkbox values keep every display component visible', () => {
  const names = ['Rosters', 'ObservedPlayer', 'Radar', 'Killfeed', 'Economy', 'RoundHistory', 'Series', 'Sponsors'];
  const display = Object.fromEntries(names.map(name => [`hide${name}`, false]));
  const before = panelSettings({ values: { display } });
  const after = panelSettings({ values: { display: { ...display, caption: 'Only text changed' } } });
  for (const name of names) {
    assert.equal(before[`show${name}`], true);
    assert.equal(after[`show${name}`], true);
    const hidden = panelSettings({ values: { display: { ...display, [`hide${name}`]: true } } });
    assert.equal(hidden[`show${name}`], false);
    for (const other of names.filter(value => value !== name)) assert.equal(hidden[`show${other}`], true);
  }
});

test('panel settings retain resolved public references instead of guessing identity from IDs', () => {
  const player = { id: 'player-id', name: 'Public player', image: null, teamId: 'team-id', missing: false };
  const team = { id: 'team-id', name: 'Public team', image: null, teamId: null, missing: false };
  const match = { id: 'match-id', name: 'Public match', image: null, teamId: null, missing: false };
  const result = panelSettings({
    values: { feature: { player: 'player-id', team: 'team-id', match: 'match-id' } },
    references: { feature: { player, team, match } },
  });
  assert.equal(result.feature.player, player);
  assert.equal(result.feature.team, team);
  assert.equal(result.feature.match, match);
  assert.equal(panelSettings({ values: { feature: { player: 'unresolved-id' } } }).feature.player, null);
});

test('optional metadata matches stable team IDs even after a side swap and excludes unrelated profiles', () => {
  const result = adaptOptions(options(), snapshot(), 1234);
  assert.equal(result.key, metadataKey(snapshot()));
  assert.equal(result.receivedAt, 1234);
  assert.deepEqual(result.teams.bravo.steamIds, ['bravo-1']);
  assert.equal(result.players['alpha-1'].avatar, '/cast-media/alpha.png');
  assert.equal(result.players['live-player'].name, 'Observed public player');
  assert.equal(result.players['unrelated-player'], undefined);
  assert.notEqual(metadataKey(snapshot()), metadataKey(snapshot('session-2')));
});

test('a partial, duplicate or foreign team match cannot introduce prematch roster data', () => {
  const foreign = options();
  foreign.match.left.id = 'another-team';
  assert.equal(adaptOptions(foreign, snapshot()), null);
  const duplicate = options();
  duplicate.match.left.id = duplicate.match.right.id;
  assert.equal(adaptOptions(duplicate, snapshot()), null);
  assert.equal(adaptOptions({ players: options().players }, snapshot()), null);
  assert.equal(adaptOptions(options(), { sessionId: 'no-match', game: null }), null);
});

test('a player cannot be assigned to both optional metadata lineups', () => {
  const conflicting = options();
  conflicting.match.left.steamIds.push('alpha-1');
  assert.equal(adaptOptions(conflicting, snapshot()), null);
  const reversed = options();
  reversed.match.right.steamIds.push('bravo-1');
  assert.equal(adaptOptions(reversed, snapshot()), null);
  assert.deepEqual(adaptOptions(options(), snapshot()).teams.bravo.steamIds, ['bravo-1']);
});

test('the optional metadata reader enforces streamed size limits without a content-length header', async () => {
  const valid = new Response(JSON.stringify({ players: {} }));
  assert.deepEqual(await readOptionsResponse(valid, 100), { players: {} });
  const oversized = new Response('x'.repeat(101));
  await assert.rejects(readOptionsResponse(oversized, 100), /size limit/);
  await assert.rejects(readOptionsResponse(new Response('{}', { status: 503 })), /unavailable/);
  await assert.rejects(readOptionsResponse(new Response('not json')), SyntaxError);
});

test('metadata polling does not publish a previous match response', async () => {
  const lifetime = new AbortController();
  let current = snapshot();
  let finish;
  let started;
  const requestStarted = new Promise(resolve => { started = resolve; });
  const responses = [];
  const stop = startMetadataPolling({
    address: 'http://127.0.0.1:5085/hud-packages/sou-basic-react/0.2.0/index.html',
    signal: lifetime.signal,
    snapshot: () => current,
    receive: value => responses.push(value),
    intervalMs: 1000,
    fetchImpl: (address, init) => {
      assert.equal(address, 'http://127.0.0.1:5085/hud-browser/options');
      assert.equal(init.credentials, 'same-origin');
      started();
      return new Promise(resolve => { finish = resolve; });
    },
  });
  await requestStarted;
  current = snapshot('session-2');
  finish(new Response(JSON.stringify(options())));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(responses, []);
  lifetime.abort();
  stop();
});

test('disposing optional metadata polling aborts its pending request without reporting a live failure', async () => {
  const lifetime = new AbortController();
  const responses = [];
  let requestSignal;
  const stop = startMetadataPolling({
    address: 'http://127.0.0.1:5085/', signal: lifetime.signal,
    snapshot, receive: value => responses.push(value),
    fetchImpl: (_address, init) => {
      requestSignal = init.signal;
      return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    },
  });
  lifetime.abort();
  await new Promise(resolve => setImmediate(resolve));
  stop();
  assert.equal(requestSignal.aborted, true);
  assert.deepEqual(responses, []);
});

test('a partial team never acquires an apparently complete economy or alive total', () => {
  const source = { game: { availableSections: ['allPlayers'], players: [
    { steamId: 'a', side: 'counterTerrorists', health: 0, money: 0, equipmentValue: 0 },
    { steamId: 'b', side: 'counterTerrorists', health: null, money: null, equipmentValue: null },
  ] } };
  assert.deepEqual(aliveSummary(source, 'counterTerrorists'), { alive: 0, known: 1, total: 2, complete: false });
  const totals = economy(source, 'counterTerrorists');
  assert.deepEqual(totals.cash, { value: 0, known: 1, total: 2, complete: false });
  assert.equal(totals.equipment.complete, false);
  assert.equal(economy({ game: { players: [] } }, 'terrorists').cash.value, null);
  source.game.players[1] = { ...source.game.players[1], health: 100, money: 800, equipmentValue: 2000 };
  assert.equal(economy(source, 'counterTerrorists').cash.complete, true);
  source.game.availableSections = [];
  assert.equal(economy(source, 'counterTerrorists').cash.complete, false);
});

test('recorded statistics expose partial coverage and never synthesize ADR or headshots', () => {
  assert.deepEqual(playerCoverage({ stats: { kills: 20 } }), { adr: null, hs: null, label: 'No recorded rounds' });
  const partial = playerCoverage({ recordedStats: { rounds: 4, averageDamagePerRound: 0, headshotPercentage: 0, coversWholeMatch: false } });
  assert.equal(partial.adr, 0);
  assert.equal(partial.hs, 0);
  assert.match(partial.label, /4 recorded rounds.*partial coverage/);
  assert.match(playerCoverage({ recordedStats: { rounds: 20, coversWholeMatch: true } }).label, /whole match covered/);
});

test('lineups require a current matching metadata key and do not manufacture missing roster slots', () => {
  const source = snapshot();
  const metadata = adaptOptions(options(), source);
  assert.deepEqual(teamLineup(source, metadata, 'alpha').map(row => row.steamId), ['alpha-1']);
  assert.deepEqual(teamLineup(source, metadata, 'foreign-team'), []);
  assert.deepEqual(teamLineup(snapshot('new-session'), metadata, 'alpha'), []);
});

test('veto decisions retain unresolved team IDs instead of assigning by order', () => {
  const source = snapshot();
  source.managedMatch.vetos = [
    { number: 2, type: 'pick', map: 'de_nuke', teamId: 'foreign-team' },
    { number: 1, type: 'ban', map: 'de_mirage', teamId: 'alpha' },
  ];
  const entries = vetoEntries(source);
  assert.equal(entries[0].team.id, 'alpha');
  assert.equal(entries[1].team, null);
  assert.equal(entries[1].teamId, 'foreign-team');
});

test('series winners need complete compatible results and tolerate missing team data', () => {
  const source = snapshot();
  source.managedMatch.bestOf = 3;
  source.managedMatch.teamA.seriesWins = 2;
  source.managedMatch.teamB.seriesWins = 0;
  source.managedMatch.maps = [
    { id: 'map-1', number: 1, status: 'completed', winnerTeamId: 'alpha' },
    { id: 'map-2', number: 2, status: 'completed', winnerTeamId: 'alpha' },
  ];
  assert.equal(seriesWinner(source).id, 'alpha');
  source.managedMatch.maps[1].winnerTeamId = null;
  assert.equal(seriesWinner(source), null);
  source.managedMatch.maps[1].winnerTeamId = 'alpha';
  source.managedMatch.teamA.seriesWins = 1;
  assert.equal(seriesWinner(source), null);
  assert.equal(seriesWinner({ managedMatch: { bestOf: 3, maps: [] } }), null);
  assert.equal(seriesWinner(null), null);
});

const radarSnapshot = () => ({
  sessionId: 'radar-session',
  game: { map: 'de_example', players: [
    { steamId: 'player-1', side: 'counterTerrorists', health: 100, position: { x: -50, y: 25, z: 0 } },
  ], radar: {
    connectionId: 'hlae-1', epoch: 2, sequence: 3, gameTimeSeconds: 100, receivedAt: '2026-10-17T12:00:00.000Z',
    players: [{ steamId: 'player-1', health: 100, position: { x: 50, y: -25, z: 0 }, forward: { x: 1, y: 0, z: 0 } }],
  } },
});
const radarTime = Date.parse('2026-10-17T12:00:00.500Z');
const radarConfig = { overview: '/cast-media/overview.png', mapName: 'de_example', minX: '-100', maxX: '100', minY: '-50', maxY: '50' };

test('a calibrated radar uses exact world bounds, Y inversion and only a matching map', () => {
  const view = radarView(radarSnapshot(), radarConfig, radarTime);
  assert.equal(view.calibrated, true);
  assert.equal(view.source, 'HLAE · fresh');
  assert.equal(view.players[0].x, 75);
  assert.equal(view.players[0].y, 75);
  assert.ok(Math.abs(view.players[0].direction) < 0.0001);
  for (const bad of [{ ...radarConfig, mapName: 'de_other' }, { ...radarConfig, minX: '' }, { ...radarConfig, maxX: '-100' }, { ...radarConfig, minY: 'NaN' }]) {
    assert.equal(radarView(radarSnapshot(), bad, radarTime).calibrated, false);
  }
});

test('stale, future or rejected HLAE timelines fall back to actual GSI positions', () => {
  for (const [at, accepted] of [[radarTime + 251, true], [radarTime - 501, true], [radarTime, false]]) {
    const view = radarView(radarSnapshot(), radarConfig, at, accepted);
    assert.equal(view.source, 'GSI');
    assert.equal(view.players[0].x, 25);
    assert.equal(view.players[0].y, 25);
  }
});

test('fresh HLAE health overrides old GSI death state and expires with the radar frame', () => {
  const source = radarSnapshot();
  source.game.players[0].health = 0;
  source.game.radar.players[0].health = 100;
  assert.equal(radarView(source, radarConfig, radarTime).players[0].dead, false);
  assert.equal(radarView(source, radarConfig, radarTime + 251).players[0].dead, true);
  source.game.players[0].health = 100;
  source.game.radar.players[0].health = 0;
  assert.equal(radarView(source, radarConfig, radarTime).players[0].dead, true);
  source.game.radar.players[0].health = null;
  assert.equal(radarView(source, radarConfig, radarTime).players[0].dead, false);
});

test('invalid HLAE timeline metadata cannot replace a valid GSI position', () => {
  const invalid = [
    { epoch: null }, { epoch: -1 }, { epoch: 1.5 },
    { sequence: null }, { sequence: -1 }, { sequence: Infinity },
    { gameTimeSeconds: undefined }, { gameTimeSeconds: NaN }, { gameTimeSeconds: Infinity }, { gameTimeSeconds: '100' },
  ];
  for (const patch of invalid) {
    const source = radarSnapshot();
    Object.assign(source.game.radar, patch);
    const view = radarView(source, radarConfig, radarTime);
    assert.equal(view.source, 'GSI', `Invalid timeline accepted: ${JSON.stringify(patch)}`);
    assert.equal(view.players[0].x, 25);
    assert.equal(view.players[0].y, 25);
  }
});

test('radar drops out-of-bounds positions instead of clamping them into false map locations', () => {
  const source = radarSnapshot();
  source.game.radar.players[0].position.x = 101;
  assert.deepEqual(radarView(source, radarConfig, radarTime).players, []);
  source.game.players = [];
  source.game.radar = null;
  assert.deepEqual(radarView(source, {}, radarTime).players, []);
  assert.match(radarView(source, {}, radarTime).label, /Map unavailable.*relative positions/);
});

test('missing Steam IDs cannot join an unrelated HLAE pose onto an unidentified GSI player', () => {
  const source = radarSnapshot();
  source.game.players[0].steamId = null;
  source.game.radar.players[0].steamId = null;
  const view = radarView(source, radarConfig, radarTime);
  assert.equal(view.players[0].x, 25);
  assert.equal(view.players[0].y, 25);
});

test('reported fire positions remain renderable when an inferno has no single center position', () => {
  const source = radarSnapshot();
  source.game.players = [];
  source.game.radar = null;
  source.game.grenades = [{ id: 'inferno-1', type: 'inferno', position: null,
    flames: [{ id: 'flame-1', position: { x: 100000, y: -50000, z: 0 } }],
  }];
  const relative = radarView(source, {}, radarTime);
  assert.equal(relative.flames.length, 1);
  assert.equal(relative.flames[0].x, 50);
  assert.equal(relative.flames[0].y, 50);
  source.game.grenades[0].flames[0].position = { x: 0, y: 0, z: 0 };
  const calibrated = radarView(source, radarConfig, radarTime);
  assert.equal(calibrated.flames.length, 1);
  assert.equal(calibrated.flames[0].x, 50);
  assert.equal(calibrated.flames[0].y, 50);
});

test('killfeed event identity includes its connection and epoch while retaining all source flags', () => {
  const event = { id: 1, connectionId: 'hlae-1', epoch: 1, weapon: 'awp', headshot: true,
    wallbang: true, attackerBlind: true, throughSmoke: true, noScope: true, flashAssist: true };
  const source = { sessionId: 'session-1', game: { killFeed: [
    event, { ...event }, { ...event, epoch: 2 }, { ...event, connectionId: 'hlae-2' },
  ] } };
  const entries = killEntries(source);
  assert.equal(entries.length, 3);
  assert.equal(new Set(entries.map(entry => entry.key)).size, 3);
  for (const flag of ['headshot', 'wallbang', 'attackerBlind', 'throughSmoke', 'noScope', 'flashAssist']) assert.equal(entries[0][flag], true);
  const previous = entries[0].key;
  source.sessionId = 'session-2';
  assert.notEqual(killEntries(source)[0].key, previous);
});

test('lower-third actions are identity-bound, deduplicated and hidden by reconnects and new sessions', async () => {
  const streams = {};
  const identity = { id: 'sou-basic-react', version: '0.2.0' };
  const store = createHudStore(() => ({
    identity,
    watch(receive, options) { streams.live = { receive, ...options }; },
    watchPanel(receive, options) { streams.panel = { receive, ...options }; },
  }));
  const unsubscribe = store.subscribe(() => {});
  await new Promise(resolve => setImmediate(resolve));
  const live = sessionId => streams.live.receive({ schemaVersion: 2, sessionId, revision: 1, freshness: 'live', game: null });
  const action = (serial, value, target = identity) => streams.panel.receive({
    hudId: target.id, version: target.version,
    action: { id: `00000000-0000-0000-0000-${String(serial).padStart(12, '0')}`, section: 'production', name: 'lowerThird', value },
  });
  live('first-session');
  streams.panel.receive({ hudId: identity.id, version: identity.version, state: {
    revision: 1, values: { display: { caption: 'Persistent caption' }, production: { lowerTitle: 'Operator title' } }, references: {},
  } });
  action(1, 'show');
  assert.equal(store.getSnapshot().lowerThirdVisible, true);
  action(2, 'hide');
  action(1, 'show');
  assert.equal(store.getSnapshot().lowerThirdVisible, false);
  action(3, 'invalid');
  action(3, 'show', { id: 'different-hud', version: '0.2.0' });
  assert.equal(store.getSnapshot().lowerThirdVisible, false);
  action(3, 'show');
  assert.equal(store.getSnapshot().lowerThirdVisible, true);
  streams.panel.status('panel', 'reconnecting');
  action(3, 'show');
  assert.equal(store.getSnapshot().lowerThirdVisible, false);
  action(4, 'show');
  assert.equal(store.getSnapshot().lowerThirdVisible, true);
  live('second-session');
  action(4, 'show');
  assert.equal(store.getSnapshot().lowerThirdVisible, false);
  assert.equal(store.getSnapshot().settings.caption, 'Persistent caption');
  assert.equal(store.getSnapshot().settings.production.lowerTitle, 'Operator title');
  unsubscribe();
  action(5, 'show');
  assert.equal(store.getSnapshot().lowerThirdVisible, false);
});

test('equal panel revisions refresh references, stale revisions are rejected and reconnect permits a restarted revision', async () => {
  let receivePanel, panelStatus;
  const identity = { id: 'sou-basic-react', version: '0.2.0' };
  const store = createHudStore(() => ({
    identity,
    watch() {},
    watchPanel(receive, options) { receivePanel = receive; panelStatus = options.status; },
  }));
  const unsubscribe = store.subscribe(() => {});
  try {
    await new Promise(resolve => setImmediate(resolve));
    const panel = (revision, name, caption) => receivePanel({
      hudId: identity.id, version: identity.version, state: {
        revision, values: { display: { caption }, feature: { player: 'player-id' } },
        references: { feature: { player: { id: 'player-id', name, image: null, teamId: null, missing: false } } },
      },
    });
    panel(5, 'Initial name', 'Current caption');
    panel(5, 'Updated profile name', 'Current caption');
    assert.equal(store.getSnapshot().settings.feature.player.name, 'Updated profile name');
    panel(4, 'Stale profile name', 'Stale caption');
    assert.equal(store.getSnapshot().settings.feature.player.name, 'Updated profile name');
    assert.equal(store.getSnapshot().settings.caption, 'Current caption');
    panelStatus('panel', 'reconnecting');
    panelStatus('panel', 'connected');
    panel(1, 'Profile after restart', 'Restored caption');
    assert.equal(store.getSnapshot().settings.feature.player.name, 'Profile after restart');
    assert.equal(store.getSnapshot().settings.caption, 'Restored caption');
  } finally { unsubscribe(); }
});

test('case variants of one action GUID do not trigger a second lower third', async () => {
  let receivePanel;
  const identity = { id: 'sou-basic-react', version: '0.2.0' };
  const store = createHudStore(() => ({
    identity, watch() {},
    watchPanel(receive) { receivePanel = receive; },
  }));
  const unsubscribe = store.subscribe(() => {});
  try {
    await new Promise(resolve => setImmediate(resolve));
    const action = (id, value) => receivePanel({ hudId: identity.id, version: identity.version,
      action: { id, section: 'production', name: 'lowerThird', value },
    });
    const firstId = 'abcdef01-2345-6789-abcd-0123456789ab';
    action(firstId, 'show');
    assert.equal(store.getSnapshot().lowerThirdVisible, true);
    action('fedcba98-7654-3210-fedc-ba9876543210', 'hide');
    assert.equal(store.getSnapshot().lowerThirdVisible, false);
    action(firstId.toUpperCase(), 'show');
    assert.equal(store.getSnapshot().lowerThirdVisible, false);
  } finally { unsubscribe(); }
});
