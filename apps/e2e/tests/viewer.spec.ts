import { type Locator } from '@playwright/test';

import { expect, open, test, transitionDone } from '../support/fixtures.ts';

/** A tile's own address: each piece has one (spec 01). */
async function hrefOf(tile: Locator): Promise<string> {
  const href = await tile.getAttribute('href');
  expect(href).toMatch(/^\/graphisme-3d\/[\w-]+$/);
  return href ?? '';
}

test('the 3D viewer opens from the wall, steps by keyboard and hands focus back', async ({
  page,
}) => {
  await open(page, '/graphisme-3d');
  const tiles = page.getByRole('region', { name: 'Réalisations' }).getByRole('link');
  const first = tiles.nth(0);
  const second = tiles.nth(1);
  const firstHref = await hrefOf(first);
  const secondHref = await hrefOf(second);

  await first.click();
  const viewer = page.getByRole('dialog', { name: 'Visionneuse des rendus 3D' });
  await expect(viewer).toBeVisible();
  await expect(page).toHaveURL(firstHref);
  await transitionDone(page);
  const stage = viewer.getByRole('group', { name: /^Rendu affiché/ });
  await expect(stage).toBeFocused();
  await expect(viewer.getByRole('button', { name: /^Rendu 1 :/ })).toHaveAttribute(
    'aria-current',
    'true',
  );

  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(secondHref);
  await expect(viewer.getByRole('button', { name: /^Rendu 2 :/ })).toHaveAttribute(
    'aria-current',
    'true',
  );

  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(firstHref);

  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  await expect(page).toHaveURL('/graphisme-3d');
  await transitionDone(page);
  await expect(first).toBeFocused();
});

test('a piece’s own address opens the viewer over the wall', async ({ page }) => {
  await open(page, '/graphisme-3d/chambre');
  const viewer = page.getByRole('dialog', { name: 'Visionneuse des rendus 3D' });
  await expect(viewer).toBeVisible();
  await expect(page).toHaveTitle(/chambre/);

  await viewer.getByRole('button', { name: 'Fermer la visionneuse' }).click();
  await expect(viewer).toBeHidden();
  await expect(page).toHaveURL('/graphisme-3d');
});
