import { boltFlashVisible } from './boltobserv.js';

// Boltobserv smokes.js: pop at 100ms, hide at 1200ms, remove at 2200ms.
// One public grenade ID starts one pulse in its session/map/round, without timers.
const validPosition = value => value && ['x', 'y', 'z'].every(axis => Number.isFinite(value[axis]));
const MAX_SEEN = 256, MAX_ACTIVE = 64;
export function createRadarFlashTracker() {
  let context = null;
  const seen = new Set(), active = new Map();
  const clear = () => { context = null; seen.clear(); active.clear(); };
  const read = now => {
    const result = [];
    for (const [id, flash] of active) {
      const elapsed = Math.max(0, now - flash.startedAt);
      if (elapsed >= 2200) { active.delete(id); continue; }
      result.push({ ...flash, phase: elapsed >= 1200 ? 'hide' : elapsed >= 100 ? 'full' : 'pending' });
    }
    return result;
  };
  return {
    clear, read,
    update(snapshot, now) {
      const game = snapshot?.game;
      if (!game || !Number.isFinite(now)) { clear(); return []; }
      const key = JSON.stringify([snapshot.sessionId, game.map, game.roundNumber]);
      if (key !== context) { clear(); context = key; }
      read(now);
      for (const grenade of Array.isArray(game.grenades) ? game.grenades : []) {
        if (!grenade || !boltFlashVisible(grenade) || typeof grenade.id !== 'string' || !grenade.id.length || grenade.id.length > 256 || !validPosition(grenade.position) || seen.has(grenade.id)) continue;
        if (seen.size >= MAX_SEEN) break;
        seen.add(grenade.id);
        if (active.size < MAX_ACTIVE) active.set(grenade.id, { id: grenade.id, position: { ...grenade.position }, startedAt: now });
      }
      return read(now);
    },
  };
}
