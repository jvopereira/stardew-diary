let importedIds = new Set();
const manualOverrides = new Map();
let importedVersion = null;

export function isRecorded(id) {
  return manualOverrides.get(id) ?? importedIds.has(id);
}

export function statusSource(id) {
  if (manualOverrides.has(id)) return 'manual';
  if (importedVersion) return 'save';
  return 'none';
}

export function recordedIdSet(ids) {
  return new Set(ids.filter(isRecorded));
}

export function toggleManual(id) {
  const next = !isRecorded(id);
  if (next === importedIds.has(id)) manualOverrides.delete(id);
  else manualOverrides.set(id, next);
}

export function undoManualChanges() {
  manualOverrides.clear();
}

// Return to the empty state shown when the catalog first opens.
export function restoreInitialProgress() {
  importedIds = new Set();
  importedVersion = null;
  manualOverrides.clear();
}

// Call only after a complete, validated parse. No file or XML is retained.
export function replaceImportedProgress(ids, version) {
  importedIds = new Set(ids);
  importedVersion = version;
  manualOverrides.clear();
}

export function progressSummary(allIds) {
  const recorded = allIds.filter(isRecorded).length;
  const imported = allIds.filter((id) => importedIds.has(id)).length;
  return {
    recorded,
    missing: allIds.length - recorded,
    total: allIds.length,
    imported,
    manualChanges: manualOverrides.size,
    importedVersion,
  };
}
