import {
  EMPTY, activeWeapon, clock, money, observerSlot, roster, samePlayer, statistic, teamName, text, weaponName,
} from '../model.js';

function TeamScore({ snapshot, side, label }) {
  const slot = side === 'counterTerrorists' ? 'ct' : 't';
  return <section className={`team-score ${slot}`} aria-label={label}>
    <span className="side-label">{label}</span>
    <h1>{teamName(snapshot, side)}</h1>
    <strong className="score">{statistic(snapshot?.game?.[slot]?.score)}</strong>
  </section>;
}

function Scoreboard({ snapshot, settings }) {
  const game = snapshot?.game;
  const timer = clock(game);
  return <header className="scoreboard">
    <TeamScore snapshot={snapshot} side="counterTerrorists" label="CT" />
    <section className={`round-info ${timer.bomb ? 'bomb' : ''}`} aria-label="Round information">
      <p className="caption">{settings.caption}</p>
      <p className="map">{text(game?.map)}</p>
      <strong className="clock">{timer.value}</strong>
      <p className="phase">{timer.label}</p>
      <p className="round">ROUND {statistic(game?.roundNumber)}</p>
    </section>
    <TeamScore snapshot={snapshot} side="terrorists" label="T" />
  </header>;
}

function PlayerRow({ player, observed }) {
  const weapon = activeWeapon(player);
  const dead = player.isAlive === false;
  const selected = samePlayer(player, observed);
  return <li className={`player-row${dead ? ' dead' : ''}${selected ? ' observed' : ''}`}>
    <span className="observer-slot">{observerSlot(player.observerSlot)}</span>
    <div className="player-main">
      <p className="player-name">{text(player.name)}</p>
      <p className="weapon">{weaponName(weapon)}{weapon?.state === 'reloading' ? ' · RELOADING' : ''}</p>
      <dl className="vitals">
        <div><dt>HP</dt><dd>{statistic(player.health)}</dd></div>
        <div><dt>ARM</dt><dd>{statistic(player.armor)}</dd></div>
        <div><dt>CASH</dt><dd>{money(player.money)}</dd></div>
      </dl>
    </div>
    <div className="player-stats">
      <p>{statistic(player.stats?.kills)}<span>/</span>{statistic(player.stats?.deaths)}<span>/</span>{statistic(player.stats?.assists)}</p>
      <span>K / D / A</span>
      {dead && <span className="dead-label">OUT</span>}
    </div>
  </li>;
}

function Roster({ snapshot, side }) {
  const players = roster(snapshot, side);
  return <section className={`roster ${side === 'counterTerrorists' ? 'ct' : 't'}`} aria-label={`${side === 'counterTerrorists' ? 'CT' : 'T'} players`}>
    <p className="roster-title">{teamName(snapshot, side)}</p>
    {players.length ? <ol>{players.map((player, index) => <PlayerRow key={`${player.steamId ?? 'unknown'}-${index}`} player={player} observed={snapshot?.game?.observedPlayer} />)}</ol>
      : <p className="empty-roster">Waiting for player data</p>}
  </section>;
}

function ObservedPlayer({ player }) {
  if (!player) return null;
  const weapon = activeWeapon(player);
  const side = player.side === 'counterTerrorists' ? 'ct' : player.side === 'terrorists' ? 't' : 'neutral';
  return <section className={`observed-player ${side}`} aria-label="Observed player">
    <span className="observer-slot">{observerSlot(player.observerSlot)}</span>
    <div className="observed-identity"><p className="eyebrow">OBSERVING</p><h2>{text(player.name)}</h2><p>{weaponName(weapon)}{weapon?.state === 'reloading' ? ' · RELOADING' : ''}</p></div>
    <dl className="observed-vitals">
      <div><dt>HEALTH</dt><dd>{statistic(player.health)}</dd></div>
      <div><dt>ARMOR</dt><dd>{statistic(player.armor)}</dd></div>
      <div className="ammo"><dt>AMMO</dt><dd>{statistic(weapon?.ammoClip)} <span>/ {statistic(weapon?.ammoReserve)}</span></dd></div>
    </dl>
  </section>;
}

function Connection({ state }) {
  const freshness = text(state.snapshot?.freshness, 'waiting');
  const connected = state.liveStatus === 'connected';
  return <aside className={`connection ${connected && freshness === 'live' ? 'live' : ''}`} aria-label="HUD status">
    {state.preview && <strong>LOCAL PREVIEW</strong>}
    <span className="status-dot" />
    <span>{state.message ?? (connected ? `DATA · ${freshness.toUpperCase()}` : `LIVE · ${state.liveStatus.toUpperCase()}`)}</span>
    {state.panelStatus !== 'connected' && <span> · PANEL {state.panelStatus.toUpperCase()}</span>}
  </aside>;
}

export function Hud({ state }) {
  return <main className="stage" aria-label="sOU Basic HUD">
    <Scoreboard snapshot={state.snapshot} settings={state.settings} />
    {!state.snapshot?.game && <p className="waiting">WAITING FOR GAME DATA</p>}
    {state.settings.showRosters && <>
      <Roster snapshot={state.snapshot} side="counterTerrorists" />
      <Roster snapshot={state.snapshot} side="terrorists" />
    </>}
    {state.settings.showObservedPlayer && <ObservedPlayer player={state.snapshot?.game?.observedPlayer} />}
    <Connection state={state} />
    <span className="signature">sOU / BASIC</span>
  </main>;
}
