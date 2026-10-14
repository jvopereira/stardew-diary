import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = new URL('dist/', `file://${root}`);
const base = 'https://example.github.io/stardew-diary/';
const pages = ['index.html', 'catalogo.html', 'museu.html'];
const read = (path, from = dist) => readFileSync(new URL(path, from));

test('build exists (run npm run build first)', () => {
  assert.ok(existsSync(new URL('index.html', dist)));
});

test('build publishes every legacy entry, .nojekyll and public files', () => {
  for (const path of [...pages, '.nojekyll', 'scripts/theme-init.js', 'docs/save-import.md', 'docs/museum-catalog.md', 'assets/icons/stardrop.png', 'assets/items/sources.json']) {
    assert.ok(existsSync(new URL(path, dist)), `${path} missing from dist`);
  }
  for (const collection of ['fishing', 'museum']) {
    const source = readdirSync(new URL(`assets/items/${collection}/`, `file://${root}`));
    const built = readdirSync(new URL(`assets/items/${collection}/`, dist));
    assert.deepEqual(built.sort(), source.sort());
  }
  assert.ok(read('scripts/theme-init.js').equals(read('scripts/theme-init.js', `file://${root}`)));
});

test('built HTML references resolve inside the project Pages prefix', () => {
  for (const page of pages) {
    const html = read(page).toString();
    const refs = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(refs.length >= 3, `${page}: expected theme script, bundle and stylesheet`);
    for (const ref of refs) {
      const url = new URL(ref, new URL(page, base));
      assert.ok(url.pathname.startsWith('/stardew-diary/'), `${page}: ${ref} escaped the prefix`);
      assert.ok(existsSync(new URL(url.pathname.slice('/stardew-diary/'.length), dist)), `${page}: ${ref} missing`);
    }
    assert.ok(html.indexOf('theme-init.js') < html.indexOf('type="module"'), `${page}: theme-init must run before the bundle`);
  }
});

test('bundle uses local item images and no Wiki image requests', () => {
  const scripts = readdirSync(new URL('assets/', dist)).filter((file) => file.endsWith('.js'));
  const bundle = scripts.map((file) => read(`assets/${file}`).toString()).join('\n');
  assert.match(bundle, /assets\/items\//);
  assert.doesNotMatch(bundle, /Special:Redirect/);
});
