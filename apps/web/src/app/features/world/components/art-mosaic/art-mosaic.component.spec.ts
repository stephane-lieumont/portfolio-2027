import { Location } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MEDIA_BASE_URL } from '@core/config/media-config/media.config';
import { ARTWORKS } from '@core/data/static-content/static-content';
import { SmoothScrollService } from '@core/services/motion/smooth-scroll/smooth-scroll.service';
import { keyStep } from '@features/world/components/art-viewer/art-viewer.component';
import { ArtMosaicComponent } from './art-mosaic.component';

describe('keyStep', () => {
  it('maps the arrows, Home and End to a piece and a direction', () => {
    expect(keyStep('ArrowRight', 3, 16)).toEqual([4, 1]);
    expect(keyStep('ArrowLeft', 3, 16)).toEqual([2, -1]);
    expect(keyStep('Home', 3, 16)).toEqual([0, -1]);
    expect(keyStep('End', 3, 16)).toEqual([15, 1]);
    expect(keyStep('Enter', 3, 16)).toBeNull();
  });
});

describe('ArtMosaicComponent and its viewer', () => {
  let running: { target: Element; cancel: ReturnType<typeof vi.fn> }[] = [];
  const pause = vi.fn();
  const resume = vi.fn();

  beforeEach(() => {
    // jsdom implements neither the modal dialog nor Web Animations.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
    // Each animation is kept with its target, so a test can tell whether a
    // step's cut was cancelled under it.
    running = [];
    Element.prototype.animate = function (this: Element) {
      const animation = {
        target: this,
        finished: Promise.resolve(),
        cancel: vi.fn(),
      };
      running.push(animation);
      return animation as unknown as Animation;
    };
    Element.prototype.getAnimations = function (this: Element, options?: GetAnimationsOptions) {
      return running.filter(
        (a) => a.target === this || (options?.subtree === true && this.contains(a.target)),
      ) as unknown as Animation[];
    };
    Element.prototype.scrollIntoView = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {
            path: 'graphisme-3d',
            component: ArtMosaicComponent,
            children: [
              { path: '', children: [] },
              { path: ':slug', children: [] },
            ],
          },
        ]),
        { provide: MEDIA_BASE_URL, useValue: '/medias' },
        {
          provide: SmoothScrollService,
          useValue: { pause, resume, settle: vi.fn(), jumpTo: vi.fn() },
        },
      ],
    });
  });

  afterEach(() => {
    pause.mockReset();
    resume.mockReset();
  });

  async function at(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    const host = harness.routeNativeElement!;
    const dialog = host.querySelector('dialog')!;
    const status = () => host.querySelector('.show__status')!.textContent;
    const settle = async () => {
      await harness.fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve));
      await harness.fixture.whenStable();
    };
    return { harness, host, dialog, status, settle };
  }

  it('opens the viewer on a piece from its tile, at the piece’s own address', async () => {
    const { host, dialog, status, settle } = await at('/graphisme-3d');
    expect(dialog.open).toBe(false);

    host.querySelectorAll<HTMLAnchorElement>('.tile__btn')[2].click();
    await settle();

    expect(TestBed.inject(Location).path()).toBe(`/graphisme-3d/${ARTWORKS[2].slug.fr}`);
    expect(dialog.open).toBe(true);
    expect(status()).toBe(`3 sur ${ARTWORKS.length}. ${ARTWORKS[2].title.fr}, 2015`);
    expect(pause).toHaveBeenCalled();
  });

  it('opens on the piece in the address when the page is loaded there', async () => {
    const { dialog, status } = await at(`/graphisme-3d/${ARTWORKS[5].slug.fr}`);
    expect(dialog.open).toBe(true);
    expect(status()).toContain(ARTWORKS[5].title.fr);
  });

  it('steps with the arrows on the plate and keeps the address on the piece shown', async () => {
    const { host, status, settle } = await at(`/graphisme-3d/${ARTWORKS[0].slug.fr}`);
    const stage = host.querySelector<HTMLElement>('.show__stage')!;

    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle();
    expect(status()).toContain(ARTWORKS[1].title.fr);
    expect(TestBed.inject(Location).path()).toBe(`/graphisme-3d/${ARTWORKS[1].slug.fr}`);

    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await settle();
    expect(status()).toContain(ARTWORKS[ARTWORKS.length - 1].title.fr);
  });

  it('closes on Escape, back to the wall, focus on the piece’s tile', async () => {
    const { host, dialog, settle } = await at(`/graphisme-3d/${ARTWORKS[4].slug.fr}`);

    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await settle();

    expect(dialog.open).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/graphisme-3d');
    expect(document.activeElement).toBe(host.querySelectorAll('.tile__btn')[4]);
    expect(resume).toHaveBeenCalled();
  });

  it('steps by swipe, by the buttons and by the ticks, wrapping at the ends', async () => {
    const { host, status, settle } = await at(`/graphisme-3d/${ARTWORKS[0].slug.fr}`);
    const stage = host.querySelector<HTMLElement>('.show__stage')!;
    const swipe = (from: number, to: number) => {
      stage.dispatchEvent(Object.assign(new Event('pointerdown'), { clientX: from }));
      stage.dispatchEvent(Object.assign(new Event('pointerup'), { clientX: to }));
    };

    swipe(300, 290);
    await settle();
    expect(status()).toContain(ARTWORKS[0].title.fr);

    swipe(300, 100);
    await settle();
    expect(status()).toContain(ARTWORKS[1].title.fr);

    host.querySelector<HTMLButtonElement>('[aria-label="Rendu précédent"]')!.click();
    await settle();
    host.querySelector<HTMLButtonElement>('[aria-label="Rendu précédent"]')!.click();
    await settle();
    expect(status()).toContain(ARTWORKS[ARTWORKS.length - 1].title.fr);

    host.querySelectorAll<HTMLButtonElement>('.show__tick')[6].click();
    await settle();
    expect(status()).toContain(ARTWORKS[6].title.fr);
  });

  it('fetches only the piece shown and its two neighbours on opening', async () => {
    const { host } = await at(`/graphisme-3d/${ARTWORKS[5].slug.fr}`);
    const slides = Array.from(host.querySelectorAll('.show__slide'));
    expect(slides.map((s, i) => (s.querySelector('img') ? i : -1)).filter((i) => i >= 0)).toEqual([
      4, 5, 6,
    ]);
    expect(slides[5].querySelector('img')!.getAttribute('fetchpriority')).toBe('high');
  });

  it('lets a step’s cut play while the address catches up, instead of restarting the viewer', async () => {
    const { host, settle } = await at(`/graphisme-3d/${ARTWORKS[0].slug.fr}`);
    running = [];
    host
      .querySelector('.show__stage')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle();

    expect(TestBed.inject(Location).path()).toBe(`/graphisme-3d/${ARTWORKS[1].slug.fr}`);
    const entering = host.querySelectorAll('.show__slide')[1];
    const cut = running.filter((a) => a.target === entering || entering.contains(a.target));
    expect(cut.length).toBeGreaterThan(0);
    expect(cut.every((a) => a.cancel.mock.calls.length === 0)).toBe(true);
  });

  it('closing after stepping brings the tile of the piece shown on screen and focuses it', async () => {
    const { host, dialog, settle } = await at('/graphisme-3d');
    host.querySelectorAll<HTMLAnchorElement>('.tile__btn')[10].click();
    await settle();
    host
      .querySelector('.show__stage')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await settle();

    // Opened from the wall, so closing goes Back, as the browser's button does.
    const back = vi.spyOn(TestBed.inject(Location), 'back');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(back).toHaveBeenCalled();
    await TestBed.inject(Router).navigateByUrl('/graphisme-3d');

    const tile = host.querySelectorAll('.tile__btn')[9];
    await vi.waitFor(async () => {
      await settle();
      expect(dialog.open).toBe(false);
      expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts).toContain(tile);
    });
    expect(document.activeElement).toBe(tile);
  });

  it('follows a native close that skipped Escape: the page scrolls again and the address returns to the wall', async () => {
    const { dialog, settle } = await at(`/graphisme-3d/${ARTWORKS[2].slug.fr}`);
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
    await settle();

    expect(resume).toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/graphisme-3d');
  });

  it('ignores arrows with a modifier, which belong to the browser', async () => {
    const { host, status, settle } = await at(`/graphisme-3d/${ARTWORKS[0].slug.fr}`);
    host
      .querySelector('.show__stage')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }),
      );
    await settle();
    expect(status()).toContain(ARTWORKS[0].title.fr);
  });

  it('closes from its button', async () => {
    const { host, dialog, settle } = await at(`/graphisme-3d/${ARTWORKS[1].slug.fr}`);
    host.querySelector<HTMLButtonElement>('[aria-label="Fermer la visionneuse"]')!.click();
    await settle();
    expect(dialog.open).toBe(false);
  });

  it('marks the piece shown among the ticks', async () => {
    const { host } = await at(`/graphisme-3d/${ARTWORKS[3].slug.fr}`);
    const current = Array.from(host.querySelectorAll('.show__tick')).map((t) =>
      t.getAttribute('aria-current'),
    );
    expect(current.indexOf('true')).toBe(3);
    expect(current.filter((c) => c === 'true')).toHaveLength(1);
  });
});
