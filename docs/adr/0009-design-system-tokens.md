# ADR-0009 — Design system built on CSS tokens

- **Status**: Accepted
- **Date**: 2026-08-31

## Context

Stéphane asked for "a consistent style, like with a design system". Auditing the current site explains why the request is well founded.

There is **not a single CSS custom property** on the site: `#f2a154` is written out 40 times, `#fff` 24 times. The dark theme on the 3D section isn't a token redefinition but a `theme-ligth` / `theme-dark` class on `<main>` that recolours every element by hand — hence the impossibility of supporting `prefers-color-scheme`.

Typography runs to **eleven sizes between 9.6 px and 28 px with no ratio at all**. Body is 14 px, the hero title 25.2 px, and the `<h1>` is 28 px only because that's the browser's default `2em`: no scale was ever decided. Spacing mixes px, em, rem and percentages — the project grid gutter is 34.8 px at 1160 px and 57.6 px at 1920 px. There are **four corner radii with no scale** and **a single shadow** for the whole site.

The most telling symptom: buttons render in **Arial**, because `.button` declares no `font-family` and inherits from the user agent. Nobody decided that.

## Decision

Every visual value is a **CSS custom property token**, defined once in a global stylesheet. No literal colour, spacing, radius, shadow or font size value is written inside a component.

Tokens are organised in two tiers. **Primitive tokens** name raw values (`--color-orange-500`, `--space-4`, `--text-lg`). **Semantic tokens** name roles and reference the primitives (`--surface-page`, `--text-primary`, `--accent`, `--border-subtle`). **Components consume semantic tokens only**: that's what makes a theme change possible without touching a single component.

The **theme follows the nature of the content**, a decision from the current site that we keep and stand behind: light on the home page and the Developer section, dark on the 3D Graphics section so the renders dominate. Technically, a theme is **a redefinition of the semantic tokens** under a `data-theme` attribute, never a rewrite of component rules.

**Section themes are fixed, and `prefers-color-scheme` does not flip them.** The light/dark split is an identity decision, not a display preference: the switch to dark is what signals the visitor is entering the 3D world and what lets the renders own the screen. If the OS dark mode turned the home page and the Developer section dark, that contrast would vanish and the strongest effect on the site would cancel itself out. `prefers-color-scheme` only ever drives an explicit manual toggle, if one is added. Concretely: `:root { color-scheme: light }` and `[data-theme="dark"] { color-scheme: dark }` — never `light dark` on the root, which would hand a dark-mode visitor native dark form controls on a light page.

The scales are explicit and built on named ratios:

- **Typography**: body anchored at 16–18 px, fluid headings via `clamp()`, and a **ratio that opens with the viewport** — major third (1.25) at 360 px widening to perfect fourth (1.333) at 1440 px, on headings only. Two rules bound it: the **hero-to-body ratio has a floor of 3× at every viewport**, and **no heading is ever smaller at a wider viewport than at a narrower one**. The current site crushes its hierarchy from 1.7× to 1.2× on mobile; that is what must not happen again.
- **Spacing**: one scale, in `rem`, no percentages. Grid gutters are fixed.
- **Radii**: three values at most.
- **Elevation**: two or three levels, each shadow composed of several layers and **tinted relative to its background**.

A **maximum content width** is a token, applied on every page.

## Consequences

Changing a palette, a density or a radius happens in exactly one place. That's what makes consistency sustainable over time rather than dependent on discipline every time a component is written.

Light and dark themes become a property of the system rather than duplicated code. Adding a section with the inverted theme costs nothing.

Separating primitives from semantics means a brand colour can be renamed or adjusted without rereading the components, and above all it means reasoning in intent (`--text-primary`) rather than in values — a component using `--color-orange-500` directly breaks the dark theme without warning.

The trade-off: **two token tiers is indirection**. Reading `--surface-raised` means chasing its definition to know what colour it actually is. That's the price of theming, and it's only justified because there really are two themes here.

Laying down the scales before designing the pages is upfront work, and it will take discipline to resist adding an off-scale value "just for this one case". Every exception added drags the system back toward its current state.

Custom properties aren't typed: nothing stops you writing a non-existent `var(--space-99)`. CSS linting won't catch it; only the eye will.

An opening ratio means the hierarchy is **tighter on mobile (3.00×) than on desktop (4.22×)**. That is an accepted trade-off, not a regression: a 4.22× ratio at 360 px would put the hero at 67.6 px inside 312 px of usable width, which is typographically wrong for a name as long as "Stéphane Lieumont". The floor of 3× is what guarantees the mobile hierarchy still beats the current site's _desktop_ figure of 1.7×.

Fixing the section themes costs the visitor's stated OS preference on two of the four pages. For an interface that would be the wrong call; for a portfolio whose light/dark split _is_ the staging, it is the right one.

## Alternatives considered

**Sass with variables and mixins** — the current site's approach, and Stéphane knows Sass. Rejected because Sass variables are resolved at compile time: they can't be redefined at runtime, so they can't support a theme switch without duplicating rules. That's exactly why the current dark theme is written by hand.

**Tailwind CSS** — consistency guaranteed by construction, and genuinely fast. Rejected because a 3D artist's portfolio needs bespoke layouts rather than a utility grammar, and because the design is a selling point here: starting from a generic system of scales only to contradict it later costs more than setting your own scales.

**A component framework (Angular Material)** — tokens, themes and accessibility provided. Rejected for the same reason as in ADR-0007: a creative portfolio can't look like an enterprise application.

**Carrying on without a system, just more rigorously** — that's what produced eleven font sizes and four radii. Rigour alone doesn't survive several years of one-off tweaks.
