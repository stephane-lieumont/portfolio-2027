# Status

Last updated 2026-11-14. Describes `main` (PR #20, the shell, merged) with
`feat/world-pages` (« Bascule » world pages) on top, not yet committed.

## Works today

**Foundations** — pnpm monorepo, Angular 22 standalone/zoneless/signals, shared
Zod types, Fastify API skeleton with `/health`, MinIO in docker-compose
(declared, not yet used). 13 ADRs, 6 specs.

**Design system** — primitive and semantic tokens, `light-dark()`, typography
scale, base reset. Contrast measured against the worst pixel a blended texture
can produce, not against the flat surface.

**Direction (Stéphane, 2026-11-14)** — « on doit être absolument iso avec la
maquette », « on ne garde rien de l'ancien projet », « l'idée est une refonte
complète, elle doit correspondre à la maquette de l'artefact ». The old home
split and its entrance, the Pac-Man loader, the burger menu, the footer, the
closing portrait bands and the Travolta 404 are removed. What remains of the
old site — the developer, gallery, contact and project pages — is interim and
is replaced by PRs 3–6.

**Shell (« Bascule » PR 2)** — the header of the mockup: the role « Lead Tech
& graphiste 3D » (mono, uppercase) on the left; « Contact » and the world
switch (two links with `aria-current`, a thumb that slides after the sweep) on
the right; glass over the world's ground. Iso with the mockup, contrast included:
the role line in the world's muted tone, links 32–36px tall (see « Known
accessibility debt »). Below about 410px the right-hand group takes a second row: the
mockup's narrow layout leaves the role 0px wide at 320px. No horizontal
overflow at 320, 360, 375, 390, 520, 768, 1280. `/` redirects to
`/developpeur` (a meta-refresh file in the static build; ADR-0005 notes the
nginx 301). The world is derived from the route and stamped on `<html>` as
`data-world` (contact and the 404 keep the world they were opened from,
default dev), in the prerendered files too, and seeded from the loaded URL so
hydration never flips it. Route transitions per ADR-0014: sweep between
worlds (cover 0→640ms, new page from 640ms), ink wipe to and from contact,
§9.2 crossfade otherwise, a short crossfade under reduced motion; scrollY is
0 before `ready` on new navigations, back and forward restore it. One frame
loop (`FrameLoop`) feeds Lenis 1.1.13 (lazy chunk, 3.29 kB gz; off under
reduced motion) and the motes canvas (DPR cap 1.5, refit on a pixel-ratio
change, still frame under reduced motion). The copyright spine (bottom-left, vertical) has no ground of its
own and sits above everything (z-index 100, its own view-transition group,
`pointer-events: none`): muted in the dev world, neutral 750 (#3a3633, 5.7:1)
on the orange. Only the viewer's modal dialog covers it: the top layer wins by
spec. Social dock fixed bottom-right,
always visible as on the mockup: contact icon to `/contact`, LinkedIn,
GitHub, ArtStation, CV, no mailto; `scroll-padding-block-end` keeps focus
clear of it. A direct load leaves focus alone (first Tab is the skip link);
route changes move focus to `<main>` and announce the page title. Interim
404: mono eyebrow « Erreur 404 », a heading, one link to `/developpeur`.

**World pages (« Bascule », this branch)** — `/developpeur` and
`/graphisme-3d` are one component (`features/world/`), iso with the mockup in
markup, CSS values and motion. Measured at 1440 against the mockup, element by
element: same boxes to the pixel (name 899px, role 265 vs 264px, stage
575×718, scrub 689×213, work head 324×94…), the only offset being the
mockup's unreset 8px body margin. In order:

- Hero recalibrated on the viewport's height as well as its width (Stéphane:
  on his laptop the first section did not fit; svh, not dvh). Measured, name /
  role / scrub px, hero bottom, stuck stage height: 1440×790 79/57/35, 343,
  670 (≤694); 1512×872 87/63/38, 366, 718; 1728×1007 101/72/44, 404, 718;
  1920×970 97/70/43, 394, 718; 390×844 33/25/26, 254, stage 358 (header
  100); 820×1180 69/53/28, 331, 661. The scrub's ramp starts at 68% of the
  viewport (mockup 85%) so it paints about a fifth lit at load (22% at
  1440×790, 28–36% on taller screens), ending where it did.
