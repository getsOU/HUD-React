import { useState } from 'react';
import { packageAsset, weaponAsset, weaponLabel } from '../../model/assets.js';

export function Icon({ name, label = name, base, weapon, className = '' }) {
  const [failed, setFailed] = useState(null);
  const source = weapon ? weaponAsset(weapon, base) : name ? packageAsset(`assets/${name}.svg`, base) : null;
  const title = weapon ? weaponLabel(weapon) : label ?? 'Weapon unavailable';
  return source && failed !== source ? <img className={`icon ${weapon ? 'weapon-icon' : ''} ${className}`} src={source} alt={title} title={title} onError={() => setFailed(source)} />
    : <svg className={`icon ${className}`} viewBox="0 0 24 24" role="img" aria-label={title}><title>{title}</title><path d="M4 4h16v16H4Z M8 12h8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
}
