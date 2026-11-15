import { DOCUMENT, Injectable, inject } from '@angular/core';
import { NavigationStart, Router, ViewTransitionInfo } from '@angular/router';
import type { WorldKey } from '@portfolio/shared-types';
import { filter } from 'rxjs';

import { SITE_LOCALE, type SiteLocale, pageAt } from '../i18n/site-locale';
import { SmoothScrollService } from './motion/smooth-scroll.service';
import { WorldStore, pathOf } from '../stores/world.store';

export interface RouteEnd {
  readonly path: string;
  readonly world: WorldKey;
}

/**
 * - `sweep-dev` / `sweep-cgi`: a diagonal band in the target world's ground,
 *   between the two worlds (ADR-0014).
 * - `wipe`: the same band in ink, into contact and back to the world it was
 *   opened from.
 * - `viewer`: the 3D viewer opening from its tile or closing back to it; the
 *   plate morphs between the two (spec 07 §9.4).
 * - `fade`: spec 07 §9.2's crossfade, for everything else.
 * - `none`: nothing changes on screen, so nothing animates — including a step
 *   from one piece to the next inside the viewer, which animates itself.
 */
export type RouteTransitionKind = 'sweep-dev' | 'sweep-cgi' | 'wipe' | 'viewer' | 'fade' | 'none';

/** Whether a page shows the point cloud: the two world pages, the viewer over the wall. */
export function showsCloud(path: string, locale: SiteLocale = SITE_LOCALE): boolean {
  const { page } = pageAt(path, locale);
  return page === 'dev' || page === 'cgi' || page === 'piece';
}

export function classifyTransition(
  from: RouteEnd,
  to: RouteEnd,
  locale: SiteLocale = SITE_LOCALE,
): RouteTransitionKind {
  const fromPage = pageAt(from.path, locale).page;
  const toPage = pageAt(to.path, locale).page;
  if (from.path === to.path) return 'none';
  if (fromPage === 'piece' && toPage === 'piece') return 'none';
  if ((fromPage === 'cgi' && toPage === 'piece') || (fromPage === 'piece' && toPage === 'cgi')) {
    return 'viewer';
  }
  if (from.world !== to.world) {
    return to.world === 'cgi' ? 'sweep-cgi' : 'sweep-dev';
  }
  if (fromPage === 'contact' || toPage === 'contact') return 'wipe';
  return 'fade';
}

/**
 * Classifies each navigation as the router starts its view transition and
 * stamps the result on the document element as `data-vt`, which the keyframes
 * in src/styles/_route-transition.scss read.
 */
@Injectable({ providedIn: 'root' })
export class RouteTransitionsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly world = inject(WorldStore);
  private readonly smooth = inject(SmoothScrollService);
  private stamp = 0;
  private current: Promise<void> = Promise.resolve();

  constructor() {
    // An easing still in flight when the visitor clicks would keep scrolling
    // the page the router is about to replace, and fight the jump below.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.smooth.settle());
  }

  /** Resolves once the transition under way, if any, has finished either way. */
  settled(): Promise<void> {
    return this.current;
  }

  onCreated({ transition }: ViewTransitionInfo): void {
    const navigation = this.router.currentNavigation();
    const target = navigation?.finalUrl ?? navigation?.extractedUrl;
    if (!target) return;

    const toPath = pathOf(this.router.serializeUrl(target));
    const kind = classifyTransition(
      { path: this.world.path(), world: this.world.world() },
      { path: toPath, world: this.world.worldFor(toPath) },
    );

    const root = this.document.documentElement;
    const stamp = ++this.stamp;
    root.dataset['vt'] = kind;
    // The cloud may ride above the band only when both pages show it: then
    // the new one carries on the old one's morph. From or to any other page it
    // stays in the page's snapshot and arrives with it.
    if (showsCloud(this.world.path()) && showsCloud(toPath)) root.dataset['vtCloud'] = '';
    else delete root.dataset['vtCloud'];
    const clear = () => {
      if (stamp !== this.stamp) return;
      delete root.dataset['vt'];
      delete root.dataset['vtCloud'];
    };
    transition.finished.then(clear, clear);
    this.current = transition.finished.then(
      () => undefined,
      () => undefined,
    );

    // Nothing changes on screen: the transition runs with no animation rather
    // than being skipped. A skipped transition rejects its promises, which the
    // router reports with console.error even in production.
    if (kind === 'none') return;

    // Not here: the old page is captured after this callback, and would be
    // captured already scrolled to the top. Once the update is done the old
    // page is a snapshot and the new one is not shown yet, so the jump lands
    // under the cover (measured: scrollY 0 before `ready`). Back and forward
    // keep the position the router restores. A rejected update is the
    // router's to report.
    // A navigation asking to keep its scroll (the viewer opening and closing
    // over the gallery) stays where it is too.
    if (navigation?.trigger === 'popstate' || navigation?.extras.scroll === 'manual') return;
    transition.updateCallbackDone.then(
      () => this.smooth.jumpTo(0),
      () => undefined,
    );
  }
}
