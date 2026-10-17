import { money, observerSlot, statistic } from '../../model.js';
import { playerCoverage, playerName, profileFor } from '../../model/showcase.js';
import { Empty, LocalImage } from './Common.jsx';

export function StatisticsTable({ state, players = state.snapshot?.game?.players ?? [] }) {
  if (!players.length) return <Empty>No player statistics supplied</Empty>;
  const rows = [...players].sort((a, b) => (b.stats?.kills ?? -1) - (a.stats?.kills ?? -1));
  return <div className="statistics-scroll"><table className="statistics-table"><caption>Source statistics · ADR/HS cover only the indicated recorded rounds</caption>
    <thead><tr>{['Player', 'Side', 'K', 'D', 'A', 'MVP', 'Score', 'Round K', 'Round HS', 'Round damage', 'HP', 'Armor', 'Money', 'Equipment', 'ADR', 'HS%', 'Recorded coverage'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{rows.map((player, i) => {
      const profile = profileFor(state.snapshot, state.metadata, player.steamId, state.settings.feature.player);
      const name = playerName(player, profile), coverage = playerCoverage(player);
      return <tr key={`${player.steamId ?? 'unknown'}-${i}`}><th scope="row"><LocalImage path={profile?.avatar} name={name} media={state.media} /><span>{observerSlot(player.observerSlot)} · {name}</span></th>
        <td>{player.side === 'counterTerrorists' ? 'CT' : player.side === 'terrorists' ? 'T' : '–'}</td>
        {[player.stats?.kills, player.stats?.deaths, player.stats?.assists, player.stats?.mvps, player.stats?.score, player.roundKills, player.roundHeadshotKills, player.roundDamage, player.health, player.armor].map((value, index) => <td key={index}>{statistic(value)}</td>)}
        <td>{money(player.money)}</td><td>{money(player.equipmentValue)}</td><td>{coverage.adr === null ? '–' : coverage.adr.toFixed(1)}</td><td>{coverage.hs === null ? '–' : coverage.hs.toFixed(1)}</td><td className="coverage-cell">{coverage.label}</td>
      </tr>;
    })}</tbody></table></div>;
}
