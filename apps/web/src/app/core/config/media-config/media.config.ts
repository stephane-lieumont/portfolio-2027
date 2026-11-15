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
 * The WebP widths derived next to every image in the bucket (apps/api
 * `media:derive`, the same rule): each width below the original's, then the
 * original's own, never above it. A 1280px render has `-640`, `-960` and
 * `-1280.webp`; a 400px capture only `-400.webp`. Every name is its real width.
 */
export const MEDIA_WIDTHS = [640, 960, 1280, 1920, 2560] as const;

export function derivedWidths(width: number): number[] {
  const below = MEDIA_WIDTHS.filter((derived) => derived < width);
  return width <= MEDIA_WIDTHS[MEDIA_WIDTHS.length - 1] ? [...below, width] : below;
}

/** Builds the `srcset` of an image's WebP derivatives; the original stays its `src`. */
export function mediaSrcset(): (key: string, width: number) => string {
  const url = mediaUrl();
  return (key, width) => {
    const stem = key.replace(/\.[a-z0-9]+$/i, '');
    return derivedWidths(width)
      .map((derived) => `${url(`${stem}-${derived}.webp`)} ${derived}w`)
      .join(', ');
  };
}
