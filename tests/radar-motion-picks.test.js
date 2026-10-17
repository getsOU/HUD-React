import test from 'node:test';
import assert from 'node:assert/strict';
import { radarView } from '../src/model/showcase.js';
import { mapPick } from '../src/model/broadcast.js';

test('fresh HLAE is one source and marker identity survives reordered ordinary frames', () => {
  const now = Date.now(), player = { steamId: 'one', health: 100, position: { x: 900, y: 900, z: 0 } };
  const source = { sessionId: 'session', game: { map: 'de_test', roundNumber: 1, players: [player, { ...player, steamId: 'two' }], radar: { connectionId: 'radar', epoch: 1, sequence: 1, gameTimeSeconds: 10, receivedAt: new Date(now).toISOString(), players: [{ steamId: 'one', position: { x: 0, y: 0, z: 0 }, health: 100 }] } } };
  const first = radarView(source, {}, now);
  assert.deepEqual(first.players.map(p => p.key), ['one']);
  source.game.players.reverse(); source.game.radar.sequence++;
  source.game.radar.players[0].position.x = 100;
  assert.equal(radarView(source, {}, now + 50).players[0].motionKey, first.players[0].motionKey);
  const stale = radarView(source, {}, now + 751);
  assert.equal(stale.players.length, 2);
  assert.notEqual(stale.players.find(p => p.key === 'one').motionKey, first.players[0].motionKey);
});

test('map picks follow explicit veto identities and never current CT/T or map order', () => {
  const map = { id: 'map', number: 1, gameName: 'de_mirage' };
  const decision = { mapId: 'map', gameName: 'de_mirage', type: 'pick', teamId: 'A', playNumber: 1 };
  const source = { managedMatch: { teamA: { id: 'A', name: 'Alpha', shortName: 'ALP' }, teamB: { id: 'B', name: 'Bravo' }, ct: { teamId: 'B' }, t: { teamId: 'A' }, vetos: [decision] } };
  assert.deepEqual(mapPick(source, map), { label: 'PICK · ALP', description: 'Picked by Alpha' });
  source.managedMatch.vetos = [{ ...decision, type: 'decider', teamId: null }];
  assert.equal(mapPick(source, map).label, 'DECIDER');
  source.managedMatch.vetos = [{ ...decision, teamId: 'foreign' }];
  assert.equal(mapPick(source, map).label, 'Pick unassigned');
  source.managedMatch.vetos = [decision, { ...decision, teamId: 'B' }];
  assert.equal(mapPick(source, map).label, 'Pick unknown');
  source.managedMatch.vetos = [];
  assert.equal(mapPick(source, map).label, 'Pick unknown');
});
