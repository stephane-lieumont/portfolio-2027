import { z } from 'zod';

export const mediaKindSchema = z.enum(['image', 'video']);
export type MediaKind = z.infer<typeof mediaKindSchema>;

export const mediaAssetSchema = z.object({
  id: z.uuid(),
  kind: mediaKindSchema,
  /** Clé de l'objet dans le bucket MinIO, jamais une URL absolue : l'origine peut changer. */
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

/** URL présignée : le navigateur pousse le fichier vers MinIO sans transiter par l'API. */
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
