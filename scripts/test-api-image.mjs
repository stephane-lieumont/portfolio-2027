// Runs the API image the way the server does (ADR-0021): in production mode,
// beside a MinIO container, then asks what deploy.sh and the site build ask —
// the health checks, the content seed, the read routes. The first deployment
// failed on an image that built but could not start (a workspace package's
// dependencies left out), which only running it reveals.
//
// Builds the image from the repository, or tests API_IMAGE when it is set
// (the deploy workflow tests the image it is about to push).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const root = join(import.meta.dirname, '..');
const RUN = `api-test-${process.pid}`;
const IMAGE = process.env.API_IMAGE ?? `portfolio-api:${RUN}`;
const NETWORK = RUN;
const MINIO = `${RUN}-minio`;
const API = `${RUN}-api`;
const MINIO_USER = 'api-image-test';
const MINIO_PASSWORD = 'api-image-test-password';

// Production refuses to boot on development values (config.ts): these are
// stand-ins of the right shape, never used to reach anything.
const PRODUCTION_ENV = {
  NODE_ENV: 'production',
  DATABASE_FILE: '/data/portfolio.sqlite',
  MINIO_ENDPOINT: MINIO,
  MINIO_ACCESS_KEY: MINIO_USER,
  MINIO_SECRET_KEY: MINIO_PASSWORD,
  SESSION_SECRET: 'api-image-test-session-secret-of-48-characters!!',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD_HASH: '$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHQ$aGFzaGhhc2g',
  SMTP_PASSWORD: 'unused',
  CONTACT_TO: 'contact@example.com',
  TURNSTILE_SECRET: '0x0000000000000000000000000000000000000000',
};

function docker(...args) {
  const result = spawnSync('docker', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`docker ${args[0]}: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

let base;

// Not AbortSignal.timeout: its timer does not hold the event loop open, and
// Docker's port proxy accepts a connection before the API listens behind it,
// so node:test would see an empty loop and give up on the pending request.
function get(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  return fetch(`${base}${path}`, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function waitFor(what, check) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await check().catch(() => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const logs = spawnSync('docker', ['logs', '--tail', '15', API], { encoding: 'utf8' });
  throw new Error(`${what} never became ready:\n${logs.stdout}${logs.stderr}`);
}

before(async () => {
  if (!process.env.API_IMAGE) docker('build', '-q', '-f', 'apps/api/Dockerfile', '-t', IMAGE, root);
  docker('network', 'create', NETWORK);
  docker(
    'run',
    '-d',
    '--name',
    MINIO,
    '--network',
    NETWORK,
    '-e',
    `MINIO_ROOT_USER=${MINIO_USER}`,
    '-e',
    `MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}`,
    'cgr.dev/chainguard/minio:latest',
    'server',
    '/data',
  );
  const port = await freePort();
  const env = Object.entries(PRODUCTION_ENV).flatMap(([key, value]) => ['-e', `${key}=${value}`]);
  // Restarted like the server's compose file does: MinIO may still be starting.
  docker(
    'run',
    '-d',
    '--name',
    API,
    '--network',
    NETWORK,
    '--restart',
    'on-failure',
    '-p',
    `127.0.0.1:${port}:3000`,
    ...env,
    IMAGE,
  );
  base = `http://127.0.0.1:${port}`;
  await waitFor('the API', async () => (await get('/health/ready')).ok);
});

after(() => {
  spawnSync('docker', ['rm', '-f', API, MINIO]);
  spawnSync('docker', ['network', 'rm', NETWORK]);
  if (!process.env.API_IMAGE) spawnSync('docker', ['rmi', '-f', IMAGE]);
});

describe('the API image, in production mode', () => {
  it('passes the health check the server waits on', async () => {
    const response = await get('/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });

  it('reaches its database and its bucket', async () => {
    const response = await get('/health/ready');
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).checks, { database: true, storage: true });
  });

  it('seeds its content the way deploy.sh does, twice without rewriting anything', () => {
    const first = docker('exec', API, 'node', 'src/scripts/seed-content.ts');
    assert.match(first, /\d+ projects and \d+ pieces/);
    const second = docker('exec', API, 'node', 'src/scripts/seed-content.ts');
    assert.match(second, / 0 rows written/);
  });

  it('serves what the site build reads', async () => {
    for (const path of ['/api/projects', '/api/artworks', '/api/tools', '/api/stack']) {
      const response = await get(path);
      assert.equal(response.status, 200, path);
      const body = await response.json();
      assert.ok(Array.isArray(body) ? body.length > 0 : Object.keys(body).length > 0, path);
    }
  });
});
