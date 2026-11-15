import { z } from 'zod';

const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';
const TURNSTILE_TEST_SECRETS = /^[123]x0+AA$/;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().default('http://localhost:4200'),

  DATABASE_FILE: z.string().default('./data/portfolio.sqlite'),

  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('portfolio-media'),
  /** Public origin served by nginx for reading media (see ADR-0003). */
  MEDIA_PUBLIC_URL: z.string().default('http://localhost:9000/portfolio-media'),

  ADMIN_EMAIL: z.email().default('admin@localhost'),
  ADMIN_PASSWORD_HASH: z.string().default(''),
  SESSION_SECRET: z.string().min(32).default('dev-only-secret-change-me-32-chars-min'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),

  /** Development defaults point at Mailpit (infra/docker-compose.yml); see ADR-0020. */
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  CONTACT_TO: z.email().default('contact@localhost'),
  /** Cloudflare's documented test secret, which accepts any token. */
  TURNSTILE_SECRET: z.string().min(1).default(TURNSTILE_TEST_SECRET),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid configuration:\n${issues.join('\n')}`);
  }

  const config = parsed.data;
  if (config.NODE_ENV === 'production') {
    if (!config.ADMIN_PASSWORD_HASH) {
      throw new Error('ADMIN_PASSWORD_HASH is required in production.');
    }
    if (config.SESSION_SECRET.startsWith('dev-only-')) {
      throw new Error('SESSION_SECRET must be set in production.');
    }
    if (!config.SMTP_PASSWORD || config.CONTACT_TO === 'contact@localhost') {
      throw new Error('SMTP_PASSWORD and CONTACT_TO are required in production.');
    }
    if (TURNSTILE_TEST_SECRETS.test(config.TURNSTILE_SECRET)) {
      throw new Error('TURNSTILE_SECRET must be set in production.');
    }
  }
  return config;
}
