import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  collections, deleteLocalData, progressForCollection, progressStorageKey,
  readCollectionsSaveFile, replaceCollectionsProgress, SaveFormatError,
} from '../domain';
import type { CollectionId, FiltersByCollection, ImportState, ProgressStore } from '../types';
import { FILTERS_STORAGE_KEY, filterDefaults, loadFilters, saveFilters } from './filters';

export type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'diario-do-vale-theme';

interface DiaryContextValue {
  /** Changes after every progress mutation so consumers re-read the stores. */
  revision: number;
  store: (id: CollectionId) => ProgressStore;
  toggle: (id: CollectionId, itemId: string) => boolean;
  undoManual: (id: CollectionId) => boolean;
  restoreInitial: (id: CollectionId) => boolean;
  deleteAllLocalData: (id: CollectionId) => boolean;
  importedCount: number;
  filters: FiltersByCollection;
  setFilters: <Id extends CollectionId>(id: Id, next: Partial<FiltersByCollection[Id]>) => void;
  importState: ImportState;
  /** Changes whenever an import finishes or is cancelled, so the file field can be cleared. */
  importResetKey: number;
  startImport: (file: File | undefined) => Promise<void>;
  cancelImport: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function reloadStores() {
  for (const collection of collections) progressForCollection(collection.id).loadSavedProgress();
}

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((value) => value + 1), []);
  const [filters, setAllFilters] = useState(loadFilters);
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' });
  const [importResetKey, setImportResetKey] = useState(0);
  const importGeneration = useRef(0);
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#e8e7da');
  }, [theme]);

  useEffect(() => { saveFilters(filters); }, [filters]);

  const cancelImport = useCallback(() => {
    importGeneration.current++;
    setImportState({ status: 'idle' });
    setImportResetKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const keys = new Set(collections.map(progressStorageKey));
    function onStorage(event: StorageEvent) {
      if (event.key === null || keys.has(event.key)) {
        cancelImport();
        reloadStores();
        bump();
      }
      if (event.key === null || event.key === FILTERS_STORAGE_KEY) setAllFilters(loadFilters());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [bump, cancelImport]);

  const value = useMemo<DiaryContextValue>(() => {
    const store = progressForCollection;
    const importedCount = collections.filter((collection) =>
      store(collection.id).progressSummary(collection.completion.requiredIds).hasImportedBaseline).length;
    return {
      revision,
      store,
      importedCount,
      toggle(id, itemId) { const saved = store(id).toggleManual(itemId); bump(); return saved; },
      undoManual(id) { const saved = store(id).undoManualChanges(); bump(); return saved; },
      restoreInitial(id) {
        cancelImport();
        const saved = store(id).restoreInitialProgress();
        bump();
        return saved;
      },
      deleteAllLocalData(id) {
        cancelImport();
        const progressDeleted = store(id).restoreInitialProgress();
        const dataDeleted = deleteLocalData();
        reloadStores();
        setTheme(systemTheme());
        setAllFilters(filterDefaults);
        bump();
        return progressDeleted && dataDeleted;
      },
      filters,
      setFilters(id, next) {
        setAllFilters((current) => ({ ...current, [id]: { ...current[id], ...next } }));
      },
      importState,
      importResetKey,
      cancelImport,
      async startImport(file) {
        const generation = ++importGeneration.current;
        setImportState({ status: 'busy', message: 'Atualizando suas coleções…' });
        try {
          const result = await readCollectionsSaveFile(file);
          if (generation !== importGeneration.current) return;
          const saved = replaceCollectionsProgress(result);
          bump();
          setImportState({
            status: 'done',
            message: `Coleções atualizadas: ${result.collections.fishing.size} peixes e ${result.collections.museum.size} doações ao Museu.${saved ? '' : ' O progresso foi aplicado, mas não foi possível salvar todas as coleções neste navegador.'}`,
          });
        } catch (error) {
          if (generation !== importGeneration.current) return;
          setImportState({
            status: 'error',
            message: error instanceof SaveFormatError ? error.message : 'Não foi possível ler o arquivo. O progresso anterior foi mantido.',
          });
        } finally {
          if (generation === importGeneration.current) setImportResetKey((value) => value + 1);
        }
      },
      theme,
      toggleTheme() {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* The toggle still works for this visit. */ }
      },
    };
  }, [revision, bump, cancelImport, filters, importState, importResetKey, theme]);

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const context = useContext(DiaryContext);
  if (!context) throw new Error('useDiary must be used inside DiaryProvider');
  return context;
}
