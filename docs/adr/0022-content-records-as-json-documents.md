# ADR-0022 — Content records stored as validated JSON documents, read by the build

- **Status**: Accepted
- **Date**: 2026-11-15

## Context

Until now the site's projects and 3D pieces lived in a TypeScript file inside the Angular app (`core/data/static-content/static-content.ts`). ADR-0008 and ADR-0021 settled that the site is prerendered from the API, which therefore has to serve that content before V1 ships (issue #40). The back office that will edit it is V1.1.

The API's database held a provisional `projects` table written to prove the architecture: one column per field, a `sort_order`, a gallery join table. Spec 03 superseded it, and the content has kept moving since — client references with a logo instead of visuals, periods with a start and an ongoing end, a Google Play link, a dark logo plate on trial. Each of those was one field in a Zod schema and in the static file. In a column-per-field table each would also have been a migration, and every localized field (`{ fr, en }`, ADR-0017) would have been two columns or a JSON column anyway.

A `Project` and an `Artwork` are read whole: the site never asks for « every title » or « the projects using Docker ». What the API does query is small and stable: the kind, the publication status, the slug in each language, the release date.

## Decision

**Each dev project and each 3D piece is one row of a `works` table, the record itself stored as a JSON `document`.** The document is the shape `@portfolio/shared-types` defines (`projectSchema`, `artworkSchema`), validated by Zod when it is written and again when the API serves it. Beside it, the row keeps the columns the API filters and sorts on, written in the same statement as the document: `id`, `kind` (`dev` | `cgi`), `status`, `slug_fr`, `slug_en` (unique per kind and language), `released_at`, `published_at`, `created_at`, `updated_at`. Media keeps its own table (spec 03), untouched here.

**The public read routes** are `GET /api/projects`, `GET /api/artworks` and `GET /api/{projects,artworks}/:locale/:slug`, published records only, newest first, records released the same day in creation order; and `GET /api/tools`, the two tool registries tagged with their world. Every response is sent with `Cache-Control: no-cache`, so a build run right after a publish never reads a cached list.

**Tools stay a code registry in V1.** Spec 04 §2 makes `Tool` a record with its mark and its « Maîtrise » points, but the world pages' stack, the marks and the registries' compile-time slug types are woven through the front end, and spec 04 §1 keeps the world pages static for this version. `GET /api/tools` serves the registries as they are, so the V1.1 back office has its vocabulary; moving them to a table is V1.1's change.

**The seed is the content's only source until the back office.** `apps/api/src/db/seed/content.ts` holds the records; `pnpm --filter @portfolio/api db:seed` validates every one before writing any, then upserts them, published, by id. Running it twice changes nothing, and a record whose document did not change keeps its `updated_at`.

**The site reads the API before its build.** `apps/web/scripts/content.mjs` fetches the two lists from `CONTENT_API_URL` (default `http://localhost:3000`) and writes `core/data/content/content.generated.ts`, gitignored, which the app imports exactly as it imported the static file. An unreachable API fails the build. The tests, the typecheck and `ng serve` write the same file from the seed instead (`--seed`), so they need no server. `pnpm build:site` seeds a temporary SQLite file, starts the read routes alone on it (`src/content-server.ts`, which needs neither MinIO nor SMTP), builds the site and stops the server; `pnpm verify` ends with it, locally and in CI.

## Consequences

- A new content field is a schema change and nothing else: no migration, no column. The table only changes when the API needs to filter or sort on something new.
- The same Zod schema guards the seed, the database's output and, in V1.1, the back office's input. A stored document that no longer meets it makes the API answer 500 and the build fail, rather than reach a page.
- The site's pages are what they were from the static file: the generated module has the same shape and the app reads it synchronously, so no component or route changed beyond its import. Measured on the 56 prerendered pages, they differ from `main`'s only by bundle hashes and hydration template ids, which also differ between two builds of the same code.
- **Querying inside the document is awkward.** « Every project using Angular » means `json_each` over every row or loading them all. At a few dozen records loading them all is instant; if a real need appears, the value becomes a column beside the document, kept in step by the code that writes both.
- **The document's shape has no migration.** Renaming or restructuring a field means rewriting the stored documents in a script, and until then they fail validation on the way out. Adding an optional field costs nothing; anything else is a data migration written by hand.
- **The columns duplicate the document.** Slugs, kind and release date exist twice and are only consistent because every write goes through the code that sets both. V1.1's write routes must keep that invariant; nothing in SQLite enforces it.
- **Order within a day is creation order.** Most pieces are dated by their year only, and the mosaic's order among them is editorial. Spec 03 forbids a sort field, so the API orders ties by the table's `rowid`: the seed's order on a fresh database. A record re-created later goes after its peers; the V1.1 back office will need a deliberate answer if Stéphane wants to reorder within a year.
- **The seed does not delete.** A record removed from the seed file stays in a database that already holds it; removing it is a manual `DELETE` until the back office exists.
- **The build now depends on the API,** locally too: `pnpm --filter @portfolio/web build` alone fails unless an API answers at `CONTENT_API_URL`. `pnpm build:site` is the one-command path. The tests read the seed, so a content edit that breaks a content check fails `pnpm verify` before the build.
- In V1.1 the database becomes the source and the seed file a fixture for the tests and for a fresh environment; at that point it will drift from production, and that is expected.

## Alternatives considered

- **One column per field, as the provisional schema had.** Real SQL queries on every field and constraints in the database. Rejected: every field the content has gained this autumn would have been a migration, localized fields double the columns, and nothing in the site queries by field. The constraints that matter are cross-field (a logo or a presentation, never both) and live in Zod anyway.
- **Two tables, `projects` and `artworks`, as spec 03's two entities.** Rejected for now: both rows would have exactly the same columns, and one table keeps one upsert and one ordering rule. The two entities stay distinct where it matters, in two schemas and two route sets.
- **Angular's prerender fetching the API with `HttpClient`, and `TransferState` for the browser.** No generated file. Rejected: the routes, the language switch and the mosaic read the content synchronously, so every one of them would have to wait on a store; and `TransferState` writes the data into each page's HTML, which would have changed every page and grown each by the whole catalogue.
- **The seed as a JSON file exported from the TypeScript content.** Rejected: the content's provenance notes (« only the open-source stack », where a year comes from) are comments, and JSON has none. A typed TypeScript file is checked against the schema types by the API's typecheck as well.
- **Keeping the static file in the app as a fallback when the API is down.** Rejected by ADR-0008: a build from a second copy would ship content the API no longer holds, silently.
