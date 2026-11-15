import { Pipe, type PipeTransform } from '@angular/core';
import type { Localized } from '@portfolio/shared-types';

import { SITE_LOCALE } from '@core/i18n/site-locale/site-locale';

/**
 * A field in this build's language. Each tree is built with its own locale
 * (ADR-0017): the page reads the copy that was written for it, and nothing is
 * translated at runtime. Named apart from shared-types' `localized()`, a Zod
 * schema factory: an auto-import of the wrong one would pull Zod into the
 * browser (traps.md).
 */
export function inLocale<T>(value: Localized<T>): T {
  return value[SITE_LOCALE];
}

/** `inLocale()` for templates: `{{ page.title | inLocale }}`. */
@Pipe({ name: 'inLocale' })
export class InLocalePipe implements PipeTransform {
  transform<T>(value: Localized<T>): T {
    return inLocale(value);
  }
}
