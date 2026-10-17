import { number, roster, sideTeam, text } from '../model.js';
import { metadataKey } from './metadata.js';
import { canonicalMapName, radarLayer } from './assets.js';
import { sourceName } from './source-name.js';
import { boltMarkerScale, boltPoint } from './boltobserv.js';
export { SCENES, sceneFor } from './panel.js';

export const matchOf = snapshot => snapshot?.managedMatch ?? snapshot?.game?.managedMatch ?? null;
export const currentMetadata = (snapshot, metadata) => metadata?.key === metadataKey(snapshot) ? metadata : null;
export const profileFor = (snapshot, metadata, steamId, reference = null) => currentMetadata(snapshot, metadata)?.players?.[steamId]
  ?? (typeof steamId === 'string' && steamId && reference?.id === steamId && reference.missing !== true ? { name: reference.name, avatar: reference.image } : null);
export const playerName = (player, profile) => text(profile?.name, text(sourceName(player?.name)));
export const weaponList = player => Array.isArray(player?.weapons) ? player.weapons.filter(Boolean) : [];
export const utility = player => weaponList(player).filter(weapon => weapon.type === 'grenade');
export const hasBomb = player => weaponList(player).some(weapon => weapon.type === 'bomb' || weapon.kind === 'c4');

export function teamLineup(snapshot, metadata, teamId) {
  const match = matchOf(snapshot);
  if (!match || ![match.teamA?.id, match.teamB?.id].includes(teamId)) return [];
  const available = currentMetadata(snapshot, metadata);
  const ids = available?.teams?.[teamId]?.steamIds;
  if (ids?.length) return ids.map(steamId => ({
    steamId, player: snapshot?.game?.players?.find(p => p.steamId === steamId) ?? null,
    profile: available.players[steamId] ?? null,
  }));
  const side = sideTeam(snapshot, 'counterTerrorists')?.id === teamId ? 'counterTerrorists'
    : sideTeam(snapshot, 'terrorists')?.id === teamId ? 'terrorists' : null;
  return side ? roster(snapshot, side).map(player => ({ steamId: player.steamId, player, profile: null })) : [];
}

export function aliveSummary(snapshot, side) {
  const players = roster(snapshot, side);
  const known = players.filter(p => number(p.health) !== null);
  return {
    alive: known.filter(p => p.health > 0).length, known: known.length, total: players.length,
    complete: players.length > 0 && known.length === players.length && snapshot?.game?.availableSections?.includes('allPlayers') === true &&
      !snapshot.game.players.some(p => !['counterTerrorists', 'terrorists', 'spectator'].includes(p?.side)),
  };
}

export function economy(snapshot, side) {
  const players = roster(snapshot, side);
  const sum = field => {
    const known = players.map(p => number(p[field])).filter(value => value !== null);
    return { value: known.length ? known.reduce((a, b) => a + b, 0) : null, known: known.length, total: players.length,
      complete: players.length > 0 && known.length === players.length && snapshot?.game?.availableSections?.includes('allPlayers') === true &&
        !snapshot.game.players.some(p => !['counterTerrorists', 'terrorists', 'spectator'].includes(p?.side)) };
  };
  return { cash: sum('money'), equipment: sum('equipmentValue'), alive: aliveSummary(snapshot, side),
    kits: players.filter(p => p.defuseKit === true).length, kitsKnown: players.filter(p => typeof p.defuseKit === 'boolean').length,
    utilities: players.reduce((count, player) => count + utility(player).length, 0), inventoriesKnown: players.filter(p => Array.isArray(p.weapons)).length };
}

export function playerCoverage(player) {
  const recorded = player?.recordedStats;
  if (!recorded || !Number.isInteger(recorded.rounds) || recorded.rounds <= 0) return { adr: null, hs: null, label: 'No recorded rounds' };
  return { adr: number(recorded.averageDamagePerRound), hs: number(recorded.headshotPercentage),
    label: `${recorded.rounds} recorded rounds · ${recorded.coversWholeMatch === true ? 'whole match covered' : 'partial coverage'}` };
}

export function mapSeries(snapshot) {
  const maps = matchOf(snapshot)?.maps;
  return (Array.isArray(maps) ? maps : []).map((map, index) => ({ ...map, sourceIndex: index }))
    .sort((a, b) => (number(a.number) ?? Infinity) - (number(b.number) ?? Infinity) || a.sourceIndex - b.sourceIndex);
}
export function vetoEntries(snapshot) {
  const match = matchOf(snapshot);
  return (Array.isArray(match?.vetos) ? match.vetos : []).map((veto, index) => ({ ...veto, sourceIndex: index,
    team: [match.teamA, match.teamB].find(team => team?.id === veto.teamId) ?? null }))
    .sort((a, b) => (number(a.number) ?? Infinity) - (number(b.number) ?? Infinity) || a.sourceIndex - b.sourceIndex);
}

