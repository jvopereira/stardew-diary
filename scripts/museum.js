import { collectionById } from './data/collections.js';
import { progressForCollection } from './progress.js';
import { initializeCatalog } from './catalog-controller.js';
import { itemImagePath } from './item-images.js';

const collection = collectionById('museum');
const progress = progressForCollection(collection.id);
const types = Object.fromEntries(collection.grouping.groups);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function card(entry) {
  const recorded = progress.isRecorded(entry.id);
  const article = element('article', 'item-card museum-card');
  article.dataset.id = entry.id;
  const header = element('div', 'item-card-header');
  const thumbnail = element('div', 'item-thumbnail');
  thumbnail.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = itemImagePath(collection.id, entry.id);
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => thumbnail.remove());
  thumbnail.append(image);
  const title = element('div');
  title.append(element('h3', '', entry.namePt), element('p', 'english-name', entry.nameEn));
  const status = element('div', 'item-status');
  status.append(element('span', `status-badge ${recorded ? 'is-recorded' : ''}`, recorded ? 'Doado' : 'Falta doar'));
  header.append(thumbnail, title, status);
  article.append(header);
  const details = element('dl', 'conditions');
  for (const [label, value] of [['Tipo', types[entry.type]], ['Como obter', entry.obtaining]]) {
    const item = element('div', 'condition');
    item.append(element('dt', '', label), element('dd', '', value ?? 'A verificar'));
    details.append(item);
  }
  if (entry.needsVerification.length) details.append(element('p', 'condition-note', 'Informações de obtenção a verificar.'));
  article.append(details);
  const actions = element('div', 'item-actions');
  const button = element('button', 'record-toggle', recorded ? 'Desmarcar doação' : 'Marcar como doado');
  button.type = 'button';
  button.dataset.recordId = entry.id;
  button.setAttribute('aria-pressed', String(recorded));
  button.setAttribute('aria-label', `${recorded ? 'Desmarcar doação de' : 'Marcar como doado:'} ${entry.namePt}`);
  const wiki = element('a', 'wiki-link', 'Wiki ↗');
  wiki.href = entry.wikiUrl;
  wiki.target = '_blank';
  wiki.rel = 'noopener noreferrer';
  wiki.setAttribute('aria-label', `Abrir ${entry.namePt} na Wiki em português (nova aba)`);
  actions.append(button, wiki);
  article.append(actions);
  return article;
}

initializeCatalog(collection, progress, card);
