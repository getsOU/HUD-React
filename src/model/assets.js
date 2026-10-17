const safePath = path => typeof path === 'string' && /^assets\/[a-z0-9_/-]+\.(?:svg|png|json)$/.test(path) && !path.includes('..');
export function packageAsset(path, base) {
  if (!safePath(path)) return null;
  return base ? new URL(path, base).href : `./${path}`;
}
export function readRadarCatalog(payload) {
  if (payload?.schemaVersion !== 1 || !Array.isArray(payload.maps) || payload.maps.length > 64) return [];
  return payload.maps.flatMap(map => {
    if (!/^(?:de|cs)_[a-z0-9_]+$/.test(map?.map) || !Array.isArray(map.layers) || map.layers.length > 8) return [];
    const layers = map.layers.filter(layer => typeof layer.id === 'string' && safePath(layer.image) && layer.image.endsWith('.png') &&
      ['width', 'height', 'scale'].every(key => Number.isFinite(layer[key]) && layer[key] > 0) &&
      ['posX', 'posY'].every(key => Number.isFinite(layer[key])) &&
      Number.isFinite(layer.posX + layer.width * layer.scale) && Number.isFinite(layer.posY - layer.height * layer.scale) &&
      ['minZ', 'maxZ'].every(key => layer[key] == null || Number.isFinite(layer[key])) &&
      (layer.minZ == null || layer.maxZ == null || layer.maxZ > layer.minZ));
    const sites = (Array.isArray(map.sites) ? map.sites : []).filter(site => ['A', 'B'].includes(site?.label) && ['x', 'y'].every(key => Number.isFinite(site[key]) && site[key] >= 0 && site[key] <= 1)).slice(0, 2);
    return layers.length ? [{ map: map.map, name: typeof map.name === 'string' ? map.name : map.map, layers, sites }] : [];
  });
}
export function radarLayer(catalog, mapName, z) {
  const map = catalog?.find(map => map.map === mapName);
  if (!map) return null;
  const layer = Number.isFinite(z) ? map.layers.find(layer => (layer.minZ == null || z >= layer.minZ) && (layer.maxZ == null || z < layer.maxZ)) : null;
  const selected = layer ?? map.layers.find(layer => layer.id === 'main') ?? map.layers[0];
  return { ...selected, sites: map.sites ?? [] };
}
export async function loadRadarCatalog(base, signal, fetchImpl = fetch) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 3000);
  let reader;
  try {
    if (signal.aborted) return [];
    const response = await fetchImpl(packageAsset('assets/radar/catalog.json', base), { signal: controller.signal, credentials: 'same-origin', cache: 'force-cache', redirect: 'error' });
    if (!response.ok || !response.body?.getReader) return [];
    reader = response.body.getReader();
    let size = 0, body = '';
    const decoder = new TextDecoder();
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 128 * 1024) return [];
      body += decoder.decode(part.value, { stream: true });
    }
    return readRadarCatalog(JSON.parse(body + decoder.decode()));
  } catch { return []; }
  finally { clearTimeout(timeout); signal.removeEventListener('abort', abort); if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); } }
}

export const rawWeapon = weapon => typeof weapon === 'string' ? weapon.replace(/^weapon_/i, '').toLowerCase() : rawWeapon(weapon?.name ?? '');
export function weaponLabel(weapon) {
  const raw = rawWeapon(weapon);
  if (!raw) return 'Weapon unavailable';
  if (raw.startsWith('knife') || raw === 'bayonet') return 'Knife';
  return ({ m4a1_silencer: 'M4A1-S', m4a1: 'M4A4', usp_silencer: 'USP-S', hkp2000: 'P2000', elite: 'Dual Berettas', hegrenade: 'HE grenade', smokegrenade: 'Smoke', flashbang: 'Flashbang', incgrenade: 'Incendiary', defuser: 'Defuse kit' })[raw] ?? raw.replace(/_/g, ' ').toUpperCase();
}
export const weaponAsset = (weapon, base) => {
  const raw = rawWeapon(weapon);
  return /^[a-z0-9_]+$/.test(raw) ? packageAsset(`assets/weapons/${raw}.svg`, base) : null;
};
