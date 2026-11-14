# ADR-0014 — Worlds are routes; the diagonal sweep is the route transition

- **Status**: Accepted
- **Date**: 2026-11-14
- **Amends**: spec 07 §9.1–9.3 (route transitions) for navigation between the worlds and contact

## Context

The world pages were redesigned on a mockup approved with Stéphane on 2026-11-14 (artifact « Bascule Dev / 3D »). In it, the developer and 3D worlds share one page skeleton and swap through a toggle: a diagonal band at the home split's angle sweeps across the viewport, the palette and content change under the cover, and the page lands at the top. The contact page enters and leaves the same way, in ink.

The mockup did this on a single document with `#developpement`, `#graphisme-3d` and `#contact`. Taken literally into production, that would undo three settled decisions: prerendering one HTML file per route (ADR-0008), a `<title>`, description and Open Graph card per page, and shareable addresses per section and per piece (spec 01). The site already has `/developpeur`, `/graphisme-3d` and `/contact`.

Stéphane chose on 2026-11-14 to keep one route per world and to keep the home split at `/` as the entry.

## Decision

- **A world is a route.** `/developpeur` is the developer world, `/graphisme-3d` the 3D world, `/contact` the contact view. The world switch in the header is navigation: links with `aria-current="page"`, not toggle buttons.
- **The sweep is a route transition**, built on the router's View Transitions integration (`withViewTransitions`). A handler classifies each navigation from its source and target URLs and stamps the type on the document (`data-vt`): a sweep in the target world's ground between the two worlds, a wipe in ink to and from contact, a morph from a mosaic tile to its piece, and no transition otherwise. The two phases of the mockup — cover, then reveal — are keyframes on `::view-transition-old(root)` and `::view-transition-new(root)` with a gap between them, so the band is the transition's own background.
- **Every new navigation lands at the top, invisibly.** The jump happens after the old snapshot is captured and before the new one is shown, so the visitor never sees the page scroll. With smooth scrolling active it bypasses easing (ADR-0013). **Back and forward restore the scroll position** the visitor left, as the browser does by default; and closing the 3D viewer returns to its tile (spec 01, spec 07 §9.4).
- **Reduced motion** replaces the sweep with a short crossfade; the jump to the top happens while the page is faded out.
- **Each world's palette is global state**: the active world is stamped on the root (`:root[data-world]`), and every rule keyed on it, like every `::view-transition-*` rule, lives in `src/styles/`. Component stylesheets cannot reach either (traps.md, « Angular scopes away global-state selectors »).
- **Content reaches a page through a resolver**, so a page enters complete under the reveal instead of showing a loading state behind it.

## Consequences

The site keeps everything ADR-0008 and spec 01 bought: one prerendered file per world with its own metadata, real addresses, working back and forward buttons, and a full page on direct load. The world switch is an ordinary link, so it works without JavaScript and in a new tab.

The transition is declarative and owned by the browser: no overlay element to keep in sync with the router, no deferred navigation, no special case for a cancelled navigation.

Accepted downsides:

- **The page is frozen during the transition.** The old page is a screenshot, and clicks are swallowed for the whole transition: the mockup's cover takes 640 ms and the reveal as long again, about 1.3 s in all. That is well above spec 07 §9's cap of 510 ms for route transitions, which this ADR lifts for world changes only; every other route keeps §9's crossfade. The header could stay live above the sweep with its own `view-transition-name`; that is left to the shell PR.
- **It overrides a frozen spec.** Spec 07 §9 settled route transitions as a tuned crossfade with a theme-crossing rise/fall. The sweep replaces it between the worlds because Stéphane approved it on the mockup; spec 07 now points here (§15).
- **Browser support.** Where same-document View Transitions are unavailable, navigation is instant, with no sweep. The site stays correct, it just loses the signature moment.
- **The point cloud is two component instances.** Its morph from `</>` to torus has to continue across a route change, so the shape and points live in a root-level state the two instances share, rather than in the component.
- **Global-state CSS grows.** Transition and world-palette rules sit outside the components they style, which is the price of rules that key on the document.
- **The mockup's « scroll is preserved » behaviour is gone on purpose.** Every page change starts at the top, which Stéphane asked for.

## Alternatives considered

**A single page switching on the hash, as in the mockup** — the fastest port. Rejected: it breaks prerendering per route, per-page metadata and shareable addresses, three things already decided for the site's primary goal of being found and shared (ADR-0008, spec 01).

**A custom overlay driven by Router events** — full control over timing, the header stays clickable. Rejected: covering before the new route renders means deferring navigation (a `canDeactivate` that resolves after the cover) and handling cancelled and redirected navigations by hand, which is more code and more failure modes than the browser's own transition.

**No transition between worlds** — simplest and universally supported. Rejected: the diagonal is the design's signature, shared with the home split and the 3D lightbox, and it is what Stéphane approved.
