import { collectionById } from './data/collections.js';
import { isRecorded, statusSource, recordedIdSet, toggleManual, undoManualChanges, restoreInitialProgress, replaceImportedProgress, progressSummary } from './progress.js';
import { SaveFormatError } from './save-parser.js';
import { progressExport, downloadProgress } from './export.js';

const collection = collectionById('fishing');
const entries = collection.entries;
const controls = Object.fromEntries(collection.filters.map((id) => [id, document.getElementById(id)]));
const groups = document.getElementById('catalog-groups');
const count = document.getElementById('result-count');
const empty = document.getElementById('empty-state');
const seasonNames = Object.fromEntries(collection.grouping.groups);
const methodNames = { rod: 'Vara de pesca', 'crab-pot': 'Covo' };
const weatherNames = { sunny: 'Ensolarado', rainy: 'Chuvoso', any: 'Qualquer clima' };
const locationNames = { Ocean: 'Oceano', River: 'Rio', 'River; mountain lake': 'Rio; Lago da Montanha' };

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function condition(list, label, value, partial = false) {
  const item = element('div', 'condition');
  item.append(element('dt', '', label));
  item.append(element('dd', '', value ?? 'A verificar'));
  if (partial && value !== null) item.append(element('span', 'condition-note', 'Condição parcial'));
  list.append(item);
}

function card(entry) {
  const article = element('article', 'item-card');
  article.dataset.id = entry.id;
  const recorded = isRecorded(entry.id);
  const header = element('div', 'item-card-header');
  const titleBlock = element('div');
  titleBlock.append(element('h3', '', entry.namePt));
  titleBlock.append(element('p', 'english-name', entry.nameEn));
  const source = statusSource(entry.id);
  const statusText = `${recorded ? 'Registrado' : 'Não registrado'}${source === 'none' ? '' : ` · ${source === 'save' ? 'save importado' : 'ajuste local'}`}`;
  header.append(titleBlock, element('span', `status-badge ${recorded ? 'is-recorded' : ''}`, statusText));
  article.append(header);

  const details = element('dl', 'conditions');
  condition(details, 'Estação', entry.seasons ? (entry.seasons.length === 4 ? 'O ano todo' : entry.seasons.map((season) => seasonNames[season]).join(', ')) : null, entry.needsVerification.includes('seasons'));
  condition(details, 'Local', entry.location ? (locationNames[entry.location] ?? entry.location) : null, entry.needsVerification.includes('location'));
  condition(details, 'Horário', entry.time === 'any' ? 'Qualquer horário' : entry.time, entry.needsVerification.includes('time'));
  condition(details, 'Clima', entry.weather ? weatherNames[entry.weather] : null, entry.needsVerification.includes('weather'));
  condition(details, 'Método', methodNames[entry.method]);
  condition(details, 'Requisitos', entry.specialRequirements, entry.needsVerification.includes('specialRequirements'));
  article.append(details);

  const actions = element('div', 'item-actions');
  const toggle = element('button', 'record-toggle', recorded ? 'Desmarcar registro' : 'Marcar como registrado');
  toggle.type = 'button';
  toggle.dataset.recordId = entry.id;
  toggle.setAttribute('aria-pressed', String(recorded));
  toggle.setAttribute('aria-label', `${recorded ? 'Desmarcar' : 'Marcar'} ${entry.namePt} como registrado`);
  const wiki = element('a', 'wiki-link', 'Ver na wiki em português');
  wiki.href = `https://pt.stardewvalleywiki.com/${encodeURIComponent(entry.namePt.replaceAll(' ', '_'))}`;
  wiki.target = '_blank';
  wiki.rel = 'noopener noreferrer';
  actions.append(toggle, wiki);
  article.append(actions);
  return article;
}

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
  document.getElementById('progress-summary').textContent = `${progress.recorded} registrados, ${progress.missing} faltando de ${progress.total} (${percentage}%).`;
  document.getElementById('progress-breakdown').textContent = progress.hasImportedBaseline
    ? `Base importada${progress.importedVersion ? ` do save ${progress.importedVersion}` : ''}: ${progress.imported} registrados. Ajustes locais: ${progress.manualChanges}.`
    : `Sem save importado. Ajustes locais: ${progress.manualChanges}.`;
  document.getElementById('undo-manual').disabled = progress.manualChanges === 0;
  document.getElementById('restore-initial').disabled = !progress.hasImportedBaseline && progress.manualChanges === 0;
  document.getElementById('import-another').disabled = !progress.hasImportedBaseline;
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

const saveForm = document.getElementById('save-form');
const saveFile = document.getElementById('save-file');
const saveSubmit = document.getElementById('save-submit');
const importMessage = document.getElementById('import-message');
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
  const saved = restoreInitialProgress();
  saveFile.value = '';
  saveFile.removeAttribute('aria-invalid');
  importMessage.textContent = '';
  render();
  actionMessage.textContent = saved
    ? 'Progresso inicial restaurado. Save importado e alterações manuais removidos.'
    : 'Progresso limpo nesta aba, mas não foi possível remover os dados salvos neste navegador.';
  actionMessage.focus();
});
document.getElementById('import-another').addEventListener('click', () => {
  actionMessage.textContent = 'Escolha outro arquivo e clique em Importar progresso. O progresso atual será mantido até a validação terminar.';
  saveFile.click();
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
  const progressDeleted = restoreInitialProgress();
  let themeDeleted = false;
  try {
    localStorage.removeItem('diario-do-vale-theme');
    themeDeleted = true;
  } catch { /* Report below without claiming deletion. */ }
  window.dispatchEvent(new Event('diario:reset-theme'));
  saveFile.value = '';
  saveFile.removeAttribute('aria-invalid');
  importMessage.textContent = '';
  render();
  actionMessage.textContent = progressDeleted && themeDeleted
    ? 'Dados locais do site excluídos. Os arquivos do jogo não foram alterados.'
    : 'Progresso limpo nesta aba, mas não foi possível confirmar a exclusão dos dados salvos neste navegador.';
  actionMessage.focus();
});
saveForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  saveSubmit.disabled = true;
  importMessage.classList.remove('is-error');
  saveFile.removeAttribute('aria-invalid');
  importMessage.textContent = 'Lendo o arquivo neste navegador…';
  try {
    const result = await collection.importSave(saveFile.files[0]);
    const saved = replaceImportedProgress(result.recordedIds, result.version);
    actionMessage.textContent = saved ? '' : 'Importação aplicada nesta aba, mas não foi possível salvar os IDs de progresso neste navegador.';
    render();
    importMessage.textContent = `Save ${result.version} importado: ${result.recordedIds.size} itens encontrados no catálogo.`;
  } catch (error) {
    importMessage.classList.add('is-error');
    saveFile.setAttribute('aria-invalid', 'true');
    importMessage.textContent = error instanceof SaveFormatError ? error.message : 'Não foi possível ler o arquivo. O progresso atual foi mantido.';
  } finally {
    saveFile.value = '';
    saveSubmit.disabled = false;
  }
});

document.getElementById('catalog-version').textContent = collection.gameVersion;
document.getElementById('catalog-review').textContent = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${collection.reviewedOn}T00:00:00Z`));
render();
