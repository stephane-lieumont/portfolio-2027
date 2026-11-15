import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { loadConfig } from '../config.ts';
import captchaPlugin from '../plugins/captcha.ts';
import mailerPlugin, { type MailTransport } from '../plugins/mailer.ts';
import contactRoutes from './contact.ts';

const SECRET = 'turnstile-secret';
const OWNER = 'owner@example.com';

type Sent = Parameters<MailTransport['sendMail']>[0];

interface Setup {
  siteverify?: () => Promise<Response>;
  failSending?: boolean;
}

async function buildContactApp({
  siteverify = async () => Response.json({ success: true }),
  failSending = false,
}: Setup = {}) {
  const sent: Sent[] = [];
  const verifications: URLSearchParams[] = [];

  mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.ok(init.body instanceof URLSearchParams);
    verifications.push(init.body);
    return siteverify();
  });

  const transport: MailTransport = {
    async sendMail(mail) {
      if (failSending) throw new Error('535 authentication failed for owner@example.com');
      sent.push(mail);
    },
  };

  const app = Fastify({ trustProxy: true });
  await app.register(
    fp(
      async (instance: FastifyInstance) => {
        instance.decorate('config', loadConfig({ CONTACT_TO: OWNER, TURNSTILE_SECRET: SECRET }));
      },
      { name: 'config' },
    ),
  );
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(mailerPlugin, { transport });
  await app.register(captchaPlugin);
  await app.register(contactRoutes);
  return { app, sent, verifications };
}

const message = {
  name: 'Ada Lovelace',
  email: 'ada@example.org',
  message: 'Bonjour Stéphane',
  captchaToken: 'token-from-the-widget',
};

const post = (app: FastifyInstance, payload: object, ip = '203.0.113.7') =>
  app.inject({
    method: 'POST',
    url: '/api/contact',
    payload,
    headers: { 'x-forwarded-for': ip },
  });

afterEach(() => {
  mock.restoreAll();
});

describe('POST /api/contact', () => {
  it('verifies the token for the visitor, then mails the owner with a reply-to', async () => {
    const { app, sent, verifications } = await buildContactApp();

    const response = await post(app, message);

    assert.equal(response.statusCode, 202);
    assert.equal(verifications.length, 1);
    assert.equal(verifications[0]?.get('secret'), SECRET);
    assert.equal(verifications[0]?.get('response'), 'token-from-the-widget');
    assert.equal(verifications[0]?.get('remoteip'), '203.0.113.7');
    assert.deepEqual(sent, [
      {
        from: OWNER,
        to: OWNER,
        replyTo: { name: 'Ada Lovelace', address: 'ada@example.org' },
        subject: 'Portfolio — message de Ada Lovelace',
        text: 'Ada Lovelace <ada@example.org>\n\nBonjour Stéphane\n',
      },
    ]);
  });

  it('keeps a name on one line in the subject', async () => {
    const { app, sent } = await buildContactApp();

    await post(app, { ...message, name: 'Ada\r\nBcc: victim@example.com' });

    assert.equal(sent[0]?.subject, 'Portfolio — message de Ada Bcc: victim@example.com');
  });

  it('refuses an incomplete message without asking Cloudflare or sending', async () => {
    const { app, sent, verifications } = await buildContactApp();

    for (const payload of [
      { ...message, email: 'ada@' },
      { ...message, message: '   ' },
      { ...message, captchaToken: '' },
      { name: message.name, email: message.email, message: message.message },
    ]) {
      const response = await post(app, payload);
      assert.equal(response.statusCode, 400);
    }
    assert.equal(verifications.length, 0);
    assert.equal(sent.length, 0);
  });

  it('refuses a token Cloudflare does not vouch for, without sending', async () => {
    const { app, sent } = await buildContactApp({
      siteverify: async () =>
        Response.json({ success: false, 'error-codes': ['invalid-input-response'] }),
    });

    const response = await post(app, message);

    assert.equal(response.statusCode, 403);
    assert.equal(response.json<{ error: string }>().error, 'captcha');
    assert.equal(sent.length, 0);
  });

  it('answers a bad gateway when Cloudflare cannot be asked, without sending', async () => {
    const { app, sent } = await buildContactApp({
      siteverify: async () => new Response('unavailable', { status: 503 }),
    });

    const response = await post(app, message);

    assert.equal(response.statusCode, 502);
    assert.equal(sent.length, 0);
  });

  it('never tells the visitor why the mail server failed', async () => {
    const { app } = await buildContactApp({ failSending: true });

    const response = await post(app, message);

    assert.equal(response.statusCode, 502);
    assert.doesNotMatch(response.body, /535|authentication|owner@example\.com/);
  });

  it('lets an address send five messages per ten minutes', async () => {
    const { app, sent } = await buildContactApp();

    const statuses = [];
    for (let i = 0; i < 6; i += 1) statuses.push((await post(app, message)).statusCode);
    const other = await post(app, message, '198.51.100.1');

    assert.deepEqual(statuses, [202, 202, 202, 202, 202, 429]);
    assert.equal(other.statusCode, 202);
    assert.equal(sent.length, 6);
  });
});
