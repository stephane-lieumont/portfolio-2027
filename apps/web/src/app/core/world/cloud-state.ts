import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { WorldKey } from '@portfolio/shared-types';

/** Points in the cloud. The torus grid is 60 × 20, so this must stay a multiple of 60. */
export const CLOUD_POINTS = 1200;

const ASSEMBLE_OMEGA = 6;
const ASSEMBLE_SPAN = 2.4;
const SWEEP_EVERY = 7;
const SWEEP_FOR = 1.2;
const SWEEP_WIDTH = 0.1;
const FIELD_RADIUS = 0.45;
const FIELD_PUSH = 0.2;
const MORPH_MS = 1500;
const SPIN = 0.45;
const PITCH = 1.05;
const PITCH_SWAY = 0.15;
const PITCH_SWAY_RATE = 0.3;
/** Face-on to edge-on: a held torus never turns past either. */
const PITCH_MIN = 0;
const PITCH_MAX = Math.PI / 2;
/** The return's critically damped spring: within 1% of the live pose in ~1s. */
const RETURN_OMEGA = 6.5;
/** How fast a release may head back toward the live pose: overshoot stays under 2°. */
const RETURN_FLING = 0.5;
const FLING_MAX = 3;
/**
 * The torus's farthest projected point, in units of its scale, over every
 * rotation and tilt it takes: R 1 + r 0.42, magnified by the perspective
 * (computed numerically: 1.584).
 */
const TORUS_EXTENT = 1.584;
/** Room kept between the torus and the canvas edge. */
const TORUS_MARGIN = 0.94;
const ACCENT = '#f2a154';
const INK: Readonly<Record<WorldKey, readonly [number, number, number]>> = {
  dev: [0xf3, 0xee, 0xe8],
  cgi: [0x12, 0x10, 0x0f],
};

export type CloudSurface = Pick<
  CanvasRenderingContext2D,
  'setTransform' | 'clearRect' | 'fillRect' | 'fillStyle' | 'globalAlpha'
>;

export interface CloudView {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  /** Pointer position over the viewport, each axis in [-0.5, 0.5], tilting the glyph. */
  readonly pointer: readonly [number, number];
  /** The mouse over the canvas in CSS pixels, or null when it is not a mouse or it left. */
  readonly field: { readonly x: number; readonly y: number } | null;
}

/** The torus's rotation: `yaw` about the vertical axis, `pitch` toward the viewer. */
export interface CloudPose {
  readonly yaw: number;
  readonly pitch: number;
}

const ease = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

function buildTorus(random: () => number): [number, number, number][] {
  const R = 1;
  const r = 0.42;
  const U = 60;
  const V = CLOUD_POINTS / U;
  const points: [number, number, number][] = [];
  for (let u = 0; u < U; u++) {
    for (let v = 0; v < V; v++) {
      const a = (u / U) * Math.PI * 2;
      const b = (v / V) * Math.PI * 2;
      points.push([
        (R + r * Math.cos(b)) * Math.cos(a),
        (R + r * Math.cos(b)) * Math.sin(a),
        r * Math.sin(b),
      ]);
    }
  }
  // Shuffled, so neighbouring glyph points fly to scattered places on the volume.
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return points;
}

/**
 * The hero's point cloud, from the approved mockup: `</>` sampled flat on a
 * plane, morphing into a rotating torus as the world turns to 3D. Each point
 * keeps its identity across the morph and leaves in the order the diagonal
 * reaches it. Pure state and arithmetic; the canvas belongs to the component.
 */
export class CloudModel {
  /** Morph progress, 0 = the glyph, 1 = the torus. */
  t = 0;
  target = 0;
  clock = 0;
  private assembleAt = 0;
  private sweepAt = 0;

