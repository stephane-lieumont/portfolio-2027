import sharp from 'sharp';

/**
 * Responsive variants of a render or a cover (ADR-0012). The web app builds
 * `srcset` from the same widths and the same naming, so the two must not drift:
 * `cgi/escart-wild.jpg` (1280px) → `cgi/escart-wild-640.webp`, `-960.webp`,
 * `-1280.webp`. The original stays as the `src` fallback.
 */
export const VARIANT_WIDTHS = [640, 960, 1280, 1920, 2560] as const;

/**
 * Each wanted width below the source's, then the source's own if it falls
 * short of the largest: never an upscale, and every file named after its real
 * width (a 400px capture has `-400.webp` only).
 */
export function honestWidths(sourceWidth: number, wanted: readonly number[]): number[] {
  const below = wanted.filter((width) => width < sourceWidth);
  return below.length === wanted.length ? below : [...below, sourceWidth];
}

export function variantWidths(sourceWidth: number): number[] {
  return honestWidths(sourceWidth, VARIANT_WIDTHS);
}

export function variantKey(key: string, width: number): string {
  const dot = key.lastIndexOf('.');
  const stem = dot === -1 ? key : key.slice(0, dot);
  return `${stem}-${width}.webp`;
}

/** Only originals get variants; a variant is never a source for another one. */
export function isVariantSource(key: string): boolean {
  return /\.(jpe?g|png)$/i.test(key) && !/-\d+\.webp$/i.test(key);
}

export interface Variant {
  readonly key: string;
  readonly width: number;
  readonly body: Buffer;
}

/** Quality 78 is where the renders stop showing banding on their gradients in WebP. */
export async function buildVariants(key: string, source: Buffer): Promise<Variant[]> {
  const { width: sourceWidth = 0 } = await sharp(source).metadata();
  return Promise.all(
    variantWidths(sourceWidth).map(async (width) => ({
      key: variantKey(key, width),
      width,
      body: await sharp(source).resize({ width }).webp({ quality: 78 }).toBuffer(),
    })),
  );
}
