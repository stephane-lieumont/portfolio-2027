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
  private shell?: HTMLElement;
  private closing?: ReturnType<typeof setTimeout>;

  readonly open = signal(false);

  constructor() {
    effect(() => {
      const root = this.document.documentElement;
      clearTimeout(this.closing);

      if (this.open()) {
        root.setAttribute('data-menu', 'open');
        return;
      }

      // The shell is still travelling back from 0.9 to 1 after the attribute
      // would otherwise go, and the clip below has to outlive that or the
      // scrolled-past page flashes into view on the way out. `closing` keeps
      // the clip and drops everything else.
      if (root.getAttribute('data-menu') === null) return;
      root.setAttribute('data-menu', 'closing');
      const dismiss = msOf(getComputedStyle(root).getPropertyValue('--motion-menu-dismiss'));
      this.closing = setTimeout(() => root.removeAttribute('data-menu'), dismiss);
    });
  }

  register(panel: HTMLElement, shell: HTMLElement): void {
    this.panel = panel;
    this.shell = shell;
    panel.style.translate = '100% 0';
  }

  /**
   * Ties the recession to what the visitor is actually looking at.
   *
   * The shell is as tall as the whole document, and both defaults betray that.
   * `transform-origin: center` resolves against the shell's own box, so on a
   * long page the recession converges on a point far below the fold. And
   * shrinking a document-tall box to 0.9 pulls its off-screen parts inward:
   * scroll down the home page, open the menu, and the split slides in above
   * the header — content already scrolled past, reappearing.
   *
   * Both are fixed by describing the viewport in the shell's own coordinates:
   * the origin sits at its centre, and a clip keeps only the band that was on
   * screen. `clip-path` is applied before the transform, so the visible
   * rectangle is what recedes, and nothing outside it can ever be painted.
   *
   * Measured with `offsetTop` and `offsetHeight`, never `getBoundingClientRect`.
   * A rect reports the *transformed* box, so reopening while the previous
   * recession was still easing back read the shell at 0.9 and produced an
   * offset that was not merely off by a few pixels — measured once, it put the
   * clip at the wrong end of the page entirely. Layout offsets ignore
   * transforms, which is the only property that makes them safe here.
   */
  private pinToViewport(): void {
    const root = this.document.documentElement;
    const view = this.document.defaultView;
    const shell = this.shell;
    if (!view || !shell) return;

    const viewport = view.innerHeight;
    const above = Math.max(0, root.scrollTop - shell.offsetTop);
    const below = Math.max(0, shell.offsetHeight - above - viewport);

    root.style.setProperty('--menu-origin-y', `${Math.round(above + viewport / 2)}px`);
    root.style.setProperty('--menu-clip-top', `${Math.round(above)}px`);
    root.style.setProperty('--menu-clip-bottom', `${Math.round(below)}px`);
  }

  toggle(open: boolean): void {
    this.open.set(open);

    if (open) this.pinToViewport();

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
