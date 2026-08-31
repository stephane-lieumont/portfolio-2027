# Spec 03 — Data model

Settled with Stéphane on 2026-08-31. The provisional schema written to prove the architecture (`packages/shared-types/src/project.ts`, `apps/api/src/db/schema.ts`) is superseded by this document.

Visitor-facing copy stored in these entities is written in **French**.

---

## Two entities, not one

`Project` describes a development case study. `Artwork` describes a 3D piece. They share a title, a slug and media, and nothing else.

The deciding argument is not schema tidiness, it is **validation**. With two entities, a dev project _requires_ a mission and a 3D piece _requires_ the software used. Folded into one entity with a `kind` discriminator, more than half the fields on a 3D record would sit empty, every field would have to become optional, and Zod would stop guaranteeing anything.

Accepted cost: two CRUD route sets and two back-office forms. Each is simpler than the single conditional form the alternative would need.

In `@portfolio/shared-types` they are two schemas, not a discriminated union — nothing in the application ever handles "a project or an artwork" generically.

---

## `Project` — development case study

| Field          | Type                   | Notes                                                                        |
| -------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `id`           | uuid                   |                                                                              |
| `slug`         | kebab-case, unique     | **Final once published.** It is the public URL.                              |
| `title`        | string                 |                                                                              |
| `summary`      | string                 | One sentence, for cards. Not the first paragraph truncated.                  |
| `context`      | rich text              | What the product was.                                                        |
| `mission`      | rich text              | What Stéphane did, and in what capacity.                                     |
| `missionSteps` | string[]               | Ordered. The concrete deliverables.                                          |
| `technologies` | tech slug[]            | From the registry below.                                                     |
| `series`       | string?                | e.g. `"Case Tes Potes"`. Groups related projects visually.                   |
| `demoUrl`      | url?                   | Proxied by nginx — **verify the route exists before publishing** (ADR-0005). |
| `sourceUrl`    | url?                   |                                                                              |
| `coverAsset`   | asset id               | Required.                                                                    |
| `gallery`      | asset id[]             | Ordered, may be empty.                                                       |
| `releasedAt`   | date                   | Drives display order.                                                        |
| `status`       | `draft` \| `published` |                                                                              |
| `publishedAt`  | timestamp?             | Set when status first becomes `published`.                                   |

The three-part structure — context, mission, steps — is inherited from the current site, where it is the best-written thing on it (spec 02).

---

## `Artwork` — 3D piece

| Field         | Type                   | Notes                                                                   |
| ------------- | ---------------------- | ----------------------------------------------------------------------- |
| `id`          | uuid                   |                                                                         |
| `slug`        | kebab-case, unique     | Every piece has its own URL, so it can be shared and indexed (spec 01). |
| `title`       | string                 |                                                                         |
| `description` | string?                | Short. Optional — most pieces need none.                                |
| `software`    | software slug[]        | Required, at least one. Separate vocabulary from `technologies`.        |
| `views`       | view[]                 | Ordered, **at least one**. See below.                                   |
| `featured`    | boolean                | Doubles the tile in the mosaic.                                         |
| `releasedAt`  | date                   |                                                                         |
| `status`      | `draft` \| `published` |                                                                         |
| `publishedAt` | timestamp?             |                                                                         |

### Views

A piece carries several views: angles of the same model, or **process stages — wireframe, clay, final render**.

That last case is worth stating plainly, because it is why the field exists. The 3D section's job is to prove an ability to learn independently ([00-vision](00-vision.md)). A finished render proves taste; the sequence that produced it proves method. Process views are the strongest content this section can carry.

```
view: { assetId, label?, position }
```

`label` is optional French text — `"Wireframe"`, `"Clay"`, `"Render final"`, `"Vue de nuit"`. Empty for a plain alternate angle.

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

`MediaAsset` keeps the fields ADR-0012 requires: object key, `alt` (required, non-empty, real text and never a repeat of the title), intrinsic width and height, byte size, content type, dominant colour, and a processing state.

---

## Constraints inherited

- The `slug` is the public URL and is **final** once published (spec 01).
- Media store an **object key, never an absolute URL** (ADR-0003).
- Any schema change goes through `@portfolio/shared-types` first, then the Drizzle schema, then a generated migration (`add-project` skill).

## Open

**SEO overrides.** `title` and `summary` derive the `<title>` and `meta description` for now. If a page ever needs to say something different to a search engine than to a reader, that is a pair of optional fields — added when a real case appears, not before.
