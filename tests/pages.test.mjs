import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { collections } from '../scripts/data/collections.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'https://example.github.io/stardew-diary/';

function contents(path) {
  return readFileSync(new URL(path, `file://${root}`), 'utf8');
}

test('Pages source is a build-free root with an entry page', () => {
  for (const path of ['index.html', 'catalogo.html', 'museu.html', '.nojekyll']) {
    assert.equal(existsSync(new URL(path, `file://${root}`)), true, `${path} must exist at the publishing root`);
  }
});

test('root entry opens the catalog through a relative redirect', () => {
  const html = contents('index.html');
  assert.match(html, /http-equiv="refresh" content="0; url=catalogo\.html"/);
  assert.match(html, /<a href="catalogo\.html">Abrir catálogo de peixes<\/a>/);
});

test('HTML and module assets resolve inside the project Pages prefix', () => {
  for (const page of ['index.html', 'catalogo.html', 'museu.html']) {
    const html = contents(page);
    const assets = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
    for (const asset of assets) {
      if (/^(?:https?:|#)/.test(asset)) continue;
      const url = new URL(asset, base);
      assert.equal(url.pathname.startsWith('/stardew-diary/'), true, `${page}: ${asset} escaped the project prefix`);
      assert.equal(existsSync(new URL(url.pathname.slice('/stardew-diary/'.length), `file://${root}`)), true, `${page}: ${asset} is missing`);
    }
  }
  for (const page of ['index.html', 'catalogo.html', 'museu.html']) {
    for (const match of contents(page).matchAll(/<a\b[^>]*?\bhref="([^"]+)"/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      const target = new URL(href, base);
      assert.equal(target.pathname.startsWith('/stardew-diary/'), true, `${page}: link ${href} escaped the project prefix`);
      const path = target.pathname.slice('/stardew-diary/'.length) || 'index.html';
      assert.equal(existsSync(new URL(path, `file://${root}`)), true, `${page}: link ${href} is missing`);
    }
  }
  for (const collection of collections) {
    const target = new URL(collection.href, base);
    assert.equal(existsSync(new URL(target.pathname.slice('/stardew-diary/'.length), `file://${root}`)), true, `${collection.id}: navigation page is missing`);
  }
  for (const module of ['scripts/app.js', 'scripts/catalog.js', 'scripts/progress.js', 'scripts/export.js', 'scripts/save-parser.js', 'scripts/catalog-model.js', 'scripts/data/collections.js', 'scripts/catalog-controller.js', 'scripts/save-common.js', 'scripts/museum.js', 'scripts/museum-model.js', 'scripts/museum-save-parser.js', 'scripts/data/museum.js', 'scripts/save-import.js', 'scripts/item-images.js']) {
    for (const match of contents(module).matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
      const source = new URL(module, base);
      const target = new URL(match[1], source);
      assert.equal(target.pathname.startsWith('/stardew-diary/'), true, `${module}: import escaped the project prefix`);
      assert.equal(existsSync(new URL(target.pathname.slice('/stardew-diary/'.length), `file://${root}`)), true, `${module}: import ${match[1]} is missing`);
    }
  }
});

test('both catalogs use local thumbnails with no Wiki image requests', () => {
  for (const module of ['scripts/catalog.js', 'scripts/museum.js']) {
    const source = contents(module);
    assert.match(source, /image\.src = itemImagePath\(collection\.id, entry\.id\)/);
    assert.doesNotMatch(source, /Special:Redirect|wikiThumbnailUrl/);
    assert.match(source, /image\.loading = 'lazy'/);
  }
});

test('all 167 items have unique local PNGs and documented sources within the Pages prefix', () => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const sources = JSON.parse(contents('assets/items/sources.json'));
  const paths = new Set();
  for (const collection of collections) {
    for (const entry of collection.entries) {
      const path = `assets/items/${collection.id}/${entry.id}.png`;
      const url = new URL(path, base);
      assert.ok(url.pathname.startsWith('/stardew-diary/'));
      const data = readFileSync(new URL(path, `file://${root}`));
      assert.ok(data.subarray(0, 8).equals(signature), `${path}: invalid PNG`);
      assert.equal(data.toString('ascii', 12, 16), 'IHDR');
      assert.ok(data.readUInt32BE(16) > 0 && data.readUInt32BE(20) > 0);
      assert.equal(data.toString('ascii', data.length - 8, data.length - 4), 'IEND');
      assert.ok(sources.some((source) => source.path === path && source.itemId === entry.id && source.collectionId === collection.id && source.sourceUrl.startsWith('https://stardewvalleywiki.com/Special:Redirect/file/')));
      paths.add(path);
    }
  }
  assert.equal(paths.size, 167);
  assert.equal(sources.length, 167);
});

test('each collection uses a sidebar and one shared save dialog', () => {
  for (const page of ['catalogo.html', 'museu.html']) {
    const html = contents(page);
    assert.match(html, /<aside class="side-nav"/);
    assert.doesNotMatch(html, /<header/);
    assert.equal([...html.matchAll(/id="save-form"/g)].length, 1);
    assert.match(html, /<dialog class="save-dialog"/);
    assert.doesNotMatch(html, /class="save-import"/);
    for (const asset of ['stardrop', 'fishing', 'museum', 'save']) assert.ok(existsSync(new URL(`assets/icons/${asset}.png`, `file://${root}`)));
  }
});
