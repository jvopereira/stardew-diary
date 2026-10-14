import { Fragment, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

interface Group<Entry> { key: string; title: string; entries: Entry[] }

interface CatalogGroupsProps<Entry extends { id: string }> {
  groups: Group<Entry>[];
  total: number;
  found: number;
  renderCard: (entry: Entry, onToggle: (button: HTMLButtonElement) => void) => ReactNode;
  onToggle: (id: string) => void;
  revision: number;
  statusRef: RefObject<HTMLSelectElement | null>;
}

export function CatalogGroups<Entry extends { id: string }>({ groups, total, found, renderCard, onToggle, revision, statusRef }: CatalogGroupsProps<Entry>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<{ id: string; button: HTMLButtonElement } | null>(null);

  // Keep focus on the toggled card; if the filter hid it, move focus to the status filter.
  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    if (pending.button.isConnected) { if (document.activeElement !== pending.button) pending.button.focus(); return; }
    const replacement = containerRef.current?.querySelector<HTMLButtonElement>(`button[data-record-id="${CSS.escape(pending.id)}"]`);
    (replacement ?? statusRef.current)?.focus();
  }, [revision, statusRef]);

  return (
    <>
      <p id="result-count" className="result-count" role="status" aria-live="polite">{`${found} de ${total} itens encontrados`}</p>
      <div id="catalog-groups" className="catalog-groups" ref={containerRef}>
        {groups.map((group) => (
          <section className="season-section" aria-labelledby={`group-${group.key}`} key={group.key}>
            <div className="season-heading">
              <h2 id={`group-${group.key}`}>{group.title}</h2>
              <span className="group-count">{`${group.entries.length} ${group.entries.length === 1 ? 'item' : 'itens'}`}</span>
            </div>
            <div className="item-grid">
              {group.entries.map((entry) => <Fragment key={entry.id}>{renderCard(entry, (button) => {
                pendingFocus.current = { id: entry.id, button };
                onToggle(entry.id);
              })}</Fragment>)}
            </div>
          </section>
        ))}
      </div>
      <p id="empty-state" className="message empty-state" hidden={found > 0}>Nenhum item encontrado. Ajuste a busca ou os filtros.</p>
    </>
  );
}

export function groupEntries<Entry>(entries: Entry[], groups: readonly (readonly [string, string])[], forEntry: (entry: Entry) => string[]): Group<Entry>[] {
  return groups
    .map(([key, title]) => ({ key, title, entries: entries.filter((entry) => forEntry(entry).includes(key)) }))
    .filter((group) => group.entries.length > 0);
}
