// Typed adapters over the existing JavaScript domain modules.
import { collectionById as jsCollectionById, collections as jsCollections } from '../scripts/data/collections.js';
import * as progress from '../scripts/progress.js';
import { readCollectionsSaveFile as jsReadSave } from '../scripts/save-import.js';
import { SaveFormatError } from '../scripts/save-common.js';
import { progressExport, downloadProgress } from '../scripts/export.js';
import type { Collection, CollectionId, FishingCollection, ImportResult, MuseumCollection, ProgressStore } from './types';

export const collections = jsCollections as unknown as readonly Collection[];
export const fishingCollection = jsCollectionById('fishing') as unknown as FishingCollection;
export const museumCollection = jsCollectionById('museum') as unknown as MuseumCollection;

export const progressForCollection = progress.progressForCollection as (id: CollectionId) => ProgressStore;
export const progressStorageKey = progress.progressStorageKey as (collection: Collection) => string;
export const deleteLocalData = progress.deleteLocalData as () => boolean;
export const replaceCollectionsProgress = progress.replaceCollectionsProgress as (result: ImportResult) => boolean;
export const readCollectionsSaveFile = jsReadSave as (file: File | undefined) => Promise<ImportResult>;
export { SaveFormatError };

export function exportCollection(collection: Collection, recordedIds: Set<string>): void {
  downloadProgress(progressExport(collection, recordedIds));
}

export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
