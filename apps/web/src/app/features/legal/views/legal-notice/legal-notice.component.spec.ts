import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';

import { languageCookie } from '@core/i18n/site-locale/site-locale';
import { LegalNoticeComponent } from './legal-notice.component';

let host: HTMLElement;

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(LegalNoticeComponent);
  fixture.detectChanges();
  host = fixture.nativeElement as HTMLElement;
});

const text = () => (host.textContent ?? '').replace(/\s+/g, ' ');

describe('LegalNoticeComponent', () => {
  // LCEN art. 6 III and GDPR art. 13: each of these must be there, under a
  // heading a screen reader can jump to.
  it('names every section the law asks for, under one h1', () => {
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(Array.from(host.querySelectorAll('h2'), (h) => h.textContent?.trim())).toEqual([
      'Éditeur',
      'Hébergement',
      'Propriété intellectuelle',
      'Données personnelles',
      'Protection contre le spam',
      'Cookies',
      'Vos droits',
      'Crédits',
    ]);
  });

  it('names the publisher, the publication director and the host with its address', () => {
    expect(text()).toContain('édité par Stéphane Lieumont, particulier');
    expect(text()).toMatch(/Directeur de la publication\s*:\s*Stéphane Lieumont/);
    expect(text()).toContain('OVH SAS, 2 rue Kellermann, 59100 Roubaix, France');
  });

  // A non-professional publisher leaves these with the host (LCEN art. 6
  // III-2), and the address is never published (ADR-0007).
  it('publishes no email address and no phone number', () => {
    expect(text()).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(host.querySelector('a[href^="mailto:" i], a[href^="tel:" i]')).toBeNull();
    expect(text()).not.toMatch(/(?:\+\d{2}|\b0\d)(?:[\s.-]?\d{2}){4}/);
  });

  it('sends every request about the data to the contact form, within the tree', () => {
    const internal = Array.from(host.querySelectorAll('a:not([href^="http"])'), (a) =>
      a.getAttribute('href'),
    );
    expect(internal).toEqual(['/contact', '/contact']);
  });

  it('links each third party to its own address over https', () => {
    const external = Array.from(host.querySelectorAll('a[href^="http"]'), (a) =>
      a.getAttribute('href'),
    );
    expect(external).toEqual([
      'https://www.cloudflare.com/turnstile-privacy-policy/',
      'https://www.cnil.fr/',
    ]);
  });

  it('states the retention period and no audience measurement', () => {
    expect(text()).toContain('conservés trois ans au plus');
    expect(text()).toContain('Aucune mesure d’audience à ce jour.');
  });

  // The page describes the cookie the switcher actually sets: renaming it or
  // changing its lifetime must change this page too.
  it('names the cookie the language switch sets, and its one-year lifetime', () => {
    const [, name, lifetime] = /^(\w+)=\w+; Max-Age=(\d+);/.exec(languageCookie('en')) ?? [];

    expect(host.querySelector('code')?.textContent).toBe(name);
    expect(Number(lifetime) / 86_400).toBe(365);
    expect(text()).toContain('pendant un an');
  });

  it('has no detectable accessibility violation', async () => {
    document.body.appendChild(host);
    const results = await axe.run(host, {
      resultTypes: ['violations'],
      // jsdom loads no stylesheet, so contrast is measured in a browser instead.
      rules: { 'color-contrast': { enabled: false } },
    });
    document.body.removeChild(host);

    expect(results.violations).toEqual([]);
  });
});
