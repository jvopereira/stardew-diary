import { fishingCatalog, fishingSources } from './fishing.js';
import { filterCatalog, seasonGroupFor, seasonGroups } from '../catalog-model.js';
import { readSaveFile } from '../save-parser.js';
import { museumCatalog, museumSources } from './museum.js';
import { filterMuseum, museumGroups } from '../museum-model.js';
import { readMuseumSaveFile } from '../museum-save-parser.js';

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
}), Object.freeze({
  ...museumCatalog,
  label: 'Artigos do Museu',
  href: 'museu.html',
  sources: museumSources,
  filters: Object.freeze(['search', 'type', 'status']),
  grouping: Object.freeze({ groups: museumGroups, forEntry: (entry) => [entry.type] }),
  filterEntries: filterMuseum,
  completion: Object.freeze({ basis: 'museum-donations', requiredIds: Object.freeze(museumCatalog.entries.map((entry) => entry.id)) }),
  importSave: readMuseumSaveFile,
})]);

export function collectionById(id) {
  return collections.find((collection) => collection.id === id);
}
