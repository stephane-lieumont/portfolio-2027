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

  it('ignores an entry that is not intersecting', async () => {
    const host = await render();

    callbacks[0]([{ isIntersecting: false }]);
    TestBed.tick();

    expect(host.querySelectorAll('.reveal--in')).toHaveLength(0);
    expect(disconnects).toBe(0);
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
