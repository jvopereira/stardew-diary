import { progressExport, downloadProgress } from './export.js';
import { deleteLocalData, progressStorageKey } from './progress.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function initializeCatalog(collection, progressStore, card) {
  const entries = collection.entries;
  const { recordedIdSet, toggleManual, undoManualChanges, restoreInitialProgress, progressSummary, loadSavedProgress } = progressStore;
  const recordedLabel = collection.id === 'museum' ? 'doados' : 'na coleção';
  const controls = Object.fromEntries(collection.filters.map((id) => [id, document.getElementById(id)]));
  const groups = document.getElementById('catalog-groups');
  const count = document.getElementById('result-count');
  const empty = document.getElementById('empty-state');
  function render() {
    const filtered = collection.filterEntries(entries, Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.value])), recordedIdSet(collection.completion.requiredIds));
    groups.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const [key, title] of collection.grouping.groups) {
      const matches = filtered.filter((entry) => collection.grouping.forEntry(entry).includes(key));
      if (!matches.length) continue;
      const section = element('section', 'season-section');
      section.setAttribute('aria-labelledby', `group-${key}`);
      const heading = element('div', 'season-heading');
      const h2 = element('h2', '', title);
      h2.id = `group-${key}`;
      heading.append(h2, element('span', 'group-count', `${matches.length} ${matches.length === 1 ? 'item' : 'itens'}`));
      const grid = element('div', 'item-grid');
      grid.append(...matches.map(card));
      section.append(heading, grid);
      fragment.append(section);
    }
    groups.append(fragment);
    count.textContent = `${filtered.length} de ${entries.length} itens encontrados`;
    empty.hidden = filtered.length > 0;
    const progress = progressSummary(collection.completion.requiredIds);
    const percentage = progress.total ? Math.round(progress.recorded / progress.total * 100) : 0;
    document.getElementById('progress-summary').textContent = `${progress.recorded} ${recordedLabel} · faltam ${progress.missing} de ${progress.total}`;
    document.getElementById('progress-meter-value').style.inlineSize = `${percentage}%`;
    document.getElementById('progress-breakdown').textContent = progress.hasImportedBaseline
      ? `Do save${progress.importedVersion ? ` ${progress.importedVersion}` : ''}: ${progress.imported} ${recordedLabel}. Ajustes manuais: ${progress.manualChanges}.`
      : `Sem save importado. Ajustes locais: ${progress.manualChanges}.`;
    document.getElementById('undo-manual').disabled = progress.manualChanges === 0;
    document.getElementById('restore-initial').disabled = !progress.hasImportedBaseline && progress.manualChanges === 0;
  }

  for (const control of Object.values(controls)) control.addEventListener(control === controls.search ? 'input' : 'change', render);
  groups.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-record-id]');
    if (!button || !groups.contains(button)) return;
    const id = button.dataset.recordId;
    const saved = toggleManual(id);
    actionMessage.textContent = saved ? '' : 'Ajuste aplicado nesta aba, mas não foi possível salvá-lo neste navegador.';
    render();
    const replacement = [...groups.querySelectorAll('button[data-record-id]')].find((candidate) => candidate.dataset.recordId === id);
    (replacement ?? controls.status).focus();
  });

  const actionMessage = document.getElementById('action-message');

  document.getElementById('undo-manual').addEventListener('click', () => {
    const saved = undoManualChanges();
    render();
    actionMessage.textContent = saved
      ? 'Alterações manuais removidas. O progresso voltou à base do save, se houver.'
      : 'Alterações manuais removidas nesta aba, mas não foi possível atualizar os dados salvos.';
    actionMessage.focus();
  });
  document.getElementById('restore-initial').addEventListener('click', () => {
    window.dispatchEvent(new Event('diario:cancel-import'));
    const saved = restoreInitialProgress();
    window.dispatchEvent(new Event('diario:save-status-updated'));
    render();
    actionMessage.textContent = saved
      ? 'Progresso inicial restaurado. Save importado e alterações manuais removidos.'
      : 'Progresso limpo nesta aba, mas não foi possível remover os dados salvos neste navegador.';
    actionMessage.focus();
  });
  document.getElementById('export-progress').addEventListener('click', () => {
    try {
      downloadProgress(progressExport(collection, recordedIdSet(collection.completion.requiredIds)));
      actionMessage.textContent = 'Progresso atual exportado em JSON. O arquivo contém somente IDs do catálogo.';
    } catch {
      actionMessage.textContent = 'Não foi possível baixar o JSON neste navegador. O progresso atual foi mantido.';
    }
    actionMessage.focus();
  });
  document.getElementById('delete-local-data').addEventListener('click', () => {
    window.dispatchEvent(new Event('diario:cancel-import'));
    const progressDeleted = restoreInitialProgress();
    const themeDeleted = deleteLocalData();
    window.dispatchEvent(new Event('diario:reset-theme'));
    window.dispatchEvent(new Event('diario:local-data-deleted'));
    render();
    actionMessage.textContent = progressDeleted && themeDeleted
      ? 'Dados locais do site excluídos. Os arquivos do jogo não foram alterados.'
      : 'Progresso limpo nesta aba, mas não foi possível confirmar a exclusão dos dados salvos neste navegador.';
    actionMessage.focus();
  });

  render();

  window.addEventListener('diario:progress-updated', render);

  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === progressStorageKey(collection)) {
      window.dispatchEvent(new Event('diario:cancel-import'));
      loadSavedProgress();
      render();
    }
  });
}
