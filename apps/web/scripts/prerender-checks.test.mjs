// Each defect below once passed a pattern-matching version of this check, or
// a valid page failed it. Every mutation must be caught; the valid page, and
// equivalent spellings of it, must not be.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkPage } from './prerender-checks.mjs';

const page = ({
  head = '<meta name="description" content="Un projet, une question.">',
  html = '',
  main = '',
  h1 = 'Un projet, une question ou juste un Hello World ?',
  lead = 'Je réponds à tout, y compris pour dire non.',
  state = '<script id="ng-state" type="application/json">{}</script>',
} = {}) => `<!doctype html><html lang="fr"${html}><head><title>Contact — Stéphane Lieumont</title>${head}</head>
<body><app-root ngh="0"><div class="shell"><main id="contenu"${main}>
<header class="reveal"><h1>${h1}</h1><p>${lead}</p></header></main></div></app-root>${state}</body></html>`;

describe('a prerendered page', () => {
  it('passes when complete', () => {
    assert.deepEqual(checkPage('contact', page()), []);
  });

  it('reads the heading as text, nested markup included', () => {
    const h1 = '<span>Un projet,</span> une question <em>ou juste un Hello World ?</em>';
    assert.deepEqual(checkPage('contact', page({ h1 })), []);
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
  caught('when the heading is gone', 'contact', page({ h1: '' }));
  caught('when the reveal is stamped anywhere', 'contact', page({ main: ' data-reveal-ready' }));
  caught('when the script flag is baked in', 'contact', page({ html: ' class="js-motion"' }));
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
