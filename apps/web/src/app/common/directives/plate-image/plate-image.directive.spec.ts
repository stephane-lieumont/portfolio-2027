import { Component, provideZonelessChangeDetection, signal } from '@angular/core';

import { ReducedMotionService } from '@core/services/motion/reduced-motion.service';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlateImageDirective, PlateWarmer, isPainted, painted } from './plate-image.directive';

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

describe('PlateWarmer', () => {
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
    TestBed.inject(PlateWarmer).warm(img);

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
    <span class="plate" [attr.data-reveal]="pending ? 'pending' : null">
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

  it('fades in once decoded, in the viewer’s 400ms', async () => {
    const { animate, plate } = await load(false, false);
    expect(plate.dataset['plate']).toBe('ready');
    expect(animate).toHaveBeenCalledWith([{ opacity: 0 }, { opacity: 1 }], {
      duration: 400,
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
