import { collections } from './data/collections.js';
import { progressForCollection, replaceCollectionsProgress, progressStorageKey } from './progress.js';
import { readCollectionsSaveFile } from './save-import.js';
import { SaveFormatError } from './save-common.js';

for (const nav of document.querySelectorAll('[data-collection-nav]')) {
  if (collections.length < 2) continue;
  nav.hidden = false;
  const current = nav.dataset.currentCollection;
  for (const collection of collections) {
    const link = document.createElement('a');
    link.href = collection.href;
    const icon = document.createElement('img');
    icon.src = `assets/icons/${collection.id === 'fishing' ? 'fishing' : 'museum'}.png`;
    icon.alt = '';
    icon.className = 'game-icon';
    const label = document.createElement('span');
    label.textContent = collection.id === 'fishing' ? 'Peixes' : collection.label;
    link.setAttribute('aria-label', label.textContent);
    link.title = label.textContent;
    link.append(icon, label);
    if (collection.id === current) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
}

const THEME_STORAGE_KEY = 'diario-do-vale-theme';
const themeToggle = document.querySelector('#theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  themeToggle?.setAttribute('aria-pressed', String(dark));
  themeToggle?.setAttribute('aria-label', dark ? 'Tema escuro; ativar tema claro' : 'Tema claro; ativar tema escuro');
  const icon = themeToggle?.querySelector('.theme-icon');
  if (icon) icon.src = `assets/icons/${dark ? 'sun' : 'moon'}.svg`;
  if (themeToggle) themeToggle.title = dark ? 'Ativar tema claro' : 'Ativar tema escuro';
  if (themeColor) themeColor.content = dark ? '#000000' : '#e8e7da';
}

applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
themeToggle?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* The toggle still works for this visit. */ }
});

const sidebar = document.getElementById('sidebar');
const navToggle = document.getElementById('nav-toggle');
const navBackdrop = document.getElementById('nav-backdrop');
const mobileNav = window.matchMedia('(max-width: 760px)');
const navCollapse = document.getElementById('nav-collapse');
function setSidebarCollapsed(collapsed) {
  document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
  navCollapse.setAttribute('aria-expanded', String(!collapsed));
  navCollapse.setAttribute('aria-label', collapsed ? 'Expandir navegação' : 'Recolher navegação');
  navCollapse.title = collapsed ? 'Expandir navegação' : 'Recolher navegação';
}
setSidebarCollapsed(document.documentElement.dataset.sidebar !== 'expanded');
navCollapse.addEventListener('click', () => {
  setSidebarCollapsed(document.documentElement.dataset.sidebar !== 'collapsed');
  try { sessionStorage.setItem('diario-do-vale-sidebar', document.documentElement.dataset.sidebar); } catch { /* Keep the choice for this page. */ }
});
function setNavOpen(open, returnFocus = false) {
  sidebar.classList.toggle('is-open', open);
  sidebar.inert = mobileNav.matches && !open;
  navToggle.setAttribute('aria-expanded', String(open));
  navBackdrop.hidden = !open;
  document.body.classList.toggle('nav-is-open', open);
  document.querySelector('main').inert = mobileNav.matches && open;
  if (open) document.getElementById('nav-close').focus();
  else if (returnFocus) navToggle.focus();
}
setNavOpen(false);
navToggle.addEventListener('click', () => setNavOpen(true));
document.getElementById('nav-close').addEventListener('click', () => setNavOpen(false, true));
navBackdrop.addEventListener('click', () => setNavOpen(false, true));
mobileNav.addEventListener('change', () => setNavOpen(false));
document.addEventListener('keydown', (event) => {
  if (sidebar.classList.contains('is-open') && !saveDialog.open) {
    if (event.key === 'Escape') setNavOpen(false, true);
    if (event.key === 'Tab') {
      const focusable = [...sidebar.querySelectorAll('a,button')].filter((element) => element.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
});

const saveDialog = document.getElementById('save-dialog');
const saveOpen = document.getElementById('open-save-import');
const saveFile = document.getElementById('save-file');
const saveSubmit = document.getElementById('save-submit');
const importMessage = document.getElementById('import-message');
let importGeneration = 0;

function cancelImport() {
  importGeneration++;
  saveSubmit.disabled = false;
  saveFile.value = '';
  saveFile.removeAttribute('aria-invalid');
  importMessage.textContent = '';
  importMessage.classList.remove('is-error');
}
function updateSaveStatus() {
  const imported = collections.filter((collection) => progressForCollection(collection.id).progressSummary(collection.completion.requiredIds).hasImportedBaseline).length;
  document.getElementById('save-status').textContent = imported === collections.length ? 'Save importado' : imported ? 'Atualize o save para sincronizar as coleções' : 'Nenhum save importado';
  const saveLabel = imported ? 'Atualizar save' : 'Importar save';
  saveOpen.querySelector('.save-label').textContent = saveLabel;
  saveOpen.setAttribute('aria-label', saveLabel);
  saveOpen.title = saveLabel;
}
saveOpen.addEventListener('click', () => saveDialog.showModal());
document.getElementById('close-save-import').addEventListener('click', () => saveDialog.close());
saveDialog.addEventListener('close', cancelImport);
window.addEventListener('diario:cancel-import', cancelImport);
window.addEventListener('diario:save-status-updated', updateSaveStatus);
window.addEventListener('diario:local-data-deleted', () => {
  for (const collection of collections) progressForCollection(collection.id).loadSavedProgress();
  updateSaveStatus();
});
window.addEventListener('storage', (event) => {
  if (event.key === null || collections.some((collection) => event.key === progressStorageKey(collection))) {
    cancelImport();
    for (const collection of collections) progressForCollection(collection.id).loadSavedProgress();
    updateSaveStatus();
  }
});
document.getElementById('save-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const generation = ++importGeneration;
  saveSubmit.disabled = true;
  importMessage.classList.remove('is-error');
  saveFile.removeAttribute('aria-invalid');
  importMessage.textContent = 'Atualizando suas coleções…';
  try {
    const result = await readCollectionsSaveFile(saveFile.files[0]);
    if (generation !== importGeneration) return;
    const saved = replaceCollectionsProgress(result);
    window.dispatchEvent(new Event('diario:progress-updated'));
    updateSaveStatus();
    importMessage.textContent = `Coleções atualizadas: ${result.collections.fishing.size} peixes e ${result.collections.museum.size} doações ao Museu.${saved ? '' : ' O progresso foi aplicado, mas não foi possível salvar todas as coleções neste navegador.'}`;
  } catch (error) {
    if (generation !== importGeneration) return;
    importMessage.classList.add('is-error');
    saveFile.setAttribute('aria-invalid', 'true');
    importMessage.textContent = error instanceof SaveFormatError ? error.message : 'Não foi possível ler o arquivo. O progresso anterior foi mantido.';
  } finally {
    if (generation === importGeneration) { saveFile.value = ''; saveSubmit.disabled = false; }
  }
});
updateSaveStatus();

window.addEventListener('diario:reset-theme', () => {
  applyTheme(window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
});
