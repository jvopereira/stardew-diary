import test from 'node:test';
import assert from 'node:assert/strict';
import { fishingCatalog } from '../scripts/data/fishing.js';
import { collections, collectionById } from '../scripts/data/collections.js';
import { fishSaveIds } from '../scripts/data/fish-save-ids.js';
import { parseSaveXml, readSaveFile, MAX_SAVE_BYTES, SaveFormatError } from '../scripts/save-parser.js';
import { isRecorded, statusSource, toggleManual, undoManualChanges, restoreInitialProgress, replaceImportedProgress, progressSummary, loadSavedProgress, PROGRESS_STORAGE_KEY, createProgressStore } from '../scripts/progress.js';

const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, String(value)),
  removeItem: (key) => stored.delete(key),
};

function node(localName, textContent = '', children = []) {
  return { localName, namespaceURI: null, textContent, children };
}
function save({ version = '1.6.15', items = [['(O)128', '2'], ['SeaJelly', '1']], fish = true } = {}) {
  const fishNode = node('fishCaught', '', items.map(([id, count]) => node('item', '', [
    node('key', '', [node('string', id)]),
    node('value', '', [node('ArrayOfInt', '', [node('int', count)])]),
  ])));
  return { documentElement: node('SaveGame', '', [node('gameVersion', version), node('player', '', fish ? [fishNode] : [])]), doctype: null, querySelector: () => null };
}
let parsedDocument = save();
globalThis.DOMParser = class { parseFromString() { return parsedDocument; } };

test('all catalog IDs have unique save keys', () => {
  assert.equal(fishingCatalog.entries.length, 72);
  assert.deepEqual(new Set(fishingCatalog.entries.map((entry) => entry.id)), new Set(Object.keys(fishSaveIds)));
  assert.equal(new Set(Object.values(fishSaveIds)).size, 72);
});

test('only implemented fishing is registered with its own filters and completion IDs', () => {
  assert.deepEqual(collections.map((collection) => collection.id), ['fishing']);
  const collection = collectionById('fishing');
  assert.deepEqual(new Set(collection.completion.requiredIds), new Set(collection.entries.map((entry) => entry.id)));
  assert.deepEqual(collection.filters, ['search', 'season', 'method', 'status']);
  assert.equal(collection.filterEntries, collectionById('fishing').filterEntries);
});

test('a separate collection progress store does not change fishing progress', () => {
  restoreInitialProgress();
  const other = createProgressStore({ id: 'test-collection', completion: { requiredIds: ['sample'] } });
  assert.equal(other.toggleManual('sample'), true);
  assert.equal(other.progressSummary(['sample']).missing, 0);
  assert.equal(isRecorded('goby'), false);
  assert.equal(stored.has(PROGRESS_STORAGE_KEY), false);
  assert.deepEqual(JSON.parse(stored.get('diario-do-vale-progress-test-collection-v1')), { v: 1, base: null, add: ['sample'], remove: [] });
  other.restoreInitialProgress();
});

test('parses positive fish counts and qualified IDs', () => {
  parsedDocument = save();
  const result = parseSaveXml('<SaveGame/>');
  assert.equal(result.version, '1.6.15');
  assert.deepEqual(result.recordedIds, new Set(['pufferfish', 'sea-jelly']));
});

test('rejects unsupported, malformed, and entity-bearing input', () => {
  parsedDocument = save({version:'1.5.6'});
  assert.throws(() => parseSaveXml('<SaveGame/>'), SaveFormatError);
  parsedDocument = save({fish:false});
  assert.throws(() => parseSaveXml('<SaveGame/>'), SaveFormatError);
  parsedDocument = save({items:[['UnknownModFish','2']]});
  assert.throws(() => parseSaveXml('<SaveGame/>'), SaveFormatError);
  parsedDocument = save();
  assert.throws(() => parseSaveXml('<!DOCTYPE SaveGame><SaveGame/>'), SaveFormatError);
});

test('rejects empty, oversized, and compressed files before parsing', async () => {
  await assert.rejects(readSaveFile({name:'farm_1',size:0,text:async()=>''}), SaveFormatError);
  await assert.rejects(readSaveFile({name:'farm_1',size:MAX_SAVE_BYTES+1,text:async()=>''}), SaveFormatError);
  await assert.rejects(readSaveFile({name:'backup.zip',size:100,text:async()=>''}), SaveFormatError);
});

