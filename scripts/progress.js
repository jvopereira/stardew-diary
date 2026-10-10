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

// Call only after a complete, validated parse. No file or XML is retained.
export function replaceImportedProgress(ids, version) {
  importedIds = new Set(ids);
  importedVersion = version;
  manualOverrides.clear();
}

export function progressSummary(allIds) {
  const recorded = allIds.filter(isRecorded).length;
  return { recorded, missing: allIds.length - recorded, total: allIds.length, importedVersion };
}
