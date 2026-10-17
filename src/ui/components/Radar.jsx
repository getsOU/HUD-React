import { observerSlot } from '../../model.js';
import { useState } from 'react';
import { radarView } from '../../model/showcase.js';

export function Radar({ state }) {
  const [failedOverview, setFailedOverview] = useState(null);
  if (!state.settings.showRadar) return null;
  const requested = state.media(state.settings.radar.overview);
  const config = requested && requested !== failedOverview ? state.settings.radar : { ...state.settings.radar, overview: '' };
  const view = radarView(state.snapshot, config, state.now, state.radarTimelineAccepted);
  const overview = state.media(view.overview);
  return <section className="radar" aria-label="World position radar"><header><strong>POSITIONS</strong><span>{view.source}</span></header>
    <svg viewBox="0 0 100 100" role="img" aria-label={view.label}>
      <rect width="100" height="100" className="radar-base" />
      {overview && <image href={overview} x="0" y="0" width="100" height="100" preserveAspectRatio="none" onError={() => setFailedOverview(overview)} />}
      {!overview && <g className="radar-grid">{[20, 40, 60, 80].map(n => <g key={n}><path d={`M${n} 0V100M0 ${n}H100`} /></g>)}</g>}
      {view.flames.map(flame => <circle key={flame.id} cx={flame.x} cy={flame.y} r="1.1" className="radar-flame" />)}
      {view.grenades.map(grenade => <g key={grenade.id} transform={`translate(${grenade.x} ${grenade.y})`} className="radar-grenade"><circle r="2.1" /><text y=".8">{({ smoke: 'S', flashbang: 'F', highExplosive: 'H', molotov: 'M', incendiary: 'I', decoy: 'D', inferno: 'I' })[grenade.type] ?? '?'}</text><title>{grenade.type ?? 'Unknown grenade'}</title></g>)}
      {view.bomb && <g transform={`translate(${view.bomb.x} ${view.bomb.y})`} className="radar-bomb"><path d="M0 -3L3 0L0 3L-3 0Z" /><title>{`Bomb · ${view.bomb.state}`}</title><text y="1">B</text></g>}
      {view.players.map(marker => <g key={marker.key} transform={`translate(${marker.x} ${marker.y})`} className={`radar-player ${marker.player.side === 'counterTerrorists' ? 'ct' : marker.player.side === 'terrorists' ? 't' : 'neutral'}`}>
        {marker.dead ? <><path d="M-2 -2L2 2M2 -2L-2 2" className="radar-dead" /><text y="5" className="radar-dead-slot">{observerSlot(marker.player.observerSlot)}</text></> : <><circle r="2.9" />{marker.direction !== null && <path d="M2 0H5" transform={`rotate(${marker.direction})`} className="radar-direction" />}<text y="1">{observerSlot(marker.player.observerSlot)}</text></>}
        <title>{`${marker.player.name ?? 'Unknown player'}${marker.dead ? ' · dead' : ''}`}</title>
      </g>)}
    </svg><p>{view.label}</p>{!view.players.length && <span className="radar-empty">No player positions supplied</span>}
  </section>;
}
