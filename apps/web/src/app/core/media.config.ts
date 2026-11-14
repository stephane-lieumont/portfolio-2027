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

/**
 * The WebP widths derived next to every image in the bucket: `cgi/x.jpg` has
 * `cgi/x-640.webp`, `cgi/x-960.webp` and `cgi/x-1280.webp` (apps/api
 * `media:derive`). A derivative is never wider than its original, so each is
 * declared at its real width and duplicates are dropped (a 400px cover has
 * three 400px files: one candidate).
 */
export const MEDIA_WIDTHS = [640, 960, 1280] as const;

/** Builds the `srcset` of an image's WebP derivatives; the original stays its `src`. */
export function mediaSrcset(): (key: string, width: number) => string {
  const url = mediaUrl();
  return (key, width) => {
    const stem = key.replace(/\.[a-z0-9]+$/i, '');
    const seen = new Set<number>();
    return MEDIA_WIDTHS.flatMap((derived) => {
      const real = Math.min(derived, width);
      if (seen.has(real)) return [];
      seen.add(real);
      return [`${url(`${stem}-${derived}.webp`)} ${real}w`];
    }).join(', ');
  };
}
