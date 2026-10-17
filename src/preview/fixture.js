// Synthetic and local-only. This module is removed from production by Vite.
export function createPreviewClient(mode) {
  const player = (side, index) => ({
    steamId: `fixture-${side}-${index}`, name: `Example ${side === 'counterTerrorists' ? 'CT' : 'T'} ${index}`,
    side, observerSlot: side === 'counterTerrorists' ? index : index === 5 ? 0 : index + 5,
    health: index === 5 ? 0 : 100 - (index - 1) * 13, armor: index === 5 ? 0 : 100,
    money: 1850 + index * 450, isAlive: index !== 5,
    stats: { kills: 10 + index, deaths: index + 3, assists: index },
    weapons: [{ name: side === 'counterTerrorists' ? 'weapon_m4a1_silencer' : 'weapon_ak47', state: 'active', ammoClip: 21, ammoReserve: 60 }],
  });
  const players = ['counterTerrorists', 'terrorists'].flatMap(side => Array.from({ length: 5 }, (_, i) => player(side, i + 1)));
  const managedMatch = {
    id: 'example-match', name: 'Synthetic example', bestOf: 3,
    teamA: { id: 'example-a', name: 'EXAMPLE ALPHA', shortName: 'ALPHA', seriesWins: 0 },
    teamB: { id: 'example-b', name: 'EXAMPLE BRAVO', shortName: 'BRAVO', seriesWins: 1 },
    ct: { side: 'counterTerrorists', status: mode === 'unresolved' ? 'conflicting' : 'manual', teamId: 'example-b' },
    t: { side: 'terrorists', status: mode === 'unresolved' ? 'unknown' : 'recognized', teamId: 'example-a' },
  };
  const snapshot = {
    schemaVersion: 2, sessionId: 'local-preview', revision: 1, freshness: mode === 'waiting' ? 'waiting' : 'live',
    receivedAt: null, managedMatch,
    game: mode === 'waiting' ? null : {
      map: 'de_mirage', roundNumber: 20, phase: 'live', roundPhase: 'live',
      ct: { name: null, score: 11 }, t: { name: null, score: 8 },
      players, observedPlayer: players[1], countdown: { phase: 'live', secondsRemaining: 83.3 },
      bomb: mode === 'bomb' ? { state: 'planted', secondsRemaining: 32.8 } : null,
    },
  };
  return {
    preview: true, identity: { id: 'sou-basic-react', version: '0.1.0' },
    watch(receive, { signal, status }) {
      if (!signal.aborted) { status('live', 'connected'); receive(snapshot); }
    },
    watchPanel(receive, { signal, status }) {
      if (!signal.aborted) {
        status('panel', 'connected');
        receive({ hudId: 'sou-basic-react', version: '0.1.0', state: { values: { display: { caption: 'sOU BASIC · PREVIEW' } } } });
      }
    },
  };
}
