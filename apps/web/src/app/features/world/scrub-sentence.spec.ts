import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { BODY_RAMP, ScrubSentence, scrubLevels } from './scrub-sentence';

describe('scrubLevels', () => {
  it('leaves every word unlit before the sentence reaches 68% of the viewport', () => {
    expect(scrubLevels(5, 700, 200, 1000, false)).toEqual([0, 0, 0, 0, 0]);
  });

  it('lights the words in reading order as the sentence rises', () => {
    const levels = scrubLevels(4, 600, 100, 1000, false);
    expect(levels[0]).toBeGreaterThan(levels[3]);
    expect([...levels].sort((a, b) => b - a)).toEqual(levels);
  });

  it('has every word lit once the sentence is past the top third', () => {
    expect(scrubLevels(3, -50, 200, 1000, false)).toEqual([1, 1, 1]);
  });

  it('shows the sentence fully lit under reduced motion, wherever it is', () => {
    expect(scrubLevels(3, 2000, 200, 1000, true)).toEqual([1, 1, 1]);
  });

  it('starts lower on the project page, where the sentence sits below the fold', () => {
    // At 75% of the viewport: unlit on the world pages' ramp, already lighting on this one.
    expect(scrubLevels(4, 750, 200, 1000, false)[0]).toBe(0);
    expect(scrubLevels(4, 750, 200, 1000, false, BODY_RAMP)[0]).toBeGreaterThan(0);
  });
});

describe('ScrubSentence', () => {
  it('renders the sentence complete, word by word, readable with no script', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ScrubSentence);
    fixture.componentRef.setInput('text', 'Le code, je continue à l’écrire.');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('span')).toHaveLength(6);
    expect(host.textContent?.replace(/\s+/g, ' ').trim()).toBe('Le code, je continue à l’écrire.');
  });
});
