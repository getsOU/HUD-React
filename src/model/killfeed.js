/** The source owns event availability; the HUD does not impose a row limit. */
export function killEntries(snapshot) {
  const source = Array.isArray(snapshot?.game?.killFeed) ? snapshot.game.killFeed : [];
  const unique = new Map();
  for (const event of source) {
    if (!event || !event.connectionId || !Number.isInteger(event.epoch) || !Number.isInteger(event.id)) continue;
    const key = `${snapshot.sessionId}|${event.connectionId}|${event.epoch}|${event.id}`;
    unique.set(key, { ...event, key });
  }
  return [...unique.values()].sort((a, b) => a.id - b.id);
}

/** First receipt starts an eight-second lifetime; repeated snapshots never renew it. */
export function createKillFeedTracker() {
  let context = '';
  let entries = [];
  const firstSeen = new Map();
  const read = now => entries.filter(entry => now - firstSeen.get(entry.key) <= 8000);
  const clear = () => { context = ''; entries = []; firstSeen.clear(); };
  return {
    read,
    clear,
    update(snapshot, now) {
      const latest = snapshot?.game?.killFeed?.at(-1);
      const incoming = killEntries(snapshot).filter(event => event.connectionId === latest?.connectionId && event.epoch === latest?.epoch);
      const next = JSON.stringify([snapshot?.sessionId, snapshot?.game?.map, latest?.connectionId, latest?.epoch]);
      if (context !== next) { clear(); context = next; }
      const keys = new Set(incoming.map(entry => entry.key));
      for (const key of firstSeen.keys()) if (!keys.has(key)) firstSeen.delete(key);
      for (const key of keys) if (!firstSeen.has(key)) firstSeen.set(key, now);
      entries = incoming;
      return read(now);
    },
  };
}
