import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './app';

@Component({ template: '<h1>Page</h1>' })
class Blank {}

describe('App shell', () => {
  let fixture: ComponentFixture<App>;
  let host: HTMLElement;

  const nav = () => host.querySelector<HTMLElement>('nav[aria-label="Navigation principale"]')!;
  const current = () =>
    Array.from(nav().querySelectorAll('[aria-current]')).map(
      (a) => `${a.getAttribute('href')}=${a.getAttribute('aria-current')}`,
    );

  async function visit(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    // jsdom has no canvas; the motes simply stay blank, as on a browser without one.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'developpeur', component: Blank },
          { path: 'developpeur/:slug', component: Blank, title: 'Kasa' },
          { path: 'graphisme-3d', component: Blank },
          { path: 'contact', component: Blank },
        ]),
      ],
    });
    fixture = TestBed.createComponent(App);
    fixture.autoDetectChanges();
    host = fixture.nativeElement;
    document.body.appendChild(host);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    host.remove();
    document.documentElement.removeAttribute('data-world');
  });

  it('carries the mockup header: the role, Contact and the world switch', async () => {
    await visit('/developpeur');

    expect(host.querySelector('header')?.textContent).toContain('Lead Tech & graphiste 3D');
    expect(Array.from(nav().querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual([
      '/contact',
      '/developpeur',
      '/graphisme-3d',
    ]);
    // Plain links: nothing to open first, nothing that needs script.
    expect(nav().querySelector('button')).toBeNull();
  });

  it('marks the world the visitor is in, and its pages, in the switch', async () => {
    await visit('/developpeur');
    expect(current()).toEqual(['/developpeur=page']);

    await visit('/developpeur/kasa');
    expect(current()).toEqual(['/developpeur=true']);

    await visit('/graphisme-3d');
    expect(current()).toEqual(['/graphisme-3d=page']);
  });

  it('marks contact as the page while the switch keeps the world it was opened from', async () => {
    await visit('/graphisme-3d');
    await visit('/contact');

    expect(current()).toEqual(['/contact=page']);
    expect(document.documentElement.getAttribute('data-world')).toBe('cgi');
  });

  it('has no footer: the mockup ends on the page', async () => {
    await visit('/contact');
    expect(host.querySelector('footer')).toBeNull();
  });

  // A notice frozen at the build year would go stale every January.
  it('signs the copyright with the year it is viewed in', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2031-03-01T12:00:00Z'));
    const later = TestBed.createComponent(App);
    later.detectChanges();
    vi.useRealTimers();

    expect(later.nativeElement.querySelector('.copyright')?.textContent?.trim()).toBe(
      '© 2031 Stéphane Lieumont',
    );
  });

  it('leaves focus alone on the first page, so the first Tab is the skip link', async () => {
    await visit('/developpeur');

    expect(document.activeElement).not.toBe(host.querySelector('#contenu'));
    expect(host.querySelector('[aria-live]')!.textContent).toBe('');
  });

  it('announces the title of the page a route change lands on', async () => {
    // A view transition does not move focus and the router does not announce,
    // so without this a route change is silent to a screen reader. The title,
    // not a nav label: a project page has none.
    await visit('/developpeur');
    await visit('/developpeur/kasa');
    await Promise.resolve();
    fixture.detectChanges();
    const live = host.querySelector('[aria-live]')!;

    expect(live.getAttribute('aria-atomic')).toBe('true');
    expect(live.textContent).toBe('Kasa');
    expect(document.activeElement).toBe(host.querySelector('#contenu'));
  });

  it('has no detectable accessibility violation', async () => {
    await visit('/developpeur');
    const results = await axe.run(host, {
      resultTypes: ['violations'],
      // jsdom loads no stylesheet, so contrast cannot be computed here. It is
      // measured on the built site instead.
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
