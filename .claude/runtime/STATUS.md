# Status

Last updated 2026-11-15. Describes `main` (shell, world pages, contact, the
pointer's « fil », the project page, the 404 and the bilingual site's first
PR, ADR-0017) with `feat/i18n-content` (its second PR, the content in both
languages), `refactor/app-architecture` (the app's layering, ADR-0018) and
`feat/client-references` (client references in « Réalisations ») on top,
and `fix/responsive-audit` (the responsive audit's fixes and the image loading
indicator), and `feat/seo` (canonical, Open Graph, JSON-LD, sitemap, robots).

## Works today

**Foundations** — pnpm monorepo, Angular 22 standalone/zoneless/signals, shared
Zod types, Fastify API skeleton with `/health`, MinIO in docker-compose
(declared, not yet used). 18 ADRs, 6 specs.

**Client references (`feat/client-references`, Stéphane's decisions of
2026-11-15)** — « Réalisations » now lists, newest first: immobilier.ch
(2025 – aujourd'hui), Web-Atrio (2024), CIR — Scancir (2024), Linxea
(2023 – 2024), Ledger (2022 – 2023), Case Tes Potes — application mobile
(2020 – 2022) and its landing page (2022). Count derived:
« 07 projets · 2020 – aujourd'hui » (EN « 07 projects · 2020 – today »). Kasa,
the 2018 portfolio and Pixmodels are gone from the dev list, and the Case Tes
Potes web app is a step of the mobile app's mission; their pages, routes,
prerender expectations and seed mapping went with them.

- Model (`@portfolio/shared-types`, a contract change the API has not
  followed yet): `Project` gains `logo` (an SVG or PNG asset),
  `googlePlayUrl` (« Voir sur Google Play », Google Play app pages only) and
  `startedAt`; `presentationAsset`, `presentationCaption` and `mission` become
  nullable, `missionSteps` may be empty, `releasedAt` is null for work still
  going on (listed first, read « aujourd'hui »). Registry: `react-native`,
  `nextjs`, `nginx`, `helm`, `python`, `datadog`, `terraform`, `sonarqube`,
  `redux`, `android`, `ios`, `google-play-console` (the Google Play mark),
  `testflight` and `segment` (name only), `google-analytics`
  (Simple Icons marks; React Native uses React's), `azure`, `azure-devops`
  (no longer in Simple Icons), `ci-cd`, `unit-tests` (« Tests unitaires »,
  translated in the front end) shown by name only. `logoTint` (`#rrggbb`,
  nullable) is in the contract too, so the API keeps the plate's tint. The
  schema now refuses a project with neither or both of a logo and a
  presentation visual, and a caption without a presentation
  (`visualIssues`, applied by `projectSchema` and `createProjectInputSchema`;
  `projectFieldsSchema` is the unrefined shape that `.pick`/`.omit` build
  on, since Zod 4 refuses both on a refined object). **Back-office work:**
  the Drizzle schema needs `logo`, `logo_tint`, `started_at`,
  `google_play_url` and a nullable `released_at` before the API serves
  projects.
- A reference shows its client's logo **in its own colours** (Stéphane,
  reversing the monochrome ink the same day), never a screenshot: an `<img>`
  (`ClientLogoComponent`) on the light presentation plate (`--color-sand-100`,
  the same in both worlds), sized by equal bounding-box area from the file's
  proportions (`logoWidth`, design-expert spec). On the card the plate is the
  4:3 frame, hover and focus grey the siblings exactly as the Case Tes Potes
  pictures; on the page it is the lean-cut opening plate, from the content
  column at 900px+, `clamp(320px, 36vw, 560px)` tall. Card caption: title and
  period (under the title below a 360px card), the role (« Chez Web-Atrio · »
  on the four client missions), at most six tool marks then « +N » (the page
  lists them all). The Mission block no longer restates the role (it is the
  hero's eyebrow, on every project page); it shows the mission sentence and
  the steps, written from the CV and Stéphane's messages, absent when neither
  exists. Series « Web-Atrio » groups the five Web-Atrio entries; a series
  band reads « Chez Web-Atrio » / « Chez Case Tes Potes » (EN « At … »).
- Measured on the light plate (#f3eee8), every opaque pixel of each logo at
  its displayed size, Chrome, 320 and 1440px: Ledger 18.2:1, Linxea (dark
  ink) 13.4:1 at its lightest, immobilier.ch's grey and red ≥ 4.3:1 (its
  white Swiss cross, 1.15:1, sits inside the red square and reads as a
  cut-out), CIR's lightest orange 2.6:1 (under 3:1 on 1% of its pixels, its
  gradient's highlights). **Web-Atrio's yellow leaf is 1.39:1** (17.5% of the
  mark): it does not reach 3:1 on the light plate. The mark stays legible by
  its red and blue shapes, and the company is named beside it in text (card
  title, page h1), so nothing depends on the yellow; a darker or outlined
  version from Stéphane would fix it. Logo sizes: immobilier.ch 178px wide on
  a 320px card, 293px on a 1440px card.
- **Design spec 2 (approved by Stéphane)**: the logo plates carry a point
  field in the brand's tint (`public/textures/motes.svg`, a seeded 480×360
  tile of 190 points, masked away in an ellipse around the logo; tints
  immobilier.ch #dc1622, Web-Atrio #0051ff, CIR #e3201b, the ink for Linxea
  and Ledger) on a plate toned 5% toward it (semantic `--logo-plate`,
  `--logo-tint`); logos are larger (area 0.075, cap 0.66: immobilier.ch 190px
  on a 320px card, 313px on a 1440px card). Measured contrast on the tinted
  plates (2nd percentile): Ledger 16.5, Linxea 14.9, immobilier.ch 4.0, CIR
  3.0, Web-Atrio 1.3 (its yellow, as before).
- **Hero stage (design spec 2)**: at 900px+ the point-cloud stage spans the
  text column's height and its canvas box is sticky inside it; the band
  follows the CTAs by 64px, « Réalisations » 73px below. Measured, stage
  ending with the text in both worlds: 1440×790 dev 575×492 (324→816), cgi
  575×545; 1512×771 575×491; 1920×970 575×549; 1485×827 575×531 (333→864,
  band at 928); 390×844 unchanged (358×358). Ink of the `</>` and the torus
  never touches the canvas edge over 3s at any of them (torus box 34→528 of
  575 at 1485). Sticky holds the box at 96px on a 560px-tall window; the
  dev→cgi sweep keeps the cloud drawn on every frame (min 1288 sampled
  points); the torus grab still holds (`data-grab` held while dragged).
- **Logo card hover (motion-expert spec, approved)**: on hover (fine
  pointer) and focus the point field spreads from the logo, `--zoom-spread`
  1.06 on top of the card's 1.03, enter 510ms / leave 360ms `--ease-state`;
  none under reduced motion (`--zoom-spread: 1`), none on the project page's
  plate or the current card. The spec scaled the masked `::before`; measured,
  Chrome repainted the masked layer on every frame (184 paints in the hover's
  700ms against 140 without the spread), so the field is a wrapper scaled
  around its masked dots instead: 142 paints, i.e. composited. Measured at
  1440: transform-origin 237px 167.1px on a 474×356 plate (50% 47%), scale
  sampled every 50ms 1 → 1.0075 → 1.030 → 1.051 → 1.060 on enter and back
  to 1 within ~400ms on leave; reduced motion stays at 1.
- 3D scrub sentence (Stéphane): « De la forme à la lumière, je construis
  l'image jusqu'au moindre reflet. Le détail, c'est là que tout se joue. »
  (EN draft « From form to light, I build the image down to the last
  reflection. Detail is where it all happens. »). The 3D meta description
  still says « apprendre seul… regarder une image »: to align in the review.
- After the adversarial review: CIR's context reads « une entreprise de
  roulements » / « a bearings company » (his words; « distributeur » was not
  sourced); Jira on Linxea and the Web-Atrio site (Stéphane). « CIR —
  Scancir » stays. **Ledger shows its open-source stack only** (Stéphane:
  Next.js, React Native, TypeScript): no deployment tooling, monitoring or
  analytics in its marks or copy, no « Déploiement (Nginx, Docker, Helm) »,
  no architecture step; its mission sentence is gone (the steps carry it:
  Next.js app, React Native integration, design system, end-to-end tests).
  Python, Datadog, Segment, Helm, Nginx stay in the registry for the back
  office.
- **Web-Atrio's plate is a dark trial** (Stéphane asked for a darker plate
  so the yellow reads; he judges on screen). Measured against the shapes'
  own colours, no light or mid plate works: a mid neutral that lifts the
  yellow to 2:1 (neutral 450, 2.03) drops the red to 1.23 and the blue to
  1.78; anything lighter keeps the yellow under 1.6. On a dark plate all
  three hold, so the trial is `--logo-plate-dark` (neutral 800, toned 5%
  toward the blue: rgb 44,45,52): yellow 8.5:1, red 3.4:1, blue 2.4:1, the
  plate 1.25:1 against the band. Front end only (`logoPlate: 'dark'` in the
  static content), not in the contract until he keeps it.
- **Videos are links out** (Stéphane: « pour la vidéo je préfère uniquement
  le bouton »): « Voir la vidéo » opens YouTube in a new tab, like « Voir le
  site » and « Voir sur Google Play » (that order). No « Vidéo » block, no
  facade, no player, nothing third-party on any page; the facade component
  and the embed helper are deleted, ADR-0016 carries a dated note.
- Logos, supplied by Stéphane, in
  `apps/web/public/logos/clients/<French slug>.svg|png` (README there):
  replacing a file swaps the logo with no code change (update `width`/
  `height` if its proportions change). immobilier.ch, Web-Atrio and Ledger
  are his files unchanged; CIR is a transparent colour PNG made from his JPG.
  **Awaited: a colour Linxea logo** — his file is the white version,
  invisible on the light plate, filled here in `--color-neutral-950`.
- Dev world: hook lede « Angular et .NET. Une rigueur d'ingénieur, un œil de
  graphiste 3D. »; facts « Rôle — Aujourd'hui — Lead Tech front & back,
  équipe de 5 à 8 », « Équipe — Jusqu'à 8 développeurs encadrés » (replacing
  « Stack »). 3D world: lede « Sans école, avant le développement. »
  (« sans commande » gone); « Depuis — 2010, en autodidacte » (replacing
  « Période — 2014 – 2016 »); « Distinction — Escart Wild, distingué par
  TDT3D », no link. « Légos : les Minions » is « Lego : les Minions » (slugs
  unchanged). No « 3D à plein temps » claim remains.
- Tool marks per reference are those of his CV and his messages of
  2026-11-15 (Web-Atrio's GitLab, Linxea's, Ledger's, immobilier.ch's and
  Scancir's stacks); practices he named (design system, clean architecture,
  front and back development, continuous deployment) are in the mission
  steps, not marks. Any further technology awaits his confirmation.
- **English copy of all of the above is draft for PR 3**, written from the
  French with no new claim (roles, summaries, steps, « At Web-Atrio »,
  « today », « View on Google Play », « Unit tests », « more tools »,
  « Since — 2010, self-taught », « Team — Up to eight developers led »).
- **Orphaned in the bucket** (left alone, no longer referenced):
  `projects/case-tes-potes-web-app.jpg`, `projects/kasa-openclassrooms.jpg`,
  `projects/portfolio-3d-2018.jpg`, `projects/pixmodels.jpg` and their
  `-presentation.jpg`, with their derived `-<width>.webp` variants.
- A logo card's cut-in reveal waits for its logo `<img>` to decode, as an
  image card does (it cut the plate in empty before, the logo popping in
  later). The 2024 missions'
  months (only years are sourced) are set to keep Stéphane's order. Some
  mission sentences restate a step (immobilier.ch's team, CIR's sequence):
  for the content review. Older notes below about `/developpeur/pixmodels`,
  `3d-portfolio-2018`, « six plates » or the video facade describe what no
  longer exists.

**Responsive audit (`fix/responsive-audit`, Stéphane's decisions of
2026-11-15)** — the fixes of the stage-1 audit, each measured in headless
Chrome on the dev server (both locales prerender and pass the check). In
order:

- **The dock no longer covers the end of a page.** `--dock-clearance` (86px
  plus the bottom safe area) pads the last band: the stack on the world pages,
  the closing band on a project page (`--work-end`). Measured at the end of
  `/developpeur`, `/graphisme-3d`, three project pages and the viewer's page
  at 320×568, 390×844, 414×896, 844×390, 768×1024, 820×1180, 1024×768,
  1280×800 and 1440×900: nothing under the dock, 16px between it and the last
  line or more (was up to 38px covered). Not the 404: its clip stands on the
  screen's bottom edge on purpose (decorative, no text there).
- **Phone header** (deviation from the mockup): below 28rem the role takes a
  row of its own that scrolls away; only the navigation row stays pinned.
  89px at rest, 55px while scrolling (was 100), header and dock pinned
  together 125px (was 170). One row from 28rem: 75px. The role line is 12px
  (was 11).
- **Hit areas of 44px, same look**: the header links, the flag and the
  switch's halves keep their drawn size (32–36px) and take a 44px hit area
  (`::before`, `--size-target`); hit-tested at ±21.5px from each centre at
  320, 390, 430, 768, 844 and 1440. Sideways a hit area grows by half the gap
  at most, so neighbours never overlap (after review: the flag's had covered
  the last 6px of « Contact » at 320). Every point of each link's drawn box
  hit-tests to that link at 320, 360 and 390; the flag is 30px wide to the
  touch at 320 and 41px at 390 (over 24px, WCAG 2.5.8). The pill buttons and the contact submit
  are 44px tall (were 42 and 40).
- **The role line holds AA at the worst pixel** (accessibility fix approved by
  Stéphane on 2026-11-15): a second layer of the same glass behind the words
  only (92% in all, with a 2px soft edge). Worst pixel behind the glyphs,
  scrolling every page under the header (dev world, cgi world): without it
  2.53 / 3.08:1, with it 4.86 / 4.81:1 at 1440, 768 and 600; at 390 the role
  row scrolls away before anything passes under it. A stronger ink alone
  (option 2) was computed, not shipped: 60% toward the primary ink gives
  4.59 dev but 4.21 cgi.
- **Contact**: on a phone held upright the order is title, lede, form, then
  the portrait, then the socials, in the DOM as on screen (deviation from the
  mockup); the portrait returns to the left column from 48rem (was 900px);
  title `clamp(2rem, 1rem + 3.2vw, 4rem)`. The portrait spans the right
  column's three rows (an empty fourth row added 48px, fixed after review):
  the section is 1029px at 1440×900 as on `main`, 996 at 1280×800 (`main`
  1007, the smaller title). First screen: at 390×844 the title
  at 149px and the form's first field at 338 (was title at 555); at 320×568
  the first field at 395; at 844×390 the title at 154 beside the portrait
  (was 670). 62px at 1440 (mockup 64).
- **Viewer on a landscape phone** (deviation from the mockup, ADR-0011
  amended for the one height query): the caption moves to a 15rem column
  beside the render, the close button to the corner. 844×390: plate 530×298
  (was 480×270 under its own caption), caption, bar and close never overlap;
  also checked at 932×430, 667×375, 568×320; portrait and desktop unchanged.
- **Line length**: the mastery points and a project's steps stop at 62ch
  (were 84–96 characters at 768–820).
- **Tablet hero stage**: the point cloud at most `min(56svh, 30rem)`: 480×480
  at 768×1024 and 820×1180; the cloud's ink stays 15px or more inside the
  canvas at 390, 768, 820, 1024 and 1440 in both worlds.
- **Images**: derivatives are named after their real width and never exceed
  the original (`media:derive` and the web's `srcset` share the rule, widths
  up to 1920 and 2560 when a master allows): the Case Tes Potes captures are
  `-400.webp` (their masters are 400px; « -640 » lied), the 1200px renders
  `-1200.webp`. The local bucket is re-derived; **production needs
  `media:derive` re-run** before this ships. The contact portrait ships as a
  500px WebP with alpha (22 KB, was a 176 KB PNG) and the CIR logo as 240 and
  480px WebP (11 / 24 KB, was a 98 KB PNG), from `media:public`
  (`apps/api`). No render is above 1280px and the 2022 portrait is 500px, so
  the under-resolution measured at DPR 3 remains until larger masters exist.
- **Not changed**: the scroll position after a rotation (it moved in the
  emulation), **to confirm on a real device** (Stéphane, 2026-11-15). The
  « leave as is » list of the plan stands (hero CTAs on phones, viewer ticks,
  the dock over text mid-scroll, the Escart warm-up, the 2560 column).
- `viewport-fit=cover` in the viewport meta, so the `env(safe-area-*)` terms
  apply on iOS; `--header-height` (scroll padding) is 90px, the tallest
  header measured (was 7rem).
- **Budgets**: the viewer's and the contact page's stylesheets now pass the
  4 kB component-style warning budget by 329 (305 before audit #39's two-row
  ticks, its status line moved to the global `.visually-hidden`) and 17 bytes
  (warnings, not errors). Reported, not raised.

**Image loading indicator (spec 07 §16, motion-expert spec approved
2026-11-15)** — a picture still loading 400ms after its plate came on screen
shows a band sweeping across the plate (`::after`, Web Animations, skewed by
the sweep's lean); in the viewer, three pulsing points after the 360ms morph;
under reduced motion a still « Chargement… » / « Loading… » chip
(`@@plate.loading`, 9.0:1 on the orange). One shared observer (`PlateWatch`)
starts the delay in view only and pauses a running band off screen. Arrival:
510ms fade with a settle from 1.025 on the wall, 360ms fade in the viewer.
Measured with the renders held 2.5s by request interception at 1440: the band
stamped 695ms after loading began (timer from the moment in view), six bands
running in view, all paused once scrolled away, none left after load; a
cached revisit stamped 0 of 32 plates; the viewer pulse 772ms after loading;
a failure fades the band then shows the fallback; reduced motion shows the
chip with no animation. The client logos take the same plate behaviour.
Only the viewer's current slide may wait (an observer counts the hidden
slides as on screen): measured with the renders held, one pulse running
before and after a step (the slide left behind is paused).
**Before bootstrap (`fix/image-loading-before-bootstrap`)**: on a slow line
the prerendered renders landed seconds before the app, so the 3D wall showed
neither band nor fade. A head script in `index.html` now stamps each plate
`data-plate-seen` (in view), `data-plate-loaded` (`fade`, or empty when the
resource timing says it took ≤100ms) or `data-plate-failed` (after retrying
the original); `_plate.scss` runs the wall's band, its 180ms exit, the chip
under reduced motion and the arrival as CSS animations on those stamps
(`.tile.plate` only; other plates keep the directive's behaviour), and the
directive defers to them (`cssRuns`). Measured on the production build, Slow
4G (562.5ms, 1.26 Mbps), cache off, scrolled at 4.5s, app booted at ~7.5s:
band 400–500ms after a plate came in view, renders loaded 5.0–7.5s and
faded in (510ms) before bootstrap, band fading over 180ms on load; cache on:
0 bands, 0 fades. Viewer and project page unchanged.

**Content (Stéphane, 2026-11-15)**: Claude Code joins immobilier.ch's tools,
right after Angular, TypeScript and .NET (« central dans les projets
d'immobilier.ch »), so it shows on the card.

**App layering (ADR-0018, `refactor/app-architecture`)** — `apps/web/src/app`
is split into `core/` (services, stores, i18n, config, static data), `shared/`
(generic UI: today only the pill button, `a[appButton]`), `common/` (domain
pieces used by several features: the dev-work band, the scrub sentence, the
plate-image and world-reveal directives, the hero's letter helpers),
`features/<name>/{views,components}` (world, project, contact, errors) and
`layouts/site-layout/` (the root component, `app-root`, with the header, dock,
thread and motes). Aliases `@core`, `@shared`, `@common`, `@features`,
`@layouts`; ESLint (`no-restricted-imports`, in `pnpm verify`) refuses an
import against the direction and any relative path that climbs out of its
folder. A pure move: the 56 prerendered pages of both trees are identical to
`main` once Angular's hashes are normalised, except the button's own host
attributes (`appbutton`, `_nghost-…`, `ngh`) and its stylesheet; every
computed property of the 36 button instances sampled in Chrome is unchanged.
Not neutral: the initial bundle went from 437.59 kB raw / 123.72 kB transfer
to 441.13 / 125.72 per tree. About 2.4 kB raw come from the move alone, with
no code changed: esbuild split the shared chunk differently (`main` 52 →
148 kB, the shared chunk 351 → 259 kB) and the lists of names imported and
exported between chunks grew by about 1.5 kB; the button costs about 1.1 kB.
Under the 500 kB warning; not investigated further.

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
the role line in the world's muted tone, links 32–36px tall (44px hit areas
and the role's AA glass since the responsive audit). The language link (« EN » / « FR », see « Bilingual »)
sits between « Contact » and the switch. Below about 448px in French and 420px
in English (measured: header 100px → 71px) the right-hand group takes a second
row: the mockup's narrow layout leaves the role 0px wide at 320px (superseded
2026-11-15 by the responsive audit: below 28rem the role has its own row,
which scrolls away). Below 375px
that row's horizontal spacing tightens (gap 3px, link padding 3px, switch link
padding 4px; heights unchanged, every target at least 24px wide) so it fits at
320px in French, the switch's two halves equal (thumb on the current link to
0px). No horizontal overflow at 320, 340, 359, 360, 375, 390, 410, 430, 768,
1440, both trees. `/` redirects to `/developpeur` (a meta-refresh file in the
static build; ADR-0005 notes the nginx redirect). The world is derived from the route and stamped on `<html>` as
`data-world` (contact and the 404 keep the world they were opened from,
default dev), in the prerendered files too, and seeded from the loaded URL so
hydration never flips it. Route transitions per ADR-0014: sweep between
worlds (cover 0→640ms, new page from 640ms), ink wipe to and from contact,
§9.2 crossfade otherwise, a short crossfade under reduced motion; scrollY is
0 before `ready` on new navigations, back and forward restore it. One frame
loop (`FrameLoopService`) feeds Lenis 1.1.13 (lazy chunk, 3.29 kB gz; off under
reduced motion) and the motes canvas (DPR cap 1.5, refit on a pixel-ratio
change, still frame under reduced motion). The pointer's « fil » (`layouts/site-layout/components/thread/`,
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
route changes move focus to `<main>` and announce the page's own title,
without « — Stéphane Lieumont ». Opening, stepping and closing the 3D viewer
change the address but not the page: the shell keeps quiet and moves no
focus, the viewer's own status says « 2 sur 16. Extraterrestre, 2016 » (one
announcement, measured on the build). The skip link handles its own click:
a bare `#contenu` resolves against `<base href>` to the home page, and on the
built site Enter used to reload `/` with focus on BODY (audit #39). Measured
on the production build, FR and EN, five pages each: no navigation, URL
unchanged, focus on `main#contenu`, next Tab inside the content. The
prerender check fails any `href="#…"` link without a click `jsaction`.

**404** — the 2022 site's Travolta and its intercom line, back at Stéphane's
request (2026-11-15: « ajoute Travolta avec la phrase interphone »): eyebrow
« Erreur 404 · page introuvable », heading « Mais où est l’interphone ? », a
lede, one link to `/developpeur` styled as the world pages' pill button, and the clip beside it from 900px, on the
world's own ground (dark or orange). The 2022 GIF (1.8 MB) had a transparent
ground; it ships as alpha video: HEVC `.mov` (254 KB) listed first, which only
Safari claims and whose alpha it reads, then VP9 `.webm` (369 KB) for Chrome
and Firefox, and a transparent WebP poster, from `public/images/` like the
contact portrait. It loops muted, standing on the bottom edge of the screen so the
clip's cut legs read as the page's edge. A pause toggle sits on the clip's
top-left corner (Stéphane, 2026-11-15, WCAG 2.2.2; the bottom edge is
Travolta's): 44px round, icon only, named « Mettre en pause » / « Lire
l’animation » (EN « Pause the animation » / « Play the animation ») after
what a press does — no `aria-pressed` on top of a changing name, which would
read as a double negative. Measured at 320×640, 390×844, 844×390 and
1440×900: clear of the header, the text column and the dock (the dock sits
bottom right, the toggle on the clip's left); Enter pauses, 2px focus ring.
Under reduced motion it stays on its poster and the toggle reads « Lire
l’animation ». Measured in Chrome: the WebM is picked, autoplay starts,
the 4s clip loops, its bottom within 4px of the viewport's at 1512×771,
1440×900, 1920×970, 768×1024 and 390×844, title 56px at 1512×771, no horizontal overflow. Safari's
HEVC path is not verified. The clip is from _Pulp Fiction_: a film's footage
and an actor's likeness on a professional site, a small rights risk Stéphane
accepted. The interim page surface the 3D world kept under every non-world
page (for the old contact page) is gone: contact and the 404 stand on the
orange ground.

**World pages (« Bascule », this branch)** — `/developpeur` and
`/graphisme-3d` are one component (`features/world/views/world-page/`), iso with the mockup in
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
  loop, which it lets go whenever nothing moves — off screen, or once its
  still frame is drawn (measured: 0 rAF calls/s under reduced motion on the
  world, contact and project pages, was ~30; 60/s with motion), its state in a root `CloudStore`. The torus has no hover effect: it is
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
- Lede, scrubbed sentence (unlit floor `--scrub-unlit` 55%: 5.54:1 dev,
  3.33:1 cgi where the text is large; in the 3D world 68%, 4.65:1, wherever
  the clamp leaves it under 24px — below 924px wide or 650px tall, measured
  22px at 320, 390 and 844×390 and 22.9px at 1440×620; audit #39), facts as a `dl`, CTAs « Me contacter » → /contact, « Mon CV » → the PDF.
- Dev work: seven numbered plates (logo or cover, title, period, role, tools
  with marks) to `/developpeur/<slug>`, the project page below. Count derived:
  « 07 projets · 2020 – aujourd'hui » (see « Client references »).
- 3D work: the full-bleed mosaic, every tile a link to `/graphisme-3d/<slug>`,
  which opens a native `<dialog>` viewer over the wall (16:9 plate, diagonal
  cut from SWEEP_LEAN, drift and darken, counter, ticks (one row of 44px-high
  targets from 900px, two rows of 24px below so none is under 24×24 — WCAG
  2.5.8, measured 30.8×24 at 320, 39.5×24 at 390, 67.8×24 at 844×390,
  52.9×44 at 1440, never overlapping), the plate a named `role="group"`,
  arrows/Home/End,
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
worlds), 1024, 390 and 320 (no horizontal overflow). Two columns from 48rem since the responsive audit
(was 900px; 5fr/7fr), portrait sticky at 96px. The portrait is the 2022 « pensif »
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

- Hero (`ProjectHeroComponent`): « Réalisations » back to `/developpeur`, the rank
  « 02 / 06 », series · year and role, the title split on « — » into the name
  rising letter by letter and the condensed qualifier flipping in (the world
  pages' keyframes, reused), then « Voir le site » (`websiteUrl`, new tab) and
  « Voir la vidéo » (`videoUrl`), each only when the project has one. The h1
  is read as the plain title (a visually hidden copy; the letters are
  `aria-hidden`).
- The presentation visual on a light plate (the world's ink, the shot
  multiplied onto it), its left edge cut at the sweep's lean, computed from
  the viewport's aspect (`PlateLeanDirective`), bleeding off both sides on a phone,
  from the column's edge to the right from 900px; « Fig. » caption. WebP
  derivatives with real widths and `sizes`, `fetchpriority="high"`.
- Contexte: the context as the scrub sentence (`ScrubSentenceComponent`, with the
  prototype's ramp from 85% of the viewport, `BODY_RAMP`). **The summary is not
  shown**; it stays the meta description (Stéphane, 2026-11-15).
- Mission (role set large, mission, numbered steps), Outils (marks as masks,
  name only where no mark exists: Adobe XD, Jira, MongoDB, PHP).
- (Superseded 2026-11-15, see « Client references »: videos are now a link to
  YouTube and this block is gone.) Vidéo, when there is one: a facade (ADR-0016) — the presentation visual as
  poster and a real `<button>` « Lire la vidéo : <titre> »; the press swaps in
  the `youtube-nocookie.com` player, playing, focus moved into it. « Voir la
  vidéo » jumps to it and focuses the button. No project has a video yet; with
  one added locally for the measurement: resource hosts before the press
  `localhost` only, after it `www.youtube-nocookie.com`; no iframe before. The
  schema accepts https YouTube video addresses only.
- The band (`DevWorkComponent` in `common/`, now parameterised): a project in a series ends on the
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

**Bilingual, PR 1 of 3 (ADR-0017, `feat/i18n-setup`)** — `@angular/localize`
22.1.4 (pinned with `@angular/compiler`, its peer). The production build is
localized (`localize: true`, `i18nMissingTranslation: error`): French, the
source locale, at the root of `dist/web/browser` exactly as before; English
under `en/` with `<base href="/en/">`. 54 prerendered pages, 27 per tree.
`ng serve` still serves French; `pnpm --filter @portfolio/web dev:en` serves
the English tree, **at the root** (`/developer`, not `/en/developer`: the dev
server serves one locale without its sub-path), its language link pointing at
a French page that server does not have. `pnpm --filter @portfolio/web
i18n:extract` writes `src/locale/messages.xlf` (not committed) to diff against
`messages.en.xlf`.

- 75 interface strings marked, each with a `@@` id: shell (skip link, role,
  navigation names, dock labels), page titles and descriptions in the route
  table, world pages (CTAs, work count, stack), the viewer's labels and live
  status, contact (eyebrow, labels, errors, the four send states), project
  page chrome, 404, image fallbacks. **The English is a draft** written here
  from the French, no new claim: to be rewritten by the communication expert
  in PR 3 and approved in the final content review.
- The content of `world-content.ts` and `static-content.ts` is in both
  languages since PR 2 (below).
- Section paths come from one table, `SECTIONS` in
  `core/i18n/site-paths.ts`, read for the build's locale (`$localize.locale`,
  inlined per tree) and for both by the switcher, the `hreflang` links and the
  prerender check (ADR-0017 amended: a `$localize` path cannot name the other
  tree). Routes carry `data.page`. Every path comparison (world detection,
  the transition classifier, the dock hidden on contact, the header links,
  project and piece links, `#video`, the mosaic's plain hrefs through
  `Location.prepareExternalUrl`) reads the tree's own paths.
- The language link: a plain `<a>` in the header between « Contact » and the
  switch, `href` to the same page in the other tree, `hreflang` and `lang` on
  it, « EN » / « FR » visible, « English version » / « Version française » as
  its name. A click sets `lang=<locale>; Max-Age=31536000; Path=/;
SameSite=Lax` (a native listener: event replay cancels a link's default
  action when its click is bound in the template). From a 404 it opens the
  other tree's developer page. The site's first cookie; no consent needed
  (ADR-0017).
- Per page, in the prerendered HTML: `<html lang>` (set by the localize
  build), the localized title and description, and three `<link
rel="alternate" hreflang="fr|en|x-default">` with absolute addresses on
  `https://stephane-lieumont.fr` (ADR-0008's host; x-default = French); none
  on the 404. Open Graph locale per tree since `feat/seo` (see « SEO »).
- `withI18nSupport()` added to hydration: without it Angular skips hydrating
  any component holding an `i18n` block, the root included (the prerender
  check caught it: no `ngh` on any page).
- Measured on the production build served per tree (a local stand-in for the
  ADR-0005 nginx rules): all 14 sampled routes in both trees 200 (unknown
  addresses 404 with their tree's page), right `lang`, title, h1 and switcher
  target; the switcher round-trips `/en/developer/pixmodels` ↔
  `/developpeur/pixmodels`, cookie `lang=fr` then `lang=en`; the world switch
  under `/en` stamps `sweep-cgi` / `sweep-dev` and plays the sweep, eyebrow
  « 3D art » / « Development »; no prerendered node removed on hydration, no
  console error. Dev servers, both trees: « Angular hydrated … 0 component(s)
  were skipped » on six pages each, same component and node counts in both.
- Initial bundle 418.97 kB raw / 118.2 kB transfer per tree at PR 1
  (`withI18nSupport` costs about 2.6 kB raw); see PR 2 for today's.
- Not done here: nginx itself (ADR-0005 amended with the `/` redirect on the
  `lang` cookie then `Accept-Language`, 302 and `Vary`, and per-tree
  `try_files` / `error_page`; outside the repository). Not verified: Safari,
  Firefox, a screen reader announcing the link's language.
- Known: the English tree's build copies `public/` again under `en/` (1.7 MB
  of fonts, images, logos and the CV); its pages load those from the root
  (`/fonts`, `/images`), so the copies are never requested. The French 404 at
  412–444px wide now scrolls by 25px: its height assumes one header row from
  410px, and the language link moved the French wrap point to about 448px.
- **CLAUDE.md's Language section still says « French-only »**: not edited by
  an agent; to amend by Stéphane (ADR-0017 asks for it with this PR). Specs
  00/01/02/03/06 and `content-guidelines.md` are amended. The
  `communication-expert` agent's brief still says French only.

**Bilingual, PR 2 of 3 (ADR-0017, `feat/i18n-content`)** — the content in
both languages, at the source.

- shared-types: `LocalizedText` `{ fr, en }` and
  `localized(schema)` (`src/localized.ts`), each language held to the
  field's own rule, trimmed and never blank, both required.
  `MediaAsset.alt` is `altTextSchema`: blank in both languages (decorative)
  or in neither. Applied to every visitor-facing text field: `WorldPage` (role
  word, lede, scrub, facts — labels unique in each language), `WorldStack`
  points, `ContactPage` (title, lede, portrait caption), `Project` (title,
  summary, context, role, mission, mission steps, presentation caption),
  `MediaAsset.alt` (above). Slugs are `LocalizedSlug`. `series` stays one string: a
  proper name and the grouping key. `SiteSettings` has no text. Spec 03
  amended. **Contract change not yet carried to the API** — follow-ups for
  `apps/api`, none started:
  - migrate the content contract: the Drizzle schema (provisional, spec 03)
    still has one `title`, `slug` and `alt` column; every localized field
    becomes a pair (two columns or JSON), with a generated migration;
  - slug uniqueness per language: two unique indexes (`slug_fr`, `slug_en`)
    in place of `projects_slug_unique`, and the same for artworks;
  - `ProjectsService.bySlug` (and the API route) takes a locale, since the same
    slug string can name different records in the two trees.
- Static content migrated, ids added to projects and pieces (uuid, as the
  schema has them). **The English is a draft** written from the French, no
  new claim, to be rewritten by the communication expert in PR 3: every
  `en` value in `world-content.ts` (role word « 3D ARTIST », ledes, scrubs,
  facts, contact title and lede, portrait alt; the 52 stack points were
  rewritten in both languages on 2026-11-15, see « Content review ») and in
  `static-content.ts` (six projects' titles, summaries, contexts, roles,
  missions, steps, captions and alt texts; sixteen pieces' titles and alt
  texts).
- English slugs: kept where they are a proper name or already English
  (`case-tes-potes-mobile`, `-landing-page`, `-web-app`,
  `kasa-openclassrooms`, `pixmodels`, `escart-wild`, `beebop`, `gorgotte`,
  `caricature`), translated otherwise (`3d-portfolio-2018`, `lego-minions`,
  `alien`, `building`, `living-room-night`, `bedroom`, `living-room-day`,
  `modern-house`, `entrance-hall`, `exterior`, `light-bulb`,
  `marketing-visual`, `tomatoes`). Bucket keys stay on the French slug: one
  file per picture for both trees.
- Pages read `text[SITE_LOCALE]` through `inLocale()` and the `inLocale`
  pipe (`core/i18n/in-locale.pipe.ts`), named apart from shared-types' Zod
  `localized()` so an auto-import cannot pull Zod into the browser. Route guards, resolvers (title,
  description), prerender params, links, the mosaic's hrefs and the project
  hero's `#video` link use the tree's slug. A `PageRef` names a project or a
  piece by its record id: the switcher and the `hreflang` links go slug →
  record → the other tree's slug. A French slug under `/en` is a 404. The
  role word's italic accents are per language (« 3D » ends « GRAPHISTE 3D »,
  opens « 3D ARTIST »).
- The prerender check asserts every English page renders the `.en` values
  (ledes, scrubs, fact values, titles, contexts, roles, missions, steps,
  captions, contact title and lede), and that no French content reaches the
  English tree: every French value that is not also English, whole, and every
  accented word of the French content, in the text, `alt`, `aria-label`,
  `title` and the meta description. Every page link (the switch, fragments,
  files, demos and other origins excepted) must name a page of its own tree:
  an English tile or card on a French slug fails. Unit tests re-import the
  app's modules under `en` (`features/english-tree.spec.ts`) to check the
  cards', tiles' and video link's English slugs, titles and alt texts.
  **Known gap**: French that is neither a whole French value nor an accented
  word of it passes — a half-translated sentence of unaccented words (« the
  same salon de jour »), or French chrome missing from the `FRENCH_CHROME`
  list. The final content review is the backstop.
- Measured on the production build served statically (port 4211, the
  ADR-0005 stand-in): all 52 pages of both trees 200 with the right `lang`,
  h1, switcher target and `hreflang` slugs; the four unknown addresses tried
  (one a French slug under `/en`, one an English slug under the root) 404
  with their tree's page; English `main` text, `alt`, `aria-label` and
  `title` dumped and grepped: no French word. Switcher round trips by click,
  cookie set each way: `/en/developer/3d-portfolio-2018` ↔
  `/developpeur/portfolio-3d-2018`, `/graphisme-3d/extraterrestre` ↔
  `/en/3d-art/alien`, `/en/3d-art/living-room-night` ↔
  `/graphisme-3d/salon-nuit`. In-app: an English tile opens
  `/en/3d-art/alien` (« 2 of 16. Alien, 2016 », switcher to
  `/graphisme-3d/extraterrestre`); an English card opens
  `/en/developer/3d-portfolio-2018`. No prerendered node removed on
  hydration, no console error, tab visible.
- Initial bundle 437.58 kB raw / 123.71 kB transfer per tree, up from
  418.97 / 118.2: each tree ships both languages of the static content
  (about 18.6 kB raw, 5.5 kB transfer). Under the 500 kB warning. Moving
  the content to the API does **not** remove it by itself: records fetched
  as `{ fr, en }` would carry both languages in the hydration state instead.
  It goes away only if the public API serves one language per request (a
  locale parameter, the back office alone reading both) — the intended
  route — or, short of that, if the heavy fields (stack points, project
  copy) move behind lazy-loaded routes, which only defers the weight.

**Prerendering (ADR-0008)** — `outputMode: 'static'`: the build writes one
complete HTML file per route under `dist/web/browser` — `/` (a redirect to
`/developpeur`), `/developpeur`,
`/graphisme-3d`, `/contact`, one per project (`developpeur/<slug>`, enumerated
from the static `PROJECTS`; ADR-0008 says from the API once it serves them),
and `/404/index.html` for nginx's `error_page`; the English tree the same
under `en/` (see « Bilingual »). No route renders on demand and
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
`<link href>`: the YouTube player only after a click, ADR-0016; the
`hreflang` alternates on the site's own host excepted). Both trees are
checked, each with its own expectations: `<html lang>`, the three `hreflang`
links (none on the 404), the language link's target, the interface strings
in that language, and no French interface string anywhere in the English
tree's text, title or accessible names. The heading
is read as spoken (its `aria-label`, else its text without `aria-hidden`
parts). The rules are tested against mutated pages
(`scripts/prerender-checks.test.mjs`).

Known limits, deliberately not fixed here:

- The project list is read from the static `PROJECTS` in three places —
  `app.routes.server.ts` (prerender params), the route resolvers and
  `scripts/prerender-checks.mjs`. All three move to the API (ADR-0008).

**Page metadata** — each route sets its `<title>` and meta description, in the
prerendered HTML and on client navigation (`PageMetadataService`, a `TitleStrategy`).
Descriptions are sized for search results (120–160) from the page's own
facts; a project's is its summary, a piece's is built by `pieceDescription`.
The 404 is `noindex`.

**SEO (`feat/seo`, issues #37 and #38)** — the same service writes, on every
indexable page of both trees, in the prerendered head:

- `<link rel="canonical">`: the page's own absolute address in its own tree,
  the same as its `hreflang` entry for that tree. None on the 404, nor any of
  what follows.
- Open Graph: `og:type` (`profile` on the two world pages, `website`
  elsewhere, with `profile:first_name` / `last_name`), `og:site_name`
  « Stéphane Lieumont », `og:title` (the page's title), `og:description` (its
  meta description), `og:url` (= canonical), `og:locale` `fr_FR` / `en_GB`
  and the other as `og:locale:alternate`, `og:image` with type, 1200 × 630
  and alt (« Stéphane Lieumont, Lead Tech » / « …, graphiste 3D », English
  « …, 3D artist »: two new `@@og.image.*.alt` strings); `twitter:card`
  `summary_large_image`.
- Share cards: `public/og/{dev,cgi}-{fr,en}.png`, 1200 × 630, 15–27 KB,
  drawn by `pnpm --filter @portfolio/web og:images`
  (`apps/web/scripts/og-images.mjs`, committed output): the world's ground,
  the hero's eyebrow (world label, its three tools), the name, the role word
  with its italic accent letters, and the world's point cloud (`</>` in dots,
  the torus). Text is drawn as glyph outlines from `public/fonts` (fontkit,
  after wawoff2 decompresses the WOFF2: fontkit cannot apply a variable
  font's axes to WOFF2), so no system font is involved. New web
  devDependencies: `sharp` (same 0.34.4 as the API), `fontkit`, `wawoff2`.
  A project or a piece shares its world's card; contact the developer's. The
  English tree's copy of `public/` duplicates them under `/en/og/`, never
  referenced.
- JSON-LD (one `@graph`): world pages carry a `ProfilePage`, the tree's
  `WebSite` (`inLanguage`, url = its developer page) and the `Person` (name,
  `jobTitle` = `@@site.role`, url = the root, address Fontenilles, France
  from the contact caption, `sameAs` = the three social links of
  `SITE_SETTINGS`). Project and piece pages a `WebPage`, contact a
  `ContactPage`, each with name, description, `inLanguage`, `isPartOf` the
  tree's site. Projects are not `CreativeWork`: a client's product credited to
  Stéphane would be a claim the site does not make.
- `sitemap.xml` and `robots.txt` are written at the root of the build only
  (`scripts/write-seo-files.mjs`, after `ng build`), never under `en/`. The
  sitemap lists every prerendered page that names a canonical and is not
  `noindex` — 52 pages, both trees, the 404 and the two root redirects out —
  each with its three `xhtml:link` alternates read from the page itself, and
  the build date as `lastmod`. `robots.txt` allows everything and names the
  sitemap; it disallows no path, since a `Disallow: /admin` would publish
  the back office's address (spec 01 amended: the admin keeps itself out
  with `noindex`).
- The prerender check now fails a page without exactly one canonical on its
  own address, without each `og:*` above matching the page (image of its
  world and language, size, locale), without the Twitter card, or whose
  JSON-LD does not parse, does not describe the page in its language, or (on
  a world page) has no `Person` with profile links; the 404 with any of
  them; a sitemap that does not list exactly the indexable routes of both
  trees with their alternates and a date; a `robots.txt` that does not name
  the sitemap or disallows a path; a share card that is not a 1200 × 630 PNG
  under 300 KB; a robots or sitemap under `en/`.
- Measured on the production build served statically: `/en/developer/ledger`
  and `/graphisme-3d` fetched and their head parsed (canonical, every `og:*`,
  the card fetched back as a 1200 × 630 PNG); `/robots.txt` and
  `/sitemap.xml` 200, `/en/robots.txt` and `/en/sitemap.xml` 404. Not
  verified: a real share preview (LinkedIn Post Inspector, Slack) once
  deployed, Google's Rich Results test.
- **Descriptions held to 120–160** (titles ≤ 60 unchanged). Rewritten by the
  communication expert from the sourced facts: the developer and contact
  descriptions (`@@page.dev.description`, `@@page.contact.description`), and
  the summaries of immobilier.ch, Web-Atrio, CIR — Scancir, Linxea, Ledger and
  Case Tes Potes mobile, both languages. A piece's description is no longer
  its alt text: `pieceDescription` (page-metadata) builds « <titre> — rendu 3D
  (<logiciels>), <année>. <alt>. Par Stéphane Lieumont, Lead Tech et graphiste
  3D autodidacte. » from the piece's own fields, so a piece from the back
  office gets one too; it falls back to a shorter credit, then none, then
  drops the alt, rather than run past 160. Three new strings
  `@@piece.description.*`. `page-metadata.service.spec` fails a project
  summary out of range in either language, or a French piece description;
  the English piece descriptions were counted by hand (136–160), not by a
  test — the test runtime carries no translations. Not yet measured on the
  build.
- Initial bundle 445.49 kB raw / 127.12 kB transfer per tree, +2.4 kB raw /
  +0.8 kB transfer over `main` (443.13 / 126.34). The art viewer's stylesheet
  budget warning (4.30 kB over 4 kB) predates this branch.

**Media** — 16 renders, 6 project covers and 6 presentation visuals in MinIO, served through `/medias`
(nginx in production, the dev server's proxy locally). Bucket policy is
read-for-anyone, write-for-nobody; verified with an anonymous PUT returning 403.
The CV PDF is served from the repository. Locally the renders need
`pnpm infra:up`: without MinIO, `/medias` answers 502 and every picture breaks.

**Tests** — 606 passing on the web side, 98.2% lines, 89.2% branches, 94.3%
functions (plus 98 for the prerender check and the SEO files); axe on every page, every project page included. Every route, the
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
   `apps/web/src/app/core/data/world-content/world-content.ts`, parsed against them in a
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

- Project page, written here and not on the prototype: the two presentation
  alt texts; « Autres réalisations » (shown by no page today: every project is
  in a series); the logos' alt texts (« Logo de Ledger »…), no longer
  rendered (since audit #39 the hero logo and the cards' pictures are
  `alt=""`: the heading or title beside them already says the name); the role prefix
  « Chez Web-Atrio · »; « +N autres outils »; the mission steps written from
  the CV and Stéphane's messages.

- **Stack « Maîtrise » points rewritten generically on 2026-11-15**
  (`content/mastery-points`, Stéphane's brief: « pour les technos, trouve des
  formulations génériques et en accord avec la techno sélectionnée »), French
  then English, both worlds. Each point now states what he does with the tool:
  no claim about this repository (ADR, Zod monorepo, Node 22 build, this
  project's Docker infra, WCAG checked on every build, 80 % coverage), no
  named piece or client, no count. Resolved by it: the « à valider » points
  (RxJS interop, .NET 2–4, React 2–4, V-Ray « Les matières »), « Zoneless »
  moved from RxJS into Angular's first point, « Les seize rendus » gone, the
  stack claims the repository contradicted (« Les mêmes conteneurs… »,
  « Une commande pour lancer l’infrastructure locale »), and non-breaking
  spaces before « : » in every stack point. Kept as Stéphane's own words: the
  four AWS points and .NET « Référent technique ». Still for him to approve
  in the content review: the generic Docker, Git and 3D points are inferred
  from the tool and the gallery, not from something he said.
- « Fontenilles, France » under the portrait is sourced by the 2026 CV
  (cv-2026-facts). « Sans école et sans commande » replaced by « Sans école,
  avant le développement. » (`feat/client-references`).
- French typography outside the stack: no non-breaking spaces before « : »,
  « ? », « ! » (contact title « … Hello World ? », and others).

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

**Tool marks completed (2026-11-15).** Azure and Azure DevOps (Simple Icons 9.21.0, CC0, since removed upstream at Microsoft's request), Segment (gilbarbara/logos, CC0), TestFlight (Apple's App Store mark), CI/CD and unit tests (Lucide, ISC) live in `public/logos/other/` with their sources in its README. Ledger shows no .NET: its backend is Python (Stéphane, correcting the CV's « outils .NET Core »).

**World switch off the worlds (2026-11-15, Stéphane).** On contact and the 404 the switch idles: the thumb stays on the world you came from but greyed (16% ink), neither label inverted, no `aria-current` on either world; it wakes on any world page.

## Known accessibility debt (deferred by Stéphane, 2026-11-14)

« sois iso maquette, on verra plus tard pour les contrastes ». The mockup's
values ship as they are; each failure below was measured at the worst pixel
on the production build (1440 and 390), and is to be fixed later.

| Where                                                                       | Measured                                                                                                                                      | Requirement                                            |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Copyright spine over the 3D mosaic (it sits above everything, per Stéphane) | 1.00:1 over a dark render (5.70:1 on bare orange); dev world 5.26:1 at 1440, 1.02:1 worst pixel at 390 (a few bright pixels passing under it) | 4.5:1                                                  |
| Inactive stack marks: icon at 50% opacity, 3D world                         | ≈2.9:1 (label stays 5.67:1)                                                                                                                   | 3:1 for graphics, if the icon is held to carry meaning |

## Decided, not built

- **Bilingual FR/EN (ADR-0017), PR 3.** PRs 1 (infrastructure and
  interface strings) and 2 (content `{ fr, en }`) are in « Works today ».
  PR 3: the English copy — interface strings and content, all draft today —
  rewritten by the communication expert and reviewed. The nginx redirect and
  per-tree 404 (ADR-0005, amended) are to apply on the server.

## Planned next (Stéphane, 2026-11-15)

1. Merge the client-references PR.
2. A responsive audit of the whole application.
3. The back office (spec 04 draft, ADR-0019 proposed): projects (dev and 3D) with detailed descriptions, dev and 3D tools served by the API, front ↔ API ↔ MinIO, a hidden admin only Stéphane can enter, credentials he changes himself, `Secure` `HttpOnly` session cookie. The interactive CV is a V2.

## Missing

Ordered by what hurts most on the day the site goes live.

| Gap                                    | Consequence                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **nginx not updated for prerendering** | Outside the repository. ADR-0005 (amended 2026-11-14) now prescribes `try_files $uri $uri/index.html =404;` and `error_page 404 /404/index.html;` for `/*`. The live config still has the `index.html` fallback, which would serve the prerendered home with a 200 under every unknown URL. |
| **`pnpm infra:up` is broken**          | `minio/minio` no longer exists on Docker Hub (nor on quay.io), so the compose file cannot pull. `cgr.dev/chainguard/minio` runs the same binary and works with the seed script; switching to it is undecided.                                                                               |
| **Contact route missing in the API**   | The form posts to `/api/contact` and tells the visitor sending is not available yet. Needs the Fastify route: Zod `contactMessageSchema`, rate limit, relay to a mail service (ADR-0007).                                                                                                   |
| **API is a skeleton**                  | Only `/health`. No projects, no media, no contact route.                                                                                                                                                                                                                                    |
| **No back office**                     | Content lives in `apps/web/src/app/core/data/static-content/static-content.ts`. Every edit is a commit.                                                                                                                                                                                     |
| **Spec 05 missing; spec 04 drafted**   | `docs/specs/04-back-office.md` is a draft (2026-11-15) awaiting Stéphane's answers, with ADR-0019 (admin access hardening) proposed. The content spec 05 was never written (the SEO it was to cover is built, `feat/seo`).                                                                  |

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

**Language switch, after review (2026-11-15).** The switcher shows the flag of
the language it leads to (UK on French pages, France on English ones; Stéphane),
drawn as a black-and-white print (Stéphane's references): near-black for the
colours, the light ink for the white (the dev ink on the dark ground, neutral
300 on the orange, `--world-flag`), a mid grey for France's red, a hairline
of the ink around it,
named « English version » / « Version française »; 26–45px wide, 34–36px tall,
no header overflow 320–1440. Switching no longer flashes white or replays the
page: the world's ground is inlined in the document head, a typed
cross-document view transition (`lang-switch`) holds the old page until the
new one has painted and started (200ms, one step, no crossfade, no
plus-lighter), and
the new page opens at the same scroll position with no entrance and the cloud
assembled (a `lang-switch` sessionStorage flag; measured: scrollY 700 → 700,
`lang-switched` stamped). Filmed headless at 60fps: no white frame, no
empty cloud; one frame (16ms) at the old page's capture is still lighter,
with a ghost in the header — not explained yet). The cookie now also carries `Secure` and is set on
a middle-click too; an unknown slug's switcher leads to the other tree's first
page, as its 404 does; the prerender check's cross-origin rule exempts only
`rel="alternate"`. **English copy is draft pending PR 3**: interface strings
and content alike (see « Bilingual, PR 2 »).
