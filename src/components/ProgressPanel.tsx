import type { RefObject } from 'react';
import { asset, exportCollection } from '../domain';
import { useDiary } from '../state/DiaryProvider';
import type { Collection } from '../types';

interface ProgressPanelProps {
  collection: Collection;
  title: string;
  recordedLabel: string;
  message: string;
  messageRef: RefObject<HTMLParagraphElement | null>;
  announce: (text: string) => void;
}

export function ProgressPanel({ collection, title, recordedLabel, message, messageRef, announce }: ProgressPanelProps) {
  const diary = useDiary();
  const store = diary.store(collection.id);
  const progress = store.progressSummary(collection.completion.requiredIds);
  const percentage = progress.total ? Math.round(progress.recorded / progress.total * 100) : 0;

  return (
    <details className="progress-panel">
      <summary>
        <div className="progress-heading"><h2 id="progress-title"><img className="game-icon" src={asset('assets/icons/stardrop.png')} alt="" />{title}</h2></div>
        <p id="progress-summary" className="progress-summary" role="status" aria-live="polite">{`${progress.recorded} ${recordedLabel} · faltam ${progress.missing} de ${progress.total}`}</p>
        <div className="progress-meter" aria-hidden="true"><span id="progress-meter-value" style={{ inlineSize: `${percentage}%` }}></span></div>
      </summary>
      <div className="progress-details">
        <p id="progress-breakdown" className="progress-breakdown">
          {progress.hasImportedBaseline
            ? `Do save${progress.importedVersion ? ` ${progress.importedVersion}` : ''}: ${progress.imported} ${recordedLabel}. Ajustes manuais: ${progress.manualChanges}.`
            : `Sem save importado. Ajustes locais: ${progress.manualChanges}.`}
        </p>
        <div className="progress-actions">
          <div className="progress-action">
            <button id="undo-manual" type="button" aria-describedby="undo-manual-help" disabled={progress.manualChanges === 0} onClick={() => announce(diary.undoManual(collection.id)
              ? 'Alterações manuais removidas. O progresso voltou à base do save, se houver.'
              : 'Alterações manuais removidas nesta aba, mas não foi possível atualizar os dados salvos.')}>Desfazer alterações manuais</button>
            <p id="undo-manual-help">Remove ajustes manuais; mantém o save importado.</p>
          </div>
          <div className="progress-action">
            <button id="restore-initial" type="button" aria-describedby="restore-initial-help" disabled={!progress.hasImportedBaseline && progress.manualChanges === 0} onClick={() => announce(diary.restoreInitial(collection.id)
              ? 'Progresso inicial restaurado. Save importado e alterações manuais removidos.'
              : 'Progresso limpo nesta aba, mas não foi possível remover os dados salvos neste navegador.')}>Restaurar progresso inicial</button>
            <p id="restore-initial-help">Limpa apenas esta coleção; mantém as demais.</p>
          </div>
        </div>
        <div className="local-data-action">
          <button id="delete-local-data" type="button" aria-describedby="delete-local-data-help" onClick={() => announce(diary.deleteAllLocalData(collection.id)
            ? 'Dados locais do site excluídos. Os arquivos do jogo não foram alterados.'
            : 'Progresso limpo nesta aba, mas não foi possível confirmar a exclusão dos dados salvos neste navegador.')}>Excluir dados locais do site</button>
          <p id="delete-local-data-help">Apaga tema, filtros e progresso de todas as coleções deste navegador. Não altera arquivos do jogo.</p>
        </div>
        <div className="export-action">
          <button id="export-progress" type="button" aria-describedby="export-progress-help" onClick={() => {
            try {
              exportCollection(collection, store.recordedIdSet(collection.completion.requiredIds));
              announce('Progresso atual exportado em JSON. O arquivo contém somente IDs do catálogo.');
            } catch {
              announce('Não foi possível baixar o JSON neste navegador. O progresso atual foi mantido.');
            }
          }}>Exportar progresso em JSON</button>
          <p id="export-progress-help">Baixa os IDs da sua coleção, incluindo ajustes locais. Não inclui dados do save.</p>
        </div>
        <p id="action-message" className="action-message" role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} ref={messageRef}>{message}</p>
      </div>
    </details>
  );
}
