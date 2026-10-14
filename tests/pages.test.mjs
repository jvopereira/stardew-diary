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

test('each legacy URL has an HTML entry that mounts the React app', () => {
  for (const path of ['index.html', 'catalogo.html', 'museu.html', '.nojekyll']) {
    assert.equal(existsSync(new URL(path, `file://${root}`)), true, `${path} must exist`);
  }
  for (const page of ['index.html', 'catalogo.html', 'museu.html']) {
    const html = contents(page);
    assert.match(html, /<div id="root"><\/div>/);
    assert.match(html, /<script type="module" src="\/src\/main\.tsx"><\/script>/);
  }
});

test('appearance is initialized before the app renders', () => {
  for (const page of ['index.html', 'catalogo.html', 'museu.html']) {
    const html = contents(page);
    const init = html.indexOf('scripts/theme-init.js');
    assert.ok(init > 0 && init < html.indexOf('/src/main.tsx'), `${page}: theme-init must run first`);
    assert.doesNotMatch(html.match(/<script[^>]*theme-init[^>]*>/)[0], /type="module"|defer|async/);
  }
});

test('Vite builds all entries under the project Pages prefix', () => {
  const config = contents('vite.config.ts');
  assert.match(config, /base: '\/stardew-diary\/'/);
  for (const entry of ['index.html', 'catalogo.html', 'museu.html']) assert.match(config, new RegExp(`'${entry.replace('.', '\\.')}'`));
  for (const path of ["'assets'", "'docs'", "'scripts/theme-init.js'", "'.nojekyll'"]) assert.ok(config.includes(path), `${path} must be copied`);
});

test('both catalogs use local thumbnails with no Wiki image requests', () => {
  const card = contents('src/components/ItemCard.tsx');
  assert.match(card, /asset\(`assets\/items\/\$\{collectionId\}\/\$\{itemId\}\.png`\)/);
  assert.match(card, /loading="lazy"/);
  for (const module of ['src/components/ItemCard.tsx', 'src/pages/FishingPage.tsx', 'src/pages/MuseumPage.tsx']) {
    assert.doesNotMatch(contents(module), /Special:Redirect|wikiThumbnailUrl/);
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
  const app = contents('src/App.tsx');
  assert.equal([...app.matchAll(/<SaveDialog\b/g)].length, 1);
  assert.match(app, /<Sidebar\b/);
  assert.doesNotMatch(app, /<header/);
  assert.match(contents('src/components/Sidebar.tsx'), /<aside className=\{`side-nav/);
  assert.match(contents('src/components/SaveDialog.tsx'), /<dialog className="save-dialog"/);
  for (const asset of ['stardrop', 'fishing', 'museum', 'save']) assert.ok(existsSync(new URL(`assets/icons/${asset}.png`, `file://${root}`)));
});
