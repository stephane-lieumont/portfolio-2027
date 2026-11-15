// Builds the site image from the local build output, runs it with Docker and
// asks it what the reverse proxy will ask (issue #43, ADR-0023): every page
// of both trees, the / redirect, the 404s, the headers. The contact page is
// then opened in headless Chrome, when one is installed, to prove the CSP lets
// Turnstile and the inline boot scripts run. Needs `pnpm build:site` first.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const web = join(import.meta.dirname, '..', 'apps', 'web');
const dist = join(web, 'dist', 'web');
const ORIGIN = 'https://stephane-lieumont.fr';
const IMAGE = `portfolio-site:test-${process.pid}`;
const CONTAINER = `portfolio-site-test-${process.pid}`;

for (const file of ['prerendered-routes.json', 'nginx/csp-inline-scripts.conf']) {
  if (!existsSync(join(dist, file))) {
    console.error(`test-site-image: ${file} is missing, run \`pnpm build:site\` first`);
    process.exit(1);
  }
}
const routes = Object.keys(
  JSON.parse(readFileSync(join(dist, 'prerendered-routes.json'), 'utf8')).routes,
);
const inlineScripts = /default "([^"]+)"/.exec(
  readFileSync(join(dist, 'nginx', 'csp-inline-scripts.conf'), 'utf8'),
)[1];

function docker(...args) {
  const result = spawnSync('docker', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`docker ${args[0]}: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

let base;

// node:http rather than fetch: fetch adds an Accept-Language of its own, and
// the redirect must be seen without one.
function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = request(`${base}${path}`, { headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        }),
      );
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitUntilHealthy() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const response = await get('/healthz').catch(() => null);
    if (response?.status === 200) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`the site container did not answer: ${docker('logs', CONTAINER)}`);
}

before(async () => {
  docker('build', '-q', '-t', IMAGE, web);
  const port = await freePort();
  docker('run', '-d', '--name', CONTAINER, '-p', `127.0.0.1:${port}:8080`, IMAGE);
  base = `http://127.0.0.1:${port}`;
  await waitUntilHealthy();
});

after(() => {
  spawnSync('docker', ['rm', '-f', CONTAINER]);
  spawnSync('docker', ['rmi', '-f', IMAGE]);
});

const canonical = (body) => /<link rel="canonical" href="([^"]+)"/.exec(body)?.[1];
const pages = routes.filter((route) => route !== '/' && route !== '/en');

describe('every prerendered page', () => {
  it('answers 200 with its own HTML, in both trees', async () => {
    for (const route of pages) {
      const { status, body, headers } = await get(route);
      assert.equal(status, 200, route);
      assert.equal(headers['cache-control'], 'no-cache', route);
      if (!route.endsWith('/404')) assert.equal(canonical(body), `${ORIGIN}${route}`, route);
    }
  });

  it('is never redirected, whatever the visitor’s language', async () => {
    const english = { cookie: 'lang=en', 'accept-language': 'en-GB' };
    assert.equal((await get('/developpeur', english)).status, 200);
    assert.equal((await get('/en/developer', { cookie: 'lang=fr' })).status, 200);
  });
});

