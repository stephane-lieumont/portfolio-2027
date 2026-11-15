/**
 * Lists the bucket objects no media record uses, and deletes them with
 * `--apply` (#49). Without it nothing is touched.
 *
 *   pnpm --filter @portfolio/api media:prune            # list
 *   pnpm --filter @portfolio/api media:prune --apply    # delete
 */
import { Client as MinioClient } from 'minio';

import { loadConfig } from '../config.ts';
import { MEDIA } from '../db/seed/media.ts';
import { orphanKeys } from '../lib/orphan-media/orphan-media.ts';

async function listKeys(client: MinioClient, bucket: string): Promise<string[]> {
  const keys: string[] = [];
  // The stream is untyped; narrow each item rather than casting it.
  for await (const item of client.listObjectsV2(bucket, '', true) as AsyncIterable<unknown>) {
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

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const config = loadConfig();
  const client = new MinioClient({
    endPoint: config.MINIO_ENDPOINT,
    port: config.MINIO_PORT,
    useSSL: config.MINIO_USE_SSL,
    accessKey: config.MINIO_ACCESS_KEY,
    secretKey: config.MINIO_SECRET_KEY,
  });
  const bucket = config.MINIO_BUCKET;
  const used = MEDIA.filter((asset) => asset.storage === 'bucket').map((asset) => asset.key);
  const orphans = orphanKeys(await listKeys(client, bucket), used);

  for (const key of orphans) console.log(key);
  if (!apply) {
    console.log(
      `\n${orphans.length} unused objects in ${bucket}. Run with --apply to delete them.`,
    );
    return;
  }
  await client.removeObjects(bucket, orphans);
  console.log(`\n${orphans.length} unused objects deleted from ${bucket}.`);
}

await main();
