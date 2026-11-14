# Status

Last updated 2026-11-14. Describes `main` (PR #17 merged) with `feat/prerender`
on top.

## Works today

**Foundations** — pnpm monorepo, Angular 22 standalone/zoneless/signals, shared
Zod types, Fastify API skeleton with `/health`, MinIO in docker-compose
(declared, not yet used). 13 ADRs, 6 specs.

**Design system** — primitive and semantic tokens, `light-dark()`, typography
scale, base reset. Contrast measured against the worst pixel a blended texture
can produce, not against the flat surface.

**Shell** — header that transforms on scroll, burger menu on the Web Animations
API with an elastic edge, skip link, route announcement for screen readers,
footer hidden on the home page.

**Home** — full-bleed diagonal split, hover zoom with a real 3.8s release, and a
five-phase entrance behind the Pac-Man loader.

**Pages** — Developer (list), Gallery (list), Contact, project detail at
`/developpeur/<slug>`, 404 with the Travolta easter egg.

**Section reveal** — the 2022 scroll-in, on an IntersectionObserver. Content
already on screen at arrival plays with the page's entrance; the rest waits
until it is a third into the viewport. One rise, duration and step for every
reveal; travel zeroed under `prefers-reduced-motion`. Nothing hides without
script.

**Tool marks** — the Developer page's tools as mark and name: the 2022 PNG,
else the icon-font glyph, else the tool's initial as a monogram (Angular and
.NET today). Glyphs, monograms and names in `--text-secondary`: orange
unboxed text is a tertiary button at rest in spec 06 §10, and these do nothing.

**Prerendering (ADR-0008)** — `outputMode: 'static'`: the build writes one
complete HTML file per route under `dist/web/browser` — `/`, `/developpeur`,
`/graphisme-3d`, `/contact`, one per project (`developpeur/<slug>`, enumerated
from the static `PROJECTS`; ADR-0008 says from the API once it serves them),
and `/404/index.html` for nginx's `error_page`. No route renders on demand and
no Node process runs in production. Client hydration with event replay keeps
the prerendered DOM, so the loader's entrance plays on it untouched (measured:
0 hydration mismatches on every route in the dev build, and no console
output from the production build). With script disabled every
page is readable, the reveal hides nothing and the drawer stays off screen.
`pnpm verify` now ends with the web build, which fails unless every expected
route was emitted with its own `<title>`, its heading and copy as text, a
description (`noindex` on the 404 only), hydration data, and nothing hidden
before script. The rules are tested against mutated pages
(`scripts/prerender-checks.test.mjs`).

Known limits, deliberately not fixed here:

- The project list is read from the static `PROJECTS` in three places —
  `app.routes.server.ts` (prerender params), the route resolvers and
  `scripts/prerender-checks.mjs`. All three move to the API (ADR-0008).
- Without script, the navigation is unreachable below 48rem: the burger needs
  JavaScript. That contradicts spec 01; the shell PR fixes it.
- The footer year is the build's year until the script runs.

**Section reveal at boot** — the page is painted complete before the bundle
arrives, so the reveal hides only what nobody has seen yet: content still under
the loader, or below the fold. Content on screen once the loader has gone is
settled where it stands (`reveal--settled`). Hiding needs `js-motion`, set in
the document head and withdrawn if bootstrap fails, plus the directive's
`data-reveal-ready` stamp, which comes after its first render (spec 07 §4.2).

**Page metadata** — each route sets its `<title>` and meta description, in the
prerendered HTML and on client navigation (`PageMetadata`, a `TitleStrategy`).
Descriptions reuse each page's lead; a project's is its summary. The 404 is
`noindex`.

