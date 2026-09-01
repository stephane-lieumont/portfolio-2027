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

describe('Menu', () => {
  let menu: Menu;
  let panel: HTMLElement;
  let animations: { keyframes: Keyframe[]; options: KeyframeAnimationOptions }[];
  let current: FakeAnimation;

  beforeEach(() => {
    document.documentElement.removeAttribute('data-menu');
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
    menu = TestBed.inject(Menu);
    menu.register(panel);
  });

  it('parks the panel off-screen on registration', () => {
    expect(panel.style.translate).toBe('100% 0');
  });

  it('mirrors its state onto the document element', () => {
    menu.toggle(true);
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-menu')).toBe('open');

    current.playState = 'finished';
    menu.toggle(false);
    TestBed.tick();
    expect(document.documentElement.hasAttribute('data-menu')).toBe(false);
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
});
