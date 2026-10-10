import { fishSaveIds } from './data/fish-save-ids.js';

export const MAX_SAVE_BYTES = 10 * 1024 * 1024;
const idToCatalog = new Map(Object.entries(fishSaveIds).map(([catalogId, saveId]) => [saveId, catalogId]));

export class SaveFormatError extends Error {
  constructor(message) { super(message); this.name = 'SaveFormatError'; }
}

function child(parent, name) {
  return [...parent.children].find((node) => node.localName === name && !node.namespaceURI);
}

function normalizedKey(raw) {
  if (!/^(?:\(O\))?[A-Za-z0-9_]{1,64}$/.test(raw)) throw new SaveFormatError('O registro de peixes contém um identificador inválido.');
  return raw.startsWith('(O)') ? raw.slice(3) : raw;
}

export function parseSaveXml(text) {
  if (!text || !text.trim()) throw new SaveFormatError('O arquivo está vazio. Selecione o arquivo principal da partida.');
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text)) throw new SaveFormatError('O XML contém declarações externas não aceitas. Escolha um save original do jogo.');
  if (text.includes('\uFFFD')) throw new SaveFormatError('O texto do arquivo não pôde ser lido como XML UTF-8.');
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  if (xml.querySelector('parsererror') || xml.documentElement.localName !== 'SaveGame' || xml.documentElement.namespaceURI || xml.doctype) {
    throw new SaveFormatError('Formato não reconhecido ou XML inválido. Selecione o arquivo principal da partida, não SaveGameInfo.');
  }
  const root = xml.documentElement;
  const version = child(root, 'gameVersion')?.textContent.trim();
  if (!version || !/^1\.6(?:\.\d+)?$/.test(version)) {
    throw new SaveFormatError('Versão não compatível. Este leitor aceita apenas saves XML da versão 1.6.x.');
  }
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
  if (!file) throw new SaveFormatError('Selecione um arquivo da partida.');
  if (file.size === 0) throw new SaveFormatError('O arquivo está vazio.');
  if (file.size > MAX_SAVE_BYTES) throw new SaveFormatError('O arquivo excede o limite de 10 MiB. Nenhum progresso foi alterado.');
  if (/^(?:SaveGameInfo(?:_old)?|.*(?:_old|_SVBAK|_SVEMERG))$/i.test(file.name)) throw new SaveFormatError('Selecione o arquivo principal atual da partida, não SaveGameInfo ou um backup.');
  if (/\.(?:zip|gz|7z|rar|bin)$/i.test(file.name)) throw new SaveFormatError('Arquivo compactado ou binário não aceito. Selecione o save XML descompactado.');
  const text = await file.text();
  if (text.startsWith('PK') || text.charCodeAt(0) === 0x1f || text.includes('\u0000')) {
    throw new SaveFormatError('O arquivo parece compactado ou binário. Extraia o save XML antes de importar.');
  }
  return parseSaveXml(text);
}
