/**
 * Generates the responsive WebP variants of every seeded render and cover
 * (ADR-0012), until upload-time derivation exists in the API.
 *
 *   pnpm --filter @portfolio/api media:derive
 *
 * Re-running is safe: variants are overwritten, originals are never touched.
 */
import { Client as MinioClient } from 'minio';

import { loadConfig } from '../config.ts';
import { buildVariants, isVariantSource } from '../lib/media-variants.ts';

const PREFIXES = ['cgi/', 'projects/'];

async function listKeys(client: MinioClient, bucket: string, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  // The stream is untyped; narrow each item rather than casting it.
  for await (const item of client.listObjectsV2(bucket, prefix, true) as AsyncIterable<unknown>) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'name' in item &&
      typeof item.name === 'string'
    ) {
      keys.push(item.name);
    }
  }
  return keys;
}

async function readObject(client: MinioClient, bucket: string, key: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of await client.getObject(bucket, key)) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new MinioClient({
    endPoint: config.MINIO_ENDPOINT,
    port: config.MINIO_PORT,
    useSSL: config.MINIO_USE_SSL,
    accessKey: config.MINIO_ACCESS_KEY,
    secretKey: config.MINIO_SECRET_KEY,
  });
  const bucket = config.MINIO_BUCKET;

  let written = 0;
  for (const prefix of PREFIXES) {
    for (const key of (await listKeys(client, bucket, prefix)).filter(isVariantSource)) {
      const variants = await buildVariants(key, await readObject(client, bucket, key));
      for (const v of variants) {
        await client.putObject(bucket, v.key, v.body, v.body.length, {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        written += 1;
        console.log(`${v.key}  ${v.width}px  ${Math.round(v.body.length / 1024)} KB`);
      }
    }
  }
  console.log(`\n${written} variants in ${bucket}`);
}

await main();
