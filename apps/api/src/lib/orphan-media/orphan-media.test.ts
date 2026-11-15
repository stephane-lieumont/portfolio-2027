import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { orphanKeys } from './orphan-media.ts';

describe('orphanKeys', () => {
  it('keeps a used original and its variants, and lists the rest', () => {
    const bucket = [
      'cgi/tomates.jpg',
      'cgi/tomates-640.webp',
      'cgi/tomates-1280.webp',
      'projects/kasa-openclassrooms.jpg',
      'projects/kasa-openclassrooms-960.webp',
      'projects/kasa-openclassrooms-presentation.jpg',
      'projects/kasa-openclassrooms-presentation-1100.webp',
    ];
    assert.deepEqual(orphanKeys(bucket, ['cgi/tomates.jpg']), [
      'projects/kasa-openclassrooms-960.webp',
      'projects/kasa-openclassrooms-presentation-1100.webp',
      'projects/kasa-openclassrooms-presentation.jpg',
      'projects/kasa-openclassrooms.jpg',
    ]);
  });

  it('does not take a used cover for the orphan presentation sharing its prefix', () => {
    const bucket = [
      'projects/a.jpg',
      'projects/a-presentation.jpg',
      'projects/a-presentation-640.webp',
    ];
    assert.deepEqual(orphanKeys(bucket, ['projects/a.jpg']), [
      'projects/a-presentation-640.webp',
      'projects/a-presentation.jpg',
    ]);
  });

  it('lists nothing when every object is used', () => {
    assert.deepEqual(orphanKeys(['cgi/a.jpg', 'cgi/a-640.webp'], ['cgi/a.jpg']), []);
  });
});
