import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Reveal } from './reveal';

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let callbacks: ObserverCallback[];
let disconnects: number;
let observed: Element[];
let options: IntersectionObserverInit | undefined;

class FakeObserver {
  constructor(callback: ObserverCallback, init?: IntersectionObserverInit) {
    callbacks.push(callback);
    options = init;
  }
  observe(element: Element): void {
    observed.push(element);
  }
  disconnect(): void {
    disconnects += 1;
  }
}

@Component({
  imports: [Reveal],
  template: `<p appReveal>first</p>
    <p [appReveal]="3">fourth</p>`,
})
class Host {}

describe('Reveal', () => {
  const original = window.IntersectionObserver;

  beforeEach(() => {
    callbacks = [];
    observed = [];
    disconnects = 0;
    options = undefined;
    document.documentElement.removeAttribute('data-reveal-ready');
    window.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = original;
  });

  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('hides nothing until it knows it can reveal again', async () => {
    const host = await render();

    // The hidden state lives behind `data-reveal-ready`, stamped here. The 2022
    // version hid content unconditionally in CSS and revealed it from React, so
    // a broken bundle meant a blank page.
    expect(document.documentElement.hasAttribute('data-reveal-ready')).toBe(true);
    expect(host.querySelectorAll('.reveal')).toHaveLength(2);
    expect(host.querySelectorAll('.reveal--in')).toHaveLength(0);
  });

  it('carries its position in the group, for the stagger', async () => {
    const host = await render();
    const [first, fourth] = Array.from(host.querySelectorAll<HTMLElement>('.reveal'));

    expect(first.style.getPropertyValue('--reveal-index')).toBe('0');
    expect(fourth.style.getPropertyValue('--reveal-index')).toBe('3');
  });

  it('reveals on the first intersection and stops watching', async () => {
    const host = await render();

    callbacks[0]([{ isIntersecting: true }]);
    TestBed.tick();

    expect(host.querySelector('.reveal--in')).toBeTruthy();
    // An arrival, not a scroll-linked effect: scrolling back up must not fade
    // a section out again.
    expect(disconnects).toBe(1);
  });

  // jsdom lays nothing out, so the rect has to be stated. That is the point of
  // these two: the observer's margin says "not yet" while the element is
  // plainly on screen, and only one of those answers is right at arrival.
  function placeAt(element: Element, top: number, height = 200): void {
    element.getBoundingClientRect = () =>
      ({ top, bottom: top + height, height }) as unknown as DOMRect;
  }

  it('reveals what is already on screen at arrival, margin or not', async () => {
    const host = await render();
    const first = host.querySelector('.reveal')!;

    // In the bottom third of the first viewport: the margin excludes it, so on
    // a page short enough not to scroll it would wait for a scroll that never
    // comes and never appear at all.
    placeAt(first, window.innerHeight - 100);
    callbacks[0]([{ isIntersecting: false }]);
    TestBed.tick();

    expect(first.classList.contains('reveal--in')).toBe(true);
    expect(disconnects).toBe(1);
  });

  it('leaves alone what is genuinely below the fold', async () => {
    const host = await render();
    const first = host.querySelector('.reveal')!;

    placeAt(first, window.innerHeight + 400);
    callbacks[0]([{ isIntersecting: false }]);
    TestBed.tick();

    expect(first.classList.contains('reveal--in')).toBe(false);
    expect(disconnects).toBe(0);
  });

  it('stops crediting arrival after the first report', async () => {
    const host = await render();
    const first = host.querySelector('.reveal')!;

    placeAt(first, window.innerHeight + 400);
    callbacks[0]([{ isIntersecting: false }]);

    // Now on screen, but this is a scroll report: only the observer's own
    // verdict counts from here, or the reveal would fire a third of a viewport
    // too early again.
    placeAt(first, window.innerHeight - 100);
    callbacks[0]([{ isIntersecting: false }]);
    TestBed.tick();

    expect(first.classList.contains('reveal--in')).toBe(false);
  });

  it('waits until the element is a third into the viewport', async () => {
    await render();
    expect(options?.rootMargin).toBe('0px 0px -33% 0px');
  });

  it('observes each element it is put on', async () => {
    await render();
    expect(observed).toHaveLength(2);
  });

  it('shows the content outright when there is no observer', async () => {
    // Never leave a page's own prose behind a capability check.
    Reflect.deleteProperty(window, 'IntersectionObserver');
    const host = await render();

    expect(host.querySelectorAll('.reveal--in')).toHaveLength(2);
    expect(document.documentElement.hasAttribute('data-reveal-ready')).toBe(false);
  });
});
