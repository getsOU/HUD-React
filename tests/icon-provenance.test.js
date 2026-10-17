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

test('optical geometry stays bound to the unchanged original SVGs and covers all artwork', () => {
  const geometry=JSON.parse(readFileSync(new URL('../docs/cs2-icon-geometry.json',import.meta.url),'utf8')).icons;
  const files=JSON.parse(readFileSync(new URL('../public/assets/valve-assets.json',import.meta.url),'utf8')).files.filter(f=>/assets\/(weapons|ui|killfeed)\/.*\.svg$/.test(f.path));
  assert.deepEqual(geometry.map(g=>g.key).sort(),files.map(f=>f.path.replace(/^assets\//,'').replace(/\.svg$/,'')).sort());
  for(const g of geometry){const f=files.find(f=>f.path==='assets/'+g.key+'.svg');assert.equal(g.sha256,f.sha256,g.key);if(!g.empty){assert.ok(g.x>=0&&g.y>=0&&g.width>0&&g.height>0&&g.x+g.width<=1.000001&&g.y+g.height<=1.000001,g.key);}}
});
