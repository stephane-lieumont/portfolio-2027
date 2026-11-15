import { Pipe, type PipeTransform } from '@angular/core';
import type { Localized } from '@portfolio/shared-types';

import { SITE_LOCALE } from './site-locale';

/**
 * A field in this build's language. Each tree is built with its own locale
 * (ADR-0017): the page reads the copy that was written for it, and nothing is
 * translated at runtime.
 */
export function localized<T>(value: Localized<T>): T {
  return value[SITE_LOCALE];
}

/** `localized()` for templates: `{{ page.title | localized }}`. */
@Pipe({ name: 'localized' })
export class LocalizedPipe implements PipeTransform {
  transform<T>(value: Localized<T>): T {
    return localized(value);
  }
}
