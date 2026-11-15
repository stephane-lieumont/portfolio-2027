import type { ContactMessage } from '@portfolio/shared-types/contact';

export interface ContactMail {
  subject: string;
  text: string;
  html: string;
}

// The site's « Bascule » palette, inlined: mail clients ignore stylesheets.
const INK = '#12100f';
const ORANGE = '#f2a154';
const PAPER = '#f6f5f3';
const MUTED = '#5c5652';
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', Menlo, Consolas, monospace";

const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

function paragraphsOf(message: string): string {
  return message
    .split(/\n{2,}/)
    .map((paragraph) => escapeHtml(paragraph).replace(/\n/g, '<br />'))
    .map((paragraph) => `<p style="margin: 0 0 14px;">${paragraph}</p>`)
    .join('');
}

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date);

export function renderContactMail(message: ContactMessage, sentAt: Date): ContactMail {
  // A name with line breaks would otherwise split the subject header.
  const name = message.name.replace(/\s+/g, ' ');
  const subject = `Portfolio — nouveau message de ${name}`;
  const date = formatDate(sentAt);

  const text = [
    subject,
    '',
    `De : ${name} <${message.email}>`,
    `Reçu le : ${date}`,
    '',
    message.message,
    '',
    '—',
    'Envoyé depuis le formulaire de contact de stephane-lieumont.fr.',
    `Répondre à ce mail écrit directement à ${name}.`,
    '',
  ].join('\n');

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background: ${PAPER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${PAPER};">
<tr><td align="center" style="padding: 32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e6e3df;">
  <tr>
    <td style="background: ${ORANGE}; padding: 22px 32px;">
      <p style="margin: 0; font: 500 11px/1.2 ${MONO}; letter-spacing: 0.12em; text-transform: uppercase; color: ${INK};">Lead Tech &amp; Graphiste 3D</p>
      <p style="margin: 6px 0 0; font: 600 20px/1.2 ${SANS}; color: ${INK};">Stéphane Lieumont</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 32px 32px 8px;">
      <p style="margin: 0 0 8px; font: 500 11px/1.2 ${MONO}; letter-spacing: 0.12em; text-transform: uppercase; color: ${MUTED};">Nouveau message</p>
      <h1 style="margin: 0; font: 600 24px/1.25 ${SANS}; color: ${INK};">${escapeHtml(name)}</h1>
      <p style="margin: 8px 0 0; font: 400 15px/1.5 ${SANS};"><a href="mailto:${escapeHtml(message.email)}" style="color: ${INK}; text-decoration: underline; text-decoration-color: ${ORANGE}; text-underline-offset: 3px;">${escapeHtml(message.email)}</a></p>
      <p style="margin: 4px 0 0; font: 400 13px/1.5 ${SANS}; color: ${MUTED};">${escapeHtml(date)}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 16px 32px 32px;">
      <div style="border-left: 4px solid ${ORANGE}; background: ${PAPER}; border-radius: 0 12px 12px 0; padding: 20px 22px 6px; font: 400 16px/1.6 ${SANS}; color: ${INK};">${paragraphsOf(message.message)}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 24px;"><tr>
        <td style="background: ${INK}; border-radius: 999px;"><a href="mailto:${escapeHtml(message.email)}?subject=${encodeURIComponent('Re: ' + subject)}" style="display: inline-block; padding: 12px 22px; font: 500 14px/1 ${SANS}; color: #ffffff; text-decoration: none;">Répondre à ${escapeHtml(name)}</a></td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="border-top: 1px solid #e6e3df; padding: 18px 32px; font: 400 12px/1.5 ${SANS}; color: ${MUTED};">
      Envoyé depuis le formulaire de contact de <a href="https://stephane-lieumont.fr" style="color: ${MUTED};">stephane-lieumont.fr</a>.<br />
      Répondre à ce mail écrit directement à ${escapeHtml(name)}.
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>
`;

  return { subject, text, html };
}
