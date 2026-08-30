import { z } from 'zod';

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(12).max(200),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const sessionSchema = z.object({
  email: z.email(),
  expiresAt: z.iso.datetime(),
});
export type Session = z.infer<typeof sessionSchema>;

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
