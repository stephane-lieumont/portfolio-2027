import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { Menu } from './shell/menu';
import { NAV_ITEMS } from './shell/nav-items';

describe('App shell', () => {
  let fixture: ComponentFixture<App>;

  const query = <T extends HTMLElement>(selector: string): T =>
    fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    document.documentElement.removeAttribute('data-menu');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  });

  it('keeps contact and the CV reachable at every width', () => {
    // The current site hides both below 1200px and leaves them out of the
    // burger, which makes contact unreachable from the navigation on mobile.
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.offcanvas__link')).map((a) =>
      (a as HTMLElement).textContent?.trim(),
    );

    expect(labels).toContain('Contact');
    expect(labels).toContain('Mon CV');
    expect(labels.length).toBe(NAV_ITEMS.length + 1);
  });

  it('renders the menu panel outside the receding shell', () => {
    // A transform on an ancestor becomes the containing block for a fixed
    // descendant. Nesting the panel inside .shell is what strands the links on
    // the current site the moment its animation misfires.
    const shell = query('.shell');
    const panel = query('#menu');

    expect(shell.contains(panel)).toBe(false);
    expect(query('.burger') && shell.contains(query('.burger'))).toBe(false);
  });

  it('moves inertness between the shell and the panel as the menu opens', () => {
    const menu = TestBed.inject(Menu);
    const shell = query('.shell');
    const panel = query('#menu');

    expect(shell.hasAttribute('inert')).toBe(false);
    expect(panel.hasAttribute('inert')).toBe(true);

    menu.open.set(true);
    fixture.detectChanges();

    expect(shell.hasAttribute('inert')).toBe(true);
    expect(panel.hasAttribute('inert')).toBe(false);
  });

  it('announces the open state on the control that owns it', () => {
    const menu = TestBed.inject(Menu);
    const burger = query<HTMLButtonElement>('.burger');

    expect(burger.getAttribute('aria-expanded')).toBe('false');
    expect(burger.getAttribute('aria-controls')).toBe('menu');

    menu.open.set(true);
    fixture.detectChanges();

    expect(burger.getAttribute('aria-expanded')).toBe('true');
    expect(burger.textContent?.trim()).toBe('Fermer le menu');
  });

  it('carries a live region for route announcements', () => {
    // A view transition does not move focus and the router does not announce,
    // so without this a route change is silent to a screen reader.
    const live = query('[aria-live]');

    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.getAttribute('aria-atomic')).toBe('true');
  });

  it('wraps Tab inside the open menu in both directions', () => {
    // `inert` contains focus against the rest of the page but does not wrap it:
    // Shift+Tab from the burger, or Tab from the last link, leaves the document
    // for the browser chrome. The spec claimed otherwise; this is the hand-
    // written wrap that makes the claim true.
    const menu = TestBed.inject(Menu);
    menu.open.set(true);
    fixture.detectChanges();

    document.body.appendChild(fixture.nativeElement);
    const burger = query<HTMLButtonElement>('.burger');
    const host = fixture.nativeElement as HTMLElement;
    const links = Array.from(host.querySelectorAll<HTMLElement>('#menu a, #menu button'));
    const last = links[links.length - 1];

    burger.focus();
    const backwards = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    burger.dispatchEvent(backwards);
    expect(document.activeElement).toBe(last);

    last.focus();
    const forwards = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    last.dispatchEvent(forwards);
    expect(document.activeElement).toBe(burger);

    document.body.removeChild(fixture.nativeElement);
  });

  it('closes on Escape and returns focus to the control that opened it', () => {
    const menu = TestBed.inject(Menu);
    menu.open.set(true);
    fixture.detectChanges();

    document.body.appendChild(fixture.nativeElement);
    const burger = query<HTMLButtonElement>('.burger');

    query('#menu').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(menu.open()).toBe(false);
    expect(document.activeElement).toBe(burger);

    document.body.removeChild(fixture.nativeElement);
  });

  it('ignores keys while the menu is closed', () => {
    const menu = TestBed.inject(Menu);
    query('.burger').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu.open()).toBe(false);
  });

  it('moves focus out of the panel before it goes inert on a link click', () => {
    // Without this the focus lands silently on <body> and the next Tab
    // restarts from the top of the document.
    const menu = TestBed.inject(Menu);
    menu.open.set(true);
    fixture.detectChanges();

    document.body.appendChild(fixture.nativeElement);
    const burger = query<HTMLButtonElement>('.burger');
    query<HTMLElement>('.offcanvas__link').click();
    fixture.detectChanges();

    expect(menu.open()).toBe(false);
    expect(document.activeElement).toBe(burger);

    document.body.removeChild(fixture.nativeElement);
  });

  it('has no detectable accessibility violation', async () => {
    document.body.appendChild(fixture.nativeElement);
    const results = await axe.run(fixture.nativeElement, {
      resultTypes: ['violations'],
      // jsdom loads no stylesheet, so contrast cannot be computed here. It is
      // verified against the measured tables in spec 06 instead.
      rules: { 'color-contrast': { enabled: false } },
    });
    document.body.removeChild(fixture.nativeElement);

    expect(results.violations).toEqual([]);
  });
});
