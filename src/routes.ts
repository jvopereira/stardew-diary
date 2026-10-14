import type { CollectionId } from './types';

export interface RouteInfo { collectionId: CollectionId; title: string; description: string }

const fishing: RouteInfo = { collectionId: 'fishing', title: 'Peixes — Diário do Vale', description: 'Explore a coleção de pesca do Diário do Vale por estação, método e status.' };
const museum: RouteInfo = { collectionId: 'museum', title: 'Artigos do Museu — Diário do Vale', description: 'Explore artefatos e minerais do Museu por tipo e status de doação.' };

export function routeForPath(pathname: string): RouteInfo {
  return pathname.endsWith('/museu.html') ? museum : fishing;
}
