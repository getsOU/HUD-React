import { activeWeapon, money, observerSlot, roster, samePlayer, statistic, teamName, text, weaponName } from '../../model.js';
import { hasBomb, playerCoverage, playerName, profileFor, utility, weaponList } from '../../model/showcase.js';
import { LocalImage, Meter, NumberStat } from './Common.jsx';

export function Inventory({ player, full = false }) {
  const weapons = full ? weaponList(player) : utility(player);
  return <ul className={`inventory ${full ? 'full-inventory' : ''}`} aria-label={full ? 'Inventory' : 'Utility'}>
    {weapons.map((weapon, i) => <li key={`${weapon.slot ?? 'slot'}-${i}`} className={weapon.state === 'active' || weapon.state === 'reloading' ? 'active' : ''}>
      <span>{full ? weaponName(weapon) : ({ smokeGrenade: 'SMOKE', flashbang: 'FLASH', highExplosiveGrenade: 'HE', molotov: 'MOLLY', incendiaryGrenade: 'INC', decoy: 'DECOY' })[weapon.kind] || weaponName(weapon)}</span>{full && <small>{text(weapon.state)} · {statistic(weapon.ammoClip)} / {statistic(weapon.ammoReserve)}</small>}
    </li>)}{full && !weapons.length && <li>Inventory unavailable</li>}
  </ul>;
}
export function PlayerBadges({ player }) {
  return <span className="equipment-badges">{player.helmet === true && <b title="Helmet">H</b>}{player.defuseKit === true && <b>KIT</b>}{hasBomb(player) && <b>C4</b>}
    {player.flashed > 0 && <b>FLASH {player.flashed}</b>}{player.smoked > 0 && <b>SMOKE {player.smoked}</b>}{player.burning > 0 && <b>FIRE {player.burning}</b>}</span>;
}
export function PlayerRow({ player, state }) {
  const weapon = activeWeapon(player);
  const dead = player.health === 0 || player.isAlive === false;
  const selected = samePlayer(player, state.snapshot?.game?.observedPlayer);
  const profile = profileFor(state.snapshot, state.metadata, player.steamId, state.settings.feature.player);
  const name = playerName(player, profile);
  return <li className={`player-row${dead ? ' dead' : ''}${selected ? ' observed' : ''}`}>
    <span className="observer-slot">{observerSlot(player.observerSlot)}</span>
    <LocalImage path={profile?.avatar} name={name} media={state.media} className="roster-avatar" />
    <div className="player-main"><p className="player-name" title={name}>{name}</p><PlayerBadges player={player} />
      <div className="health-line"><b>{statistic(player.health)} HP</b><Meter value={player.health} label={`${name} health`} /><span>{statistic(player.armor)} ARM</span></div>
      <div className="armor-line"><Meter value={player.armor} label={`${name} armor`} /></div>
      <p className="weapon"><span className="weapon-name">{weaponName(weapon)} {weapon?.state === 'reloading' ? '· RELOADING' : ''}</span><span className="weapon-ammo">{statistic(weapon?.ammoClip)} / {statistic(weapon?.ammoReserve)}</span></p>
      <Inventory player={player} /><p className="player-finance">{money(player.money)} · EQ {money(player.equipmentValue)}</p>
    </div><div className="player-stats"><p>{statistic(player.stats?.kills)}<span>/</span>{statistic(player.stats?.deaths)}<span>/</span>{statistic(player.stats?.assists)}</p><span>K / D / A</span><span className="round-numbers">RK {statistic(player.roundKills)}<br />DMG {statistic(player.roundDamage)}</span>{dead && <span className="dead-label">OUT</span>}</div>
  </li>;
}
export function Roster({ state, side }) {
  const players = roster(state.snapshot, side);
  return <section className={`roster ${side === 'counterTerrorists' ? 'ct' : 't'}`} aria-label={`${side === 'counterTerrorists' ? 'CT' : 'T'} players`}>
    <p className="roster-title">{teamName(state.snapshot, side)}</p>
    {players.length ? <ol>{players.map((player, i) => <PlayerRow key={`${player.steamId ?? 'unknown'}-${i}`} player={player} state={state} />)}</ol> : <p className="empty-roster">Waiting for player data</p>}
  </section>;
}
export function ObservedPlayer({ state, player = state.snapshot?.game?.observedPlayer, expanded = false }) {
  if (!player) return null;
  const weapon = activeWeapon(player);
  const profile = profileFor(state.snapshot, state.metadata, player.steamId, state.settings.feature.player);
  const name = playerName(player, profile);
  const coverage = playerCoverage(player);
  const side = player.side === 'counterTerrorists' ? 'ct' : player.side === 'terrorists' ? 't' : 'neutral';
  return <section className={`observed-player ${side} ${expanded ? 'expanded' : ''}`} aria-label="Observed player">
    <LocalImage path={profile?.avatar} name={name} media={state.media} className="observed-avatar" /><span className="observer-slot">{observerSlot(player.observerSlot)}</span>
    <div className="observed-identity"><p className="eyebrow">{expanded ? 'PLAYER' : 'OBSERVING'}</p><h2>{name}</h2><PlayerBadges player={player} /><p>{weaponName(weapon)}{weapon?.state === 'reloading' ? ' · RELOADING' : ''}</p><Meter value={player.health} label="Health" /></div>
    <dl className="observed-vitals"><NumberStat label="HEALTH" value={player.health} /><NumberStat label="ARMOR" value={player.armor} /><div className="ammo"><dt>AMMO</dt><dd>{statistic(weapon?.ammoClip)} <span>/ {statistic(weapon?.ammoReserve)}</span></dd></div></dl>
    <div className="observed-extra"><span>K/D/A {statistic(player.stats?.kills)} / {statistic(player.stats?.deaths)} / {statistic(player.stats?.assists)}</span><span>ADR {coverage.adr === null ? '–' : coverage.adr.toFixed(1)} · HS {coverage.hs === null ? '–' : `${coverage.hs.toFixed(1)}%`}</span><small>{coverage.label}</small><Inventory player={player} full /></div>
  </section>;
}
