import test from 'node:test';
import assert from 'node:assert/strict';
import { museumCatalog, museumSources } from '../scripts/data/museum.js';
import { collectionById } from '../scripts/data/collections.js';
import { filterMuseum } from '../scripts/museum-model.js';
import { parseMuseumSaveXml, readMuseumSaveFile } from '../scripts/museum-save-parser.js';
import { SaveFormatError, MAX_SAVE_BYTES } from '../scripts/save-common.js';
import { createProgressStore, deleteLocalData, progressStorageKey } from '../scripts/progress.js';
import { progressExport } from '../scripts/export.js';
import { readCollectionsSaveFile } from '../scripts/save-import.js';
import { progressForCollection, replaceCollectionsProgress } from '../scripts/progress.js';

const collection = collectionById('museum');
const required = collection.completion.requiredIds;
const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, String(value)),
  removeItem: (key) => stored.delete(key),
};
const node = (localName, textContent = '', children = [], attrs = {}) => ({
  localName, namespaceURI: null, textContent, children,
  getAttributeNS: (namespace, name) => namespace === 'http://www.w3.org/2001/XMLSchema-instance' ? attrs[name] ?? null : null,
});
const piece = (id, tag = 'int') => node('item', '', [
  node('key', '', [node('Vector2', '', [node('X', '1'), node('Y', '2')])]),
  node('value', '', [node(tag, id)]),
]);
function save({ items = [piece('96'), piece('60')], version = '1.6.15', museum = true, pieces = true } = {}) {
  return {
    documentElement: node('SaveGame', '', [
      node('gameVersion', version),
      // Discovery and inventory records must never count as donations.
      node('player', '', [node('archaeologyFound', '', [piece('97')]), node('mineralsFound', '', [piece('62')]),
        node('fishCaught', '', [node('item', '', [node('key', '', [node('string', '(O)128')]), node('value', '', [node('ArrayOfInt', '', [node('int', '2')])])])]),
      ]),
      node('locations', '', museum ? [node('GameLocation', '', pieces ? [node('museumPieces', '', items)] : [], { type: 'LibraryMuseum' })] : []),
    ]),
    doctype: null, querySelector: () => null,
  };
}
let documentToParse = save();
let parseCount = 0;
globalThis.DOMParser = class { parseFromString() { parseCount++; return documentToParse; } };
const xml = '<SaveGame/>';

test('museum contains exactly 42 artifacts and 53 minerals with complete unique IDs and sources', () => {
  assert.equal(required.length, 95);
  assert.equal(new Set(required).size, 95);
  assert.equal(new Set(collection.entries.map((entry) => entry.saveId)).size, 95);
  assert.equal(museumCatalog.entries.filter((entry) => entry.type === 'artifact').length, 42);
  assert.equal(museumCatalog.entries.filter((entry) => entry.type === 'mineral').length, 53);
  for (const entry of collection.entries) {
    assert.ok(entry.namePt && entry.nameEn && entry.obtaining);
    assert.ok(entry.sources.every((source) => museumSources[source]));
    assert.ok(entry.wikiUrl.startsWith('https://pt.stardewvalleywiki.com/'));
    assert.deepEqual(entry.needsVerification, []);
  }
  assert.deepEqual(required, museumCatalog.entries.map((entry) => entry.id));
  assert.deepEqual(collection.entries, [...collection.entries].sort((a, b) => a.namePt.localeCompare(b.namePt, 'pt-BR')));
});

test('museum filters combine names without accents, type and donation status', () => {
  const recorded = new Set(['dwarf-scroll-i', 'quartz']);
  const ids = (options) => filterMuseum(collection.entries, options, recorded).map((entry) => entry.id);
  assert.deepEqual(ids({ search: ' ANOES I ', type: 'artifact', status: 'recorded' }), ['dwarf-scroll-i']);
  assert.deepEqual(ids({ search: 'quartz', type: 'mineral', status: 'recorded' }), ['quartz']);
  assert.deepEqual(ids({ search: 'quartzo', type: 'artifact' }), []);
  assert.equal(ids({ status: 'missing' }).length, 93);
  assert.equal(ids({ type: 'mineral' }).length, 53);
});

