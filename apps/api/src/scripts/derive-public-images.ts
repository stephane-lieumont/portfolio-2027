/**
 * WebP variants of the few images the web app ships from `public/` rather
 * than the bucket (the contact portrait, the one raster client logo), until
 * the media pipeline (ADR-0012) takes them over. Alpha is kept.
 *
 *   pnpm --filter @portfolio/api media:public
 *
 * Every file is named after its real width and never wider than its source:
 * the web app's srcset lists exactly what this writes.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { honestWidths } from '../lib/media-variants.ts';

const PUBLIC_DIR = fileURLToPath(new URL('../../../web/public/', import.meta.url));

const SOURCES: readonly { readonly file: string; readonly widths: readonly number[] }[] = [
  { file: 'images/portrait-stephane-pensif.png', widths: [720, 1080, 1440] },
  { file: 'logos/clients/cir-scancir.png', widths: [240, 480] },
];

async function main(): Promise<void> {
  for (const { file, widths } of SOURCES) {
    const source = `${PUBLIC_DIR}${file}`;
    const { width: sourceWidth = 0 } = await sharp(source).metadata();
    for (const width of honestWidths(sourceWidth, widths)) {
      const target = source.replace(/\.png$/, `-${width}.webp`);
      const body = await sharp(source)
        .resize({ width })
        .webp({ quality: 82, alphaQuality: 100 })
        .toBuffer();
      await writeFile(target, body);
      console.log(
        `${file.replace(/\.png$/, `-${width}.webp`)}  ${Math.round(body.length / 1024)} KB`,
      );
    }
  }
}

await main();
