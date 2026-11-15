import { DOCUMENT, DestroyRef, Injectable, inject } from '@angular/core';

import { SmoothScrollService } from '@core/services/motion/smooth-scroll/smooth-scroll.service';

/** Where on the screen the visitor is taken to be reading: a third of the way down. */
const READING_LINE = 0.3;
const BLOCKS = 'h1, h2, h3, p, li, figure, dt, dd, blockquote, article, section';
/** The page settles in steps after a rotation: frames, then the mosaic's own layout. */
const SETTLE_MS = [350, 700];

/** The block under the reading line, outside the fixed header and dock. */
export function readingBlock(document: Document, width: number, height: number): Element | null {
  const hit = document.elementFromPoint(width / 2, height * READING_LINE);
  if (!hit || hit.closest('header.top, .dock')) return null;
  return hit.closest(BLOCKS) ?? hit;
}

/** How far into `block` the reading line sits, from 0 (its top) to 1 (its bottom). */
export function progressThrough(
  blockTop: number,
  blockHeight: number,
  viewportHeight: number,
): number {
  if (blockHeight <= 0) return 0;
  return (viewportHeight * READING_LINE - blockTop) / blockHeight;
}

/**
 * The scroll offset that brings the reading line back to the same point of
 * `block`, as a share of its height: a tall section that grew or shrank keeps
 * the passage read under the line, not only its top edge.
 */
export function restoredScroll(
  scrollY: number,
  block: { top: number; height: number },
  progress: number,
  viewportHeight: number,
): number {
  const read = block.top + progress * block.height;
  return Math.max(0, Math.round(scrollY + read - viewportHeight * READING_LINE));
}

/**
 * Keeps the visitor's place when the page changes width, a phone turned on
 * its side above all (#50). The scroll offset alone survives a rotation, and
 * the layout under it does not: measured on /graphisme-3d, the passage being
 * read ended 2,400px below the screen. The block being read is remembered as
 * the page scrolls, then put back at the same share of the screen once the new
 * layout has settled.
 */
@Injectable({ providedIn: 'root' })
export class ReadingAnchorService {
  private readonly document = inject(DOCUMENT);
  private readonly smooth = inject(SmoothScrollService);
  private readonly destroyRef = inject(DestroyRef);

  private anchor: { block: Element; progress: number } | null = null;
  private width = 0;
  private restoring = false;
  private marking = false;

  /** Call from afterNextRender: never during prerendering. */
  enable(): void {
    const view = this.document.defaultView;
    if (!view || typeof view.ResizeObserver !== 'function') return;
    this.width = view.innerWidth;

    const onScroll = () => {
      if (this.marking || this.restoring) return;
      this.marking = true;
      view.requestAnimationFrame(() => {
        this.marking = false;
        this.mark(view);
      });
    };
    const onResize = () => {
      if (view.innerWidth === this.width) return;
      this.width = view.innerWidth;
      this.restore(view);
    };
    view.addEventListener('scroll', onScroll, { passive: true });
    view.addEventListener('resize', onResize);
    // Images and the mosaic settle after the last scroll: the page grows under
    // a still reader, and the block marked then is no longer under the line.
    const growth = new view.ResizeObserver(() => {
      if (view.innerWidth === this.width) onScroll();
    });
    growth.observe(this.document.body);
    // A block measured while it rises into view is measured off its place.
    const settled = () => onScroll();
    this.document.addEventListener('animationend', settled, true);
    this.document.addEventListener('transitionend', settled, true);
    this.destroyRef.onDestroy(() => {
      view.removeEventListener('scroll', onScroll);
      view.removeEventListener('resize', onResize);
      growth.disconnect();
      this.document.removeEventListener('animationend', settled, true);
      this.document.removeEventListener('transitionend', settled, true);
    });
  }

  private mark(view: Window): void {
    if (view.scrollY < 1) {
      this.anchor = null;
      return;
    }
    const block = readingBlock(this.document, view.innerWidth, view.innerHeight);
    if (!block) {
      this.anchor = null;
      return;
    }
    const { top, height } = block.getBoundingClientRect();
    this.anchor = { block, progress: progressThrough(top, height, view.innerHeight) };
  }

  private restore(view: Window): void {
    const anchor = this.anchor;
    if (!anchor) return;
    this.restoring = true;
    const place = () => {
      if (!anchor.block.isConnected) return;
      const { top, height } = anchor.block.getBoundingClientRect();
      this.smooth.jumpTo(
        restoredScroll(view.scrollY, { top, height }, anchor.progress, view.innerHeight),
      );
    };
    view.requestAnimationFrame(() => view.requestAnimationFrame(place));
    const [early, late] = SETTLE_MS;
    view.setTimeout(place, early);
    view.setTimeout(() => {
      place();
      this.restoring = false;
    }, late);
  }
}
