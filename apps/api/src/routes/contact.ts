import { contactRequestSchema } from '@portfolio/shared-types/contact';
import type { FastifyInstance } from 'fastify';

import { renderContactMail } from '../lib/contact-mail/contact-mail.ts';

export default async function contactRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/api/contact',
    { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const parsed = contactRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid', message: 'Message incomplet.' });
      }
      const { captchaToken, ...message } = parsed.data;

      try {
        if (!(await app.captcha.verify(captchaToken, request.ip))) {
          return reply.code(403).send({ error: 'captcha', message: 'Vérification refusée.' });
        }
        await app.mailer.send({
          replyTo: { name: message.name, address: message.email },
          ...renderContactMail(message, new Date()),
        });
      } catch (error) {
        request.log.error({ err: error }, 'contact: the message could not be relayed');
        return reply.code(502).send({ error: 'relay', message: 'Envoi impossible.' });
      }

      return reply.code(202).send();
    },
  );
}
