const safePath = path => typeof path === 'string' && /^assets\/[a-zA-Z0-9_/-]+\.(?:svg|png|webp|json)$/.test(path) && !path.includes('..');
/** CS2 may report only this documented workshop path; never infer identity from a suffix. */
export const canonicalMapName = value => typeof value === 'string' ? /^workshop\/[0-9]+\/((?:de|cs)_[a-z0-9_]+)$/.exec(value)?.[1] ?? value : null;
export function packageAsset(path, base) {
  if (!safePath(path)) return null;
  return base ? new URL(path, base).href : `./${path}`;
}
export function readRadarCatalog(payload) {
  if (payload?.schemaVersion !== 1 || !Array.isArray(payload.maps) || payload.maps.length > 64) return [];
  return payload.maps.flatMap(map => {
    if (!/^(?:de|cs)_[a-z0-9_]+$/.test(map?.map)) return [];
    if (map.metadata && typeof map.metadata === 'object') {
      const metadata = map.metadata;
      if (!safePath(map.image) || !safePath(map.buyzones) || !safePath(map.logos) || !Number.isFinite(metadata.resolution) || metadata.resolution <= 0 || !Number.isFinite(metadata.resolution * 1024) || !['x', 'y'].every(key => Number.isFinite(metadata.offset?.[key])) || !Array.isArray(metadata.splits) || metadata.splits.length > 8) return [];
      const splits = metadata.splits.filter(split => ['top', 'bottom'].every(key => Number.isFinite(split?.bounds?.[key])) && split.bounds.top > split.bounds.bottom && ['x', 'y'].every(key => Number.isFinite(split.offset?.[key])));
      if (splits.length !== metadata.splits.length) return [];
      return [{ ...map, kind: 'boltobserv', metadata: { ...metadata, splits } }];
    }
    if (!Array.isArray(map.layers) || map.layers.length > 8) return [];
    const layers = map.layers.filter(layer => typeof layer?.id === 'string' && safePath(layer.image) && layer.image.endsWith('.png') &&
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
  const map = catalog?.find(map => map.map === canonicalMapName(mapName) && map.kind !== 'boltobserv');
  if (!map) return null;
  const layer = Number.isFinite(z) ? map.layers.find(layer => (layer.minZ == null || z >= layer.minZ) && (layer.maxZ == null || z < layer.maxZ)) : null;
  const selected = layer ?? map.layers.find(layer => layer.id === 'main') ?? map.layers[0];
  return { ...selected, sites: map.sites ?? [] };
}
async function loadCatalogFile(path, base, signal, fetchImpl) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 3000);
  let reader;
  try {
    if (signal.aborted) return [];
    const response = await fetchImpl(packageAsset(path, base), { signal: controller.signal, credentials: 'same-origin', cache: 'force-cache', redirect: 'error' });
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
export async function loadRadarCatalog(base, signal, fetchImpl = fetch) {
  const [boltobserv, fallback] = await Promise.all([
    loadCatalogFile('assets/boltobserv/catalog.json', base, signal, fetchImpl),
    loadCatalogFile('assets/radar/catalog.json', base, signal, fetchImpl),
  ]);
  return [...boltobserv, ...fallback];
}

export const rawWeapon = weapon => typeof weapon === 'string' ? weapon.replace(/^weapon_/i, '').toLowerCase() : rawWeapon(weapon?.name ?? '');
export function weaponLabel(weapon) {
  if (weapon == null || weapon === '') return '';
  const raw = rawWeapon(weapon);
  if (!raw) return 'Unknown weapon';
  if (raw.startsWith('knife') || raw === 'bayonet') return 'Knife';
  return ({ m4a1_silencer: 'M4A1-S', m4a1: 'M4A4', usp_silencer: 'USP-S', hkp2000: 'P2000', elite: 'Dual Berettas', hegrenade: 'HE grenade', smokegrenade: 'Smoke', flashbang: 'Flashbang', incgrenade: 'Incendiary', defuser: 'Defuse kit' })[raw] ?? raw.replace(/_/g, ' ').toUpperCase();
}
export const weaponAsset = (weapon, base) => {
  const raw = rawWeapon(weapon);
  return /^[a-z0-9_]+$/.test(raw) ? packageAsset(`assets/weapons/${raw}.svg`, base) : null;
};
