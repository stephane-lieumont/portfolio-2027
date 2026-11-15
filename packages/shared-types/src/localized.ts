import { z } from 'zod';

/**
 * The site's languages (ADR-0017). French is the source and the default, at
 * the root; English lives under /en.
 */
export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** A value in each of the site's languages. */
export type Localized<T> = { readonly [L in Locale]: T };

/**
 * A field written once per language, each held to the same rule, trimmed and
 * never blank. Both are required: a record ships in both trees or in neither,
 * so an English page can never fall back to French copy or to nothing.
 */
export const localized = (schema: z.ZodString) => {
  const filled = schema.trim().min(1);
  return z.object({ fr: filled, en: filled });
};

export const localizedTextSchema = localized(z.string());
export type LocalizedText = z.infer<typeof localizedTextSchema>;
