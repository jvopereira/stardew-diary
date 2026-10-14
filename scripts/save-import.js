import { readSaveText, validateSaveXml } from './save-common.js';
import { parseFishingSaveDocument } from './save-parser.js';
import { parseMuseumSaveDocument } from './museum-save-parser.js';

// Validate every collection before replacing any progress. Read and parse the XML once.
export async function readCollectionsSaveFile(file) {
  const document = validateSaveXml(await readSaveText(file));
  const fishing = parseFishingSaveDocument(document);
  const museum = parseMuseumSaveDocument(document);
  return { version: document.version, collections: { fishing: fishing.recordedIds, museum: museum.recordedIds } };
}
