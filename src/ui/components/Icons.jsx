import { useState } from 'react';
import { packageAsset, weaponAsset, weaponLabel } from '../../model/assets.js';

export function Icon({ name, label = name, base, weapon, className = '' }) {
  const [failed, setFailed] = useState(null);
  if (!weapon && !name) return null;
  const source = weapon ? weaponAsset(weapon, base) : name ? packageAsset(`assets/${name}.svg`, base) : null;
  const title = weapon ? weaponLabel(weapon) : label ?? 'Weapon unavailable';
  return source && failed !== source ? <img className={`icon ${weapon ? 'weapon-icon' : ''} ${className}`} src={source} alt={title} aria-label={title} title={title} data-cs2-icon={weapon ? undefined : name} onError={() => setFailed(source)} />
    : <span className={`icon-label ${className}`} title={title} aria-label={title}>{title}</span>;
}
