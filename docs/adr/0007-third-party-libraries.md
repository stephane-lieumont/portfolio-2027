# ADR-0007 — Policy on third-party libraries

- **Status**: Accepted
- **Date**: 2026-08-30

## Context

Stéphane set a clear rule: when a piece of work is **tedious to build by hand**, look for a library rather than reinvent it. He names three cases — the **image gallery**, the **full-width carousel**, and **sending contact emails**.

Those three have something in common: they're solved problems with non-obvious pitfalls. A "simple" gallery has to handle the keyboard, focus trapping inside the lightbox, touch zoom, preloading, screen reader announcements. A hand-rolled carousel almost always ends up inaccessible. Sending email straight from the front end exposes a key.

Conversely, stacking up dependencies has a real cost on a showcase site: every kilobyte delays the 3D renders, which are the actual content.

## Decision

A library gets added when it satisfies **all** of the following criteria:

1. The problem is tedious **or** riddled with accessibility pitfalls.
2. The library is maintained, compatible with Angular 22 zoneless, and free of any `zone.js` dependency.
3. Its weight is proportionate to what it delivers, measured on the real bundle.
4. It doesn't take styling away: the design must stay drivable from our tokens.

No library is picked by default for those three needs **before the specs phase**: the choice happens once the precise requirement is settled, and is documented then in a dedicated ADR.

What is already settled:

- **Animation**: no library by default. CSS, View Transitions and Web Animations cover the need (see the `motion-design-expert` agent). GSAP, used in 2022, is not carried over without justification.
- **Forms**: Angular Reactive Forms, no wrapper.
- **HTTP requests**: `HttpClient`, no axios.
- **Validation**: Zod, already present through `@portfolio/shared-types`.

On the **contact email**, one security point outweighs convenience: **sending goes through the API, always**, never straight from the browser. The 2022 portfolio used EmailJS client-side, which exposes the service's public key to anyone who opens the sources — and therefore opens that account to spam. The form posts to the API, which validates, rate-limits, then relays. The provider key stays server-side.

## Consequences

The bundle stays under control, and every dependency present is justified in writing — someone discovering the repo can find out why it's there.

Deferring library choices until after the specs avoids installing a carousel before knowing what it has to display, then replacing it.

The trade-off: that choice will still have to be made, and it will cost evaluation time at the moment the need becomes clear. And some pieces will be written by hand where a library would have done — acceptable as long as accessibility holds.

Routing email through the API adds a route to write and protect, where EmailJS took a few client-side lines. That's the direct cost of not exposing a key, and it's accepted.

## Alternatives considered

**A full component framework (Angular Material, PrimeNG)** — everything is there, and accessible. Rejected because a 3D artist's portfolio can't look like an enterprise application: the design is a selling point here, and starting from a pre-existing visual system only to unlearn it later costs more than starting from tokens.

**Zero dependencies, everything by hand** — appealing on paper, but that's how you ship a lightbox that won't close on Escape and a carousel invisible to screen readers.

**Keeping EmailJS in the front end** — the fastest option, and exactly what this ADR refuses: a service key published in the bundle.
