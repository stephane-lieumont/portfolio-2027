/** The share of a 4:3 plate's width the widest logo may take. */
export const LOGO_MAX_WIDTH = 0.66;

/**
 * The bounding-box area every logo gets, as a share of a 4:3 plate's width
 * squared: a square mark and a long wordmark then weigh the same, where equal
 * heights would make the wordmark shout and equal widths the mark vanish
 * (design-expert specs, 2026-11-15; raised in the second).
 */
const LOGO_AREA = 0.075;

/**
 * A logo's width as a share of its plate's 4:3 width, from its intrinsic
 * proportions: immobilier.ch 0.66, Linxea 0.59, Ledger 0.47, CIR 0.38,
 * Web-Atrio 0.30.
 */
export function logoWidth({ width, height }: { width: number; height: number }): number {
  return Math.min(LOGO_MAX_WIDTH, Math.sqrt((LOGO_AREA * width) / height));
}
