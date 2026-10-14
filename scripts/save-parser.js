import { child, validateSaveXml, readSaveText, SaveFormatError } from './save-common.js';
export { MAX_SAVE_BYTES, SaveFormatError } from './save-common.js';
import { fishSaveIds } from './data/fish-save-ids.js';

const idToCatalog = new Map(Object.entries(fishSaveIds).map(([catalogId, saveId]) => [saveId, catalogId]));

function normalizedKey(raw) {
  if (!/^(?:\(O\))?[A-Za-z0-9_]{1,64}$/.test(raw)) throw new SaveFormatError('O registro de peixes contém um identificador inválido.');
  return raw.startsWith('(O)') ? raw.slice(3) : raw;
}

export function parseSaveXml(text) {
  return parseFishingSaveDocument(validateSaveXml(text));
}

export function parseFishingSaveDocument({ root, version }) {
  const player = child(root, 'player');
  const fishCaught = player && child(player, 'fishCaught');
  if (!fishCaught) throw new SaveFormatError('O save não contém o registro de peixes do jogador principal. O progresso atual foi mantido.');
  const found = new Set();
  let recognizedKeys = 0;
  for (const item of fishCaught.children) {
    if (item.localName !== 'item') throw new SaveFormatError('O registro de peixes tem uma estrutura inesperada.');
    const keyNode = child(item, 'key');
    const valueNode = child(item, 'value');
    if (!keyNode || !valueNode) throw new SaveFormatError('O registro de peixes está incompleto ou corrompido.');
    const key = child(keyNode, 'string') ?? child(keyNode, 'int');
    const value = child(valueNode, 'ArrayOfInt');
    const amountText = value && child(value, 'int')?.textContent.trim();
    const raw = key?.textContent.trim();
    if (!raw || !amountText || !/^\d{1,9}$/.test(amountText)) throw new SaveFormatError('O registro de peixes está incompleto ou corrompido.');
    const saveId = normalizedKey(raw);
    if (idToCatalog.has(saveId)) {
      recognizedKeys++;
      if (Number(amountText) > 0) found.add(idToCatalog.get(saveId));
    }
  }
  if (fishCaught.children.length && !recognizedKeys) throw new SaveFormatError('Nenhum peixe conhecido foi encontrado no registro. O progresso atual foi mantido.');
  return { version, recordedIds: found };
}

export async function readSaveFile(file) {
  return parseSaveXml(await readSaveText(file));
}
