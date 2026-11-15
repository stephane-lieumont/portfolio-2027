import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { WorldKey } from '@portfolio/shared-types';

import { FrameLoopService } from '@core/services/motion/frame-loop/frame-loop.service';
import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';
import { StartupService } from '@core/services/startup/startup.service';
import { CloudStore } from '@core/stores/cloud/cloud.store';

const GLYPH_W = 240;
const GLYPH_H = 150;
/** CSS pixels a touch travels before it counts as a sideways grab or a scroll. */
const TOUCH_SLOP = 10;
const GLYPH_FONT = '700 132px "JetBrains Mono", ui-monospace, Menlo, monospace';

/** Where the glyph `</>` is opaque, every other pixel, on a 240 × 150 raster. */
function sampleGlyph(document: Document): [number, number][] {
  const raster = document.createElement('canvas');
  raster.width = GLYPH_W;
  raster.height = GLYPH_H;
  const context = raster.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  context.fillStyle = '#000';
  context.font = GLYPH_FONT;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('</>', GLYPH_W / 2, GLYPH_H / 2 + 6);
  const data = context.getImageData(0, 0, GLYPH_W, GLYPH_H).data;
  const hits: [number, number][] = [];
  for (let y = 0; y < GLYPH_H; y += 2) {
    for (let x = 0; x < GLYPH_W; x += 2) {
      if (data[(y * GLYPH_W + x) * 4 + 3] > 128) hits.push([x, y]);
    }
  }
  return hits;
}

/**
 * The hero's stage. The shape and every point live in CloudStore, so the page
 * of the other world picks the morph up where this one left it. Nothing is
 * drawn while prerendering; under reduced motion one still frame.
 *
 * In the 3D world the torus can be grabbed and turned, then springs back onto
 * its auto-rotation. Mouse, pen and a sideways touch; a vertical touch still
 * scrolls the page. Decorative like the canvas, so not keyboard reachable.
 */
