# Status

Last updated 2026-11-15. Describes `main` (shell, world pages, contact and
the pointer's « fil », PRs #20–#24, merged) with `feat/project-page` (the
« fiche projet ») on top.

## Works today

**Foundations** — pnpm monorepo, Angular 22 standalone/zoneless/signals, shared
Zod types, Fastify API skeleton with `/health`, MinIO in docker-compose
(declared, not yet used). 16 ADRs, 6 specs.

**Design system** — primitive and semantic tokens, `light-dark()`, typography
scale, base reset. Contrast measured against the worst pixel a blended texture
can produce, not against the flat surface.

**Direction (Stéphane, 2026-11-14)** — « on doit être absolument iso avec la
maquette », « on ne garde rien de l'ancien projet », « l'idée est une refonte
complète, elle doit correspondre à la maquette de l'artefact ». The old home
split and its entrance, the Pac-Man loader, the burger menu, the footer, the
closing portrait bands and the old 404 page are removed (its Travolta came
back on 2026-11-15, see below). What remains of the
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
change, still frame under reduced motion). The pointer's « fil » (`shell/thread.ts`,
iso with the mockup): one tapering line trailing the mouse on the same frame
loop, 2ms substeps (same length at 60 and 144 Hz), 220px max, z-index 60 over
the header and the dock, under the viewer's dialog; orange in the dev world,
white and wider in the 3D one (tokens in `_thread.scss`). Mouse only, hidden
on touch, under reduced motion (switched mid-way too), forced colours and
print; cleared on a hidden tab, gone while the viewer is open. Its own
view-transition group keeps it live above the sweep, split along the band's
edge read from the old snapshot's running animation: measured at t=350ms
into the cgi sweep, edge 376px at mid-height from the computed clip-path,
orange 368–375px and white 376–439px on the canvas. A Back at 300ms into
that sweep switches to the new one (measured at t=367ms of the dev sweep:
edge 1033px, white 1033–1074px, orange 1000–1032px). The contact wipe leaves
its colour alone. A pixel-ratio change refits it as for the motes (unit-tested
only: Chrome's DPR emulation fires neither the media query nor the observer). The copyright spine (bottom-left, vertical) has no ground of its
own and sits above everything (z-index 100, its own view-transition group,
`pointer-events: none`): muted in the dev world, neutral 750 (#3a3633, 5.7:1)
on the orange. Only the viewer's modal dialog covers it: the top layer wins by
spec. Social dock fixed bottom-right,
always visible as on the mockup: contact icon to `/contact`, LinkedIn,
GitHub, ArtStation, CV, no mailto; `scroll-padding-block-end` keeps focus
clear of it. A direct load leaves focus alone (first Tab is the skip link);
route changes move focus to `<main>` and announce the page title.

**404** — the 2022 site's Travolta and its intercom line, back at Stéphane's
request (2026-11-15: « ajoute Travolta avec la phrase interphone »): eyebrow
« Erreur 404 · page introuvable », heading « Mais où est l’interphone ? », a
lede, one link to `/developpeur`, and the clip beside it from 900px, on the
world's own ground (dark or orange). The 2022 GIF (1.8 MB) had a transparent
ground; it ships as alpha video: HEVC `.mov` (254 KB) listed first, which only
Safari claims and whose alpha it reads, then VP9 `.webm` (369 KB) for Chrome
and Firefox, and a transparent WebP poster, from `public/images/` like the
contact portrait. It loops muted, standing on the bottom edge of the screen so the
clip's cut legs read as the page's edge (Stéphane: no pause button); under
reduced motion it stays on its poster. Measured in Chrome: the WebM is picked, autoplay starts,
the 4s clip loops, its bottom within 4px of the viewport's at 1512×771,
1440×900, 1920×970, 768×1024 and 390×844, title 56px at 1512×771, no horizontal overflow. Safari's
HEVC path is not verified. The clip is from _Pulp Fiction_: a film's footage
and an actor's likeness on a professional site, a small rights risk Stéphane
accepted. The interim page surface the 3D world kept under every non-world
page (for the old contact page) is gone: contact and the 404 stand on the
orange ground.

**World pages (« Bascule », this branch)** — `/developpeur` and
`/graphisme-3d` are one component (`features/world/`), iso with the mockup in
markup, CSS values and motion. Measured at 1440 against the mockup, element by
element: same boxes to the pixel (name 899px, role 265 vs 264px, stage
575×718, scrub 689×213, work head 324×94…), the only offset being the
mockup's unreset 8px body margin. In order:

- Hero recalibrated on the viewport's height as well as its width, then scaled
  down below the mockup (Stéphane, 2026-11-15: still too big on his 14-inch
  laptop). Name, role and scrub shrink together so they keep their order
  (name > role > scrub at every size; on a phone the scrub had been larger
  than the role). Measured, name / role / scrub px and hero bottom: 1440×790
  53/37/29, 299; 1512×771 52/36/28, 295; 1512×872 59/41/32, 318; 1728×1007
  68/47/36, 348; 1920×970 66/45/36, 339; 820×1180 47/33/22, 291; 390×844
  32/24/22, 253; 320×640 32/24/22, 271; no horizontal overflow. The scrub's
  ramp starts at 68% of the
  viewport (mockup 85%) so it paints about a fifth lit at load (22% at
  1440×790, 28–36% on taller screens), ending where it did.
- Hero: eyebrow (world label / eyebrow tools), the hairline drawing, the name
  rising letter by letter (h1 keeps its text, letters `aria-hidden`), the role
  flipping in with its italic accents. The entrance is CSS from first paint
  (`_world-page.scss`), so the prerendered page moves before the bundle; the
  flip's whole-effect easing is sampled into linear keyframes (the per-segment
  CSS easing made the end snap; measured after: steps decay 0.45° → 0 with no
  jump). After a sweep the role flips once the band has covered (640ms).
- Point cloud (`</>` → torus, assembly, pointer field on the glyph only,
  accent sweep every 7s, still frame under reduced motion) on the shared frame
  loop, its state in a root `CloudState`. The torus has no hover effect: it is
  grabbed and turned (mouse, pen, a sideways touch; a full stage width is half a
  turn, pitch held between face-on and edge-on) and on release springs back
  onto the live auto-rotation, whose clock runs on during the hold (critically
  damped, release speed kept). Measured at 1440: drag yaw −1.6404 for −1.6404
  expected; release from 0.91/0.37 rad off, within 1% at 983ms, no overshoot,
  largest step 0.028 rad/frame, ink 31.9–540.2 → 31.7–540.6 across the
  release; frames 16.7/16.8/16.8 ms. A long hold unwinds the short way (the
  torus repeats every half turn); mid-morph only whole turns are unwound
  (measured: released at morph 0.69 after 2.3 stage widths, peak return
  3.1 rad/s). A touch is taken only once it heads sideways past 10px; at 390 a
  vertical swipe on the stage scrolls (300 → 495) with the torus untouched
  (offset 0 on every frame), and pinch-zoom stays available
  (`pan-y pinch-zoom`). A move with no button down, or a context menu, lets
  go. Text is not selected by a drag. Under reduced motion the hand turns
  the still frame and the release snaps back. Not keyboard reachable: the
  canvas is decorative and `aria-hidden`. On a direct dev ↔ cgi switch the cloud's canvas rides
  above the band (its own view-transition group) and the new page carries on
  the morph: measured ink 243 → 190 → 80 → 17 over 1.5s, one canvas at any
  frame. From or to any page without the cloud (contact, a project, the 404) it
  stays in the page snapshot and starts settled in its world's shape (contact →
  cgi: ink 17 from the first sample). The assembly plays once per visit. The
  torus has its own scale fitted to the canvas (it overflowed the 575px stage
  by ±23px on the mockup too). The pointer tilting the glyph is kept across
  the switch, so the morph does not snap. Morph frame times, 3 runs each at 1440: mockup median 16.7 / p95
  16.7 / max 16.8 ms; build 16.7 / 16.7 / 33.4 ms (one dropped frame at the
  handover), no long task on either. A shared layout route keeping one cloud
  instance was evaluated and not built: the handover costs 19ms of script,
  and continuity already holds. Layers as the mockup: stage 20 under the
  header (30) and the dock (50), blurred by their glass; only the sweep lifts
  it.
