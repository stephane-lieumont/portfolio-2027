import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';

import { cspInlineScriptsConf, inlineScriptHashes } from './csp-hashes.mjs';

const hash = (source) => `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;
const page = (head, body = '') =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

describe('the inline script of a page', () => {
  it('is hashed as written, whitespace included, as the browser hashes it', () => {
    const source = '\n      document.documentElement.classList.add("js");\n    ';
    assert.deepEqual(inlineScriptHashes(page(`<script>${source}</script>`)).scripts, [
      hash(source),
    ]);
  });

  it('leaves out data the browser never runs, and external files', () => {
    const html = page(
      '<script type="application/ld+json">{"@context":"https://schema.org"}</script>' +
        '<script id="ng-state" type="application/json">{}</script>' +
        '<script src="main-AFR3BTVL.js" type="module"></script>',
    );
    assert.deepEqual(inlineScriptHashes(html).scripts, []);
  });

  it('counts Angular’s typed event contract as a script', () => {
    const html = page('', '<script type="text/javascript" id="contract">(()=>{})()</script>');
    assert.deepEqual(inlineScriptHashes(html).scripts, [hash('(()=>{})()')]);
  });

  it('hashes an event-handler attribute apart from the scripts', () => {
    const html = page(
      `<link rel="stylesheet" href="s.css" media="print" onload="this.media='all'">`,
    );
    assert.deepEqual(inlineScriptHashes(html), {
      scripts: [],
      handlers: [hash("this.media='all'")],
    });
  });
});

describe('the nginx include', () => {
  it('merges every page’s hashes once each', () => {
    const conf = cspInlineScriptsConf([
      { scripts: ["'sha256-b'", "'sha256-a'"], handlers: [] },
      { scripts: ["'sha256-a'"], handlers: [] },
    ]);
    assert.ok(conf.includes(`default "'sha256-a' 'sha256-b'";`));
  });

  it('names unsafe-hashes only alongside a handler’s hash', () => {
    const without = cspInlineScriptsConf([{ scripts: ["'sha256-a'"], handlers: [] }]);
    assert.ok(!without.includes('unsafe-hashes'));
    const withHandler = cspInlineScriptsConf([{ scripts: [], handlers: ["'sha256-h'"] }]);
    assert.ok(withHandler.includes(`default "'unsafe-hashes' 'sha256-h'";`));
  });
});
