import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { z } from 'zod';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const siteverifyAnswerSchema = z.object({ success: z.boolean() });

export interface Captcha {
  /** Whether Cloudflare vouches for the token. Throws when Cloudflare cannot be asked. */
  verify(token: string, remoteIp: string): Promise<boolean>;
}

declare module 'fastify' {
  interface FastifyInstance {
    captcha: Captcha;
  }
}

async function captchaPlugin(app: FastifyInstance): Promise<void> {
  const secret = app.config.TURNSTILE_SECRET;

  app.decorate('captcha', {
    async verify(token, remoteIp) {
      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`siteverify answered ${response.status}`);
      return siteverifyAnswerSchema.parse(await response.json()).success;
    },
  } satisfies Captcha);
}

export default fp(captchaPlugin, { name: 'captcha', dependencies: ['config'] });
