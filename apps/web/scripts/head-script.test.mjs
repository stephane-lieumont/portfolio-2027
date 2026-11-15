// The plates' head script in src/index.html, run as the browser runs it:
// before the body, so it hears every picture the prerendered page loads.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { JSDOM } from 'jsdom';

const INDEX = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const BODY = `
  <li class="tile plate" id="slow"><img src="/medias/slow.webp" srcset="/medias/slow-640.webp 640w" /></li>
  <li class="tile plate" id="cached"><img src="/medias/cached.webp" /></li>
  <li class="tile plate" id="broken"><img src="/medias/broken.webp" /></li>
`;

async function page(durations = {}) {
  let report = null;
  const observed = new Set();
  const dom = new JSDOM(INDEX.replace('<app-root></app-root>', BODY), {
    url: 'https://example.test/graphisme-3d',
    runScripts: 'dangerously',
    beforeParse(window) {
      Object.defineProperty(window.HTMLImageElement.prototype, 'currentSrc', {
        get() {
          return this.src;
        },
      });
      window.performance.getEntriesByName = (name) => {
        const duration = durations[new URL(name).pathname];
        return duration === undefined ? [] : [{ startTime: 1000, responseEnd: 1000 + duration }];
      };
      window.IntersectionObserver = class {
        constructor(callback) {
          report = callback;
        }
        observe(target) {
          observed.add(target);
        }
        unobserve(target) {
          observed.delete(target);
        }
      };
    },
  });
  // The page parses past the head before the plates are watched.
  await new Promise((resolve) => setImmediate(resolve));
  const { document, Event } = dom.window;
  const plate = (id) => document.getElementById(id);
  const settle = (id, type) => plate(id).querySelector('img').dispatchEvent(new Event(type));
  const see = (id, isIntersecting) => report([{ target: plate(id), isIntersecting }]);
  return { document, plate, settle, see, observed };
}

describe('the plates’ head script', () => {
  it('stamps a picture that took its time to fade in, and a cached one to just be there', async () => {
    const { plate, settle } = await page({ '/medias/slow.webp': 2400, '/medias/cached.webp': 4 });
    settle('slow', 'load');
    settle('cached', 'load');
    assert.equal(plate('slow').getAttribute('data-plate-loaded'), 'fade');
    assert.equal(plate('cached').getAttribute('data-plate-loaded'), '');
  });

  it('treats a picture the network never timed (a memory cache) as already there', async () => {
    const { plate, settle } = await page();
    settle('cached', 'load');
    assert.equal(plate('cached').getAttribute('data-plate-loaded'), '');
  });

  it('retries a failed derivative as the original before calling it failed', async () => {
    const { plate, settle } = await page();
    settle('slow', 'error');
    const img = plate('slow').querySelector('img');
    assert.equal(img.hasAttribute('srcset'), false);
    assert.equal(plate('slow').hasAttribute('data-plate-failed'), false);
    settle('slow', 'error');
    assert.equal(plate('slow').hasAttribute('data-plate-failed'), true);
  });

  it('marks a plate seen only while on screen, and stops watching it once settled', async () => {
    const { plate, settle, see, observed } = await page();
    assert.equal(observed.size, 3);
    see('broken', true);
    assert.equal(plate('broken').hasAttribute('data-plate-seen'), true);
    see('broken', false);
    assert.equal(plate('broken').hasAttribute('data-plate-seen'), false);
    settle('broken', 'error');
    assert.equal(observed.has(plate('broken')), false);
  });

  it('leans the band like the sweep', async () => {
    const { document } = await page();
    const skew = document.documentElement.style.getPropertyValue('--plate-skew');
    assert.match(skew, /^-0\.\d+rad$/);
  });
});
