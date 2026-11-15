import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { escapeHtml, renderContactMail } from './contact-mail.ts';

const SENT_AT = new Date('2026-11-15T17:30:00Z');

describe('renderContactMail', () => {
  it('names the sender in the subject, on one line', () => {
    const mail = renderContactMail(
      { name: 'Ada\r\nBcc: x@example.com', email: 'ada@example.org', message: 'Bonjour' },
      SENT_AT,
    );
    assert.equal(mail.subject, 'Portfolio — nouveau message de Ada Bcc: x@example.com');
  });

  it('gives a plain-text version with the sender, the date and the message', () => {
    const mail = renderContactMail(
      { name: 'Ada Lovelace', email: 'ada@example.org', message: 'Bonjour\n\nÀ bientôt' },
      SENT_AT,
    );
    assert.match(mail.text, /De : Ada Lovelace <ada@example\.org>/);
    assert.match(mail.text, /Reçu le : dimanche 15 novembre 2026 à 18:30/);
    assert.match(mail.text, /Bonjour\n\nÀ bientôt/);
  });

  it('keeps the visitor’s paragraphs and line breaks in the HTML version', () => {
    const { html } = renderContactMail(
      { name: 'Ada', email: 'ada@example.org', message: 'Ligne 1\nLigne 2\n\nParagraphe 2' },
      SENT_AT,
    );
    assert.match(html, /Ligne 1<br \/>Ligne 2<br \/><br \/>Paragraphe 2/);
  });

  it('escapes everything the visitor wrote', () => {
    const { html } = renderContactMail(
      {
        name: '<b>Ada</b>',
        email: 'a"onmouseover="x@example.org',
        message: '<script>alert(1)</script> & co',
      },
      SENT_AT,
    );
    assert.doesNotMatch(html, /<script>|<b>Ada/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; co/);
    assert.doesNotMatch(html, /a"onmouseover/);
  });

  it('escapes the five HTML-significant characters', () => {
    assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  });
});
