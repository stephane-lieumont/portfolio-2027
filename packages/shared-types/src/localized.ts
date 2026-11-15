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
 * A field written once per language, each held to the same rule. Both are
 * required: a record ships in both trees or in neither, so an English page can
 * never fall back to French copy.
 */
export const localized = <T extends z.ZodType>(schema: T) => z.object({ fr: schema, en: schema });

export const localizedTextSchema = localized(z.string().trim().min(1));
export type LocalizedText = z.infer<typeof localizedTextSchema>;