@Component({
  selector: 'app-point-cloud',
  template: `<div #box class="stage__box"><canvas #canvas aria-hidden="true"></canvas></div>`,
  styles: `
    :host {
      position: relative;
      display: block;
      aspect-ratio: 1;
      max-width: 100%;
      /* 30rem: a tablet's tall screen gave the stage two-thirds of the fold. */
      max-height: min(56svh, 30rem);
      z-index: 20;
    }
    .stage__box {
      position: absolute;
      inset: 0;
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    :host([data-grab]) canvas {
      cursor: grab;
      touch-action: pan-y pinch-zoom;
      user-select: none;
    }
    :host([data-grab='held']) canvas {
      cursor: grabbing;
    }
    /* The text column sets the row's height and the stage spans it, so the
       two end together; the box holding the canvas stays in view meanwhile.
       The box itself is the same size in both worlds, whatever their text:
       sized on the text, it was 551px in one and 604px in the other, and the
       cloud shifted as the sweep morphed one box into the other (Stéphane,
       2026-11-15). */
    @media (min-width: 900px) {
      :host {
        --box: min(560px, calc(100svh - 120px));
        align-self: stretch;
        aspect-ratio: auto;
        max-height: none;
        min-height: var(--box);
      }
      .stage__box {
        position: sticky;
        inset: auto;
        top: 96px;
        height: var(--box);
      }
    }
  `,
  host: {
    class: 'stage',
    '[attr.data-grab]': "world() === 'cgi' ? (grabbing() ? 'held' : 'free') : null",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointCloudComponent {
  readonly world = input.required<WorldKey>();
  protected readonly grabbing = signal(false);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly document = inject(DOCUMENT);
  private readonly state = inject(CloudStore);
  private readonly frames = inject(FrameLoopService);
  private readonly motion = inject(ReducedMotionService);
  private readonly startup = inject(StartupService);
  private wake: () => void = () => undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => this.state.enter(this.world()));
    effect(() => {
      this.motion.reduced();
      untracked(() => this.wake());
    });

    afterNextRender(() => {
      const view = this.document.defaultView;
      const canvas = this.canvas().nativeElement;
      const surface = canvas.getContext('2d');
      if (!view || !surface) return;
      const model = this.state.model;
      // The box, not the host: the host spans the text column's height.
      const stage = this.box().nativeElement;
      this.state.stage = stage;

      let width = 0;
      let height = 0;
      let dpr = 1;
      let mouse: { clientX: number; clientY: number } | null = null;
      let field: { x: number; y: number } | null = null;
      let visible = true;
      let stop: (() => void) | null = null;
      // Under reduced motion the shape is drawn once, then again only when the
      // canvas is resized, comes back into view or is turned by hand. Between
      // those the loop is let go: an idle subscription still costs a frame.
      let drawnStill = false;
      let alive = true;

      const fit = () => {
        dpr = Math.min(2, view.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        drawnStill = false;
        this.wake();
      };
      const place = () => {
        if (!mouse) return;
        const rect = canvas.getBoundingClientRect();
        field = { x: mouse.clientX - rect.left, y: mouse.clientY - rect.top };
      };
      const sleep = () => {
        stop?.();
        stop = null;
      };
      const draw = (delta: number) => {
        const still = this.motion.reduced();
        if (visible && !(still && drawnStill)) {
          model.frame(
            surface,
            delta,
            { width, height, dpr, pointer: this.state.pointer, field },
            still,
          );
          drawnStill = still;
        }
        if (!visible || still) sleep();
      };

      const onMove = (event: PointerEvent) => {
        this.state.pointer = [
          event.clientX / view.innerWidth - 0.5,
          event.clientY / view.innerHeight - 0.5,
        ];
        if (event.pointerType !== 'mouse') return;
        mouse = { clientX: event.clientX, clientY: event.clientY };
        place();
      };
      let grip: { id: number; x: number; y: number } | null = null;
      // A touch is only taken once it heads sideways: until then it may be
      // the start of a vertical scroll the browser has not claimed yet.
      let touch: { id: number; x: number; y: number } | null = null;
      const take = (event: PointerEvent) => {
        grip = { id: event.pointerId, x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
        model.grab();
        this.grabbing.set(true);
      };
      const onGrab = (event: PointerEvent) => {
        if (this.world() !== 'cgi' || grip || touch || !event.isPrimary) return;
        if (event.pointerType === 'touch') {
          touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
          return;
        }
        if (event.button !== 0) return;
        // No text selection and no native drag starting under the hand.
        event.preventDefault();
        take(event);
      };
      const onDrag = (event: PointerEvent) => {
        if (touch && event.pointerId === touch.id) {
          const dx = Math.abs(event.clientX - touch.x);
          const dy = Math.abs(event.clientY - touch.y);
          if (Math.max(dx, dy) < TOUCH_SLOP) return;
          touch = null;
          if (dx > dy) take(event);
          return;
        }
        if (!grip || event.pointerId !== grip.id) return;
        // A lost pointerup (a ctrl-click's context menu) shows as a move with no button down.
        if (event.pointerType !== 'touch' && (event.buttons & 1) === 0) {
          letGo();
          return;
        }
        // A full stage width is half a turn.
        const perPixel = Math.PI / (width || 1);
        model.turn(-(event.clientX - grip.x) * perPixel, (event.clientY - grip.y) * perPixel);
        grip.x = event.clientX;
        grip.y = event.clientY;
        drawnStill = false;
        this.wake();
      };
      const letGo = () => {
        touch = null;
        if (!grip) return;
        const id = grip.id;
        grip = null;
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
        model.release();
        this.grabbing.set(false);
        drawnStill = false;
        this.wake();
      };
      const onLeave = () => {
        mouse = null;
        field = null;
      };
      const onBlur = () => {
        onLeave();
        letGo();
      };
      const onScroll = () => place();
      view.addEventListener('pointermove', onMove, { passive: true });
      view.addEventListener('scroll', onScroll, { passive: true });
      view.addEventListener('blur', onBlur);
      canvas.addEventListener('pointerdown', onGrab);
      canvas.addEventListener('pointermove', onDrag);
      canvas.addEventListener('pointerup', letGo);
      canvas.addEventListener('pointercancel', letGo);
      canvas.addEventListener('lostpointercapture', letGo);
      canvas.addEventListener('contextmenu', letGo);
      this.document.documentElement.addEventListener('pointerleave', onLeave);

      const resize =
        typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(fit) : null;
      resize?.observe(canvas);
      const seen =
        typeof view.IntersectionObserver === 'function'
          ? new view.IntersectionObserver(([entry]) => {
              visible = entry.isIntersecting;
              drawnStill = false;
              this.wake();
            })
          : null;
      seen?.observe(canvas);
      fit();

      const start = () => {
        if (!alive) return;
        if (!model.ready) {
          model.init(sampleGlyph(this.document), GLYPH_W, GLYPH_H, this.world());
          if (this.document.documentElement.classList.contains('lang-switched')) {
            model.skipAssembly();
          }
        }
        this.wake = () => {
          if (alive && visible && !stop) stop = this.frames.add((_time, delta) => draw(delta));
        };
        this.wake();
      };
      // The glyph is sampled from the real face, so it waits for it; a page
      // whose font never arrives still gets its cloud, sampled from the fallback.
      // The assembly is the hero's entrance: it waits for the startup loader
      // to uncover the page instead of playing beneath it.
      const fonts = this.document.fonts;
      const release = () => this.startup.afterEntranceRelease(start);
      if (model.ready || !fonts) release();
      else fonts.load(GLYPH_FONT).then(release, release);

      destroyRef.onDestroy(() => {
        alive = false;
        letGo();
        sleep();
        resize?.disconnect();
        seen?.disconnect();
        view.removeEventListener('pointermove', onMove);
        view.removeEventListener('scroll', onScroll);
        view.removeEventListener('blur', onBlur);
        this.document.documentElement.removeEventListener('pointerleave', onLeave);
        if (this.state.stage === stage) this.state.stage = null;
      });
    });
  }
}
