import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Menu } from './shell/menu';
import { ScrollSentinel } from './shell/scrolled';
import { NAV_ITEMS } from './shell/nav-items';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ScrollSentinel],
  // Listening on the host catches keys from the burger and the panel alike,
  // and keeps handlers off elements that are not themselves focusable.
  host: { '(keydown)': 'onKeydown($event)' },
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements AfterViewInit {
  private readonly router = inject(Router);
  protected readonly menu = inject(Menu);
  protected readonly items = NAV_ITEMS;

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly shell = viewChild.required<ElementRef<HTMLElement>>('shell');
  private readonly burger = viewChild.required<ElementRef<HTMLButtonElement>>('burger');
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  // A view transition does not move focus and neither does the router, so a
  // route change is silent to a screen reader and drops the keyboard back to
  // the top of the document.
  protected readonly announcement = signal('');

  // The home page is a full-height split and nothing follows it. A footer under
  // it would either float in empty space or push the split off the fold.
  protected readonly bare = signal(true);
  protected readonly year = new Date().getFullYear();

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.announcement.set(this.document_title());
      this.bare.set(this.router.url.split('?')[0] === '/');
      this.main().nativeElement.focus({ preventScroll: true });
    });

    // Focus deliberately stays on the burger when the menu opens. Moving it
    // into the panel would have to wait for `inert` to be removed, and focusing
    // an inert element fails silently — measured: the call ran, nothing moved.
    // The burger is the toggle, Tab enters the panel through the wrap below,
    // and Escape closes. One anchor, no race.
  }

  ngAfterViewInit(): void {
    this.menu.register(this.panel().nativeElement, this.shell().nativeElement);
  }

  protected closeFromLink(): void {
    // Move focus out of the panel before it becomes inert, or it silently
    // lands on <body> and the next Tab restarts from the top of the document.
    this.burger().nativeElement.focus();
    this.menu.toggle(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.menu.open()) return;

    if (event.key === 'Escape') {
      this.closeFromLink();
      return;
    }

    if (event.key !== 'Tab') return;

    // `inert` contains focus against the rest of the page but does not wrap it:
    // Shift+Tab from the burger, or Tab from the last link, leaves the document
    // for the browser chrome. The wrap is written by hand.
    const focusable = [
      this.burger().nativeElement,
      ...Array.from(this.panel().nativeElement.querySelectorAll<HTMLElement>('a, button')),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.panel().nativeElement.ownerDocument.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private document_title(): string {
    const path = this.router.url.split('?')[0];
    return this.items.find((item) => item.path === path)?.label ?? 'Page';
  }
}
