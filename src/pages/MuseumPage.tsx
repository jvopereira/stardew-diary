import { CollectionView } from '../components/CollectionView';
import { ItemCard } from '../components/ItemCard';
import { asset, museumCollection as collection } from '../domain';
import { useDiary } from '../state/DiaryProvider';
import type { MuseumEntry, MuseumFilters } from '../types';

const types = Object.fromEntries(collection.grouping.groups);

const selects = [
  { id: 'type', label: 'Tipo', options: [['all', 'Todos'], ['artifact', 'Artefatos'], ['mineral', 'Minerais']] },
  { id: 'status', label: 'Doação', options: [['all', 'Todos'], ['recorded', 'Doados'], ['missing', 'Falta doar']] },
] as const;

function MuseumCard({ entry, recorded, onToggle }: { entry: MuseumEntry; recorded: boolean; onToggle: (button: HTMLButtonElement) => void }) {
  return (
    <ItemCard
      className="item-card museum-card"
      collectionId="museum"
      id={entry.id}
      namePt={entry.namePt}
      nameEn={entry.nameEn}
      recorded={recorded}
      statusText={recorded ? 'Doado' : 'Falta doar'}
      details={
        <dl className="conditions">
          <div className="condition"><dt>Tipo</dt><dd>{types[entry.type] ?? 'A verificar'}</dd></div>
          <div className="condition"><dt>Como obter</dt><dd>{entry.obtaining ?? 'A verificar'}</dd></div>
          {entry.needsVerification.length > 0 && <p className="condition-note">Informações de obtenção a verificar.</p>}
        </dl>
      }
      toggleText={recorded ? 'Desmarcar doação' : 'Marcar como doado'}
      toggleLabel={`${recorded ? 'Desmarcar doação de' : 'Marcar como doado:'} ${entry.namePt}`}
      onToggle={onToggle}
      wiki={<a className="wiki-link" href={entry.wikiUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${entry.namePt} na Wiki em português (nova aba)`}>Wiki ↗</a>}
    />
  );
}

export function MuseumPage() {
  const { filters, setFilters, store } = useDiary();
  const current = filters.museum;
  const filtered = collection.filterEntries(collection.entries, current, store('museum').recordedIdSet(collection.completion.requiredIds));
  return (
    <CollectionView<MuseumEntry>
      collection={collection}
      heading="Artigos do Museu"
      progressTitle="Suas doações"
      recordedLabel="doados"
      toolsClassName="museum-tools"
      placeholder="Ex.: Quartzo ou Quartz"
      selects={selects}
      filters={{ ...current }}
      onFilter={(next) => setFilters('museum', next as Partial<MuseumFilters>)}
      filtered={filtered}
      forEntry={collection.grouping.forEntry}
      renderCard={(entry, recorded, onToggle) => <MuseumCard entry={entry} recorded={recorded} onToggle={onToggle} />}
      footer={<p className="catalog-source">Como obter: exemplos de fontes verificadas, sem probabilidades. Consulte a Wiki de cada item para detalhes e alternativas. <a href={asset('docs/museum-catalog.md')}>Sobre esta coleção</a>.</p>}
    />
  );
}
