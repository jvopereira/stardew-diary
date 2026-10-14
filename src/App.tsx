import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { asset } from './domain';
import { Sidebar } from './components/Sidebar';
import { SaveDialog } from './components/SaveDialog';
import { FishingPage } from './pages/FishingPage';
import { MuseumPage } from './pages/MuseumPage';
import { routeForPath } from './routes';

const SIDEBAR_STORAGE_KEY = 'diario-do-vale-sidebar';
const mobileQuery = '(max-width: 760px)';

export function App() {
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [collapsed, setCollapsed] = useState(() => document.documentElement.dataset.sidebar !== 'expanded');
  const [navOpen, setNavOpenState] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia(mobileQuery).matches);
  const returnFocus = useRef(false);

  const setNavOpen = useCallback((open: boolean, focusToggle = false) => {
    returnFocus.current = focusToggle;
    setNavOpenState(open);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
  }, [collapsed]);

  useEffect(() => {
    const media = window.matchMedia(mobileQuery);
    const onChange = () => { setMobile(media.matches); setNavOpen(false); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [setNavOpen]);

  useEffect(() => {
    document.body.classList.toggle('nav-is-open', navOpen);
    if (sidebarRef.current) sidebarRef.current.inert = mobile && !navOpen;
    if (mainRef.current) mainRef.current.inert = mobile && navOpen;
    if (navOpen) closeRef.current?.focus();
    else if (returnFocus.current) { toggleRef.current?.focus(); returnFocus.current = false; }
  }, [navOpen, mobile]);

  useEffect(() => {
    if (!navOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      const sidebar = sidebarRef.current;
      if (!sidebar || dialogRef.current?.open) return;
      if (event.key === 'Escape') setNavOpen(false, true);
      if (event.key === 'Tab') {
        const focusable = [...sidebar.querySelectorAll<HTMLElement>('a,button')].filter((element) => element.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpen, setNavOpen]);

  // After in-app navigation: close the mobile menu, retitle the page and move focus to the collection title.
  const firstRender = useRef(true);
  useEffect(() => {
    const route = routeForPath(location.pathname);
    document.title = route.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', route.description);
    if (firstRender.current) { firstRender.current = false; return; }
    setNavOpen(false);
    // The closing menu's effect runs later; lift inert now so the heading can take focus.
    if (mainRef.current) mainRef.current.inert = false;
    document.querySelector<HTMLElement>('#conteudo h1')?.focus();
  }, [location.pathname, setNavOpen]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try { sessionStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'collapsed' : 'expanded'); } catch { /* Keep the choice for this page. */ }
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <button className="nav-toggle" id="nav-toggle" type="button" aria-controls="sidebar" aria-expanded={navOpen} ref={toggleRef} onClick={() => setNavOpen(true)}><img className="game-icon" src={asset('assets/icons/stardrop.png')} alt="" />Menu</button>
      <div className="nav-backdrop" id="nav-backdrop" hidden={!navOpen} onClick={() => setNavOpen(false, true)}></div>
      <Sidebar
        ref={sidebarRef}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onClose={() => setNavOpen(false, true)}
        closeRef={closeRef}
        onOpenImport={() => dialogRef.current?.showModal()}
        open={navOpen}
      />
      <SaveDialog dialogRef={dialogRef} />
      <main id="conteudo" className="catalog-page" ref={mainRef}>
        <Routes>
          <Route path="/" element={<FishingPage />} />
          <Route path="/catalogo.html" element={<FishingPage />} />
          <Route path="/museu.html" element={<MuseumPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
