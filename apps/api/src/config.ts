import { z } from 'zod';

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
  /** Origine publique servie par nginx pour lire les médias (voir docs/adr/0003). */
  MEDIA_PUBLIC_URL: z.string().default('http://localhost:9000/portfolio-media'),

  ADMIN_EMAIL: z.email().default('admin@localhost'),
  ADMIN_PASSWORD_HASH: z.string().default(''),
  SESSION_SECRET: z.string().min(32).default('dev-only-secret-change-me-32-chars-min'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Configuration invalide :\n${issues.join('\n')}`);
  }

  const config = parsed.data;
  if (config.NODE_ENV === 'production') {
    if (!config.ADMIN_PASSWORD_HASH) {
      throw new Error('ADMIN_PASSWORD_HASH est obligatoire en production.');
    }
    if (config.SESSION_SECRET.startsWith('dev-only-')) {
      throw new Error('SESSION_SECRET doit être défini en production.');
    }
  }
  return config;
}
