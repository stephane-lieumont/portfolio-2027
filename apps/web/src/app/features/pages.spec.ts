import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { WorldKey } from '@portfolio/shared-types';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MEDIA_BASE_URL } from '../core/media.config';

import { Contact } from './contact/contact';
import { WorldPage } from './world/world-page';

type Page = 'dev' | 'cgi' | 'contact';

async function render(page: Page): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEDIA_BASE_URL, useValue: '/medias' },
    ],
  }).compileComponents();

  if (page === 'contact') {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }
  const fixture = TestBed.createComponent(WorldPage);
  fixture.componentRef.setInput('world', page satisfies WorldKey);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

beforeEach(() => {
  // jsdom has no canvas; the cloud simply stays blank, as without one.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => vi.restoreAllMocks());

describe.each<Page>(['dev', 'cgi', 'contact'])('%s page', (page) => {
  it('has exactly one h1 and no skipped heading level', async () => {
    const host = await render(page);
    const levels = Array.from(host.querySelectorAll('h1, h2, h3, h4')).map((h) =>
      Number(h.tagName[1]),
    );

    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('has no detectable accessibility violation', async () => {
    const host = await render(page);
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

describe('registries', () => {
  it('keeps the dev stack out of the 3D page', async () => {
    // Two vocabularies that must never appear in one list (spec 03).
    const cgi = (await render('cgi')).textContent ?? '';

    expect(cgi).toContain('ZBrush');
    expect(cgi).not.toContain('Angular');
  });

  it('keeps the 3D software out of the developer page', async () => {
    const dev = (await render('dev')).textContent ?? '';

    expect(dev).toContain('Angular');
    expect(dev).not.toContain('ZBrush');
  });
});
