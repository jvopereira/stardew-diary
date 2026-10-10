// Apply a saved choice before CSS loads, so reloads do not flash the wrong theme.
(() => {
  let saved;
  try { saved = localStorage.getItem('diario-do-vale-theme'); } catch { /* Storage may be unavailable. */ }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = saved === 'light' || saved === 'dark' ? saved : (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
})();
