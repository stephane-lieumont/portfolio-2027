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
| Angular     | 22                 | standalone, zoneless, signals                         |
| TypeScript  | 6.0.x              | imposed by Angular 22 (`>=6.0 <6.1`)                  |
| Fastify     | 5                  |                                                       |
| Drizzle ORM | 0.45               | SQLite via `better-sqlite3`                           |
| Zod         | 4                  | validation shared front/back                          |

## Non-obvious runtime constraints

**The API has no build step.** Node 22 runs the TypeScript by type stripping. Direct consequences: relative imports carry the `.ts` extension, and `erasableSyntaxOnly` forbids enums, namespaces and constructor parameter properties. The typecheck enforces it, so the error shows up as you write.

**The npm registry is pinned to the public registry** by the project's `.npmrc`. Stéphane's global `~/.npmrc` points at Web Atrio's CodeArtifact with a token that expires — without this local file, `pnpm install` fails with a 401.

**pnpm 11 blocks native build scripts by default.** `better-sqlite3`, `argon2`, `esbuild`, `lmdb`, `@parcel/watcher` and `msgpackr-extract` are explicitly allowed in `pnpm-workspace.yaml`. Without that, the install succeeds but the API will not start.

**The API boot depends on MinIO**: the `storage` plugin checks the bucket exists at startup and creates it if needed. `pnpm infra:up` must come before `pnpm dev:api`.

**The verification script is called `verify`, not `ci`.** `pnpm ci` is a pnpm built-in command (clean reinstall) that silently shadows a script of the same name — it wipes `node_modules` instead of running the checks.

## Commands

```bash
pnpm dev                              # web + api in parallel
pnpm infra:up                         # MinIO (console on :9001)
pnpm verify                           # typecheck + lint + format + tests
pnpm --filter @portfolio/api db:generate   # migration after a Drizzle schema change
pnpm --filter @portfolio/api admin:hash    # argon2 hash of the admin password
```

## What was ruled out

Nx, NestJS, .NET, PostgreSQL, JWT, GSAP. Each has its reason written in the corresponding ADR — read it again before proposing them anew.

See [[design-system]] for the visual layer and [[content-guidelines]] for editorial.
