import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loadConfig } from './config.ts';

const productionEnv = {
  NODE_ENV: 'production',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD_HASH: '$argon2id$v=19$m=65536,t=3,p=4$abc$def',
  SESSION_SECRET: 'a'.repeat(48),
};

describe('loadConfig', () => {
  it('applies development defaults', () => {
    const config = loadConfig({});

    assert.equal(config.NODE_ENV, 'development');
    assert.equal(config.PORT, 3000);
    assert.equal(config.MINIO_USE_SSL, false);
  });

  it('coerces numeric and boolean variables', () => {
    const config = loadConfig({ PORT: '8080', MINIO_USE_SSL: 'true' });

    assert.equal(config.PORT, 8080);
    assert.equal(config.MINIO_USE_SSL, true);
  });

  it('rejects an invalid port', () => {
    assert.throws(() => loadConfig({ PORT: 'not-a-port' }), /Invalid configuration/);
  });

  it('rejects a session secret that is too short', () => {
    assert.throws(() => loadConfig({ SESSION_SECRET: 'too-short' }), /Invalid configuration/);
  });

  it('accepts a complete production configuration', () => {
    const config = loadConfig(productionEnv);

    assert.equal(config.NODE_ENV, 'production');
    assert.equal(config.ADMIN_EMAIL, 'admin@example.com');
  });

  it('refuses to boot in production without a password hash', () => {
    assert.throws(
      () => loadConfig({ ...productionEnv, ADMIN_PASSWORD_HASH: '' }),
      /ADMIN_PASSWORD_HASH/,
    );
  });

  it('refuses to boot in production with the development secret', () => {
    assert.throws(
      () =>
        loadConfig({ ...productionEnv, SESSION_SECRET: 'dev-only-secret-change-me-32-chars-min' }),
      /SESSION_SECRET/,
    );
  });
});
