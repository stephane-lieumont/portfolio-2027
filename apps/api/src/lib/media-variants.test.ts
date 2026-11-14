import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import sharp from 'sharp';

import { VARIANT_WIDTHS, buildVariants, isVariantSource, variantKey } from './media-variants.ts';

describe('media variants', () => {
  it('names each variant after the original, as the web app expects', () => {
    assert.equal(variantKey('cgi/escart-wild.jpg', 640), 'cgi/escart-wild-640.webp');
    assert.equal(variantKey('projects/kasa.png', 1280), 'projects/kasa-1280.webp');
  });

  it('derives only from originals, never from a variant', () => {
    assert.equal(isVariantSource('cgi/escart-wild.jpg'), true);
    assert.equal(isVariantSource('cgi/escart-wild-640.webp'), false);
    assert.equal(isVariantSource('cv.pdf'), false);
  });

  it('produces every width as WebP, without upscaling a smaller source', async () => {
    const source = await sharp({
      create: { width: 1200, height: 675, channels: 3, background: '#f2a154' },
    })
      .jpeg()
      .toBuffer();

    const variants = await buildVariants('cgi/test.jpg', source);

    assert.deepEqual(
      variants.map((v) => v.key),
      VARIANT_WIDTHS.map((w) => `cgi/test-${w}.webp`),
    );
    const widths = await Promise.all(
      variants.map(async (v) => (await sharp(v.body).metadata()).width),
    );
    assert.deepEqual(widths, [640, 960, 1200]);
    const formats = await Promise.all(
      variants.map(async (v) => (await sharp(v.body).metadata()).format),
    );
    assert.deepEqual(formats, ['webp', 'webp', 'webp']);
  });
});
