// What a prerendered page must be, checked on the HTML the build wrote.
// Parsed with jsdom rather than matched with patterns: attribute order,
// quoting and nested markup are the HTML's business, not the check's.
import { JSDOM } from 'jsdom';

import { CONTACT_PAGE, WORLD_PAGES } from '../src/app/core/content/world-content.ts';
import { SECTIONS, SITE_ORIGIN } from '../src/app/core/i18n/site-paths.ts';
import { ARTWORKS, PROJECTS } from '../src/app/core/static-content.ts';

// Both worlds open on the name, set by the page itself.
const NAME = 'Stéphane Lieumont';

// The chrome each tree must say in its own words. The project copy and the
// world pages' content are French in both trees until it is localized at the
// source (ADR-0017), so only the strings marked for translation are checked.
const CHROME = {
  fr: {
    contactForm: ['Nom', 'Email', 'Message', 'Envoyer'],
    worldCta: 'Me contacter',
    projectBlock: 'Contexte',
    notFound: { h1: 'Mais où est l’interphone ?', text: ['Erreur 404'] },
  },
  en: {
    contactForm: ['Name', 'Email', 'Message', 'Send'],
    worldCta: 'Contact me',
    projectBlock: 'Context',
    notFound: { h1: 'Where is the intercom?', text: ['Error 404'] },
  },
};

/** French interface strings that must not reach the English tree. */
export const FRENCH_CHROME = [
  'Aller au contenu',
  'Navigation principale',
  'Me contacter',
  'Réseaux et contact',
  'Télécharger mon CV',
  'Image indisponible',
  'nouvel onglet',
  'Cette fiche',
  'Autres réalisations',
  'Réalisations',
  'Maîtrise',
  'Ce avec quoi je travaille',
  'Mes logiciels',
  'Visionneuse',
  'Fil d’Ariane',
  'Envoyer',
  'Erreur 404',
  'Lead Tech & graphiste 3D',
];

const treePrefix = (locale) => (locale === 'fr' ? '' : `${locale}/`);

/** A page's directory in a tree, from the build's root. */
export function routeOf({ page, slug }, locale) {
  const section = { project: 'dev', piece: 'cgi', 'not-found': 'dev' }[page] ?? page;
  const path = page === 'project' || page === 'piece' ? `/${slug}` : '';
  return `${treePrefix(locale)}${SECTIONS[section][locale]}${path}`;
}

function tree(locale) {
  const other = locale === 'fr' ? 'en' : 'fr';
  const chrome = CHROME[locale];
  const entry = (ref, expected) => [
    ref.page === 'not-found' ? `${treePrefix(locale)}404` : routeOf(ref, locale),
    { locale, ref, switchTo: `/${routeOf(ref, other)}`, ...expected },
  ];
  return [
    // The root has no page: each tree opens on the developer world. Angular's
    // static output writes a meta-refresh file there; nginx may answer with a
    // redirect before it is ever read (ADR-0005).
    [
      treePrefix(locale).replace(/\/$/, ''),
      { locale, redirect: `/${routeOf({ page: 'dev' }, locale)}` },
    ],
    entry(
      { page: 'dev' },
      {
        h1: NAME,
        text: [
          WORLD_PAGES.dev.lede.lead,
          WORLD_PAGES.dev.scrub,
          chrome.worldCta,
          ...PROJECTS.map((p) => p.title),
        ],
      },
    ),
    entry(
      { page: 'cgi' },
      {
        h1: NAME,
        text: [
          WORLD_PAGES.cgi.lede.lead,
          WORLD_PAGES.cgi.scrub,
          chrome.worldCta,
          ...ARTWORKS.map((a) => a.title),
        ],
      },
    ),
    ...ARTWORKS.map((a) => entry({ page: 'piece', slug: a.slug }, { h1: NAME, text: [a.title] })),
    entry(
      { page: 'contact' },
      { h1: CONTACT_PAGE.title, text: [CONTACT_PAGE.lede, ...chrome.contactForm] },
    ),
    ...PROJECTS.map((p) =>
      entry(
        { page: 'project', slug: p.slug },
        {
          h1: p.title,
          text: [
            p.context,
            p.mission,
            p.presentationCaption,
            chrome.projectBlock,
            ...p.missionSteps,
          ],
        },
      ),
    ),
    entry({ page: 'not-found' }, { ...chrome.notFound, noindex: true }),
  ];
}