- Lede, scrubbed sentence (unlit floor 55%: 5.54:1 dev, 3.33:1 cgi, large
  text), facts as a `dl`, CTAs « Me contacter » → /contact, « Mon CV » → the PDF.
- Dev work: six numbered plates (title, year, tools with marks) to
  `/developpeur/<slug>`, the project page below. Count derived:
  « 06 projets · 2015 – 2022 ».
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
  replace the URL; Back closes it. The dialog fades in but closes at once:
  its 320ms exit fade kept the dark backdrop in the top layer past the
  250ms crossfade, so closing went dark → black → orange in one frame
  (measured, close button, Escape, Back, after a step, reduced motion);
  now the crossfade alone carries dark to orange, with no relapse.
  Not fixed: a viewer opened without user activation (a scripted click) and
  closed with Escape lets both `cancel` and `close` emit `closing`, so history
  goes back twice. Not seen with a real click.
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

- Only the tiles' 2px seam under the 3D wall (mockup 120px), then the stack's
  own top padding, 88px at 1512 (Stéphane, 2026-11-15:
  « l'espace en bas de la section ne semble pas nécessaire »). The viewer's
  host no longer opens an empty grid row (it added a 56px gap).
- Hero type smaller than the mockup's (name capped at 80px instead of 104px,
  role 54 instead of 72, scrub 36 instead of 46): Stéphane, 2026-11-15.
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
- The torus is grabbed and turned instead of following the pointer, and its
  hover field is gone (the glyph keeps both): Stéphane, 2026-11-15.
