import { z } from 'zod';

import { hexColorSchema } from '@portfolio/shared-types/project';

/**
 * An image's text alternative in both languages. Blank in both marks a
 * decorative image (`alt=""`); blank in one only is a missing translation,
 * which would leave one tree's image unnamed.
 */
const altLanguage = z.string().trim().max(200);
export const altTextSchema = z
  .object({ fr: altLanguage, en: altLanguage })
  .refine((alt) => (alt.fr === '') === (alt.en === ''), 'blank in both languages or in neither');
export type AltText = z.infer<typeof altTextSchema>;

/** What an asset is for, so the media library can filter (spec 04 §2). */
export const mediaPurposeSchema = z.enum(['render', 'cover', 'presentation', 'logo', 'mark']);
export type MediaPurpose = z.infer<typeof mediaPurposeSchema>;

/**
 * Where the file lives. `bucket`: MinIO, served under /medias (ADR-0003),
 * the renders and project visuals. `site`: the web app's own `public/`, the
 * client logos and the tools' marks, which ship with the build.
 */
export const mediaStorageSchema = z.enum(['bucket', 'site']);
export type MediaStorage = z.infer<typeof mediaStorageSchema>;

const BUCKET_KEY = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*\.(?:jpg|png|webp)$/;
const SITE_PATH = /^\/(?!medias\/)[a-z0-9-]+(?:\/[a-z0-9-]+)*\.(?:svg|png|jpg|webp)$/;

/**
 * An image's metadata, a row of `media_assets` (ADR-0022). The file stays
 * where it is; records name it by `id` and the API resolves it into what the
 * page renders.
 */
export const mediaAssetSchema = z
  .object({
    id: z.uuid(),
    purpose: mediaPurposeSchema,
    storage: mediaStorageSchema,
    /** A bucket object key, never a URL; or a root-relative path under the site. */
    key: z.string(),
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    /** Intrinsic size: pixels, or an SVG's viewBox, which need not be whole. */
    width: z.number().positive(),
    height: z.number().positive(),
    alt: altTextSchema,
    /** Painted on the frame while the image loads. */
    averageColor: hexColorSchema.optional(),
    /** A raster's WebP widths beside it (`<name>-<width>.webp`, apps/api `media:public`). */
    variants: z.array(z.int().positive()).optional(),
  })
  .refine((asset) => (asset.storage === 'bucket' ? BUCKET_KEY : SITE_PATH).test(asset.key), {
    message: 'expected a bucket key, or a root-relative path outside /medias',
    path: ['key'],
  });
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

export const uploadTicketRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  byteSize: z.int().positive(),
});
export type UploadTicketRequest = z.infer<typeof uploadTicketRequestSchema>;

/** Presigned URL: the browser pushes the file to MinIO without passing through the API. */
export const uploadTicketSchema = z.object({
  assetId: z.uuid(),
  objectKey: z.string().min(1),
  uploadUrl: z.url(),
  expiresAt: z.iso.datetime(),
});
export type UploadTicket = z.infer<typeof uploadTicketSchema>;

export const confirmUploadInputSchema = z.object({
  assetId: z.uuid(),
  alt: altTextSchema.default({ fr: '', en: '' }),
  width: z.int().positive().nullable().default(null),
  height: z.int().positive().nullable().default(null),
});
export type ConfirmUploadInput = z.infer<typeof confirmUploadInputSchema>;
