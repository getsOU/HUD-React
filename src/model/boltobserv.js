// Ported from boltgolt/boltobserv 0320883198e438cd6ae9fd490fa310027003727e.
// Original projection, split bounds and marker scale; GPL-3.0-only. See licenses/BOLTOBSERV-NOTICE.md.
export function boltPoint(position, metadata) {
  const span = metadata.resolution * 1024;
  const split = metadata.splits.find(split => position.z > split.bounds.bottom && position.z < split.bounds.top);
  return { x: (position.x + metadata.offset.x) / span * 100 + (split?.offset.x ?? 0),
    y: 100 - ((position.y + metadata.offset.y) / span * 100 + (split?.offset.y ?? 0)) };
}

export function boltMarkerScale(z, metadata) {
  if (!Number.isFinite(z)) return .7;
  const range = metadata.splits.find(split => z > split.bounds.bottom && z < split.bounds.top)?.zRange ?? metadata.zRange;
  if (!Number.isFinite(range?.min) || !Number.isFinite(range?.max) || range.max <= range.min) return .7;
  const height = Math.max(0, Math.min(1, (z - range.min) / (range.max - range.min)));
  return .7 * ((height - .5) / 2 + 1);
}

export const boltBuyzonesVisible = game => game?.roundPhase === 'freezeTime' || game?.countdown?.phase === 'freezeTime' || game?.phase === 'warmup' || game?.countdown?.phase === 'warmup';

export function boltProjectileImage(type, side) {
  const projectile = ({ smoke: 'smoke', flashbang: 'flashbang', highExplosive: 'frag', molotov: 'firebomb', incendiary: 'firebomb', firebomb: 'firebomb' })[type];
  const team = side === 'counterTerrorists' ? 'CT' : side === 'terrorists' ? 'T' : null;
  return projectile && team ? `assets/boltobserv/img/projectile-img-${projectile}-${team}.webp` : null;
}

// src/gsi.js distinguishes smoke effecttime from flash lifetime; zero smoke time is flight.
export const boltSmokeVisible = grenade => grenade.type === 'smoke' && Number.isFinite(grenade.effectTimeSeconds) && grenade.effectTimeSeconds > 0;
export const boltFlashVisible = grenade => grenade.type === 'flashbang' && Number.isFinite(grenade.lifetimeSeconds) && grenade.lifetimeSeconds >= 1.4;
export function boltProjectileVisible(grenade) {
  if (['inferno', 'decoy'].includes(grenade.type) || boltSmokeVisible(grenade) || boltFlashVisible(grenade)) return false;
  // An explicitly stationary original projectile is hidden. Missing velocity is not zero.
  return !(['x', 'y', 'z'].every(axis => Number.isFinite(grenade.velocity?.[axis])) && ['x', 'y', 'z'].every(axis => grenade.velocity[axis] === 0));
}

export const boltBombVisible = bomb => Boolean(bomb && !['carried', 'exploded', 'unknown'].includes(bomb.state) && bomb.state != null);
