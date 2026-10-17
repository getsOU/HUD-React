import { activeWeapon, money, observerSlot, playerDead, roster, samePlayer, statistic, teamName } from '../../model.js';
import { economy, hasBomb, playerCoverage, playerName, profileFor, utility, weaponList } from '../../model/showcase.js';
import { weaponLabel } from '../../model/assets.js';
import { LocalImage, Meter, NumberStat } from './Common.jsx';
import { Icon } from './Icons.jsx';

export function Inventory({ player, full = false, state }) {
  const weapons = full ? weaponList(player) : utility(player);
  if (!weapons.length) return null;
  return <ul className={`inventory ${full ? 'full-inventory' : ''}`} aria-label={full ? 'Inventory' : 'Utility'}>
    {weapons.map((weapon, i) => <li key={`${weapon.slot ?? 'slot'}-${i}`} className={weapon.state === 'active' || weapon.state === 'reloading' ? 'active' : ''}>
      <Icon weapon={weapon} base={state?.assetBase} />{full && <><span>{weaponLabel(weapon)}</span>{weapon.type !== 'grenade' && weapon.type !== 'knife' && <small>{statistic(weapon.ammoClip)} / {statistic(weapon.ammoReserve)}</small>}</>}
      {weapon.type === 'grenade' && weapon.ammoReserve > 1 && <small className="utility-count">{weapon.ammoReserve}</small>}
    </li>)}
  </ul>;
}
export function PlayerBadges({ player, state, showHelmet = true }) {
  const base = state?.assetBase;
  return <span className="equipment-badges">{showHelmet && player.helmet === true && <Icon name="weapons/helmet" label="Helmet" base={base} />}
    {player.defuseKit === true && <Icon name="ui/defuser_white" label="Defuse kit" base={base} />}{hasBomb(player) && <Icon name="weapons/c4" label="Bomb carrier" base={base} />}
    {player.flashed > 0 && <Icon name="killfeed/blind_kill" label={`Flashed ${player.flashed}`} base={base} />}
    {player.smoked > 0 && <Icon name="killfeed/smoke_kill" label={`Smoked ${player.smoked}`} base={base} />}
    {player.burning > 0 && <Icon name="weapons/inferno" label={`Burning ${player.burning}`} base={base} />}</span>;
}
export function PlayerRow({ player, state }) {
  const weapon = activeWeapon(player), dead = playerDead(player);
  const selected = samePlayer(player, state.snapshot?.game?.observedPlayer);
  const profile = profileFor(state.snapshot, state.metadata, player.steamId, state.settings.feature.player);
  const name = playerName(player, profile);
  return <li className={`player-row${dead ? ' dead' : ''}${selected ? ' observed' : ''}`}>
    <div className="player-top"><span className="observer-slot">{observerSlot(player.observerSlot)}</span>
      <LocalImage path={profile?.avatar} name={name} media={state.media} className="roster-avatar" optional />
      <strong className="player-name" title={name}>{name}</strong><span className="player-health">{dead ? <Icon name="killfeed/icon_suicide" label="Dead" base={state.assetBase} /> : statistic(player.health)}</span>
      <span className="player-kda" title="Kills / deaths / assists">{statistic(player.stats?.kills)}/{statistic(player.stats?.deaths)}/{statistic(player.stats?.assists)}</span></div>
    <div className="player-bottom"><span className="player-armor"><Icon name={player.helmet === true ? "weapons/armor_helmet" : "ui/armor"} label={player.helmet === true ? "Armor and helmet" : "Armor"} base={state.assetBase} />{statistic(player.armor)}</span>
      <PlayerBadges player={player} state={state} showHelmet={false} /><Icon weapon={weapon} base={state.assetBase} /><Inventory player={player} state={state} /><span className="player-money">{money(player.money)}</span></div>
    <Meter value={player.health} label={`${name} health`} />
  </li>;
}
function EconomyFooter({ state, side }) {
  const data = economy(state.snapshot, side);
  const sum = item => item.value === null ? '–' : `${money(item.value)}${item.complete ? '' : '*'}`;
  return <footer className="roster-economy" aria-label={`${side} economy`} title="Known cash / equipment totals; * means partial coverage">
    <span>{sum(data.cash)}</span><span>EQ {sum(data.equipment)}</span><span><Icon name="ui/defuser_white" label="Known kits" base={state.assetBase} />{data.kitsKnown ? data.kits : '–'}</span>
  </footer>;
}
export function Roster({ state, side }) {
  const players = roster(state.snapshot, side).slice(0, 5);
  if (!state.settings.showRosters && !state.settings.showEconomy) return null;
  return <section className={`roster ${side === 'counterTerrorists' ? 'ct' : 't'}`} aria-label={`${side === 'counterTerrorists' ? 'CT' : 'T'} players`}>
    {state.settings.showRosters && <><header className="roster-title"><span>{teamName(state.snapshot, side)}</span><small>K/D/A</small></header>
      {players.length ? <ol>{players.map((player, i) => <PlayerRow key={`${player.steamId ?? 'unknown'}-${i}`} player={player} state={state} />)}</ol> : <p className="empty-roster">Waiting for player data</p>}</>}
    {state.settings.showEconomy && <EconomyFooter state={state} side={side} />}
  </section>;
}
export function ObservedPlayer({ state, player = state.snapshot?.game?.observedPlayer, expanded = false }) {
  if (!player) return null;
  const weapon = activeWeapon(player), profile = profileFor(state.snapshot, state.metadata, player.steamId, state.settings.feature.player);
  const name = playerName(player, profile), coverage = playerCoverage(player);
  const side = player.side === 'counterTerrorists' ? 'ct' : player.side === 'terrorists' ? 't' : 'neutral';
  return <section className={`observed-player ${side} ${expanded ? 'expanded' : ''}`} aria-label="Observed player">
    <LocalImage path={profile?.avatar} name={name} media={state.media} className="observed-avatar" optional={!expanded} />
    <div className="observed-main"><div className="observed-identity"><span className="observer-slot">{observerSlot(player.observerSlot)}</span><h2 title={name}>{name}</h2><PlayerBadges player={player} state={state} /></div>
      <div className="observed-weapon">{weapon && <><Icon weapon={weapon} base={state.assetBase} /><span>{weaponLabel(weapon)}{weapon.state === 'reloading' ? ' ↻' : ''}</span>
        {weapon.type !== 'grenade' && weapon.type !== 'knife' && <strong>{statistic(weapon.ammoClip)} <small>/ {statistic(weapon.ammoReserve)}</small></strong>}</>}<Inventory player={player} state={state} /></div></div>
    <dl className="observed-vitals"><NumberStat label="HP" value={player.health} /><NumberStat label="ARM" value={player.armor} /></dl>
    <Meter value={player.health} label="Health" />
    {expanded && <div className="observed-extra"><span>K/D/A {statistic(player.stats?.kills)} / {statistic(player.stats?.deaths)} / {statistic(player.stats?.assists)}</span>
      <span>ADR {coverage.adr === null ? '–' : coverage.adr.toFixed(1)} · HS {coverage.hs === null ? '–' : `${coverage.hs.toFixed(1)}%`}</span><small>{coverage.label}</small>
      <span>Equipment {money(player.equipmentValue)} · round kills {statistic(player.roundKills)} · damage {statistic(player.roundDamage)}</span><Inventory player={player} state={state} full /></div>}
  </section>;
}
