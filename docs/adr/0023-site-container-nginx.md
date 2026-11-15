# ADR-0023 — The site container: its nginx, the root redirect, cache headers and a hash-based CSP

- **Status**: Accepted
- **Date**: 2026-11-15

## Context

ADR-0021 packages the site as an nginx image deployed behind the VPS's reverse proxy, which terminates TLS and routes `/api` to the API and `/medias` to MinIO. ADR-0005 (amended) prescribed the static rules — `try_files $uri $uri/index.html =404`, a 404 per tree, a `/` redirect on the `lang` cookie then `Accept-Language` — but as a sketch for a config that lived outside the repository and had never run. Issue #43 brought that config into this repository, inside the image, where CI can test it.

Measured on the build of 2026-11-15, the pages run inline script: the two boot scripts of `src/index.html` (identical on every page), Angular's event-dispatch contract and its `__jsaction_bootstrap` call (five variants, by the events a page binds), and the critical-CSS loader's `onload="this.media='all'"` attribute on the stylesheet link. Without that handler running, the global stylesheet stays `media="print"` and the page renders unstyled. The contact page loads Cloudflare Turnstile (script and frame from `challenges.cloudflare.com`, ADR-0020). Images come from `/medias`, same origin through the proxy. YouTube is linked, never embedded.

## Decision

**The image is `nginxinc/nginx-unprivileged`, pinned, with the trees copied in.** No multi-stage build: CI builds `dist/web/browser` and the image only copies it (`apps/web/Dockerfile`, context `apps/web`). It listens on 8080, answers `/healthz`, runs `nginx -t` at build time, and has a Docker `HEALTHCHECK`. `absolute_redirect off`: behind the proxy the container sees `http` on 8080, so every `Location` is relative.

**Routing.** `/` answers 302: `lang=en|fr` cookie first, then the first tag of `Accept-Language` — `fr*` → `/developpeur`, absent or `*` → `/developpeur` (the source language), anything else → `/en/developer`, as ADR-0017 says (« does not rank French first »), not only `en*`. `Cache-Control: no-store`, `Vary: Accept-Language, Cookie`. `/en` and `/en/` answer 302 to `/en/developer` whatever the cookie: the address names the language. No other address is redirected. Misses — and directories without a page, which nginx would answer 403 — get their tree's 404 page with a 404 status.

**The Angular meta-refresh pages at `/index.html` and `/en/index.html` stay**, as the fallback for a server without these rules. nginx's exact-match locations answer `/` and `/en/` before they are read.

**Cache.** Set once at server level from a map on the answered URI, so no location's `add_header` can silently drop the security headers. Hashed bundles (`-[A-Za-z0-9_-]{8}.js|css`): `public, max-age=31536000, immutable`. Everything else — HTML, `sitemap.xml`, `robots.txt`, fonts, logos, marks — `no-cache`: revalidated on every visit (a 304 when unchanged), so a deployment is never hidden behind a cache (Stéphane, 2026-11-15). Their names carry no hash; `icons.woff` changes whenever an icon is added. The cost is one conditional request per such file per visit.

**CSP, with script hashes, not `'unsafe-inline'`.** The build hashes every executable inline script and inline handler of every page (`apps/web/scripts/write-csp-hashes.mjs`) into `dist/web/nginx/csp-inline-scripts.conf`, which the image includes. The policy:

```
default-src 'self'; script-src 'self' <hashes> 'unsafe-hashes' <handler hash> https://challenges.cloudflare.com;
style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; media-src 'self';
frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

`'unsafe-hashes'` allows exactly the hashed handler, nothing else. Styles keep `'unsafe-inline'`: Angular writes component styles as `<style>` elements and the prerendered HTML carries `style` attributes.

Also: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` turning off camera, microphone, geolocation, payment and USB, `X-Frame-Options: DENY`, `server_tokens off`, gzip. **HSTS is the TLS proxy's**, not set here: a header promising HTTPS belongs to the server that speaks it.

`pnpm test:site-image` builds and runs the image and checks all of the above, opening pages in headless Chrome to catch any policy violation; the `site image` workflow runs it in CI.

## Consequences

- The config is versioned, reviewed and tested with the code; ADR-0005's « lives outside the repository, nothing in the code would hint at it » now applies only to the reverse proxy.
- An inline script that is added or changed is hashed by the next build, with no hand edit. But the CSP is only as true as the build it came with: the image must always be built from the `dist` it ships, which ADR-0021's pipeline does.
- Turnstile is allowed by host. If Cloudflare moves it to another host, the contact form breaks until the policy follows; the headless check in CI fails first.
- Browsers without `'unsafe-hashes'` (Firefox before 109, Safari before 15.4) block the stylesheet's `onload` and render the page unstyled. Accepted: that is 2022 and older.
- `style-src 'unsafe-inline'` leaves style injection open. A lesser risk than script, and the price of Angular's emulated encapsulation.
- No brotli: the official images do not ship the module, and a custom build is a maintenance burden for a few kilobytes.
- Fonts are revalidated daily instead of cached for a year, at the cost of a 304 per font a day.
- The `site image` workflow repeats `build:site`, a few minutes of CI per push.

## Alternatives considered

- **`'unsafe-inline'` for scripts.** Simplest, and the CSP then stops nothing an injection would do. Rejected while the inline scripts are fixed at build time and hashable.
- **Angular's `autoCsp`.** It emits its own meta CSP with `'strict-dynamic'` and rewrites the script loading. Rejected: a change to how every page boots, for what a build step and a header achieve.
- **Disabling critical-CSS inlining** to get rid of the `onload` handler and `'unsafe-hashes'`. Rejected: the global stylesheet would block the first paint on every page to simplify a header.
- **Fonts `immutable` for a year**, as first proposed. Rejected: the files are not hashed, and a changed icon font would stay stale for a year.
- **Redirecting `/` only on `en*`**, as first proposed. Rejected: ADR-0017 sends every non-francophone to English.
- **Keeping the config in the infrastructure repository.** Rejected: untested, and drifting from the build it serves — the live config still carries the `index.html` fallback ADR-0005 withdrew.
