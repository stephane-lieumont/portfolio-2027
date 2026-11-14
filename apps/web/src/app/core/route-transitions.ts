import { DOCUMENT, Injectable, inject } from '@angular/core';
import { NavigationStart, Router, ViewTransitionInfo } from '@angular/router';
import type { WorldKey } from '@portfolio/shared-types';
import { filter } from 'rxjs';

import { SmoothScroll } from './motion/smooth-scroll';
import { ActiveWorld, pathOf } from './world/world';

export interface RouteEnd {
  readonly path: string;
  readonly world: WorldKey;
}

/**
 * - `sweep-dev` / `sweep-cgi`: a diagonal band in the target world's ground,
 *   between the two worlds (ADR-0014).
 * - `wipe`: the same band in ink, into contact and back to the world it was
 *   opened from.
 * - `fade`: spec 07 §9.2's crossfade, for everything else.
 * - `none`: nothing changes on screen, so no transition at all.
 */
export type RouteTransitionKind = 'sweep-dev' | 'sweep-cgi' | 'wipe' | 'fade' | 'none';

const CONTACT = '/contact';

export function classifyTransition(from: RouteEnd, to: RouteEnd): RouteTransitionKind {
  if (from.path === to.path) return 'none';
  if (from.world !== to.world) {
    return to.world === 'cgi' ? 'sweep-cgi' : 'sweep-dev';
  }
  if (from.path === CONTACT || to.path === CONTACT) return 'wipe';
  return 'fade';
}

/**
 * Classifies each navigation as the router starts its view transition and
 * stamps the result on the document element as `data-vt`, which the keyframes
 * in src/styles/_route-transition.scss read.
 */
@Injectable({ providedIn: 'root' })
export class RouteTransitions {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly world = inject(ActiveWorld);
  private readonly smooth = inject(SmoothScroll);
  private stamp = 0;

  constructor() {
    // An easing still in flight when the visitor clicks would keep scrolling
    // the page the router is about to replace, and fight the jump below.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.smooth.settle());
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

    if (kind === 'none') {
      transition.skipTransition();
      return;
    }

    const root = this.document.documentElement;
    const stamp = ++this.stamp;
    root.dataset['vt'] = kind;
    const clear = () => {
      if (stamp === this.stamp) delete root.dataset['vt'];
    };
    transition.finished.then(clear, clear);

    // Not here: the old page is captured after this callback, and would be
    // captured already scrolled to the top. Once the update is done the old
    // page is a snapshot and the new one is not shown yet, so the jump lands
    // under the cover (measured: scrollY 0 before `ready`). Back and forward
    // keep the position the router restores. A rejected update is the
    // router's to report.
    if (navigation?.trigger === 'popstate') return;
    transition.updateCallbackDone.then(
      () => this.smooth.jumpTo(0),
      () => undefined,
    );
  }
}
