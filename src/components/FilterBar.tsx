import type { Ref } from 'react';

export interface SelectFilter { id: string; label: string; options: readonly (readonly [string, string])[] }

interface FilterBarProps {
  className?: string;
  placeholder: string;
  search: string;
  onSearch: (value: string) => void;
  selects: readonly SelectFilter[];
  values: Record<string, string>;
  onSelect: (id: string, value: string) => void;
  statusRef: Ref<HTMLSelectElement>;
}

export function FilterBar({ className = '', placeholder, search, onSearch, selects, values, onSelect, statusRef }: FilterBarProps) {
  return (
    <div className={`catalog-tools ${className}`.trim()} role="group" aria-label="Buscar e filtrar catálogo">
      <div className="field field-search">
        <label htmlFor="search">Buscar por nome</label>
        <input id="search" className="form-control" type="search" placeholder={placeholder} autoComplete="off" value={search} onChange={(event) => onSearch(event.target.value)} />
      </div>
      {selects.map((select) => (
        <div className="field" key={select.id}>
          <label htmlFor={select.id}>{select.label}</label>
          <select id={select.id} className="filter-control" value={values[select.id]} ref={select.id === 'status' ? statusRef : undefined} onChange={(event) => onSelect(select.id, event.target.value)}>
            {select.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
