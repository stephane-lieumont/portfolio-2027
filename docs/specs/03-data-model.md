# Spec 03 — Data model

Settled with Stéphane on 2026-08-31. The provisional schema written to prove the architecture (`packages/shared-types/src/project.ts`, `apps/api/src/db/schema.ts`) is superseded by this document.

Visitor-facing copy stored in these entities is written in **French and English** (ADR-0017). Every text field below marked _localized_ is a `LocalizedText`, `{ fr: string; en: string }` (`packages/shared-types/src/localized.ts`), each language held to the field's own rule (length, required, pattern) and **both required**: a record ships in both trees or in neither, so an English page never falls back to French. The page reads the field for its build's locale and never translates at runtime. Slugs are `LocalizedSlug`, `{ fr, en }`, each kebab-case.

A record is named across the two trees by its `id`, never by a slug: the language switch and the `hreflang` links go from a slug to its record, then to the record's slug in the other language.

---

## Two entities, not one

`Project` describes a development case study. `Artwork` describes a 3D piece. They share a title, a slug and media, and nothing else.

The deciding argument is not schema tidiness, it is **validation**. With two entities, a dev project _requires_ a mission and a 3D piece _requires_ the software used. Folded into one entity with a `kind` discriminator, more than half the fields on a 3D record would sit empty, every field would have to become optional, and Zod would stop guaranteeing anything.

Accepted cost: two CRUD route sets and two back-office forms. Each is simpler than the single conditional form the alternative would need.

In `@portfolio/shared-types` they are two schemas, not a discriminated union — nothing in the application ever handles "a project or an artwork" generically.

---

## `Project` — development case study

| Field                 | Type                    | Notes                                                                                                                                                                                     |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | uuid                    |                                                                                                                                                                                           |
| `slug`                | `{ fr, en }` kebab-case | Unique per language. **Final once published.** It is the public URL in each tree. A descriptive slug is translated, a proper name kept.                                                   |
| `title`               | localized               |                                                                                                                                                                                           |
| `summary`             | localized               | One sentence, for cards and the meta description. **Not shown on the project page**, which opens on `context` (Stéphane, 2026-11-15).                                                     |
| `context`             | localized plain text    | What the product was. The page's introduction, coloured word by word on scroll.                                                                                                           |
| `role`                | localized               | In what capacity, ≤ 80. Set large beside the mission, and in the page's eyebrow.                                                                                                          |
| `mission`             | localized plain text?   | What Stéphane did. Absent when the context already says it all (a one-sentence client reference): the page then has no Mission block.                                                     |
| `missionSteps`        | localized[]             | Ordered, 0–10. The concrete deliverables, each in both languages so the steps stay aligned. Never invented: empty when none are sourced.                                                  |
| `technologies`        | tech slug[]             | From the registry below.                                                                                                                                                                  |
| `series`              | string?                 | e.g. `"Case Tes Potes"`. A proper name, the same in both languages, and the grouping key. Their pages end on the whole series; any other ends on « Autres réalisations ».                 |
| `websiteUrl`          | url?                    | « Voir le site ». A root-relative path to a demo proxied by nginx — **verify the route exists before publishing** (ADR-0005) — or an `https` site. Replaces `demoUrl`.                    |
| `videoUrl`            | url?                    | « Voir la vidéo ». An `https` YouTube video address, played on the page after a click (ADR-0016).                                                                                         |
| `googlePlayUrl`       | url?                    | « Voir sur Google Play ». An app's `https://play.google.com/store/apps/details?id=…` page. After the site and the video in the hero.                                                      |
| `presentationAsset`   | asset id?               | The wide visual the page opens on, the product staged on white. Absent for a client reference, which shows `logo` instead: no screenshot of a client's product (Stéphane, 2026-11-15).    |
| `presentationCaption` | localized?              | ≤ 160, the « Fig. » line under it. With `presentationAsset`.                                                                                                                              |
| `logo`                | asset id?               | A client reference's logo (SVG, or a PNG whose alpha is the mark), drawn monochrome in the world's ink on the card and the page. Either `logo`, or `coverAsset` with `presentationAsset`. |
| `sourceUrl`           | url?                    |                                                                                                                                                                                           |
| `coverAsset`          | asset id?               | The card image. Absent for a client reference.                                                                                                                                            |
| `gallery`             | asset id[]              | Ordered, may be empty.                                                                                                                                                                    |
| `startedAt`           | date?                   | Where a period starts, when the work spans more than its release year: « 2023 – 2024 ».                                                                                                   |
| `releasedAt`          | date?                   | Drives display order. Null while the work goes on: listed first, its period read « 2025 – aujourd'hui ».                                                                                  |
| `status`              | `draft` \| `published`  |                                                                                                                                                                                           |
| `publishedAt`         | timestamp?              | Set when status first becomes `published`.                                                                                                                                                |