  private flat: [number, number][] = [];
  private torus: [number, number, number][] = [];
  private delay = new Float32Array(CLOUD_POINTS);
  private readonly ox = new Float32Array(CLOUD_POINTS);
  private readonly oy = new Float32Array(CLOUD_POINTS);
  private readonly oz = new Float32Array(CLOUD_POINTS);
  private readonly adel = new Float32Array(CLOUD_POINTS);
  private readonly dx = new Float32Array(CLOUD_POINTS);
  private readonly dy = new Float32Array(CLOUD_POINTS);
  private readonly vx = new Float32Array(CLOUD_POINTS);
  private readonly vy = new Float32Array(CLOUD_POINTS);
  private readonly heat = new Float32Array(CLOUD_POINTS);
  private readonly glow = new Float32Array(CLOUD_POINTS);
  private readonly sx = new Float32Array(CLOUD_POINTS);
  private readonly sy = new Float32Array(CLOUD_POINTS);
  private readonly sz = new Float32Array(CLOUD_POINTS);
  /** Where the torus was drawn last frame. */
  pose: CloudPose = { yaw: 0, pitch: PITCH };
  /** The pose a hand holds the torus at, or null when it is free. */
  private held: { yaw: number; pitch: number } | null = null;
  private heldBefore: CloudPose = this.pose;
  private heldVelocity = { yaw: 0, pitch: 0 };
  /** The held or released torus's offset from the auto-rotation, and its speed. */
  private offset = { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0 };
  private inkAt = Number.NaN;
  private inkStyle = '';

  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  get ready(): boolean {
    return this.flat.length > 0;
  }

  /**
   * Seeds the shapes once, from the glyph's sampled points (pixel hits on a
   * `width × height` raster), and plays the assembly. The morph starts in the
   * world the page was loaded in, already complete.
   */
  init(
    hits: readonly (readonly [number, number])[],
    width: number,
    height: number,
    world: WorldKey,
  ): void {
    const random = this.random;
    const source = hits.length
      ? hits
      : Array.from({ length: 200 }, () => [random() * width, random() * height] as const);
    this.flat = Array.from({ length: CLOUD_POINTS }, (_, i) => {
      const [x, y] = source[Math.floor((i / CLOUD_POINTS) * source.length)];
      return [((x + random() * 2) / width - 0.5) * 2.2, ((y + random() * 2) / height - 0.5) * 1.4];
    });
    this.torus = buildTorus(random);
    this.delay = Float32Array.from(
      this.flat,
      ([x, y]) => (1 - (x / 2.2 + 0.5)) * 0.55 + (y / 1.4 + 0.5) * 0.15,
    );
    this.t = this.target = world === 'cgi' ? 1 : 0;
    for (let i = 0; i < CLOUD_POINTS; i++) {
      const a = random() * Math.PI * 2;
      const r = 0.6 + random();
      this.ox[i] = Math.cos(a) * r;
      this.oy[i] = Math.sin(a) * r * 0.7;
      this.oz[i] = 1.2 + random() * 2;
      // Left to right, the order the glyph is typed.
      this.adel[i] = (this.flat[i][0] / 2.2 + 0.5) * 0.45 + random() * 0.12;
    }
    this.assembleAt = this.clock + 0.15;
    this.sweepAt = this.assembleAt + 1.5;
  }

  /** Heads for a world's shape; the morph continues from wherever it stands. */
  aim(world: WorldKey): void {
    this.target = world === 'cgi' ? 1 : 0;
  }

  /** Stands in a world's shape at once, with no morph. */
  snap(world: WorldKey): void {
    this.t = this.target = world === 'cgi' ? 1 : 0;
  }

  get grabbed(): boolean {
    return this.held !== null;
  }

  /** A hand takes the torus where it stands; the auto-rotation clock runs on underneath. */
  grab(): void {
    this.held = { ...this.pose };
    this.heldBefore = this.pose;
    this.heldVelocity = { yaw: 0, pitch: 0 };
  }

