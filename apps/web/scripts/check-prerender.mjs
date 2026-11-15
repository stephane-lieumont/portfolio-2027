// Fails the build unless every route of both trees was prerendered into a
// complete page. Titles must differ within a tree.
// The rules live in prerender-checks.mjs, where they are tested.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXPECTED, checkPage, titleOf } from './prerender-checks.mjs';

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

if (failures.length > 0) {
  console.error(`\nPrerender check failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
