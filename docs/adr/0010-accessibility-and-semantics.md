# ADR-0010 — HTML semantics and WCAG 2.2 AA accessibility, enforced in CI

- **Status**: Accepted
- **Date**: 2026-08-31

## Context

Stéphane set an explicit requirement: "the semantics must be beyond reproach". He picked **WCAG 2.2 level AA** as the target.

On a developer's portfolio, accessibility isn't only a moral or legal obligation: **the site is a demonstration of skill**. A technical recruiter who opens devtools and finds a broken heading structure or buttons with no accessible name draws an immediate conclusion about the candidate.

The audit of the current site turned up three failures that cost real visitors real information:

Each project card's title, stack and year live only in a `:hover` state, and **there is no `@media (hover:hover)` anywhere in the CSS**. On a touch device, the Work section is six anonymous screenshots in a row, and the 3D gallery sixteen unlabelled tiles. It's the site's most expensive defect.

The hovered state of buttons switches to a peach background with orange text, roughly **2:1 contrast**: hover is _less_ legible than rest. That's a contrast failure, and it inverts what an active state is supposed to do.

There is **no `prefers-reduced-motion`** at all, on a heavily animated site with cascades running up to 2.4 seconds.

## Decision

Target: **WCAG 2.2 level AA**, verified automatically and enforced as blocking.

### Semantics

HTML carries the meaning; ARIA only covers what HTML can't express. A `<div>` with a click handler is never a button.

One heading structure per page, no skipped levels, a single `<h1>`. Regions use the native landmark elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>` with an accessible name). A list of projects is a list. A link navigates, a button acts.

### Hard rules

- **No editorial information reachable only on hover.** A project's title, technologies and year are visible at rest, on every device. Hover effects enrich; they don't reveal.
- **Every interactive state keeps AA contrast**, hover and focus included. A state never degrades legibility.
- **Visible, sufficiently contrasted focus on every interactive element.** No `outline` is removed without a replacement at least as legible.
- **Touch targets of at least 44 × 44 px** — the current buttons are 34 px tall, and 32 px on mobile.
- **`prefers-reduced-motion` respected everywhere**, with a reduced version that is usable and not degraded.
- **Real alternative text on every media item.** On 3D renders, the alternative describes the image; it doesn't repeat the title.
- Full keyboard navigation, in a logical order, with a skip link to the main content.
- The contact form has associated `<label>`s, and errors that are announced and tied to their field.

### Verification

Three levels, all **blocking in CI**:

1. **`angular-eslint` with `templateAccessibility`**, already enabled in `apps/web/eslint.config.mjs`. Catches structural failures as they're written.
2. **`axe-core` in the unit tests** of every page component, with zero tolerated violations.
3. **Lighthouse CI** on the prerendered pages, requiring an **accessibility score of 100**.

Colour token contrast is checked in both themes when the tokens are defined, not after the fact on the components.

## Consequences

The site becomes evidence of the technical seriousness it claims — the argument cuts both ways, and a failure here turns against its author.

Making project information visible at rest changes the design of the cards: it has to be given real space rather than relying on hover to reveal it. That's a design constraint, and it improves the site for everyone — including on desktop, where the user no longer has to hover six cards to find out which one interests them.

Automated checks catch regressions, which human review does not do reliably over time.

The trade-off, to be clear-eyed about it: **automated tooling covers only part of the WCAG criteria**. axe-core detects on the order of half the real problems. A Lighthouse score of 100 doesn't prove accessibility; it proves the absence of detectable errors. The criteria that matter most — whether an alt text is apt, whether the tab order is logical, whether an error message is clear — need human judgement. The CI threshold is a floor, not a certificate.

Lighthouse CI adds a slow step to the pipeline and can produce unstable results from run to run on performance metrics. Only the accessibility score, which is deterministic, is made blocking.

The 44 px touch target rule rules out the thin, elegant buttons of the current site. That's a trade-off knowingly made in favour of usability.

## Alternatives considered

**Good practices with no numeric threshold** — more flexible, and it's what most portfolios do. Rejected because nothing then guards against regression: with no blocking threshold, quality erodes across successive tweaks without anyone noticing. That's how the current site ended up with its content locked inside `:hover`.

**AA plus a formal, documented RGAA audit** — same technical base, with a publishable audit grid. Rejected for now: it's a substantial documentation effort, justified if Stéphane wants to sell accessibility as a skill, which isn't the site's stated goal. Still open for later.

**Targeting AAA** — rejected because some AAA criteria (7:1 contrast in particular) would collide head-on with the orange-on-light visual identity, for marginal benefit on this kind of site.

**Manual screen reader testing only** — indispensable as a complement, but it doesn't run on every commit. It catches what automation misses, not the other way round.
