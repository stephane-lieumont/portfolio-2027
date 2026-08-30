import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Client as MinioClient } from 'minio';

export interface Storage {
  bucket: string;
  client: MinioClient;
  publicUrl(objectKey: string): string;
  presignedPutUrl(objectKey: string, expirySeconds: number): Promise<string>;
  remove(objectKey: string): Promise<void>;
}

declare module 'fastify' {
  interface FastifyInstance {
    storage: Storage;
  }
}

async function storagePlugin(app: FastifyInstance): Promise<void> {
  const { config } = app;

  const client = new MinioClient({
    endPoint: config.MINIO_ENDPOINT,
    port: config.MINIO_PORT,
    useSSL: config.MINIO_USE_SSL,
    accessKey: config.MINIO_ACCESS_KEY,
    secretKey: config.MINIO_SECRET_KEY,
  });

  const bucket = config.MINIO_BUCKET;
  if (!(await client.bucketExists(bucket))) {
    await client.makeBucket(bucket);
  }

  app.decorate('storage', {
    bucket,
    client,
    publicUrl: (objectKey) => `${config.MEDIA_PUBLIC_URL.replace(/\/$/, '')}/${objectKey}`,
    presignedPutUrl: (objectKey, expirySeconds) =>
      client.presignedPutObject(bucket, objectKey, expirySeconds),
    remove: (objectKey) => client.removeObject(bucket, objectKey),
  } satisfies Storage);
}

export default fp(storagePlugin, { name: 'storage', dependencies: ['config'] });
