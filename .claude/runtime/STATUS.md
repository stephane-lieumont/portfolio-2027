# Status

Last updated 2026-09-03. `main` at the merge of PR #10.

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

**Tests** — 65 passing, 100% lines, 98.8% statements, axe on every page.

## Missing

Ordered by what hurts most on the day the site goes live.

| Gap                         | Consequence                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No images anywhere**      | The Gallery is a text list. A 3D portfolio with no pictures is not a portfolio. Assets exist in `Portfolio_2022`; see DECISIONS.md.                                                   |
| **CV is a dead link**       | `/cv-stephane-lieumont.pdf` is linked from the header and Contact. The file is not in `public/`. The most prominent button on the site does nothing.                                  |
| **No SEO at all**           | No `robots.txt`, no `sitemap.xml`, no meta description, no per-route `<title>`, no Open Graph. The current site is indexed; replacing it with this loses that.                        |
| **No static prerendering**  | ADR-0008 settled it; `angular.json` has no `outputMode`. The build is a plain SPA, so there is nothing under the loader until Angular boots, and the 404 cannot return a real status. |
| **Contact form not wired**  | The form renders and goes nowhere. Needs a delivery service (ADR-0007 forbids sending from the browser).                                                                              |
| **API is a skeleton**       | Only `/health`. No projects, no media, no contact route.                                                                                                                              |
| **No back office**          | Content lives in `apps/web/src/app/core/static-content.ts`. Every edit is a commit.                                                                                                   |
| **Specs 04 and 05 missing** | `00-vision.md` references a back-office spec and a content/SEO spec that were never written.                                                                                          |

## Deferred on purpose

- Decorative SVG shapes (triangle, bubbles) from the 2022 site — Stéphane wanted
  to see the detail pages first.
- MinIO — earns its place with the back office, not before. See DECISIONS.md.
