// sitemap.xml and robots.txt, written from the pages the build prerendered.
// A page is listed when it says it is indexable: a canonical address and no
// noindex. Its alternates are the hreflang links it carries, so the sitemap
// can never disagree with the pages themselves.
import { JSDOM } from 'jsdom';

import { SITE_ORIGIN } from '../src/app/core/i18n/site-paths.ts';

export const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;

/** A page's sitemap entry, or null when it is not to be indexed. */
export function sitemapEntry(html) {
  const { head } = new JSDOM(html).window.document;
  const robots = head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  const loc = head.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (!loc || /noindex/i.test(robots)) return null;
  const alternates = Array.from(
    head.querySelectorAll('link[rel="alternate"][hreflang]'),
    (link) => ({ hreflang: link.getAttribute('hreflang'), href: link.getAttribute('href') }),
  );
  return { loc, alternates };
}

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The sitemap, its entries in address order; `lastmod` is the build's date. */
export function sitemapXml(entries, lastmod) {
  const urls = [...entries]
    .sort((a, b) => a.loc.localeCompare(b.loc))
    .map(({ loc, alternates }) =>
      [
        '  <url>',
        `    <loc>${escape(loc)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        ...alternates.map(
          ({ hreflang, href }) =>
            `    <xhtml:link rel="alternate" hreflang="${escape(hreflang)}" href="${escape(href)}"/>`,
        ),
        '  </url>',
      ].join('\n'),
    );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Everything may be crawled. Nothing is disallowed by path: a Disallow line
 * would publish the address of what it hides (the back office keeps itself
 * out of the index with noindex instead).
 */
export function robotsTxt() {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITEMAP_URL}`, ''].join('\n');
}
