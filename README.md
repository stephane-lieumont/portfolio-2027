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
apps/e2e              Playwright journeys against the prerendered build
packages/shared-types Zod schemas shared between front and back
docs/adr              Architecture decisions
docs/specs            Functional and design specifications
.claude/              Agents, skills and project memory
infra/                docker-compose (MinIO, API)
```

## Commands

| Command                        | What it does                                          |
| ------------------------------ | ----------------------------------------------------- |
| `pnpm dev`                     | web + api in parallel                                 |
| `pnpm build`                   | build every package, the site through `build:site`    |
| `pnpm test`                    | tests, 80% coverage threshold                         |
| `pnpm verify`                  | typecheck + lint + format + tests + `build:site`      |
| `pnpm build:site`              | seeds a throwaway API and prerenders the site from it |
| `pnpm test:e2e`                | Playwright journeys against the built site (below)    |
| `pnpm test:site-image`         | builds the site's nginx image and checks it (Docker)  |
| `pnpm format`                  | Prettier across the repo                              |
| `pnpm infra:up` / `infra:down` | MinIO containers                                      |

End-to-end tests (ADR-0024) run against the prerendered build, so build it first. Once per machine, install the browser:

```bash
pnpm --filter @portfolio/e2e exec playwright install chromium
pnpm build:site
pnpm test:e2e
```

They need neither MinIO nor the API: pictures, Turnstile and the contact route are intercepted in the browser. On failure, `apps/e2e/test-results/` holds a trace per test (`pnpm --filter @portfolio/e2e exec playwright show-trace <trace.zip>`). CI runs them in `.github/workflows/e2e.yml`.

`pnpm ci` is a built-in pnpm command (clean reinstall), not this project's check script — use `pnpm verify`.

API-side:

```bash
pnpm --filter @portfolio/api db:seed       # load media, tools, Stack, projects, 3D pieces (idempotent)
pnpm --filter @portfolio/api db:generate   # migration after a schema change
pnpm --filter @portfolio/api db:studio     # database browser
pnpm --filter @portfolio/api admin:hash    # argon2 hash for the admin password
```

The site is prerendered from the API (ADR-0008, ADR-0022): `pnpm --filter @portfolio/web build` reads `CONTENT_API_URL` (default `http://localhost:3000`) and fails if no seeded API answers there. `pnpm build:site` starts one for the build and stops it.

### The site image

Production serves the prerendered trees from an nginx image (ADR-0021, ADR-0023): [`apps/web/Dockerfile`](apps/web/Dockerfile) copies `dist/web/browser` and [`apps/web/nginx/nginx.conf`](apps/web/nginx/nginx.conf), listens on 8080 and answers `/healthz`. It builds nothing; build the site first:

```bash
pnpm build:site
docker build -t portfolio-site apps/web
pnpm test:site-image   # builds and runs the image, checks routes, redirects, 404s and headers
```

The CSP hashes of the inline scripts are written by the build to `dist/web/nginx/csp-inline-scripts.conf`. `test:site-image` opens pages in headless Chrome when one is installed (`CHROME_PATH` to point at it) and skips that part otherwise. TLS, HSTS, `/api` and `/medias` belong to the VPS's reverse proxy, in the infrastructure repository.

## Configuration

Everything goes through `.env`, modelled on `.env.example`. The defaults are fine for local development.

In production the API refuses to start if `ADMIN_PASSWORD_HASH` is empty or if `SESSION_SECRET` is still at its development value.

## Conventions

Code, security and testing rules live in [CLAUDE.md](CLAUDE.md). The reasoning behind the technical choices lives in [docs/adr](docs/adr/), and what the site must do in [docs/specs](docs/specs/).
