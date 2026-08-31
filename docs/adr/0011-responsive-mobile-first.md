# ADR-0011 — Mobile-first responsive, with no dependency on hover

- **Status**: Accepted
- **Date**: 2026-08-31

## Context

Stéphane asked for "flawless responsive". The audit of the current site showed the problem isn't cosmetic: **whole features disappear on mobile**.

The site is built desktop-first, with four `max-width` breakpoints (1200, 960, 680, 460 px), one of which — 1200 px — holds a single rule. The measured consequences:

The **Contact** and **My CV** buttons go to `display: none` below 1200 px. The burger menu, the only remaining entry point, contains only Home, Developer and 3D Graphics — **no Contact link**. On mobile, contact is therefore reachable only through the hero button on the home page. On a site whose purpose is to get contacted, that's the most serious regression of all.

On mobile, `body` goes to 16 px while `.display1`, `h2` and `h3` drop to 19.2 px: the hierarchy collapses from 1.7× to **1.2×**. Section headings end up barely larger than body copy.

The decorative triangle covers the home page `<h2>` and the Specialties section heading. The fixed social sidebar overlaps the content and runs over the "Node.js" label. The main navigation stays trapped in a burger **even at 1920 px**.

## Decision

**Mobile-first.** Base styles apply to the smallest screen; `min-width` media queries add complexity as space allows. No `max-width` rules for layout.

**Breakpoints are dictated by the content**, not by device sizes: we widen when a line of text exceeds its readable length, or when a grid can take one more column. They are named and live in the tokens.

**No feature is removed based on width.** Whatever is reachable on desktop is reachable on mobile; only the presentation changes. Concretely, access to Contact and the CV exists at every size, and the main navigation is **visible without a burger as soon as there's room** — a collapsed menu on a 1920 px screen is a choice with no justification.

**No information is carried by hover alone** (see ADR-0010). Hover effects are gated behind `@media (hover: hover) and (pointer: fine)` and add nothing but polish.

**The typographic hierarchy never inverts.** Fluid `clamp()` sizes replace per-breakpoint overrides: the ratio between headings and body is monotonic across the entire width range. Where this meets the scale defined in ADR-0009, **monotonicity is the rule that wins** — the ratio opens as the viewport widens, it never narrows.

**Decorative elements never cover text.** They are `aria-hidden`, non-focusable, and give way rather than overlap. The fixed social sidebar rejoins the document flow once it no longer has room to sit in the margin.

Layouts use modern logical units: `dvh` rather than `vh` for viewport heights, `min()`/`max()`/`clamp()` rather than overrides, `grid` with `minmax()` rather than percentage `flex-basis`.

## Verification

Unit tests don't detect an overlap. Verification is therefore explicit:

- Every page is checked at **360, 768, 1024, 1440 and 1920 px** before it counts as done.
- **No horizontal overflow** at any width — this is automatically verifiable (`scrollWidth > clientWidth`) and the check is built into the tests.
- Every journey is tested **with a finger as much as with a mouse**, asking: does this information exist without hover?

## Consequences

The site stops losing features depending on screen size. For a portfolio whose purpose is contact, that's the fix with the most value.

Mobile-first forces content prioritisation: anything that doesn't fit in 360 px of width has to justify itself. That constraint tends to improve the desktop version too.

Fluid sizes eliminate the class of bug where two breakpoints contradict each other — the one producing today's hierarchy inversion.

The trade-off: `clamp()` is harder to reason about than a fixed value per step. You can no longer read a size from the code without doing arithmetic, and a badly bounded fluid scale produces tiny or enormous text at the extremes. Every `clamp()` must be explicitly bounded and checked at both ends.

Dropping the burger on large screens requires a navigation bar that fits across the width with French labels, which are longer than their English equivalents.

Checking five widths per page is a real manual burden that automation only partly covers: overflow can be tested, a decorative element sitting on top of a heading has to be seen.

## Alternatives considered

**Keeping the desktop-first approach and fixing the bugs** — less rewriting. Rejected because the defects found aren't isolated bugs but a consequence of the method: when you start from desktop, mobile becomes a subtraction, and you end up subtracting features. The `display: none` on the Contact buttons is the exact illustration.

**A responsive CSS framework (Bootstrap, Tailwind)** — grid and breakpoints provided. Rejected for the reasons in ADR-0009: the design is bespoke, and a generic grid would fight the layouts we want.

**A separate mobile version** — a 2010s approach, rejected: two codebases to maintain, and that's precisely how the two drift until one of them loses features.

**Automated visual regression testing (compared screenshots)** — the most thorough verification, and tempting. Rejected for now: on a site whose design moves with every iteration, reference screenshots become noise to maintain. Worth revisiting once the design settles.
