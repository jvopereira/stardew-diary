import { museumCatalog } from './data/museum.js';
import { child, validateSaveXml, readSaveText, SaveFormatError } from './save-common.js';

const idToCatalog = new Map(museumCatalog.entries.map((entry) => [entry.saveId, entry.id]));
const XSI = 'http://www.w3.org/2001/XMLSchema-instance';
const invalid = () => new SaveFormatError('O registro de doações do Museu tem uma estrutura inválida. O progresso atual foi mantido.');

export function parseMuseumSaveXml(text) {
  return parseMuseumSaveDocument(validateSaveXml(text));
}

export function parseMuseumSaveDocument({ root, version }) {
  const locations = child(root, 'locations');
  const museums = locations && [...locations.children].filter((node) =>
    node.localName === 'GameLocation' && !node.namespaceURI && node.getAttributeNS(XSI, 'type') === 'LibraryMuseum'
  );
  if (!museums || museums.length !== 1) throw new SaveFormatError('O save não contém um Museu reconhecido. O progresso atual foi mantido.');
  const piecesNodes = [...museums[0].children].filter((node) => node.localName === 'museumPieces' && !node.namespaceURI);
  if (piecesNodes.length !== 1) throw invalid();
  const recordedIds = new Set();
  if ([...(piecesNodes[0].childNodes ?? [])].some((node) => node.nodeType === 3 && node.textContent.trim())) throw invalid();
  for (const item of piecesNodes[0].children) {
    if (item.localName !== 'item' || item.namespaceURI || item.children.length !== 2) throw invalid();
    const key = child(item, 'key');
    const value = child(item, 'value');
    const position = key && child(key, 'Vector2');
    if (!key || key.children.length !== 1 || !position || position.children.length !== 2 || !value || value.children.length !== 1) throw invalid();
    for (const axis of ['X', 'Y']) {
      const coordinate = child(position, axis);
      if (!coordinate || coordinate.children.length || !/^\d{1,3}$/.test(coordinate.textContent.trim())) throw invalid();
    }
    const idNode = child(value, 'int') ?? child(value, 'string');
    if (!idNode || idNode.children.length) throw invalid();
    const raw = idNode.textContent.trim();
    if (!/^(?:\(O\))?[A-Za-z0-9_]{1,64}$/.test(raw)) throw invalid();
    if (idNode.localName === 'int' && !/^\d{1,9}$/.test(raw)) throw invalid();
    const saveId = raw.replace(/^\(O\)/, '');
    const catalogId = idToCatalog.get(saveId);
    if (catalogId) recordedIds.add(catalogId);
  }
  return { version, recordedIds };
}

export async function readMuseumSaveFile(file) {
  return parseMuseumSaveXml(await readSaveText(file));
}
