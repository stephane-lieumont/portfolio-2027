import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signal } from '@angular/core';

import { ReducedMotionService } from '../../../core/services/motion/reduced-motion.service';
import { SAFETY_MS, WorldRevealDirective, diagonalCut } from './world-reveal.directive';

@Component({
  imports: [WorldRevealDirective],
  template: `
    <div class="work__head" appWorldReveal="lines">
      <h2>Réalisations</h2>
      <p>04 projets</p>
    </div>
  `,
})
class Host {}

@Component({
  imports: [WorldRevealDirective],
  template: `<li class="tile" appWorldReveal="tile"><img src="/medias/cgi/a.jpg" alt="" /></li>`,
})
class Tile {}

@Component({
  imports: [WorldRevealDirective],
  template: `<div class="mastery" appWorldReveal="ruled">
    <div data-reveal-part>Maîtrise</div>
    <ol>
      <li data-reveal-part>Un</li>
      <li data-reveal-part>Deux</li>
    </ol>
  </div>`,
})
class Ruled {}

@Component({
  imports: [WorldRevealDirective],
  template: `<li class="row" appWorldReveal="row"><img src="/medias/p.jpg" alt="" /></li>`,
})
class Row {}

describe('WorldRevealDirective', () => {
  const root = document.documentElement;
  let report: ((entries: { target: Element; isIntersecting: boolean }[]) => void) | null;
  let top: number;

  beforeEach(() => {
    report = null;
    top = 5000;
    root.classList.add('js-motion');
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe = () => undefined;
        unobserve = () => undefined;
        disconnect = () => undefined;
      },
    );
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ top, bottom: top + 100, left: 0, right: 100, width: 100, height: 100 }) as DOMRect,
    );
    Element.prototype.animate = vi.fn(
      () => ({ finished: Promise.resolve(), cancel: () => undefined }) as unknown as Animation,
    );
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    root.classList.remove('js-motion');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('.work__head')!;
  }

  it('hides what starts below the fold, and shows it once it comes on screen', async () => {
    const head = await render();
    expect(head.dataset['reveal']).toBe('pending');

    report?.([{ target: head, isIntersecting: true }]);
    await vi.waitFor(() => expect(head.dataset['reveal']).toBeUndefined());
  });

  it('leaves alone what is already on screen', async () => {
    top = 100;
    const head = await render();
    expect(head.dataset['reveal']).toBeUndefined();
  });

  it('never hides anything without the head script’s mark', async () => {
    root.classList.remove('js-motion');
    const head = await render();
    expect(head.dataset['reveal']).toBeUndefined();
  });

  it('shows what is on screen after two seconds even if the observer stayed silent', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const head = await render();
    top = 200;
    vi.advanceTimersByTime(SAFETY_MS);
    await vi.waitFor(() => expect(head.dataset['reveal']).toBeUndefined());
  });
});

describe('WorldRevealDirective on a 3D tile', () => {
  let report: ((entries: { target: Element; isIntersecting: boolean }[]) => void) | null;

  beforeEach(() => {
    document.documentElement.classList.add('js-motion');
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe = () => undefined;
        unobserve = () => undefined;
      },
    );
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 5000,
      bottom: 5100,
    } as DOMRect);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    document.documentElement.classList.remove('js-motion');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('waits for the picture, then plays the mockup’s single fade-and-settle on it, never on an empty box', async () => {
    const animate = vi.fn<(frames: Keyframe[]) => Animation>(
      () => ({ finished: Promise.resolve(), cancel: () => undefined }) as unknown as Animation,
    );
    Element.prototype.animate = animate as unknown as Element['animate'];
    const fixture = TestBed.createComponent(Tile);
    fixture.detectChanges();
    await fixture.whenStable();
    const tile = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.tile')!;
    const img = tile.querySelector('img')!;

    report?.([{ target: tile, isIntersecting: true }]);
    await Promise.resolve();
    expect(tile.dataset['reveal']).toBe('pending');
    expect(animate).not.toHaveBeenCalled();

    img.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(tile.dataset['reveal']).toBeUndefined());
    const keyframes = animate.mock.calls.map(([frames]) => Object.keys(frames[0]).sort());
    expect(keyframes).toEqual([['opacity', 'scale']]);
  });
});

describe('WorldRevealDirective, the other kinds', () => {
  let report: ((entries: { target: Element; isIntersecting: boolean }[]) => void) | null;
  let animate: ReturnType<typeof vi.fn>;

  function setup(reduced = false, observer = true) {
    report = null;
    document.documentElement.classList.add('js-motion');
    if (observer) {
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(callback: typeof report) {
            report = callback;
          }
          observe = () => undefined;
          unobserve = () => undefined;
        },
      );
    } else {
      vi.stubGlobal('IntersectionObserver', undefined);
    }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 5000,
      bottom: 5100,
    } as DOMRect);
    animate = vi.fn(
      () => ({ finished: Promise.resolve(), cancel: () => undefined }) as unknown as Animation,
    );
    Element.prototype.animate = animate as unknown as Element['animate'];
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ReducedMotionService, useValue: { reduced: signal(reduced) } },
      ],
    });
  }

  afterEach(() => {
    document.documentElement.classList.remove('js-motion');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function render<T>(type: new () => T, selector: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(type);
    fixture.detectChanges();
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector)!;
  }

  it('raises the label and the points in order, and draws the hairline', async () => {
    setup();
    const panel = await render(Ruled, '.mastery');
    report?.([{ target: panel, isIntersecting: true }]);
    expect(panel.dataset['reveal']).toBe('running');
    // Three parts rising, then the hairline.
    expect(animate).toHaveBeenCalledTimes(4);
    expect(Object.keys((animate.mock.calls[3][0] as Keyframe[])[0])).toEqual(['backgroundSize']);
    await vi.waitFor(() => expect(panel.dataset['reveal']).toBeUndefined());
  });

  it('cuts a project’s picture in along the diagonal once it has loaded', async () => {
    setup();
    const row = await render(Row, '.row');
    report?.([{ target: row, isIntersecting: true }]);
    row.querySelector('img')!.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(row.dataset['reveal']).toBeUndefined());
    const keys = animate.mock.calls.map(([f]) => Object.keys((f as Keyframe[])[0]).join());
    expect(keys).toEqual(['clipPath', 'scale']);
  });

  it('hides nothing under reduced motion', async () => {
    setup(true);
    const panel = await render(Ruled, '.mastery');
    expect(panel.dataset['reveal']).toBeUndefined();
  });

  it('hides nothing without an observer to show it again', async () => {
    setup(false, false);
    const panel = await render(Ruled, '.mastery');
    expect(panel.dataset['reveal']).toBeUndefined();
  });
});

describe('diagonalCut', () => {
  it('leans like the sweep: 20% of the viewport width over its height', () => {
    const [from, to] = diagonalCut(450, 1600, 900, -1);
    expect(from).toBe('polygon(0 0, 0 0, -160px 100%, -160px 100%)');
    expect(to).toBe('polygon(0 0, calc(100% + 160px) 0, 100% 100%, -160px 100%)');
  });
});
