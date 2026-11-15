// The startup loader's head script in src/index.html, run as the browser runs
// it, on a clock the test turns by hand.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { JSDOM } from 'jsdom';

const INDEX = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const BODY = '<app-root><div class="boot"><div class="boot__jaw"></div></div></app-root>';

function loading({ visible = true, reduced = false, known = true } = {}) {
  let now = 0;
  let next = 1;
  const timers = new Map();
  const dom = new JSDOM(INDEX.replace('<app-root></app-root>', BODY), {
    url: 'https://example.test/developpeur',
    runScripts: 'dangerously',
    beforeParse(window) {
      if (known) window.localStorage.setItem('boot-known', '');
      window.setTimeout = (run, delay = 0) => {
        timers.set(next, { at: now + delay, run });
        return next++;
      };
      window.clearTimeout = (id) => timers.delete(id);
      window.performance.now = () => now;
      window.matchMedia = (query) => ({ matches: reduced && query.includes('reduce') });
      Object.defineProperty(window.document, 'visibilityState', {
        get: () => (visible ? 'visible' : 'hidden'),
      });
    },
  });
  const { document, Event } = dom.window;
  const releases = [];
  document.addEventListener('boot-release', () => releases.push(now));
  const advance = (ms) => {
    const end = now + ms;
    for (;;) {
      const due = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      now = due[1].at;
      due[1].run();
    }
    now = end;
  };
  return {
    state: () => document.documentElement.getAttribute('data-boot'),
    remembered: () => dom.window.localStorage.getItem('boot-known') !== null,
    ready: () => document.dispatchEvent(new Event('app-ready')),
    press: () => dom.window.dispatchEvent(new Event('keydown')),
    releases,
    advance,
    // The parser reaches the end of the document, and the grace starts.
    parsed: () => new Promise((resolve) => setImmediate(resolve)),
  };
}

async function page(options) {
  const boot = loading(options);
  await boot.parsed();
  return boot;
}

describe('the startup loader’s head script', () => {
  it('does not count the HTML still streaming against the grace', async () => {
    const boot = loading();
    boot.advance(2000);
    assert.equal(boot.state(), 'wait');
    await boot.parsed();
    boot.advance(349);
    assert.equal(boot.state(), 'wait');
    boot.advance(1);
    assert.equal(boot.state(), 'on');
  });

  it('holds the entrance from the start, and never shows when the app is ready within the grace', async () => {
    const boot = await page();
    assert.equal(boot.state(), 'wait');
    boot.advance(200);
    boot.ready();
    assert.equal(boot.state(), null);
    assert.deepEqual(boot.releases, [200]);
    boot.advance(10_000);
    assert.equal(boot.state(), null);
  });

  it('covers a slow load, finishes the bite under way, then leaves on the diagonal', async () => {
    const boot = await page();
    boot.advance(350);
    assert.equal(boot.state(), 'on');
    boot.advance(1100);
    boot.ready();
    // 1100ms into the bites: the third ends 400ms later.
    boot.advance(399);
    assert.equal(boot.state(), 'on');
    assert.deepEqual(boot.releases, []);
    boot.advance(1);
    assert.equal(boot.state(), 'out');
    assert.deepEqual(boot.releases, []);
    // The entrance goes as the band starts uncovering the hero.
    boot.advance(180);
    assert.equal(boot.state(), 'clear');
    assert.deepEqual(boot.releases, [2030]);
    boot.advance(340);
    assert.equal(boot.state(), null);
  });

  it('stays at least one whole bite once shown, so it never flashes', async () => {
    const boot = await page();
    boot.advance(360);
    boot.ready();
    boot.advance(489);
    assert.equal(boot.state(), 'on');
    boot.advance(1);
    assert.equal(boot.state(), 'out');
  });

  it('fades out in 300ms under reduced motion', async () => {
    const boot = await page({ reduced: true });
    boot.advance(350);
    boot.ready();
    boot.advance(500);
    // No band to wait for: the entrance goes with the fade.
    assert.equal(boot.state(), 'clear');
    assert.deepEqual(boot.releases, [850]);
    boot.advance(300);
    assert.equal(boot.state(), null);
  });

  it('gives way at once to a key, and lets the entrance go', async () => {
    const boot = await page();
    boot.advance(400);
    boot.press();
    assert.equal(boot.state(), 'skip');
    assert.deepEqual(boot.releases, [400]);
    boot.advance(125);
    assert.equal(boot.state(), null);
    boot.ready();
    boot.advance(1000);
    assert.deepEqual(boot.releases, [400]);
  });

  it('ignores keys while it is not showing', async () => {
    const boot = await page();
    boot.press();
    assert.equal(boot.state(), 'wait');
  });

  it('leaves after 8s whatever happens', async () => {
    const boot = await page();
    boot.advance(8000);
    assert.equal(boot.state(), 'on');
    boot.advance(500);
    assert.equal(boot.state(), 'out');
  });

  it('never shows in a background tab, and still lets the entrance go', async () => {
    const boot = await page({ visible: false });
    boot.advance(2000);
    assert.equal(boot.state(), 'wait');
    boot.ready();
    assert.equal(boot.state(), null);
    assert.equal(boot.releases.length, 1);
  });
});

describe('the startup loader on a first visit', () => {
  it('covers the page from the first paint, without the grace', async () => {
    const boot = loading({ known: false });
    assert.equal(boot.state(), 'on');
    await boot.parsed();
    assert.equal(boot.state(), 'on');
  });

  it('remembers the visitor once the app is ready, for the grace next time', async () => {
    const boot = loading({ known: false });
    await boot.parsed();
    assert.equal(boot.remembered(), false);
    boot.ready();
    assert.equal(boot.remembered(), true);
  });

  it('stays hidden in a background tab, as on a return', async () => {
    const boot = loading({ known: false, visible: false });
    await boot.parsed();
    assert.equal(boot.state(), 'wait');
  });
});