/** Only a conventional, completed, internally consistent best-of series can declare a winner. */
export function seriesWinner(snapshot) {
  const match = matchOf(snapshot);
  if (!match || !match.teamA?.id || !match.teamB?.id || match.teamA.id === match.teamB.id ||
    !Number.isInteger(match.bestOf) || match.bestOf < 1 || match.bestOf % 2 === 0) return null;
  const required = Math.floor(match.bestOf / 2) + 1;
  const completed = mapSeries(snapshot).filter(map => map.status === 'completed');
  if (completed.length > match.bestOf || completed.some(map => ![match.teamA.id, match.teamB.id].includes(map.winnerTeamId))) return null;
  const winsA = completed.filter(map => map.winnerTeamId === match.teamA.id).length;
  const winsB = completed.filter(map => map.winnerTeamId === match.teamB.id).length;
  if (match.teamA.seriesWins !== winsA || match.teamB.seriesWins !== winsB) return null;
  return winsA >= required && winsB < required ? match.teamA : winsB >= required && winsA < required ? match.teamB : null;
}

export function killEntries(snapshot) {
  const events = Array.isArray(snapshot?.game?.killFeed) ? snapshot.game.killFeed : [];
  const seen = new Set();
  return events.filter(event => {
    if (!event || !event.connectionId || !Number.isInteger(event.epoch) || !Number.isInteger(event.id)) return false;
    const key = `${snapshot.sessionId}|${event.connectionId}|${event.epoch}|${event.id}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(-6).map(event => ({ ...event, key: `${snapshot.sessionId}|${event.connectionId}|${event.epoch}|${event.id}` }));
}

const point = value => value && ['x', 'y', 'z'].every(key => typeof value[key] === 'number' && Number.isFinite(value[key]));
const numeric = value => typeof value === 'string' && value.trim().length ? Number(value) : NaN;

/** Public source/timeline adapter; Boltobserv geometry is attributed in model/boltobserv.js. */
export function radarView(snapshot, config = {}, now = Date.now(), timelineAccepted = true, catalog = [], radarFlashes = []) {
  const game = snapshot?.game;
  const radar = game?.radar;
  const received = Date.parse(radar?.receivedAt);
  const age = now - received;
  const fresh = timelineAccepted && radar && Number.isFinite(age) && age >= 0 && age <= 750 &&
    typeof radar.connectionId === 'string' && radar.connectionId.length > 0 && Number.isInteger(radar.epoch) && radar.epoch >= 0 &&
    Number.isInteger(radar.sequence) && radar.sequence >= 0 && Number.isFinite(radar.gameTimeSeconds);
  const poses = new Map(fresh && Array.isArray(radar.players) ? radar.players
    .filter(p => typeof p?.steamId === 'string' && p.steamId.length > 0).map(p => [p.steamId, p]) : []);
  const players = (Array.isArray(game?.players) ? game.players : []).flatMap((player, index) => {
    const pose = poses.get(player.steamId);
    const position = point(pose?.position) ? pose.position : player.position;
    return point(position) ? [{ player, key: `${player.steamId ?? 'unknown'}-${index}`, position, usesHlae: point(pose?.position),
      forward: point(pose?.forward) ? pose.forward : player.forward, dead: (number(pose?.health) ?? number(player.health)) === 0 }] : [];
  });
  const bomb = point(game?.bomb?.position) ? game.bomb : null;
  const allGrenades = (Array.isArray(game?.grenades) ? game.grenades : []).filter(Boolean);
  const grenades = allGrenades.filter(grenade => point(grenade.position));
  const flames = allGrenades.flatMap(grenade => (Array.isArray(grenade.flames) ? grenade.flames : [])
    .filter(flame => point(flame?.position)).map(flame => ({ ...flame, key: `${grenade.id}-${flame.id}` })));
  const limits = Object.fromEntries(['minX', 'maxX', 'minY', 'maxY'].map(key => [key, numeric(config[key])]));
  const custom = Boolean(config.overview && config.mapName === game?.map && Object.values(limits).every(Number.isFinite) &&
    Number.isFinite(limits.maxX - limits.minX) && Number.isFinite(limits.maxY - limits.minY) && limits.maxX > limits.minX && limits.maxY > limits.minY);
  const observedPose = poses.get(game?.observedPlayer?.steamId);
  const observedZ = point(observedPose?.position) ? observedPose.position.z : game?.observedPlayer?.position?.z;
  const bolt = custom ? null : catalog.find(map => map.map === canonicalMapName(game?.map) && map.kind === 'boltobserv');
  const layer = custom || bolt ? null : radarLayer(catalog, game?.map, observedZ);
  const calibrated = custom || layer !== null || Boolean(bolt);
  let bounds = limits;
  if (layer) bounds = { minX: layer.posX, maxX: layer.posX + layer.width * layer.scale, maxY: layer.posY, minY: layer.posY - layer.height * layer.scale };
  if (!calibrated) {
    const positions = [...players.map(p => p.position), ...(bomb ? [bomb.position] : []), ...grenades.map(g => g.position), ...flames.map(f => f.position)];
    const xs = positions.map(p => p.x), ys = positions.map(p => p.y);
    const left = xs.length ? Math.min(...xs) : 0, right = xs.length ? Math.max(...xs) : 0;
    const bottom = ys.length ? Math.min(...ys) : 0, top = ys.length ? Math.max(...ys) : 0;
    const span = Math.max(1024, right - left, top - bottom) * 1.2;
    bounds = { minX: (left + right - span) / 2, maxX: (left + right + span) / 2, minY: (bottom + top - span) / 2, maxY: (bottom + top + span) / 2 };
  }
  const project = position => {
    if (!point(position)) return null;
    const { x, y } = bolt ? boltPoint(position, bolt.metadata) : {
      x: (position.x - bounds.minX) / (bounds.maxX - bounds.minX) * 100,
      y: (bounds.maxY - position.y) / (bounds.maxY - bounds.minY) * 100,
    };
    return x >= 0 && x <= 100 && y >= 0 && y <= 100 ? { x, y } : null;
  };
  const projected = players.flatMap(marker => {
    const at = project(marker.position);
    if (!at) return [];
    const forward = marker.forward;
    const direction = point(forward) && (forward.x !== 0 || forward.y !== 0)
      ? bolt ? Math.atan2(-forward.y, forward.x) * 180 / Math.PI : Math.atan2(-forward.y / (bounds.maxY - bounds.minY), forward.x / (bounds.maxX - bounds.minX)) * 180 / Math.PI : null;
    return [{ ...marker, ...at, direction, scale: bolt ? boltMarkerScale(marker.position.z, bolt.metadata) : .7,
      observed: Boolean(marker.player.steamId && marker.player.steamId === game?.observedPlayer?.steamId),
      flashed: number(marker.player.flashed) > 31, bombCarrier: hasBomb(marker.player) || Boolean(marker.player.steamId && game?.bomb?.state === 'carried' && game.bomb.playerSteamId === marker.player.steamId),
      otherFloor: layer && ((layer.minZ != null && marker.position.z < layer.minZ) || (layer.maxZ != null && marker.position.z >= layer.maxZ)) }];
  });
  const hlaePlayers = players.filter(player => player.usesHlae).length;
  return { calibrated, kind: bolt ? 'boltobserv' : custom ? 'custom' : layer ? 'valve' : 'unavailable',
    overview: custom ? config.overview : bolt?.image ?? layer?.image ?? null, packagedOverview: Boolean(bolt || layer), layer: layer?.id, sites: layer?.sites ?? [],
    buyzones: bolt?.buyzones ?? null, logos: bolt?.logos ?? null, worldUnitScale: bolt ? 100 / (bolt.metadata.resolution * 1024) : 100 / (bounds.maxX - bounds.minX),
    source: hlaePlayers > 0 ? hlaePlayers === players.length ? 'HLAE · fresh' : 'HLAE + GSI' : 'GSI',
    label: calibrated ? bolt ? `${bolt.name} · Boltobserv` : `${text(game.map)} · ${custom ? 'configured overview' : layer.id}` : 'Map unavailable · relative positions', players: projected,
    bomb: bomb && project(bomb.position) ? { ...bomb, ...project(bomb.position) } : null,
    grenades: grenades.flatMap(grenade => { const at = project(grenade.position); return at ? [{ ...grenade, ...at, side: game.players?.find(player => player.steamId === grenade.ownerSteamId)?.side }] : []; }),
    flashes: radarFlashes.flatMap(flash => { const at = project(flash.position); return at ? [{ ...flash, ...at }] : []; }),
    flames: flames.flatMap(flame => { const at = project(flame.position); return at ? [{ ...at, id: flame.key }] : []; }) };
}

export function startCountdown(snapshot, now) {
  const start = Date.parse(matchOf(snapshot)?.startsAt);
  if (!Number.isFinite(start)) return null;
  const remaining = (start - now) / 1000;
  return remaining > 0 ? remaining : 0;
}
