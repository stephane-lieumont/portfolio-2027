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
    .map((paragraph) => `<p style="margin: 0 0 12px;">${paragraph}</p>`)
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
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px 16px; background: #ffffff; font: 400 15px/1.6 ${SANS}; color: ${INK};">
<div style="max-width: 600px; margin: 0 auto;">
  <p style="margin: 0 0 20px; padding-bottom: 10px; border-bottom: 3px solid ${ORANGE}; font: 600 15px/1.3 ${SANS};">Stéphane Lieumont <span style="font-weight: 400; color: ${MUTED};">— portfolio</span></p>
  <p style="margin: 0;"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(message.email)}&gt;</p>
  <p style="margin: 0 0 20px; font-size: 13px; color: ${MUTED};">${escapeHtml(date)}</p>
  <div style="border-left: 3px solid ${ORANGE}; padding: 4px 0 4px 16px;">${paragraphsOf(message.message)}</div>
  <p style="margin: 24px 0 0; padding-top: 10px; border-top: 1px solid #e6e3df; font-size: 12px; color: ${MUTED};">Envoyé depuis le formulaire de contact de stephane-lieumont.fr. Répondre à ce mail écrit directement à ${escapeHtml(name)}.</p>
</div>
</body>
</html>
`;

  return { subject, text, html };
}
