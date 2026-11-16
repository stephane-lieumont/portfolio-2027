import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { describe, it } from 'node:test';

import Fastify from 'fastify';

import { loggerOptions } from './app.ts';

describe('the API logs', () => {
  it('record the request without the visitor address', async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk: Buffer, _encoding, done) {
        lines.push(chunk.toString());
        done();
      },
    });
    const app = Fastify({ logger: { ...loggerOptions, stream }, trustProxy: true });
    app.get('/api/projects', async () => []);

    await app.inject({
      url: '/api/projects?lang=en',
      headers: { 'x-forwarded-for': '203.0.113.42' },
      remoteAddress: '198.51.100.7',
    });
    await app.close();

    const log = lines.join('');
    assert.match(log, /"url":"\/api\/projects\?lang=en"/);
    assert.doesNotMatch(log, /203\.0\.113\.42/);
    assert.doesNotMatch(log, /198\.51\.100\.7/);
  });
});
