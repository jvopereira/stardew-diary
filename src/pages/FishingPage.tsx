import { CollectionView } from '../components/CollectionView';
import { Condition, ItemCard } from '../components/ItemCard';
import { fishingCollection as collection } from '../domain';
import { useDiary } from '../state/DiaryProvider';
import type { FishEntry, FishingFilters } from '../types';

const seasonNames = Object.fromEntries(collection.grouping.groups);
const methodNames = { rod: 'Vara de pesca', 'crab-pot': 'Covo' } as const;
const weatherNames = { sunny: 'Ensolarado', rainy: 'Chuvoso', any: 'Qualquer clima' } as const;
const locationNames: Record<string, string> = { Ocean: 'Oceano', River: 'Rio', 'River; mountain lake': 'Rio; Lago da Montanha' };

const selects = [
  { id: 'season', label: 'Estação', options: [['all', 'Todas'], ['spring', 'Primavera'], ['summer', 'Verão'], ['fall', 'Outono'], ['winter', 'Inverno'], ['year-round', 'O ano todo'], ['unverified', 'Outros']] },
  { id: 'method', label: 'Método', options: [['all', 'Todos'], ['rod', 'Vara de pesca'], ['crab-pot', 'Covo']] },
  { id: 'status', label: 'Coleção', options: [['all', 'Todos'], ['recorded', 'Na coleção'], ['missing', 'Faltando']] },
] as const;

function WikiLink({ entry }: { entry: FishEntry }) {
  return (
    <a className="wiki-link" href={`https://pt.stardewvalleywiki.com/${encodeURIComponent(entry.namePt.replaceAll(' ', '_'))}`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${entry.namePt} na Wiki em português (nova aba)`}>
      Wiki
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 5h6v6" /><path d="m19 5-9 9" /><path d="M19 13v6H5V5h6" />
      </svg>
    </a>
  );
}

function FishCard({ entry, recorded, onToggle }: { entry: FishEntry; recorded: boolean; onToggle: (button: HTMLButtonElement) => void }) {
  return (
    <ItemCard
      className="item-card"
      collectionId="fishing"
      id={entry.id}
      namePt={entry.namePt}
      nameEn={entry.nameEn}
      recorded={recorded}
      statusText={recorded ? 'Na coleção' : 'Falta na coleção'}
      details={
        <dl className="conditions">
          <Condition label="Estação" value={entry.seasons ? (entry.seasons.length === 4 ? 'O ano todo' : entry.seasons.map((season) => seasonNames[season]).join(', ')) : null} />
          <Condition label="Local" value={entry.location ? (locationNames[entry.location] ?? entry.location) : null} />
          <Condition label="Horário" value={entry.time === 'any' ? 'Qualquer horário' : entry.time} />
          <Condition label="Clima" value={entry.weather ? weatherNames[entry.weather] : null} />
          <Condition label="Método" value={methodNames[entry.method]} />
          <Condition label="Requisitos" value={entry.specialRequirements} />
        </dl>
      }
      toggleText={recorded ? 'Remover da coleção' : 'Adicionar à coleção'}
      toggleLabel={`${recorded ? 'Remover' : 'Adicionar'} ${entry.namePt} ${recorded ? 'da' : 'à'} coleção`}
      onToggle={onToggle}
      wiki={<WikiLink entry={entry} />}
    />
  );
}

export function FishingPage() {
  const { filters, setFilters, store } = useDiary();
  const current = filters.fishing;
  const filtered = collection.filterEntries(collection.entries, current, store('fishing').recordedIdSet(collection.completion.requiredIds));
  return (
    <CollectionView<FishEntry>
      collection={collection}
      heading="Peixes"
      progressTitle="Sua coleção"
      recordedLabel="na coleção"
      placeholder="Ex.: Baiacu ou Pufferfish"
      selects={selects}
      filters={{ ...current }}
      onFilter={(next) => setFilters('fishing', next as Partial<FishingFilters>)}
      filtered={filtered}
      forEntry={collection.grouping.forEntry}
      renderCard={(entry, recorded, onToggle) => <FishCard entry={entry} recorded={recorded} onToggle={onToggle} />}
    />
  );
}
