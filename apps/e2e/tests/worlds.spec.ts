import { type Page } from '@playwright/test';

import { expect, open, test, transitionDone } from '../support/fixtures.ts';

const header = (page: Page) => page.getByRole('navigation', { name: 'Navigation principale' });

async function switchWorldsBackAndForth(page: Page) {
  await open(page, '/developpeur');
  const dev = header(page).getByRole('link', { name: 'Développement' });
  const cgi = header(page).getByRole('link', { name: 'Graphisme 3D' });
  await expect(page.locator('html')).toHaveAttribute('data-world', 'dev');
  await expect(dev).toHaveAttribute('aria-current', 'page');

  await cgi.click();
  await expect(page).toHaveURL('/graphisme-3d');
  await expect(page.locator('html')).toHaveAttribute('data-world', 'cgi');
  await transitionDone(page);
  await expect(page).toHaveTitle(/^Graphisme 3D/);
  await expect(page.getByRole('heading', { level: 1, name: 'Stéphane Lieumont' })).toBeVisible();
  await expect(cgi).toHaveAttribute('aria-current', 'page');
  await expect(dev).not.toHaveAttribute('aria-current');
  await expect(page.getByRole('main')).toBeFocused();

  await dev.click();
  await expect(page).toHaveURL('/developpeur');
  await expect(page.locator('html')).toHaveAttribute('data-world', 'dev');
  await transitionDone(page);
  await expect(page).toHaveTitle(/^Lead Tech, Angular et \.NET/);
  await expect(dev).toHaveAttribute('aria-current', 'page');
  await expect(cgi).not.toHaveAttribute('aria-current');
}

test('the header switches between the developer and the 3D world', async ({ page }) => {
  await switchWorldsBackAndForth(page);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the world switch still lands on each world', async ({ page }) => {
    await switchWorldsBackAndForth(page);
  });
});

test('a direct load leaves focus to the browser, skip link first', async ({ page }) => {
  await open(page, '/graphisme-3d');
  await expect(page.locator('html')).toHaveAttribute('data-world', 'cgi');
  await expect(page.getByRole('main')).not.toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
});
