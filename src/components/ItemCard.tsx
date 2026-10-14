import { useState, type ReactNode } from 'react';
import { asset } from '../domain';
import type { CollectionId } from '../types';

export function Thumbnail({ collectionId, itemId }: { collectionId: CollectionId; itemId: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="item-thumbnail" aria-hidden="true">
      <img src={asset(`assets/items/${collectionId}/${itemId}.png`)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    </div>
  );
}

interface ItemCardProps {
  className: string;
  collectionId: CollectionId;
  id: string;
  namePt: string;
  nameEn: string;
  recorded: boolean;
  statusText: string;
  details: ReactNode;
  toggleText: string;
  toggleLabel: string;
  onToggle: (button: HTMLButtonElement) => void;
  wiki: ReactNode;
}

export function ItemCard({ className, collectionId, id, namePt, nameEn, recorded, statusText, details, toggleText, toggleLabel, onToggle, wiki }: ItemCardProps) {
  return (
    <article className={className} data-id={id}>
      <div className="item-card-header">
        <Thumbnail collectionId={collectionId} itemId={id} />
        <div><h3>{namePt}</h3><p className="english-name">{nameEn}</p></div>
        <div className="item-status"><span className={`status-badge ${recorded ? 'is-recorded' : ''}`}>{statusText}</span></div>
      </div>
      {details}
      <div className="item-actions">
        <button className="record-toggle" type="button" data-record-id={id} aria-pressed={recorded} aria-label={toggleLabel} onClick={(event) => onToggle(event.currentTarget)}>{toggleText}</button>
        {wiki}
      </div>
    </article>
  );
}

export function Condition({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null) return null;
  return <div className="condition"><dt>{label}</dt><dd>{value}</dd></div>;
}
