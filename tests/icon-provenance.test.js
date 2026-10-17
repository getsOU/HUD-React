import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
test('every original icon and added round-result SVG matches the shipped provenance', () => {
  const inventory = readFileSync(new URL('../public/assets/valve-assets.json', import.meta.url), 'utf8');
  assert.equal(inventory,readFileSync(new URL('../licenses/valve-assets.json', import.meta.url),'utf8'));
  const files=JSON.parse(inventory).files;
  for(const path of ['assets/ui/clock.svg','assets/ui/hostage_rescued.svg','assets/weapons/flashbang_assist.svg']) assert.ok(files.some(f=>f.path===path));
  for(const f of files){const bytes=readFileSync(new URL('../public/'+f.path,import.meta.url));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);}
});
