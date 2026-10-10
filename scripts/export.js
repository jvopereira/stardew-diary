// Export the effective collection state only; never include save data or player details.
export const EXPORT_FORMAT_VERSION = 1;

export function progressExport(collection, recordedIds) {
  const allowed = new Set(collection.completion.requiredIds);
  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    collectionId: collection.id,
    recordedIds: [...new Set(recordedIds)].filter((id) => allowed.has(id)).sort(),
  };
}

export function downloadProgress(data) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = `diario-do-vale-${data.collectionId}-progresso.json`;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
