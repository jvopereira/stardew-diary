import { useEffect, useRef, type FormEvent, type RefObject } from 'react';
import { asset } from '../domain';
import { useDiary } from '../state/DiaryProvider';

export function SaveDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  const { importState, importResetKey, startImport, cancelImport } = useDiary();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener('close', cancelImport);
    return () => dialog.removeEventListener('close', cancelImport);
  }, [dialogRef, cancelImport]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void startImport(fileRef.current?.files?.[0]);
  }

  const message = importState.status === 'idle' ? '' : importState.message;
  return (
    <dialog className="save-dialog" id="save-dialog" aria-labelledby="save-title" ref={dialogRef}>
      <div className="dialog-heading">
        <h2 id="save-title"><img className="game-icon" src={asset('assets/icons/save.png')} alt="" />Importar save</h2>
        <button id="close-save-import" type="button" aria-label="Fechar importação" onClick={() => dialogRef.current?.close()}>×</button>
      </div>
      <p className="save-help" id="save-help">Importe uma vez para atualizar Peixes e Artigos do Museu. O progresso fica salvo neste navegador. Para atualizar após jogar, importe o save novamente.</p>
      <form id="save-form" className="save-form" onSubmit={submit}>
        <label htmlFor="save-file">Arquivo principal da partida</label>
        <input key={importResetKey} ref={fileRef} id="save-file" type="file" aria-describedby="save-help save-format import-message" aria-invalid={importState.status === 'error' || undefined} />
        <p className="save-format" id="save-format">XML 1.6.x, até 10 MiB. Leitura local. <a href={asset('docs/save-import.md')}>Formatos aceitos</a>.</p>
        <button id="save-submit" type="submit" disabled={importState.status === 'busy'}>Atualizar todas as coleções</button>
        <p id="import-message" className={`import-message${importState.status === 'error' ? ' is-error' : ''}`} role="status" aria-live="polite" aria-atomic="true">{message}</p>
      </form>
    </dialog>
  );
}
