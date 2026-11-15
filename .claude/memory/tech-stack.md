---
name: tech-stack
description: Technical foundation of Portfolio 2027 and the reasons behind the choices — versions, tooling, runtime constraints
metadata:
  type: project
---

# Technical foundation

Operational summary of the choices. The full reasoning lives in `docs/adr/`.

## Versions

| Component   | Version            | Constraint                                            |
| ----------- | ------------------ | ----------------------------------------------------- |
| Node        | 22.23.2 (`.nvmrc`) | Angular 22 requires ≥ 22.22.3                         |
| pnpm        | 11.24.0            | workspaces, `allowBuilds` required for native modules |
| Angular     | 22                 | standalone, zoneless, signals, static output          |
| TypeScript  | 6.0.x              | imposed by Angular 22 (`>=6.0 <6.1`)                  |
| Fastify     | 5                  |                                                       |
| Drizzle ORM | 0.45               | SQLite via `better-sqlite3`                           |
| Zod         | 4                  | validation shared front/back                          |

## Non-obvious runtime constraints

**The API has no build step.** Node 22 runs the TypeScript by type stripping. Direct consequences: relative imports carry the `.ts` extension, and `erasableSyntaxOnly` forbids enums, namespaces and constructor parameter properties. The typecheck enforces it, so the error shows up as you write.

**The npm registry is pinned to the public registry** by the project's `.npmrc`. Stéphane's global `~/.npmrc` points at Web Atrio's CodeArtifact with a token that expires — without this local file, `pnpm install` fails with a 401.

**pnpm 11 blocks native build scripts by default.** `better-sqlite3`, `argon2`, `esbuild`, `lmdb`, `@parcel/watcher` and `msgpackr-extract` are explicitly allowed in `pnpm-workspace.yaml`. Without that, the install succeeds but the API will not start.

**The API boot depends on MinIO**: the `storage` plugin checks the bucket exists at startup and creates it if needed. `pnpm infra:up` must come before `pnpm dev:api`.

**MinIO runs from `cgr.dev/chainguard/minio`** (2026-11-15, #44): `minio/minio` is no longer published on Docker Hub nor quay.io. The Chainguard image ships the same `minio` binary and `mc`, so the compose healthcheck (`mc ready local`) and the seed script work unchanged.

**The web build is static prerendering, not SSR.** `outputMode: 'static'` with
`@angular/ssr` and `@angular/platform-server` used only at build time
(`main.server.ts`, `app.config.server.ts`, `app.routes.server.ts`). Every
server route is `RenderMode.Prerender`; production serves files from nginx and
runs no Node process (ADR-0008). Components therefore run once on the server
during the build: anything touching the browser goes under `afterNextRender`
or `isPlatformBrowser`. Hydration is on (`provideClientHydration`), so the
first client render must produce the same DOM as the prerender. Versions are pinned
exactly: `@angular/platform-server` to the installed `@angular/core`,
`@angular/ssr` to the installed `@angular/build` (it ships with the CLI). Bump
them in the same change as core and build, or the peers break.

**The web package is `"type": "module"`** so the post-build check
(`scripts/check-prerender.mjs`) can import the content `.ts` directly.
`pnpm verify` runs that build, so it takes a few seconds longer than the tests
alone.

**The site is built from the API (ADR-0022).** Projects and 3D pieces live in
the API's SQLite (`works`, one JSON document per record, validated by the
shared Zod schemas), beside `media_assets` (every image's metadata, the files
staying in the bucket or `public/`), `tools` and `stack` (the world pages'
Stack and « Maîtrise » points). Works name media and tools by id; the API
resolves them (`src/lib/resolve-content/`). All four are seeded from
`apps/api/src/db/seed/` (`media.ts`, `tools.ts`, `stack.ts`, `content.ts`),
their only source until the back office. Before `ng build`, `apps/web/scripts/content.mjs`
fetches works, tools and Stack from `CONTENT_API_URL` (default
`http://localhost:3000`) into the gitignored
`core/data/content/content.generated.ts`; an unreachable API fails the build.
Tests, typecheck, lint and `ng serve` write that file from the seed instead
(`--seed`), no server needed. `pnpm --filter @portfolio/web build` alone
therefore needs a running, seeded API: `pnpm build:site` provides one on a
temporary SQLite (`src/content-server.ts`: the read routes alone, no MinIO).
**Shared-types modules import each other by subpath**
(`@portfolio/shared-types/localized`), never `./x.js`: Node runs the API's
TypeScript as is and cannot map `.js` to `.ts`, so the API imports subpaths
(`/project`, `/tool`, `/contact`…), never the root barrel, for values.

**The verification script is called `verify`, not `ci`.** `pnpm ci` is a pnpm built-in command (clean reinstall) that silently shadows a script of the same name — it wipes `node_modules` instead of running the checks.

## Commands

```bash
pnpm dev                              # web + api in parallel
pnpm infra:up                         # MinIO (console on :9001)
pnpm verify                           # typecheck + lint + format + tests + build:site
pnpm build:site                       # seeded throwaway API, then the web build against it
pnpm --filter @portfolio/web build    # prerender from CONTENT_API_URL, then check every route
pnpm --filter @portfolio/api db:seed  # load the content into DATABASE_FILE (idempotent)
pnpm --filter @portfolio/api db:generate   # migration after a Drizzle schema change
pnpm --filter @portfolio/api admin:hash    # argon2 hash of the admin password
```

## What was ruled out

Nx, NestJS, .NET, PostgreSQL, JWT, GSAP. Each has its reason written in the corresponding ADR — read it again before proposing them anew.

See [[design-system]] for the visual layer and [[content-guidelines]] for editorial.

**The site is bilingual (ADR-0017).** Two prerendered trees from Angular's
built-in i18n: French at the root (`sourceLocale` `fr`, empty `subPath`),
English under `/en` with English slugs. Strings are marked `i18n` / `$localize`
with `@@` ids; a missing English translation fails the build. Dynamic copy is
`{ fr, en }` in shared-types, never translated at runtime. Only `/` redirects
(nginx, `lang` cookie then `Accept-Language`).

**The web app is layered (ADR-0018).** `src/app` holds `core/` (services,
stores, i18n, config, static data), `shared/` (generic UI, no domain),
`common/` (domain pieces several features use), `features/<name>/{views,components}`
and `layouts/site-layout/` (the root). Aliases `@core`, `@shared`, `@common`,
`@features`, `@layouts`; ESLint refuses an import against that order and any
`../` that leaves a folder. Files and classes keep Angular suffixes
(`world-page.component.ts`, `WorldStore`).

**Folders (ADR-0018):** anything made of more than one file (code + spec, template, styles) lives in its own folder named after it — services, stores and helpers too, e.g. `core/services/contact/contact.service.ts`.

**Build and deployment (ADR-0021, 2026-11-15)**: a `v*` tag runs GitHub Actions — `pnpm verify`, API image to GHCR, deploy over SSH (dedicated `deploy` user, forced command `deploy.sh <service> <tag>`), then the site is prerendered against the production API's public GET routes, packaged as an nginx image (`apps/web/Dockerfile`, config `apps/web/nginx/nginx.conf`, ADR-0023: unprivileged nginx on 8080, `/` language redirect, hash-based CSP generated by the build) and deployed the same way. From V1.1 the back office's « Publier le site » re-runs the site steps through `workflow_dispatch`.
