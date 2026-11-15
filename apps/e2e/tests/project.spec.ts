import { expect, open, test, transitionDone } from '../support/fixtures.ts';

test('a project opens from the developer world with its title, tools and links', async ({
  page,
}) => {
  await open(page, '/developpeur');
  await page
    .getByRole('region', { name: 'Réalisations' })
    .getByRole('link', { name: /Ledger/ })
    .click();

  await expect(page).toHaveURL('/developpeur/ledger');
  await transitionDone(page);
  await expect(page).toHaveTitle(/^Ledger/);
  await expect(page.getByRole('heading', { level: 1, name: 'Ledger' })).toBeVisible();

  const tools = page.getByRole('region', { name: 'Outils' }).getByRole('listitem');
  await expect(tools).toHaveText(['Next.js', 'React Native', 'TypeScript', 'Jira', 'GitHub']);

  const links = page.getByRole('link', { name: /\(nouvel onglet\)$/ }).filter({
    hasText: /^Voir/,
  });
  await expect(links).toHaveText(['Voir le site (nouvel onglet)', 'Voir la vidéo (nouvel onglet)']);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /\bnoopener\b/);
  }
  await expect(links.first()).toHaveAttribute('href', 'https://www.ledger.com/');

  await page
    .getByRole('navigation', { name: 'Fil d’Ariane' })
    .getByRole('link', { name: 'Réalisations' })
    .click();
  await expect(page).toHaveURL('/developpeur');
});
