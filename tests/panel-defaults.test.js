import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { panelSettings } from '../src/model.js';
import { createPreviewClient } from '../src/preview/fixture.js';

const schema = JSON.parse(readFileSync(new URL('../public/panel.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../hud.json', import.meta.url), 'utf8'));
const coreSettings = state => {
  const { caption, showRosters, showObservedPlayer } = panelSettings(state);
  return { caption, showRosters, showObservedPlayer };
};

// The public host emits every schema field: missing checkboxes become false, text becomes ''.
// Read the actual shipped schema so replacing a hide checkbox with a show checkbox regresses here.
function hostState(saved = {}, revision = 0) {
  return {
    revision,
    values: Object.fromEntries(schema.map(section => [section.name,
      Object.fromEntries(section.inputs.filter(field => field.type !== 'action').map(field => {
        assert.ok(['text', 'checkbox', 'select', 'player', 'team', 'match', 'image', 'images'].includes(field.type), `Unmodeled panel field: ${field.type}`);
        return [field.name, saved[section.name]?.[field.name] ?? (field.type === 'checkbox' ? false : field.type === 'images' ? [] : '')];
      })),
    ])),
  };
}

test('shipped panel schema uses independent hide checkboxes with visible host defaults', () => {
  const display = schema.find(section => section.name === 'display');
  assert.deepEqual(display.inputs.filter(field => field.type === 'checkbox').map(field => field.name),
    ['hideRosters', 'hideObservedPlayer', 'hideRadar', 'hideKillfeed', 'hideEconomy', 'hideRoundHistory', 'hideSeries', 'hideSponsors']);
  assert.equal(display.inputs.some(field => ['showRosters', 'showObservedPlayer'].includes(field.name)), false);
  const state = hostState();
  assert.ok(Object.entries(state.values.display).every(([key, value]) => key.startsWith('hide') ? value === false : value === ''));
  assert.deepEqual(coreSettings(state), { caption: 'sOU BASIC', showRosters: true, showObservedPlayer: true });
  const settings = panelSettings(state);
  for (const key of ['showRadar', 'showKillfeed', 'showEconomy', 'showRoundHistory', 'showSeries', 'showSponsors']) assert.equal(settings[key], true);
});

test('caption-only save keeps both components visible after host normalization', () => {
  const state = hostState({ display: { caption: 'Finals' } }, 1);
  assert.deepEqual(coreSettings(state), { caption: 'Finals', showRosters: true, showObservedPlayer: true });
});

test('hide fields are independent and saving false makes each component visible again', () => {
  const options = (hideRosters, hideObservedPlayer) =>
    coreSettings(hostState({ display: { hideRosters, hideObservedPlayer } }, 2));
  assert.deepEqual(options(true, false), { caption: 'sOU BASIC', showRosters: false, showObservedPlayer: true });
  assert.deepEqual(options(false, true), { caption: 'sOU BASIC', showRosters: true, showObservedPlayer: false });
  assert.deepEqual(options(true, true), { caption: 'sOU BASIC', showRosters: false, showObservedPlayer: false });
  assert.deepEqual(options(false, false), { caption: 'sOU BASIC', showRosters: true, showObservedPlayer: true });
});

test('compatible caption survives a version update while legacy visibility fields are ignored', () => {
  const previous = { display: { caption: 'Existing caption', showRosters: false, showObservedPlayer: false } };
  assert.deepEqual(coreSettings(hostState(previous)),
    { caption: 'Existing caption', showRosters: true, showObservedPlayer: true });
});

test('local preview identity and initial panel defaults match the current package', () => {
  const client = createPreviewClient('1');
  assert.deepEqual(client.identity, { id: manifest.id, version: manifest.version });
  let message;
  client.watchPanel(value => { message = value; }, { signal: new AbortController().signal, status() {} });
  assert.equal(message.hudId, manifest.id);
  assert.equal(message.version, manifest.version);
  assert.deepEqual(coreSettings(message.state),
    { caption: 'sOU BASIC · PREVIEW', showRosters: true, showObservedPlayer: true });
});
