import { type Page, type Route } from '@playwright/test';

import { CAPTCHA_TOKEN, expect, open, test } from '../support/fixtures.ts';

const COPY = {
  fr: {
    path: '/contact',
    name: 'Nom',
    email: 'Email',
    message: 'Message',
    send: 'Envoyer',
    missingName: 'Indiquez votre nom.',
    missingEmail: 'Indiquez votre email pour que je puisse répondre.',
    missingMessage: 'Écrivez quelques mots avant d’envoyer.',
    malformedEmail: 'Cette adresse email ne semble pas complète, par exemple nom@domaine.fr.',
    sending: 'Envoi en cours…',
    sent: 'Merci, votre message est parti. Je vous réponds au plus vite.',
    captcha: 'La vérification anti-spam n’a pas abouti. Réessayez, ou écrivez-moi sur LinkedIn.',
    rejected: 'Le message n’est pas parti. Réessayez dans un instant, ou écrivez-moi sur LinkedIn.',
  },
  en: {
    path: '/en/contact',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    send: 'Send',
    missingName: 'Please enter your name.',
    missingEmail: 'Please enter your email so I can reply.',
    missingMessage: 'Please write a few words before sending.',
    malformedEmail: 'This email address looks incomplete; try something like name@domain.com.',
    sending: 'Sending…',
    sent: 'Thanks, your message is on its way. I will get back to you as soon as I can.',
    captcha: 'The spam check did not go through. Try again, or write to me on LinkedIn.',
    rejected: 'Your message was not sent. Try again in a moment, or message me on LinkedIn.',
  },
} as const;

type Copy = (typeof COPY)[keyof typeof COPY];

function form(page: Page, copy: Copy) {
  return {
    name: page.getByRole('textbox', { name: copy.name }),
    email: page.getByRole('textbox', { name: copy.email }),
    message: page.getByRole('textbox', { name: copy.message }),
    send: page.getByRole('button', { name: copy.send }),
    status: page.locator('form').getByRole('status'),
  };
}

async function fillValid(page: Page, copy: Copy) {
  const fields = form(page, copy);
  await fields.name.fill('Ada Lovelace');
  await fields.email.fill('ada@example.com');
  await fields.message.fill('Bonjour, parlons d’un projet.');
}

/** Answers the contact route with `status`, once the test lets it. */
async function answerContact(page: Page, status: number) {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const requests: unknown[] = [];
  await page.route('**/api/contact', async (route: Route) => {
    requests.push(route.request().postDataJSON());
    await gate;
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(status < 300 ? { ok: true } : { error: 'refused' }),
    });
  });
  return { release, requests };
}

for (const [locale, copy] of Object.entries(COPY)) {
  test.describe(`contact form (${locale})`, () => {
    test('flags each missing field and focuses the first one', async ({ page }) => {
      await open(page, copy.path);
      const fields = form(page, copy);

      await fields.send.click();

      await expect(fields.name).toBeFocused();
      await expect(fields.name).toHaveAccessibleDescription(copy.missingName);
      await expect(fields.name).toHaveAttribute('aria-invalid', 'true');
      await expect(fields.email).toHaveAccessibleDescription(copy.missingEmail);
      await expect(fields.message).toHaveAccessibleDescription(copy.missingMessage);

      await fields.name.fill('Ada Lovelace');
      await fields.email.fill('ada@');
      await fields.send.click();

      await expect(fields.email).toBeFocused();
      await expect(fields.email).toHaveAccessibleDescription(copy.malformedEmail);
      await expect(fields.name).not.toHaveAttribute('aria-invalid');
    });

    test('sends, says it is sending, then confirms with the check icon', async ({ page }) => {
      const api = await answerContact(page, 200);
      await open(page, copy.path);
      const fields = form(page, copy);
      await fillValid(page, copy);

      await fields.send.click();

      await expect(fields.send).toHaveAttribute('aria-busy', 'true');
      await expect(fields.send).toHaveAttribute('aria-disabled', 'true');
      await expect(fields.status).toHaveText(copy.sending);
      await expect(fields.send).toBeFocused();
      api.release();

      await expect(fields.status).toHaveText(copy.sent);
      await expect(fields.status.locator('svg')).toBeVisible();
      await expect(fields.send).not.toHaveAttribute('aria-busy');
      await expect(fields.name).toHaveValue('');
      expect(api.requests).toEqual([
        {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          message: 'Bonjour, parlons d’un projet.',
          captchaToken: CAPTCHA_TOKEN,
        },
      ]);
    });

    test('says when the anti-spam check was refused', async ({ page }) => {
      const api = await answerContact(page, 403);
      api.release();
      await open(page, copy.path);
      await fillValid(page, copy);

      await form(page, copy).send.click();

      await expect(form(page, copy).status).toHaveText(copy.captcha);
      await expect(form(page, copy).status.locator('svg')).toHaveCount(0);
    });

    test('says when the server failed, keeping what was written', async ({ page }) => {
      const api = await answerContact(page, 502);
      api.release();
      await open(page, copy.path);
      await fillValid(page, copy);

      await form(page, copy).send.click();

      await expect(form(page, copy).status).toHaveText(copy.rejected);
      await expect(form(page, copy).message).toHaveValue('Bonjour, parlons d’un projet.');
    });
  });
}