The three-part structure — context, mission, steps — is inherited from the current site, where it is the best-written thing on it (spec 02).

The 2022 site's presentation visuals (about 2.5:1) are kept for now; 2× exports will replace them through the same field.

---

## `Artwork` — 3D piece

| Field         | Type                    | Notes                                                                                |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `id`          | uuid                    |                                                                                      |
| `slug`        | `{ fr, en }` kebab-case | Every piece has its own URL in each tree, so it can be shared and indexed (spec 01). |
| `title`       | localized               |                                                                                      |
| `description` | localized?              | Short. Optional — most pieces need none.                                             |
| `software`    | software slug[]         | Required, at least one. Separate vocabulary from `technologies`.                     |
| `views`       | view[]                  | Ordered, **at least one**. See below.                                                |
| `featured`    | boolean                 | Doubles the tile in the mosaic.                                                      |
| `releasedAt`  | date                    |                                                                                      |
| `status`      | `draft` \| `published`  |                                                                                      |
| `publishedAt` | timestamp?              |                                                                                      |

### Views

A piece carries several views: angles of the same model, or **process stages — wireframe, clay, final render**.

That last case is worth stating plainly, because it is why the field exists. The 3D section's job is to prove an ability to learn independently ([00-vision](00-vision.md)). A finished render proves taste; the sequence that produced it proves method. Process views are the strongest content this section can carry.

```
view: { assetId, label?, position, focal? }
```

`focal` is `{ x, y }` in `[0, 1]`, centre by default: where the mosaic crops the view around (ADR-0015). The viewer always shows the whole render.

`label` is optional localized text — `"Wireframe"`, `"Clay"`, `{ fr: "Vue de nuit", en: "Night view" }`. Absent for a plain alternate angle.

**The first view is the cover.** It is what the mosaic shows. There is no separate `coverAssetId`: a second source of truth would let the cover and the gallery disagree, and reordering in the back office makes the change visible immediately rather than silently. Accepted trade-off — reordering views changes the cover, which is predictable but has to be shown clearly in the admin UI.

The lightbox therefore navigates on two levels: across artworks, and within one artwork's views.

---

## Technology and software registries

Both are **typed constants in `@portfolio/shared-types`**, not database tables. Each entry maps a slug to a label and an icon:

```ts
{ slug: 'angular', label: 'Angular', icon: 'angular.svg' }
```

Entities store slugs. Zod validates against the registry, so a typo fails at the API boundary instead of rendering a missing icon.

A lookup table would solve nothing: the icon is an SVG in the repository either way, so adding a technology is a commit regardless. Making that explicit is more honest than pretending it is data.

**Two separate registries.** `technologies` (Angular, TypeScript, .NET, Docker, React…) and `software` (Zbrush, 3ds Max, V-Ray, Substance…). They never appear in the same filter or the same list.

---

## World content — added 2026-11-14

The world pages approved on the « Bascule Dev / 3D » mockup carry editorial content that is neither a `Project` nor an `Artwork`. It is administrable like them. Schemas: `packages/shared-types/src/world.ts`.

All four are **singletons**: a page always exists, so they have no `draft`/`published` status. Their `updatedAt` feeds the same « Publié, en attente de mise en ligne » state as the entities above (`updatedAt > lastBuildAt`).

**Order is array order.** Facts, tools and mastery points have no date to sort on, and their order is the editorial argument (Angular first). The array is the only source of truth, as for `missionSteps` and `views`.

All text is plain text, never markup. A bold lead is its own field.

### `WorldPage` — one per world (`dev`, `cgi`)