test('failed parse leaves progress unchanged; valid replacement clears manual changes', () => {
  replaceImportedProgress(new Set(['pufferfish']), '1.6.15');
  toggleManual('goby');
  const before = progressSummary(['pufferfish','goby']);
  parsedDocument = save({version:'1.5.6'});
  assert.throws(() => parseSaveXml('<SaveGame/>'), SaveFormatError);
  assert.deepEqual(progressSummary(['pufferfish','goby']), before);
  replaceImportedProgress(new Set(['sea-jelly']), '1.6.15');
  assert.equal(isRecorded('goby'), false);
  assert.equal(isRecorded('sea-jelly'), true);
  assert.equal(isRecorded('pufferfish'), false);
});


test('manual adjustments can be undone without replacing the imported baseline', () => {
  restoreInitialProgress();
  replaceImportedProgress(new Set(['pufferfish']), '1.6.15');
  toggleManual('pufferfish');
  toggleManual('goby');
  assert.equal(isRecorded('pufferfish'), false);
  assert.equal(isRecorded('goby'), true);
  assert.equal(statusSource('goby'), 'manual');
  assert.deepEqual(progressSummary(['pufferfish', 'goby']), {
    recorded: 1, missing: 1, total: 2, imported: 1, manualChanges: 2, hasImportedBaseline: true, importedVersion: '1.6.15',
  });
  undoManualChanges();
  assert.equal(isRecorded('pufferfish'), true);
  assert.equal(isRecorded('goby'), false);
  assert.equal(statusSource('pufferfish'), 'save');
  assert.equal(progressSummary(['pufferfish', 'goby']).manualChanges, 0);
});

test('restore returns to the empty initial state and a new import replaces the old baseline', () => {
  restoreInitialProgress();
  replaceImportedProgress(new Set(['pufferfish']), '1.6.15');
  toggleManual('goby');
  replaceImportedProgress(new Set(['sea-jelly']), '1.6.15');
  assert.equal(isRecorded('pufferfish'), false);
  assert.equal(isRecorded('goby'), false);
  assert.equal(isRecorded('sea-jelly'), true);
  assert.equal(progressSummary(['pufferfish','goby','sea-jelly']).manualChanges, 0);
  restoreInitialProgress();
  assert.deepEqual(progressSummary(['pufferfish','goby','sea-jelly']), {
    recorded: 0, missing: 3, total: 3, imported: 0, manualChanges: 0, hasImportedBaseline: false, importedVersion: null,
  });
  assert.equal(statusSource('sea-jelly'), 'none');
});

test('stores only catalog IDs and restores baseline and local adjustments', () => {
  restoreInitialProgress();
  replaceImportedProgress(new Set(['pufferfish']), '1.6.15');
  toggleManual('pufferfish');
  toggleManual('goby');
  assert.deepEqual(JSON.parse(stored.get(PROGRESS_STORAGE_KEY)), {
    v: 1, base: ['pufferfish'], add: ['goby'], remove: ['pufferfish'],
  });
  assert.equal(loadSavedProgress(), true);
  assert.equal(isRecorded('pufferfish'), false);
  assert.equal(isRecorded('goby'), true);
  assert.equal(progressSummary(['pufferfish']).importedVersion, null);
  undoManualChanges();
  assert.deepEqual(JSON.parse(stored.get(PROGRESS_STORAGE_KEY)), {
    v: 1, base: ['pufferfish'], add: [], remove: [],
  });
  restoreInitialProgress();
  assert.equal(stored.has(PROGRESS_STORAGE_KEY), false);
});

test('rejects unknown stored identifiers without replacing current progress', () => {
  restoreInitialProgress();
  toggleManual('goby');
  stored.set(PROGRESS_STORAGE_KEY, JSON.stringify({ v: 1, base: ['player-name'], add: [], remove: [] }));
  assert.equal(loadSavedProgress(), false);
  assert.equal(isRecorded('goby'), true);
  restoreInitialProgress();
});
