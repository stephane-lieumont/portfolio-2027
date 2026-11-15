// Builds the site the way a deployment does, from the API (ADR-0008,
// ADR-0021), here a throwaway one: seeded into a temporary SQLite file and
// serving its read routes only, so neither MinIO nor a mail server has to
// run. `pnpm verify` ends with it, locally and in CI.
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const api = join(root, 'apps', 'api');

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

async function waitUntilServing(url, server) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`the content API exited (${server.exitCode})`);
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) }).catch(() => null);
    if (response?.ok) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`the content API did not answer at ${url}`);
}

const directory = mkdtempSync(join(tmpdir(), 'portfolio-site-'));
const port = await freePort();
const url = `http://127.0.0.1:${port}`;
const apiEnv = {
  ...process.env,
  DATABASE_FILE: join(directory, 'content.sqlite'),
  HOST: '127.0.0.1',
  PORT: String(port),
};

let server;
let status = 1;
// A cancelled CI job or Ctrl-C must not leave the API holding its port.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server?.kill();
    process.exit(1);
  });
}
try {
  const seed = spawnSync(process.execPath, ['src/scripts/seed-content.ts'], {
    cwd: api,
    env: apiEnv,
    stdio: 'inherit',
  });
  if (seed.status !== 0) throw new Error('seeding the content API failed');

  server = spawn(process.execPath, ['src/content-server.ts'], {
    cwd: api,
    env: apiEnv,
    stdio: 'inherit',
  });
  await waitUntilServing(`${url}/api/tools`, server);

  const build = spawnSync('pnpm', ['--filter', '@portfolio/web', 'build'], {
    cwd: root,
    env: { ...process.env, CONTENT_API_URL: url },
    stdio: 'inherit',
  });
  status = build.status ?? 1;
} catch (error) {
  console.error(`build-site: ${error.message}`);
} finally {
  if (server && server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
  rmSync(directory, { recursive: true, force: true });
}

process.exit(status);
