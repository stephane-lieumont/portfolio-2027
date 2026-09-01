import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

// ~ GSAP Power3.easeInOut, the 2022 panel curve.
const EASE_MENU = 'cubic-bezier(0.77, 0, 0.175, 1)';

function msOf(value: string): number {
  const trimmed = value.trim();
  const parsed = Number.parseFloat(trimmed);
  if (Number.isNaN(parsed)) return 0;
  return trimmed.endsWith('ms') ? parsed : parsed * 1000;
}

/**
 * Owns the off-canvas menu. The panel is animated through the Web Animations
 * API rather than a CSS transition for one reason: a transition reversed
 * mid-flight restarts from the current value and takes its full declared
 * duration for whatever distance is left, which reads as sluggish exactly when
 * the visitor is being decisive. `reverse()` plays the remaining distance back
 * at the speed it arrived.
 */
@Injectable({ providedIn: 'root' })
export class Menu {
  private readonly document = inject(DOCUMENT);
  private animation?: Animation;
  private panel?: HTMLElement;

  readonly open = signal(false);

  constructor() {
    effect(() => {
      const root = this.document.documentElement;
      if (this.open()) {
        root.setAttribute('data-menu', 'open');
      } else {
        root.removeAttribute('data-menu');
      }
    });
  }

  register(panel: HTMLElement): void {
    this.panel = panel;
    panel.style.translate = '100% 0';
  }

  toggle(open: boolean): void {
    this.open.set(open);

    // `transform-origin: center` resolves against the shell's own box, which is
    // the whole document — on a page taller than the viewport the recession
    // then converges on a point far below the fold and reads as off-centre.
    // Pin the origin to the middle of what the visitor is actually looking at.
    if (open) {
      const root = this.document.documentElement;
      const centre = root.scrollTop + this.document.defaultView!.innerHeight / 2;
      root.style.setProperty('--menu-origin-y', `${Math.round(centre)}px`);
    }

    const panel = this.panel;
    if (!panel) return;

    if (this.animation?.playState === 'running') {
      this.animation.reverse();
      return;
    }

    this.animation?.cancel();

    // Without the Web Animations API the panel still has to end up in the right
    // place. Falling through to the resting position degrades the gesture to an
    // instant move rather than leaving the menu stuck mid-travel.
    if (typeof panel.animate !== 'function') {
      panel.style.translate = open ? '0 0' : '100% 0';
      return;
    }

    const style = getComputedStyle(this.document.documentElement);
    const duration = msOf(
      style.getPropertyValue(open ? '--motion-menu-panel' : '--motion-menu-dismiss'),
    );

    this.animation = panel.animate(
      open
        ? [{ translate: '100% 0' }, { translate: '0 0' }]
        : [{ translate: '0 0' }, { translate: '100% 0' }],
      { duration, easing: EASE_MENU, fill: 'both' },
    );

    // Commit the resting position from the signal rather than from `open`:
    // an interrupted reverse finishes on the state the visitor last chose.
    this.animation.onfinish = () => {
      panel.style.translate = this.open() ? '0 0' : '100% 0';
      this.animation?.cancel();
      this.animation = undefined;
    };
  }
}
