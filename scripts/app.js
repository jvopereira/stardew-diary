import { collections } from './data/collections.js';

// Application behavior stays separate from collection data and page styles.
const year = document.querySelector('#footer-year');
if (year) year.textContent = String(new Date().getFullYear());

for (const nav of document.querySelectorAll('[data-collection-nav]')) {
  const current = nav.dataset.currentCollection;
  for (const collection of collections) {
    const link = document.createElement('a');
    link.href = collection.href;
    link.textContent = collection.label;
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
  themeToggle?.setAttribute('aria-label', dark ? 'Tema escuro' : 'Tema claro');
  const label = themeToggle?.querySelector('.theme-label');
  if (label) label.textContent = dark ? 'Tema: escuro' : 'Tema: claro';
  const icon = themeToggle?.querySelector('.theme-icon');
  if (icon) icon.textContent = dark ? '☀' : '☾';
  if (themeColor) themeColor.content = dark ? '#102b2b' : '#173d3a';
}

applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
themeToggle?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* The toggle still works for this visit. */ }
});

window.addEventListener('diario:reset-theme', () => {
  applyTheme(window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
});
