import { Component, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollSentinel } from './scrolled';

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

@Component({
  imports: [ScrollSentinel],
  template: `<div appScrollSentinel></div>`,
})
class Host {
  readonly sentinel = viewChild.required(ScrollSentinel);
}

describe('ScrollSentinel', () => {
  let callback: ObserverCallback;
  let disconnect: ReturnType<typeof vi.fn>;
  let original: typeof window.IntersectionObserver;

  beforeEach(() => {
    original = window.IntersectionObserver;
    disconnect = vi.fn();
    window.IntersectionObserver = class {
      constructor(cb: ObserverCallback) {
        callback = cb;
      }
      observe = vi.fn();
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn();
      root = null;
      rootMargin = '';
      thresholds = [];
    } as unknown as typeof window.IntersectionObserver;

    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('reports the sentinel as passed once it leaves the viewport', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const sentinel = fixture.componentInstance.sentinel();

    expect(sentinel.passed()).toBe(false);

    callback([{ isIntersecting: false }]);
    expect(sentinel.passed()).toBe(true);

    callback([{ isIntersecting: true }]);
    expect(sentinel.passed()).toBe(false);

    window.IntersectionObserver = original;
  });

  it('stays in its resting state where IntersectionObserver is missing', () => {
    // Server render, or an engine without it. The header then keeps the state
    // it starts in, which is a complete design rather than a broken one.
    (window as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(fixture.componentInstance.sentinel().passed()).toBe(false);

    window.IntersectionObserver = original;
  });
});