/**
 * Every route the site must ship, in both trees, with text that proves its
 * content was rendered: the heading, and a line of the copy under it. Written
 * from the content, not read from the build, so a route that stops
 * prerendering is missing rather than silently absent from both sides.
 */
export const EXPECTED = new Map([...tree('fr'), ...tree('en')]);

const HIDING_STYLE =
  /(?:^|;)\s*(?:opacity\s*:\s*0(?:\.0*)?\s*(?:;|$|!)|display\s*:\s*none|visibility\s*:\s*hidden)/i;

const squash = (text) => text.replace(/\s+/g, ' ').trim();

// What a screen reader says for an element: its aria-label, else its text
// without what is hidden from it. A heading split into letters for its
// entrance carries the plain words in one of these two ways.
function spokenText(element) {
  const label = element.getAttribute('aria-label');
  if (label) return squash(label);
  const copy = element.cloneNode(true);
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
  return squash(copy.textContent ?? '');
}

// Nothing may load from another origin before the visitor asks for it: the
// YouTube player comes after a click (ADR-0016), never in the HTML.
function thirdParty(document) {
  const urls = [
    ...Array.from(document.querySelectorAll('[src]'), (el) => el.getAttribute('src')),
    ...Array.from(document.querySelectorAll('[srcset]'), (el) => el.getAttribute('srcset')),
    // The hreflang alternates name this site's own addresses; nothing loads them.
    ...Array.from(document.querySelectorAll('link[href]:not([rel="alternate"])'), (el) =>
      el.getAttribute('href'),
    ),
  ];
  return urls.filter((url) => /(?:^|[\s,])(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url ?? ''));
}

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
    return failures.map((reason) => `/${route}: ${reason}`);
  }

  const lang = document.documentElement.getAttribute('lang');
  if (lang !== expected.locale) fail(`<html lang> is "${lang}", expected "${expected.locale}"`);

  const alternates = Object.fromEntries(
    Array.from(document.head.querySelectorAll('link[rel="alternate"][hreflang]'), (link) => [
      link.getAttribute('hreflang'),
      link.getAttribute('href'),
    ]),
  );
  const wanted = expected.noindex
    ? {}
    : {
        fr: `${SITE_ORIGIN}/${routeOf(expected.ref, 'fr')}`,
        en: `${SITE_ORIGIN}/${routeOf(expected.ref, 'en')}`,
        'x-default': `${SITE_ORIGIN}/${routeOf(expected.ref, 'fr')}`,
      };
  if (JSON.stringify(alternates) !== JSON.stringify(wanted))
    fail(`hreflang links are ${JSON.stringify(alternates)}, expected ${JSON.stringify(wanted)}`);

  // The switcher leads to the same page in the other tree, as a plain link.
  const other = expected.locale === 'fr' ? 'en' : 'fr';
  const switcher = document.querySelector(`header a[hreflang="${other}"][lang="${other}"]`);
  const switchHref = switcher?.getAttribute('href');
  if (switchHref !== expected.switchTo)
    fail(`language switch goes to ${switchHref ?? 'nowhere'}, expected ${expected.switchTo}`);

  if (expected.locale === 'en') {
    const said = [
      document.title,
      document.body.textContent ?? '',
      ...Array.from(document.querySelectorAll('[aria-label], [title]'), (el) =>
        [el.getAttribute('aria-label'), el.getAttribute('title')].join(' '),
      ),
    ].join(' ');
    for (const french of FRENCH_CHROME) {
      if (said.includes(french)) fail(`French interface text in the English tree: "${french}"`);
    }
  }

  const title = squash(document.title);
  if (!title) fail('no <title>');

  const h1 = document.querySelector('h1');
  const heading = h1 ? spokenText(h1) : '';
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

  for (const url of thirdParty(document)) fail(`loads from another origin: ${url}`);

  // Stéphane's address is never published (ADR-0007, spec 03): the contact
  // form is the way in.
  if (document.querySelector('a[href^="mailto:" i]')) fail('publishes a mailto link');

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

  return failures.map((reason) => `/${route}: ${reason}`);
}

export function titleOf(html) {
  return squash(new JSDOM(html).window.document.title);
}
