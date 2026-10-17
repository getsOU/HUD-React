import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY, activeWeapon, clock, localPreviewMode, money, observerSlot, panelSettings,
  roster, samePlayer, statistic, teamName, time, weaponName,
} from '../src/model.js';

test('missing and invalid values remain unknown, zero remains meaningful', () => {
  for (const value of [null, undefined, NaN, Infinity, -1, '0']) {
    assert.equal(statistic(value), EMPTY);
    assert.equal(time(value), EMPTY);
    assert.equal(money(value), EMPTY);
  }
  assert.equal(statistic(0), 0);
  assert.equal(money(0), '$0');
  assert.equal(time(0), '0:00');
  assert.equal(time(83.1), '1:24');
});

test('panel absence is visible; only explicit true hide flags hide content', () => {
  assert.deepEqual(panelSettings(null), { caption: 'sOU BASIC', showRosters: true, showObservedPlayer: true });
  assert.deepEqual(panelSettings({ values: { display: { caption: '  Finals  ', hideRosters: true, hideObservedPlayer: true } } }),
    { caption: 'Finals', showRosters: false, showObservedPlayer: false });
  assert.equal(panelSettings({ values: { display: { hideRosters: 'true', hideObservedPlayer: 1 } } }).showRosters, true);
  assert.equal(panelSettings({ values: { display: { hideRosters: 'true', hideObservedPlayer: 1 } } }).showObservedPlayer, true);
});

test('team identity follows recognized explicit side resolution across a side swap', () => {
  const match = {
    teamA: { id: 'a', name: 'Alpha' }, teamB: { id: 'b', name: 'Bravo' },
    ct: { side: 'counterTerrorists', status: 'manual', teamId: 'b' },
    t: { side: 'terrorists', status: 'recognized', teamId: 'a' },
  };
  const snapshot = { managedMatch: match, game: null };
  assert.equal(teamName(snapshot, 'counterTerrorists'), 'Bravo');
  assert.equal(teamName(snapshot, 'terrorists'), 'Alpha');
  assert.equal(teamName({ game: { managedMatch: match } }, 'terrorists'), 'Alpha');
  match.ct.teamId = 'a'; match.t.teamId = 'b';
  assert.equal(teamName(snapshot, 'counterTerrorists'), 'Alpha');
  assert.equal(teamName(snapshot, 'terrorists'), 'Bravo');
});

test('ambiguous, conflicting, missing and wrong-side mappings never invent managed identity', () => {
  const base = { teamA: { id: 'a', name: 'Alpha' }, teamB: { id: 'b', name: 'Bravo' } };
  for (const status of ['unknown', 'noMatch', 'tied', 'conflicting', undefined]) {
    const snapshot = { managedMatch: { ...base, ct: { side: 'counterTerrorists', status, teamId: 'a' } } };
    assert.equal(teamName(snapshot, 'counterTerrorists'), 'CT');
  }
  assert.equal(teamName({ managedMatch: { ...base, ct: { side: 'terrorists', status: 'manual', teamId: 'a' } } }, 'counterTerrorists'), 'CT');
  assert.equal(teamName({ managedMatch: { ...base, ct: { side: 'counterTerrorists', status: 'manual', teamId: 'missing' } }, game: { ct: { name: 'Source CT' } } }, 'counterTerrorists'), 'Source CT');
});

test('clock uses explicit source countdown or bomb status without extrapolation', () => {
  assert.deepEqual(clock(null), { label: EMPTY, value: EMPTY, bomb: false });
  assert.deepEqual(clock({ countdown: { phase: 'freezeTime', secondsRemaining: 8.2 } }), { label: 'FREEZE TIME', value: '0:09', bomb: false });
  assert.deepEqual(clock({ bomb: { state: 'planted', secondsRemaining: 32.1 } }), { label: 'BOMB PLANTED', value: '0:33', bomb: true });
  assert.deepEqual(clock({ bomb: { state: 'unknown', secondsRemaining: 32 }, countdown: { phase: 'unknown' } }), { label: EMPTY, value: EMPTY, bomb: false });
});

test('active or reloading weapon is used; unknown names are displayed as received', () => {
  const reloading = { name: 'weapon_m4a1', state: 'reloading' };
  assert.equal(activeWeapon({ weapons: [{ state: 'holstered' }, reloading] }), reloading);
  assert.equal(weaponName(reloading), 'm4a1');
  assert.equal(weaponName({ name: 'future_source_weapon', kind: 'unknown' }), 'future_source_weapon');
  assert.equal(weaponName(null), EMPTY);
});

test('bomb and defuse countdowns retain bomb emphasis without a complete bomb object', () => {
  assert.deepEqual(clock({ countdown: { phase: 'bomb', secondsRemaining: 12.4 } }),
    { label: 'BOMB', value: '0:13', bomb: true });
  assert.deepEqual(clock({ countdown: { phase: 'defuse', secondsRemaining: 3.2 } }),
    { label: 'DEFUSE', value: '0:04', bomb: true });
  assert.deepEqual(clock({ bomb: { state: 'unknown' }, countdown: { phase: 'bomb', secondsRemaining: null } }),
    { label: 'BOMB', value: EMPTY, bomb: true });
});

test('roster omits unknown/spectator sides, sorts 1..9 then 0 and keeps unknown slots', () => {
  const players = [0, null, 2, 1].map((slot, i) => ({ steamId: `id-${i}`, observerSlot: slot, side: 'counterTerrorists' }));
  players.push({ side: 'unknown' }, { side: 'spectator' });
  assert.deepEqual(roster({ game: { players } }, 'counterTerrorists').map(p => p.observerSlot), [1, 2, 0, null]);
  assert.deepEqual(roster(null, 'terrorists'), []);
  assert.equal(observerSlot(0), '0');
  assert.equal(observerSlot(10), EMPTY);
  assert.equal(samePlayer({}, {}), false);
  assert.equal(samePlayer({ steamId: '1' }, { steamId: '1' }), true);
});

test('fixture gate requires both a development build and an explicit localhost URL', () => {
  assert.equal(localPreviewMode('http://127.0.0.1:5192/?preview=1', true), '1');
  assert.equal(localPreviewMode('http://localhost/?preview=bomb', true), 'bomb');
  assert.equal(localPreviewMode('http://127.0.0.1/?preview=1', false), null);
  assert.equal(localPreviewMode('https://www.getsou.app/?preview=1', true), null);
  assert.equal(localPreviewMode('http://127.0.0.1/', true), null);
});
