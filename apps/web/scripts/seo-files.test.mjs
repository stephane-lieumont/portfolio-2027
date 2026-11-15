import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sitemapEntry, sitemapXml } from './seo-files.mjs';

const head = (inner) => `<!doctype html><html><head>${inner}</head><body></body></html>`;
const CANONICAL = '<link rel="canonical" href="https://stephane-lieumont.fr/en/contact">';
const ALTERNATES =
  '<link rel="alternate" hreflang="fr" href="https://stephane-lieumont.fr/contact">' +
  '<link rel="alternate" hreflang="en" href="https://stephane-lieumont.fr/en/contact">';

describe('a sitemap entry', () => {
  it('is the page’s canonical with the alternates the page declares', () => {
    assert.deepEqual(sitemapEntry(head(`${CANONICAL}${ALTERNATES}`)), {
      loc: 'https://stephane-lieumont.fr/en/contact',
      alternates: [
        { hreflang: 'fr', href: 'https://stephane-lieumont.fr/contact' },
        { hreflang: 'en', href: 'https://stephane-lieumont.fr/en/contact' },
      ],
    });
  });

  it('is none for a page that names no canonical, like a redirect', () => {
    assert.equal(
      sitemapEntry(head('<meta http-equiv="refresh" content="0; url=/developpeur">')),
      null,
    );
  });

  // A canonical left on the 404 by mistake must still not list it.
  it('is none for a noindex page, canonical or not', () => {
    assert.equal(sitemapEntry(head(`${CANONICAL}<meta name="robots" content="noindex">`)), null);
  });
});

describe('the sitemap file', () => {
  it('escapes what XML reserves in an address', () => {
    const xml = sitemapXml([{ loc: 'https://x.fr/a?b=1&c=2', alternates: [] }], '2026-11-15');
    assert.ok(xml.includes('<loc>https://x.fr/a?b=1&amp;c=2</loc>'));
  });
});
