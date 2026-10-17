import { observerSlot } from '../../model.js';
import { useState } from 'react';
import { radarPresentation } from '../../model/radar-presentation.js';
import { sourceName } from '../../model/source-name.js';
import { packageAsset } from '../../model/assets.js';
import { boltBombVisible, boltBuyzonesVisible, boltProjectileImage, boltProjectileVisible, boltSmokeVisible } from '../../model/boltobserv.js';

const sideClass = side => side === 'counterTerrorists' ? 'ct' : side === 'terrorists' ? 't' : 'neutral';

/** Original Boltobserv map/markers adapted to public sOU v2 data; attribution in licenses/BOLTOBSERV-NOTICE.md. */
export function Radar({ state }) {
  const [failedOverviews, setFailedOverviews] = useState([]);
  if (!state.settings.showRadar) return null;
  const { view, overview } = radarPresentation(state, failedOverviews);
  const fail = image => setFailedOverviews(previous => [...previous.filter(value => value !== image), image].slice(-16));
  const layer = path => {
    const source = packageAsset(path, state.assetBase);
    return source && !failedOverviews.includes(source) ? <image href={source} x="0" y="0" width="100" height="100" preserveAspectRatio="none" onError={() => fail(source)} /> : null;
  };
  if (!overview) return <section className="radar-unavailable" role="status">Radar unavailable</section>;
  return <section className={`radar ${view.kind}`} aria-label="World position radar">
    <svg viewBox="0 0 100 100" role="img" aria-label={view.label}>
      {layer(view.logos)}
      <image href={overview} x="0" y="0" width="100" height="100" preserveAspectRatio="none" onError={() => fail(overview)} />
      {boltBuyzonesVisible(state.snapshot?.game) && layer(view.buyzones)}
      {view.sites.map(site => <text key={site.label} className="radar-site" x={site.x * 100} y={site.y * 100}>{site.label}</text>)}
      {view.grenades.filter(boltSmokeVisible).map(grenade => <circle key={grenade.id} cx={grenade.x} cy={grenade.y} r={150 * view.worldUnitScale} className={`bolt-smoke ${sideClass(grenade.side)}`}><title>Smoke</title></circle>)}
      {view.flames.map(flame => <circle key={flame.id} cx={flame.x} cy={flame.y} r={50 * view.worldUnitScale} className="bolt-flame"><title>Fire</title></circle>)}
      {view.flashes.map(flash => <circle key={flash.id} cx={flash.x} cy={flash.y} r={145 * view.worldUnitScale} className={`bolt-flash ${flash.phase}`}><title>Flashbang</title></circle>)}
      {view.grenades.filter(boltProjectileVisible).map(grenade => {
        const source = packageAsset(boltProjectileImage(grenade.type, grenade.side), state.assetBase);
        return <g key={`${view.motionContext}|${grenade.id}`} className="radar-projectile" style={{ transform: `translate(${grenade.x}px, ${grenade.y}px)` }}><title>{grenade.type ?? 'Unknown grenade'}</title>{source ? <image href={source} x="-2" y="-2" width="4" height="4" /> : <circle r=".9" className="radar-grenade-unknown" />}</g>;
      })}
      {boltBombVisible(view.bomb) && <image href={packageAsset(`assets/boltobserv/img/bomb-${view.bomb.state === 'defused' ? 'defused' : ['planted', 'defusing'].includes(view.bomb.state) ? 'planted' : 'dropped'}.webp`, state.assetBase)} x={view.bomb.x - 1.1} y={view.bomb.y - 1.1} width="2.2" height="2.2"><title>{`Bomb · ${view.bomb.state}`}</title></image>}
    </svg>
    {view.players.map(marker => <div key={marker.motionKey} className={`bolt-player ${sideClass(marker.player.side)} ${marker.dead ? 'dead' : ''} ${marker.observed ? 'active' : ''} ${marker.flashed ? 'flashed' : ''} ${marker.bombCarrier ? 'bomb-carrier' : ''}`} style={{ left: `${marker.x}%`, top: `${marker.y}%`, '--marker-scale': marker.dead ? .7 : marker.scale }} title={`${sourceName(marker.player.name) ?? 'Unknown player'}${marker.dead ? ' · dead' : ''}${marker.observed ? ' · observed' : ''}${marker.bombCarrier ? ' · bomb carrier' : ''}`}>
      <div className={`bolt-dot ${marker.direction === null ? 'no-direction' : ''}`} style={{ transform: `rotate(${marker.dead || marker.direction === null ? 0 : marker.direction + 45}deg) scale(${marker.dead ? .7 : marker.scale}) translate(-50%, -50%)` }} />
      {!marker.dead && <span className="bolt-label">{observerSlot(marker.player.observerSlot)}</span>}
    </div>)}
  </section>;
}
