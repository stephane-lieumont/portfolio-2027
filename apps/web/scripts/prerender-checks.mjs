// What a prerendered page must be, checked on the HTML the build wrote.
// Parsed with jsdom rather than matched with patterns: attribute order,
// quoting and nested markup are the HTML's business, not the check's.
import { JSDOM } from 'jsdom';

import { WORLD_PAGES } from '../src/app/core/content/world-content.ts';
import { ARTWORKS, PROJECTS } from '../src/app/core/static-content.ts';

// Both worlds open on the name, set by the page itself.
const NAME = 'Stéphane Lieumont';

/**
 * Every route the site must ship, with text that proves its content was
 * rendered: the heading, and a line of the copy under it. Written from the
 * content, not read from the build, so a route that stops prerendering is
 * missing rather than silently absent from both sides.
 */
export const EXPECTED = new Map([
  // The root has no page: the site opens on the developer world. Angular's
  // static output writes a meta-refresh file there; nginx may answer with a
  // 301 before it is ever read (ADR-0005).
  ['', { redirect: '/developpeur' }],
  [
    'developpeur',
    {
      h1: NAME,
      text: [WORLD_PAGES.dev.lede.lead, WORLD_PAGES.dev.scrub, ...PROJECTS.map((p) => p.title)],
    },
  ],
  [
    'graphisme-3d',
    {
      h1: NAME,
      text: [WORLD_PAGES.cgi.lede.lead, WORLD_PAGES.cgi.scrub, ...ARTWORKS.map((a) => a.title)],
    },
  ],
  ...ARTWORKS.map((a) => [`graphisme-3d/${a.slug}`, { h1: NAME, text: [a.title] }]),
  [
    'contact',
    { h1: 'Un projet, une question ou juste un Hello World ?', text: ['Je réponds à tout'] },
  ],
  ...PROJECTS.map((p) => [`developpeur/${p.slug}`, { h1: p.title, text: [p.context, p.mission] }]),
  ['404', { h1: 'Page introuvable', text: ['Erreur 404'], noindex: true }],
]);

const HIDING_STYLE =
  /(?:^|;)\s*(?:opacity\s*:\s*0(?:\.0*)?\s*(?:;|$|!)|display\s*:\s*none|visibility\s*:\s*hidden)/i;

const squash = (text) => text.replace(/\s+/g, ' ').trim();

/** Returns what is wrong with one page; empty when it is complete. */
export function checkPage(route, html) {
  const expected = EXPECTED.get(route);
  if (!expected) return [`unexpected route ${route}`];

  const { document } = new JSDOM(html).window;
  const failures = [];
  const fail = (reason) => failures.push(reason);

  if (expected.redirect) {
    const refresh = Array.from(document.head.querySelectorAll('meta')).find(
      (m) => m.getAttribute('http-equiv')?.toLowerCase() === 'refresh',
    );
    const target = /url=(\S+)/i.exec(refresh?.getAttribute('content') ?? '')?.[1];
    if (target !== expected.redirect)
      fail(`redirects to ${target ?? 'nowhere'}, expected ${expected.redirect}`);
    return failures.map((reason) => `/: ${reason}`);
  }

  const title = squash(document.title);
  if (!title) fail('no <title>');

  const h1 = document.querySelector('h1');
  const heading = h1 ? squash(h1.textContent ?? '') : '';
  if (heading !== expected.h1) fail(`<h1> is "${heading}", expected "${expected.h1}"`);

  const main = document.querySelector('main');
  if (!main) {
    fail('no <main>');
  } else {
    const body = squash(main.textContent ?? '');
    for (const line of expected.text) {
      if (!body.includes(squash(line))) fail(`content missing: "${line.slice(0, 50)}"`);
    }

    // The page itself and everything that contains it must be visible with
    // no script: no `hidden`, no inline style that hides.
    const hidden = [main, ...main.querySelectorAll('*')];
    for (let el = main.parentElement; el; el = el.parentElement) hidden.push(el);
    for (const el of hidden) {
      if (el.hasAttribute('hidden') || HIDING_STYLE.test(el.getAttribute('style') ?? '')) {
        fail(`content hidden before script: <${el.tagName.toLowerCase()}>`);
        break;
      }
    }
  }

  // The reveal's hidden state needs these marks; the server must never set them.
  if (document.querySelector('[data-reveal-ready]'))
    fail('data-reveal-ready stamped at build time');
  if (document.querySelector('.js-motion')) fail('js-motion set at build time');
  if (document.querySelector('.reveal--in')) fail('revealed state rendered at build time');

  // Without these the browser re-renders the page instead of hydrating it.
  if (!document.querySelector('script#ng-state')) fail('no hydration state (#ng-state)');
  if (!document.querySelector('[ngh]')) fail('no hydration annotations (ngh)');

  const meta = (name) =>
    Array.from(document.head.querySelectorAll('meta')).find(
      (m) => m.getAttribute('name')?.toLowerCase() === name,
    );
  const description = squash(meta('description')?.getAttribute('content') ?? '');
  const noindex = /noindex/i.test(meta('robots')?.getAttribute('content') ?? '');

  if (expected.noindex) {
    if (!noindex) fail('the 404 page is indexable');
  } else {
    if (!description) fail('no meta description');
    if (noindex) fail('marked noindex');
  }

  return failures.map((reason) => `${route || '/'}: ${reason}`);
}

export function titleOf(html) {
  return squash(new JSDOM(html).window.document.title);
}
