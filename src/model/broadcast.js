import { clock, number, sideTeam, text } from '../model.js';
import { mapSeries, matchOf } from './showcase.js';
import { canonicalMapName } from './assets.js';

/** Broadcast labels contain only a chosen caption, never concatenated import metadata. */
export const broadcastCaption = state => text(state.settings.caption, text(matchOf(state.snapshot)?.competition?.name, ''));

export function roundLabel(game) {
  const timer = clock(game);
  const phase = game?.countdown?.phase;
  if (timer.bomb || ['paused', 'timeoutCounterTerrorists', 'timeoutTerrorists', 'warmup', 'gameOver'].includes(phase) || game?.phase === 'intermission') return timer.label;
  return Number.isInteger(game?.roundNumber) && game.roundNumber > 0 ? `ROUND ${game.roundNumber}` : '';
}

export function seriesPips(snapshot, side) {
  const match = matchOf(snapshot), team = sideTeam(snapshot, side);
  if (!match || !team || !match.teamA?.id || !match.teamB?.id || match.teamA.id === match.teamB.id || !Number.isInteger(match.bestOf) || match.bestOf < 3 || match.bestOf > 9 || match.bestOf % 2 === 0) return [];
  const target = Math.floor(match.bestOf / 2) + 1;
  if (!Number.isInteger(team.seriesWins) || team.seriesWins < 0 || team.seriesWins > target) return [];
  return Array.from({ length: target }, (_, index) => index < team.seriesWins);
}

const mapNames = Object.freeze({ de_dust2: 'Dust II', de_mirage: 'Mirage', de_inferno: 'Inferno', de_nuke: 'Nuke', de_ancient: 'Ancient', de_anubis: 'Anubis', de_vertigo: 'Vertigo', de_train: 'Train', de_overpass: 'Overpass', de_cache: 'Cache', de_cbble: 'Cobblestone', cs_office: 'Office', cs_italy: 'Italy' });
export const friendlyMapName = map => text(map.name, mapNames[canonicalMapName(map.gameName)] ?? text(map.gameName, 'Map'));

/** Resolve only an explicit, unambiguous veto identity; score, side and list order are never a pick. */
export function mapPick(snapshot, map) {
  const match = matchOf(snapshot);
  const decisions = (match?.vetos ?? []).filter(veto => map.id && veto.mapId === map.id);
  if (decisions.length !== 1) return { label: 'Pick unknown', description: 'No unambiguous pick decision supplied' };
  const decision = decisions[0];
  if ((decision.playNumber != null && decision.playNumber !== map.number) || (decision.gameName && map.gameName && canonicalMapName(decision.gameName) !== canonicalMapName(map.gameName))) return { label: 'Pick unknown', description: 'Conflicting map decision' };
  if (decision.type === 'decider') return { label: 'DECIDER', description: 'Decider map' };
  if (decision.type !== 'pick') return { label: 'Pick unknown', description: 'No pick decision supplied' };
  const team = [match.teamA, match.teamB].find(team => team?.id && team.id === decision.teamId);
  if (!team || match.teamA?.id === match.teamB?.id) return { label: 'Pick unassigned', description: 'Pick team not assigned' };
  return { label: `PICK · ${text(team.shortName, team.name)}`, description: `Picked by ${team.name}` };
}

/** Map identity must agree with the real game; configured status/order alone cannot identify it. */
export function liveSeries(snapshot) {
  return mapSeries(snapshot).slice(0, 9).map(map => ({ ...map, label: friendlyMapName(map),
    current: typeof snapshot?.game?.map === 'string' && snapshot.game.map.length > 0 && canonicalMapName(map.gameName) === canonicalMapName(snapshot.game.map),
    score: map.status === 'completed' && number(map.scoreA) !== null && number(map.scoreB) !== null ? `${map.scoreA}:${map.scoreB}` : null,
  }));
}

/** History belongs to a pause in play. A live bomb/defuse always takes precedence. */
export function roundHistoryVisible(game) {
  const phase = game?.countdown?.phase;
  if (clock(game).bomb || game?.roundPhase === 'over' || ['live', 'bomb', 'defuse', 'over'].includes(phase)) return false;
  return game?.phase === 'intermission' || game?.roundPhase === 'freezeTime' || ['freezeTime', 'paused', 'timeoutCounterTerrorists', 'timeoutTerrorists'].includes(phase);
}

export function recentRounds(game, limit = 12) {
  const rounds = (Array.isArray(game?.roundWins) ? game.roundWins : []).filter(round => Number.isInteger(round?.roundNumber) && round.roundNumber > 0)
    .map((round, index) => ({ ...round, sourceIndex: index }))
    .sort((a, b) => a.roundNumber - b.roundNumber || a.sourceIndex - b.sourceIndex);
  return limit === null ? rounds : rounds.slice(-limit);
}
