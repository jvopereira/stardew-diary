// Apply a saved choice before CSS loads, so reloads do not flash the wrong theme.
(() => {
  let saved;
  try { saved = localStorage.getItem('diario-do-vale-theme'); } catch { /* Storage may be unavailable. */ }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = saved === 'light' || saved === 'dark' ? saved : (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  let sidebar = 'collapsed';
  try { if (sessionStorage.getItem('diario-do-vale-sidebar') === 'expanded') sidebar = 'expanded'; } catch { /* Use the compact rail when storage is unavailable. */ }
  document.documentElement.dataset.sidebar = sidebar;
})();
