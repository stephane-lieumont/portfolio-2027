# ADR-0017 — A bilingual site: French at the root, English under /en

- **Status**: Accepted
- **Date**: 2026-11-15
- **Amended**: 2026-11-15 — route paths come from one `{ fr, en }` table, not `$localize` (see the note at the end)

## Context

Until now the site was French-only, and that was written down as settled: CLAUDE.md, specs 00, 02, 03 and 06, and `content-guidelines.md` all state that the visitor-facing copy is French. On 2026-11-15 Stéphane reversed it: the site must speak English to visitors whose browser is not francophone, French to the others. He split the work along the existing seam: **what is static is translated in the front end, what is dynamic is translated in the back end** — the back office (ADR-0004) will hold project copy in both languages.

He settled the visible behaviour the same day:

- French stays at the root; English lives under `/en`.
- English addresses use English slugs (`/en/developer`, not `/en/developpeur`).
- A non-francophone visitor arriving at the root is sent to English; a choice made in the language switcher is remembered and wins; a shared link is never redirected.

The constraints the decision had to respect were already in place. Every route is prerendered to static HTML and served by nginx, with no Node process in production (ADR-0008, ADR-0005). The prerender check fails a page whose title, heading or copy is not in the HTML. Domain types come from Zod schemas in `@portfolio/shared-types`, and every editorial field must stay modelled there so the static source can swap for the API.

## Decision

**Two prerendered trees, one per locale, built by Angular's own i18n.**

- `@angular/localize` with `localize: true`: the source locale is `fr` with an empty `subPath`, so the French tree is built at the root of `dist/web/browser` exactly as today; `en` is built under `en/` with `baseHref: /en/`. Template text is marked with `i18n` attributes, TypeScript strings with `$localize`, each with a stable custom id (`@@…`). Translations live in `apps/web/src/locale/messages.en.xlf`, extracted with `ng extract-i18n`.
- Route paths are localized like any other string (`$localize` in the route table), so each tree carries its own slugs. A route-level key (`data.page`, plus the record's id for a project or a piece) lets the switcher and the `hreflang` links find the same page in the other language.
- `<html lang>`, `<title>`, the meta description, Open Graph locale and `<link rel="alternate" hreflang="fr|en|x-default">` are set per tree, in the prerendered HTML.

**Dynamic content is localized at the source.** Every visitor-facing text field in shared-types becomes a `LocalizedText` — `{ fr: string; en: string }`, both required for a published record — and slugs become `{ fr, en }` too. The static content (`world-content.ts`, `static-content.ts`) adopts the same shape now, so the day the API serves it nothing changes on the page. The page reads the field for its build's `LOCALE_ID`; it never translates at runtime.

**Language choice, in this order:**

1. A link always opens the language it points to. No redirect on any page but `/`.
2. On `/` only, nginx sends a visitor to `/en/` when the `lang` cookie says `en`, or, without a cookie, when `Accept-Language` does not rank French first. `302`, `Vary: Accept-Language, Cookie`.
3. The switcher in the header is a pair of links to the same page in the other tree (`hreflang`, `lang` on each). Following one sets the `lang` cookie (one year, `SameSite=Lax`, no other data). It is a plain link: it works without script.

**English copy is written, not machine-translated**: drafted from the French by the communication expert, checked against `user-profile.md`, approved by Stéphane in the final content review like the French.

## Consequences

- **Every page exists twice, in static HTML, indexable.** Search engines see both languages with correct `hreflang`; a visitor with script disabled gets the full page in their language. Runtime cost is zero: no translation bundle, no flash of the other language.
- **Existing French URLs do not move.** No redirect to maintain, no SEO lost on the pages already shared.
- **The build doubles.** Two compilations and two prerender passes; `pnpm verify` gets slower (the web build is in it), and the prerender check must run per tree, with the English expectations.
- **Switching language reloads the page.** The trees are separate builds; the switcher is a navigation to the other one, not an in-place swap. The route transitions (ADR-0014) do not play across it.
- **Every new visitor-facing string costs two entries**: an `i18n` mark and an English translation. A missing translation fails the English build (`i18nMissingTranslation: error`), so it cannot ship half-translated — and it can block a PR on a word.
- **The data model gets heavier.** `LocalizedText` everywhere, both languages required to publish; the back office must edit both side by side. The French-only schemas and the static content are migrated in one pass.
- **nginx gains logic** (ADR-0005): the `/` redirect with its cookie and `Accept-Language` map, and `try_files` / `error_page` per tree (`/en/404/index.html` for English misses). It lives outside the repository, like the rest of that config.
- **A cookie appears.** It holds only the language, is strictly necessary to honour the visitor's explicit choice, and needs no consent banner; it is the site's first cookie and is documented as such.
- **The documentation's French-only statements are superseded**: CLAUDE.md, specs 00/02/03/06 and `content-guidelines.md` are amended in the same change as the first implementation, not before.
- **Copy measured on French** (`--measure: 62ch`, label widths in spec 07, the header at 320px) must be re-measured in English, which is shorter on average but not everywhere.

## Alternatives considered

- **A runtime translation library (Transloco, ngx-translate).** One build, switching language without a reload. Rejected: the prerender produces a single tree, so only one language would be in the HTML and indexable, and the other would appear after script with a visible swap; it also ships the dictionary and a runtime to every visitor. Its one advantage, the in-place switch, is worth little on a portfolio a visitor reads in one language.
- **One URL per page, language negotiated per request.** Rejected: impossible with static files without serving the same URL with different content (caches and search engines see one language), and it breaks sharing a page in a given language.
- **`/fr` and `/en` prefixes.** Symmetric, but every current French URL moves and needs a 301. Rejected by Stéphane on 2026-11-15.
- **Identical slugs in both trees (`/en/developpeur`).** Simpler mapping between languages. Rejected by Stéphane: English addresses should read as English.
- **Redirecting on every page from `Accept-Language`.** Rejected: a French link shared with an English-speaking colleague would open in English, against the sharer's intent, and a visitor could never stay on a page in the other language without the cookie.
- **Translating dynamic content in the front end** (a dictionary keyed by project id). Rejected: it splits a project's copy between the database and the bundle, and the back office could not edit the English.

## Note — 2026-11-15: route paths from a table

Built in the first implementation: section paths are not `$localize` strings but one table, `SECTIONS` in `apps/web/src/app/core/i18n/site-paths.ts`, with both languages side by side. Each build carries only its own translations, so a `$localize` path would leave the switcher and the `hreflang` links unable to name the other tree's address. The table is read for the build's locale (`$localize.locale`, inlined per tree) by the route table, and for both locales by the switcher, the `hreflang` links and the prerender check. It is the `{ fr, en }` shape the slugs take in the data model. Interface text is still `$localize`, as decided.