- Hero: eyebrow (world label / eyebrow tools), the hairline drawing, the name
  rising letter by letter (h1 keeps its text, letters `aria-hidden`), the role
  flipping in with its italic accents. The entrance is CSS from first paint
  (`_world-page.scss`), so the prerendered page moves before the bundle; the
  flip's whole-effect easing is sampled into linear keyframes (the per-segment
  CSS easing made the end snap; measured after: steps decay 0.45° → 0 with no
  jump). After a sweep the role flips once the band has covered (640ms).
- Point cloud (`</>` → torus, assembly, pointer field, accent sweep every 7s,
  still frame under reduced motion) on the shared frame loop, its state in a
  root `CloudState`. On a direct dev ↔ cgi switch the cloud's canvas rides
  above the band (its own view-transition group) and the new page carries on
  the morph: measured ink 243 → 190 → 80 → 17 over 1.5s, one canvas at any
  frame. From or to any page without the cloud (contact, a project, the 404) it
  stays in the page snapshot and starts settled in its world's shape (contact →
  cgi: ink 17 from the first sample). The assembly plays once per visit. The
  torus has its own scale fitted to the canvas (it overflowed the 575px stage
  by ±23px on the mockup too). The pointer turning it is kept across the
  switch (a new page restarting it at the centre snapped the torus by up to
  0.4 rad). Morph frame times, 3 runs each at 1440: mockup median 16.7 / p95
  16.7 / max 16.8 ms; build 16.7 / 16.7 / 33.4 ms (one dropped frame at the
  handover), no long task on either. A shared layout route keeping one cloud
  instance was evaluated and not built: the handover costs 19ms of script,
  and continuity already holds. Layers as the mockup: stage 20 under the
  header (30) and the dock (50), blurred by their glass; only the sweep lifts
  it.
- Lede, scrubbed sentence (unlit floor 55%: 5.54:1 dev, 3.33:1 cgi, large
  text), facts as a `dl`, CTAs « Me contacter » → /contact, « Mon CV » → the PDF.
- Dev work: six numbered plates (title, year, tools with marks) to
  `/developpeur/<slug>` (the interim detail page, unchanged; a redesign
  comes later). Count derived: « 06 projets · 2015 – 2022 ».
