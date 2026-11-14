import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

import { SmoothScroll } from './core/motion/smooth-scroll';
import { RouteTransitions } from './core/route-transitions';
import { ActiveWorld, currentness } from './core/world/world';
import { Motes } from './shell/motes';
import { NAV } from './shell/nav-items';
import { SocialDock } from './shell/social-dock';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, SocialDock, Motes],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly active = inject(ActiveWorld);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  protected readonly nav = NAV;

  // The contact page carries the same networks in its own content; the dock
  // would only repeat them (Stéphane, 2026-11-15).
  protected readonly showDock = computed(() => this.active.path() !== '/contact');

  // The prerendered HTML carries the build's year; the browser renders the
  // current one. Hydration reuses the text node without comparing its value,
  // so a page built last year corrects itself on load instead of erroring.
  protected readonly year = new Date().getFullYear();

  // A view transition does not move focus and neither does the router, so a
  // route change is silent to a screen reader and drops the keyboard back to
  // the top of the document.
  protected readonly announcement = signal('');

  constructor() {
    // Created now so it is listening before the first navigation ends.
    inject(RouteTransitions);

    // Route changes only (spec 07 §9.5): on a direct load the page is already
    // announced by the browser, and moving focus would skip the skip link and
    // the navigation for the first Tab.
    const title = inject(Title);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        skip(1),
      )
      .subscribe(() => {
        // The router writes the title right after emitting NavigationEnd.
        queueMicrotask(() => this.announcement.set(title.getTitle()));
        this.main().nativeElement.focus({ preventScroll: true });
      });

    const smooth = inject(SmoothScroll);
    afterNextRender(() => smooth.enable());
  }

  protected current(link: string): 'page' | 'true' | null {
    return currentness(this.active.path(), link);
  }
}
