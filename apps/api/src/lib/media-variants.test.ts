import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import sharp from 'sharp';

import {
  buildVariants,
  honestWidths,
  isVariantSource,
  variantKey,
  variantWidths,
} from './media-variants.ts';

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

  it('never upscales, and names every file after its real width', () => {
    assert.deepEqual(variantWidths(1280), [640, 960, 1280]);
    assert.deepEqual(variantWidths(1200), [640, 960, 1200]);
    assert.deepEqual(variantWidths(400), [400]);
    assert.deepEqual(variantWidths(3000), [640, 960, 1280, 1920, 2560]);
    assert.deepEqual(variantWidths(2560), [640, 960, 1280, 1920, 2560]);
    assert.deepEqual(honestWidths(500, [720, 1080, 1440]), [500]);
    assert.deepEqual(honestWidths(783, [240, 480]), [240, 480]);
  });

  it('produces every width as WebP at the width its name says', async () => {
    const source = await sharp({
      create: { width: 1200, height: 675, channels: 3, background: '#f2a154' },
    })
      .jpeg()
      .toBuffer();

    const variants = await buildVariants('cgi/test.jpg', source);

    assert.deepEqual(
      variants.map((v) => v.key),
      ['cgi/test-640.webp', 'cgi/test-960.webp', 'cgi/test-1200.webp'],
    );
    const metadata = await Promise.all(variants.map((v) => sharp(v.body).metadata()));
    assert.deepEqual(
      metadata.map((m) => m.width),
      [640, 960, 1200],
    );
    assert.deepEqual(
      metadata.map((m) => m.format),
      ['webp', 'webp', 'webp'],
    );
  });
});
