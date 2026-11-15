import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import nodemailer from 'nodemailer';

export interface OutgoingMail {
  replyTo: { name: string; address: string };
  subject: string;
  text: string;
}

export interface MailTransport {
  sendMail(mail: OutgoingMail & { from: string; to: string }): Promise<unknown>;
}

export interface Mailer {
  send(mail: OutgoingMail): Promise<void>;
}

export interface MailerOptions {
  transport?: MailTransport;
}

declare module 'fastify' {
  interface FastifyInstance {
    mailer: Mailer;
  }
}

async function mailerPlugin(app: FastifyInstance, options: MailerOptions): Promise<void> {
  const { config } = app;

  const transport =
    options.transport ??
    nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      // 465 speaks TLS from the first byte; other ports upgrade with STARTTLS when offered.
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
    });

  app.decorate('mailer', {
    async send(mail) {
      await transport.sendMail({ ...mail, from: config.CONTACT_TO, to: config.CONTACT_TO });
    },
  } satisfies Mailer);
}

export default fp(mailerPlugin, { name: 'mailer', dependencies: ['config'] });
