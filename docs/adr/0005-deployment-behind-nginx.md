# ADR-0005 — Deployment behind the existing nginx reverse proxy

- **Status**: Accepted
- **Date**: 2026-08-30

## Context

`stephane-lieumont.fr` already runs behind **nginx**, which serves the portfolio and **routes demo links to separately hosted projects**. The 2022 portfolio relies on that mechanism: the projects' `demoLink` fields point at paths nginx routes to other applications.

This infrastructure works and is not up for debate. Portfolio 2027 slots into it.

What's new is that there are now **three things to serve** instead of one: the Angular static files, the Fastify API, and the MinIO media — without breaking the existing demo links.

## Decision

One domain, nginx up front, path-based routing:

| Path       | Destination                                                 |
| ---------- | ----------------------------------------------------------- |
| `/api/*`   | Fastify container (port 3000)                               |
| `/media/*` | MinIO bucket, read-only                                     |
| `/demo/*`  | separately hosted projects — **existing routes, preserved** |
| `/*`       | Angular static files, falling back to `index.html`          |

Angular calls the API on a relative path (`/api`, via the `API_BASE_URL` token): **no absolute API URL in the bundle**, therefore no per-environment configuration to recompile, and no CORS in production since everything is same-origin.

The API and MinIO run as containers via `infra/docker-compose.yml`. They expose no public port: only nginx reaches them.

The `index.html` fallback is required for Angular's client-side routing, but it must **never** apply to `/api`, `/media` or `/demo` — otherwise an API error would silently return HTML instead of a JSON response, and the bug would be miserable to diagnose.

## Consequences

Same origin for everything: no CORS in production, the session cookie is sent naturally, and no per-environment URL configuration in the front end.

The demo links keep working untouched, which was the non-negotiable constraint.

A single TLS certificate, terminated at nginx; internal services speak HTTP over the Docker network.

The trade-off: the nginx configuration becomes a single point of failure and **lives outside the repository** — one badly ordered `location` block can make the API vanish behind the `index.html` fallback, and nothing in the code would hint at it. This configuration deserves to be backed up with the same care as the database.

Local development, by contrast, is cross-origin (Angular on 4200, API on 3000): CORS is active there and configured through `WEB_ORIGIN`. Development and production differ on this point, which is worth remembering when chasing a cookie or header bug.

## Alternatives considered

**A subdomain for the API (`api.stephane-lieumont.fr`)** — conceptually cleaner, but it reintroduces CORS in production and complicates the session cookie (parent-domain cookie, `sameSite` to reconsider). No benefit for a single-domain site.

**Serving Angular from Fastify** — one service fewer, but Node would be serving static files that nginx serves better, and nginx would still be needed out front for TLS and the demo redirects.

**Static site hosting (Vercel, Netlify) for the front end** — excellent for the front end alone, but the backend and MinIO would still need hosting elsewhere, and the demo links depend on the current nginx. You'd end up with two infrastructures for one site.
