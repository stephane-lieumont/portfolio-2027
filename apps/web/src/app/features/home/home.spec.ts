import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';

import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  });

  it('names the page once, without letting the name compete with the split', () => {
    // The split is the whole page; a display-sized hook above it was taking the
    // first look away from the choice the page exists to offer.
    const headings = host().querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toContain('Stéphane Lieumont');
    expect(headings[0].classList.contains('visually-hidden')).toBe(true);
  });

  it('offers both paths as the two halves of one split', () => {
    const panels = host().querySelectorAll('.split__panel');
    expect(panels).toHaveLength(2);

    for (const panel of Array.from(panels)) {
      expect(panel.querySelector('h2')?.textContent?.trim().length).toBeGreaterThan(0);
      expect(panel.querySelector('a[href]')).not.toBeNull();
    }
  });

  it('carries the theme each section will use onto its own half', () => {
    const themes = Array.from(host().querySelectorAll('.split__panel')).map((p) =>
      p.getAttribute('data-theme'),
    );
    expect(themes).toEqual(['light', 'dark']);
  });

  it("carries each half's work as a background, with real alternatives", () => {
    // The images are desaturated and blended into their half's own colour, so
    // they read as texture rather than as photographs on display — which is
    // what stopped the 3D render pulling the page toward one of the two trades.
    const media = host().querySelectorAll<HTMLImageElement>('.split__media');
    expect(media).toHaveLength(2);

    for (const image of Array.from(media)) {
      expect(image.getAttribute('alt')?.length).toBeGreaterThan(0);
      // Intrinsic dimensions on every image: without them the page reflows as
      // each one arrives.
      expect(image.getAttribute('width')).toBeTruthy();
      expect(image.getAttribute('height')).toBeTruthy();
    }
  });

  it('routes both halves', () => {
    const paths = Array.from(host().querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));
    expect(paths).toContain('/developpeur');
    expect(paths).toContain('/graphisme-3d');
  });

  it('has no detectable accessibility violation', async () => {
    document.body.appendChild(host());
    const results = await axe.run(host(), {
      resultTypes: ['violations'],
      // jsdom loads no stylesheet, so contrast cannot be computed here. Both
      // halves use the measured token pairs from spec 06 §3.1 and §3.2.
      rules: { 'color-contrast': { enabled: false } },
    });
    document.body.removeChild(host());

    expect(results.violations).toEqual([]);
  });
});
