import { type Locator, type Page } from '@playwright/test';

import { appReady, expect, open, test } from '../support/fixtures.ts';

const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));

async function scrollTo(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await expect.poll(() => scrollY(page)).toBe(y);
}

/**
 * Clicks where the link is on screen. Playwright's own click first scrolls
 * its target into view, and Chrome scrolls the page back up for a sticky
 * header (measured: 400px became 75px), which is the very thing under test.
 */
async function clickInPlace(link: Locator) {
  const box = await link.boundingBox();
  if (!box) throw new Error('the link is not on screen');
  await link.page().mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test('the language switch opens the same world in English, at the same place', async ({ page }) => {
  await open(page, '/graphisme-3d');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await scrollTo(page, 600);

  await clickInPlace(page.getByRole('link', { name: 'English version' }));

  await expect(page).toHaveURL('/en/3d-art');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/^3D art/);
  await expect.poll(() => scrollY(page)).toBe(600);
  await appReady(page);

  await clickInPlace(page.getByRole('link', { name: 'Version française' }));
  await expect(page).toHaveURL('/graphisme-3d');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect.poll(() => scrollY(page)).toBe(600);
});

test('the language switch on a project page leads to its translated address', async ({ page }) => {
  await open(page, '/developpeur/ledger');
  await expect(page.getByRole('heading', { level: 1, name: 'Ledger' })).toBeVisible();
  await scrollTo(page, 400);

  await clickInPlace(page.getByRole('link', { name: 'English version' }));

  await expect(page).toHaveURL('/en/developer/ledger');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 2, name: 'Tools' })).toBeAttached();
  await expect.poll(() => scrollY(page)).toBe(400);
});

test('a piece keeps its own translated slug in the other tree', async ({ page }) => {
  await open(page, '/graphisme-3d/chambre');
  await expect(
    page.getByRole('link', { name: 'English version', includeHidden: true }),
  ).toHaveAttribute('href', '/en/3d-art/bedroom');

  await open(page, '/en/3d-art/bedroom');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('dialog', { name: '3D render viewer' })).toBeVisible();
});
