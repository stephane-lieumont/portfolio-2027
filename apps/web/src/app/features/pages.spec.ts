import { Type, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { MEDIA_BASE_URL } from '../core/media.config';

import { Contact } from './contact/contact';
import { Developer } from './developer/developer';
import { Gallery } from './gallery/gallery';

async function render<T>(component: Type<T>): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEDIA_BASE_URL, useValue: '/medias' },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const PAGES: readonly [string, Type<unknown>][] = [
  ['Developer', Developer],
  ['Gallery', Gallery],
  ['Contact', Contact],
];

describe.each(PAGES)('%s page', (_name, component) => {
  it('has exactly one h1 and no skipped heading level', async () => {
    const host = await render(component);
    const levels = Array.from(host.querySelectorAll('h1, h2, h3, h4')).map((h) =>
      Number(h.tagName[1]),
    );

    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('has no detectable accessibility violation', async () => {
    const host = await render(component);
    document.body.appendChild(host);
    const results = await axe.run(host, {
      resultTypes: ['violations'],
      // jsdom loads no stylesheet, so contrast is verified against the measured
      // tables in spec 06 instead.
      rules: { 'color-contrast': { enabled: false } },
    });
    document.body.removeChild(host);

    expect(results.violations).toEqual([]);
  });
});

describe('registries', () => {
  it('keeps the dev stack out of the 3D page', async () => {
    // Two vocabularies that must never appear in one list (spec 03). One
    // TestBed per test: it cannot be reconfigured once instantiated.
    const gallery = (await render(Gallery)).textContent ?? '';

    expect(gallery).toContain('ZBrush');
    expect(gallery).not.toContain('Angular');
  });

  it('keeps the 3D software out of the developer page', async () => {
    const dev = (await render(Developer)).textContent ?? '';

    expect(dev).toContain('Angular');
    expect(dev).not.toContain('ZBrush');
  });

  it('shows a label for a tool the 2022 icon font has no glyph for', async () => {
    // Angular and .NET postdate the font. The chip renders the label alone
    // rather than a hand-drawn stand-in.
    const host = await render(Developer);
    expect(host.textContent).toContain('.NET');
  });
});
