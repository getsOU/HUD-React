import { clock, money, sideTeam, statistic, teamName, text } from '../../model.js';
import { economy, killEntries, mapSeries, matchOf, vetoEntries } from '../../model/showcase.js';
import { broadcastCaption, liveSeries, recentRounds, roundHistoryVisible, roundLabel, seriesPips } from '../../model/broadcast.js';
import { Empty, LocalImage } from './Common.jsx';
import { Icon } from './Icons.jsx';
import { sourceName } from '../../model/source-name.js';

function TeamScore({ state, side, label }) {
  const slot = side === 'counterTerrorists' ? 'ct' : 't';
  const team = sideTeam(state.snapshot, side);
  const pips = state.settings.showSeries ? seriesPips(state.snapshot, side) : [];
  return <section className={`team-score ${slot}`} aria-label={label}><LocalImage path={team?.logo} name={teamName(state.snapshot, side)} media={state.media} optional />
    <div><h1 title={teamName(state.snapshot, side)}>{teamName(state.snapshot, side)}</h1>{pips.length > 0 && <span className="series-pips" aria-label={`${teamName(state.snapshot, side)}: ${team.seriesWins} maps won`} title={`${teamName(state.snapshot, side)}: ${team.seriesWins} maps won`}>{pips.map((won, index) => <i key={index} className={won ? 'won' : ''} />)}</span>}</div>
    <strong className="score">{statistic(state.snapshot?.game?.[slot]?.score)}</strong></section>;
}
export function Scoreboard({ state }) {
  const game = state.snapshot?.game;
  const timer = clock(game);
  const caption = broadcastCaption(state);
  return <header className={`scoreboard ${caption ? 'has-caption' : ''}`}>
    {caption && <p className="broadcast-caption" title={caption}>{caption}</p>}
    <div className="scoreboard-main"><TeamScore state={state} side="counterTerrorists" label="CT" />
      <section className={`round-info ${timer.bomb ? 'bomb' : ''}`} aria-label="Round information"><p className="round-label">{roundLabel(game)}</p><strong className="clock">{timer.value}</strong></section>
      <TeamScore state={state} side="terrorists" label="T" /></div></header>;
}
export function MapSeries({ state, compact = false }) {
  const maps = mapSeries(state.snapshot);
  const match = matchOf(state.snapshot);
  if (!maps.length) return compact ? null : <Empty>No series maps configured</Empty>;
  if (compact) return <section className="live-map-series" aria-label="Map series">{liveSeries(state.snapshot).map((map, index) => <article key={`${map.id}-${index}`} className={map.current ? 'current-map' : ''} aria-current={map.current ? 'step' : undefined} title={`${map.label}${map.score ? ` · ${text(match?.teamA?.name, 'Team A')} ${map.score.split(':')[0]}:${map.score.split(':')[1]} ${text(match?.teamB?.name, 'Team B')}` : ''}`}><span>{map.number}</span><strong>{map.label}</strong>{map.score && <b aria-label={`${text(match?.teamA?.name, 'Team A')} ${map.score.split(':')[0]}, ${text(match?.teamB?.name, 'Team B')} ${map.score.split(':')[1]}`}>{map.score}</b>}</article>)}</section>;
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
export function RoundHistory({ state, always = false }) {
  if (!state.settings.showRoundHistory || (!always && !roundHistoryVisible(state.snapshot?.game))) return null;
  const rounds = recentRounds(state.snapshot?.game, always ? null : 12);
  if (!rounds.length) return null;
  return <section className="round-history" aria-label="Round history">{rounds.map((round, i) => <span key={`${round.roundNumber}-${i}`} className={round.winner === 'counterTerrorists' ? 'ct' : round.winner === 'terrorists' ? 't' : 'neutral'} title={`Round ${round.roundNumber}: ${round.winner}, ${round.reason}`}><b>{round.roundNumber}</b>
    <RoundResultIcon reason={round.reason} base={state.assetBase} /></span>)}</section>;
}
function RoundResultIcon({ reason, base }) {
  if (reason === 'bombDefused' || reason === 'bombExploded' || reason === 'elimination') return <Icon name={reason === 'bombDefused' ? 'ui/defuser_white' : reason === 'bombExploded' ? 'weapons/c4' : 'killfeed/icon_suicide'} label={reason} base={base} />;
  return <svg className="icon" viewBox="0 0 24 24" role="img" aria-label={reason === 'timeExpired' ? 'Time expired' : reason === 'hostageRescued' ? 'Hostage rescued' : 'Unknown round result'}><title>{reason}</title>{reason === 'timeExpired' ? <><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 5v7l4 2" fill="none" stroke="currentColor" strokeWidth="2" /></> : reason === 'hostageRescued' ? <><circle cx="12" cy="6" r="3" fill="currentColor" /><path d="M8 11h8v11H8z" fill="currentColor" /></> : <path d="M12 3 21 12 12 21 3 12Z" fill="none" stroke="currentColor" strokeWidth="2" />}</svg>;
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
