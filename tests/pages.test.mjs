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
  for (const path of ['index.html', 'catalogo.html', '.nojekyll']) {
    assert.equal(existsSync(new URL(path, `file://${root}`)), true, `${path} must exist at the publishing root`);
  }
});

test('root entry opens the catalog through a relative redirect', () => {
  const html = contents('index.html');
  assert.match(html, /http-equiv="refresh" content="0; url=catalogo\.html"/);
  assert.match(html, /<a href="catalogo\.html">Abrir catálogo de pesca<\/a>/);
});

test('HTML and module assets resolve inside the project Pages prefix', () => {
  for (const page of ['index.html', 'catalogo.html']) {
    const html = contents(page);
    const assets = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
    for (const asset of assets) {
      if (/^(?:https?:|#)/.test(asset)) continue;
      const url = new URL(asset, base);
      assert.equal(url.pathname.startsWith('/stardew-diary/'), true, `${page}: ${asset} escaped the project prefix`);
      assert.equal(existsSync(new URL(url.pathname.slice('/stardew-diary/'.length), `file://${root}`)), true, `${page}: ${asset} is missing`);
    }
  }
  for (const page of ['index.html', 'catalogo.html']) {
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
  for (const module of ['scripts/app.js', 'scripts/catalog.js', 'scripts/progress.js', 'scripts/export.js', 'scripts/save-parser.js', 'scripts/catalog-model.js', 'scripts/data/collections.js']) {
    for (const match of contents(module).matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
      const source = new URL(module, base);
      const target = new URL(match[1], source);
      assert.equal(target.pathname.startsWith('/stardew-diary/'), true, `${module}: import escaped the project prefix`);
      assert.equal(existsSync(new URL(target.pathname.slice('/stardew-diary/'.length), `file://${root}`)), true, `${module}: import ${match[1]} is missing`);
    }
  }
});

test('catalog thumbnails use the fixed Wiki file endpoint', () => {
  const source = contents('scripts/catalog.js');
  assert.match(source, /https:\/\/stardewvalleywiki\.com\/Special:Redirect\/file\//);
  assert.match(source, /image\.loading = 'lazy'/);
  assert.match(source, /image\.referrerPolicy = 'no-referrer'/);
});