  /** Turns the held torus by these angles, in radians. */
  turn(yaw: number, pitch: number): void {
    if (!this.held) return;
    this.held.yaw += yaw;
    this.held.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, this.held.pitch + pitch));
  }

  /** Lets go: the torus springs back onto the live auto-rotation, keeping the hand's speed. */
  release(): void {
    if (!this.held) return;
    this.held = null;
    const o = this.offset;
    // Unwind the shorter way: whole turns are exact at any morph stage. Fully
    // a torus, half a turn is too (its points are a 60 × 20 grid, symmetric
    // both ways); mid-morph each point is paired with a glyph point, so not.
    const period = this.t === 1 ? Math.PI : 2 * Math.PI;
    o.yaw -= period * Math.round(o.yaw / period);
    const autoPitchSpeed = Math.cos(this.clock * PITCH_SWAY_RATE) * PITCH_SWAY * PITCH_SWAY_RATE;
    o.vYaw = settleSpeed(o.yaw, this.heldVelocity.yaw - SPIN);
    o.vPitch = settleSpeed(o.pitch, this.heldVelocity.pitch - autoPitchSpeed);
  }

  /** Advances by `delta` ms and draws. `still` draws the settled shape, for reduced motion. */
  frame(surface: CloudSurface, delta: number, view: CloudView, still: boolean): void {
    if (!this.ready || !view.width) return;
    const N = CLOUD_POINTS;
    const { width: W, height: H, pointer } = view;
    if (!still) this.clock += delta / 1000;
    else this.assembleAt = this.clock - ASSEMBLE_SPAN;

    const dir = Math.sign(this.target - this.t);
    if (dir !== 0) {
      this.t = still ? this.target : Math.min(1, Math.max(0, this.t + dir * (delta / MORPH_MS)));
    }

    surface.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    surface.clearRect(0, 0, W, H);
    const scale = Math.min(W, H) * 0.34;
    const cx = W / 2;
    const cy = H * 0.46;
    // The mockup scaled both shapes alike, and the torus overflowed its canvas
    // (±310px in a 575px stage at 1440): it gets its own scale, fitted inside.
    const torusScale = Math.min(scale, (TORUS_MARGIN * Math.min(cx, cy, H - cy)) / TORUS_EXTENT);
    const clock = this.clock;
    const autoYaw = clock * SPIN;
    const autoPitch = PITCH + Math.sin(clock * PITCH_SWAY_RATE) * PITCH_SWAY;
    this.follow(autoYaw, autoPitch, delta, still);
    const ay = autoYaw + this.offset.yaw;
    const ax = autoPitch + this.offset.pitch;
    this.pose = { yaw: ay, pitch: ax };
    const cyA = Math.cos(ay);
    const syA = Math.sin(ay);
    const cxA = Math.cos(ax);
    const sxA = Math.sin(ax);
    const tiltY = pointer[0] * 0.35;
    const tiltX = pointer[1] * 0.25;

    const inkT = ease(this.t);
    if (inkT !== this.inkAt) {
      this.inkAt = inkT;
      const [r0, g0, b0] = INK.dev;
      const [r1, g1, b1] = INK.cgi;
      this.inkStyle = `rgb(${Math.round(mix(r0, r1, inkT))},${Math.round(mix(g0, g1, inkT))},${Math.round(mix(b0, b1, inkT))})`;
    }

    const sinceAssemble = clock - this.assembleAt;
    const assembling = sinceAssemble < ASSEMBLE_SPAN;

    if (clock - this.sweepAt >= SWEEP_EVERY) {
      this.sweepAt += SWEEP_EVERY * Math.floor((clock - this.sweepAt) / SWEEP_EVERY);
    }
    const u = (clock - this.sweepAt) / SWEEP_FOR;
    const beamOn = !still && u >= 0 && u < 1;
    // Sine in-out over a range wider than the glyph: the beam accelerates
    // off-glyph and crosses the letters at near constant speed.
    const beam = -1.6 + 1.6 * (1 - Math.cos(Math.PI * u));
    const cool = Math.exp(-delta / 160);

    // Capped so the springs stay stable through a dropped frame.
    const h = Math.min(0.033, delta / 1000);
    // The field answers the glyph only: in the 3D world the hand grabs instead.
    const fieldOn = view.field !== null && !still && this.t < 1 && this.target === 0;
    const gx = ((view.field?.x ?? 0) - cx) / scale;
    const gy = ((view.field?.y ?? 0) - cy) / scale;
    const { dx, dy, vx, vy, heat } = this;

    surface.fillStyle = this.inkStyle;
    for (let i = 0; i < N; i++) {
      const local = Math.min(1, Math.max(0, this.t * 1.7 - this.delay[i]));
      const k = ease(local);
      const [fx0, fy0] = this.flat[i];

      let arrived = 1;
      if (assembling) {
        const s = Math.max(0, sinceAssemble - this.adel[i]) * ASSEMBLE_OMEGA;
        arrived = 1 - (1 + s) * Math.exp(-s);
      }
      const away = 1 - arrived;

      if (still) {
        dx[i] = dy[i] = vx[i] = vy[i] = heat[i] = 0;
      } else {
        let tx = 0;
        let ty = 0;
        if (fieldOn) {
          const ex = fx0 - gx;
          const ey = fy0 - gy;
          const d = Math.sqrt(ex * ex + ey * ey);
          if (d < FIELD_RADIUS && d > 1e-4) {
            const f = 1 - d / FIELD_RADIUS;
            const m = (FIELD_PUSH * f * f) / d;
            tx = ex * m;
            ty = ey * m;
          }
        }
        // The push answers fast and nearly flat; the release is softer and
        // settles with one small overshoot.
        const pushing = tx * tx + ty * ty > dx[i] * dx[i] + dy[i] * dy[i];
        const stiff = pushing ? 320 : 70;
        const damp = pushing ? 26.8 : 10;
        vx[i] += ((tx - dx[i]) * stiff - vx[i] * damp) * h;
        vy[i] += ((ty - dy[i]) * stiff - vy[i] * damp) * h;
        dx[i] += vx[i] * h;
        dy[i] += vy[i] * h;

        heat[i] *= cool;
        if (beamOn) {
          const b = (fx0 - beam) / SWEEP_WIDTH;
          const g = Math.exp(-b * b);
          if (g > heat[i]) heat[i] = g;
        }
      }

      const pushed = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]);
      const wob = still ? 0 : Math.sin(clock * 1.4 - fx0 * 2.6) * 0.012;
      const fx = fx0 + dx[i] + this.ox[i] * away;
      const fy = fy0 + wob + dy[i] + this.oy[i] * away;
      const fz = fx0 * tiltY + fy0 * tiltX + this.oz[i] * away - pushed * 1.5 - heat[i] * 0.06;

      const [x, y, z] = this.torus[i];
      const x1 = x * cyA + z * syA;
      const z1 = -x * syA + z * cyA;
      const y2 = y * cxA - z1 * sxA;
      const z2 = y * sxA + z1 * cxA;

      // Mid-flight lift: points arc toward the viewer instead of sliding flat.
      const lift = Math.sin(k * Math.PI) * 0.6;
      const X = mix(fx * scale, x1 * torusScale, k);
      const Y = mix(fy * scale, y2 * torusScale, k);
      const Z = mix(fz, z2, k) - lift;
      const p = 3.2 / (3.2 + Z);
      const sx = cx + X * p;
      const sy = cy + Y * p;
      const depth = Math.min(1, Math.max(0, (1.4 - Z) / 2.8));
      const size = (0.9 + depth * 1.5) * p;
      surface.globalAlpha = (0.35 + depth * 0.65) * mix(arrived, 1, k);
      surface.fillRect(sx - size / 2, sy - size / 2, size, size);

      this.sx[i] = sx - size / 2;
      this.sy[i] = sy - size / 2;
      this.sz[i] = size;
      this.glow[i] = heat[i] * (1 - k) * 0.9;
    }

    if (!still) {
      surface.fillStyle = ACCENT;
      for (let i = 0; i < N; i++) {
        if (this.glow[i] < 0.02) continue;
        surface.globalAlpha = this.glow[i];
        surface.fillRect(this.sx[i], this.sy[i], this.sz[i], this.sz[i]);
      }
    }
    surface.globalAlpha = 1;
  }

  private follow(autoYaw: number, autoPitch: number, delta: number, still: boolean): void {
    const o = this.offset;
    const held = this.held;
    if (held) {
      if (delta > 0 && !still) {
        const s = delta / 1000;
        const v = this.heldVelocity;
        v.yaw = mix(v.yaw, (held.yaw - this.heldBefore.yaw) / s, 0.5);
        v.pitch = mix(v.pitch, (held.pitch - this.heldBefore.pitch) / s, 0.5);
      }
      this.heldBefore = { ...held };
      o.yaw = held.yaw - autoYaw;
      o.pitch = held.pitch - autoPitch;
      return;
    }
    // Reduced motion: no return animation, the still pose at once.
    if (still) {
      o.yaw = o.pitch = o.vYaw = o.vPitch = 0;
      return;
    }
    const s = delta / 1000;
    [o.yaw, o.vYaw] = spring(o.yaw, o.vYaw, s);
    [o.pitch, o.vPitch] = spring(o.pitch, o.vPitch, s);
  }
}

