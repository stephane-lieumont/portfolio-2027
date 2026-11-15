// Each defect below once passed a pattern-matching version of this check, or
// a valid page failed it. Every mutation must be caught; the valid page, and
// equivalent spellings of it, must not be.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkPage } from './prerender-checks.mjs';

const FORM =
  '<form><label>Nom</label><label>Email</label><label>Message</label><button>Envoyer</button></form>';
const FORM_EN =
  '<form><label>Name</label><label>Email</label><label>Message</label><button>Send</button></form>';

const ALTERNATES =
  '<link rel="alternate" hreflang="fr" href="https://stephane-lieumont.fr/contact">' +
  '<link rel="alternate" hreflang="en" href="https://stephane-lieumont.fr/en/contact">' +
  '<link rel="alternate" hreflang="x-default" href="https://stephane-lieumont.fr/contact">';

const page = ({
  lang = 'fr',
  head = '<meta name="description" content="Un projet, une question.">',
  alternates = ALTERNATES,
  html = '',
  main = '',
  h1 = 'Un projet, une question ou juste un Hello World ?',
  lead = 'Je réponds à tout, y compris pour dire non. Par formulaire ou sur LinkedIn, au choix.',
  form = FORM,
  switcher = '<a href="/en/contact" hreflang="en" lang="en" aria-label="English version">EN</a>',
  state = '<script id="ng-state" type="application/json">{}</script>',
} = {}) => `<!doctype html><html lang="${lang}"${html}><head><title>Contact — Stéphane Lieumont</title>${head}${alternates}</head>
<body><app-root ngh="0"><header class="top">${switcher}</header><div class="shell"><main id="contenu"${main}>
<header class="reveal"><h1>${h1}</h1><p>${lead}</p></header>${form}</main></div></app-root>${state}</body></html>`;

const english = (overrides = {}) =>
  page({
    lang: 'en',
    h1: 'A project, a question or just a Hello World?',
    lead: 'I answer everything, even when the answer is no. Through the form or on LinkedIn, as you prefer.',
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
      form: `${FORM_EN}<p>Je réponds à tout, y compris pour dire non. Par formulaire ou sur LinkedIn, au choix.</p>`,
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
      head: '<meta name="description" content="La refonte du parcours d’adhésion en ligne, avec un déploiement automatique en CI/CD.">',
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

describe('the links of a page', () => {
  const links = (...hrefs) => hrefs.map((href) => `<a href="${href}">x</a>`).join('');

  it('pass when every page link names a page of its own tree, in its words', () => {
    const form = `${FORM_EN}${links(
      '/en/3d-art/alien',
      '/en/developer/ledger#video',
      '/en/developer',
      '#contenu',
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
