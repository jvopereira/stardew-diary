import type { Ref, RefObject } from 'react';
import { Link, useLocation } from 'react-router';
import { asset, collections } from '../domain';
import { useDiary } from '../state/DiaryProvider';
import { routeForPath } from '../routes';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onClose: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
  onOpenImport: () => void;
  ref: Ref<HTMLElement>;
  open: boolean;
}

const navLabels = { fishing: 'Peixes', museum: 'Artigos do Museu' } as const;
const navPaths = { fishing: '/catalogo.html', museum: '/museu.html' } as const;

export function Sidebar({ collapsed, onToggleCollapsed, onClose, closeRef, onOpenImport, ref, open }: SidebarProps) {
  const { importedCount, theme, toggleTheme } = useDiary();
  const current = routeForPath(useLocation().pathname).collectionId;
  const status = importedCount === collections.length ? 'Save importado' : importedCount ? 'Atualize o save para sincronizar as coleções' : 'Nenhum save importado';
  const saveLabel = importedCount ? 'Atualizar save' : 'Importar save';
  const dark = theme === 'dark';
  const collapseLabel = collapsed ? 'Expandir navegação' : 'Recolher navegação';
  return (
    <aside className={`side-nav${open ? ' is-open' : ''}`} id="sidebar" aria-label="Navegação do diário" ref={ref}>
      <Link className="brand" to="/" aria-label="Diário do Vale" title="Diário do Vale"><img className="brand-icon" src={asset('assets/icons/stardrop.png')} alt="" /><span>Diário<br />do Vale</span></Link>
      <button className="nav-collapse" id="nav-collapse" type="button" aria-controls="sidebar" aria-expanded={!collapsed} aria-label={collapseLabel} title={collapseLabel} onClick={onToggleCollapsed}><span className="collapse-icon" aria-hidden="true"></span></button>
      <button className="nav-close" id="nav-close" type="button" aria-label="Fechar menu" ref={closeRef} onClick={onClose}>×</button>
      <p className="nav-caption">Suas coleções</p>
      <nav aria-label="Coleções">
        {collections.map((collection) => (
          <Link key={collection.id} to={navPaths[collection.id]} aria-label={navLabels[collection.id]} title={navLabels[collection.id]} aria-current={collection.id === current ? 'page' : undefined}>
            <img src={asset(`assets/icons/${collection.id}.png`)} alt="" className="game-icon" /><span>{navLabels[collection.id]}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-save">
        <p id="save-status" className="save-status" role="status" aria-live="polite">{status}</p>
        <p className="sidebar-help">Um save para todas as coleções.</p>
        <button className="save-open" id="open-save-import" type="button" aria-haspopup="dialog" aria-label={saveLabel} title={saveLabel} onClick={onOpenImport}><img className="game-icon" src={asset('assets/icons/save.png')} alt="" /><span className="save-label">{saveLabel}</span></button>
      </div>
      <button className="theme-toggle" id="theme-toggle" type="button" aria-label={dark ? 'Tema escuro; ativar tema claro' : 'Tema claro; ativar tema escuro'} title={dark ? 'Ativar tema claro' : 'Ativar tema escuro'} aria-pressed={dark} onClick={toggleTheme}><img className="theme-icon" src={asset(`assets/icons/${dark ? 'sun' : 'moon'}.svg`)} alt="" aria-hidden="true" /></button>
    </aside>
  );
}
