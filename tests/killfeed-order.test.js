import test from 'node:test';
import assert from 'node:assert/strict';
import { killEntries } from '../src/model/showcase.js';
const events = Array.from({length: 8}, (_,i)=>({id:i+1,connectionId:'connection',epoch:1,gameTimeSeconds:100+i}));
const snapshot = kills=>({sessionId:'session',game:{killFeed:kills}});
test('all current kills append below older rows without a six-row limit',()=>{
  assert.deepEqual(killEntries(snapshot(events.slice(0,1))).map(k=>k.id),[1]);
  assert.deepEqual(killEntries(snapshot(events.slice(0,3))).map(k=>k.id),[1,2,3]);
  assert.deepEqual(killEntries(snapshot(events)).map(k=>k.id),[1,2,3,4,5,6,7,8]);
  assert.deepEqual(events.map(k=>k.id),[1,2,3,4,5,6,7,8]);
});
test('event IDs can restart after a new epoch without losing stable event identity',()=>{
  const next=events.slice(0,2).map(e=>({...e,epoch:2}));
  assert.deepEqual(killEntries(snapshot(next)).map(k=>k.id),[1,2]);
  assert.notEqual(killEntries(snapshot(next))[0].key,killEntries(snapshot(events))[0].key);
});
