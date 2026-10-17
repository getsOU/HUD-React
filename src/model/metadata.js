const boundedText = (value, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const id = value => typeof value === 'string' && value.length > 0 && value.length <= 128;
const matchOf = snapshot => snapshot?.managedMatch ?? snapshot?.game?.managedMatch;

export function metadataKey(snapshot) {
  const match = matchOf(snapshot);
  return match?.id && match.teamA?.id && match.teamB?.id
    ? [snapshot.sessionId, match.id, match.teamA.id, match.teamB.id].join('|') : null;
}

/** A narrow reader, independent of private host DTOs. Never trusts unrelated match profiles. */
export function adaptOptions(payload, snapshot, now = Date.now()) {
  const match = matchOf(snapshot);
  const sides = [payload?.match?.left, payload?.match?.right];
  const expected = [match?.teamA?.id, match?.teamB?.id];
  if (!metadataKey(snapshot) || expected[0] === expected[1] ||
    !sides.every(team => team && expected.includes(team.id)) || sides[0].id === sides[1].id) return null;
  const teams = Object.fromEntries(sides.map(team => [team.id, {
    id: team.id, name: boundedText(team.name), shortName: boundedText(team.shortName, 40), logo: boundedText(team.logo, 256),
    steamIds: [...new Set((Array.isArray(team.steamIds) ? team.steamIds : []).filter(id))].slice(0, 64),
  }]));
  const allowed = new Set(Object.values(teams).flatMap(team => team.steamIds));
  if (teams[expected[0]].steamIds.some(steamId => teams[expected[1]].steamIds.includes(steamId))) return null;
  for (const player of snapshot.game?.players ?? []) if (id(player?.steamId)) allowed.add(player.steamId);
  const players = Object.fromEntries([...allowed].slice(0, 256).flatMap(steamId => {
    const source = payload?.players?.[steamId];
    return source && typeof source === 'object' ? [[steamId, {
      name: boundedText(source.name), avatar: boundedText(source.avatar, 256),
      // Retained only as metadata. A profile camera URL is never embedded by this HUD.
      camera: boundedText(source.camera, 512),
    }]] : [];
  }));
  return { key: metadataKey(snapshot), teams, players, receivedAt: now };
}

export async function readOptionsResponse(response, limit = 256 * 1024) {
  if (!response.ok) throw new Error('Optional metadata unavailable.');
  const length = Number(response.headers?.get('content-length'));
  if (Number.isFinite(length) && length > limit) throw new Error('Optional metadata exceeds its size limit.');
  if (!response.body?.getReader) throw new Error('Streaming metadata response required.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let count = 0, body = '';
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      count += part.value.byteLength;
      if (count > limit) throw new Error('Optional metadata exceeds its size limit.');
      body += decoder.decode(part.value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body);
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

/** One bounded, same-origin request at a time. Failure never changes live connectivity. */
export function startMetadataPolling({ address, signal, snapshot, receive, fetchImpl = fetch, intervalMs = 2000, timeoutMs = 3000 }) {
  const origin = new URL(address);
  const endpoint = new URL('/hud-browser/options', origin);
  let timer, request, stopped = false;
  const stop = () => { stopped = true; clearTimeout(timer); request?.abort(); };
  signal.addEventListener('abort', stop, { once: true });
  async function poll() {
    if (stopped || signal.aborted) return;
    const before = snapshot();
    const key = metadataKey(before);
    if (key) {
      request = new AbortController();
      const timeout = setTimeout(() => request?.abort(), timeoutMs);
      try {
        const response = await fetchImpl(endpoint.href, { credentials: 'same-origin', signal: request.signal, cache: 'no-store' });
        const payload = await readOptionsResponse(response);
        if (!stopped && !signal.aborted && key === metadataKey(snapshot())) receive(adaptOptions(payload, snapshot()));
      } catch { if (!stopped && !signal.aborted && key === metadataKey(snapshot())) receive(null); }
      finally { clearTimeout(timeout); request = null; }
    }
    if (!stopped && !signal.aborted) { timer = setTimeout(poll, intervalMs); timer.unref?.(); }
  }
  void poll();
  return () => { stop(); signal.removeEventListener('abort', stop); };
}