**Media** — 16 renders and 6 project covers in MinIO, served through `/medias`
(nginx in production, the dev server's proxy locally). Bucket policy is
read-for-anyone, write-for-nobody; verified with an anonymous PUT returning 403.
The CV PDF is served from the repository. Locally the renders need
`pnpm infra:up`: without MinIO, `/medias` answers 502 and every picture breaks.

**Tests** — 198 passing on the web side, 100% lines, 93.4% branches, 95.8%
functions; axe on every page. Every route, the 404, the detail guard, the API
client, the gallery, contact and the tool chips now have their own specs.

What the numbers do not cover, deliberately: the `aria-busy` branch on the
contact submit is unreachable until the form is wired, and three handlers in
`app.html` fire only on real keyboard events.

## In progress — the « Bascule » world pages

A mockup approved with Stéphane on 2026-11-14 (artifact « Bascule Dev / 3D »)
redesigns the developer and 3D pages as two worlds sharing one skeleton, a
diagonal sweep between them, a 3D mosaic with a full-screen viewer, a stack
with « Maîtrise » panels, a contact page with a cut-out portrait, background
motes and smooth scrolling. It ships as six PRs:

1. **ADRs and content model** — this PR. ADR-0013 (Lenis), ADR-0014 (worlds
   are routes, the sweep is the route transition), ADR-0015 (mosaic crops
   around a focal point). `world.ts` schemas in shared-types; static content in
   `apps/web/src/app/core/content/world-content.ts`, parsed against them in a
   spec. Nothing renders it yet.
2. Shell: header world switch (links, `aria-current`), sweep transition,
   social dock, motes, Lenis. Prerendering (ADR-0008) has landed: any
   browser-only code must run under `afterNextRender` or a platform check, and
   be checked against the prerendered build, not only `ng serve`.
3. World page: hero, role word, point cloud, scrub, facts.
4. Work: dev grid, 3D mosaic, viewer at `/graphisme-3d/<slug>` (spec 01).
5. Stack and « Maîtrise ».
6. Contact: portrait, form, no published email.

**Content review at the end of the integration** (Stéphane, 2026-11-14: the
copy is reviewed once, after the six PRs). Collected so far:

- Mastery points flagged « à valider » on the mockup: RxJS « L’interop
  maîtrisée »; .NET points 2–4; React points 2–4; V-Ray « Les matières ».
- **Claims the repository contradicts today** — must change or become true
  before they render: « 80 % de couverture imposés en CI » and « Une CI qui fait
  foi » (there is no CI, only the local `pnpm verify`); « Les mêmes conteneurs du
  poste de développement au serveur » (nothing is deployed); « Une commande pour
  lancer l’infrastructure locale » (`pnpm infra:up` is broken, see Missing).
- Unsourced: « Fontenilles, France » under the portrait (not in user-profile);
  « Sans école et sans commande » contradicts the Pixmodels commission (2015).
- « Zoneless » sits under RxJS; it belongs with Angular.
- « Les seize rendus » hard-codes a count spec 03 says is derived.
- French typography: no non-breaking spaces before « : », « ? », « ! ».

**Gaps in the model:** `focal` on artwork views is specified (spec 03,
ADR-0015) but `Artwork` has no Zod schema in shared-types yet. The contact
portrait placeholder (`portrait-stephane-pensif.png`) is neither seeded in
MinIO nor in the ADR-0012 pipeline; PR 6 uploads it.

**Registry:** `rxjs`, `aws`, `claude-code` added, with no glyph or logo yet.
The stack's marks need SVG logos (ADR-0012); the mockup used Simple Icons
(CC0).

## Missing

Ordered by what hurts most on the day the site goes live.

| Gap                                    | Consequence                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEO is partial**                     | Per-route `<title>` and meta description exist. Still no `robots.txt`, no `sitemap.xml`, no canonical, no Open Graph, no JSON-LD (ADR-0008, spec 01) — share previews are as broken as on the current site.                                                                                                                                          |
| **nginx not updated for prerendering** | Outside the repository. ADR-0005 (amended 2026-11-14) now prescribes `try_files $uri $uri/index.html =404;` and `error_page 404 /404/index.html;` for `/*`. The live config still has the `index.html` fallback, which would serve the prerendered home with a 200 under every unknown URL.                                                          |
| **`/medias` is two things at once**    | `public/medias/` (404 GIF, portrait, home split images) ships under the same `/medias/` prefix nginx proxies to MinIO. The dev server serves local files first and hid it; an nginx that proxies all of `/medias` breaks them. Decide before deploying: seed them into MinIO, or serve local files first. Found 2026-11-14 on the prerendered build. |
| **`pnpm infra:up` is broken**          | `minio/minio` no longer exists on Docker Hub (nor on quay.io), so the compose file cannot pull. `cgr.dev/chainguard/minio` runs the same binary and works with the seed script; switching to it is undecided.                                                                                                                                        |
| **Contact form not wired**             | The form renders and goes nowhere. Needs a delivery service (ADR-0007 forbids sending from the browser).                                                                                                                                                                                                                                             |
| **API is a skeleton**                  | Only `/health`. No projects, no media, no contact route.                                                                                                                                                                                                                                                                                             |
| **No back office**                     | Content lives in `apps/web/src/app/core/static-content.ts`. Every edit is a commit.                                                                                                                                                                                                                                                                  |
| **Specs 04 and 05 missing**            | `00-vision.md` references a back-office spec and a content/SEO spec that were never written.                                                                                                                                                                                                                                                         |

## Deferred on purpose

- Decorative SVG shapes (triangle, bubbles) from the 2022 site — Stéphane wanted
  to see the detail pages first.
- Nine further renders sit unused in the 2022 repository. The sixteen shown are
  Stéphane's selection, not ours.
