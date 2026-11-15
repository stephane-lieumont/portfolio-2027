// Each defect below once passed a pattern-matching version of this check, or
// a valid page failed it. Every mutation must be caught; the valid page, and
// equivalent spellings of it, must not be.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkPage } from './prerender-checks.mjs';

const FORM =
  '<form><label>Nom</label><label>Email</label><label>Message</label><button>Envoyer</button></form>';

const page = ({
  head = '<meta name="description" content="Un projet, une question.">',
  html = '',
  main = '',
  h1 = 'Un projet, une question ou juste un Hello World ?',
  lead = 'Je réponds à tout, y compris pour dire non.',
  form = FORM,
  state = '<script id="ng-state" type="application/json">{}</script>',
} = {}) => `<!doctype html><html lang="fr"${html}><head><title>Contact — Stéphane Lieumont</title>${head}</head>
<body><app-root ngh="0"><div class="shell"><main id="contenu"${main}>
<header class="reveal"><h1>${h1}</h1><p>${lead}</p></header>${form}</main></div></app-root>${state}</body></html>`;

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
  caught('for a route the site does not have', 'nulle-part', page());
});
