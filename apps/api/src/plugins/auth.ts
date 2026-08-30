import cookie from '@fastify/cookie';
import argon2 from 'argon2';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const SESSION_COOKIE = 'portfolio_session';

export interface AuthApi {
  verifyPassword(password: string): Promise<boolean>;
  issueSession(reply: FastifyReply, email: string): void;
  clearSession(reply: FastifyReply): void;
  currentEmail(request: FastifyRequest): string | null;
}

declare module 'fastify' {
  interface FastifyInstance {
    auth: AuthApi;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authPlugin(app: FastifyInstance): Promise<void> {
  const { config } = app;
  await app.register(cookie, { secret: config.SESSION_SECRET });

  const ttlMs = config.SESSION_TTL_HOURS * 60 * 60 * 1000;

  const auth: AuthApi = {
    async verifyPassword(password) {
      if (!config.ADMIN_PASSWORD_HASH) return false;
      try {
        return await argon2.verify(config.ADMIN_PASSWORD_HASH, password);
      } catch {
        return false;
      }
    },
    issueSession(reply, email) {
      reply.setCookie(SESSION_COOKIE, email, {
        signed: true,
        httpOnly: true,
        sameSite: 'lax',
        secure: config.NODE_ENV === 'production',
        path: '/',
        maxAge: ttlMs / 1000,
      });
    },
    clearSession(reply) {
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
    },
    currentEmail(request) {
      const raw = request.cookies[SESSION_COOKIE];
      if (!raw) return null;
      const unsigned = request.unsignCookie(raw);
      if (!unsigned.valid || unsigned.value !== config.ADMIN_EMAIL) return null;
      return unsigned.value;
    },
  };

  app.decorate('auth', auth);
  app.decorate('requireAdmin', async (request, reply) => {
    if (auth.currentEmail(request) === null) {
      await reply.code(401).send({ error: 'unauthorized', message: 'Authentification requise.' });
    }
  });
}

export default fp(authPlugin, { name: 'auth', dependencies: ['config'] });
