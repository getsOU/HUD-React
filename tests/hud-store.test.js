import test from 'node:test';
import assert from 'node:assert/strict';
import { createHudStore } from '../src/hud-store.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const calls = [], stopped = [];
  const client = {
    identity: { id: 'sou-basic-react', version: '0.1.0' },
    watch(receive, options) { calls.push({ channel: 'live', receive, ...options }); return () => stopped.push('live'); },
    watchPanel(receive, options) { calls.push({ channel: 'panel', receive, ...options }); return () => stopped.push('panel'); },
  };
  return { store: createHudStore(() => client), client, calls, stopped };
}
const snapshot = (sessionId, revision, game = null) => ({ schemaVersion: 2, sessionId, revision, game, freshness: 'live' });

test('subscribers share two streams and final cleanup cancels both', async () => {
  const { store, calls, stopped } = fixture();
  const first = store.subscribe(() => {}), second = store.subscribe(() => {});
  await tick();
  assert.equal(calls.length, 2);
  first();
  assert.equal(calls[0].signal.aborted, false);
  second(); second();
  assert.equal(calls[0].signal.aborted, true);
  assert.deepEqual(stopped, ['live', 'panel']);
});

test('StrictMode mount-cleanup-remount never opens abandoned asynchronous streams', async () => {
  const { store, calls } = fixture();
  const first = store.subscribe(() => {});
  first();
  const second = store.subscribe(() => {});
  await tick();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].signal.aborted, false);
  second();
});

test('new session replaces roster and managed data, old revisions cannot revert a session', async () => {
  const { store, calls } = fixture();
  const unsubscribe = store.subscribe(() => {});
  await tick();
  calls[0].receive(snapshot('first', 10, { players: [{ name: 'Old player' }] }));
  calls[0].receive(snapshot('first', 9, { players: [] }));
  assert.equal(store.getSnapshot().snapshot.revision, 10);
  calls[0].receive(snapshot('second', 1));
  assert.equal(store.getSnapshot().snapshot.game, null);
  assert.equal(store.getSnapshot().snapshot.sessionId, 'second');
  unsubscribe();
  calls[0].receive(snapshot('late', 99));
  assert.equal(store.getSnapshot().snapshot, null);
});

test('live connectivity and source freshness remain separate; protocol major is checked', async () => {
  const { store, calls } = fixture();
  const unsubscribe = store.subscribe(() => {});
  await tick();
  calls[0].status('live', 'connected');
  calls[0].receive({ ...snapshot('one', 1), freshness: 'stale' });
  assert.equal(store.getSnapshot().liveStatus, 'connected');
  assert.equal(store.getSnapshot().snapshot.freshness, 'stale');
  calls[0].receive({ schemaVersion: 3 });
  assert.equal(store.getSnapshot().snapshot, null);
  assert.equal(store.getSnapshot().message, 'Unsupported HUD protocol');
  unsubscribe();
});

test('only state from this installed identity changes panel settings; actions are not replayed', async () => {
  const { store, calls } = fixture();
  const unsubscribe = store.subscribe(() => {});
  await tick();
  const state = { revision: 0, values: { display: { hideRosters: true, caption: 'Finals' } } };
  calls[1].receive({ hudId: 'another', version: '0.1.0', state });
  assert.equal(store.getSnapshot().settings.showRosters, true);
  calls[1].receive({ hudId: 'sou-basic-react', version: '0.1.0', state });
  assert.equal(store.getSnapshot().settings.showRosters, false);
  calls[1].receive({ hudId: 'sou-basic-react', version: '0.1.0', action: { name: 'anything' } });
  assert.equal(store.getSnapshot().settings.caption, 'Finals');
  unsubscribe();
});

test('client initialization failure yields a safe local message and can remount', async () => {
  const store = createHudStore(() => { throw new Error('private request context'); });
  const unsubscribe = store.subscribe(() => {});
  await tick();
  assert.equal(store.getSnapshot().liveStatus, 'disconnected');
  assert.equal(store.getSnapshot().message, 'Open this HUD from sOU to connect');
  unsubscribe();
});
