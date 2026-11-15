import { type Page, expect, test as base } from '@playwright/test';

// A 1×1 PNG. The renders live in MinIO, which the tests never need: what is
// under test is the page around the picture, not the picture.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
  'base64',
);

export const CAPTCHA_TOKEN = 'e2e-captcha-token';

// Stands in for Cloudflare's script: the same calls the site makes
// (TurnstileService), a widget that draws into its box and hands out a token
// when executed, as the invisible check does when Cloudflare is satisfied.
const FAKE_TURNSTILE = `
  (() => {
    const widgets = new Map();
    let next = 0;
    window.turnstile = {
      render(container, options) {
        const id = 'e2e-widget-' + ++next;
        const frame = document.createElement('div');
        frame.dataset.e2eTurnstile = id;
        container.appendChild(frame);
        widgets.set(id, { options, frame });
        return id;
      },
      execute(id) {
        const widget = widgets.get(id);
        setTimeout(() => widget.options.callback(${JSON.stringify(CAPTCHA_TOKEN)}), 0);
      },
      reset() {},
      remove(id) {
        widgets.get(id)?.frame.remove();
        widgets.delete(id);
      },
    };
  })();
`;

export const test = base.extend<{ stubs: void }>({
  stubs: [
    async ({ page }, use) => {
      await page.route('**/medias/**', (route) =>
        route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }),
      );
      await page.route('https://challenges.cloudflare.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_TURNSTILE }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Opens a page and waits for the app to take it over: index.html's startup
 * loader leaves once the app is hydrated (StartupService). A click before then
 * would be a full page load, not the visitor's navigation.
 */
export async function open(page: Page, path: string) {
  const response = await page.goto(path);
  await appReady(page);
  return response;
}

/**
 * Waits for the startup loader to leave after a full page load (see `open`),
 * and for the language switch's cross-document view transition to end: while
 * one runs, every click lands on the document element and goes nowhere.
 */
export async function appReady(page: Page): Promise<void> {
  await expect(page.locator('html')).not.toHaveAttribute('data-boot');
  await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
}

/**
 * Waits for the route transition under way to finish: RouteTransitionsService
 * stamps `data-vt` on the document while a view transition runs and clears it
 * when the transition's `finished` settles. Call it once the destination is
 * known to have rendered, never right after the click.
 */
export async function transitionDone(page: Page): Promise<void> {
  await expect(page.locator('html')).not.toHaveAttribute('data-vt');
  await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
}

/** Whether the page scrolls sideways: content wider than the viewport. */
export function scrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}
