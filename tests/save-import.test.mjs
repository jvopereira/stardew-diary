import test from 'node:test';
import assert from 'node:assert/strict';
import { fishingCatalog } from '../scripts/data/fishing.js';
import { fishSaveIds } from '../scripts/data/fish-save-ids.js';
import { parseSaveXml, readSaveFile, MAX_SAVE_BYTES, SaveFormatError } from '../scripts/save-parser.js';
import { isRecorded, toggleManual, replaceImportedProgress, progressSummary } from '../scripts/progress.js';

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
