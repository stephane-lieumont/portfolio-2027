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
import {
  type ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
  TitleStrategy,
} from '@angular/router';
import { filter } from 'rxjs';

import { NAV } from '@core/data/nav-items';
import {
  PATHS,
  SITE_LOCALE,
  type SiteLocale,
  languageCookie,
  otherLocale,
  pageAt,
  pageHref,
} from '@core/i18n/site-locale/site-locale';
import { SmoothScrollService } from '@core/services/motion/smooth-scroll/smooth-scroll.service';
import { RouteTransitionsService } from '@core/services/route-transitions/route-transitions.service';
import { WorldStore, currentness } from '@core/stores/world/world.store';
import { MotesComponent } from '@layouts/site-layout/components/motes/motes.component';
import { SocialDockComponent } from '@layouts/site-layout/components/social-dock/social-dock.component';
import { ThreadComponent } from '@layouts/site-layout/components/thread/thread.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, SocialDockComponent, MotesComponent, ThreadComponent],
  templateUrl: './site-layout.component.html',
  styleUrl: './site-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteLayoutComponent {
  private readonly router = inject(Router);
  private readonly active = inject(WorldStore);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly languageLink = viewChild.required<ElementRef<HTMLAnchorElement>>('languageLink');

  protected readonly nav = NAV;

  /** The startup loader's word, one letter per span for its wave. */
  protected readonly bootLabel = $localize`:@@boot.label:Chargement`;
  protected readonly bootLetters = Array.from(this.bootLabel);

  // The contact page carries the same networks in its own content; the dock
  // would only repeat them (Stéphane, 2026-11-15).
  protected readonly showDock = computed(() => this.active.path() !== PATHS.contact);
  /** Neither world is the page (contact, the 404): the switch shows where you came from, idle. */
  protected readonly switchIdle = computed(
    () =>
      currentness(this.active.path(), PATHS.dev) === null &&
      currentness(this.active.path(), PATHS.cgi) === null,
  );

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
    inject(RouteTransitionsService);

    // Route changes only (spec 07 §9.5): on a direct load the page is already
    // announced by the browser, and moving focus would skip the skip link and
    // the navigation for the first Tab.
    const title = inject(Title);
    const titles = inject(TitleStrategy);
    let page: unknown;
    let landed = false;
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const snapshot = this.router.routerState.snapshot;
      const from = page;
      page = deepest(snapshot.root).data['page'];
      if (!landed) {
        landed = true;
        return;
      }
      if (viewerOwns(from, page)) return;
      // The page's own title, without the site's name every title ends with.
      const name = titles.buildTitle(snapshot);
      // The router writes the document title right after emitting NavigationEnd.
      queueMicrotask(() => this.announcement.set(name ?? title.getTitle()));
      this.main().nativeElement.focus({ preventScroll: true });
    });

    const smooth = inject(SmoothScrollService);
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

  protected skipToContent(event: MouseEvent): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  protected current(link: string): 'page' | 'true' | null {
    return currentness(this.active.path(), link);
  }
}

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepest(route.firstChild) : route;
}

/**
 * Opening, stepping and closing the 3D viewer change the address, not the
 * page: the viewer announces the piece itself and hands focus back to its
 * tile, so the shell keeps quiet.
 */
function viewerOwns(from: unknown, to: unknown): boolean {
  return (
    (from === 'piece' || to === 'piece') && [from, to].every((p) => p === 'piece' || p === 'cgi')
  );
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
