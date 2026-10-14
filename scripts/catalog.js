import { collectionById } from './data/collections.js';
import * as progress from './progress.js';
import { initializeCatalog } from './catalog-controller.js';
import { itemImagePath } from './item-images.js';
const { isRecorded } = progress;

const collection = collectionById('fishing');
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

function condition(list, label, value) {
  if (value == null) return;
  const item = element('div', 'condition');
  item.append(element('dt', '', label));
  item.append(element('dd', '', value));
  list.append(item);
}

function thumbnail(entry) {
  const frame = element('div', 'item-thumbnail');
  frame.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = itemImagePath(collection.id, entry.id);
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => frame.remove());
  frame.append(image);
  return frame;
}

function card(entry) {
  const article = element('article', 'item-card');
  article.dataset.id = entry.id;
  const recorded = isRecorded(entry.id);
  const header = element('div', 'item-card-header');
  const titleBlock = element('div');
  titleBlock.append(element('h3', '', entry.namePt));
  titleBlock.append(element('p', 'english-name', entry.nameEn));
  const status = element('div', 'item-status');
  status.append(element('span', `status-badge ${recorded ? 'is-recorded' : ''}`, recorded ? 'Na coleção' : 'Falta na coleção'));
  header.append(thumbnail(entry), titleBlock, status);
  article.append(header);

  const details = element('dl', 'conditions');
  condition(details, 'Estação', entry.seasons ? (entry.seasons.length === 4 ? 'O ano todo' : entry.seasons.map((season) => seasonNames[season]).join(', ')) : null);
  condition(details, 'Local', entry.location ? (locationNames[entry.location] ?? entry.location) : null);
  condition(details, 'Horário', entry.time === 'any' ? 'Qualquer horário' : entry.time);
  condition(details, 'Clima', entry.weather ? weatherNames[entry.weather] : null);
  condition(details, 'Método', methodNames[entry.method]);
  condition(details, 'Requisitos', entry.specialRequirements);
  article.append(details);

  const actions = element('div', 'item-actions');
  const toggle = element('button', 'record-toggle', recorded ? 'Remover da coleção' : 'Adicionar à coleção');
  toggle.type = 'button';
  toggle.dataset.recordId = entry.id;
  toggle.setAttribute('aria-pressed', String(recorded));
  toggle.setAttribute('aria-label', `${recorded ? 'Remover' : 'Adicionar'} ${entry.namePt} ${recorded ? 'da' : 'à'} coleção`);
  const wiki = element('a', 'wiki-link', 'Wiki');
  wiki.setAttribute('aria-label', `Abrir ${entry.namePt} na Wiki em português (nova aba)`);
  const externalIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  externalIcon.setAttribute('viewBox', '0 0 24 24');
  externalIcon.setAttribute('width', '16');
  externalIcon.setAttribute('height', '16');
  externalIcon.setAttribute('fill', 'none');
  externalIcon.setAttribute('stroke', 'currentColor');
  externalIcon.setAttribute('stroke-width', '2');
  externalIcon.setAttribute('stroke-linecap', 'round');
  externalIcon.setAttribute('stroke-linejoin', 'round');
  externalIcon.setAttribute('aria-hidden', 'true');
  for (const shape of ['M13 5h6v6', 'm19 5-9 9', 'M19 13v6H5V5h6']) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', shape);
    externalIcon.append(path);
  }
  wiki.append(externalIcon);
  wiki.href = `https://pt.stardewvalleywiki.com/${encodeURIComponent(entry.namePt.replaceAll(' ', '_'))}`;
  wiki.target = '_blank';
  wiki.rel = 'noopener noreferrer';
  actions.append(toggle, wiki);
  article.append(actions);
  return article;
}

initializeCatalog(collection, progress, card);
