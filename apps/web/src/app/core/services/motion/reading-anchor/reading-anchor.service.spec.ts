import { describe, expect, it } from 'vitest';

import { progressThrough, readingBlock, restoredScroll } from './reading-anchor.service';

describe('progressThrough', () => {
  it('says how far into the block the reading line sits', () => {
    // A 900px screen: the line is at 270px.
    expect(progressThrough(70, 400, 900)).toBe(0.5);
    expect(progressThrough(270, 400, 900)).toBe(0);
  });

  it('reads an empty block as its top', () => {
    expect(progressThrough(10, 0, 900)).toBe(0);
  });
});

describe('restoredScroll', () => {
  it('brings the line back to the same share of a block that changed height', () => {
    // Half-way through a section, then the section doubles and moves 500px down.
    const y = restoredScroll(3000, { top: 600, height: 800 }, 0.5, 390);
    // The line (117px) now falls on 600 + 400 = 1000px below the old offset.
    expect(y).toBe(3000 + 1000 - 117);
  });

  it('never asks for a negative offset', () => {
    expect(restoredScroll(10, { top: -500, height: 100 }, 0, 800)).toBe(0);
  });
});

describe('readingBlock', () => {
  function page(html: string, hitSelector: string | null): Document {
    const document = new DOMParser().parseFromString(html, 'text/html');
    document.elementFromPoint = () => (hitSelector ? document.querySelector(hitSelector) : null);
    return document;
  }

  it('climbs from the hit to the block it belongs to', () => {
    const document = page('<section><p>Texte <strong id="hit">lu</strong></p></section>', '#hit');
    expect(readingBlock(document, 400, 800)?.tagName).toBe('P');
  });

  it('ignores the fixed header and dock', () => {
    expect(
      readingBlock(page('<header class="top"><a id="hit">x</a></header>', '#hit'), 400, 800),
    ).toBeNull();
    expect(
      readingBlock(page('<nav class="dock"><a id="hit">x</a></nav>', '#hit'), 400, 800),
    ).toBeNull();
  });

  it('keeps the hit itself when it sits in no block', () => {
    const document = page('<div id="hit">x</div>', '#hit');
    expect(readingBlock(document, 400, 800)?.id).toBe('hit');
  });

  it('says nothing when the point hits nothing', () => {
    expect(readingBlock(page('<p>x</p>', null), 400, 800)).toBeNull();
  });
});
