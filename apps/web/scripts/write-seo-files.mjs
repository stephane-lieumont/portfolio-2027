// Writes sitemap.xml and robots.txt at the root of the build, once for both
// trees: crawlers read them from the site's root only, so the English tree
// gets no copy of its own.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { robotsTxt, sitemapEntry, sitemapXml } from './seo-files.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'web');
const browser = join(dist, 'browser');

const { routes } = JSON.parse(await readFile(join(dist, 'prerendered-routes.json'), 'utf8'));

const entries = [];
for (const route of Object.keys(routes)) {
  const entry = sitemapEntry(await readFile(join(browser, route, 'index.html'), 'utf8'));
  if (entry) entries.push(entry);
}

const lastmod = new Date().toISOString().slice(0, 10);
await writeFile(join(browser, 'sitemap.xml'), sitemapXml(entries, lastmod));
await writeFile(join(browser, 'robots.txt'), robotsTxt());
console.log(`sitemap.xml: ${entries.length} pages, lastmod ${lastmod}; robots.txt`);
