import { z } from 'zod';

/**
 * What the contact form posts to `POST /api/contact`. The API relays it to
 * Stéphane's mailbox (ADR-0007); the address itself never reaches the client.
 */
export const contactMessageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  message: z.string().trim().min(1).max(5000),
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;

/** The message with the Turnstile token the API verifies before sending (ADR-0020). */
export const contactRequestSchema = contactMessageSchema.extend({
  // Cloudflare caps a token at 2048 characters.
  captchaToken: z.string().min(1).max(2048),
});
export type ContactRequest = z.infer<typeof contactRequestSchema>;
