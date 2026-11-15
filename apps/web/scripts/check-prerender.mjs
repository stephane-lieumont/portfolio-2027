// Fails the build unless every route of both trees was prerendered into a
// complete page, and the sitemap, robots.txt and share cards are right.
// Titles must differ within a tree.
// The rules live in prerender-checks.mjs, where they are tested.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { OG_IMAGE } from '../src/app/core/i18n/site-paths.ts';
import {
  EXPECTED,
  checkPage,
  checkRobots,
  checkShareCard,
  checkSitemap,
  titleOf,
} from './prerender-checks.mjs';

const browser = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'web', 'browser');

const failures = [];
const titles = new Map();

for (const route of EXPECTED.keys()) {
  const file = join(route, 'index.html');
  let html;
  try {
    html = await readFile(join(browser, file), 'utf8');
  } catch {
    failures.push(`${file}: not emitted`);
    continue;
  }

  failures.push(...checkPage(route, html));

  const title = `${EXPECTED.get(route).locale} ${titleOf(html)}`;
  if (titles.has(title)) failures.push(`${file}: same <title> as ${titles.get(title)}`);
  titles.set(title, file);
  console.log(`${file.padEnd(52)} ${title}`);
}

const read = (file, encoding) => readFile(join(browser, file), encoding).catch(() => null);

for (const [file, check] of [
  ['sitemap.xml', checkSitemap],
  ['robots.txt', checkRobots],
]) {
  const text = await read(file, 'utf8');
  failures.push(...(text === null ? [`${file}: not emitted`] : check(text)));
  // Crawlers read both from the root only; a copy under /en would contradict it.
  if ((await read(join('en', file))) !== null) failures.push(`en/${file}: emitted`);
}

for (const world of ['dev', 'cgi']) {
  for (const locale of ['fr', 'en']) {
    const file = OG_IMAGE.file(world, locale).slice(1);
    const bytes = await read(file);
    failures.push(...(bytes === null ? [`${file}: not emitted`] : checkShareCard(file, bytes)));
  }
}

if (failures.length > 0) {
  console.error(`\nPrerender check failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
