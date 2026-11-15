import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { SITE_SETTINGS } from '../../../../core/data/world-content';
import { SocialDockComponent } from './social-dock.component';

describe('SocialDockComponent', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(SocialDockComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const links = (host: HTMLElement) => Array.from(host.querySelectorAll('a'));

  it('never publishes an email address', () => {
    // ADR-0007: visitors write through the form. A mailto in the markup is an
    // address any harvester collects.
    const host = render();
    expect(host.innerHTML).not.toMatch(/mailto:|@[a-z0-9-]+\.[a-z]/i);
    expect(links(host)[0].getAttribute('href')).toBe('/contact');
  });

  it('opens every network from the site settings in a new tab, and says so', () => {
    const external = links(render()).filter((a) => a.target === '_blank');

    expect(external.map((a) => a.getAttribute('href'))).toEqual(
      SITE_SETTINGS.socials.map((s) => s.url),
    );
    for (const link of external) {
      expect(link.rel).toContain('noopener');
      expect(link.getAttribute('aria-label')).toMatch(/de Stéphane Lieumont \(nouvel onglet\)$/);
    }
  });

  it('names each icon for what it opens, never twice the same way', () => {
    const names = links(render()).map((a) => a.getAttribute('aria-label'));

    expect(names.every((name) => name && name.length > 0)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  it('downloads the CV from a root-relative path', () => {
    const cv = links(render()).find((a) => a.hasAttribute('download'));
    expect(cv?.getAttribute('href')).toMatch(/^\/[^/].*\.pdf$/);
  });

  it('has no detectable accessibility violation', async () => {
    const host = render();
    document.body.appendChild(host);
    const results = await axe.run(host, {
      resultTypes: ['violations'],
      rules: { 'color-contrast': { enabled: false } },
    });
    host.remove();
    expect(results.violations).toEqual([]);
  });
});
