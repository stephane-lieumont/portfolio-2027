# Spec 03 — Data model

> **Status: deferred.** Stéphane decided on 2026-08-31 that the modelling rules for projects and the 3D gallery will be settled together at the start of the build, not now. This document exists to make that conversation short: it records what the provisional schema already assumes, and the questions it leaves open.
>
> **The current schema is provisional.** `packages/shared-types/src/project.ts` and `apps/api/src/db/schema.ts` were written to prove the architecture end to end, not to model the domain. Nothing in them is settled.

## What exists today

One `Project` entity covering both kinds, discriminated by `kind: 'dev' | 'cgi'`:

`id`, `kind`, `status`, `slug`, `title`, `summary`, `description`, `mission`, `missionSteps`, `technos`, `tags`, `demoUrl`, `sourceUrl`, `coverAsset`, `gallery`, `releasedAt`, `sortOrder`.

Plus `MediaAsset` (object key, alt, dimensions, byte size, content type) and a `project_gallery` join table with an explicit position.

## Open questions

**1. One entity or two?**
A dev project and a 3D piece share `title`, `slug` and media, and almost nothing else. A render has no mission, no mission steps, no demo URL, no source URL — but it does have the software used, which is not the same thing as a dev stack. Today more than half the fields on a 3D record would be null. Two entities is more honest; one entity is less code. This is the first decision, because everything else follows from it.

**2. Where does mosaic layout live?**
The current gallery uses tile modifiers — `--single`, `--double-row`, `--double-column` — to build its dense mosaic. That is presentation, but it is authored per image and has to be stored somewhere. Options: a field on the piece, derived automatically from the image's aspect ratio, or dropped in favour of a layout that reads intrinsic ratios (which is what ADR-0012 pushes toward).

**3. Software versus stack.**
Dev projects list Angular, TypeScript, .NET. 3D pieces list Zbrush, 3ds Max, V-Ray. Same shape, different vocabulary, and they must never mix in a filter or a tag cloud.

**4. Ordering.**
`sortOrder` and `releasedAt` both exist and can disagree. Decide which one drives display, and whether manual ordering is worth its maintenance cost.

**5. Series.**
Case Tes Potes is three separate projects — mobile, landing page, web app — sharing one product story. Flat list, explicit grouping, or a parent project with parts?

**6. Draft and publish, with a static build.**
The site is prerendered (ADR-0008), so `status: 'published'` is only true once a rebuild has run. The model has to make the difference between _saved_, _published_ and _live_ legible, or Stéphane will wonder why his project is not showing.

**7. Media reuse.**
Can one asset belong to several projects? The join table allows it; whether the back office should is a separate question, and it decides what deleting an asset means.

## Constraints already settled

- The `slug` is the public URL and is **final** once published (spec 01).
- Media store an **object key, never an absolute URL** (ADR-0003).
- `alt` is required and must be real text, not a repeat of the title (ADR-0010, ADR-0012).
- Every 3D piece needs **its own URL** to be shareable and indexable (spec 01), which means a slug even for a single image.
- The schema is the **shared contract** between front and back: any change goes through `@portfolio/shared-types` first, then the Drizzle schema, then a generated migration (see the `add-project` skill).
