import { Location } from '@angular/common';
import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { WorldKey } from '@portfolio/shared-types';
import { filter } from 'rxjs';

import { SITE_LOCALE, type SiteLocale, pageAt } from '../i18n/site-locale';

/** The path alone: no query, no fragment, no trailing slash except the root's. */
export function pathOf(url: string): string {
  const path = url.split(/[?#]/)[0] || '/';
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function within(path: string, section: string): boolean {
  return path === section || path.startsWith(`${section}/`);
}

/**
 * The world a page belongs to (ADR-0014). Every page outside the two sections
 * — contact, the 404 — stays in the world the visitor came from.
 */
export function worldOfPath(
  path: string,
  previous: WorldKey,
  locale: SiteLocale = SITE_LOCALE,
): WorldKey {
  const { page } = pageAt(path, locale);
  if (page === 'dev' || page === 'project') return 'dev';
  if (page === 'cgi' || page === 'piece') return 'cgi';
  return previous;
}

/**
 * Whether a navigation link marks the current page: `page` on the page itself,
 * `true` inside its section (a project under the developer world), nothing elsewhere.
 */
export function currentness(path: string, link: string): 'page' | 'true' | null {
  if (path === link) return 'page';
  if (within(path, link)) return 'true';
  return null;
}

/**
 * Follows the router and stamps the active world on the document element.
 *
 * The stamp is global state: every rule keyed on it lives in src/styles/, where
 * Angular's encapsulation cannot scope it away (traps.md). It is written on
 * NavigationEnd, which the router emits inside the view transition's update,
 * so the palette changes under the cover rather than before it. It also runs
 * during prerendering, so each page's HTML carries its world from the first byte.
 */
@Injectable({ providedIn: 'root' })
export class WorldStore {
  private readonly root = inject(DOCUMENT).documentElement;

  readonly path = signal('/');
  readonly world = signal<WorldKey>('dev');
  private last: WorldKey = 'dev';

  constructor() {
    // Seeded from the address the page was loaded at, so the first client
    // render matches the prerendered DOM. Waiting for the first NavigationEnd
    // left a window of ~150ms where the header went transparent, the footer
    // vanished and the brand claimed to be the current page.
    // The router's path, the tree's base (`/en/`) left out.
    const loaded = inject(Location).path();
    this.enter(loaded.startsWith('/') ? loaded : `/${loaded}`);

    inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.enter(event.urlAfterRedirects));
  }

  /** The world a URL would land in from here, without going there. */
  worldFor(url: string): WorldKey {
    return worldOfPath(pathOf(url), this.last);
  }

  enter(url: string): void {
    const path = pathOf(url);
    const world = worldOfPath(path, this.last);
    this.path.set(path);
    this.world.set(world);
    this.last = world;
    this.root.setAttribute('data-world', world);
  }
}
