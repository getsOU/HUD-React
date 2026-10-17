/** @typedef {import('../public/sdk/contracts').LiveSnapshot} LiveSnapshot */
/** @typedef {import('../public/sdk/contracts').PlayerState} PlayerState */
/** @typedef {import('../public/sdk/contracts').TeamSide} TeamSide */

export const EMPTY = '–';
export { panelSettings, sceneFor, SCENES } from './model/panel.js';
const phases = Object.freeze({
  warmup: 'WARMUP', freezeTime: 'FREEZE TIME', live: 'LIVE', over: 'ROUND OVER',
  bomb: 'BOMB', defuse: 'DEFUSE', timeoutCounterTerrorists: 'CT TIMEOUT',
  timeoutTerrorists: 'T TIMEOUT', paused: 'PAUSED', gameOver: 'MATCH OVER',
  intermission: 'INTERMISSION',
});
const bombPhases = Object.freeze({
  planting: 'PLANTING', planted: 'BOMB PLANTED', defusing: 'DEFUSING',
  defused: 'BOMB DEFUSED', exploded: 'BOMB EXPLODED',
});
const knownMappings = new Set(['recognized', 'inferred', 'manual']);

export function text(value, fallback = EMPTY) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
export function number(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
export function statistic(value) { return number(value) ?? EMPTY; }
export function money(value) { return number(value) === null ? EMPTY : `$${Math.trunc(value).toLocaleString('en-US')}`; }
export function time(value) {
  const seconds = number(value);
  if (seconds === null) return EMPTY;
  const rounded = Math.ceil(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}
/** Resolve managed identity by explicit side assignment, never TeamA/TeamB order. */
export function sideTeam(snapshot, side) {
  const game = snapshot?.game;
  const slot = side === 'counterTerrorists' ? 'ct' : 't';
  const match = snapshot?.managedMatch ?? game?.managedMatch;
  const mapping = match?.[slot];
  if (mapping?.side === side && knownMappings.has(mapping.status) && text(mapping.teamId, null)) {
    const team = [match?.teamA, match?.teamB].find(candidate => candidate?.id === mapping.teamId);
    if (team) return team;
  }
  return null;
}
export function teamName(snapshot, side) {
  const game = snapshot?.game;
  const slot = side === 'counterTerrorists' ? 'ct' : 't';
  const team = sideTeam(snapshot, side);
  if (team) return text(team.name, text(team.shortName, side === 'counterTerrorists' ? 'CT' : 'T'));
  const source = text(game?.[slot]?.name, side === 'counterTerrorists' ? 'CT' : 'T');
  return /^(?:counter[-_ ]?terrorists|terrorists)$/i.test(source) ? side === 'counterTerrorists' ? 'CT' : 'T' : source;
}

export function clock(game) {
  const bomb = game?.bomb;
  const bombStatus = bombPhases[bomb?.state] ? bomb.state : game?.roundBomb;
  if (bombPhases[bombStatus]) return { label: bombPhases[bombStatus], value: time(bomb?.secondsRemaining), bomb: true };
  return {
    label: phases[game?.countdown?.phase] ?? phases[game?.roundPhase] ?? phases[game?.phase] ?? EMPTY,
    value: time(game?.countdown?.secondsRemaining),
    bomb: game?.countdown?.phase === 'bomb' || game?.countdown?.phase === 'defuse',
  };
}

export function activeWeapon(player) {
  const weapons = Array.isArray(player?.weapons) ? player.weapons : [];
  return weapons.find(weapon => weapon?.state === 'active' || weapon?.state === 'reloading') ?? player?.activeWeapon ?? null;
}
export function weaponName(weapon) {
  const name = text(weapon?.name, null);
  return name ? name.replace(/^weapon_/, '') : EMPTY;
}
export function observerSlot(value) {
  return Number.isInteger(value) && value >= 0 && value <= 9 ? String(value) : EMPTY;
}
export function roster(snapshot, side) {
  const players = snapshot?.game?.players;
  return (Array.isArray(players) ? players : []).filter(player => player?.side === side)
    .map((player, index) => ({ player, index }))
    .sort((a, b) => {
      const rank = player => observerSlot(player.observerSlot) === EMPTY ? 11 : player.observerSlot === 0 ? 10 : player.observerSlot;
      return rank(a.player) - rank(b.player) || a.index - b.index;
    }).map(({ player }) => player);
}
export function samePlayer(player, observed) {
  return typeof player?.steamId === 'string' && player.steamId.length > 0 && player.steamId === observed?.steamId;
}

export function localPreviewMode(address, development) {
  if (!development) return null;
  const url = new URL(address);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return null;
  const value = url.searchParams.get('preview');
  return ['1', 'live', 'dust2', 'prematch', 'lineups', 'veto', 'break', 'postmatch', 'statistics', 'spotlight', 'waiting', 'bomb', 'unresolved', 'stale', 'missing'].includes(value) ? value : null;
}
