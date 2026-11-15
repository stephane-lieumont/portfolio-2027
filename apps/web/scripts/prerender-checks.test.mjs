// Each defect below once passed a pattern-matching version of this check, or
// a valid page failed it. Every mutation must be caught; the valid page, and
// equivalent spellings of it, must not be.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  EXPECTED,
  INDEXABLE,
  alternatesOf,
  checkPage,
  checkRobots,
  checkShareCard,
  checkSitemap,
} from './prerender-checks.mjs';
import { robotsTxt, sitemapXml } from './seo-files.mjs';

const FORM =
  '<form><label>Nom</label><label>Email</label><label>Message</label><button>Envoyer</button></form>';
const FORM_EN =
  '<form><label>Name</label><label>Email</label><label>Message</label><button>Send</button></form>';

const ALTERNATES =
  '<link rel="alternate" hreflang="fr" href="https://stephane-lieumont.fr/contact">' +
  '<link rel="alternate" hreflang="en" href="https://stephane-lieumont.fr/en/contact">' +
  '<link rel="alternate" hreflang="x-default" href="https://stephane-lieumont.fr/contact">';

/** The canonical, Open Graph, Twitter and JSON-LD of the contact page, as the build writes them. */
const shareHead = (lang, description, overrides = {}) => {
  const url = `https://stephane-lieumont.fr/${lang === 'en' ? 'en/' : ''}contact`;
  const tags = {
    'og:type': 'website',
    'og:site_name': 'Stéphane Lieumont',
    'og:title': 'Contact — Stéphane Lieumont',
    'og:description': description,
    'og:url': url,
    'og:locale': lang === 'en' ? 'en_GB' : 'fr_FR',
    'og:locale:alternate': lang === 'en' ? 'fr_FR' : 'en_GB',
    'og:image': `https://stephane-lieumont.fr/og/dev-${lang}.png`,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': 'Stéphane Lieumont, Lead Tech',
    ...overrides.og,
  };
  const data = overrides.data ?? {
    '@context': 'https://schema.org',
    '@graph': [{ '@type': 'ContactPage', url, inLanguage: lang }],
  };
  return [
    overrides.canonical ?? `<link rel="canonical" href="${url}">`,
    ...Object.entries(tags)
      .filter(([, content]) => content !== undefined)
      .map(([property, content]) => `<meta property="${property}" content="${content}">`),
    overrides.twitter ?? '<meta name="twitter:card" content="summary_large_image">',
    overrides.script ?? `<script type="application/ld+json">${JSON.stringify(data)}</script>`,
  ].join('');
};

