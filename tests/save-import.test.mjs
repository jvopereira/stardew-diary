import test from 'node:test';
import assert from 'node:assert/strict';
import { fishingCatalog } from '../scripts/data/fishing.js';
import { fishSaveIds } from '../scripts/data/fish-save-ids.js';
import { parseSaveXml, readSaveFile, MAX_SAVE_BYTES, SaveFormatError } from '../scripts/save-parser.js';
import { isRecorded, statusSource, toggleManual, undoManualChanges, restoreInitialProgress, replaceImportedProgress, progressSummary } from '../scripts/progress.js';

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
    recorded: 1, missing: 1, total: 2, imported: 1, manualChanges: 2, importedVersion: '1.6.15',
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
    recorded: 0, missing: 3, total: 3, imported: 0, manualChanges: 0, importedVersion: null,
  });
  assert.equal(statusSource('sea-jelly'), 'none');
});
