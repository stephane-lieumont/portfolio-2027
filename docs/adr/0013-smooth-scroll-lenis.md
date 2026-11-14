# ADR-0013 — Inertial smooth scrolling with Lenis

- **Status**: Accepted
- **Date**: 2026-11-14
- **Amends**: ADR-0007 (animation: no library by default) and spec 07 §2 (« A library — not needed »)

## Context

The approved mockup for the world pages (artifact « Bascule Dev / 3D », reviewed with Stéphane on 2026-11-14) adds inertial smooth scrolling on top of the motion already specified: scroll-linked parallax on a background particle layer, scroll reveals, a scrubbed sentence. Stéphane asked for it in his own words: « un scroll smooth également pour fluidifier la navigation ».

ADR-0007 settled animation with no library by default: CSS, View Transitions and Web Animations. None of those can smooth wheel input. CSS `scroll-behavior: smooth` only affects programmatic and anchor scrolls, not the wheel, so the native platform has no answer for the requirement.

Hand-rolled wheel smoothing is the trap ADR-0007 warns about: intercepting `wheel`, easing a virtual position and writing it back breaks keyboard scrolling, find-in-page, anchor jumps, `position: sticky` and every IntersectionObserver unless each is handled again by hand.

The mockup was measured once, on Stéphane's machine in Chrome at a 2026px-wide window, with Lenis 1.1.13: median frame 8.3 ms, worst 15.6 ms while smooth-scrolling the whole page with the particle canvas and the point cloud running. Sticky header, sticky stage and every IntersectionObserver kept working; a nested `<textarea>` kept its native scroll with `data-lenis-prevent`. One machine and one browser prove it can be smooth, not that it is everywhere: the shell PR re-measures on the real build.

Weight, measured on the published 1.1.13 build: 13,485 bytes minified, 3,782 bytes gzipped. ADR-0007's criterion 3 asks for weight proportionate to what it delivers; 3.8 kB on the wire for wheel smoothing that keeps every native behaviour is judged proportionate here, against the ~70 kB GSAP that spec 07 §2 rejected.

## Decision

The site uses **Lenis** for wheel smoothing, under these rules:

- `lerp: 0.12`, the value Stéphane approved on the mockup — slightly firmer than Lenis's 0.1 default, so the page settles sooner after the wheel stops.
- Lenis drives the **native** scroll position (`window`); nothing is translated with transforms. Sticky positioning, observers, keyboard, find-in-page and anchors stay native.
- **Wheel only**: `smoothWheel: true`, `syncTouch: false`. Touch devices keep native momentum.
- **Off under `prefers-reduced-motion: reduce`**, and destroyed or recreated when that preference changes at runtime.
- Created only in the browser, after the first render. Prerendering (ADR-0008) never instantiates it.
- **One rAF owner**: Lenis's `raf()` is called from the same frame loop as the site's canvases, never from a second loop.
- Stopped while a modal `<dialog>` is open, restarted on `close`.
- Programmatic jumps that must stay invisible (the jump to the top under a page transition) bypass easing: `lenis.scrollTo(0, { immediate: true, force: true })`.
- Every nested scroller carries `data-lenis-prevent`.
- Installed from npm and bundled, pinned to an exact version. No CDN in production.

## Consequences

Scrolling gains the inertia the mockup was approved with, without giving up any native scrolling behaviour, and the scroll-linked motion reads off a smoothed position instead of stepping with each wheel notch.

Accepted downsides:

- **It takes over the wheel.** There is a small input latency by design (`lerp: 0.12`), and some trackpad users who rely on their OS inertia find any wheel smoothing wrong. It cannot be configured per visitor; reduced motion is the only opt-out.
- **Accessibility surface.** Forgetting `data-lenis-prevent` on a future nested scroller (a code block, a modal body, a select list) makes that scroller unusable with the wheel. This is a rule to remember on every new component, not a one-time setup.
- **It conflicts with CSS scroll features.** `scroll-behavior: smooth` must stay off (Lenis forces `auto`), and `scroll-snap` on the root would fight it. Neither is used today; adopting either later reopens this ADR.
- **3.8 kB gzipped** added to the bundle, on a site where every kilobyte delays the renders (ADR-0007 criterion 3). It is loaded lazily after the first render, so it does not delay the first paint, but it is downloaded on every visit that does not ask for reduced motion.
- **A permanent frame loop.** Smoothing needs `raf()` every frame while the page is visible, where spec 07 §2 had the scroll work as one IntersectionObserver and no loop at all. The loop is shared with the canvases and stops when the tab is hidden, but it is a standing cost on battery and CPU that the previous design did not have.
- **Zoneless wiring is ours.** Lenis knows nothing of Angular; its lifecycle (browser-only creation, destroy, reduced-motion changes, dialog stop/start) is application code to test and maintain.

## Alternatives considered

**Native scrolling only** — zero cost and zero risk, and what the site did until the mockup. Rejected because Stéphane explicitly asked for smoothed navigation, and the scroll-linked motion he approved reads noticeably stepped on wheel notches without it.

**Hand-rolled wheel smoothing** — no dependency. Rejected for the reasons in Context: re-implementing what Lenis already gets right (native position, keyboard, find-in-page, sticky) is exactly the inaccessible hand-rolled widget ADR-0007 exists to prevent.

**Transform-based smooth scrollers (Locomotive Scroll v4, GSAP ScrollSmoother)** — the content is wrapped and translated instead of scrolled. Rejected: sticky elements and observers break or need proxies, native find-in-page lands in the wrong place, and GSAP ScrollSmoother is a paid plugin on top of a library ADR-0007 already declined.
