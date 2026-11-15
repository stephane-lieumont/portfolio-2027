import { InjectionToken, isDevMode } from '@angular/core';

/** Cloudflare's documented test key: always passes, never shows a challenge. */
const TEST_SITE_KEY = '1x00000000000000000000BB';

// Replace with the production key from the Cloudflare dashboard (STATUS.md).
// Until then a production build fails closed: the API refuses test tokens.
const PRODUCTION_SITE_KEY = TEST_SITE_KEY;

/** Cloudflare Turnstile's public site key (ADR-0020). The secret stays in the API. */
export const TURNSTILE_SITE_KEY = new InjectionToken<string>('TURNSTILE_SITE_KEY', {
  providedIn: 'root',
  factory: () => (isDevMode() ? TEST_SITE_KEY : PRODUCTION_SITE_KEY),
});
