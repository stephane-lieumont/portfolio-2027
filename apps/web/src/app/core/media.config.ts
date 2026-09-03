import { InjectionToken, inject } from '@angular/core';

/**
 * Where the media bucket is served from.
 *
 * The images are objects in MinIO, not files in the repository, so the app
 * never holds a full URL. In production nginx proxies this path to the bucket;
 * in development the Angular dev server proxies it to the local MinIO
 * container. Both resolve `/medias`, which is why the templates can stay
 * identical across the two.
 */
export const MEDIA_BASE_URL = new InjectionToken<string>('MEDIA_BASE_URL');

/** Joins a bucket key onto the configured base, tolerating a trailing slash. */
export function mediaUrl(): (key: string) => string {
  const base = inject(MEDIA_BASE_URL).replace(/\/$/, '');
  return (key) => `${base}/${key}`;
}
