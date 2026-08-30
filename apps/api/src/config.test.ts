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
  it('applique les valeurs par défaut de développement', () => {
    const config = loadConfig({});

    assert.equal(config.NODE_ENV, 'development');
    assert.equal(config.PORT, 3000);
    assert.equal(config.MINIO_USE_SSL, false);
  });

  it('convertit les variables numériques et booléennes', () => {
    const config = loadConfig({ PORT: '8080', MINIO_USE_SSL: 'true' });

    assert.equal(config.PORT, 8080);
    assert.equal(config.MINIO_USE_SSL, true);
  });

  it('rejette un port invalide', () => {
    assert.throws(() => loadConfig({ PORT: 'not-a-port' }), /Configuration invalide/);
  });

  it('rejette un secret de session trop court', () => {
    assert.throws(() => loadConfig({ SESSION_SECRET: 'trop-court' }), /Configuration invalide/);
  });

  it('accepte une configuration de production complète', () => {
    const config = loadConfig(productionEnv);

    assert.equal(config.NODE_ENV, 'production');
    assert.equal(config.ADMIN_EMAIL, 'admin@example.com');
  });

  it('refuse de démarrer en production sans hash de mot de passe', () => {
    assert.throws(
      () => loadConfig({ ...productionEnv, ADMIN_PASSWORD_HASH: '' }),
      /ADMIN_PASSWORD_HASH/,
    );
  });

  it('refuse de démarrer en production avec le secret de développement', () => {
    assert.throws(
      () =>
        loadConfig({ ...productionEnv, SESSION_SECRET: 'dev-only-secret-change-me-32-chars-min' }),
      /SESSION_SECRET/,
    );
  });
});
