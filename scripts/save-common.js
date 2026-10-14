export const MAX_SAVE_BYTES = 10 * 1024 * 1024;

export class SaveFormatError extends Error {
  constructor(message) { super(message); this.name = 'SaveFormatError'; }
}

export function child(parent, name) {
  return [...parent.children].find((node) => node.localName === name && !node.namespaceURI);
}

export function validateSaveXml(text) {
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
  return { root, version };
}

export async function readSaveText(file) {
  if (!file) throw new SaveFormatError('Selecione um arquivo da partida.');
  if (file.size === 0) throw new SaveFormatError('O arquivo está vazio.');
  if (file.size > MAX_SAVE_BYTES) throw new SaveFormatError('O arquivo excede o limite de 10 MiB. Nenhum progresso foi alterado.');
  if (/^(?:SaveGameInfo(?:_old)?|.*(?:_old|_SVBAK|_SVEMERG))$/i.test(file.name)) throw new SaveFormatError('Selecione o arquivo principal atual da partida, não SaveGameInfo ou um backup.');
  if (/\.(?:zip|gz|7z|rar|bin)$/i.test(file.name)) throw new SaveFormatError('Arquivo compactado ou binário não aceito. Selecione o save XML descompactado.');
  const text = await file.text();
  if (text.startsWith('PK') || text.charCodeAt(0) === 0x1f || text.includes('\u0000')) {
    throw new SaveFormatError('O arquivo parece compactado ou binário. Extraia o save XML antes de importar.');
  }
  return text;
}
