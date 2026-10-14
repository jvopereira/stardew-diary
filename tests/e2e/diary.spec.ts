import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fixture = new URL('../fixtures/museum-1.6.xml', import.meta.url);
const progressKey = 'diario-do-vale-progress-v1';
const museumKey = 'diario-do-vale-progress-museum-v1';
const filtersKey = 'diario-do-vale-filters-v1';

async function seed(page: Page, values: Record<string, string>) {
  await page.addInitScript((entries) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, values);
}


test('pre-migration progress still loads and manual changes can be undone and restored', async ({ page }) => {
  await seed(page, { [progressKey]: JSON.stringify({ v: 1, base: ['pufferfish'], add: ['anchovy'], remove: [] }) });
  await page.goto('catalogo.html');
  await expect(page.locator('#progress-summary')).toHaveText('2 na coleção · faltam 70 de 72');
  await page.getByRole('button', { name: 'Adicionar Atum à coleção' }).first().click();
  await expect(page.locator('#progress-summary')).toHaveText('3 na coleção · faltam 69 de 72');
  const stored = JSON.parse(await page.evaluate((key) => localStorage.getItem(key)!, progressKey));
  expect(stored).toEqual({ v: 1, base: ['pufferfish'], add: ['anchovy', 'tuna'], remove: [] });

  await page.locator('.progress-panel summary').click();
  await page.locator('#undo-manual').click();
  await expect(page.locator('#progress-summary')).toHaveText('1 na coleção · faltam 71 de 72');
  await page.locator('#restore-initial').click();
  await expect(page.locator('#progress-summary')).toHaveText('0 na coleção · faltam 72 de 72');
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBeNull();
});

test('export downloads the current IDs', async ({ page }) => {
  await seed(page, { [progressKey]: JSON.stringify({ v: 1, base: null, add: ['pufferfish'], remove: [] }) });
  await page.goto('catalogo.html');
  await page.locator('.progress-panel summary').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export-progress').click()]);
  const body = JSON.parse(readFileSync(await download.path(), 'utf8'));
  expect(JSON.stringify(body)).toContain('pufferfish');
});

test('deleting local data clears progress, theme and filters', async ({ page }) => {
  await seed(page, {
    [progressKey]: JSON.stringify({ v: 1, base: null, add: ['pufferfish'], remove: [] }),
    'diario-do-vale-theme': 'dark',
    [filtersKey]: JSON.stringify({ v: 1, fishing: { season: 'summer' } }),
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('catalogo.html');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#season')).toHaveValue('summer');
  await page.locator('.progress-panel summary').click();
  await page.locator('#delete-local-data').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#season')).toHaveValue('all');
  await expect(page.locator('#progress-summary')).toHaveText('0 na coleção · faltam 72 de 72');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('diario-do-vale')))).toEqual([]);
});

test.describe('save import', () => {
  test('valid save updates both collections', async ({ page }) => {
    await page.goto('catalogo.html');
    await page.locator('#open-save-import').click();
    await expect(page.locator('#save-dialog')).toBeVisible();
    await page.locator('#save-file').setInputFiles(fileURLPath(fixture));
    await page.locator('#save-submit').click();
    await expect(page.locator('#import-message')).toHaveText(/Coleções atualizadas: 1 peixes e \d+ doações ao Museu\./);
    await expect(page.locator('#progress-summary')).toHaveText('1 na coleção · faltam 71 de 72');
    await page.keyboard.press('Escape');
    await expect(page.locator('#save-dialog')).toBeHidden();
    await expect(page.locator('#open-save-import')).toBeFocused();
    expect(await page.evaluate((key) => localStorage.getItem(key), museumKey)).not.toBeNull();
  });

  test('invalid save keeps previous progress', async ({ page }) => {
    await seed(page, { [progressKey]: JSON.stringify({ v: 1, base: null, add: ['tuna'], remove: [] }) });
    await page.goto('catalogo.html');
    await page.locator('#open-save-import').click();
    await page.locator('#save-file').setInputFiles({ name: 'save.xml', mimeType: 'text/xml', buffer: Buffer.from('<nope/>') });
    await page.locator('#save-submit').click();
    await expect(page.locator('#import-message')).toHaveClass(/is-error/);
    await expect(page.locator('#save-file')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#progress-summary')).toHaveText('1 na coleção · faltam 71 de 72');
  });

  test('closing the dialog cancels a running import', async ({ page }) => {
    await page.goto('catalogo.html');
    await page.locator('#open-save-import').click();
    await page.locator('#save-file').setInputFiles(fileURLPath(fixture));
    await page.evaluate(() => {
      const original = Blob.prototype.text;
      Blob.prototype.text = function () { return new Promise((resolve) => setTimeout(() => resolve(original.call(this)), 500)); };
      const arrayBuffer = Blob.prototype.arrayBuffer;
      Blob.prototype.arrayBuffer = function () { return new Promise((resolve) => setTimeout(() => resolve(arrayBuffer.call(this)), 500)); };
    });
    await page.locator('#save-submit').click();
    await page.locator('#close-save-import').click();
    await page.waitForTimeout(900);
    await expect(page.locator('#progress-summary')).toHaveText('0 na coleção · faltam 72 de 72');
    expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBeNull();
  });

  test('storage failure is reported', async ({ page }) => {
    await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); }; });
    await page.goto('catalogo.html');
    await page.locator('#open-save-import').click();
    await page.locator('#save-file').setInputFiles(fileURLPath(fixture));
    await page.locator('#save-submit').click();
    await expect(page.locator('#import-message')).toContainText('não foi possível salvar');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Adicionar Atum à coleção' }).first().click();
    await expect(page.locator('#action-message')).not.toBeEmpty();
  });
});

