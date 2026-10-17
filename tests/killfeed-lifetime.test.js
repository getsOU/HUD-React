import test from 'node:test';
import assert from 'node:assert/strict';
import { createKillFeedTracker } from '../src/model/killfeed.js';
const events = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, connectionId: 'connection', epoch: 1 }));
const snapshot = (kills = events, sessionId = 'session', map = 'de_dust2') => ({ sessionId, game: { map, killFeed: kills } });

test('all twelve current events remain visible and repeated snapshots do not renew their lifetime', () => {
  const tracker = createKillFeedTracker();
  assert.equal(tracker.update(snapshot(), 1000).length, 12);
  assert.equal(tracker.update(snapshot(), 8999).length, 12);
  assert.equal(tracker.update(snapshot(), 9001).length, 0);
  assert.equal(tracker.read(10000).length, 0);
  assert.equal(tracker.update(snapshot([...events, { ...events[0], id: 13 }]), 10000).length, 1);
});

test('source removal, map, session and epoch resets clear prior event identities', () => {
  const tracker = createKillFeedTracker();
  tracker.update(snapshot(), 0);
  assert.deepEqual(tracker.update(snapshot([]), 100), []);
  assert.equal(tracker.update(snapshot(events, 'next'), 200).length, 12);
  assert.equal(tracker.update(snapshot(events, 'next', 'de_mirage'), 10000).length, 12);
  assert.equal(tracker.update(snapshot([{ ...events[0], epoch: 2 }], 'next', 'de_mirage'), 10001).length, 1);
  tracker.clear();
  assert.deepEqual(tracker.read(10002), []);
});
