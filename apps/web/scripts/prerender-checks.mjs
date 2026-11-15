// What a prerendered page must be, checked on the HTML the build wrote.
// Parsed with jsdom rather than matched with patterns: attribute order,
// quoting and nested markup are the HTML's business, not the check's.
import { JSDOM } from 'jsdom';

import {
  CONTACT_PAGE,
  STATIC_ASSETS,
  WORLD_PAGES,
} from '../src/app/core/data/world-content/world-content.ts';
import { OG_IMAGE, SECTIONS, SITE_ORIGIN } from '../src/app/core/i18n/site-paths.ts';
import {
  ARTWORKS,
  PROJECTS,
  STACK,
  TOOLS,
} from '../src/app/core/data/content/content.generated.ts';

// Both worlds open on the name, set by the page itself.
const NAME = 'Stéphane Lieumont';

// The chrome each tree must say in its own words: the strings marked for
// translation. The content says its own through `{ fr, en }` (ADR-0017).
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
  'Voir sur Google Play',
  'Tests unitaires',
  'autres outils',
  'aujourd’hui',
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

/** Every `{ fr, en }` pair in a tree of content, wherever it sits. */
function localizedPairs(value) {
  if (Array.isArray(value)) return value.flatMap(localizedPairs);
  if (typeof value !== 'object' || value === null) return [];
  if (typeof value.fr === 'string' && typeof value.en === 'string') return [value];
  return Object.values(value).flatMap(localizedPairs);
}

const CONTENT = localizedPairs([
  WORLD_PAGES,
  TOOLS,
  STACK,
  CONTACT_PAGE,
  STATIC_ASSETS,
  PROJECTS,
  ARTWORKS,
]);

/**
 * French content that must not reach the English tree: every French value
 * that is not also English (a proper name, a tool list), whole.
 */
export const FRENCH_CONTENT = CONTENT.filter(
  ({ fr }) => !CONTENT.some(({ en }) => en.includes(fr)),
).map(({ fr }) => fr);

/**
 * Words only the French content uses, accented ones: a stray word, a half
 * translated sentence, a French alt text, caught even when the whole string
 * has changed. Names excepted.
 */
export const FRENCH_WORDS = [
  ...new Set(
    CONTENT.flatMap(({ fr }) => fr.match(/[\p{L}-]*[àâçèéêëîïôûùüÿœæ][\p{L}-]*/giu) ?? []),
  ),
].filter((word) => word !== 'Stéphane');

const treePrefix = (locale) => (locale === 'fr' ? '' : `${locale}/`);

/** A page's directory in a tree, from the build's root; a record's slug in that tree's language. */
export function routeOf({ page, slug }, locale) {
  const section = { project: 'dev', piece: 'cgi', 'not-found': 'dev' }[page] ?? page;
  const path = page === 'project' || page === 'piece' ? `/${slug[locale]}` : '';
  return `${treePrefix(locale)}${SECTIONS[section][locale]}${path}`;
}