- 3D work: the full-bleed mosaic, every tile a link to `/graphisme-3d/<slug>`,
  which opens a native `<dialog>` viewer over the wall (16:9 plate, diagonal
  cut from SWEEP_LEAN, drift and darken, counter, 44px ticks, arrows/Home/End,
  swipe, Escape, focus back on the tile, Lenis held, plate ↔ tile morph via the
  router's view transition, `viewer` kind). A step's cut plays to its end
  while the address catches up (measured after the review fix: clip-path
  alive through ~1.1s, the 1.7s settle after it; 220ms fade under reduced
  motion; it had been cancelled at ~69ms). Closing after stepping focuses
  the tile of the piece shown and brings it on screen (measured: two steps
  back then Escape, focused tile at 112–650px in a 900px viewport); the
  plate morphs into it only if it is on screen. A native close that skips
  `cancel` also restores scrolling and the address. A direct load of a piece's URL
  renders the wall with the viewer open on it and a preload in the head (16
  prerendered pages, own title and description). Steps inside the viewer
  replace the URL; Back closes it.
- Stack: marks as a tab list (`role=tab`, `aria-selected`, roving tabindex,
  arrows/Home/End; the panel a `tabpanel`; Simple Icons masks; the 3D tools' PNGs),
  bubble once in view (on a wrapper: the dim of inactive icons no longer
  flashes to full colour), « Maîtrise » panel at a fixed height (every tool's
  points stacked in one cell, the hidden ones `inert` and `aria-hidden` in
  the prerendered HTML too; page height measured constant across all
  selections, both worlds).
- Scroll reveal as the mockup's final version, gated on `js-motion`; a 2s
  safety net shows anything on screen still waiting. Plates in each picture's
  mean colour while it loads, fading in once decoded, alt text on a neutral
  plate if it fails; WebP derivatives with real-width `srcset` and `sizes`,
  the original as `src` and as the fallback when a derivative fails. First
  load of /graphisme-3d at 1440: 6 images, 246 KB. Motes visible in both
  worlds, fading around the stage.
- Fonts: Instrument Sans with its width axis, JetBrains Mono, Instrument Serif
  italic, self-hosted.

Deviations from the mockup, each on purpose:

- Mosaic shapes: tiles between 4:3 and 2:1 in blocks of eight (Stéphane, on 16
  real renders; ADR-0015 amended). Worst crop 27.5% (Gorgotte).
- The viewer letterboxes non-16:9 renders (`contain`, ADR-0015), the mockup
  cropped them.
- Tiles are links, not buttons (a URL per piece, spec 01).
- Facts are a `dl`; the role word is read from a visually hidden copy (the
  mockup put `aria-label` on a `<p>`, which ARIA prohibits).
- The dev grid lists all six published projects (spec 03: derived), the
  mockup sampled four.
- Labels « RxJS / Signals » and « .NET / C# » in the stack come from the
  mockup, not the registry.
- No technical caption under the cloud's stage (« 1 200 points · … »):
  removed at Stéphane's request.
- The stack is a tab list rather than toggle buttons: one tool at a time is a
  selection, and `aria-pressed` read as independent toggles.
- On a phone a full-width mosaic band takes its render's ratio between 4:3 and
  16:9 (the near-square Immeuble lost 33% in a 16:9 band; now 11%).
- The mockup has no viewport meta, so at 390px it lays out at 980px; the build
  follows its CSS rules below 900px.

**Pages (interim)** — Contact and project detail at `/developpeur/<slug>`. In
the dev world they follow the dark scheme on the world's ground; contact keeps
a page surface in the 3D world, because secondary ink on orange is 3.3:1.

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
complete HTML file per route under `dist/web/browser` — `/` (a redirect to
`/developpeur`), `/developpeur`,
`/graphisme-3d`, `/contact`, one per project (`developpeur/<slug>`, enumerated
from the static `PROJECTS`; ADR-0008 says from the API once it serves them),
and `/404/index.html` for nginx's `error_page`. No route renders on demand and
no Node process runs in production. Client hydration with event replay keeps
the prerendered DOM (measured:
0 hydration mismatches on every route in the dev build, and no console
output from the production build). With script disabled every
page is readable, the reveal hides nothing and every navigation entry is a
visible link at 390px (measured with script disabled).
`pnpm verify` now ends with the web build, which fails unless every expected
route was emitted with its own `<title>`, its heading and copy as text, a
description (`noindex` on the 404 only), hydration data, and nothing hidden
before script. The rules are tested against mutated pages
(`scripts/prerender-checks.test.mjs`).

Known limits, deliberately not fixed here:

- The project list is read from the static `PROJECTS` in three places —
  `app.routes.server.ts` (prerender params), the route resolvers and
  `scripts/prerender-checks.mjs`. All three move to the API (ADR-0008).

**Section reveal at boot** — the page is painted complete before the bundle
arrives, so the reveal hides only what nobody has seen yet: content below the
fold. Content on screen at hydration is settled where it stands (`reveal--settled`). Hiding needs `js-motion`, set in
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

**Tests** — 293 passing on the web side, 94.9% lines, 82.2% branches, 90.2%
functions; axe on every page. Every route, the 404, the detail guard, the API
client, the gallery, contact and the tool chips now have their own specs.

What the numbers do not cover, deliberately: the `aria-busy` branch on the
contact submit is unreachable until the form is wired. The motes run against
a stubbed 2D context in the tests; what they look like is checked in a browser.

**CI** — `.github/workflows/verify.yml` runs `pnpm verify` on every pull
request and on `main`: typecheck, lint, format, tests with the 80% floor, and
the prerendered build with its route check. Node from `.nvmrc`, pnpm from
`packageManager`, frozen lockfile. Integration and end-to-end tests
(Playwright) come once the « Bascule » design has landed, so they test the
final journeys rather than ones about to be rewritten (Stéphane, 2026-11-14).

## In progress — the « Bascule » world pages

A mockup approved with Stéphane on 2026-11-14 (artifact « Bascule Dev / 3D »)
redesigns the developer and 3D pages as two worlds sharing one skeleton, a
diagonal sweep between them, a 3D mosaic with a full-screen viewer, a stack
with « Maîtrise » panels, a contact page with a cut-out portrait, background
motes and smooth scrolling. It ships as six PRs:

1. **ADRs and content model** — merged (#17). ADR-0013 (Lenis), ADR-0014 (worlds
   are routes, the sweep is the route transition), ADR-0015 (mosaic crops
   around a focal point). `world.ts` schemas in shared-types; static content in
   `apps/web/src/app/core/content/world-content.ts`, parsed against them in a
   spec. Nothing renders it yet.
2. **Shell** — this PR (`feat/shell-bascule`), see « Works today ». Open:
   - A loader and a designed 404 come later (Stéphane, 2026-11-14).
   - No legal notice link for now: Stéphane decided on 2026-11-14 to publish
     none at this stage. In France a professional site normally needs one
     (LCEN); revisit before going live.
   - Copy to review: the 404 heading « Page introuvable » and link « Retour à
     l’accueil » are labels written for the interim page.
   - Not verified: Safari and Firefox (headless Chrome only), a real phone,
     a touch device (Lenis is wheel-only by design), frame timings under load.
   - The old contact page still renders a `mailto`; PR 6 replaces it.
     3–5. World pages, work, viewer, stack: this branch (`feat/world-pages`), see
     « Works today ». Not verified: Safari, Firefox, a real phone, touch swipe on
     a device. The interim project page at `/developpeur/<slug>` awaits its
     redesign.
3. Contact: portrait, form, no published email.

**Content review at the end of the integration** (Stéphane, 2026-11-14: the
copy is reviewed once, after the six PRs). Collected so far:

- Mastery points flagged « à valider » on the mockup: RxJS « L’interop
  maîtrisée »; .NET points 2–4; React points 2–4; V-Ray « Les matières ».
- **Claims the repository contradicts today** — must change or become true
  before they render. « 80 % de couverture imposés en CI » and « Une CI qui fait
  foi » became true with the verify workflow; « Les mêmes conteneurs du
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

## Known accessibility debt (deferred by Stéphane, 2026-11-14)

« sois iso maquette, on verra plus tard pour les contrastes ». The mockup's
values ship as they are; each failure below was measured at the worst pixel
on the production build (1440 and 390), and is to be fixed later.

| Where                                                                       | Measured                                                                         | Requirement                                            |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Header role line, muted on 72% glass, dev world, over a light cover         | 2.35:1 (5.82:1 on bare glass)                                                    | 4.5:1                                                  |
| Same, 3D world, over a dark render                                          | 3.13:1 at 1440, 3.31:1 at 390 (5.63:1 bare)                                      | 4.5:1                                                  |
| Header links 32–36px tall (mockup)                                          | under 44px                                                                       | ADR-0010 target 44px (WCAG 2.5.8 minimum 24px is met)  |
| Copyright spine over the 3D mosaic (it sits above everything, per Stéphane) | 1.00:1 over a dark render (5.70:1 on bare orange; 5.26:1 worst in the dev world) | 4.5:1                                                  |
| Inactive stack marks: icon at 50% opacity, 3D world                         | ≈2.9:1 (label stays 5.67:1)                                                      | 3:1 for graphics, if the icon is held to carry meaning |

## Missing

Ordered by what hurts most on the day the site goes live.

| Gap                                    | Consequence                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEO is partial**                     | Per-route `<title>` and meta description exist. Still no `robots.txt`, no `sitemap.xml`, no canonical, no Open Graph, no JSON-LD (ADR-0008, spec 01) — share previews are as broken as on the current site.                                                                                 |
| **nginx not updated for prerendering** | Outside the repository. ADR-0005 (amended 2026-11-14) now prescribes `try_files $uri $uri/index.html =404;` and `error_page 404 /404/index.html;` for `/*`. The live config still has the `index.html` fallback, which would serve the prerendered home with a 200 under every unknown URL. |
| **`pnpm infra:up` is broken**          | `minio/minio` no longer exists on Docker Hub (nor on quay.io), so the compose file cannot pull. `cgr.dev/chainguard/minio` runs the same binary and works with the seed script; switching to it is undecided.                                                                               |
| **Contact form not wired**             | The form renders and goes nowhere. Needs a delivery service (ADR-0007 forbids sending from the browser).                                                                                                                                                                                    |
| **API is a skeleton**                  | Only `/health`. No projects, no media, no contact route.                                                                                                                                                                                                                                    |
| **No back office**                     | Content lives in `apps/web/src/app/core/static-content.ts`. Every edit is a commit.                                                                                                                                                                                                         |
| **Specs 04 and 05 missing**            | `00-vision.md` references a back-office spec and a content/SEO spec that were never written.                                                                                                                                                                                                |

## Deferred on purpose

- Decorative SVG shapes (triangle, bubbles) from the 2022 site — Stéphane wanted
  to see the detail pages first.
- Nine further renders sit unused in the 2022 repository. The sixteen shown are
  Stéphane's selection, not ours.
