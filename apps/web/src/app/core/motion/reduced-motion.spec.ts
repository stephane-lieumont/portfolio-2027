import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { ReducedMotion } from './reduced-motion';

function fakeMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    matches,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  };
  const change = (next: boolean) => {
    for (const listener of listeners) listener({ matches: next } as MediaQueryListEvent);
  };
  return { media, change, listeners };
}

describe('ReducedMotion', () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  function create(query: ReturnType<typeof fakeMedia>): ReducedMotion {
    window.matchMedia = () => query.media as unknown as MediaQueryList;
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    return TestBed.inject(ReducedMotion);
  }

  it('reads the preference at start', () => {
    expect(create(fakeMedia(true)).reduced()).toBe(true);
  });

  it('follows the preference when it changes with the page open', () => {
    const query = fakeMedia(false);
    const motion = create(query);

    query.change(true);
    expect(motion.reduced()).toBe(true);
    query.change(false);
    expect(motion.reduced()).toBe(false);
  });

  it('stops listening when the application goes away', () => {
    const query = fakeMedia(false);
    create(query);
    TestBed.resetTestingModule();
    expect(query.listeners.size).toBe(0);
  });
});
