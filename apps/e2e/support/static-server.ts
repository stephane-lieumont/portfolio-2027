// Serves the prerendered build the way production's nginx does (ADR-0005,
// amendment of 2026-11-15), so the tests see the statuses a visitor gets:
//
//   location /en/ { try_files $uri $uri/index.html =404; error_page 404 /en/404/index.html; }
//   location /    { try_files $uri $uri/index.html =404; error_page 404 /404/index.html; }
//
// `/api` and `/medias` are proxied before `/` in production. Here nothing
// answers them: the tests intercept both in the browser, and an unmocked call
// gets a 502 that shows up in the test rather than passing silently.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', 'web', 'dist', 'web', 'browser');
const PORT = Number(process.env['E2E_PORT'] ?? 4310);

const TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(join(ROOT, '404', 'index.html'))) {
  console.error(`No prerendered site in ${ROOT}. Run \`pnpm build:site\` first.`);
  process.exit(1);
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

/** The file `try_files $uri $uri/index.html` lands on, or null for its `=404`. */
function resolve(urlPath: string): string | null {
  const path = normalize(join(ROOT, urlPath));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) return null;
  if (isFile(path)) return path;
  const index = join(path, 'index.html');
  return isFile(index) ? index : null;
}

const server = createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  if (urlPath.startsWith('/api/') || urlPath.startsWith('/medias/')) {
    response.writeHead(502, { 'content-type': 'text/plain' }).end('not served in e2e');
    return;
  }
  const found = resolve(urlPath);
  const file = found ?? join(ROOT, urlPath.startsWith('/en/') ? 'en' : '', '404', 'index.html');
  response.writeHead(found ? 200 : 404, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
  });
  response.end(request.method === 'HEAD' ? undefined : readFileSync(file));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`e2e static server on http://127.0.0.1:${PORT}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