function tree(locale) {
  const other = locale === 'fr' ? 'en' : 'fr';
  const chrome = CHROME[locale];
  const say = (text) => text[locale];
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
          say(WORLD_PAGES.dev.lede.lead),
          say(WORLD_PAGES.dev.scrub),
          ...WORLD_PAGES.dev.facts.map((f) => say(f.value)),
          chrome.worldCta,
          ...PROJECTS.map((p) => say(p.title)),
        ],
      },
    ),
    entry(
      { page: 'cgi' },
      {
        h1: NAME,
        text: [
          say(WORLD_PAGES.cgi.lede.lead),
          say(WORLD_PAGES.cgi.scrub),
          ...WORLD_PAGES.cgi.facts.map((f) => say(f.value)),
          chrome.worldCta,
          ...ARTWORKS.map((a) => say(a.title)),
        ],
      },
    ),
    ...ARTWORKS.map((a) =>
      entry({ page: 'piece', slug: a.slug }, { h1: NAME, text: [say(a.title)] }),
    ),
    entry(
      { page: 'contact' },
      { h1: say(CONTACT_PAGE.title), text: [say(CONTACT_PAGE.lede), ...chrome.contactForm] },
    ),
    ...PROJECTS.map((p) =>
      entry(
        { page: 'project', slug: p.slug },
        {
          h1: say(p.title),
          // A client reference has no mission or caption when its copy is
          // one sentence: the page shows what the record has, nothing blank.
          text: [
            say(p.context),
            say(p.role),
            ...[p.mission, p.presentationCaption].filter(Boolean).map(say),
            chrome.projectBlock,
            ...p.missionSteps.map(say),
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

/** Each tree's pages as a link names them, from the site root; the 404 is no destination. */
const PAGES = Object.fromEntries(
  ['fr', 'en'].map((locale) => [
    locale,
    new Set(
      [...EXPECTED]
        .filter(([, expected]) => expected.locale === locale && !expected.noindex)
        .map(([route]) => `/${route}`),
    ),
  ]),
);

/**
 * The site's own page links, the language switch excepted: a fragment, a file
 * (the CV), a proxied demo or another origin is not a page of either tree.
 */
function pageLinks(document) {
  return Array.from(document.querySelectorAll('a[href]:not([hreflang])'), (a) =>
    a.getAttribute('href'),
  )
    .filter((href) => href.startsWith('/') && !href.startsWith('//'))
    .map((href) => href.split(/[?#]/)[0])
    .filter((path) => !path.startsWith('/demo/') && !/\.[a-z0-9]+$/i.test(path));
}

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
// videos open on YouTube, never embedded in the page (ADR-0016's note).
function thirdParty(document) {
  const urls = [
    ...Array.from(document.querySelectorAll('[src]'), (el) => el.getAttribute('src')),
    ...Array.from(document.querySelectorAll('[srcset]'), (el) => el.getAttribute('srcset')),
    // The hreflang alternates and the canonical name this site's own
    // addresses; nothing loads them.
    ...Array.from(
      document.querySelectorAll('link[href]:not([rel="alternate"]):not([rel="canonical"])'),
      (el) => el.getAttribute('href'),
    ),
  ];
  return urls.filter((url) => /(?:^|[\s,])(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url ?? ''));
}

/** A page's address in each tree, French as the default (ADR-0017). */
export function alternatesOf(ref) {
  return {
    fr: `${SITE_ORIGIN}/${routeOf(ref, 'fr')}`,
    en: `${SITE_ORIGIN}/${routeOf(ref, 'en')}`,
    'x-default': `${SITE_ORIGIN}/${routeOf(ref, 'fr')}`,
  };
}

const OG_LOCALES = { fr: 'fr_FR', en: 'en_GB' };

/** The JSON-LD blocks of a page, parsed; a block that is not JSON is reported. */
function structuredData(document, fail) {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]'), (script) => {
    try {
      return JSON.parse(script.textContent ?? '');
    } catch {
      fail('JSON-LD is not valid JSON');
      return null;
    }
  }).filter(Boolean);
}

/**
 * What a share and a search engine read: the canonical, Open Graph, the
 * Twitter card, schema.org. Each indexable page names itself; the 404 names
 * nothing.
 */
function checkShareHead(document, route, expected) {
  const failures = [];
  const fail = (reason) => failures.push(reason);
  const head = document.head;
  const canonicals = Array.from(head.querySelectorAll('link[rel="canonical"]'), (link) =>
    link.getAttribute('href'),
  );
  const og = (property) =>
    Array.from(head.querySelectorAll('meta[property]'))
      .find((m) => m.getAttribute('property') === property)
      ?.getAttribute('content');
  const meta = (name) =>
    Array.from(head.querySelectorAll('meta[name]'))
      .find((m) => m.getAttribute('name') === name)
      ?.getAttribute('content');
  const data = structuredData(document, fail);

  if (expected.noindex) {
    if (canonicals.length > 0) fail('the 404 names a canonical address');
    if (head.querySelector('meta[property^="og:"]')) fail('the 404 carries Open Graph tags');
    if (meta('twitter:card')) fail('the 404 carries a Twitter card');
    if (data.length > 0) fail('the 404 carries JSON-LD');
    return failures;
  }

  const url = `${SITE_ORIGIN}/${route}`;
  if (canonicals.length !== 1 || canonicals[0] !== url)
    fail(`canonical is ${JSON.stringify(canonicals)}, expected ["${url}"]`);

  const world = ['cgi', 'piece'].includes(expected.ref.page) ? 'cgi' : 'dev';
  const other = expected.locale === 'fr' ? 'en' : 'fr';
  const wanted = {
    'og:site_name': NAME,
    'og:title': squash(document.title),
    'og:description': meta('description'),
    'og:url': url,
    'og:locale': OG_LOCALES[expected.locale],
    'og:locale:alternate': OG_LOCALES[other],
    'og:image': `${SITE_ORIGIN}${OG_IMAGE.file(world, expected.locale)}`,
    'og:image:width': `${OG_IMAGE.width}`,
    'og:image:height': `${OG_IMAGE.height}`,
  };
  for (const [property, value] of Object.entries(wanted)) {
    const found = og(property);
    if (!found || squash(found) !== squash(value))
      fail(`${property} is "${found ?? ''}", expected "${value}"`);
  }
  if (!['website', 'profile'].includes(og('og:type') ?? '')) fail('og:type missing');
  if (!og('og:image:alt')) fail('og:image:alt missing');
  if (meta('twitter:card') !== 'summary_large_image')
    fail('twitter:card is not summary_large_image');

  if (data.length !== 1) {
    fail(`${data.length} JSON-LD blocks, expected 1`);
    return failures;
  }
  const [graph] = data;
  if (graph['@context'] !== 'https://schema.org') fail('JSON-LD has no schema.org context');
  const nodes = graph['@graph'] ?? [graph];
  if (!nodes.some((node) => node.url === url && node.inLanguage === expected.locale))
    fail('JSON-LD does not describe this page in its language');
  if (['dev', 'cgi'].includes(expected.ref.page)) {
    const person = nodes.find((node) => node['@type'] === 'Person');
    if (person?.name !== NAME) fail('JSON-LD has no Person');
    else if (!person.sameAs?.length || !person.sameAs.every((link) => /^https:\/\//.test(link)))
      fail('the Person links to no profile');
  }
  return failures;
}

/** The routes a search engine should list: every page of both trees but the 404. */
export const INDEXABLE = [...EXPECTED]
  .filter(([, expected]) => !expected.noindex && !expected.redirect)
  .map(([route, expected]) => ({ url: `${SITE_ORIGIN}/${route}`, ref: expected.ref }));

/** What is wrong with the sitemap: it lists exactly the indexable pages, with their alternates. */
export function checkSitemap(xml) {
  const failures = [];
  let document;
  try {
    ({ document } = new JSDOM(xml, { contentType: 'text/xml' }).window);
  } catch {
    return ['sitemap.xml is not well-formed XML'];
  }
  const listed = new Map(
    Array.from(document.getElementsByTagName('url'), (url) => [
      url.getElementsByTagName('loc')[0]?.textContent?.trim() ?? '',
      url,
    ]),
  );
  for (const { url, ref } of INDEXABLE) {
    const entry = listed.get(url);
    if (!entry) {
      failures.push(`sitemap.xml misses ${url}`);
      continue;
    }
    listed.delete(url);
    const alternates = Object.fromEntries(
      Array.from(entry.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link'), (link) => [
        link.getAttribute('hreflang'),
        link.getAttribute('href'),
      ]),
    );
    if (JSON.stringify(alternates) !== JSON.stringify(alternatesOf(ref)))
      failures.push(`sitemap.xml: ${url} has alternates ${JSON.stringify(alternates)}`);
    const lastmod = entry.getElementsByTagName('lastmod')[0]?.textContent ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) failures.push(`sitemap.xml: ${url} has no lastmod`);
  }
  for (const url of listed.keys()) failures.push(`sitemap.xml lists ${url}, not an indexable page`);
  return failures;
}

/**
 * What is wrong with robots.txt: it must point at the sitemap and hide no
 * path, since a Disallow line publishes the address it hides.
 */
export function checkRobots(text) {
  const failures = [];
  if (!/^Sitemap: https:\/\/stephane-lieumont\.fr\/sitemap\.xml$/m.test(text))
    failures.push('robots.txt does not point at the sitemap');
  if (/^Disallow:\s*\S/im.test(text)) failures.push('robots.txt disallows a path');
  if (/admin/i.test(text)) failures.push('robots.txt names the back office');
  return failures;
}

const PNG_SIGNATURE = '89504e470d0a1a0a';

/** What is wrong with a share card: a PNG of 1200 × 630, light enough to be fetched. */
export function checkShareCard(file, bytes) {
  if (bytes.subarray(0, 8).toString('hex') !== PNG_SIGNATURE) return [`${file}: not a PNG`];
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const failures = [];
  if (width !== OG_IMAGE.width || height !== OG_IMAGE.height)
    failures.push(`${file}: ${width} × ${height}, expected ${OG_IMAGE.width} × ${OG_IMAGE.height}`);
  if (bytes.length >= 300 * 1024) failures.push(`${file}: ${Math.round(bytes.length / 1024)} KB`);
  return failures;
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
  const wanted = expected.noindex ? {} : alternatesOf(expected.ref);
  if (JSON.stringify(alternates) !== JSON.stringify(wanted))
    fail(`hreflang links are ${JSON.stringify(alternates)}, expected ${JSON.stringify(wanted)}`);

  failures.push(...checkShareHead(document, route, expected));

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
      ...Array.from(document.querySelectorAll('[aria-label], [title], [alt]'), (el) =>
        [el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('alt')].join(' '),
      ),
      document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    ].join(' ');
    for (const french of FRENCH_CHROME) {
      if (said.includes(french)) fail(`French interface text in the English tree: "${french}"`);
    }
    for (const french of FRENCH_CONTENT) {
      if (said.includes(french))
        fail(`French content in the English tree: "${french.slice(0, 50)}"`);
    }
    const words = new Set(said.match(/[\p{L}-]+/gu) ?? []);
    for (const word of FRENCH_WORDS) {
      if (words.has(word)) fail(`French word in the English tree: "${word}"`);
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

  // A link names a page of its own tree, in that tree's words: an English
  // page leading to a French slug, or to a slug no tree has, is a dead end.
  for (const path of pageLinks(document)) {
    if (!PAGES[expected.locale].has(path)) fail(`links to ${path}, not a page of this tree`);
  }

  // A bare fragment resolves against <base href>: on any page but the home it
  // leads to the home page, with a full load. Such a link only works through
  // the click handler Angular binds, which the server marks as a jsaction.
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    if (!/(^|;)click:/.test(link.getAttribute('jsaction') ?? ''))
      fail(
        `${link.getAttribute('href')} resolves against <base href>, and nothing handles its click`,
      );
  }

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
