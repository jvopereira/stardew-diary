import test from 'node:test';
import assert from 'node:assert/strict';

const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, String(value)),
  removeItem: (key) => stored.delete(key),
};
const { FILTERS_STORAGE_KEY, filterDefaults, loadFilters, parseFilters, saveFilters } = await import('../src/state/filters.ts');
const { deleteLocalData } = await import('../scripts/progress.js');

test('filters use a new versioned key and round-trip per collection', () => {
  assert.equal(FILTERS_STORAGE_KEY, 'diario-do-vale-filters-v1');
  const filters = { fishing: { search: 'Baiacu', season: 'summer', method: 'rod', status: 'missing' }, museum: { search: '', type: 'mineral', status: 'recorded' } };
  saveFilters(filters);
  assert.equal(JSON.parse(stored.get(FILTERS_STORAGE_KEY)).v, 1);
  assert.deepEqual(loadFilters(), filters);
  saveFilters(filterDefaults);
  assert.equal(stored.has(FILTERS_STORAGE_KEY), false);
});

test('invalid saved filters fall back to the current defaults', () => {
  for (const raw of [null, '', '{', '[]', '"x"', '{"v":2,"fishing":{"season":"summer"}}']) assert.deepEqual(parseFilters(raw), filterDefaults);
  const parsed = parseFilters(JSON.stringify({ v: 1, fishing: { search: 7, season: 'monsoon', method: 'net', status: 'recorded' }, museum: { search: 'x'.repeat(101), type: 'fossil', status: [] } }));
  assert.deepEqual(parsed, { fishing: { ...filterDefaults.fishing, status: 'recorded' }, museum: filterDefaults.museum });
});

test('unavailable storage keeps defaults without throwing', () => {
  const storage = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  try {
    assert.deepEqual(loadFilters(), filterDefaults);
    assert.doesNotThrow(() => saveFilters({ ...filterDefaults, museum: { ...filterDefaults.museum, type: 'artifact' } }));
  } finally { globalThis.localStorage = storage; }
});

test('deleting local site data also clears saved filters', () => {
  stored.set(FILTERS_STORAGE_KEY, JSON.stringify({ v: 1, fishing: { season: 'fall' } }));
  assert.equal(deleteLocalData(), true);
  assert.equal(stored.has(FILTERS_STORAGE_KEY), false);
});
