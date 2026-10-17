import test from 'node:test';
import assert from 'node:assert/strict';
import { compactUtility } from '../src/model/showcase.js';

test('compact utility combines duplicate grenades without changing source inventory', () => {
  const weapons = [{ name: 'weapon_flashbang', type: 'grenade', ammoReserve: 1 }, { name: 'weapon_smokegrenade', type: 'grenade', ammoReserve: 1 }, { name: 'weapon_flashbang', type: 'grenade', ammoReserve: 1 }];
  const original = structuredClone(weapons);
  const items = compactUtility({ health: 100, weapons });
  assert.equal(items.length, 2);
  assert.equal(items.find(item => item.name === 'weapon_flashbang').ammoReserve, 2);
  assert.deepEqual(weapons, original);
});

test('unknown counts and death cannot become invented utility amounts', () => {
  const weapons = [{ name: 'weapon_flashbang', type: 'grenade', ammoReserve: 1 }, { name: 'weapon_flashbang', type: 'grenade', ammoReserve: null }];
  assert.equal(compactUtility({ health: 100, weapons })[0].ammoReserve, null);
  assert.deepEqual(compactUtility({ health: 0, weapons }), []);
});
