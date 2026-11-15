import type { ContactMessage } from '@portfolio/shared-types/contact';

export interface ContactMail {
  subject: string;
  text: string;
  html: string;
}

// The site's « Bascule » palette, inlined: mail clients ignore stylesheets.
const INK = '#12100f';
const ORANGE = '#f2a154';
const MUTED = '#5c5652';
const SERIF = "'Instrument Serif', Georgia, 'Times New Roman', serif";
const MONO = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

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
    .join('<br /><br />');
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
    'Envoyé depuis le formulaire de contact de stephane-lieumont.fr',
    '',
  ].join('\n');

  // Tables, cell padding and longhand properties only: the shapes every mail
  // client renders (Mailpit's HTML check, 2026-11-15). No style on <body>.
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
<tr><td align="center" style="padding-top: 24px; padding-right: 16px; padding-bottom: 24px; padding-left: 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
  <tr>
    <td style="padding-bottom: 14px; font-family: ${MONO}; font-size: 11px; line-height: 16px; letter-spacing: 0.14em; color: ${MUTED};">STÉPHANE LIEUMONT · PORTFOLIO</td>
  </tr>
  <tr>
    <td style="padding-bottom: 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="32" height="3" bgcolor="${ORANGE}" style="font-size: 1px; line-height: 3px;">&nbsp;</td></tr></table></td>
  </tr>
  <tr>
    <td style="font-family: ${SANS}; font-size: 30px; line-height: 36px; font-weight: 600; letter-spacing: -0.02em; color: ${INK};">Message de <span style="font-family: ${SERIF}; font-style: italic; font-weight: 400;">${escapeHtml(name)}</span></td>
  </tr>
  <tr>
    <td style="padding-top: 8px; padding-bottom: 28px; font-family: ${SANS}; font-size: 14px; line-height: 20px; color: ${MUTED};"><a href="mailto:${escapeHtml(message.email)}" style="color: ${INK}; text-decoration: underline;">${escapeHtml(message.email)}</a> · ${escapeHtml(date)}</td>
  </tr>
  <tr>
    <td style="padding-top: 4px; padding-left: 16px; border-left: 3px solid ${ORANGE}; font-family: ${SANS}; font-size: 15px; line-height: 24px; color: ${INK};">${paragraphsOf(message.message)}</td>
  </tr>
  <tr>
    <td style="padding-top: 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-top: 12px; border-top: 1px solid #e6e1dc; font-family: ${MONO}; font-size: 11px; line-height: 16px; letter-spacing: 0.08em; color: ${MUTED};">stephane-lieumont.fr — formulaire de contact</td></tr></table></td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>
`;

  return { subject, text, html };
}
