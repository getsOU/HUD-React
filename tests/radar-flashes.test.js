import test from 'node:test';
import assert from 'node:assert/strict';
import { createRadarFlashTracker } from '../src/model/radar-flashes.js';
import { radarView } from '../src/model/showcase.js';

const source = (id = 'flash-1') => ({ sessionId: 'session', game: { map: 'de_example', roundNumber: 1, grenades: [{ id, type: 'flashbang', lifetimeSeconds: 1.5, effectTimeSeconds: null, position: { x: 0, y: 0, z: 0 } }] } });

test('original flash pulse uses 100/1200/2200 milliseconds without repeated-ID extensions', () => {
  const tracker = createRadarFlashTracker(), snapshot = source();
  assert.equal(tracker.update(snapshot, 1000)[0].phase, 'pending');
  assert.equal(tracker.read(1099)[0].phase, 'pending');
  assert.equal(tracker.read(1100)[0].phase, 'full');
  snapshot.game.grenades[0].position.x = 80;
  const repeat = tracker.update(snapshot, 2100);
  assert.equal(repeat[0].startedAt, 1000); assert.equal(repeat[0].position.x, 0);
  assert.equal(tracker.read(2199)[0].phase, 'full');
  assert.equal(tracker.read(2200)[0].phase, 'hide');
  assert.equal(tracker.read(3199)[0].phase, 'hide');
  assert.deepEqual(tracker.read(3200), []);
  assert.deepEqual(tracker.update(snapshot, 5000), []);
});

test('flash tail survives disappearance of the source grenade and resets per session/map/round', () => {
  for (const change of [value => { value.sessionId = 'new-session'; }, value => { value.game.map = 'de_other'; }, value => { value.game.roundNumber = 2; }]) {
    const tracker = createRadarFlashTracker(), snapshot = source();
    tracker.update(snapshot, 1000); snapshot.game.grenades = [];
    assert.equal(tracker.update(snapshot, 1500)[0].phase, 'full');
    change(snapshot); assert.deepEqual(tracker.update(snapshot, 1500), []);
    snapshot.game.grenades = source().game.grenades;
    assert.equal(tracker.update(snapshot, 1600)[0].startedAt, 1600);
  }
});

test('tracker requires a real detonated flash ID and finite source position', () => {
  const tracker = createRadarFlashTracker(), snapshot = source();
  snapshot.game.grenades[0].lifetimeSeconds = .5;
  assert.deepEqual(tracker.update(snapshot, 1000), []);
  snapshot.game.grenades[0].lifetimeSeconds = 1.5; snapshot.game.grenades[0].position.z = NaN;
  assert.deepEqual(tracker.update(snapshot, 1100), []);
  snapshot.game.grenades[0].position.z = 0;
  assert.equal(tracker.update(snapshot, 1200).length, 1);
  tracker.clear(); assert.deepEqual(tracker.read(1300), []);
});

test('flash collection and deduplication remain bounded within a round', () => {
  const tracker = createRadarFlashTracker(), snapshot = source();
  snapshot.game.grenades = Array.from({ length: 1000 }, (_, i) => ({ ...source(`flash-${i}`).game.grenades[0] }));
  assert.equal(tracker.update(snapshot, 1000).length, 64);
  assert.deepEqual(tracker.update(snapshot, 5000), []);
  snapshot.game.roundNumber = 2;
  assert.equal(tracker.update(snapshot, 6000).length, 64);
});

test('tracked flashes project the retained world point with the current exact calibration', () => {
  const tracker = createRadarFlashTracker(), snapshot = source();
  const flashes = tracker.update(snapshot, 1000);
  const view = radarView(snapshot, { overview: '/cast-media/map.png', mapName: 'de_example', minX: '-100', maxX: '100', minY: '-100', maxY: '100' }, 1100, true, [], flashes);
  assert.equal(view.flashes[0].x, 50); assert.equal(view.flashes[0].y, 50);
});
