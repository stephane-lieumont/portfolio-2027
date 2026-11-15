import { type Page } from '@playwright/test';

import { appReady, expect, open, test } from '../support/fixtures.ts';

// #50: a phone turned on its side keeps the passage being read on screen.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const LINE = 0.3;

/** Waits until the page stops growing and every finite animation has landed. */
async function settled(page: Page) {
  let height = 0;
  await expect
    .poll(async () => {
      const now = await page.evaluate(() => document.body.scrollHeight);
      const stable = now === height;
      height = now;
      return stable;
    })
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity,
            ).length,
      ),
    )
    .toBe(0);
}

for (const path of ['/graphisme-3d', '/developpeur', '/developpeur/linxea']) {
  test(`turning the phone keeps the reader's place on ${path}`, async ({ page }) => {
    await open(page, path);
    await appReady(page);
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight * 0.45, behavior: 'instant' }),
    );
    await settled(page);

    // The block under the reading line, marked so it can be found again.
    const marked = await page.evaluate((line) => {
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight * line);
      const block =
        hit?.closest('h1, h2, h3, p, li, figure, dt, dd, blockquote, article, section') ?? hit;
      block?.setAttribute('data-read', '');
      return block !== null;
    }, LINE);
    expect(marked).toBe(true);

    await page.setViewportSize({ width: 844, height: 390 });

    await expect
      .poll(() =>
        page.evaluate((line) => {
          const read = document.querySelector('[data-read]');
          if (!read) return false;
          const { top, bottom } = read.getBoundingClientRect();
          const reading = innerHeight * line;
          return top <= reading + 2 && bottom >= reading - 2;
        }, LINE),
      )
      .toBe(true);
  });
}
