import { expect, open, scrollsSideways, test, transitionDone } from '../support/fixtures.ts';

// The narrowest phone the site is laid out for (ADR-0011): nothing is removed
// at this width, and nothing scrolls sideways.
test.use({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });

test('on a phone, the header and the dock reach every world and contact', async ({ page }) => {
  await open(page, '/developpeur');
  expect(await scrollsSideways(page)).toBe(false);

  const header = page.getByRole('navigation', { name: 'Navigation principale' });
  await header.getByRole('link', { name: 'Graphisme 3D' }).tap();
  await expect(page).toHaveURL('/graphisme-3d');
  await transitionDone(page);
  expect(await scrollsSideways(page)).toBe(false);

  const dock = page.getByRole('navigation', { name: 'Réseaux et contact' });
  await expect(dock).toBeInViewport();
  await dock.getByRole('link', { name: 'Me contacter' }).tap();
  await expect(page).toHaveURL('/contact');
  await transitionDone(page);
  await expect(page.getByRole('button', { name: 'Envoyer' })).toBeVisible();
  expect(await scrollsSideways(page)).toBe(false);

  await header.getByRole('link', { name: 'Développement' }).tap();
  await expect(page).toHaveURL('/developpeur');
});
