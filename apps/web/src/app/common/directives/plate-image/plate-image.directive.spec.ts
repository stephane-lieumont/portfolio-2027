import { Component, provideZonelessChangeDetection, signal } from '@angular/core';

import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PlateImageDirective,
  PlateWatch,
  WAIT_DELAY_MS,
  cssRuns,
  isPainted,
  painted,
  sweepKeyframes,
  sweepSkew,
} from './plate-image.directive';

@Component({
  imports: [PlateImageDirective],
  template: `
    <span class="plate" style="--plate-tone: #807a3b">
      <img appPlate="wall" [src]="src()" srcset="/medias/cgi/a-640.webp 640w" sizes="50vw" alt="" />
    </span>
  `,
})
class Host {
  readonly src = signal('/medias/cgi/a.jpg');
}

describe('PlateImageDirective', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      img: host.querySelector('img')!,
      plate: host.querySelector<HTMLElement>('.plate')!,
    };
  }

  it('holds the frame in the picture’s tone while it loads', async () => {
    const { fixture, plate } = render();
    await fixture.whenStable();
    expect(plate.dataset['plate']).toBe('loading');
  });

  it('retries a failed derivative as the original, which browsers never do alone', () => {
    const { img } = render();
    img.dispatchEvent(new Event('error'));

    expect(img.hasAttribute('srcset')).toBe(false);
    expect(img.hasAttribute('sizes')).toBe(false);
    expect(img.getAttribute('src')).toBe('/medias/cgi/a.jpg');
  });

  it('shows the fallback once the original itself fails', async () => {
    const { fixture, img, plate } = render();
    await fixture.whenStable();
    img.removeAttribute('srcset');
    img.dispatchEvent(new Event('error'));
    await painted(img);
    expect(plate.dataset['plate']).toBe('error');
  });
});

describe('a picture already in cache', () => {
  afterEach(() => vi.restoreAllMocks());

  it('stays as it is at hydration: ready, painted, no arrival', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1280);
    const animate = vi.fn();
    Element.prototype.animate = animate;
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const img = host.querySelector('img')!;

    expect(host.querySelector<HTMLElement>('.plate')!.dataset['plate']).toBe('ready');
    await painted(img);
    expect(isPainted(img)).toBe(true);
    expect(animate).not.toHaveBeenCalled();
  });
});

@Component({
  imports: [PlateImageDirective],
  template: `
    <span class="plate" [attr.data-plate-loaded]="loaded" [attr.data-plate-failed]="failed">
      <img appPlate="wall" src="/medias/cgi/c.jpg" alt="" />
    </span>
  `,
})
class Stamped {
  loaded: string | null = null;
  failed: string | null = null;
}

describe('a picture the head script settled before the app booted', () => {
  afterEach(() => vi.restoreAllMocks());

  function boot(stamp: Partial<Stamped>) {
    const animate = vi.fn();
    Element.prototype.animate = animate;
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Stamped);
    Object.assign(fixture.componentInstance, stamp);
    fixture.detectChanges();
    const plate = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.plate')!;
    return { fixture, plate, animate };
  }

  it('stays as the stylesheet left it: ready, never arriving a second time', async () => {
    const { fixture, plate, animate } = boot({ loaded: 'fade' });
    await fixture.whenStable();
    expect(plate.dataset['plate']).toBe('ready');
    expect(plate.dataset['plateLoaded']).toBe('fade');
    expect(animate).not.toHaveBeenCalled();
  });

  it('shows the fallback when its original had already failed', async () => {
    const { fixture, plate } = boot({ failed: '' });
    await fixture.whenStable();
    expect(plate.dataset['plate']).toBe('error');
  });

  it('stamps a picture complete at hydration as loaded, so the wall never hides it', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1280);
    const { fixture, plate } = boot({});
    await fixture.whenStable();
    expect(plate.hasAttribute('data-plate-loaded')).toBe(true);
  });
});

describe('cssRuns', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('finds the stylesheet’s own animation by name, and nothing else', () => {
    class FakeCssAnimation {
      constructor(readonly animationName: string) {}
    }
    vi.stubGlobal('CSSAnimation', FakeCssAnimation);
    const plate = document.createElement('span');
    Object.defineProperty(plate, 'getAnimations', {
      value: () => [new FakeCssAnimation('plate-wait-in')],
    });
    expect(cssRuns(plate, 'plate-wait-in')).toBe(true);
    expect(cssRuns(plate, 'plate-arrive')).toBe(false);
  });

  it('is false where the browser cannot tell', () => {
    expect(cssRuns(document.createElement('span'), 'plate-arrive')).toBe(false);
  });
});

describe('PlateWatch', () => {
  it('turns a lazy picture eager and low priority once it is a screen and a half away', () => {
    let report: ((entries: { target: Element; isIntersecting: boolean }[]) => void) | null = null;
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
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const img = document.createElement('img');
    img.loading = 'lazy';
    TestBed.inject(PlateWatch).warm(img);

    report!([{ target: img, isIntersecting: false }]);
    expect(img.loading).toBe('lazy');
    report!([{ target: img, isIntersecting: true }]);
    expect(img.loading).toBe('eager');
    expect(img.fetchPriority).toBe('low');
    vi.unstubAllGlobals();
  });
});

@Component({
  imports: [PlateImageDirective],
  template: `
    <span class="plate is-current" [attr.data-reveal]="pending ? 'pending' : null">
      <img appPlate="viewer" src="/medias/cgi/b.jpg" alt="" />
    </span>
  `,
})
class Viewer {
  pending = false;
}

