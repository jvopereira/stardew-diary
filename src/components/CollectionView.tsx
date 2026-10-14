import { useRef, useState, type ReactNode } from 'react';
import { asset } from '../domain';
import { useDiary } from '../state/DiaryProvider';
import type { Collection } from '../types';
import { CatalogGroups, groupEntries } from './CatalogGroups';
import { FilterBar, type SelectFilter } from './FilterBar';
import { ProgressPanel } from './ProgressPanel';

interface CollectionViewProps<Entry extends { id: string }> {
  collection: Collection;
  heading: string;
  progressTitle: string;
  recordedLabel: string;
  toolsClassName?: string;
  placeholder: string;
  selects: readonly SelectFilter[];
  filters: Record<string, string> & { search: string };
  onFilter: (next: Record<string, string>) => void;
  filtered: Entry[];
  forEntry: (entry: Entry) => string[];
  renderCard: (entry: Entry, recorded: boolean, onToggle: (button: HTMLButtonElement) => void) => ReactNode;
  footer?: ReactNode;
}

export function CollectionView<Entry extends { id: string }>(props: CollectionViewProps<Entry>) {
  const { collection, filters, filtered } = props;
  const diary = useDiary();
  const store = diary.store(collection.id);
  const [message, setMessage] = useState('');
  const messageRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  function announce(text: string) {
    setMessage(text);
    messageRef.current?.focus();
  }

  return (
    <>
      <div className="catalog-intro">
        <div className="collection-title"><img className="collection-emblem" src={asset(`assets/icons/${collection.id}.png`)} alt="" /><h1 tabIndex={-1}>{props.heading}</h1></div>
      </div>
      <ProgressPanel collection={collection} title={props.progressTitle} recordedLabel={props.recordedLabel} message={message} messageRef={messageRef} announce={announce} />
      <FilterBar
        className={props.toolsClassName}
        placeholder={props.placeholder}
        search={filters.search}
        onSearch={(search) => props.onFilter({ search })}
        selects={props.selects}
        values={filters}
        onSelect={(id, value) => props.onFilter({ [id]: value })}
        statusRef={statusRef}
      />
      <CatalogGroups
        groups={groupEntries(filtered, collection.grouping.groups, props.forEntry)}
        total={collection.entries.length}
        found={filtered.length}
        revision={diary.revision}
        statusRef={statusRef}
        onToggle={(id) => setMessage(diary.toggle(collection.id, id) ? '' : 'Ajuste aplicado nesta aba, mas não foi possível salvá-lo neste navegador.')}
        renderCard={(entry, onToggle) => props.renderCard(entry, store.isRecorded(entry.id), onToggle)}
      />
      {props.footer}
    </>
  );
}