test('museum importer reads donation values, never coordinates or discoveries', () => {
  documentToParse = save();
  assert.deepEqual(parseMuseumSaveXml(xml), { version: '1.6.15', recordedIds: new Set(['dwarf-scroll-i', 'emerald']) });
});

test('empty, partial, complete and duplicate museum donations are counted uniquely', () => {
  documentToParse = save({ items: [] });
  assert.equal(parseMuseumSaveXml(xml).recordedIds.size, 0);
  documentToParse = save({ items: [piece('96'), piece('96'), piece('(O)60', 'string'), piece('Mod_Item', 'string'), piece('99999')] });
  assert.deepEqual(parseMuseumSaveXml(xml).recordedIds, new Set(['dwarf-scroll-i', 'emerald']));
  documentToParse = save({ items: collection.entries.map((entry) => piece(entry.saveId)) });
  assert.deepEqual(parseMuseumSaveXml(xml).recordedIds, new Set(required));
});

test('museum rejects missing, duplicate or corrupt records and incompatible XML', () => {
  for (const options of [{ museum: false }, { pieces: false }, { version: '1.5.6' }, { items: [piece('-96')] }, { items: [piece('invalid')] }, { items: [piece('x<script>', 'string')] }]) {
    documentToParse = save(options);
    assert.throws(() => parseMuseumSaveXml(xml), SaveFormatError);
  }
  const badPiece = piece('96');
  badPiece.children[0].children[0].children.pop();
  documentToParse = save({ items: [badPiece] });
  assert.throws(() => parseMuseumSaveXml(xml), SaveFormatError);
  documentToParse = save();
  const locations = documentToParse.documentElement.children[2];
  locations.children.push(locations.children[0]);
  assert.throws(() => parseMuseumSaveXml(xml), SaveFormatError);
  documentToParse = save();
  const museum = documentToParse.documentElement.children[2].children[0];
  museum.children.push(museum.children[0]);
  assert.throws(() => parseMuseumSaveXml(xml), SaveFormatError);
  assert.throws(() => parseMuseumSaveXml('<!DOCTYPE SaveGame><SaveGame/>'), SaveFormatError);
  documentToParse = { ...save(), querySelector: () => ({}) };
  assert.throws(() => parseMuseumSaveXml('<broken>'), SaveFormatError);
});

test('museum file reader uses the same size, backup, binary and XML protections as fishing', async () => {
  for (const file of [null, { size: 0 }, { size: MAX_SAVE_BYTES + 1 }, { size: 10, name: 'SaveGameInfo' }, { size: 10, name: 'Farm_old' }, { size: 10, name: 'save.zip' }, { size: 10, name: 'Farm', text: async () => '\u0000binary' }]) {
    await assert.rejects(readMuseumSaveFile(file), SaveFormatError);
  }
  documentToParse = save();
  assert.equal((await readMuseumSaveFile({ name: 'Farm_1234', size: 10, text: async () => xml })).recordedIds.size, 2);
});

test('museum save failures preserve progress; replacement and manual undo follow the imported baseline', () => {
  stored.clear();
  const progress = createProgressStore(collection);
  progress.replaceImportedProgress(['emerald'], '1.6.15');
  progress.toggleManual('emerald');
  progress.toggleManual('quartz');
  const before = progress.progressSummary(required);
  documentToParse = save({ museum: false });
  assert.throws(() => parseMuseumSaveXml(xml), SaveFormatError);
  assert.deepEqual(progress.progressSummary(required), before);
  progress.undoManualChanges();
  assert.ok(progress.isRecorded('emerald'));
  assert.equal(progress.isRecorded('quartz'), false);
  progress.replaceImportedProgress(required, '1.6.15');
  assert.equal(progress.progressSummary(required).recorded, 95);
  assert.equal(progress.progressSummary(required).missing, 0);
  progress.restoreInitialProgress();
  assert.equal(progress.progressSummary(required).recorded, 0);
});

