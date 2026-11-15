import { expect, open, test } from '../support/fixtures.ts';

const TREES = [
  {
    locale: 'fr',
    missing: ['/page-inconnue', '/developpeur/projet-inconnu'],
    title: 'Mais où est l’interphone ?',
    back: 'Retour aux réalisations',
    home: '/developpeur',
  },
  {
    locale: 'en',
    missing: ['/en/unknown-page', '/en/developer/unknown-project'],
    title: 'Where is the intercom?',
    back: 'Back to my work',
    home: '/en/developer',
  },
] as const;

for (const tree of TREES) {
  test.describe(`404 (${tree.locale})`, () => {
    for (const path of tree.missing) {
      test(`${path} answers 404 with the page in its language`, async ({ page }) => {
        const response = await open(page, path);

        expect(response?.status()).toBe(404);
        await expect(page).toHaveURL(path);
        await expect(page.locator('html')).toHaveAttribute('lang', tree.locale);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(tree.title);
      });
    }

    test('the link back leads to the developer world', async ({ page }) => {
      await open(page, tree.missing[0]);

      await page.getByRole('link', { name: tree.back }).click();

      await expect(page).toHaveURL(tree.home);
      await expect(page.locator('html')).toHaveAttribute('data-world', 'dev');
    });
  });
}
