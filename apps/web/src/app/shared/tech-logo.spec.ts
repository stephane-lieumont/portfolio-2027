import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HIGHLIGHTED_TECHNOLOGIES } from '../core/static-content';
import { technologyOf } from '@portfolio/shared-types/registries';
import { beforeEach, describe, expect, it } from 'vitest';

import { TechLogo } from './tech-logo';

// The module is configured once per test, not once per render: TestBed refuses
// to be reconfigured after it has been instantiated, and several of these
// tests render the whole highlighted list rather than a sample.
function render(slug: string): HTMLElement {
  const fixture = TestBed.createComponent(TechLogo);
  fixture.componentRef.setInput('entry', technologyOf(slug as 'typescript'));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('TechLogo', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechLogo],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });
  it('prefers the real PNG mark when there is one', () => {
    const host = render('react');
    const img = host.querySelector<HTMLImageElement>('.tech-logo__mark');

    // React has both a PNG and a font glyph. The PNG wins: it is the brand
    // mark, and it is what Stéphane asked for.
    expect(img?.getAttribute('src')).toBe('/logos/react.png');
    expect(host.querySelector('.tech-logo__glyph')).toBeNull();
    expect(host.querySelector('.tech-logo__monogram')).toBeNull();
  });

  it('is decorative, because the label beside it is the name', () => {
    const host = render('react');
    const img = host.querySelector<HTMLImageElement>('.tech-logo__mark');

    // An alt here would make a screen reader say the tool twice.
    expect(img?.getAttribute('alt')).toBe('');

    // The marks keep their own colours — no tint, no greyscale. Not asserted
    // here: jsdom returns '' for `filter` rather than computing it, and a test
    // that cannot see what it checks is worse than none. Verified in the
    // browser instead (filter: none, opacity: 1).
  });

  it('falls back to the font glyph where no PNG exists', () => {
    // TypeScript, Docker and Git have no 2022 PNG. Dropping the font would
    // make the row emptier rather than truer to the old site.
    const host = render('typescript');

    expect(host.querySelector('.tech-logo__glyph')).toBeTruthy();
    expect(host.querySelector('.tech-logo__mark')).toBeNull();
    expect(host.querySelector('.tech-logo__monogram')).toBeNull();
  });

  it('stands in with the tool initial when there is neither', () => {
    // The 2022 font predates Angular and .NET in Stéphane's stack. A letter
    // reads as "not yet"; a hand-drawn stand-in for a logo everyone knows
    // reads as wrong. He is extending the font.
    const host = render('angular');

    expect(host.querySelector('.tech-logo__glyph')).toBeNull();
    expect(host.querySelector('.tech-logo__monogram')?.textContent?.trim()).toBe('A');
  });

  it('keeps the letter after a leading dot, so .NET is not a bare full stop', () => {
    const monogram = render('dotnet').querySelector('.tech-logo__monogram');

    expect(monogram?.textContent?.trim()).toBe('.N');
    expect(monogram?.getAttribute('aria-hidden')).toBe('true');
  });

  it('names the tool either way, because the label carries the meaning', () => {
    for (const slug of ['typescript', 'angular', 'dotnet']) {
      const host = render(slug);
      expect(host.querySelector('.tech-logo__name')?.textContent?.trim()).toBe(
        technologyOf(slug as 'typescript').label,
      );
    }
  });

  it('hides the glyph from assistive technology', () => {
    const host = render('typescript');

    // A private-use codepoint read aloud is noise, and the label beside it
    // already says the name.
    expect(host.querySelector('.tech-logo__glyph')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives every highlighted tool exactly one of the three states', () => {
    // A guard on the real list. Without a plate, a tile with nothing in it is
    // invisible and the row silently loses an item — so a tool with no mark
    // must stand in with its initial, never be merely blank.
    for (const slug of HIGHLIGHTED_TECHNOLOGIES) {
      const host = render(slug);
      const tile = host.querySelector('.tech-logo__tile');
      expect(tile, slug).toBeTruthy();

      const states = [
        tile!.querySelector('.tech-logo__mark') !== null,
        tile!.querySelector('.tech-logo__glyph') !== null,
        tile!.querySelector('.tech-logo__monogram') !== null,
      ].filter(Boolean);

      expect(states, `${slug}: expected one of png / glyph / monogram`).toHaveLength(1);
    }
  });
});
