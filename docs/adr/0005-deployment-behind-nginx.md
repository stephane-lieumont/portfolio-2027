# ADR-0005 — Deployment behind the existing nginx reverse proxy

- **Status**: Accepted
- **Date**: 2026-08-30
- **Amended**: 2026-11-14 — the `index.html` fallback is replaced by prerendered files and a real 404 (see the amendment below)
- **Amended**: 2026-11-15 — two language trees (ADR-0017): the `/` redirect negotiates the language, and each tree has its own 404

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

## Amendment — 2026-11-14

Prerendering (ADR-0008) is built: the Angular output is one HTML file per route (`<route>/index.html`) plus `404/index.html`. The `index.html` fallback in the table above is **withdrawn** for `/*`. `index.html` is now the prerendered home page: served under an unknown URL it answers 200 with the wrong page, which the browser then hydrates against the wrong route.

| Path | Destination                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------- |
| `/*` | Angular static files: `try_files $uri $uri/index.html =404;` and `error_page 404 /404/index.html;` |

Everything else in this decision stands: `/api`, `/media` and `/demo` are matched before `/*`, and the rule that no fallback ever applies to them is unchanged. An unknown URL now gets a real 404 status with the site's 404 page, which is what spec 01 asks for. A direct visit to `/404/` answers 200; the page is `noindex`, so that is accepted.

## Note — 2026-11-14: the root redirects

`/` has no page any more: the site opens on the developer world (approved « Bascule » mockup). The static build writes `index.html` as a meta-refresh to `/developpeur`, which works with the rule above and with script disabled. A crawler and a shared link are better served by a real permanent redirect, so nginx should answer it first:

```nginx
location = / { return 301 /developpeur; }
```

The meta-refresh file stays as the fallback for any server that does not.

## Amendment — 2026-11-15: two language trees

The site is bilingual (ADR-0017). The build now writes the French tree at the root of `dist/web/browser`, exactly as before, and the English tree under `en/`, with its own pages, its own `index.html` (a meta-refresh to `/en/developer`) and its own `en/404/index.html`. This replaces the 301 of the note above.

**Only `/` negotiates the language.** Every other address opens the language it names; a shared link is never redirected. The visitor's explicit choice, the `lang` cookie the header's switcher sets, wins over the browser's languages:

```nginx
# http {} level
map $cookie_lang $site_tree_from_cookie {
    en      /en/developer;
    fr      /developpeur;
    default "";
}
map $http_accept_language $site_tree_from_browser {
    ~*^fr   /developpeur;   # French ranked first
    ""      /developpeur;   # no header: the source language
    default /en/developer;
}
map $site_tree_from_cookie $site_home {
    ""      $site_tree_from_browser;
    default $site_tree_from_cookie;
}

# server {} level
location = / {
    add_header Vary "Accept-Language, Cookie" always;
    return 302 $site_home;
}
location /en/ {
    try_files $uri $uri/index.html =404;
    error_page 404 /en/404/index.html;
}
location / {
    try_files $uri $uri/index.html =404;
    error_page 404 /404/index.html;
}
```

- **302, not 301**: the answer depends on the visitor, so no cache may keep it; `Vary` says on what. A permanent redirect would pin the first visitor's language for everyone behind a shared cache.
- **"French ranked first"** reads the first tag of `Accept-Language` only (`fr`, `fr-FR`, `fr-CA`…). A browser listing `en-US,fr;q=0.9` goes to English, as ADR-0017 asks; a `q` weight placed first is not parsed, which no mainstream browser sends.
- `/en` without its slash falls through to `location /` and its `try_files` finds `en/index.html`, the English meta-refresh. An unknown address under `/en/` gets the English 404 with a 404 status; anywhere else, the French one.
- The `index.html` meta-refresh files stay as the fallback for a server without this logic: the root then always opens in French.

Not verified against a real nginx: the configuration lives outside the repository. The local check of the build (a static server answering per tree) is in STATUS.