- No technical caption under the cloud's stage (« 1 200 points · … »):
  removed at Stéphane's request.
- The stack is a tab list rather than toggle buttons: one tool at a time is a
  selection, and `aria-pressed` read as independent toggles.
- On a phone a full-width mosaic band takes its render's ratio between 4:3 and
  16:9 (the near-square Immeuble lost 33% in a 16:9 band; now 11%).
- The mockup has no viewport meta, so at 390px it lays out at 980px; the build
  follows its CSS rules below 900px.

**Contact (« Bascule » PR 6)** — the mockup's contact view, measured iso
against it in headless Chrome at 1440 (every box of portrait, plate, figure,
caption, eyebrow, title, lede, fields, button and socials within 0.1px, both
worlds), 1024, 390 and 320 (no horizontal overflow). Two columns from 900px
(5fr/7fr), portrait sticky at 96px. The portrait is the 2022 « pensif »
cut-out, shipped from `public/images/` (not MinIO) until ADR-0012's pipeline
takes it over. Form: Nom, Email, Message, Reactive Forms, the mockup's French
messages, focus to the first invalid field, a flagged field re-checked on
blur; `POST /api/contact` with `ContactMessage` (new in shared-types, the
contract the API will validate); « Envoi en cours… » with `aria-busy`; 0, 404,
405 and 501 answer « pas encore en service », anything else invites a retry.
No mailto and no address anywhere: the prerender check now fails on a mailto.
Socials: LinkedIn, GitHub, ArtStation, CV (download, as in the dock; the
mockup's CV pointed at the old site). Entrance in CSS, so it plays from the
prerendered page's first paint, script or not; after the ink wipe it waits
for the uncover — sampled: every start and end lands at the mockup's time
plus 565–588ms (the 560ms cover). Parallax on a mouse only, off under reduced
motion (also when switched on mid-drift); amplitudes sampled identical to the
mockup at five pointer positions. Deviations, all from the mockup's quirks mode: its 8px
body margin (content 24px from the edge) and its form's 1em bottom margin are
reproduced on purpose; its 3px horizontal overflow at 390 is not.

**Project page (« fiche projet », `feat/project-page`)** — `/developpeur/<slug>`,
iso with the prototype Stéphane approved on 2026-11-15 (« top », its closing
contact block removed). Measured in headless Chrome against the prototype
served from file, element by element (crumbs, eyebrow, title, name, word,
buttons, plate ground and image, caption, the three blocks and their parts,
the band, its head, rows, images and « Cette fiche »): **every box identical
to 0.0px at 1440×900 and within 0.3px at 1024×768**; at 390 and 320 everything
sits 20px lower, the shell's header taking two rows below 410px (see Shell),
and nothing else differs. Same fonts loaded, page heights equal (3016 /
2495px). No horizontal overflow at 320, 390, 1024, 1440 on all six projects
(the prototype overflows by 65px at 320, its header). In order:

- Hero (`ProjectHero`): « Réalisations » back to `/developpeur`, the rank
  « 02 / 06 », series · year and role, the title split on « — » into the name
  rising letter by letter and the condensed qualifier flipping in (the world
  pages' keyframes, reused), then « Voir le site » (`websiteUrl`, new tab) and
  « Voir la vidéo » (`videoUrl`), each only when the project has one. The h1
  is read as the plain title (a visually hidden copy; the letters are
  `aria-hidden`).
- The presentation visual on a light plate (the world's ink, the shot
  multiplied onto it), its left edge cut at the sweep's lean, computed from
  the viewport's aspect (`PlateLean`), bleeding off both sides on a phone,
  from the column's edge to the right from 900px; « Fig. » caption. WebP
  derivatives with real widths and `sizes`, `fetchpriority="high"`.
- Contexte: the context as the scrub sentence (`ScrubSentence`, with the
  prototype's ramp from 85% of the viewport, `BODY_RAMP`). **The summary is not
  shown**; it stays the meta description (Stéphane, 2026-11-15).
- Mission (role set large, mission, numbered steps), Outils (marks as masks,
  name only where no mark exists: Adobe XD, Jira, MongoDB, PHP).
- Vidéo, when there is one: a facade (ADR-0016) — the presentation visual as
  poster and a real `<button>` « Lire la vidéo : <titre> »; the press swaps in
  the `youtube-nocookie.com` player, playing, focus moved into it. « Voir la
  vidéo » jumps to it and focuses the button. No project has a video yet; with
  one added locally for the measurement: resource hosts before the press
  `localhost` only, after it `www.youtube-nocookie.com`; no iframe before. The
  schema accepts https YouTube video addresses only.
- The band (`DevWork`, now parameterised): a project in a series ends on the
  whole series, its own card marked « Cette fiche », grey, not a link
  (`aria-current="page"`); any other ends on « Autres réalisations », the
  three projects that follow it in the list, wrapping. Three columns from
  900px. Count derived from the cards shown.
- Entrance in CSS from first paint, every value sampled against the
  prototype's Web Animations: crumbs 120/165ms, name 260 + 38ms × letter,
  qualifier and lines from 936ms (« Case Tes Potes »), plate cut 520ms +
  1100ms, image settle 520 + 1700ms, caption 1320 + 520ms; the cut's
  clip-path at 0/25/50/75% of its run: 0, 5.28, 50, 94.72% on both. It plays
  on every arrival, as on the prototype: from a card (the §9.2 crossfade, no
  morph: neither the prototype nor ADR-0014 asks for one) and from one project
  to the next, the page being rebuilt per slug. Measured: scrollY 0, focus on
  `<main>`, title and description updated, during the crossfade; Back restores
  the scroll. Under reduced motion the title fades (400ms) and nothing else
  moves; the sentence is lit whole.
- Scroll reveal as the prototype: blocks below the fold draw their hairline
  and raise their parts, rows cut in along the diagonal (measured: pending at
  load, running at 250ms, settled by 1.75s).
- axe in the browser, 1440 and 390, two projects: no violation.

Deviations, each on purpose:

- The entrance starts at first paint, as on the world pages; the prototype
  starts it once its web fonts are ready.
- The presentation image of `case-tes-potes-mobile` is declared at its real
  size, 1080×384 (the prototype said 1100×434); the rendered box is the same.
- The prototype's « Voir la vidéo » opened YouTube in a new tab; the video now
  plays on the page (Stéphane, 2026-11-15), in a « Vidéo » block after Outils
  that the prototype did not draw.
- The title follows the world pages' scale, not the prototype's 104px cap
  (Stéphane, 2026-11-15): name / qualifier 52/36px at 1512×771, 66/45 at
  1920×970, 32/24 at 390 and 320; no horizontal overflow.
- The presentation visual drifts against the scroll inside its plate
  (Stéphane, 2026-11-15), a CSS scroll-driven animation on a view timeline
  named on the plate (`view()` on the image would bind to the plate, a scroll
  container through `overflow: hidden`). Drift ±12px below 900px, ±32px above,
  measured within the plate's room on four projects: at most 6px of the
  shot's drop shadow is cut at 768. Off under reduced motion and where scroll
  timelines are unsupported (Firefox today).

The interim detail page, its `Reveal` directive, `TechChip` and their
stylesheets (`_page.scss`, `_reveal.scss`) are removed: nothing else used them.

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
before script, and nothing loaded from another origin (`src`, `srcset`,
`<link href>`: the YouTube player only after a click, ADR-0016). The heading
is read as spoken (its `aria-label`, else its text without `aria-hidden`
parts). The rules are tested against mutated pages
(`scripts/prerender-checks.test.mjs`).

Known limits, deliberately not fixed here:

- The project list is read from the static `PROJECTS` in three places —
  `app.routes.server.ts` (prerender params), the route resolvers and
  `scripts/prerender-checks.mjs`. All three move to the API (ADR-0008).

**Page metadata** — each route sets its `<title>` and meta description, in the
prerendered HTML and on client navigation (`PageMetadata`, a `TitleStrategy`).
Descriptions reuse each page's lead; a project's is its summary. The 404 is
`noindex`.

**Media** — 16 renders, 6 project covers and 6 presentation visuals in MinIO, served through `/medias`
(nginx in production, the dev server's proxy locally). Bucket policy is
read-for-anyone, write-for-nobody; verified with an anonymous PUT returning 403.
The CV PDF is served from the repository. Locally the renders need
`pnpm infra:up`: without MinIO, `/medias` answers 502 and every picture breaks.

**Tests** — 436 passing on the web side, 97.1% lines, 86.4% branches, 93.2%
functions; axe on every page, every project page included. Every route, the
404, the project guard, the API client, the gallery, contact, the project page,
its video facade and the YouTube address parser have their own specs; the
static projects are parsed against the `Project` schema.

What the numbers do not cover, deliberately: the motes run against
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
   - A loader comes later (Stéphane, 2026-11-14).
   - No legal notice link for now: Stéphane decided on 2026-11-14 to publish
     none at this stage. In France a professional site normally needs one
     (LCEN); revisit before going live.
   - Copy to review: the 404's lede « Cette page n’existe pas, ou plus… », its
     link « Retour aux réalisations » and the clip's description were written
     here; the heading adapts the 2022 line « Where is the intercom ? ».
   - Not verified: Safari and Firefox (headless Chrome only), a real phone,
     a touch device (Lenis is wheel-only by design), frame timings under load.
     3–5. World pages, work, viewer, stack: this branch (`feat/world-pages`), see
     « Works today ». Not verified: Safari, Firefox, a real phone, touch swipe on
     a device.
3. Contact: portrait, form, no published email — `feat/contact-page`, see
   « Works today ». Open: the copy of the three send outcomes (« Merci… »,
   « pas encore en service », « Réessayez… ») was written here, not on the
   mockup — to review. A real send needs the API route (Missing).

**Content review at the end of the integration** (Stéphane, 2026-11-14: the
copy is reviewed once, after the six PRs). Collected so far:

- Project page, written here and not on the prototype: the captions of Kasa,
  Portfolio 3D and Pixmodels (« … sur ordinateur, tablette et mobile. »); the
  six presentation alt texts; « Autres réalisations »; the « Vidéo » block's
  « Lire la vidéo : … », « Vid. » and « Regarder sur YouTube ».

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

**Project contract changed (`feat/project-page`), API not yet:** the `Project`
schema in shared-types gained `context` (replacing the unused `description`),
`role`, `series`, `websiteUrl` (replacing `demoUrl`: a root-relative demo
path or an https site), `videoUrl` (https YouTube only), `presentationAsset`
and `presentationCaption`; `mission` is now required, `missionSteps` 1–10.
Spec 03 follows. The Drizzle schema (`apps/api/src/db/schema.ts`) and its
migration still have the old columns (`description`, `demo_url`), and the
`add-project` skill still says `demoUrl`: both to follow when the API serves
projects.

**Gaps in the model:** `focal` on artwork views is specified (spec 03,
ADR-0015) but `Artwork` has no Zod schema in shared-types yet. The contact
portrait (`/images/portrait-stephane-pensif.png`) ships from `public/`, outside
MinIO and the ADR-0012 pipeline; `STATIC_ASSETS` maps its placeholder id to it.

**Registry:** `rxjs`, `aws`, `claude-code` added, with no glyph or logo yet.
The stack's marks need SVG logos (ADR-0012); the mockup used Simple Icons
(CC0).

## Known accessibility debt (deferred by Stéphane, 2026-11-14)

« sois iso maquette, on verra plus tard pour les contrastes ». The mockup's
values ship as they are; each failure below was measured at the worst pixel
on the production build (1440 and 390), and is to be fixed later.

| Where                                                                          | Measured                                                                         | Requirement                                            |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Header role line, muted on 72% glass, dev world, over a light cover            | 2.35:1 (5.82:1 on bare glass)                                                    | 4.5:1                                                  |
| Same, 3D world, over a dark render                                             | 3.13:1 at 1440, 3.31:1 at 390 (5.63:1 bare)                                      | 4.5:1                                                  |
| Header links 32–36px tall (mockup)                                             | under 44px                                                                       | ADR-0010 target 44px (WCAG 2.5.8 minimum 24px is met)  |
| Copyright spine over the 3D mosaic (it sits above everything, per Stéphane)    | 1.00:1 over a dark render (5.70:1 on bare orange; 5.26:1 worst in the dev world) | 4.5:1                                                  |
| Inactive stack marks: icon at 50% opacity, 3D world                            | ≈2.9:1 (label stays 5.67:1)                                                      | 3:1 for graphics, if the icon is held to carry meaning |
| 404 clip loops with no pause control (Stéphane removed the button, 2026-11-15) | plays past 5s, decorative                                                        | WCAG 2.2.2 Pause, Stop, Hide                           |

## Missing

Ordered by what hurts most on the day the site goes live.

| Gap                                    | Consequence                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEO is partial**                     | Per-route `<title>` and meta description exist. Still no `robots.txt`, no `sitemap.xml`, no canonical, no Open Graph, no JSON-LD (ADR-0008, spec 01) — share previews are as broken as on the current site.                                                                                 |
| **nginx not updated for prerendering** | Outside the repository. ADR-0005 (amended 2026-11-14) now prescribes `try_files $uri $uri/index.html =404;` and `error_page 404 /404/index.html;` for `/*`. The live config still has the `index.html` fallback, which would serve the prerendered home with a 200 under every unknown URL. |
| **`pnpm infra:up` is broken**          | `minio/minio` no longer exists on Docker Hub (nor on quay.io), so the compose file cannot pull. `cgr.dev/chainguard/minio` runs the same binary and works with the seed script; switching to it is undecided.                                                                               |
| **Contact route missing in the API**   | The form posts to `/api/contact` and tells the visitor sending is not available yet. Needs the Fastify route: Zod `contactMessageSchema`, rate limit, relay to a mail service (ADR-0007).                                                                                                   |
| **API is a skeleton**                  | Only `/health`. No projects, no media, no contact route.                                                                                                                                                                                                                                    |
| **No back office**                     | Content lives in `apps/web/src/app/core/static-content.ts`. Every edit is a commit.                                                                                                                                                                                                         |
| **Specs 04 and 05 missing**            | `00-vision.md` references a back-office spec and a content/SEO spec that were never written.                                                                                                                                                                                                |

## Known accessibility debt — contact page

Contrast that comes from the mockup's own values; Stéphane deferred these
(2026-11-14: ship the mockup values, list them). Ratios computed from the
live tokens.

- **Contact text over a passing mote.** At rest every contact text passes AA
  (muted labels, eyebrow, caption 5.82:1 dev / 5.67:1 3D; lede and status
  11.17 / 6.55; ink 16.45 / 9.04). Under a mote at full `--motes-max` the
  pixel behind a glyph drops to: muted 2.53 (dev) / 1.92 (3D), lede 4.86 /
  2.22, ink 7.16 / 3.06. Transient and a few pixels wide, but measurable.
- **Social buttons' ring** (`--world-rule`, 18% ink): 1.63:1 dev, 1.41:1 3D.
  The icon (ink) identifies each control, so SC 1.4.11 holds through it;
  the ring alone would not.

## Deferred on purpose

- Decorative SVG shapes (triangle, bubbles) from the 2022 site — Stéphane wanted
  to see the detail pages first.
- Nine further renders sit unused in the 2022 repository. The sixteen shown are
  Stéphane's selection, not ours.
