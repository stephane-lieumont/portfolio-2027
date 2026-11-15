import AxeBuilder from '@axe-core/playwright';

import { expect, open, test } from '../support/fixtures.ts';

const PAGES = [
  '/developpeur',
  '/graphisme-3d',
  '/developpeur/ledger',
  '/contact',
  '/page-inconnue',
  '/en/developer',
  '/en/3d-art',
  '/en/contact',
];

// The entrances fade text in: a contrast read mid-fade measures the fade. With
// reduced motion the pages stand in their final state at once (spec 07).
test.use({ reducedMotion: 'reduce' });

for (const path of PAGES) {
  test(`${path} has no serious or critical axe violation`, async ({ page }) => {
    await open(page, path);

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map(({ id, impact, nodes }) => ({
        id,
        impact,
        targets: nodes.map((node) => node.target.join(' ')),
      }));

    expect(blocking).toEqual([]);
  });
}
