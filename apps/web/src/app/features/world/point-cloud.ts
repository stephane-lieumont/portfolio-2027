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
  viewChild,
} from '@angular/core';
import type { WorldKey } from '@portfolio/shared-types';

import { FrameLoop } from '../../core/motion/frame-loop';
import { ReducedMotion } from '../../core/motion/reduced-motion';
import { CloudState } from '../../core/world/cloud-state';

const GLYPH_W = 240;
const GLYPH_H = 150;
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
 * The hero's stage. The shape and every point live in CloudState, so the page
 * of the other world picks the morph up where this one left it. Nothing is
 * drawn while prerendering; under reduced motion one still frame.
 *
 * In the 3D world the torus can be grabbed and turned, then springs back onto
 * its auto-rotation. Mouse, pen and a sideways touch; a vertical touch still
 * scrolls the page. Decorative like the canvas, so not keyboard reachable.
 */
@Component({
  selector: 'app-point-cloud',
  template: ` <canvas #canvas aria-hidden="true"></canvas> `,
  styles: `
    :host {
      position: relative;
      display: block;
      aspect-ratio: 1;
      max-width: 100%;
      max-height: 56svh;
      z-index: 20;
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
      touch-action: pan-y;
      user-select: none;
    }
    :host([data-grab='held']) canvas {
      cursor: grabbing;
    }
    @media (min-width: 900px) {
      :host {
        position: sticky;
        top: 96px;
        aspect-ratio: 4 / 5;
        max-height: calc(100svh - 120px);
      }
    }
  `,
  host: {
    class: 'stage',
    '[attr.data-grab]': "world() === 'cgi' ? (grabbing() ? 'held' : 'free') : null",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointCloud {
  readonly world = input.required<WorldKey>();
  protected readonly grabbing = signal(false);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly state = inject(CloudState);
  private readonly frames = inject(FrameLoop);
  private readonly motion = inject(ReducedMotion);

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => this.state.enter(this.world()));

    afterNextRender(() => {
      const view = this.document.defaultView;
      const canvas = this.canvas().nativeElement;
      const surface = canvas.getContext('2d');
      if (!view || !surface) return;
      const model = this.state.model;
      this.state.stage = this.host;

      let width = 0;
      let height = 0;
      let dpr = 1;
      let mouse: { clientX: number; clientY: number } | null = null;
      let field: { x: number; y: number } | null = null;
      let visible = true;
      let stop: (() => void) | null = null;
      // Under reduced motion the shape is drawn once, then again only when the
      // canvas is resized or comes back into view.
      let drawnStill = false;

      const fit = () => {
        dpr = Math.min(2, view.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        drawnStill = false;
      };
      const place = () => {
        if (!mouse) return;
        const rect = canvas.getBoundingClientRect();
        field = { x: mouse.clientX - rect.left, y: mouse.clientY - rect.top };
      };
      const draw = (delta: number) => {
        const still = this.motion.reduced();
        if (!visible || (still && drawnStill)) return;
        model.frame(
          surface,
          delta,
          { width, height, dpr, pointer: this.state.pointer, field },
          still,
        );
        drawnStill = still;
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
      const onGrab = (event: PointerEvent) => {
        if (this.world() !== 'cgi' || grip || !event.isPrimary) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        // No text selection and no native drag starting under the hand.
        event.preventDefault();
        grip = { id: event.pointerId, x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
        model.grab();
        this.grabbing.set(true);
      };
      const onDrag = (event: PointerEvent) => {
        if (!grip || event.pointerId !== grip.id) return;
        // A full stage width is half a turn.
        const perPixel = Math.PI / (width || 1);
        model.turn(-(event.clientX - grip.x) * perPixel, (event.clientY - grip.y) * perPixel);
        grip.x = event.clientX;
        grip.y = event.clientY;
        drawnStill = false;
      };
      const letGo = () => {
        if (!grip) return;
        const id = grip.id;
        grip = null;
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
        model.release();
        this.grabbing.set(false);
        drawnStill = false;
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
      this.document.documentElement.addEventListener('pointerleave', onLeave);

      const resize =
        typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(fit) : null;
      resize?.observe(canvas);
      const seen =
        typeof view.IntersectionObserver === 'function'
          ? new view.IntersectionObserver(([entry]) => {
              visible = entry.isIntersecting;
              drawnStill = false;
            })
          : null;
      seen?.observe(canvas);
      fit();

      let alive = true;
      const start = () => {
        if (!alive) return;
        if (!model.ready) {
          model.init(sampleGlyph(this.document), GLYPH_W, GLYPH_H, this.world());
        }
        stop = this.frames.add((_time, delta) => draw(delta));
      };
      // The glyph is sampled from the real face, so it waits for it; a page
      // whose font never arrives still gets its cloud, sampled from the fallback.
      const fonts = this.document.fonts;
      if (model.ready || !fonts) start();
      else fonts.load(GLYPH_FONT).then(start, start);

      destroyRef.onDestroy(() => {
        alive = false;
        letGo();
        stop?.();
        resize?.disconnect();
        seen?.disconnect();
        view.removeEventListener('pointermove', onMove);
        view.removeEventListener('scroll', onScroll);
        view.removeEventListener('blur', onBlur);
        this.document.documentElement.removeEventListener('pointerleave', onLeave);
        if (this.state.stage === this.host) this.state.stage = null;
      });
    });
  }
}