describe('the root', () => {
  const cases = [
    ['the cookie fr', { cookie: 'lang=fr', 'accept-language': 'en-GB' }, '/developpeur'],
    ['the cookie en', { cookie: 'lang=en', 'accept-language': 'fr-FR' }, '/en/developer'],
    ['English first', { 'accept-language': 'en-GB,en;q=0.9,fr;q=0.8' }, '/en/developer'],
    ['another language first', { 'accept-language': 'de-DE,fr;q=0.5' }, '/en/developer'],
    ['French first', { 'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8' }, '/developpeur'],
    ['plain fr', { 'accept-language': 'fr' }, '/developpeur'],
    ['any language', { 'accept-language': '*' }, '/developpeur'],
    ['no language at all', {}, '/developpeur'],
    ['a cookie it does not know', { cookie: 'lang=de', 'accept-language': 'en' }, '/en/developer'],
  ];
  for (const [name, headers, target] of cases) {
    it(`sends ${name} to ${target}`, async () => {
      const response = await get('/', headers);
      assert.equal(response.status, 302);
      assert.equal(response.headers.location, target);
    });
  }

  it('is a redirect no cache keeps, varying on what decided it', async () => {
    const { headers } = await get('/');
    assert.equal(headers['cache-control'], 'no-store');
    assert.equal(headers.vary, 'Accept-Language, Cookie');
  });

  it('sends /en and /en/ to the English developer page, cookie or not', async () => {
    for (const path of ['/en', '/en/']) {
      const response = await get(path, { cookie: 'lang=fr', 'accept-language': 'fr' });
      assert.equal(response.status, 302, path);
      assert.equal(response.headers.location, '/en/developer', path);
    }
  });
});

describe('an unknown address', () => {
  it('gets the French 404 page with a 404 status', async () => {
    for (const path of ['/nope', '/developpeur/nope', '/fonts/', '/developer']) {
      const { status, body, headers } = await get(path);
      assert.equal(status, 404, path);
      assert.match(body, /<html lang="fr"/, path);
      assert.match(body, /Erreur 404/, path);
      assert.equal(headers['cache-control'], 'no-cache', path);
    }
  });

  it('gets the English one under /en/', async () => {
    for (const path of ['/en/nope', '/en/developpeur', '/en/fonts/']) {
      const { status, body } = await get(path);
      assert.equal(status, 404, path);
      assert.match(body, /<html lang="en"/, path);
      assert.match(body, /Error 404/, path);
    }
  });
});

describe('the headers', () => {
  it('keep a hashed asset for a year, compressed', async () => {
    const script = /src="(main-[A-Za-z0-9_-]{8}\.js)"/.exec((await get('/contact')).body)[1];
    const { status, headers } = await get(`/${script}`, { 'accept-encoding': 'gzip' });
    assert.equal(status, 200);
    assert.equal(headers['cache-control'], 'public, max-age=31536000, immutable');
    assert.equal(headers['content-encoding'], 'gzip');
  });

  it('revalidate a file whose name does not change on every visit', async () => {
    const { headers } = await get('/fonts/instrument-sans-latin.woff2');
    assert.equal(headers['cache-control'], 'no-cache');
  });

  it('revalidate the sitemap and robots.txt on every visit', async () => {
    for (const path of ['/sitemap.xml', '/robots.txt']) {
      assert.equal((await get(path)).headers['cache-control'], 'no-cache', path);
    }
  });

  it('carry the security policy, on errors too, without HSTS or a version', async () => {
    for (const path of ['/contact', '/nope', '/']) {
      const { headers } = await get(path);
      const csp = headers['content-security-policy'] ?? '';
      assert.ok(csp.includes(`script-src 'self' ${inlineScripts} `), path);
      assert.match(csp, /frame-src https:\/\/challenges\.cloudflare\.com/, path);
      assert.match(csp, /frame-ancestors 'none'/, path);
      assert.equal(headers['x-content-type-options'], 'nosniff', path);
      assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin', path);
      assert.ok(headers['permissions-policy'], path);
      assert.equal(headers['strict-transport-security'], undefined, path);
      assert.equal(headers.server, 'nginx', path);
    }
  });

  it('answer the deploy health check', async () => {
    const { status, body } = await get('/healthz');
    assert.equal(status, 200);
    assert.equal(body, 'ok\n');
  });
});

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((path) => path && existsSync(path));

