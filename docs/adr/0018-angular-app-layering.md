# ADR-0018 — Angular app layering

- **Status**: Accepted
- **Date**: 2026-11-15

## Context

`apps/web/src/app` grew page by page during the « Bascule » integration: `core/` mixed services, signal state and static content at its root; `shell/` held the header's satellites while the header itself lived in `app.html`; `features/world/` held pieces the project page also used (the dev-work band, the scrub sentence, the plate image, the reveal directive, the hero's letter helpers), so `features/project/` imported from `features/world/`, and `features/contact/` imported a constant from `shell/social-dock.ts`. The pill button was written three times (`world-page.scss`, `project-hero.scss`, the 404's inline styles). Nothing stated which folder may depend on which, so nothing stopped the next import going the wrong way.

Stéphane decided the layering on 2026-11-15, as the structure he uses daily on Angular projects.

## Decision

Five layers under `src/app`, each importing only the layers below it:

- **`core/`** — app-wide singletons and data: `services/` (`ContactService`, `ProjectsService`, `PageMetadataService`, `RouteTransitionsService`, `services/motion/`), `stores/` (`WorldStore`, `CloudStore`: plain signal services, no `@ngrx/signals`), `i18n/`, `config/`, `data/` (the static content until the API serves it). Domain types still come from `@portfolio/shared-types`, never redeclared. Imports no UI layer.
- **`shared/`** — generic UI that knows nothing of the domain, BEM: today `shared/components/kit-ui/button/`. Imports no other layer.
- **`common/`** — domain pieces used by more than one feature or by the layout: `components/` (dev-work, scrub-sentence), `directives/` (plate-image, world-reveal), `constants/` (icons, network names), `utils/` (work count, hero letters). May use `core` and `shared`.
- **`features/<name>/`** — `views/` (the routed component), `components/`, and `directives/`, `utils/` when the feature needs them: `world`, `project`, `contact`, `errors`. A feature never imports another feature or the layout.
- **`layouts/site-layout/`** — the root component (`app-root`, bootstrapped by `main.ts`) with the header, the copyright and the live region in its template, and the dock, thread and motes as `components/`. Imports no feature.

The rest of the decision:

- **Angular suffixes stay in file and class names**: `world-page.component.ts`, `contact.service.ts`, `world.store.ts`, `plate-image.directive.ts`, `in-locale.pipe.ts`; `WorldPageComponent`, `ContactService`, `WorldStore`. One folder per component. Selectors are unchanged (`app-…`): `src/styles/` keys rules on them.
- **Aliases** `@core/*`, `@shared/*`, `@common/*`, `@features/*`, `@layouts/*` in `tsconfig.json`. An import that leaves its folder uses one; a relative path stays inside a folder.
- **ESLint enforces the direction** (`no-restricted-imports`, part of `pnpm verify`): one pattern per layer for the aliases it must not use, and, everywhere, a refusal of relative paths that climb (`../`), since a climbing path would reach any layer without naming an alias.
- **The button is an attribute component on the anchor** (`<a appButton class="btn">`): a call to action that goes somewhere stays a link, with its `routerLink`, `href` and `target`, and no wrapper element. Its styles are `:host` rules at one class of specificity, which a caller's `.btn` rule extends (the project hero's 44px height, the 404's top margin).

## Consequences

Where a file goes is decided by what it imports and who imports it, and a wrong import now fails the build instead of waiting for a reviewer. The root of the dependency graph is visible from the folder names.

Accepted downsides:

- **A large diff and noisy history.** The move touched every file of the app (100 renames, class names with them). `git log --follow` and `git blame -C` still trace each file, but a plain `git blame` on a moved line now points at the move, and any open branch rebases onto it with conflicts.
- **Suffixes go against Angular 22's default.** The CLI generates `world-page.ts` and `WorldPage`; every generated file has to be renamed by hand, or the schematics configured to match, and external examples read differently from this codebase.
- **Aliases are configuration to maintain.** They live in `tsconfig.json` and the build and test tooling read them from there; a new layer or a renamed one means editing the paths and the ESLint patterns together. The prerender check (`scripts/prerender-checks.mjs`) imports `core/data/` and `core/i18n/site-paths.ts` directly in Node, which knows no alias: those files must keep importing nothing but packages.
- **Placement is a judgement at the edges.** `PlateImageDirective` and `WorldRevealDirective` read `ReducedMotionService`, so they sit in `common/`, not `shared/`; `shared/` holds only the button. The page-metadata spec reaches the route table at the app's root, which has no alias, behind a commented `eslint-disable`.
- **Extracting a component is visible in the HTML.** The button adds its host attributes (`appbutton`, `_nghost-…`, `ngh`) and a stylesheet to each prerendered page that has one. Its computed styles were measured identical; the markup is not byte-identical.
- **The bundle is not neutral to file layout.** With no code changed, the move alone made esbuild split the shared chunk differently and added about 2.4 kB raw to the initial bundle (cross-chunk import and export lists); the button added about 1.1 kB. Measured: 437.59 → 441.13 kB raw, 123.72 → 125.72 kB transfer per tree, under the 500 kB warning.
- **The layout is the root component.** Rendering a layout component from a separate root would have added a host element around the header and `<main>`; to keep the document unchanged, `app.ts` is gone and `main.ts` bootstraps `SiteLayoutComponent`.

## Alternatives considered

**Angular 22's default naming (no suffixes, `WorldPage`)** — shorter names and what the CLI generates. Rejected by Stéphane: the suffix tells the kind of file at a glance in a tree, a tab or an import, as on his other projects.

**`@ngrx/signals` for the stores** — a structured store API. Rejected: two stores of a few signals each; plain signal services are enough and add no dependency (ADR-0007).

**A shared layout rendered by `app.ts`** (`<app-site-layout />`) — keeps `app.ts` as the root. Rejected: it adds an element around the whole document, which changes the DOM `src/styles/` and the view-transition names rely on.

**Enforcing the layers with `eslint-plugin-import`'s `no-restricted-paths` or `eslint-plugin-boundaries`** — rules written as zones rather than patterns. Rejected under ADR-0007: ESLint's built-in rule does the job with a regex per layer, and the climb rule closes the gap relative paths would leave.

**Keeping the button's CSS duplicated** — no extraction, no markup change. Rejected: the three copies already differed in places (the project hero's border and height) with no one place to read the base from, and the next page with a call to action would have made four.
