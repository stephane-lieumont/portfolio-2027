import { expect, open, test } from '../support/fixtures.ts';

test('the footer leads to the legal notice by keyboard, with a visible focus', async ({ page }) => {
  await open(page, '/developpeur');
  const link = page.getByRole('contentinfo').getByRole('link', { name: 'Mentions légales' });

  // Tabbing until the link takes focus: it is in the tab order, not only clickable.
  for (let i = 0; i < 120 && !(await link.evaluate((a) => a === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS('outline-style', 'solid');

  const box = await link.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(24);
  expect(box?.height).toBeGreaterThanOrEqual(24);

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/mentions-legales');
  await expect(page.getByRole('heading', { level: 1, name: 'Mentions légales' })).toBeVisible();
});

test('the language switch on the legal notice opens its English version', async ({ page }) => {
  await open(page, '/mentions-legales');

  await page.getByRole('link', { name: 'English version' }).click();

  await expect(page).toHaveURL('/en/legal-notice');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'Legal notice' })).toBeVisible();
  await expect(
    page.getByRole('contentinfo').getByRole('link', { name: 'Legal notice' }),
  ).toHaveAttribute('aria-current', 'page');
});
