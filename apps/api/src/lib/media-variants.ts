import sharp from 'sharp';

/**
 * Responsive variants of a render or a cover (ADR-0012). The web app builds
 * `srcset` from the same widths and the same naming, so the two must not drift:
 * `cgi/escart-wild.jpg` → `cgi/escart-wild-640.webp`, `-960.webp`, `-1280.webp`.
 * The original stays as the `src` fallback.
 */
export const VARIANT_WIDTHS = [640, 960, 1280] as const;

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

/**
 * Never upscales: a 1200px source yields a 1200px file under the 1280 name, so
 * every srcset candidate the web app emits exists. Quality 78 is where the
 * renders stop showing banding on their gradients in WebP.
 */
export async function buildVariants(key: string, source: Buffer): Promise<Variant[]> {
  const { width: sourceWidth = 0 } = await sharp(source).metadata();
  return Promise.all(
    VARIANT_WIDTHS.map(async (width) => ({
      key: variantKey(key, width),
      width: Math.min(width, sourceWidth),
      body: await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer(),
    })),
  );
}