/** One step of a critically damped spring toward 0, solved exactly so any frame length is stable. */
function spring(x: number, v: number, s: number): [number, number] {
  if (Math.abs(x) < 1e-4 && Math.abs(v) < 1e-3) return [0, 0];
  const c = v + RETURN_OMEGA * x;
  const decay = Math.exp(-RETURN_OMEGA * s);
  return [(x + c * s) * decay, (v - RETURN_OMEGA * c * s) * decay];
}

/** The release speed, capped so a fling toward the live pose barely overshoots it. */
function settleSpeed(offset: number, speed: number): number {
  const capped = Math.min(FLING_MAX, Math.max(-FLING_MAX, speed));
  const toward = -Math.sign(offset) * capped;
  const limit = RETURN_OMEGA * Math.abs(offset) + RETURN_FLING;
  return toward > limit ? -Math.sign(offset) * limit : capped;
}

/**
 * One cloud for the whole application (ADR-0014): each world is its own route,
 * so each page creates its own canvas, and on a direct switch between the two
 * worlds the morph continues from the shape the leaving page left.
 *
 * Only then. Arriving from a page without the cloud (contact, a project, the
 * 404) the cloud stands in its world's shape at once: the shape it held before
 * that page is history, not a starting point. The assembly plays once, on the
 * first world page of the visit.
 */
@Injectable({ providedIn: 'root' })
export class CloudState {
  readonly model = new CloudModel();
  /** The stage on screen, for the motes to fade around; null between pages. */
  stage: HTMLElement | null = null;
  /** Whether the page being shown took the cloud over from the page before it. */
  continuing = false;
  /**
   * The pointer over the viewport, each axis in [-0.5, 0.5], tilting the
   * glyph. Kept here and not in the page: a new page starting it at the centre
   * would snap the glyph mid-morph.
   */
  pointer: [number, number] = [0, 0];

  private shown = false;
  private handedOver = false;

  constructor() {
    // A navigation that ends with no world page on screen breaks the chain.
    inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationEnd && !this.shown) this.handedOver = false;
    });
  }

  /** A world page arrives; call while the router activates it. */
  arrive(): void {
    this.continuing = this.handedOver;
    this.shown = true;
  }

  /** A world page leaves. */
  leave(): void {
    this.shown = false;
    this.handedOver = true;
  }

  /** Points the cloud at the arriving page's world: a morph, or a snap. */
  enter(world: WorldKey): void {
    if (this.continuing || !this.model.ready) this.model.aim(world);
    else this.model.snap(world);
  }
}
