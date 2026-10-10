import { fishingCatalog, fishingSources } from './fishing.js';
import { filterCatalog, seasonGroupFor, seasonGroups } from '../catalog-model.js';
import { readSaveFile } from '../save-parser.js';

// Register only implemented collections. Each page owns its category-specific cards.
export const collections = Object.freeze([Object.freeze({
  ...fishingCatalog,
  label: 'Catálogo de pesca',
  href: 'catalogo.html',
  sources: fishingSources,
  filters: Object.freeze(['search', 'season', 'method', 'status']),
  grouping: Object.freeze({ groups: seasonGroups, forEntry: seasonGroupFor }),
  filterEntries: filterCatalog,
  completion: Object.freeze({ basis: 'fish-collection-tab', requiredIds: Object.freeze(fishingCatalog.entries.map((entry) => entry.id)) }),
  importSave: readSaveFile,
})]);

export function collectionById(id) {
  return collections.find((collection) => collection.id === id);
}
