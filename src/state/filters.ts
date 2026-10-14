import { FILTERS_STORAGE_KEY } from '../../scripts/progress.js';
import type { FiltersByCollection, FishingFilters, MuseumFilters, StatusFilter } from '../types';

export { FILTERS_STORAGE_KEY };

export const fishingDefaults: FishingFilters = { search: '', season: 'all', method: 'all', status: 'all' };
export const museumDefaults: MuseumFilters = { search: '', type: 'all', status: 'all' };
export const filterDefaults: FiltersByCollection = { fishing: fishingDefaults, museum: museumDefaults };

const seasons = ['all', 'spring', 'summer', 'fall', 'winter', 'year-round', 'unverified'];
const methods = ['all', 'rod', 'crab-pot'];
const types = ['all', 'artifact', 'mineral'];
const statuses: StatusFilter[] = ['all', 'recorded', 'missing'];
const MAX_SEARCH = 100;

type Raw = Record<string, unknown> | undefined;
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? value as T : fallback;
const search = (value: unknown) => typeof value === 'string' && value.length <= MAX_SEARCH ? value : '';
const record = (value: unknown): Raw => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

// Unknown or malformed values fall back to the defaults field by field.
export function parseFilters(raw: string | null): FiltersByCollection {
  let saved: Record<string, unknown> | undefined;
  try { saved = raw === null ? undefined : record(JSON.parse(raw)); } catch { saved = undefined; }
  if (!saved || saved.v !== 1) return filterDefaults;
  const fishing = record(saved.fishing) ?? {};
  const museum = record(saved.museum) ?? {};
  return {
    fishing: {
      search: search(fishing.search),
      season: pick(fishing.season, seasons, 'all'),
      method: pick(fishing.method, methods, 'all'),
      status: pick(fishing.status, statuses, 'all'),
    },
    museum: {
      search: search(museum.search),
      type: pick(museum.type, types, 'all'),
      status: pick(museum.status, statuses, 'all'),
    },
  };
}

export function loadFilters(): FiltersByCollection {
  try { return parseFilters(localStorage.getItem(FILTERS_STORAGE_KEY)); } catch { return filterDefaults; }
}

export function saveFilters(filters: FiltersByCollection): void {
  const isDefault = JSON.stringify(filters) === JSON.stringify(filterDefaults);
  try {
    if (isDefault) localStorage.removeItem(FILTERS_STORAGE_KEY);
    else localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ v: 1, ...filters }));
  } catch { /* Filters still apply for this visit. */ }
}
