# Traps

Bugs this project has already paid for. Every one of them typechecked, linted
and passed review by reading the code — and was wrong. Each entry is the
symptom, the cause, and how it was actually found.

Read this before debugging anything visual. Several of these recurred because
the lesson was not written down the first time.

---

## Angular scopes away global-state selectors

**Symptom.** A rule keyed on document state — `:root[data-menu='open']`,
`:root[data-ready]` — never applies. No error, no warning. `animation-name`
computes to `none`.

**Cause.** Emulated view encapsulation rewrites component selectors to match
that component's elements. `:root` is not one of them, so the rule matches
nothing.

**Fix.** Global-state rules live in `src/styles/`, never in a component
stylesheet. See `_menu-state.scss` and `_home-entrance.scss`.

**Cost.** Hit twice — the menu recession, then the home entrance — because the
first fix was applied without recording why.

---

## `transition` is a shorthand and resets what it does not name

**Symptom.** The split's hover zoom "snapped back" instead of easing. Reported
four times. Three attempts at lengthening the duration and reshaping the curve
changed nothing.

**Cause.** The rule for the half the pointer had just left declared
`transition: opacity …`, which reset `transition-property` and dropped `scale`
entirely. The scale went 1.09 → 1 in one frame. On a split that fills the
screen that rule matches almost every exit — there is nowhere neutral to leave
to.

**Fix.** Every rule that touches `transition` restates _all_ the properties in
play, or uses longhands.

**How it was found.** By sampling `getComputedStyle(el).scale` every 280ms
across a real pointer exit and seeing 1.09 → `none` in the first sample. Not by
reading the CSS, which looked correct four times.

---

## Percentages in `clip-path` resolve against the element's own box

**Symptom.** "Le texte semble trop écrasé." Two rounds of opening the leading
did nothing.

**Cause.** `--split-top: 46%` inside a panel's `clip-path` resolves against
that panel's content box, not the viewport. The two panels had different
widths, so the usable text column came out 520px on one side and 241px on the
other.

**Fix.** A separate token in viewport units (`--split-usable`) for anything
that must agree across both panels.

---

## `grid-column: span 2` does not clamp on a one-column grid

**Symptom.** Every unfeatured gallery tile had ~100px of dead space beside it
on mobile.

**Cause.** Spanning past the explicit grid creates an _implicit_ column sized
to whatever is left. Measured: `grid-template-columns` computed to
`224px 84px`.

**Fix.** Gate the span behind the breakpoint that actually provides two
columns.

---

## `transform-origin: center` resolves against the whole document

**Symptom.** The menu's recession converged to a point below the fold.

**Fix.** Pin the origin to the viewport centre from the scroll position
(`--menu-origin-y`).

---

## A zero-duration animation does not reliably apply its filled end state

**Symptom.** The loader's CSS failsafe — `animation: … 0s linear 4s forwards` —
left the overlay opaque past its deadline. The one failure mode that rule
exists to prevent.

**Fix.** A real duration (400ms). Verified by driving the animation's
`currentTime`: opaque at 3999ms, hidden at 4400ms.

---

## An attribute selector outranks any single class

**Symptom.** A grey rectangle behind a transparent GIF. The GIF was blamed
first; its corners sample at alpha 0.

**Cause.** A reset rule `img[width][height] { background: … }` has specificity
(0,2,1) and beats every class trying to remove it.

---

## A bezier with a control point at y=1 leaves at full speed

**Symptom.** A release meant to be gentle that "snapped".

**Cause.** `cubic-bezier(0.16, 1, 0.3, 1)` — the shape everyone reaches for —
covers **28% of its distance in the first 5% of the time** and 49% in the
first 10%. Lengthening it only stretches the crawl after the jolt.

**Fix.** `cubic-bezier(0.45, 0, 0.25, 1)`: 2% in the same window. Get the shape
right before touching the duration.

---

## `requestAnimationFrame` never fires in a hidden tab

**Symptom.** Every browser eval containing `await new Promise(r =>
requestAnimationFrame(r))` timed out with "the renderer may be frozen".

**Cause.** The verification browser was not on screen —
`document.visibilityState === 'hidden'`. rAF is throttled to nothing.

**Consequence.** A working feature was diagnosed as a performance failure and
reverted, then restored. **Check `document.visibilityState` before concluding
anything about performance**, and prefer synchronous reads of
`getComputedStyle` over anything awaiting a frame.

---

## A barrel re-export drags server dependencies into the browser

**Symptom.** Zod in the web bundle, to render a chip.

**Fix.** `@portfolio/shared-types/registries` is a separate entry point with no
Zod import. Schemas live next to the entities that use them.

---

## Method

- **Measure, do not read.** Every bug above survived a careful reading of the
  code. All were found by querying the live DOM.
- **A premise repeated is not a premise verified.** "The site is dark" survived
  three documents before a screenshot disproved it. The site is light.
- **A decision recorded is not a thing built.** ADR-0008 settled on
  prerendering; it stayed unbuilt for weeks behind a comment claiming the site
  was prerendered. See `.claude/runtime/`.
- **Never invent an identifier.** An ArtStation URL was guessed into
  `contact.html` and shipped wrong. If it is a real address, a real name, or a
  real date, it comes from a source or it is asked for.