test('filters are per collection, persist, survive navigation and reject invalid values', async ({ page }) => {
  await seed(page, { [filtersKey]: JSON.stringify({ v: 1, fishing: { season: 'monsoon', status: 'missing' } }) });
  await page.goto('catalogo.html');
  await expect(page.locator('#season')).toHaveValue('all');
  await expect(page.locator('#status')).toHaveValue('missing');
  await page.locator('#search').fill('baiacu');
  await expect(page.locator('#result-count')).toHaveText('1 de 72 itens encontrados');
  await page.getByRole('link', { name: 'Artigos do Museu' }).click();
  await expect(page.locator('#search')).toHaveValue('');
  await page.locator('#status').selectOption('recorded');
  await page.goBack();
  await expect(page.locator('#search')).toHaveValue('baiacu');
  await page.reload();
  await expect(page.locator('#search')).toHaveValue('baiacu');
  await page.goto('museu.html');
  await expect(page.locator('#status')).toHaveValue('recorded');
});

test('navigation happens without reloads and keeps history, titles and focus', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('#conteudo h1')).toBeVisible();
  const fishingTitle = await page.title();
  await page.evaluate(() => { (window as unknown as { marker: number }).marker = 1; });
  await page.getByRole('link', { name: 'Artigos do Museu' }).click();
  await expect(page).toHaveURL(/\/stardew-diary\/museu\.html$/);
  await expect(page.locator('#conteudo h1')).toBeFocused();
  expect(await page.title()).not.toBe(fishingTitle);
  await expect(page.getByRole('link', { name: 'Artigos do Museu' })).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page).toHaveURL(/\/stardew-diary\/$/);
  expect(await page.title()).toBe(fishingTitle);
  await page.goForward();
  await expect(page).toHaveURL(/museu\.html$/);
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
});

test('direct URLs open the matching collection', async ({ page }) => {
  for (const [path, heading] of [['', /Peixes/], ['catalogo.html', /Peixes/], ['museu.html', /Museu/]] as const) {
    await page.goto(path);
    await expect(page.locator('#conteudo h1')).toHaveText(heading);
  }
});

test('toggling keeps focus, or moves it to the status filter when the card is filtered out', async ({ page }) => {
  await page.goto('catalogo.html');
  const add = page.getByRole('button', { name: 'Adicionar Baiacu à coleção' });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Remover Baiacu da coleção' })).toBeFocused();
  await page.locator('#status').selectOption('recorded');
  await page.getByRole('button', { name: 'Remover Baiacu da coleção' }).click();
  await expect(page.locator('#status')).toBeFocused();
  await expect(page.locator('#empty-state')).toBeVisible();
});

test('sidebar starts collapsed and remembers expansion for the session', async ({ page }) => {
  await page.goto('catalogo.html');
  const collapse = page.locator('#nav-collapse');
  await expect(collapse).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('link', { name: 'Peixes' })).toBeVisible();
  await collapse.click();
  await expect(collapse).toHaveAttribute('aria-expanded', 'true');
  await page.reload();
  await expect(page.locator('#nav-collapse')).toHaveAttribute('aria-expanded', 'true');
});

test('theme toggle persists and updates the theme color', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('catalogo.html');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#000000');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('progress changes sync across tabs', async ({ page, context }) => {
  await page.goto('catalogo.html');
  const other = await context.newPage();
  await other.goto('catalogo.html');
  await page.getByRole('button', { name: 'Adicionar Atum à coleção' }).first().click();
  await expect(other.locator('#progress-summary')).toHaveText('1 na coleção · faltam 71 de 72');
});

test('thumbnails load locally and pages do not overflow', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => { if (!request.url().startsWith('http://localhost:4173/')) external.push(request.url()); });
  for (const path of ['catalogo.html', 'museu.html']) {
    await page.goto(path);
    const first = page.locator('article img').first();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveJSProperty('complete', true);
    expect(await first.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(external).toEqual([]);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('menu traps focus, closes with Escape and after navigating', async ({ page }) => {
    await page.goto('catalogo.html');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#sidebar')).toHaveClass(/is-open/);
    await expect(page.locator('#nav-close')).toBeFocused();
    await expect(page.locator('#conteudo')).toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('#sidebar')).not.toHaveClass(/is-open/);
    await expect(page.locator('#nav-toggle')).toBeFocused();
    await page.locator('#nav-toggle').click();
    await page.getByRole('link', { name: 'Artigos do Museu' }).click();
    await expect(page.locator('#sidebar')).not.toHaveClass(/is-open/);
    await expect(page.locator('#conteudo h1')).toBeFocused();
  });
});

function fileURLPath(url: URL) { return decodeURIComponent(url.pathname); }
