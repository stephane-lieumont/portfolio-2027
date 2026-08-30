import { z } from 'zod';

export const mediaKindSchema = z.enum(['image', 'video']);
export type MediaKind = z.infer<typeof mediaKindSchema>;

export const mediaAssetSchema = z.object({
  id: z.uuid(),
  kind: mediaKindSchema,
  /** Object key in the MinIO bucket, never an absolute URL: the origin can change. */
  objectKey: z.string().min(1),
  url: z.url(),
  alt: z.string().max(200),
  width: z.int().positive().nullable(),
  height: z.int().positive().nullable(),
  byteSize: z.int().positive(),
  contentType: z.string().min(1),
  createdAt: z.iso.datetime(),
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
  alt: z.string().max(200).default(''),
  width: z.int().positive().nullable().default(null),
  height: z.int().positive().nullable().default(null),
});
export type ConfirmUploadInput = z.infer<typeof confirmUploadInputSchema>;
