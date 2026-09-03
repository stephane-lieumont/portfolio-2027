import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Menu } from './menu';

interface FakeAnimation {
  playState: string;
  reverse: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  onfinish: (() => void) | null;
}

/**
 * A stand-in for the shell, sized like a page taller than the viewport.
 * `offsetTop` and `offsetHeight` are read-only on a real element, and the
 * production code reads exactly those two — not a bounding rect — so the fake
 * has to define them.
 */
function fakeShell(offsetHeight: number, offsetTop = 0): HTMLElement {
  const shell = document.createElement('div');
  Object.defineProperties(shell, {
    offsetTop: { value: offsetTop },
    offsetHeight: { value: offsetHeight },
  });
  return shell;
}

describe('Menu', () => {
  let menu: Menu;
  let panel: HTMLElement;
  let shell: HTMLElement;
  let animations: { keyframes: Keyframe[]; options: KeyframeAnimationOptions }[];
  let current: FakeAnimation;

  beforeEach(() => {
    document.documentElement.removeAttribute('data-menu');
    document.documentElement.scrollTop = 0;
    for (const prop of ['--menu-origin-y', '--menu-clip-top', '--menu-clip-bottom']) {
      document.documentElement.style.removeProperty(prop);
    }
    document.documentElement.style.setProperty('--motion-menu-panel', '900ms');
    document.documentElement.style.setProperty('--motion-menu-dismiss', '700ms');

    animations = [];
    panel = document.createElement('nav');
    panel.animate = ((keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      animations.push({ keyframes, options });
      current = { playState: 'running', reverse: vi.fn(), cancel: vi.fn(), onfinish: null };
      return current as unknown as Animation;
    }) as HTMLElement['animate'];

    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    shell = fakeShell(3130);
    menu = TestBed.inject(Menu);
    menu.register(panel, shell);
  });

  it('parks the panel off-screen on registration', () => {
    expect(panel.style.translate).toBe('100% 0');
  });

  it('mirrors its state onto the document element', () => {
    vi.useFakeTimers();
    try {
      menu.toggle(true);
      TestBed.tick();
      expect(document.documentElement.getAttribute('data-menu')).toBe('open');

      current.playState = 'finished';
      menu.toggle(false);
      TestBed.tick();

      // Not gone immediately: the shell is still easing back from 0.9 and the
      // viewport clip has to outlive that. See the clipping tests below.
      expect(document.documentElement.getAttribute('data-menu')).toBe('closing');

      vi.advanceTimersByTime(700);
      expect(document.documentElement.hasAttribute('data-menu')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('animates toward the open position, then away from it', () => {
    menu.toggle(true);
    expect(animations[0].keyframes).toEqual([{ translate: '100% 0' }, { translate: '0 0' }]);
    expect(animations[0].options.duration).toBe(900);

    current.playState = 'finished';
    menu.toggle(false);

    // The previous draft animated toward '0 0' on both paths, so closing slid
    // the panel out and back and left it open while the code believed
    // otherwise. The keyframes have to be explicitly reversed.
    expect(animations[1].keyframes).toEqual([{ translate: '0 0' }, { translate: '100% 0' }]);
    expect(animations[1].options.duration).toBe(700);
  });

  it('reverses a running animation instead of starting a second one', () => {
    menu.toggle(true);
    const running = current;

    menu.toggle(false);

    expect(running.reverse).toHaveBeenCalledOnce();
    expect(animations).toHaveLength(1);
  });

  it('commits the resting position from its own state, not from the last call', () => {
    menu.toggle(true);
    const animation = current;

    // An interrupted reverse must finish on the state the visitor last chose.
    menu.open.set(false);
    animation.onfinish?.();

    expect(panel.style.translate).toBe('100% 0');
    expect(animation.cancel).toHaveBeenCalled();
  });

  it('does nothing before a panel is registered', () => {
    const fresh = TestBed.runInInjectionContext(() => new Menu());
    expect(() => fresh.toggle(true)).not.toThrow();
  });

  // The shell is as tall as the document. Shrinking it to 0.9 pulls its
  // off-screen parts inward, so scrolling down the home page and opening the
  // menu slid the split in above the header — content already scrolled past,
  // reappearing. The clip keeps only the band that was on screen.
  describe('clipping the recession to the viewport', () => {
    const viewport = window.innerHeight;

    it('keeps only the band that was on screen', () => {
      document.documentElement.scrollTop = 900;
      menu.toggle(true);

      const style = document.documentElement.style;
      expect(style.getPropertyValue('--menu-clip-top')).toBe('900px');
      expect(style.getPropertyValue('--menu-clip-bottom')).toBe(`${3130 - 900 - viewport}px`);
    });

    it('pins the recession origin to the middle of that band', () => {
      document.documentElement.scrollTop = 900;
      menu.toggle(true);

      // Not `transform-origin: center`, which resolves against the shell's own
      // box — on a long page the recession converged far below the fold.
      expect(document.documentElement.style.getPropertyValue('--menu-origin-y')).toBe(
        `${Math.round(900 + viewport / 2)}px`,
      );
    });

    it('clamps at the top and the bottom of the page', () => {
      menu.toggle(true);
      expect(document.documentElement.style.getPropertyValue('--menu-clip-top')).toBe('0px');

      current.playState = 'finished';
      menu.toggle(false);
      document.documentElement.scrollTop = 3130;
      menu.toggle(true);

      expect(document.documentElement.style.getPropertyValue('--menu-clip-bottom')).toBe('0px');
    });

    it('holds the clip through the dismiss, then drops it', () => {
      vi.useFakeTimers();
      try {
        menu.toggle(true);
        TestBed.tick();

        current.playState = 'finished';
        menu.toggle(false);
        TestBed.tick();

        // Still travelling back from 0.9: dropping the clip here flashes the
        // scrolled-past page into view on the way out.
        expect(document.documentElement.getAttribute('data-menu')).toBe('closing');

        vi.advanceTimersByTime(700);
        expect(document.documentElement.hasAttribute('data-menu')).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('measures from layout offsets, not from the transformed box', () => {
      // Reopening while the previous recession was still easing back read the
      // shell at 0.9 through getBoundingClientRect and put the clip at the
      // wrong end of the page. A rect is scaled; offsetHeight is not.
      shell.getBoundingClientRect = () =>
        ({ top: -10, height: 99, bottom: 89 }) as unknown as DOMRect;
      document.documentElement.scrollTop = 400;

      menu.toggle(true);

      expect(document.documentElement.style.getPropertyValue('--menu-clip-top')).toBe('400px');
      expect(document.documentElement.style.getPropertyValue('--menu-clip-bottom')).toBe(
        `${3130 - 400 - viewport}px`,
      );
    });
  });
});