test('museum persists and exports only effective catalog IDs independently of fishing', () => {
  stored.clear();
  const fishing = createProgressStore(collectionById('fishing'));
  fishing.toggleManual('goby');
  const progress = createProgressStore(collection);
  progress.replaceImportedProgress(['emerald', 'player-name'], '1.6.15');
  progress.toggleManual('emerald');
  progress.toggleManual('quartz');
  assert.deepEqual(JSON.parse(stored.get(progressStorageKey(collection))), { v: 1, base: ['emerald'], add: ['quartz'], remove: ['emerald'] });
  const restored = createProgressStore(collection);
  assert.deepEqual(restored.recordedIdSet(required), new Set(['quartz']));
  assert.deepEqual(progressExport(collection, restored.recordedIdSet(required)), { formatVersion: 1, collectionId: 'museum', recordedIds: ['quartz'] });
  assert.ok(fishing.isRecorded('goby'));
  assert.equal(progressStorageKey(collectionById('fishing')), 'diario-do-vale-progress-v1');
  progress.restoreInitialProgress();
  assert.ok(fishing.isRecorded('goby'));
});

test('global deletion clears both collection keys and theme, but leaves unrelated storage', () => {
  stored.clear();
  const progress = createProgressStore(collection);
  progress.toggleManual('quartz');
  stored.set('diario-do-vale-progress-v1', '{}');
  stored.set('diario-do-vale-theme', 'dark');
  stored.set('another-site', 'preserved');
  assert.equal(deleteLocalData(), true);
  assert.deepEqual([...stored], [['another-site', 'preserved']]);
  progress.loadSavedProgress();
  assert.equal(progress.progressSummary(required).recorded, 0);
});

test('storage errors keep museum usable in memory and report unsuccessful deletion', () => {
  const storage = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  try {
    const progress = createProgressStore(collection);
    assert.equal(progress.toggleManual('quartz'), false);
    assert.ok(progress.isRecorded('quartz'));
    assert.equal(deleteLocalData(), false);
  } finally { globalThis.localStorage = storage; }
});

test('one save is read and parsed once to update both collections and clear their manual overrides', async () => {
  stored.clear();
  documentToParse = save();
  let reads = 0;
  parseCount = 0;
  const result = await readCollectionsSaveFile({ name: 'Farm_123', size: 100, text: async () => { reads++; return xml; } });
  assert.equal(reads, 1);
  assert.equal(parseCount, 1);
  assert.deepEqual(result.collections, { fishing: new Set(['pufferfish']), museum: new Set(['dwarf-scroll-i', 'emerald']) });
  progressForCollection('fishing').toggleManual('goby');
  progressForCollection('museum').toggleManual('quartz');
  assert.equal(replaceCollectionsProgress(result), true);
  for (const id of ['fishing', 'museum']) {
    const ids = collectionById(id).completion.requiredIds;
    assert.deepEqual(progressForCollection(id).recordedIdSet(ids), result.collections[id]);
    assert.equal(progressForCollection(id).progressSummary(ids).manualChanges, 0);
    assert.deepEqual(createProgressStore(collectionById(id)).recordedIdSet(ids), result.collections[id]);
  }
});

test('a corrupt collection prevents unified import from replacing either baseline', async () => {
  const before = ['fishing', 'museum'].map((id) => progressForCollection(id).progressSummary(collectionById(id).completion.requiredIds));
  for (const broken of ['museum', 'fishing']) {
    documentToParse = save({ museum: broken !== 'museum' });
    if (broken === 'fishing') documentToParse.documentElement.children[1].children.pop();
    await assert.rejects(readCollectionsSaveFile({ name: 'Farm_123', size: 100, text: async () => xml }), SaveFormatError);
    assert.deepEqual(['fishing', 'museum'].map((id) => progressForCollection(id).progressSummary(collectionById(id).completion.requiredIds)), before);
  }
});
