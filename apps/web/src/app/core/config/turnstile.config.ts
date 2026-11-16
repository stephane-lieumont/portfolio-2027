import { InjectionToken, isDevMode } from '@angular/core';

/** Cloudflare's documented test key: always passes, never shows a challenge. */
const TEST_SITE_KEY = '1x00000000000000000000BB';

/** Widget « Portfolio 2027 » (invisible) in the Cloudflare dashboard; public by design. */
const PRODUCTION_SITE_KEY = '0x4AAAAAAGDEbF4HUaoUz3u3';

/** Cloudflare Turnstile's public site key (ADR-0020). The secret stays in the API. */
export const TURNSTILE_SITE_KEY = new InjectionToken<string>('TURNSTILE_SITE_KEY', {
  providedIn: 'root',
  factory: () => (isDevMode() ? TEST_SITE_KEY : PRODUCTION_SITE_KEY),
});
