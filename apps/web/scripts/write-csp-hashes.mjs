// Writes dist/web/nginx/csp-inline-scripts.conf, the hashes of every inline
// script the two trees run, for the site image's nginx (ADR-0023). It sits
// beside the browser tree, not in it: it is server configuration.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cspInlineScriptsConf, inlineScriptHashes } from './csp-hashes.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'web');
const browser = join(dist, 'browser');

const files = (await readdir(browser, { recursive: true })).filter(
  (file) => file.endsWith('.html') && !file.endsWith('index.csr.html'),
);
const pages = await Promise.all(
  files.map(async (file) => inlineScriptHashes(await readFile(join(browser, file), 'utf8'))),
);

await mkdir(join(dist, 'nginx'), { recursive: true });
await writeFile(join(dist, 'nginx', 'csp-inline-scripts.conf'), cspInlineScriptsConf(pages));
const scripts = new Set(pages.flatMap((page) => page.scripts)).size;
const handlers = new Set(pages.flatMap((page) => page.handlers)).size;
console.log(
  `csp-inline-scripts.conf: ${files.length} pages, ${scripts} scripts, ${handlers} handlers`,
);
