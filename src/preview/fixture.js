// Original, synthetic fixtures. Vite removes this entire module from production builds.
import manifest from '../../hud.json' with { type: 'json' };
import { SCENES } from '../model/panel.js';

export function createPreviewClient(mode) {
  const identity = { id: manifest.id, version: manifest.version };
  const player = (side, index) => ({
    steamId: `fixture-${side}-${index}`, name: `Example ${side === 'counterTerrorists' ? 'CT' : 'T'} ${index}`,
    side, observerSlot: side === 'counterTerrorists' ? index : index === 5 ? 0 : index + 5,
    health: index === 5 ? 0 : 100 - (index - 1) * 13, armor: index === 5 ? 0 : 100,
    helmet: index % 2 === 0, defuseKit: side === 'counterTerrorists' && index <= 3,
    money: 1850 + index * 450, equipmentValue: 3450 + index * 120, isAlive: index !== 5,
    flashed: index === 1 ? 120 : 0, smoked: index === 2 ? 64 : 0, burning: index === 3 ? 32 : 0,
    roundKills: index % 3, roundHeadshotKills: index % 2, roundDamage: index * 31,
    stats: { kills: 10 + index, deaths: index + 3, assists: index, mvps: index % 3, score: 30 + index * 2 },
    recordedStats: { rounds: 16, damage: 1200 + index * 75, kills: 10 + index, headshotKills: index + 2,
      averageDamagePerRound: (1200 + index * 75) / 16, headshotPercentage: 100 * (index + 2) / (10 + index), coversWholeMatch: index !== 2 },
    position: { x: (side === 'counterTerrorists' ? -1 : 1) * (100 + index * 80), y: -400 + index * 130, z: 0 },
    forward: { x: side === 'counterTerrorists' ? 1 : -1, y: .4, z: 0 },
    weapons: [
      { slot: 'primary', name: side === 'counterTerrorists' ? 'weapon_m4a1_silencer' : 'weapon_ak47', kind: side === 'counterTerrorists' ? 'm4A1S' : 'ak47', type: 'rifle', state: index === 2 ? 'reloading' : 'active', ammoClip: 21, ammoReserve: 60 },
      { slot: 'secondary', name: 'weapon_p250', kind: 'p250', type: 'pistol', state: 'holstered', ammoClip: 13, ammoReserve: 26 },
      { slot: 'grenade', name: 'weapon_smokegrenade', kind: 'smokeGrenade', type: 'grenade', state: 'holstered', ammoClip: null, ammoReserve: null },
      { slot: 'flash', name: 'weapon_flashbang', kind: 'flashbang', type: 'grenade', state: 'holstered', ammoClip: null, ammoReserve: null },
      ...(side === 'terrorists' && index === 1 && mode !== 'bomb' ? [{ slot: 'bomb', name: 'weapon_c4', kind: 'c4', type: 'bomb', state: 'holstered' }] : []),
    ],
  });
  const players = ['counterTerrorists', 'terrorists'].flatMap(side => Array.from({ length: 5 }, (_, i) => player(side, i + 1)));
  const teamA = { id: 'example-a', name: 'EXAMPLE ALPHA', shortName: 'ALPHA', seriesWins: mode === 'postmatch' ? 2 : 1, logo: '/cast-media/example-a.png' };
  const teamB = { id: 'example-b', name: 'EXAMPLE BRAVO', shortName: 'BRAVO', seriesWins: 0, logo: '/cast-media/example-b.png' };
  const managedMatch = {
    id: 'example-match', name: 'Synthetic example match', bestOf: 3, startsAt: new Date(Date.now() + 90_000).toISOString(), teamA, teamB,
    ct: { side: 'counterTerrorists', status: mode === 'unresolved' ? 'conflicting' : 'manual', teamId: teamB.id },
    t: { side: 'terrorists', status: mode === 'unresolved' ? 'unknown' : 'recognized', teamId: teamA.id },
    maps: [
      { id: 'map-1', name: 'Mirage', gameName: 'de_mirage', number: 1, status: 'completed', scoreA: 13, scoreB: 8, winnerTeamId: teamA.id },
      { id: 'map-2', name: 'Ancient', gameName: 'de_ancient', number: 2, status: mode === 'postmatch' ? 'completed' : 'live', scoreA: mode === 'postmatch' ? 13 : null, scoreB: mode === 'postmatch' ? 11 : null, winnerTeamId: mode === 'postmatch' ? teamA.id : null },
      { id: 'map-3', name: 'Nuke', gameName: 'de_nuke', number: 3, status: 'pending', scoreA: null, scoreB: null, winnerTeamId: null },
    ],
    vetos: [
      { mapId: 'train', name: 'Train', type: 'ban', teamId: teamA.id, number: 1, playNumber: null },
      { mapId: 'dust2', name: 'Dust II', type: 'ban', teamId: teamB.id, number: 2, playNumber: null },
      { mapId: 'map-1', name: 'Mirage', type: 'pick', teamId: teamA.id, number: 3, playNumber: 1 },
      { mapId: 'map-2', name: 'Ancient', type: 'pick', teamId: teamB.id, number: 4, playNumber: 2 },
      { mapId: 'inferno', name: 'Inferno', type: 'ban', teamId: teamA.id, number: 5, playNumber: null },
      { mapId: 'overpass', name: 'Overpass', type: 'unknown', teamId: null, number: 6, playNumber: null },
      { mapId: 'map-3', name: 'Nuke', type: 'decider', teamId: null, number: 7, playNumber: 3 },
    ],
    competition: { id: 'example-event', name: 'EXAMPLE CHAMPIONSHIP', seasonName: 'Season 2026', sections: [{ name: 'Finals' }], round: 'Grand final', logo: '/cast-media/event.png', sponsors: [{ id: 'sponsor-1', name: 'Example event partner', image: '/cast-media/sponsor.png' }] },
  };
  const participant = p => ({ steamId: p.steamId, name: p.name, side: p.side, entityIndex: p.observerSlot });
  const game = {
    map: mode === 'dust2' ? 'de_dust2' : 'de_ancient', roundNumber: 20, phase: mode === 'postmatch' ? 'gameOver' : 'live', roundPhase: 'live', availableSections: ['allPlayers', 'map', 'bomb', 'grenades'],
    ct: { name: null, score: 11, timeoutsRemaining: 2 }, t: { name: null, score: 8, timeoutsRemaining: 1 },
    players, observedPlayer: players[1], countdown: { phase: mode === 'break' ? 'paused' : 'live', secondsRemaining: 83.3 },
    bomb: { state: mode === 'bomb' ? 'planted' : 'dropped', position: { x: 0, y: 0, z: 0 }, secondsRemaining: mode === 'bomb' ? 32.8 : null },
    grenades: [{ id: 'smoke-example', type: 'smoke', position: { x: 100, y: 200, z: 0 } }, { id: 'fire-example', type: 'inferno', position: null, flames: [{ id: 'f1', position: { x: -120, y: 200, z: 0 } }, { id: 'f2', position: { x: -150, y: 240, z: 0 } }] }],
    roundWins: Array.from({ length: 19 }, (_, i) => ({ roundNumber: i + 1, winner: i % 2 ? 'counterTerrorists' : 'terrorists', reason: ['elimination', 'bombDefused', 'bombExploded', 'timeExpired'][i % 4] })),
    killFeed: [
      { id: 1, connectionId: 'example-hlae', epoch: 1, gameTimeSeconds: 100, killer: participant(players[0]), victim: participant(players[5]), assister: participant(players[1]), weapon: 'weapon_m4a1', headshot: true, wallbang: true, throughSmoke: true, noScope: false, attackerBlind: true, flashAssist: true },
      { id: 2, connectionId: 'example-hlae', epoch: 1, gameTimeSeconds: 101, killer: participant(players[7]), victim: participant(players[3]), assister: null, weapon: 'weapon_awp', headshot: false, wallbang: false, throughSmoke: false, noScope: true, attackerBlind: false, flashAssist: false },
      { id: 3, connectionId: 'example-hlae', epoch: 1, gameTimeSeconds: 102, killer: null, victim: participant(players[4]), assister: null, weapon: 'world', headshot: false, wallbang: false, throughSmoke: false, noScope: false, attackerBlind: false, flashAssist: false },
    ],
  };
  const options = {
    match: { left: { ...teamB, steamIds: players.slice(0, 5).map(p => p.steamId) }, right: { ...teamA, steamIds: players.slice(5).map(p => p.steamId) } },
    players: Object.fromEntries(players.map(p => [p.steamId, { name: p.name, avatar: `/cast-media/${p.steamId}.png`, camera: 'https://invalid.example/camera-not-embedded' }])),
  };
  const values = {
    display: { caption: 'sOU BASIC · PREVIEW', hideRosters: false, hideObservedPlayer: false },
    production: { subtitle: 'Synthetic broadcast fixture', ticker: 'LOCAL SYNTHETIC PREVIEW · Public SDK 0.2.0-preview.4', replayLabel: mode === 'bomb' ? 'REPLAY · MANUAL LABEL' : '', lowerTitle: 'Example analyst', lowerSubtitle: 'Operator-triggered lower third' },
    feature: { player: players[1].steamId, team: teamB.id, match: managedMatch.id, headline: 'PLAYER SPOTLIGHT', subline: 'Operator-selected player · synthetic data' },
    branding: { logo: '/cast-media/brand.png', sponsors: ['/cast-media/partner.png'] },
    radar: {},
  };
  const references = { feature: { player: { id: players[1].steamId, name: players[1].name, image: `/cast-media/${players[1].steamId}.png`, teamId: teamB.id, missing: false }, team: { id: teamB.id, name: teamB.name, image: teamB.logo, missing: false }, match: { id: managedMatch.id, name: managedMatch.name, missing: false } } };
  let revision = 0;
  function snapshot() {
    const freshGame = mode === 'missing' ? { map: null, players: [{ steamId: null, side: 'counterTerrorists', health: null }], observedPlayer: null } : {
      ...game, radar: { connectionId: 'example-hlae', epoch: 1, sequence: revision, gameTimeSeconds: 100 + revision / 4, receivedAt: new Date().toISOString(), players: players.map(p => ({ steamId: p.steamId, health: p.health, position: p.position, forward: p.forward })) },
    };
    return { schemaVersion: 2, sessionId: 'local-preview', revision: ++revision, receivedAt: new Date().toISOString(),
      freshness: ['waiting', 'prematch', 'lineups'].includes(mode) ? 'waiting' : mode === 'stale' ? 'stale' : 'live',
      managedMatch: mode === 'missing' ? null : managedMatch, game: ['waiting', 'prematch', 'lineups'].includes(mode) ? null : freshGame };
  }
  return {
    preview: true, previewScene: SCENES.includes(mode) ? mode : 'live', identity, options,
    media(path) {
      if (typeof path !== 'string' || !path.startsWith('/cast-media/')) return null;
      const shade = path.includes('example-a') ? '#9b6c3f' : '#355b83';
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="${shade}"/><circle cx="80" cy="58" r="25" fill="#b8d1e5"/><path d="M32 150Q32 90 80 90Q128 90 128 150Z" fill="#8aaac4"/><text x="80" y="152" text-anchor="middle" fill="white" font-size="11">SYNTHETIC EXAMPLE</text></svg>`)}`;
    },
    watch(receive, { signal, status }) {
      if (signal.aborted) return () => {};
      status('live', 'connected'); receive(snapshot());
      const timer = setInterval(() => { if (!signal.aborted) receive(snapshot()); }, 250);
      timer.unref?.();
      const stop = () => { clearInterval(timer); signal.removeEventListener('abort', stop); };
      signal.addEventListener('abort', stop, { once: true });
      return stop;
    },
    watchPanel(receive, { signal, status }) {
      if (!signal.aborted) {
        status('panel', 'connected'); receive({ hudId: identity.id, version: identity.version, state: { revision: 0, values, references } });
        if (mode === 'spotlight') receive({ hudId: identity.id, version: identity.version, action: { id: '11111111-2222-3333-4444-555555555555', section: 'production', name: 'lowerThird', value: 'show' } });
      }
      return () => {};
    },
  };
}
