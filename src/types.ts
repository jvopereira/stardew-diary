export type CollectionId = 'fishing' | 'museum';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type StatusFilter = 'all' | 'recorded' | 'missing';

export interface FishEntry {
  id: string;
  namePt: string;
  nameEn: string;
  seasons: Season[] | null;
  location: string | null;
  time: string | null;
  weather: 'sunny' | 'rainy' | 'any' | null;
  method: 'rod' | 'crab-pot';
  specialRequirements: string | null;
  needsVerification: string[];
}

export interface MuseumEntry {
  id: string;
  namePt: string;
  nameEn: string;
  type: 'artifact' | 'mineral';
  saveId: string;
  obtaining: string | null;
  wikiUrl: string;
  needsVerification: string[];
}

export interface FishingFilters { search: string; season: string; method: string; status: StatusFilter }
export interface MuseumFilters { search: string; type: string; status: StatusFilter }
export interface FiltersByCollection { fishing: FishingFilters; museum: MuseumFilters }

interface CollectionBase<Id extends CollectionId, Entry, Filters> {
  id: Id;
  label: string;
  href: string;
  entries: readonly Entry[];
  grouping: { groups: readonly (readonly [string, string])[]; forEntry: (entry: Entry) => string[] };
  filterEntries: (entries: readonly Entry[], filters: Filters, recordedIds: Set<string>) => Entry[];
  completion: { requiredIds: readonly string[] };
}
export type FishingCollection = CollectionBase<'fishing', FishEntry, FishingFilters>;
export type MuseumCollection = CollectionBase<'museum', MuseumEntry, MuseumFilters>;
export type Collection = FishingCollection | MuseumCollection;

export interface ProgressSummary {
  recorded: number;
  missing: number;
  total: number;
  imported: number;
  manualChanges: number;
  hasImportedBaseline: boolean;
  importedVersion: string | null;
}

export interface ProgressStore {
  loadSavedProgress(): boolean;
  isRecorded(id: string): boolean;
  recordedIdSet(ids: readonly string[]): Set<string>;
  toggleManual(id: string): boolean;
  undoManualChanges(): boolean;
  restoreInitialProgress(): boolean;
  progressSummary(ids: readonly string[]): ProgressSummary;
}

export interface ImportResult {
  version: string;
  collections: Record<CollectionId, Set<string>>;
}

export type ImportState =
  | { status: 'idle' }
  | { status: 'busy'; message: string }
  | { status: 'done'; message: string }
  | { status: 'error'; message: string };
