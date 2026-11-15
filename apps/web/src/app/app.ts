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

import {
  PATHS,
  SITE_LOCALE,
  type SiteLocale,
  languageCookie,
  otherLocale,
  pageAt,
  pageHref,
} from './core/i18n/site-locale';
import { SmoothScroll } from './core/motion/smooth-scroll';
import { RouteTransitions } from './core/route-transitions';
import { ActiveWorld, currentness } from './core/world/world';
import { Motes } from './shell/motes';
import { NAV } from './shell/nav-items';
import { SocialDock } from './shell/social-dock';
import { Thread } from './shell/thread';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, SocialDock, Motes, Thread],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly active = inject(ActiveWorld);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly languageLink = viewChild.required<ElementRef<HTMLAnchorElement>>('languageLink');

  protected readonly nav = NAV;

  // The contact page carries the same networks in its own content; the dock
  // would only repeat them (Stéphane, 2026-11-15).
  protected readonly showDock = computed(() => this.active.path() !== PATHS.contact);

  /** The same page in the other tree: a plain link, which works without script. */
  protected readonly language = computed(() => languageSwitch(this.active.path(), SITE_LOCALE));

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
    afterNextRender(() => {
      smooth.enable();
      try {
        const kept = sessionStorage.getItem('lang-switch');
        if (kept !== null) {
          sessionStorage.removeItem('lang-switch');
          smooth.jumpTo(Number(kept) || 0);
        }
      } catch {
        // Storage off: the page opens at its top.
      }
      // Not a template binding: event replay cancels a link's default action
      // when it has a bound click. Before hydration the link still goes, only
      // without the cookie.
      const link = this.languageLink().nativeElement;
      const remember = () => {
        link.ownerDocument.cookie = languageCookie(this.language().locale);
        try {
          sessionStorage.setItem('lang-switch', String(Math.round(scrollY)));
        } catch {
          // Private mode or storage off: the entrance simply plays again.
        }
      };
      link.addEventListener('click', remember);
      link.addEventListener('auxclick', remember);
    });
  }

  protected current(link: string): 'page' | 'true' | null {
    return currentness(this.active.path(), link);
  }
}

const LANGUAGE_LINKS: Readonly<Record<SiteLocale, { name: string }>> = {
  fr: { name: 'Version française' },
  en: { name: 'English version' },
};

export interface LanguageSwitch {
  readonly locale: SiteLocale;
  readonly href: string;
  /** In the target language, as the link's `lang` says. */
  readonly name: string;
}

/** Where the switcher leads from a router path in a tree, and how it reads. */
export function languageSwitch(path: string, locale: SiteLocale): LanguageSwitch {
  const target = otherLocale(locale);
  return {
    locale: target,
    href: pageHref(pageAt(path, locale), target),
    ...LANGUAGE_LINKS[target],
  };
}
