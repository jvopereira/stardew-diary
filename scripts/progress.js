import { collectionById } from './data/collections.js';

export const PROGRESS_STORAGE_KEY = 'diario-do-vale-progress-v1';
export function createProgressStore(collection, storageKey = `diario-do-vale-progress-${collection.id}-v1`) {
const knownIds = new Set(collection.completion.requiredIds);
let importedIds = new Set();
const manualOverrides = new Map();
let hasImportedBaseline = false;
let importedVersion = null; // Session display only; never stored.

function validIds(value) {
  return Array.isArray(value) && value.length <= knownIds.size && value.every((id) => typeof id === 'string' && knownIds.has(id));
}

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return false;
    if (raw.length > 8192) return false;
    const saved = JSON.parse(raw);
    if (!saved || saved.v !== 1 || !(saved.base === null || validIds(saved.base)) || !validIds(saved.add) || !validIds(saved.remove)) return false;
    const base = new Set(saved.base ?? []);
    const add = new Set(saved.add);
    const remove = new Set(saved.remove);
    if ([...add].some((id) => base.has(id) || remove.has(id)) || [...remove].some((id) => !base.has(id))) return false;
    importedIds = base;
    hasImportedBaseline = saved.base !== null;
    importedVersion = null;
    manualOverrides.clear();
    for (const id of add) manualOverrides.set(id, true);
    for (const id of remove) manualOverrides.set(id, false);
    return true;
  } catch { return false; }
}

function persistProgress() {
  try {
    if (!hasImportedBaseline && manualOverrides.size === 0) {
      localStorage.removeItem(storageKey);
      return true;
    }
    const add = [], remove = [];
    for (const [id, recorded] of manualOverrides) (recorded ? add : remove).push(id);
    localStorage.setItem(storageKey, JSON.stringify({
      v: 1,
      base: hasImportedBaseline ? [...importedIds] : null,
      add,
      remove,
    }));
    return true;
  } catch { return false; }
}

function isRecorded(id) {
  return manualOverrides.get(id) ?? importedIds.has(id);
}

function statusSource(id) {
  if (manualOverrides.has(id)) return 'manual';
  if (hasImportedBaseline) return 'save';
  return 'none';
}

function recordedIdSet(ids) {
  return new Set(ids.filter(isRecorded));
}

function toggleManual(id) {
  if (!knownIds.has(id)) return false;
  const next = !isRecorded(id);
  if (next === importedIds.has(id)) manualOverrides.delete(id);
  else manualOverrides.set(id, next);
  return persistProgress();
}

function undoManualChanges() {
  manualOverrides.clear();
  return persistProgress();
}

// Return to the empty state shown when the catalog first opens.
function restoreInitialProgress() {
  importedIds = new Set();
  hasImportedBaseline = false;
  importedVersion = null;
  manualOverrides.clear();
  return persistProgress();
}

// Call only after a complete, validated parse. No file or XML is retained.
function replaceImportedProgress(ids, version) {
  importedIds = new Set([...ids].filter((id) => knownIds.has(id)));
  hasImportedBaseline = true;
  importedVersion = version;
  manualOverrides.clear();
  return persistProgress();
}

function progressSummary(allIds) {
  const recorded = allIds.filter(isRecorded).length;
  const imported = allIds.filter((id) => importedIds.has(id)).length;
  return {
    recorded,
    missing: allIds.length - recorded,
    total: allIds.length,
    imported,
    manualChanges: manualOverrides.size,
    hasImportedBaseline,
    importedVersion,
  };
}

loadSavedProgress();
return { loadSavedProgress, isRecorded, statusSource, recordedIdSet, toggleManual, undoManualChanges, restoreInitialProgress, replaceImportedProgress, progressSummary };
}

// Preserve the existing fishing storage key and public API.
const fishingProgress = createProgressStore(collectionById('fishing'), PROGRESS_STORAGE_KEY);
export const { loadSavedProgress, isRecorded, statusSource, recordedIdSet, toggleManual, undoManualChanges, restoreInitialProgress, replaceImportedProgress, progressSummary } = fishingProgress;
