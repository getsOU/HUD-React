import { clock, money, sideTeam, statistic, teamName, text } from '../../model.js';
import { aliveSummary, economy, killEntries, mapSeries, matchOf, vetoEntries } from '../../model/showcase.js';
import { Empty, LocalImage } from './Common.jsx';
import { Icon } from './Icons.jsx';
import { sourceName } from '../../model/source-name.js';

function TeamScore({ state, side, label }) {
  const slot = side === 'counterTerrorists' ? 'ct' : 't';
  const team = sideTeam(state.snapshot, side);
  const alive = aliveSummary(state.snapshot, side);
  return <section className={`team-score ${slot}`} aria-label={label}><LocalImage path={team?.logo} name={teamName(state.snapshot, side)} media={state.media} optional />
    <div><span className="side-label">{label}</span><h1 title={teamName(state.snapshot, side)}>{teamName(state.snapshot, side)}</h1><p className="alive-count">{alive.known ? `${alive.alive} ALIVE${alive.complete ? '' : ` · ${alive.known}/${alive.total} HP known`}` : 'ALIVE –'}{team && ` · SERIES ${team.seriesWins}`}</p></div>
    <strong className="score">{statistic(state.snapshot?.game?.[slot]?.score)}</strong></section>;
}
export function LiveMeta({ state }) {
  const match = matchOf(state.snapshot), game = state.snapshot?.game;
  return <div className="live-meta"><span>{text(game?.map)} · R{statistic(game?.roundNumber)}{match ? ` · BO${match.bestOf} · ${statistic(match.teamA?.seriesWins)}:${statistic(match.teamB?.seriesWins)}` : ''}</span>
    <span>{state.settings.caption}{match?.competition?.name ? ` · ${match.competition.name}` : ''}</span>
    {state.settings.showSeries && <span className="mini-series">{mapSeries(state.snapshot).map((map, i) => <span key={`${map.id}-${i}`} title={`${text(map.name)} · ${text(map.status)}`}>{text(map.name, text(map.gameName))}{map.scoreA != null || map.scoreB != null ? ` ${statistic(map.scoreA)}:${statistic(map.scoreB)}` : ''}</span>)}</span>}
  </div>;
}
export function Scoreboard({ state }) {
  const game = state.snapshot?.game;
  const timer = clock(game);
  const match = matchOf(state.snapshot);
  return <header className="scoreboard"><TeamScore state={state} side="counterTerrorists" label="CT" />
    <section className={`round-info ${timer.bomb ? 'bomb' : ''}`} aria-label="Round information"><p className="caption">{state.settings.caption}</p><p className="map">{text(game?.map)}</p>
      <strong className="clock">{timer.value}</strong><p className="phase">{timer.label}</p><p className="round">ROUND {statistic(game?.roundNumber)}{match && ` · BO${match.bestOf}`}</p></section>
    <TeamScore state={state} side="terrorists" label="T" /></header>;
}
export function MapSeries({ state, compact = false }) {
  const maps = mapSeries(state.snapshot);
  const match = matchOf(state.snapshot);
  if (!maps.length) return compact ? null : <Empty>No series maps configured</Empty>;
  return <section className={`map-series ${compact ? 'compact-series' : ''}`} aria-label="Map series">{maps.map((map, i) => {
    const winner = map.status === 'completed' ? [match?.teamA, match?.teamB].find(team => team?.id === map.winnerTeamId) : null;
    return <article key={`${map.id}-${i}`} className={map.status === 'live' ? 'current-map' : ''}><span>MAP {statistic(map.number)}</span><strong>{text(map.name, text(map.gameName))}</strong>
      <b>{statistic(map.scoreA)} : {statistic(map.scoreB)}</b><small>{text(map.status, 'Status not set')}{winner ? ` · ${winner.name}` : ''}</small></article>;
  })}</section>;
}
export function VetoList({ state }) {
  const entries = vetoEntries(state.snapshot);
  if (!entries.length) return <Empty>No pick/ban decisions supplied</Empty>;
  return <ol className="veto-list">{entries.map((entry, i) => <li key={`${entry.number}-${entry.mapId}-${i}`} className={`decision-${entry.type}`}>
    <span className="decision-order">{statistic(entry.number)}</span><span className="decision-type">{['pick', 'ban', 'decider'].includes(entry.type) ? entry.type.toUpperCase() : 'UNRESOLVED'}</span>
    <strong>{text(entry.name, text(entry.gameName))}</strong>{(entry.team || entry.type !== 'decider') && <span>{text(entry.team?.name, 'Team unassigned')}</span>}<small>{entry.playNumber > 0 ? `Play slot ${entry.playNumber}` : 'No play slot'}</small>
  </li>)}</ol>;
}
export function RoundHistory({ state }) {
  if (!state.settings.showRoundHistory) return null;
  const rounds = state.snapshot?.game?.roundWins;
  if (!Array.isArray(rounds)) return null;
  return <section className="round-history" aria-label="Round history">{rounds.length ? rounds.map((round, i) => <span key={`${round.roundNumber}-${i}`} className={round.winner === 'counterTerrorists' ? 'ct' : round.winner === 'terrorists' ? 't' : 'neutral'} title={`Round ${round.roundNumber}: ${round.winner}, ${round.reason}`}>
    <Icon name={round.reason === 'bombDefused' ? 'ui/defuser_white' : round.reason === 'bombExploded' ? 'weapons/c4' : 'killfeed/icon_suicide'} label={`Round ${round.roundNumber}: ${round.winner}, ${round.reason}`} base={state.assetBase} /></span>) : null}</section>;
}
export function RoundSituation({ state }) {
  const game = state.snapshot?.game;
  const phase = game?.countdown?.phase;
  let title = null;
  if (game?.roundPhase === 'over') title = game.roundWinner === 'counterTerrorists' || game.roundWinner === 'terrorists'
    ? `${teamName(state.snapshot, game.roundWinner)} WIN THE ROUND` : 'ROUND OVER';
  else if (['paused', 'timeoutCounterTerrorists', 'timeoutTerrorists', 'freezeTime', 'warmup', 'gameOver'].includes(phase)) title = clock(game).label;
  else if (game?.phase === 'intermission') title = 'INTERMISSION';
  if (!title) return null;
  return <section className="round-situation"><strong>{title}</strong>{game?.roundPhase === 'over' && <span>{text(game.roundWinReason)}</span>}
    {(phase === 'timeoutCounterTerrorists' || phase === 'timeoutTerrorists') && <span>Timeouts remaining: {statistic(game?.ct?.timeoutsRemaining)} CT / {statistic(game?.t?.timeoutsRemaining)} T</span>}</section>;
}
export function Economy({ state, side }) {
  const data = economy(state.snapshot, side);
  const sum = item => item.value === null ? '–' : `${money(item.value)}${item.complete ? '' : ` (${item.known}/${item.total} known)`}`;
  return <section className={`economy ${side === 'counterTerrorists' ? 'ct' : 't'}`} aria-label={`${side} economy`}><strong>{teamName(state.snapshot, side)}</strong>
    <span>CASH {sum(data.cash)}</span><span>EQUIPMENT {sum(data.equipment)}</span><small>KITS {data.kitsKnown ? `${data.kits} (${data.kitsKnown}/${data.alive.total} known)` : '–'} · UTILITY {data.inventoriesKnown ? `${data.utilities} entries (${data.inventoriesKnown}/${data.alive.total} inventories)` : '–'}</small></section>;
}
const killFlags = [['headshot', 'killfeed/icon_headshot', 'Headshot'], ['wallbang', 'killfeed/penetrate', 'Wallbang'], ['throughSmoke', 'killfeed/smoke_kill', 'Through smoke'], ['noScope', 'killfeed/noscope', 'No scope'], ['attackerBlind', 'killfeed/blind_kill', 'Attacker blind'], ['flashAssist', 'ui/stat_assists', 'Flash assist']];
const sideClass = side => side === 'counterTerrorists' ? 'ct' : side === 'terrorists' ? 't' : 'neutral';
export function KillFeed({ state }) {
  if (!state.settings.showKillfeed) return null;
  const kills = killEntries(state.snapshot);
  return <section className="killfeed" aria-label="Killfeed">{kills.length ? kills.map(kill => <article key={kill.key} className="kill-row">
    <div><strong className={sideClass(kill.killer?.side)} title={sourceName(kill.killer?.name)}>{text(sourceName(kill.killer?.name), 'World')}</strong>{kill.assister && <span className="kill-assister" title={sourceName(kill.assister.name)}> + {text(sourceName(kill.assister.name))}</span>}<Icon weapon={kill.weapon} base={state.assetBase} /><strong className={sideClass(kill.victim?.side)} title={sourceName(kill.victim?.name)}>{text(sourceName(kill.victim?.name))}</strong></div>
    <small>{killFlags.filter(([key]) => kill[key] === true).map(([, name, label]) => <Icon key={name} name={name} label={label} base={state.assetBase} />)}</small>
  </article>) : null}</section>;
}