const descriptionIn = (head) =>
  /name="description" content="([^"]*)"|content="([^"]*)" name="description"/
    .exec(head)
    ?.slice(1)
    .find(Boolean);

const page = ({
  lang = 'fr',
  head = '<meta name="description" content="Un projet, une question.">',
  seo = shareHead(lang, descriptionIn(head)),
  alternates = ALTERNATES,
  html = '',
  main = '',
  h1 = 'Un projet, une question ou juste un Hello World ?',
  lead = 'Une idée à confronter, un retour d’expérience ou simplement l’envie d’échanger\u00a0: écrivez-moi ici ou sur LinkedIn.',
  form = FORM,
  switcher = '<a href="/en/contact" hreflang="en" lang="en" aria-label="English version">EN</a>',
  state = '<script id="ng-state" type="application/json">{}</script>',
} = {}) => `<!doctype html><html lang="${lang}"${html}><head><title>Contact — Stéphane Lieumont</title>${head}${alternates}${seo}</head>
<body><app-root ngh="0"><header class="top">${switcher}</header><div class="shell"><main id="contenu"${main}>
<header class="reveal"><h1>${h1}</h1><p>${lead}</p></header>${form}</main></div></app-root>${state}</body></html>`;

const english = (overrides = {}) =>
  page({
    lang: 'en',
    h1: 'A project, a question or just a Hello World?',
    lead: 'An idea to challenge, experience to compare or just a chat: write to me here or on LinkedIn.',
    form: FORM_EN,
    switcher: '<a href="/contact" hreflang="fr" lang="fr" aria-label="Version française">FR</a>',
    ...overrides,
  });

describe('a prerendered page', () => {
  it('passes when complete', () => {
    assert.deepEqual(checkPage('contact', page()), []);
  });

  it('reads the heading as text, nested markup included', () => {
    const h1 = '<span>Un projet,</span> une question <em>ou juste un Hello World ?</em>';
    assert.deepEqual(checkPage('contact', page({ h1 })), []);
  });

  it('reads the heading as spoken, letters split for an entrance included', () => {
    const h1 =
      '<span class="visually-hidden">Un projet, une question ou juste un Hello World ?</span>' +
      '<span aria-hidden="true"><span>U</span><span>n</span> <span>p</span></span>';
    assert.deepEqual(checkPage('contact', page({ h1 })), []);
  });

  it('reads a heading named by its aria-label', () => {
    const html = page({ h1: '<span aria-hidden="true">U n</span>' }).replace(
      '<h1>',
      '<h1 aria-label="Un projet, une question ou juste un Hello World ?">',
    );
    assert.deepEqual(checkPage('contact', html), []);
  });

  it('accepts media from this host', () => {
    const form = `${FORM}<img src="/medias/a.jpg" srcset="/medias/a-640.webp 640w" alt="a">`;
    assert.deepEqual(checkPage('contact', page({ form })), []);
  });

  it('reads attributes in any order', () => {
    const head = '<meta content="Un projet." name="description">';
    assert.deepEqual(checkPage('contact', page({ head })), []);
  });

  const caught = (name, route, html) =>
    it(`fails ${name}`, () => assert.notDeepEqual(checkPage(route, html), []));

  caught('when the content is hidden by an attribute', 'contact', page({ main: ' hidden' }));
  caught('when the content is hidden by style', 'contact', page({ main: ' style="opacity:0"' }));
  caught(
    'when the content is hidden by style, spaced',
    'contact',
    page({ main: ' style="color: red; opacity: 0"' }),
  );
  caught('when the lead is gone', 'contact', page({ lead: '' }));
  caught('when the form is gone', 'contact', page({ form: '' }));
  caught('when the heading is gone', 'contact', page({ h1: '' }));
  caught('when the reveal is stamped anywhere', 'contact', page({ main: ' data-reveal-ready' }));
  caught('when the script flag is baked in', 'contact', page({ html: ' class="js-motion"' }));
  caught(
    'when a mailto is published',
    'contact',
    page({ form: `${FORM}<a href="MAILTO:x@y.fr">Écrire</a>` }),
  );
  caught(
    'when a video player is in the HTML',
    'contact',
    page({ form: `${FORM}<iframe src="https://www.youtube-nocookie.com/embed/x"></iframe>` }),
  );
  caught(
    'when an image comes from another origin, protocol-relative',
    'contact',
    page({ form: `${FORM}<img src="//i.ytimg.com/vi/x/hqdefault.jpg" alt="x">` }),
  );
  caught(
    'when a candidate of a srcset comes from another origin',
    'contact',
    page({
      form: `${FORM}<img src="/a.jpg" srcset="/a.webp 1x, https://cdn.x/a.webp 2x" alt="a">`,
    }),
  );
  caught(
    'when a stylesheet comes from another origin',
    'contact',
    page({
      head: '<meta name="description" content="x"><link rel="stylesheet" href="https://fonts.googleapis.com/css2">',
    }),
  );
  caught('without hydration state', 'contact', page({ state: '' }));
  caught('without hydration annotations', 'contact', page().replace(' ngh="0"', ''));
  caught('without a description', 'contact', page({ head: '' }));
  caught(
    'when an indexable page says noindex, attributes swapped',
    'contact',
    page({ head: '<meta name="description" content="x"><meta content="noindex" name="robots">' }),
  );
  caught('when the 404 is indexable', '404', page({ h1: 'Page introuvable', lead: 'Erreur 404' }));
  caught('when the root renders a page instead of redirecting', '', page());
  caught(
    'when the root redirects elsewhere',
    '',
    '<html><head><meta http-equiv="refresh" content="0; url=/"></head></html>',
  );

  it('passes the root when it redirects to the developer world', () => {
    const html =
      '<html><head><meta http-equiv="refresh" content="0; url=/developpeur"></head></html>';
    assert.deepEqual(checkPage('', html), []);
  });

  it('passes the English root when it redirects to the English developer world', () => {
    const html =
      '<html><head><meta http-equiv="refresh" content="0; url=/en/developer"></head></html>';
    assert.deepEqual(checkPage('en', html), []);
  });
  caught(
    'when the English root redirects to the French tree',
    'en',
    '<html><head><meta http-equiv="refresh" content="0; url=/developpeur"></head></html>',
  );
  caught('for a route the site does not have', 'nulle-part', page());
});

describe('a page in either tree', () => {
  it('passes in English when complete, its copy in English', () => {
    assert.deepEqual(checkPage('en/contact', english()), []);
  });

  it('passes a 404 that names no alternate', () => {
    const notFound = (lang, h1, eyebrow, switcher) =>
      page({
        lang,
        h1,
        lead: eyebrow,
        form: '',
        alternates: '',
        seo: '',
        switcher,
        head: '<meta name="robots" content="noindex">',
      });
    assert.deepEqual(
      checkPage(
        '404',
        notFound(
          'fr',
          'Mais où est l’interphone ?',
          'Erreur 404',
          '<a href="/en/developer" hreflang="en" lang="en">EN</a>',
        ),
      ),
      [],
    );
    assert.deepEqual(
      checkPage(
        'en/404',
        notFound(
          'en',
          'Where is the intercom?',
          'Error 404',
          '<a href="/developpeur" hreflang="fr" lang="fr">FR</a>',
        ),
      ),
      [],
    );
  });

  const caught = (name, route, html) =>
    it(`fails ${name}`, () => assert.notDeepEqual(checkPage(route, html), []));

  caught('when the English tree says it is French', 'en/contact', english({ lang: 'fr' }));
  caught('when the French tree says it is English', 'contact', page({ lang: 'en' }));
  caught('without hreflang links', 'contact', page({ alternates: '' }));
  caught(
    'when x-default points at the English page',
    'contact',
    page({ alternates: ALTERNATES.replace(/(x-default" href="[^"]+)\/contact/, '$1/en/contact') }),
  );
  caught('without a language switch', 'contact', page({ switcher: '' }));
  caught(
    'when the switch leads to another page',
    'en/contact',
    english({ switcher: '<a href="/developpeur" hreflang="fr" lang="fr">FR</a>' }),
  );
  caught(
    'when the switch stays in its own tree',
    'contact',
    page({ switcher: '<a href="/contact" hreflang="en" lang="en">EN</a>' }),
  );
  caught('when the English form keeps a French label', 'en/contact', english({ form: FORM }));
  caught(
    'when the English page keeps the French heading',
    'en/contact',
    english({ h1: 'Un projet, une question ou juste un Hello World ?' }),
  );
  caught(
    'when French copy sits beside the English, the English heading and lead intact',
    'en/contact',
    english({
      form: `${FORM_EN}<p>Une idée à confronter, un retour d’expérience ou simplement l’envie d’échanger\u00a0: écrivez-moi ici ou sur LinkedIn.</p>`,
    }),
  );
  caught(
    'when a French alt text reaches the English tree',
    'en/contact',
    english({
      form: `${FORM_EN}<img src="/images/p.png" alt="Stéphane Lieumont, pensif, la main au menton">`,
    }),
  );
  caught(
    'when the English page is described in French',
    'en/contact',
    english({
      head: '<meta name="description" content="La refonte du parcours d’adhésion en ligne, en React et TypeScript. Référent technique de la squad Web-Atrio, j’ai aussi automatisé le déploiement en CI/CD.">',
    }),
  );
  caught(
    'when one French word of the content is left in an English sentence',
    'en/contact',
    english({
      form: `${FORM_EN}<p>The same living room rendered de jour et de nuit, éclairage.</p>`,
    }),
  );
  caught(
    'when a French accessible name reaches the English tree',
    'en/contact',
    english({ form: `${FORM_EN}<a href="/x" aria-label="Télécharger mon CV (PDF)">x</a>` }),
  );
});

describe('a link to a fragment', () => {
  const skip = (attributes) => `${FORM}<a href="#contenu"${attributes}>Aller au contenu</a>`;

  it('passes when its click is handled', () => {
    assert.deepEqual(checkPage('contact', page({ form: skip(' jsaction="click:;"') })), []);
  });

  it('fails when nothing handles it, since <base href> would send it to the home page', () => {
    assert.notDeepEqual(checkPage('contact', page({ form: skip('') })), []);
    assert.notDeepEqual(checkPage('contact', page({ form: skip(' jsaction="mouseenter:;"') })), []);
  });
});

describe('the links of a page', () => {
  const links = (...hrefs) => hrefs.map((href) => `<a href="${href}">x</a>`).join('');

  it('pass when every page link names a page of its own tree, in its words', () => {
    const form = `${FORM_EN}${links(
      '/en/3d-art/alien',
      '/en/developer/ledger#video',
      '/en/developer',
      '/cv-stephane-lieumont.pdf',
      '/demo/casetespotes-landingpage',
      'https://github.com/stephane-lieumont',
    )}`;
    assert.deepEqual(checkPage('en/contact', english({ form })), []);
    assert.deepEqual(
      checkPage('contact', page({ form: `${FORM}${links('/graphisme-3d/extraterrestre')}` })),
      [],
    );
  });

  const caught = (name, route, html) =>
    it(`fail ${name}`, () => assert.notDeepEqual(checkPage(route, html), []));

  caught(
    'when an English tile keeps the French slug',
    'en/contact',
    english({ form: `${FORM_EN}${links('/en/3d-art/extraterrestre')}` }),
  );
  caught(
    'when an English card names a project the site no longer has',
    'en/contact',
    english({ form: `${FORM_EN}${links('/en/developer/pixmodels')}` }),
  );
  caught(
    'when an English page links into the French tree outside the switch',
    'en/contact',
    english({ form: `${FORM_EN}${links('/developpeur')}` }),
  );
  caught(
    'when a French page links an English slug',
    'contact',
    page({ form: `${FORM}${links('/graphisme-3d/alien')}` }),
  );
  caught(
    'when a French page links into the English tree outside the switch',
    'contact',
    page({ form: `${FORM}${links('/en/contact')}` }),
  );
});

describe('the French denylists', () => {
  it('hold the content no English page may say, and never an English string', async () => {
    const { FRENCH_CONTENT, FRENCH_WORDS } = await import('./prerender-checks.mjs');
    assert.ok(FRENCH_CONTENT.includes('Sans école, avant le développement.'));
    assert.ok(FRENCH_CONTENT.includes('Lego : les Minions'));
    assert.ok(FRENCH_WORDS.includes('éclairage'));
    // Shared values are English too: a proper name or a tool list is not French.
    assert.ok(!FRENCH_CONTENT.includes('Escart Wild'));
    assert.ok(!FRENCH_CONTENT.includes('3ds Max, ZBrush'));
    assert.ok(!FRENCH_WORDS.includes('Stéphane'));
  });
});

describe('what a page tells search engines and shares', () => {
  const caught = (name, route, html) =>
    it(`fails ${name}`, () => assert.notDeepEqual(checkPage(route, html), []));
  const french = (overrides) =>
    page({ seo: shareHead('fr', 'Un projet, une question.', overrides) });

  it('passes in both trees, each naming its own card and locale', () => {
    assert.deepEqual(checkPage('contact', french()), []);
    assert.deepEqual(checkPage('en/contact', english()), []);
  });

  caught('without a canonical', 'contact', french({ canonical: '' }));
  caught(
    'when the canonical names the other tree',
    'contact',
    french({ canonical: '<link rel="canonical" href="https://stephane-lieumont.fr/en/contact">' }),
  );
  caught(
    'when the canonical is on www',
    'contact',
    french({ canonical: '<link rel="canonical" href="https://www.stephane-lieumont.fr/contact">' }),
  );
  caught(
    'with two canonicals',
    'contact',
    french({
      canonical: '<link rel="canonical" href="https://stephane-lieumont.fr/contact">'.repeat(2),
    }),
  );
  caught(
    'when og:url is not the canonical',
    'contact',
    french({ og: { 'og:url': 'https://stephane-lieumont.fr/developpeur' } }),
  );
  caught(
    'when og:image is the broken one of the current site',
    'contact',
    french({ og: { 'og:image': '//preview.jpg' } }),
  );
  caught(
    'when the English page shares the French card',
    'en/contact',
    english({
      head: '<meta name="description" content="x">',
      seo: shareHead('en', 'x', {
        og: { 'og:image': 'https://stephane-lieumont.fr/og/dev-fr.png' },
      }),
    }),
  );
  caught('when og:locale is not the tree’s', 'contact', french({ og: { 'og:locale': 'en_GB' } }));
  caught('without og:title', 'contact', french({ og: { 'og:title': undefined } }));
  caught(
    'when og:description says something else than the description',
    'contact',
    french({ og: { 'og:description': 'Autre chose.' } }),
  );
  caught('without the image size', 'contact', french({ og: { 'og:image:width': undefined } }));
  caught('without an image alt', 'contact', french({ og: { 'og:image:alt': undefined } }));
  caught('without a Twitter card', 'contact', french({ twitter: '' }));
  caught('without JSON-LD', 'contact', french({ script: '' }));
  caught(
    'when the JSON-LD does not parse',
    'contact',
    french({
      script: '<script type="application/ld+json">{"@context": "https://schema.org",}</script>',
    }),
  );
  caught(
    'when the JSON-LD describes another page',
    'contact',
    french({
      data: {
        '@context': 'https://schema.org',
        '@graph': [{ url: 'https://stephane-lieumont.fr/developpeur', inLanguage: 'fr' }],
      },
    }),
  );
  caught(
    'when the JSON-LD gives the French page in English',
    'contact',
    french({
      data: {
        '@context': 'https://schema.org',
        '@graph': [{ url: 'https://stephane-lieumont.fr/contact', inLanguage: 'en' }],
      },
    }),
  );

  const notFound = (seo) =>
    page({
      h1: 'Mais où est l’interphone ?',
      lead: 'Erreur 404',
      form: '',
      alternates: '',
      seo,
      switcher: '<a href="/en/developer" hreflang="en" lang="en">EN</a>',
      head: '<meta name="robots" content="noindex">',
    });
  caught(
    'when the 404 names a canonical',
    '404',
    notFound('<link rel="canonical" href="https://stephane-lieumont.fr/404">'),
  );
  caught(
    'when the 404 carries og:url',
    '404',
    notFound('<meta property="og:url" content="https://stephane-lieumont.fr/404">'),
  );
  caught(
    'when the 404 carries JSON-LD',
    '404',
    notFound('<script type="application/ld+json">{}</script>'),
  );

  // A world page describes the person, from what the site already shows.
  const world = (person) => {
    const expected = EXPECTED.get('developpeur');
    const url = 'https://stephane-lieumont.fr/developpeur';
    const alternates = Object.entries(alternatesOf(expected.ref))
      .map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`)
      .join('');
    const seo = shareHead('fr', 'x', {
      og: {
        'og:type': 'profile',
        'og:url': url,
        'og:title': 'Lead Tech — Stéphane Lieumont',
        'og:image': 'https://stephane-lieumont.fr/og/dev-fr.png',
      },
      canonical: `<link rel="canonical" href="${url}">`,
      data: {
        '@context': 'https://schema.org',
        '@graph': [{ '@type': 'ProfilePage', url, inLanguage: 'fr' }, ...(person ? [person] : [])],
      },
    });
    return `<!doctype html><html lang="fr"><head><title>Lead Tech — Stéphane Lieumont</title>
<meta name="description" content="x">${alternates}${seo}</head><body><app-root ngh="0">
<header><a href="/en/developer" hreflang="en" lang="en">EN</a></header><main>
<h1>Stéphane Lieumont</h1>${expected.text.map((line) => `<p>${line}</p>`).join('')}</main>
</app-root><script id="ng-state" type="application/json">{}</script></body></html>`;
  };
  const person = {
    '@type': 'Person',
    name: 'Stéphane Lieumont',
    sameAs: ['https://github.com/stephane-lieumont'],
  };

  it('passes a world page that describes the person', () => {
    assert.deepEqual(checkPage('developpeur', world(person)), []);
  });
  caught('when a world page describes no person', 'developpeur', world(null));
  caught('when the person links to no profile', 'developpeur', world({ ...person, sameAs: [] }));
});

describe('the sitemap', () => {
  const entries = INDEXABLE.map(({ url, ref }) => ({
    loc: url,
    alternates: Object.entries(alternatesOf(ref)).map(([hreflang, href]) => ({ hreflang, href })),
  }));
  const valid = sitemapXml(entries, '2026-11-15');

  it('passes when it lists every indexable page of both trees with its alternates', () => {
    assert.deepEqual(checkSitemap(valid), []);
    assert.ok(INDEXABLE.some(({ url }) => url === 'https://stephane-lieumont.fr/en/3d-art/alien'));
    assert.ok(!INDEXABLE.some(({ url }) => /\/404$|\/en$|\.fr\/$/.test(url)));
  });

  const caught = (name, xml) =>
    it(`fails ${name}`, () => assert.notDeepEqual(checkSitemap(xml), []));

  caught('when a page is missing', sitemapXml(entries.slice(1), '2026-11-15'));
  caught(
    'when it lists the 404',
    sitemapXml(
      [...entries, { loc: 'https://stephane-lieumont.fr/404', alternates: [] }],
      '2026-11-15',
    ),
  );
  caught(
    'when an entry loses its English alternate',
    sitemapXml(
      entries.map((entry, i) =>
        i === 0
          ? { ...entry, alternates: entry.alternates.filter((a) => a.hreflang !== 'en') }
          : entry,
      ),
      '2026-11-15',
    ),
  );
  caught('without a date', sitemapXml(entries, ''));
  caught('when it is not XML', valid.replace('</urlset>', ''));
});

describe('robots.txt', () => {
  it('passes as the build writes it', () => {
    assert.deepEqual(checkRobots(robotsTxt()), []);
  });

  const caught = (name, text) =>
    it(`fails ${name}`, () => assert.notDeepEqual(checkRobots(text), []));

  caught('without the sitemap', 'User-agent: *\nAllow: /\n');
  caught('when the sitemap is on www', robotsTxt().replace('https://', 'https://www.'));
  caught('when it reveals the back office', `${robotsTxt()}Disallow: /admin\n`);
  caught('when it hides any path', `${robotsTxt()}Disallow: /private\n`);
});

describe('a share card', () => {
  const png = (width, height, size = 1024) => {
    const bytes = Buffer.alloc(size);
    Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes);
    bytes.writeUInt32BE(width, 16);
    bytes.writeUInt32BE(height, 20);
    return bytes;
  };

  it('passes as a 1200 × 630 PNG under 300 KB', () => {
    assert.deepEqual(checkShareCard('og/dev-fr.png', png(1200, 630)), []);
  });
  it('fails at another size', () => {
    assert.notDeepEqual(checkShareCard('og/dev-fr.png', png(1200, 628)), []);
  });
  it('fails when too heavy to be fetched', () => {
    assert.notDeepEqual(checkShareCard('og/dev-fr.png', png(1200, 630, 300 * 1024)), []);
  });
  it('fails when it is not a PNG', () => {
    assert.notDeepEqual(checkShareCard('og/dev-fr.png', Buffer.from('ffd8ffe0', 'hex')), []);
  });
});