/** One headless Chrome, driven over the DevTools protocol. */
async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), 'site-image-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-sandbox',
    'about:blank',
  ]);
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    chrome.stderr.on('data', (chunk) => {
      output += chunk;
      const match = /DevTools listening on (ws:\/\/\S+)/.exec(output);
      if (match) resolve(match[1]);
    });
    chrome.once('exit', () => reject(new Error(`Chrome exited: ${output}`)));
  });
  const socket = new WebSocket(endpoint);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  const listeners = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    } else listeners.forEach((listener) => listener(message));
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      pending.set(++id, (message) =>
        message.error ? reject(new Error(message.error.message)) : resolve(message.result),
      );
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  return {
    send,
    onEvent: (listener) => listeners.push(listener),
    async close() {
      socket.close();
      const exited = new Promise((resolve) => chrome.once('exit', resolve));
      chrome.kill();
      await exited;
      rmSync(profile, { recursive: true, force: true });
    },
  };
}

describe('in a browser', { skip: CHROME ? false : 'no Chrome found (set CHROME_PATH)' }, () => {
  let chrome;
  before(async () => {
    chrome = await launchChrome();
  });
  after(async () => chrome?.close());

  /** Opens a page and waits until `ready` holds in it; returns what the page saw. */
  async function visit(path, ready) {
    const { targetId } = await chrome.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await chrome.send('Target.attachToTarget', { targetId, flatten: true });
    const reports = [];
    chrome.onEvent((message) => {
      if (message.sessionId !== sessionId) return;
      const entry = message.params?.entry;
      if (message.method === 'Log.entryAdded' && /Content Security Policy/i.test(entry.text))
        reports.push(entry.text);
    });
    await chrome.send('Log.enable', {}, sessionId);
    await chrome.send('Page.enable', {}, sessionId);
    await chrome.send(
      'Page.addScriptToEvaluateOnNewDocument',
      {
        source: `window.__violations = [];
          addEventListener('securitypolicyviolation', (e) =>
            __violations.push(e.effectiveDirective + ' ' + e.blockedURI));`,
      },
      sessionId,
    );
    await chrome.send('Page.navigate', { url: `${base}${path}` }, sessionId);
    const evaluate = async (expression) =>
      (await chrome.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)).result
        .value;
    const deadline = Date.now() + 15_000;
    while (
      Date.now() < deadline &&
      !(await evaluate(`document.readyState === 'complete' && (${ready})`))
    )
      await new Promise((resolve) => setTimeout(resolve, 250));
    // The bundle hydrates after load: give it the time to run into the policy.
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    const seen = await evaluate(`({
      ready: !!(${ready}),
      violations: window.__violations,
      headScriptRan: document.documentElement.classList.contains('js-motion'),
      stylesheetApplied: [...document.querySelectorAll('link[rel=stylesheet]')]
        .every((link) => link.media === 'all' || link.media === ''),
    })`);
    await chrome.send('Target.closeTarget', { targetId });
    return { ...seen, violations: [...seen.violations, ...reports] };
  }

  const turnstileFrame = `performance.getEntriesByType('resource')
    .some((entry) => entry.name.startsWith('https://challenges.cloudflare.com/cdn-cgi/'))`;

  for (const path of ['/contact', '/en/contact']) {
    it(`${path} loads Turnstile with no policy violation`, async () => {
      const seen = await visit(path, `!!window.turnstile && ${turnstileFrame}`);
      assert.deepEqual(seen.violations, []);
      assert.ok(seen.ready, 'Turnstile’s script and challenge frame loaded');
      assert.ok(seen.headScriptRan, 'the inline head script ran');
      assert.ok(seen.stylesheetApplied, 'the stylesheet’s onload handler ran');
    });
  }

  for (const path of ['/developpeur', '/en/3d-art', '/developpeur/ledger', '/nope']) {
    it(`${path} runs with no policy violation`, async () => {
      const seen = await visit(path, 'true');
      assert.deepEqual(seen.violations, []);
      assert.ok(seen.headScriptRan, 'the inline head script ran');
      assert.ok(seen.stylesheetApplied, 'the stylesheet’s onload handler ran');
    });
  }
});
