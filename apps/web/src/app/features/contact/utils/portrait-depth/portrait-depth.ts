/** The plate eases slower than the figure: the lag between them reads as depth. */
export const PLATE_TAU = 240;
export const FIGURE_TAU = 120;

/** Travel in px at full reach; the plate counter-moves. */
export const PLATE_TRAVEL = { x: -26, y: -16 } as const;
export const FIGURE_TRAVEL = { x: 10, y: 6 } as const;

export interface Offset {
  readonly x: number;
  readonly y: number;
}

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * The pointer measured against the portrait, not the viewport: ±1 at its
 * edges, full strength within 1.6 half-sizes of its centre, gone at 3.
 */
export function depthTarget(x: number, y: number, box: Box): Offset {
  const nx = (x - box.left - box.width / 2) / (box.width / 2);
  const ny = (y - box.top - box.height / 2) / (box.height / 2);
  const reach = Math.min(1, Math.max(0, (3 - Math.hypot(nx, ny)) / 1.4));
  return { x: clamp(nx) * reach, y: clamp(ny) * reach };
}

/** Exponential, so 60 Hz and 120 Hz screens move alike. */
export function approach(current: number, target: number, dt: number, tau: number): number {
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

export function translateOf(offset: Offset, travel: Offset): string {
  return `translate(${(offset.x * travel.x).toFixed(2)}px, ${(offset.y * travel.y).toFixed(2)}px)`;
}
