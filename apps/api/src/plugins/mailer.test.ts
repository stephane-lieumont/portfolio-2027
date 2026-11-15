import Fastify, { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import nodemailer from 'nodemailer';

import { loadConfig } from '../config.ts';
import mailerPlugin from './mailer.ts';

type TransportOptions = Parameters<typeof nodemailer.createTransport>[0];

async function buildMailerApp(env: NodeJS.ProcessEnv) {
  const created: TransportOptions[] = [];
  const sendMail = mock.fn(async () => ({}));
  mock.method(nodemailer, 'createTransport', (options: TransportOptions) => {
    created.push(options);
    return { sendMail };
  });

  const app = Fastify();
  await app.register(
    fp(
      async (instance: FastifyInstance) => {
        instance.decorate('config', loadConfig(env));
      },
      { name: 'config' },
    ),
  );
  await app.register(mailerPlugin);
  await app.ready();
  return { app, created, sendMail };
}

afterEach(() => {
  mock.restoreAll();
});

describe('mailer', () => {
  it('talks to Mailpit in development, in clear and without credentials', async () => {
    const { created } = await buildMailerApp({});

    assert.deepEqual(created, [{ host: 'localhost', port: 1025, secure: false, auth: undefined }]);
  });

  it('logs in over TLS on port 465', async () => {
    const { created } = await buildMailerApp({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'sender@example.com',
      SMTP_PASSWORD: 'app-password',
    });

    assert.deepEqual(created, [
      {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: { user: 'sender@example.com', pass: 'app-password' },
      },
    ]);
  });

  it('sends from and to the owner, whatever the caller asks', async () => {
    const { app, sendMail } = await buildMailerApp({ CONTACT_TO: 'owner@example.com' });

    await app.mailer.send({
      replyTo: { name: 'Ada', address: 'ada@example.org' },
      subject: 'Hello',
      text: 'Body',
      html: '<p>Body</p>',
    });

    assert.deepEqual(sendMail.mock.calls[0]?.arguments, [
      {
        from: 'owner@example.com',
        to: 'owner@example.com',
        replyTo: { name: 'Ada', address: 'ada@example.org' },
        subject: 'Hello',
        text: 'Body',
        html: '<p>Body</p>',
      },
    ]);
  });
});
