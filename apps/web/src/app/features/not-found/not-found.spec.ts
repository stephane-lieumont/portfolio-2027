import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { NAV_ITEMS } from '../../shell/nav-items';
import { NotFound } from './not-found';

async function render(): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [NotFound],
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotFound);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('NotFound', () => {
  it('offers every section, so a dead link is a detour and not a dead end', async () => {
    const host = await render();
    const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    // Home is listed once, as the primary action, and not twice.
    expect(hrefs).toContain('/');
    expect(hrefs.filter((h) => h === '/')).toHaveLength(1);
    for (const item of NAV_ITEMS.filter((i) => i.path !== '/')) {
      expect(hrefs).toContain(item.path);
    }
  });

  it('describes the easter egg for anyone who cannot see it', async () => {
    const host = await render();
    const gif = host.querySelector<HTMLImageElement>('.not-found__gif');

    // The 2022 site shipped this image with no alt at all. A joke nobody can
    // read is just a missing picture.
    expect(gif?.getAttribute('alt')?.trim()).toBeTruthy();
    expect(gif?.getAttribute('alt')).not.toBe('404');
  });

  it('reserves the image box so the links do not jump when it lands', async () => {
    const host = await render();
    const gif = host.querySelector<HTMLImageElement>('.not-found__gif');

    expect(Number(gif?.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(gif?.getAttribute('height'))).toBeGreaterThan(0);
  });

  it('has exactly one h1 and no skipped heading level', async () => {
    const host = await render();
    const levels = Array.from(host.querySelectorAll('h1, h2, h3, h4')).map((h) =>
      Number(h.tagName[1]),
    );

    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('has no detectable accessibility violation', async () => {
    const host = await render();
    document.body.appendChild(host);
    const results = await axe.run(host, { resultTypes: ['violations'] });
    host.remove();

    expect(results.violations).toEqual([]);
  });
});