describe('a picture arriving', () => {
  afterEach(() => vi.restoreAllMocks());

  async function load(reduced: boolean, pending: boolean) {
    const animate = vi.fn();
    Element.prototype.animate = animate;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ReducedMotionService, useValue: { reduced: signal(reduced) } },
      ],
    });
    const fixture = TestBed.createComponent(Viewer);
    fixture.componentInstance.pending = pending;
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const img = host.querySelector('img')!;
    img.dispatchEvent(new Event('load'));
    await painted(img);
    await Promise.resolve();
    return { animate, plate: host.querySelector<HTMLElement>('.plate')! };
  }

  it('fades in once decoded, in the viewer’s 360ms, without the wall’s settle', async () => {
    const { animate, plate } = await load(false, false);
    expect(plate.dataset['plate']).toBe('ready');
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledWith([{ opacity: 0 }, { opacity: 1 }], {
      duration: 360,
      easing: 'cubic-bezier(0.45, 0, 0.25, 1)',
    });
  });

  it('fades in 200ms linear under reduced motion', async () => {
    const { animate } = await load(true, false);
    expect(animate).toHaveBeenCalledWith(expect.anything(), { duration: 200, easing: 'linear' });
  });

  it('leaves the arrival to the reveal when it waits below the fold', async () => {
    const { animate, plate } = await load(false, true);
    expect(plate.dataset['plate']).toBe('ready');
    expect(animate).not.toHaveBeenCalled();
  });
});

describe('the band’s lean', () => {
  it('follows the sweep’s diagonal on the viewport', () => {
    expect(sweepSkew(1600, 900)).toBeCloseTo(19.6, 1);
    expect(sweepSkew(390, 844)).toBeCloseTo(5.3, 1);
  });

  it('crosses the plate in the first two-thirds of a cycle, then rests off it', () => {
    const frames = sweepKeyframes(20);
    expect(frames.map((f) => f.offset)).toEqual([0, 0.67, 1]);
    expect(frames[1]['transform']).toBe(frames[2]['transform']);
    expect(frames[0]['transform']).toContain('skewX(-20deg)');
  });
});

describe('a picture slow to come', () => {
  let report: ((entries: { target: Element; isIntersecting: boolean }[]) => void) | null = null;
  const runs: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    report = null;
    runs.length = 0;
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
    Element.prototype.animate = vi.fn(() => {
      const run = {
        play: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(),
        finished: Promise.resolve(),
      };
      runs.push(run);
      return run as unknown as Animation;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function render(reduced = false, kind: 'wall' | 'viewer' = 'wall') {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ReducedMotionService, useValue: { reduced: signal(reduced) } },
      ],
    });
    const fixture =
      kind === 'wall' ? TestBed.createComponent(Host) : TestBed.createComponent(Viewer);
    fixture.detectChanges();
    TestBed.tick();
    const host = fixture.nativeElement as HTMLElement;
    const plate = host.querySelector<HTMLElement>('.plate')!;
    return { plate, img: host.querySelector('img')! };
  }

  const inView = (plate: Element, isIntersecting: boolean) =>
    report!([{ target: plate, isIntersecting }]);

  it('says nothing before its delay', () => {
    const { plate } = render();
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.wall - 1);
    expect(plate.hasAttribute('data-plate-wait')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(plate.dataset['plateWait']).toBe('sweep');
  });

  it('only waits while on screen: the delay restarts once back in view', () => {
    const { plate } = render();
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.wall - 100);
    inView(plate, false);
    vi.advanceTimersByTime(WAIT_DELAY_MS.wall);
    expect(plate.hasAttribute('data-plate-wait')).toBe(false);
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.wall);
    expect(plate.dataset['plateWait']).toBe('sweep');
  });

  it('pauses its sweep off screen and resumes it in view', () => {
    const { plate } = render();
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.wall);
    inView(plate, false);
    expect(runs.every((run) => run.pause.mock.calls.length === 1)).toBe(true);
    inView(plate, true);
    expect(runs.every((run) => run.play.mock.calls.length === 1)).toBe(true);
  });

  it('stops once the picture is there, and lets it arrive', async () => {
    const { plate, img } = render();
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.wall);
    img.dispatchEvent(new Event('load'));
    await vi.runAllTimersAsync();
    expect(plate.dataset['plate']).toBe('ready');
    expect(plate.hasAttribute('data-plate-wait')).toBe(false);
  });

  it('says it in words, still, under reduced motion', () => {
    const { plate } = render(true);
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.wall);
    expect(plate.dataset['plateWait']).toBe('still');
    expect(runs).toHaveLength(0);
  });

  it('waits in the viewer until its morph is over, then pulses', () => {
    const { plate } = render(false, 'viewer');
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.viewer - 1);
    expect(plate.hasAttribute('data-plate-wait')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(plate.dataset['plateWait']).toBe('pulse');
  });

  it('never waits on a viewer slide that is not shown, until it is', async () => {
    const { plate } = render(false, 'viewer');
    plate.classList.remove('is-current');
    await Promise.resolve();
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.viewer * 2);
    expect(plate.hasAttribute('data-plate-wait')).toBe(false);
    plate.classList.add('is-current');
    await Promise.resolve();
    vi.advanceTimersByTime(WAIT_DELAY_MS.viewer);
    expect(plate.dataset['plateWait']).toBe('pulse');
  });

  it('fades out before the fallback shows when the picture fails', async () => {
    const { plate, img } = render();
    inView(plate, true);
    vi.advanceTimersByTime(WAIT_DELAY_MS.wall);
    img.removeAttribute('srcset');
    img.dispatchEvent(new Event('error'));
    await vi.runAllTimersAsync();
    expect(plate.dataset['plate']).toBe('error');
    expect(plate.hasAttribute('data-plate-wait')).toBe(false);
  });
});
