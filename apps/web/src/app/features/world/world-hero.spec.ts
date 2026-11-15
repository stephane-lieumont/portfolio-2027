import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { WORLD_PAGES } from '../../core/content/world-content';
import { WorldHero, introBase, roleGlyphs } from './world-hero';

function render(world: 'dev' | 'cgi'): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(WorldHero);
  fixture.componentRef.setInput('page', WORLD_PAGES[world]);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('WorldHero', () => {
  it('keeps the name whole as the heading, its letters hidden from assistive tech', () => {
    const h1 = render('dev').querySelector('h1')!;

    expect(h1.textContent?.replace(/\s+/g, ' ').trim()).toBe('Stéphane Lieumont');
    expect(h1.getAttribute('aria-label')).toBe('Stéphane Lieumont');
    for (const word of h1.querySelectorAll('.name__word')) {
      expect(word.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('reads the role once, as words, while its letters flip', () => {
    const word = render('cgi').querySelector('.word')!;

    expect(word.querySelector('.visually-hidden')?.textContent).toBe('GRAPHISTE 3D');
    const letters = Array.from(word.querySelectorAll('.word__char'));
    expect(letters.map((l) => l.textContent).join('')).toBe('GRAPHISTE3D');
    expect(letters.every((l) => l.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('sets the mockup’s accent letters in italic: the A of LEAD, « 3D » whole', () => {
    const italic = (world: 'dev' | 'cgi') =>
      Array.from(render(world).querySelectorAll('.word__char--italic')).map((l) => l.textContent);

    expect(italic('dev')).toEqual(['A']);
    TestBed.resetTestingModule();
    expect(italic('cgi')).toEqual(['3', 'D']);
  });

  // The positions are per language: « 3D » ends « GRAPHISTE 3D » and opens
  // « 3D ARTIST ». Read with the French positions, the English word would
  // italicise nothing at all.
  it.each(['fr', 'en'] as const)('finds the same accents in the %s role words', (locale) => {
    const italic = (world: 'dev' | 'cgi') =>
      roleGlyphs(WORLD_PAGES[world].roleWord[locale], world, locale)
        .filter((g) => g.italic)
        .map((g) => g.char)
        .join('');

    expect(italic('dev')).toBe('A');
    expect(italic('cgi')).toBe('3D');
  });

  it('labels the row with its world and the tools in the eyebrow', () => {
    const eyebrow = render('dev').querySelector('.eyebrow')!.textContent;
    expect(eyebrow).toContain('Développement');
    expect(eyebrow).toContain('Angular · .NET · TypeScript');
  });

  it('staggers the flip over letters only, a space taking no step', () => {
    const steps = roleGlyphs('LEAD TECH', 'dev')
      .filter((g) => !g.space)
      .map((g) => g.step);
    expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('flips the role in once the sixteen letters of the name have risen', () => {
    expect(introBase('Stéphane Lieumont')).toBe(260 + 16 * 38 + 220);
  });
});
