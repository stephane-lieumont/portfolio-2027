/** The share of a 4:3 plate's width the widest logo may take. */
export const LOGO_MAX_WIDTH = 0.62;

/**
 * The bounding-box area every logo gets, as a share of a 4:3 plate's width
 * squared: a square mark and a long wordmark then weigh the same, where equal
 * heights would make the wordmark shout and equal widths the mark vanish
 * (design-expert spec, 2026-11-15).
 */
const LOGO_AREA = 0.0541;

/**
 * A logo's width as a share of its plate's 4:3 width, from its intrinsic
 * proportions: immobilier.ch 0.62, Linxea 0.50, Ledger 0.40, CIR 0.32,
 * Web-Atrio 0.26.
 */
export function logoWidth({ width, height }: { width: number; height: number }): number {
  return Math.min(LOGO_MAX_WIDTH, Math.sqrt((LOGO_AREA * width) / height));
}
