# Portfolio 2027

Portfolio of Stéphane Lieumont — Lead Tech and 3D artist. Successor to the 2022 React portfolio, rewritten in Angular with a back office to publish projects without redeploying the site.

> **Language policy.** Code and documentation are written in English. The site's visitor-facing content is written in French — that is the audience.

## Requirements

- Node 22 (`nvm use` — the version lives in `.nvmrc`)
- pnpm 11 (`corepack enable`)
- Docker, for MinIO

## Getting started

```bash
nvm use
pnpm install
cp .env.example .env
pnpm infra:up
pnpm dev
```

- Site: http://localhost:4300
- API: http://localhost:3000
- MinIO console: http://localhost:9001

`pnpm infra:up` must run before the API: the storage plugin checks the bucket at startup.

## Layout

```
apps/web              Angular 22 — public site and back office
apps/api              Fastify + SQLite — projects, media, contact
packages/shared-types Zod schemas shared between front and back
docs/adr              Architecture decisions
docs/specs            Functional and design specifications
.claude/              Agents, skills and project memory
infra/                docker-compose (MinIO, API)
```

## Commands

| Command                        | What it does                      |
| ------------------------------ | --------------------------------- |
| `pnpm dev`                     | web + api in parallel             |
| `pnpm build`                   | build every package               |
| `pnpm test`                    | tests, 80% coverage threshold     |
| `pnpm verify`                  | typecheck + lint + format + tests |
| `pnpm format`                  | Prettier across the repo          |
| `pnpm infra:up` / `infra:down` | MinIO containers                  |

`pnpm ci` is a built-in pnpm command (clean reinstall), not this project's check script — use `pnpm verify`.

API-side:

```bash
pnpm --filter @portfolio/api db:generate   # migration after a schema change
pnpm --filter @portfolio/api db:studio     # database browser
pnpm --filter @portfolio/api admin:hash    # argon2 hash for the admin password
```

## Configuration

Everything goes through `.env`, modelled on `.env.example`. The defaults are fine for local development.

In production the API refuses to start if `ADMIN_PASSWORD_HASH` is empty or if `SESSION_SECRET` is still at its development value.

## Conventions

Code, security and testing rules live in [CLAUDE.md](CLAUDE.md). The reasoning behind the technical choices lives in [docs/adr](docs/adr/), and what the site must do in [docs/specs](docs/specs/).
