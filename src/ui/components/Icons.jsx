import { useState } from 'react';
import { packageAsset, rawWeapon, weaponAsset, weaponLabel } from '../../model/assets.js';

export function Icon({ name, label = name, base, weapon, className = '' }) {
  const [failed, setFailed] = useState(null);
  if (!weapon && !name) return null;
  const source = weapon ? weaponAsset(weapon, base) : name ? packageAsset(`assets/${name}.svg`, base) : null;
  const artwork = weapon ? `weapons/${rawWeapon(weapon)}` : name;
  const empty = ['weapons/world', 'weapons/worldent', 'weapons/trigger_hurt'].includes(artwork);
  const title = weapon ? weaponLabel(weapon) : label ?? 'Weapon unavailable';
  return source && !empty && failed !== source ? <span className={`cs2-icon icon ${weapon ? 'weapon-icon' : ''} ${className}`} data-icon={artwork} title={title}><img className="icon-source" src={source} alt={title} aria-label={title} data-cs2-icon={artwork} onError={() => setFailed(source)} /></span>
    : <span className={`icon-label ${className}`} title={title} aria-label={title}>{title}</span>;
}
