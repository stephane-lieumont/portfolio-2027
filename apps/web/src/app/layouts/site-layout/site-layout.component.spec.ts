import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SiteLayoutComponent, languageSwitch } from './site-layout.component';

@Component({ template: '<h1>Page</h1>' })
class Blank {}

describe('App shell', () => {
  let fixture: ComponentFixture<SiteLayoutComponent>;
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
    fixture = TestBed.createComponent(SiteLayoutComponent);
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
      '/en/developer',
      '/developpeur',
      '/graphisme-3d',
    ]);
    // Plain links: nothing to open first, nothing that needs script.
    expect(nav().querySelector('button')).toBeNull();
  });

  it('marks the world the visitor is in, and its pages, in the switch', async () => {
    await visit('/developpeur');
    expect(current()).toEqual(['/developpeur=page']);

    await visit('/developpeur/kasa-openclassrooms');
    expect(current()).toEqual(['/developpeur=true']);

    await visit('/graphisme-3d');
    expect(current()).toEqual(['/graphisme-3d=page']);
  });

  it('offers the same page in English, as a plain link in English', async () => {
    const language = () => nav().querySelector<HTMLAnchorElement>('a[hreflang]')!;

    await visit('/developpeur/kasa-openclassrooms');
    expect(language().getAttribute('href')).toBe('/en/developer/kasa-openclassrooms');
    expect(language().getAttribute('lang')).toBe('en');
    expect(language().getAttribute('hreflang')).toBe('en');
    expect(language().getAttribute('aria-label')).toBe('English version');
    // Shown as the flag of the language it leads to, named in words.
    expect(language().querySelector('svg[aria-hidden="true"] #flag-uk')).not.toBeNull();

    await visit('/contact');
    expect(language().getAttribute('href')).toBe('/en/contact');
  });

  it('remembers the language chosen in the switcher', async () => {
    await visit('/graphisme-3d');
    document.cookie = 'lang=; Max-Age=0; Path=/';
    // jsdom does not navigate; the cookie is what is under test.
    const stay = (event: Event) => event.preventDefault();
    document.addEventListener('click', stay);
    nav().querySelector<HTMLAnchorElement>('a[hreflang]')!.click();
    document.removeEventListener('click', stay);

    expect(document.cookie).toContain('lang=en');
  });

  it('drops the social dock on the contact page, which lists the same networks', async () => {
    await visit('/developpeur');
    expect(host.querySelector('app-social-dock')).not.toBeNull();
    await visit('/contact');
    expect(host.querySelector('app-social-dock')).toBeNull();
  });

  it('marks contact as the page while the switch keeps the world it was opened from', async () => {
    await visit('/graphisme-3d');
    await visit('/contact');

    expect(current()).toEqual(['/contact=page']);
    expect(document.documentElement.getAttribute('data-world')).toBe('cgi');
  });

  // The old footer is gone; the only contentinfo landmark is the copyright spine.
  it('ends on the page, its only footer the copyright', async () => {
    await visit('/contact');
    const footers = host.querySelectorAll('footer');
    expect(footers).toHaveLength(1);
    expect(footers[0].textContent?.trim()).toMatch(/^© \d{4} Stéphane Lieumont$/);
  });

  // A notice frozen at the build year would go stale every January.
  it('signs the copyright with the year it is viewed in', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2031-03-01T12:00:00Z'));
    const later = TestBed.createComponent(SiteLayoutComponent);
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
    await visit('/developpeur/kasa-openclassrooms');
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

describe('languageSwitch', () => {
  it('leads from every English page to the same page in French', () => {
    expect(languageSwitch('/developer', 'en')).toEqual({
      locale: 'fr',
      href: '/developpeur',
      name: 'Version française',
    });
    expect(languageSwitch('/3d-art/gorgotte', 'en').href).toBe('/graphisme-3d/gorgotte');
    expect(languageSwitch('/developer/pixmodels', 'en').href).toBe('/developpeur/pixmodels');
    expect(languageSwitch('/contact', 'en').href).toBe('/contact');
  });

  it('treats an unknown slug as the 404 it is served', () => {
    expect(languageSwitch('/developpeur/inconnu', 'fr').href).toBe('/en/developer');
    expect(languageSwitch('/graphisme-3d/inconnu', 'fr').href).toBe('/en/developer');
  });

  it('leads from every French page to the same page in English', () => {
    expect(languageSwitch('/graphisme-3d', 'fr').href).toBe('/en/3d-art');
    expect(languageSwitch('/graphisme-3d/beebop', 'fr').href).toBe('/en/3d-art/beebop');
  });

  // Through the record, not the slug: a translated slug leads to its
  // counterpart, never to the other tree's 404.
  it('swaps a translated slug for its counterpart, both ways', () => {
    expect(languageSwitch('/graphisme-3d/extraterrestre', 'fr').href).toBe('/en/3d-art/alien');
    expect(languageSwitch('/3d-art/alien', 'en').href).toBe('/graphisme-3d/extraterrestre');
    expect(languageSwitch('/developpeur/portfolio-3d-2018', 'fr').href).toBe(
      '/en/developer/3d-portfolio-2018',
    );
    expect(languageSwitch('/developer/3d-portfolio-2018', 'en').href).toBe(
      '/developpeur/portfolio-3d-2018',
    );
  });

  it('opens the other tree on its first page from a 404', () => {
    expect(languageSwitch('/nulle-part', 'fr').href).toBe('/en/developer');
    expect(languageSwitch('/nowhere', 'en').href).toBe('/developpeur');
  });
});