| Field          | Type                                    | Notes                                                                                  |
| -------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| `world`        | `dev` \| `cgi`                          | Discriminator.                                                                         |
| `roleWord`     | localized, 2–16 capitals, digits, space | Flips under the name at display size: « LEAD TECH », « GRAPHISTE 3D » / « 3D ARTIST ». |
| `eyebrowTools` | slug[], 1–4                             | From `technologies` for `dev`, from `software` for `cgi` — never crossed.              |
| `lede`         | `{ lead, text }`, localized             | `lead` ≤ 80, set in bold; `text` ≤ 200.                                                |
| `scrub`        | localized, 20–220, ≤ 35 words           | The sentence coloured word by word on scroll.                                          |
| `facts`        | `{ label, value }[]`, 3–6, localized    | Labels unique in each language, ≤ 24; values ≤ 80.                                     |

### `WorldStack` — one per world

`entries`: 3–10 `{ tool, points }`, one entry per tool, `tool` from the world's own registry. `points`: 2–6 `{ lead ≤ 60, text ≤ 220 }`, both localized, rendered as the numbered « Maîtrise » panel.

### `ContactPage` — singleton

`title` ≤ 120, `lede` ≤ 280, `portraitAssetId` (a cut-out with a transparent background, it stands on the diagonal plate), `portraitCaption` ≤ 60; the three texts localized.

### `SiteSettings` — singleton

`socials`: `{ kind, url }[]`, `kind` among `linkedin`, `github`, `artstation`, each once, `https` only. **No email kind**: Stéphane's address is never published in the HTML (decided 2026-11-14); visitors write through the contact form, which the API relays (ADR-0007). `cvAssetId`: the CV file.

### Kept out of the model

Presentation, not content: the name « Stéphane Lieumont », the switch and section labels, the italic accent letters, the point-cloud glyph and torus, colours and sweep direction, the two CTAs (their targets are `/contact` and `cvAssetId`), form labels and messages, social icons and their accessible names (derived from `kind`). The work counts (« 04 projets · 2021 – 2022 ») are derived from the published `Project` and `Artwork` records.

The dev world's work grid lists published `Project`s and the 3D world's mosaic lists published `Artwork`s, both by `releasedAt` descending.

---

## Ordering

**`releasedAt` descending, and nothing else.** The provisional `sortOrder` is deleted.

Two sources of truth for order always drift. With six projects and sixteen artworks, manual ordering is maintenance with no return. `featured` covers the real need — emphasis, not sequence.

---

## Publication state, with a static build

The site is prerendered (ADR-0008), so a record can be published without being online. The model has to make that legible or Stéphane will save a project, see nothing, and go looking for a bug that isn't there.

Two fields, plus one the build owns:

- `status` — editorial intent, `draft` or `published`.
- `publishedAt` — when it first became published.
- `lastBuildAt` — recorded by the build, not by the entity.

The back office derives three states from them:

| Shown                                   | Condition                                          |
| --------------------------------------- | -------------------------------------------------- |
| **Brouillon**                           | `status = draft`                                   |
| **Publié, en attente de mise en ligne** | `status = published` and `updatedAt > lastBuildAt` |
| **Publié, en ligne**                    | `status = published` and `updatedAt ≤ lastBuildAt` |

---

## Media ownership

**An asset belongs to exactly one owner.** No sharing between projects or artworks. Deleting an owner deletes its assets, in the database and in the bucket.

On a portfolio the same render never legitimately appears in two projects, and this single constraint removes the whole question of what deleting a media item means. `MediaAsset` therefore carries an owner reference rather than living in a many-to-many join.

`MediaAsset` keeps the fields ADR-0012 requires: object key, `alt` (localized; required, non-empty, real text and never a repeat of the title, in each language), intrinsic width and height, byte size, content type, dominant colour, and a processing state. One file serves both trees.

---

## Constraints inherited

- The `slug` is the public URL in each tree and is **final** once published (spec 01), in both languages.
- Media store an **object key, never an absolute URL** (ADR-0003).
- Any schema change goes through `@portfolio/shared-types` first, then the Drizzle schema, then a generated migration (`add-project` skill).

## Open

**SEO overrides.** `title` and `summary` derive the `<title>` and `meta description` for now. If a page ever needs to say something different to a search engine than to a reader, that is a pair of optional fields — added when a real case appears, not before.
