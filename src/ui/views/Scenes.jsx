import { statistic, text } from '../../model.js';
import { matchOf, playerName, profileFor, seriesWinner, teamLineup } from '../../model/showcase.js';
import { Competition, Empty, LocalImage, MatchTeams, SceneHeader, ScheduledStart } from '../components/Common.jsx';
import { MapSeries, RoundHistory, VetoList } from '../components/Match.jsx';
import { ObservedPlayer, PlayerBadges } from '../components/Players.jsx';
import { StatisticsTable } from '../components/Statistics.jsx';

const Scene = ({ children, name }) => <section className={`scene-page scene-${name}`}>{children}</section>;
export function Prematch({ state }) {
  return <Scene name="prematch"><SceneHeader state={state} title="THE MATCH" subtitle={matchOf(state.snapshot)?.name} /><MatchTeams state={state} /><ScheduledStart state={state} />{state.settings.showSeries && <MapSeries state={state} />}</Scene>;
}
export function Lineups({ state }) {
  const match = matchOf(state.snapshot);
  return <Scene name="lineups"><SceneHeader state={state} title="STARTING LINEUPS" subtitle="Configured active-match players" />
    {match ? <div className="lineup-teams">{[match.teamA, match.teamB].map(team => {
      const players = teamLineup(state.snapshot, state.metadata, team.id);
      return <section key={team.id}><header><LocalImage path={team.logo} name={team.name} media={state.media} /><h2>{team.name}</h2></header>
        {players.length ? <ul>{players.map((entry, i) => <li key={`${entry.steamId}-${i}`}><LocalImage path={entry.profile?.avatar} name={playerName(entry.player, entry.profile)} media={state.media} /><div><strong>{playerName(entry.player, entry.profile)}</strong><span>{entry.player ? `K/D/A ${statistic(entry.player.stats?.kills)} / ${statistic(entry.player.stats?.deaths)} / ${statistic(entry.player.stats?.assists)}` : 'Live statistics not supplied'}</span>{entry.player && <PlayerBadges player={entry.player} />}</div></li>)}</ul> : <Empty>No matching lineup supplied</Empty>}</section>;
    })}</div> : <Empty>No active match selected</Empty>}
  </Scene>;
}
export function Veto({ state }) {
  return <Scene name="veto"><SceneHeader state={state} title="MAP VETO" subtitle={matchOf(state.snapshot)?.name} /><VetoList state={state} />{state.settings.showSeries && <MapSeries state={state} />}</Scene>;
}
export function Break({ state }) {
  return <Scene name="break"><SceneHeader state={state} title="WE WILL BE BACK" subtitle="Broadcast break" /><MatchTeams state={state} /><ScheduledStart state={state} />{state.settings.showSeries && <MapSeries state={state} />}</Scene>;
}
export function Postmatch({ state }) {
  const winner = seriesWinner(state.snapshot);
  return <Scene name="postmatch"><SceneHeader state={state} title={winner ? `${winner.name} WIN THE SERIES` : 'MATCH RESULTS'} subtitle={winner ? 'Completed, confirmed best-of series' : 'Reported series and map results'} />
    <MatchTeams state={state} />{state.settings.showSeries && <MapSeries state={state} />}<p className="results-note">{winner ? 'Series winner follows completed map winners and the reported best-of.' : 'No confirmed series winner supplied by the available results.'}</p></Scene>;
}
export function Statistics({ state }) {
  return <Scene name="statistics"><SceneHeader state={state} title="PLAYER STATISTICS" subtitle={matchOf(state.snapshot)?.name} /><StatisticsTable state={state} /><RoundHistory state={state} always /></Scene>;
}
export function Spotlight({ state }) {
  const feature = state.settings.feature;
  const match = matchOf(state.snapshot);
  const selected = feature.playerId ? state.snapshot?.game?.players?.find(player => player.steamId === feature.playerId) : state.snapshot?.game?.observedPlayer;
  const profile = profileFor(state.snapshot, state.metadata, selected?.steamId ?? feature.playerId);
  const playerRef = feature.playerId ? feature.player : null;
  const team = [match?.teamA, match?.teamB].find(candidate => candidate?.id === feature.teamId);
  let content;
  if (feature.playerId || (!feature.teamId && !feature.matchId)) {
    content = <div className="spotlight-player"><LocalImage path={playerRef?.image || profile?.avatar} name={playerName(selected, profile) === '–' ? text(playerRef?.name) : playerName(selected, profile)} media={state.media} className="spotlight-portrait" />
      <h2>{feature.playerId ? text(playerRef?.name, playerName(selected, profile)) : playerName(selected, profile)}</h2>
      {playerRef?.missing === true && <Empty>Selected player reference is unavailable</Empty>}
      {selected ? <ObservedPlayer state={state} player={selected} expanded /> : <Empty>No matching live player statistics supplied</Empty>}</div>;
  } else if (feature.teamId) {
    content = <div className="spotlight-team"><LocalImage path={feature.team?.image || team?.logo} name={text(feature.team?.name, team?.name)} media={state.media} className="spotlight-portrait" /><h2>{text(feature.team?.name, team?.name)}</h2>
      {feature.team?.missing === true && <Empty>Selected team reference is unavailable</Empty>}{team ? <p>{team.seriesWins} series maps won</p> : <Empty>The selected team is not one of the active match teams</Empty>}
      {team && <StatisticsTable state={state} players={teamLineup(state.snapshot, state.metadata, team.id).flatMap(entry => entry.player ? [entry.player] : [])} />}</div>;
  } else {
    content = <div className="spotlight-match"><h2>{text(feature.match?.name)}</h2>{feature.match?.missing === true && <Empty>Selected match reference is unavailable</Empty>}
      {match?.id === feature.matchId ? <><MatchTeams state={state} /><MapSeries state={state} /></> : <Empty>No full snapshot for this selected match; only its reference is available</Empty>}</div>;
  }
  return <Scene name="spotlight"><SceneHeader state={state} title={feature.headline || 'IN THE SPOTLIGHT'} subtitle={feature.subline || 'Operator-selected feature'} />{content}<Competition state={state} /></Scene>;
}
