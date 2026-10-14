// Maintenance only: the published site never downloads assets from the Wiki.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { collections } from './data/collections.js';
import { itemImagePath } from './item-images.js';

const root = new URL('../', import.meta.url);
const run = promisify(execFile);
const checkOnly = process.argv.includes('--check');
if (process.argv.slice(2).some((arg) => arg !== '--check')) throw Error('Uso: node scripts/download-item-images.mjs [--check]');
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function validPng(data) {
  return data.length >= 45 && data.length <= 1024 * 1024 &&
    data.subarray(0, 8).equals(pngSignature) && data.toString('ascii', 12, 16) === 'IHDR' &&
    data.readUInt32BE(16) > 0 && data.readUInt32BE(16) <= 4096 &&
    data.readUInt32BE(20) > 0 && data.readUInt32BE(20) <= 4096 &&
    data.toString('ascii', data.length - 8, data.length - 4) === 'IEND';
}

const assets = collections.flatMap((collection) => collection.entries.map((entry) => {
  if (!/^[a-z0-9-]+$/.test(collection.id) || !/^[a-z0-9-]+$/.test(entry.id)) throw Error('ID de imagem inválido.');
  const filename = `${entry.nameEn.replaceAll(' ', '_')}.png`;
  // MediaWiki's original-file address avoids an extra redirect for every sprite.
  const hash = createHash('md5').update(filename).digest('hex');
  return {
    collectionId: collection.id,
    itemId: entry.id,
    path: itemImagePath(collection.id, entry.id),
    sourceUrl: `https://stardewvalleywiki.com/Special:Redirect/file/${encodeURIComponent(filename)}`,
    directUrl: `https://stardewvalleywiki.com/mediawiki/images/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(filename)}`,
  };
}));

async function present(asset) {
  try { return validPng(await readFile(new URL(asset.path, root))); } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function download(asset) {
  const target = new URL(asset.path, root);
  const temporary = new URL(`${asset.path}.tmp`, root);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { stdout: data } = await run('curl', [
        '--fail', '--silent', '--show-error', '--location', '--max-time', '20',
        '--proto', '=https', '--proto-redir', '=https', attempt === 2 ? asset.sourceUrl : asset.directUrl,
      ], { encoding: 'buffer', maxBuffer: 1024 * 1024, timeout: 25000 });
      if (!validPng(data)) throw Error('PNG inválido ou incompleto.');
      await mkdir(new URL(`assets/items/${asset.collectionId}/`, root), { recursive: true });
      await writeFile(temporary, data);
      await rename(temporary, target);
      return;
    } catch (error) {
      await rm(temporary, { force: true });
      if (attempt === 3) throw error;
    }
  }
}

let next = 0, downloaded = 0, existing = 0;
const failures = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < assets.length) {
    const asset = assets[next++];
    try {
      if (await present(asset)) { existing++; continue; }
      if (checkOnly) throw Error('Imagem ausente ou inválida.');
      await download(asset);
      downloaded++;
      if (downloaded % 20 === 0) console.log(`${downloaded} imagens baixadas…`);
    } catch (error) { failures.push(`${asset.path}: ${error.message}`); }
  }
}));
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else if (!checkOnly) {
  await writeFile(new URL('assets/items/sources.json', root), `${JSON.stringify(assets, null, 2)}\n`);
}
console.log(`${assets.length} itens: ${downloaded} baixados, ${existing} já disponíveis, ${failures.length} falhas.`);
