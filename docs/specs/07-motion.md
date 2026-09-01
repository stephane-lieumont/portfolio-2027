# Spec 07 — Motion

This document sets the motion of the site: every duration, every curve, every distance, and the mechanism each animation is built on. It is the motion counterpart of spec 06 — same two token tiers, same rule that components consume semantics and never literals.

**It is a recalibration, not a rewrite.** Stéphane's instruction on 2026-08-31: _« conserve les animations que j'avais précédemment intégrées car la navigation était cool. À toi de voir avec l'expert design si on ne peut pas le travailler un peu plus. »_ The audit reached the same conclusion independently — motion is "the most crafted part of the site, to recalibrate, not to remove". So the gestures of the current site are the starting material. What changes is their timing, the properties they animate, and what happens when the visitor has asked for less of it.

**What it freezes.** The duration and easing scales, the asymmetry rule, the cascade caps, the reveal mechanism, the off-canvas navigation, the home entrance and its background video, hover/focus/press timing, route transitions, and the `prefers-reduced-motion` variant of every one of them.

**What it leaves open.** Layout composition (spec 02) and the exact copy of any label quoted here (spec 05). Colour is spec 06's: `--scrim` and `--hero-scrim` are declared there (§3.5, §9.2) and this document only consumes them.

> Interface labels quoted here stay in French. Everything else, token names included, is English.

**Every number here is justified where it appears, and every external claim is attributed.** A duration without a reason is an arbitrary duration, and this site has 29 of those today.

---

## 1. Philosophy

**The images are the product; the interface is the frame.** Motion directs the eye toward a render, says where a page went, and confirms that a control was pressed. It is never the thing being looked at, and on a portfolio gratuitous animation reads as compensation.

**Motion is a cost paid by the visitor in time.** Every millisecond of animation is a millisecond in which the content is not fully available — affordable when the movement carries meaning, indefensible otherwise. The current hero takes **1200 ms** to assemble itself, and the visitor learns nothing during them.

**The reduced variant is a design, not a fallback.** `prefers-reduced-motion` is a real need, and the version it produces must be a considered version of the site, not the site with its animations deleted (ADR-0010).

---

## 2. Technique ladder

ADR-0007 sets the order of preference and this document holds to it.

| Tier | Technique                      | Used here for                                                                                                                                                               |
| ---- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | CSS `transition`               | Every hover, focus and press state. Every reversible state change. **The scroll reveal** (§4) — it is a class toggle, so it is a transition.                                |
| 1    | CSS `@keyframes`               | One-shot motion that is not a state change: the home curtain, the hook rise, the carousel bar, the submit spinner, the view-transition pseudos.                             |
| 1    | `@starting-style`              | Elements that enter the DOM and must animate from a defined start without a class toggle or a double `requestAnimationFrame`: form field errors and the confirmation block. |
| 1    | `animation-timeline: scroll()` | Decorative SVG parallax only (§10.3), behind `@supports`. **Rejected for content reveals** — see §4.1.                                                                      |
| 2    | View Transitions API           | Route changes and the 3D lightbox opening from its tile (§9). `withViewTransitions()` is already provided in `app.config.ts`.                                               |
| 3    | Web Animations API             | **Exactly one use: the off-canvas panel open/close** (§6.4), because a CSS transition cannot reverse in the time it has already spent.                                      |
| 4    | A library                      | **Not needed.** No animation library is added, and GSAP is not carried over.                                                                                                |

**On libraries, once, so it is not re-litigated:** GSAP's value on the 2022 site was timeline sequencing and a scroll plugin; the sequencing here is four staged offsets in CSS and the scroll work is one `IntersectionObserver` plus one `scroll()` timeline. A ~70 kB dependency to replace roughly forty lines fails ADR-0007's criterion 3.

**Two tier-1 features have no fallback and need none.** Where `@starting-style` is unsupported the element appears at its final value with no animation; where `view-transition-name` is unsupported the property is dropped and the route change is a plain swap. Both degrade to _no animation_, never to _no content_, so neither needs an `@supports` guard. `animation-timeline` is the exception and it does need one — see §10.3, where the failure mode is not benign.

---

## 3. Tokens

Two tiers, per ADR-0009 and spec 06 §1. **Primitives name values, semantics name roles, and no component writes a literal duration, curve, distance or scale factor.** A component with `transition: 200ms` in it is the same category of mistake as one with `#f2a154` in it.

### 3.1 Duration primitives — a √2 ladder

Six steps, anchored at **180 ms**, ratio **√2**, rounded to 5 ms.

√2 is the f-stop ratio: one step is a clearly perceptible change in speed without being a different animation, two steps is a doubling. That gives enough resolution to express "a shade quicker" and enough spread to express "this is a different kind of movement", in six values instead of the current site's eighteen distinct durations.

| Token            | Value   | Position     | Rationale                                                                                                      |
| ---------------- | ------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| `--duration-90`  | `90ms`  | anchor ÷ 2   | 5.4 frames at 60 fps. The floor: below this a transition stops reading as a transition and reads as a repaint. |
| `--duration-125` | `125ms` | anchor ÷ √2  | Leaving a hover state, and the menu items' head start (§6.3). 7.5 frames.                                      |
| `--duration-180` | `180ms` | **anchor**   | The standard state change.                                                                                     |
| `--duration-255` | `255ms` | anchor × √2  | An element entering with travel.                                                                               |
| `--duration-360` | `360ms` | anchor × 2   | A full-height surface crossing the viewport, and the lightbox rect morph.                                      |
| `--duration-510` | `510ms` | anchor × 2√2 | The two moves that sweep the whole viewport: the home curtain and the poster→video substitution.               |

The one duration outside the ladder is `--slide-interval` (§3.3): it is a dwell time, not a transition, so the ladder does not apply to it.

### 3.2 Easing primitives

Four curves, plus `linear`, which has two consumers.

| Token              | Value                              | Shape                                                                                                                    |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--ease-enter`     | `cubic-bezier(0.33, 0.7, 0.35, 1)` | Moderate deceleration. **76.3 % of the distance at 38 % of the duration.** Finite initial slope, so it reverses cleanly. |
| `--ease-exit`      | `cubic-bezier(0.6, 0, 0.85, 0.4)`  | Acceleration out. **13.7 % of the distance at 51 % of the duration.** The element is released, then leaves.              |
| `--ease-state`     | `cubic-bezier(0.4, 0.15, 0.3, 1)`  | Gentle in-out. For changes with no travel — a fill, a border, an elevation. No arrival to sell.                          |
| `--ease-signature` | `cubic-bezier(0, 0.43, 0.16, 1)`   | **Kept from the current site.** See below.                                                                               |
| `--ease-linear`    | `linear`                           | Two consumers: the carousel progress bar (§10.4) and the decorative scroll drift (§10.3).                                |

**Judgement on `cubic-bezier(0, .43, .16, 1)` — keep it, name it, fence it.**

Sampled numerically: **40.5 % of the distance in 5.7 % of the duration**, **66.1 % in 18.5 %**, **86.3 % in 41 %**, and the final third travels the last 3.6 %. That is a critically-damped settle — a mass arriving and stopping without overshoot. It is why the current site's staged moments feel deliberate rather than scripted.

Its one real property, which is also its constraint: **the first control point sits at x = 0, so the initial slope is unbounded.** The animation starts at maximum velocity. Visually that is fine — the browser samples at the frame boundary — but the curve cannot be interrupted or reversed gracefully: by a third of the way through, 86 % of the distance is spent, and a reversal from there looks dead.

**So `--ease-signature` is allowed only on one-way, non-interruptible moves** — the home curtain and the hook rise, nothing else. It is forbidden on anything a visitor can reverse mid-flight, which is why the off-canvas panel uses `--ease-enter`.

**On linear.** Linear easing is normally the giveaway of unconsidered animation. The exception is when the animated value _is_ time or position. The carousel bar maps elapsed seconds to width; the decorative drift maps scroll offset to translation. Easing either would make it lie about its own input. Nothing else on this site is linear.

### 3.3 Distance, stagger, scale and interval primitives

| Token                 | Value    | px  | Rationale                                                                                                                                                                                          |
| --------------------- | -------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--motion-rise`       | `1rem`   | 16  | Reveal travel for a single block. Enough to carry direction, small enough that the element never reads as flying in. Current site: 20 / 30 / 15 px, unrelated.                                     |
| `--motion-rise-tight` | `0.5rem` | 8   | Reveal travel for members of a grid. Sixteen tiles each moving 16 px is sixteen simultaneous vectors; halving the distance halves the noise and keeps the cue.                                     |
| `--motion-slide`      | `4rem`   | 64  | Own-axis offset for a menu item inside the moving panel. **Provisional — see §14 item 1.**                                                                                                         |
| `--motion-lift`       | `2px`    | 2   | Card hover lift. `--elevation-2` already implies 8–16 px of implied height; the lift is the parallax cue, not the effect. Beyond 3 px a card's text visibly breaks alignment with its neighbours'. |
| `--motion-press`      | `1px`    | 1   | `:active` displacement. Spec 06 §3.4 requires the pressed feeling to come from elevation and a 1 px translate rather than a value change that would drag contrast down.                            |
| `--stagger-list`      | `60ms`   | —   | Vertical lists of a few items (menu, hero hook). Chosen against the two caps below, not against a perception threshold: 60 × 4 = 240 ms, exactly Cap A.                                            |
| `--stagger-grid`      | `40ms`   | —   | Grids of many items. 40 × 6 = 240 ms, exactly Cap A.                                                                                                                                               |
| `--stagger-cap-list`  | `4`      | —   | Highest multiplier for a list cascade. Members 1–5 cascade; a sixth shares the fifth's delay. §5.                                                                                                  |
| `--stagger-cap-grid`  | `6`      | —   | Highest multiplier for a grid cascade. Members 1–7 cascade; an eighth shares the seventh's delay. §5.                                                                                              |
| `--shell-scale`       | `0.92`   | —   | Page recession while the off-canvas menu is open. §6.2.                                                                                                                                            |
| `--zoom-media`        | `1.04`   | —   | Media hover zoom. §10.2.                                                                                                                                                                           |
| `--zoom-icon`         | `1.08`   | —   | Social icon hover scale. §10.2. A primitive rather than a literal so `prefers-reduced-motion` can reach it (§11.1).                                                                                |
| `--slide-interval`    | `7s`     | —   | Carousel dwell per slide. A caption plus an image needs more than a glance; 7 s is comfortably past the 5 s threshold in WCAG 2.2.2, which is exactly why §10.4 ships a pause control.             |

### 3.4 Semantic tokens — the only layer components read

| Semantic              | Primitive        | ms  | Job                                                     | Its exit              |
| --------------------- | ---------------- | --- | ------------------------------------------------------- | --------------------- |
| `--motion-press-dur`  | `--duration-90`  | 90  | `:active` feedback                                      | symmetric             |
| `--motion-exit-state` | `--duration-125` | 125 | Leaving a hover state                                   | —                     |
| `--motion-lead`       | `--duration-125` | 125 | Head start before a staged group begins (§6.3, §8.6)    | —                     |
| `--motion-state`      | `--duration-180` | 180 | Entering a hover or focus state on a control            | `--motion-exit-state` |
| `--motion-exit`       | `--duration-180` | 180 | An element leaving the screen                           | —                     |
| `--motion-enter`      | `--duration-255` | 255 | An element entering the screen                          | `--motion-exit`       |
| `--motion-page`       | `--duration-255` | 255 | The incoming route view                                 | `--motion-exit-state` |
| `--motion-dismiss`    | `--duration-180` | 180 | A full-height surface being dismissed                   | —                     |
| `--motion-panel`      | `--duration-360` | 360 | A full-height surface entering; the lightbox rect morph | `--motion-dismiss`    |
| `--motion-curtain`    | `--duration-510` | 510 | The home entrance. Once per page load.                  | —                     |
| `--motion-media-swap` | `--duration-510` | 510 | Poster → video substitution in the hero                 | —                     |

### 3.5 The declaration

```css
:root {
  /* ---- Duration primitives — √2 ladder anchored at 180ms ---------------- */
  --duration-90: 90ms;
  --duration-125: 125ms;
  --duration-180: 180ms;
  --duration-255: 255ms;
  --duration-360: 360ms;
  --duration-510: 510ms;

  /* ---- Easing primitives ------------------------------------------------ */
  --ease-enter: cubic-bezier(0.33, 0.7, 0.35, 1);
  --ease-exit: cubic-bezier(0.6, 0, 0.85, 0.4);
  --ease-state: cubic-bezier(0.4, 0.15, 0.3, 1);
  --ease-signature: cubic-bezier(0, 0.43, 0.16, 1);
  --ease-linear: linear;

  /* ---- Distance, stagger, scale, interval ------------------------------- */
  --motion-rise: 1rem;
  --motion-rise-tight: 0.5rem;
  --motion-slide: 4rem;
  --motion-lift: 2px;
  --motion-press: 1px;
  --stagger-list: 60ms;
  --stagger-grid: 40ms;
  --stagger-cap-list: 4;
  --stagger-cap-grid: 6;
  --shell-scale: 0.92;
  --zoom-media: 1.04;
  --zoom-icon: 1.08;
  --slide-interval: 7s;

  /* ---- Semantics — the only layer components read ------------------------ */
  --motion-press-dur: var(--duration-90);
  --motion-exit-state: var(--duration-125);
  --motion-lead: var(--duration-125);
  --motion-state: var(--duration-180);
  --motion-exit: var(--duration-180);
  --motion-enter: var(--duration-255);
  --motion-page: var(--duration-255);
  --motion-dismiss: var(--duration-180);
  --motion-panel: var(--duration-360);
  --motion-curtain: var(--duration-510);
  --motion-media-swap: var(--duration-510);
}
```

### 3.6 Two standing rules on properties

**Only `transform`, `translate`, `scale`, `rotate`, `opacity` and `visibility` are animated by default.** `width`, `height`, `top`, `left`, `flex-basis`, `margin` and `padding` trigger layout on every frame. The current home entrance animates `flex-basis` — that is the exact anti-pattern, and §8.6 replaces it.

Three properties are allowed **by exception**, each named individually: `background-color`, `border-color`, `box-shadow`. They are not compositor-safe — every frame of an elevation or fill interpolation is a repaint of the element's box. They are allowed because spec 06 §10 requires them for state changes and because the boxes involved are small and short-lived. That is a trade, not a free pass, and it is the reason no fourth paint property joins the list.

`color` is never transitioned — spec 06 §10 gives the reason and it is a contrast reason: a 180 ms ramp between two compliant inks passes through inks that were never measured.

**Prefer the independent `translate` / `scale` / `rotate` properties over the `transform` shorthand.** They compose instead of overwriting. A card that has both a reveal rise and a hover lift needs two independent Y offsets on the same element, and with `transform` the second silently cancels the first. That collision exists on the current site by construction. `transform` stays only where a single composite is wanted and ordering matters (the burger bars, §6.3).

---

## 4. The reveal system

The current `.reveal` — `opacity: 0; transform: translateY(20px); transition: all .4s ease-out` with `.reveal--0…N` classes and a 200 ms step — is replaced by one directive, one service and one pair of classes. It is a **transition**, driven by a class toggle, not a keyframe animation.

### 4.1 Scroll-scrubbed reveals are rejected, and this is deliberate

`animation-timeline: view()` is available and it is the fashionable answer. It is wrong here.

A scroll-scrubbed animation is not played, it is **scrubbed**: its progress is the scroll position. Stop scrolling halfway through the range — which is what reading is — and the element sits permanently at 40 % opacity. Text at 40 % opacity fails AA, and ADR-0010 states that every state keeps AA contrast. This is not an edge case; it is the normal behaviour of someone reading the page.

**Content reveals are therefore time-based and one-shot, driven by `IntersectionObserver`. Scroll-scrubbed animation is reserved for decoration** (§10.3), where an element parked mid-range is `aria-hidden`, carries no information and has no contrast requirement. That line is exactly the line between content and decoration.

### 4.2 A JavaScript failure must not hide the content

The current site declares `.reveal { opacity: 0 }` in CSS. If the script never runs, the site is blank. That is unacceptable on a prerendered site (ADR-0008) whose whole point is that the HTML is complete in the first response.

Gating on a class added before first paint solves the _no-JavaScript_ case. It does not solve the worse case: **JavaScript that runs partially** — a chunk 404, a CSP that blocks the bundle, a parse error. The class is set, nothing ever adds `.is-revealed`, and a complete prerendered page renders invisible. Two nets, neither depending on hydration succeeding:

```html
<!-- end of <head> in index.html -->
<script>
  document.documentElement.classList.add('js-motion');
</script>
```

```ts
// main.ts — synchronous, before the await. Reaching this line proves the bundle loaded.
document.documentElement.classList.add('js-booted');

bootstrapApplication(App, appConfig).catch((error) => {
  document.documentElement.classList.remove('js-motion');
  throw error;
});
```

```css
.reveal {
  /* nothing: visible by default, which is what a crawler and a no-JS visitor get */
}

.js-motion .reveal {
  opacity: 0;
  translate: 0 var(--motion-rise);
}

/* Net: the bundle never executed. Everything appears at 3s, without animation. */
.js-motion:not(.js-booted) .reveal {
  animation: rise 0s linear 3s forwards;
}

.js-motion .reveal.is-revealed {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity var(--motion-enter) var(--ease-enter),
    translate var(--motion-enter) var(--ease-enter);
  transition-delay: calc(
    var(--stagger-grid) * min(var(--reveal-index, 0), var(--stagger-cap-grid))
  );
}

.js-motion .reveal--list.is-revealed {
  transition-delay: calc(
    var(--stagger-list) * min(var(--reveal-index, 0), var(--stagger-cap-list))
  );
}

.js-motion .reveal--grid {
  translate: 0 var(--motion-rise-tight);
}
```

The `.js-booted` net covers the failure modes that matter on a static prerendered site — the bundle 404s, the CSP blocks it, it fails to parse. The `.catch()` covers a throw during bootstrap. Neither covers a throw _after_ bootstrap resolves but before the directives observe; that residue is named rather than papered over, and it is small because the directives are constructed as part of the same render pass.

If a CSP with a `script-src` directive is ever added at the nginx layer (ADR-0005), the inline one-liner needs a hash or a nonce. Noted because it is the kind of thing that silently blanks a site months later.

### 4.3 The cascade service and the directive

**The cascade index is the order of arrival, not the DOM index.** This is what makes the claim in §5 true: a tile scrolled to on its own is the only entry in its `IntersectionObserver` callback, gets index 0, and reveals with no delay. A DOM index would give tile 12 a 240 ms wait for nothing. One shared observer delivers one batch per callback, so the indexing is exact rather than time-windowed.

```ts
const OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0.15,
  rootMargin: '0px 0px -10% 0px',
};

@Injectable({ providedIn: 'root' })
export class RevealCascade {
  private readonly pending = new Map<Element, (index: number) => void>();
  private readonly observer = new IntersectionObserver((entries) => {
    let index = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const reveal = this.pending.get(entry.target);
      this.release(entry.target);
      reveal?.(index++);
    }
  }, OBSERVER_OPTIONS);

  observe(element: Element, reveal: (index: number) => void): void {
    this.pending.set(element, reveal);
    this.observer.observe(element);
  }

  release(element: Element): void {
    this.pending.delete(element);
    this.observer.unobserve(element);
  }
}
```

```ts
@Directive({
  selector: '[appReveal]',
  host: {
    '[class.reveal]': 'true',
    '[class.is-revealed]': 'revealed()',
    '[style.--reveal-index]': 'index()',
  },
})
export class RevealDirective {
  readonly index = signal(0);
  readonly revealed = signal(false);

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cascade = inject(RevealCascade);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const node = this.element.nativeElement;

    if (typeof IntersectionObserver === 'undefined') {
      afterNextRender(() => this.revealed.set(true));
      return;
    }

    afterNextRender(() =>
      this.cascade.observe(node, (index) => {
        this.index.set(index);
        this.revealed.set(true);
      }),
    );

    this.destroyRef.onDestroy(() => this.cascade.release(node));
  }
}
```

`inject<ElementRef<HTMLElement>>(ElementRef)` — the type argument goes on the call, not on the token. `inject(ElementRef<HTMLElement>)` instantiates a generic in expression position and does not compile; CLAUDE.md forbids closing that with an `as`.

Signals and host bindings, no `NgZone`, no manual change detection: the observer callback writes signals and the host bindings read them.

`threshold: 0.15` with `rootMargin: -10%` means an element starts revealing once 15 % of it has crossed 10 % above the viewport's bottom edge — early enough that the movement finishes before the element is read, late enough that it is not revealing off-screen.

Reveals are one-shot: the element is released on first intersection. An element that re-animates every time it scrolls back into view is the most tiring pattern in this category.

Within a batch the entry order is the order the elements were observed, which is component construction order and therefore reading order. Nothing depends on it being guaranteed: a cascade needs a direction, not a specific member order.

---

## 5. Cascade capping

The measured problem: the hero takes **1200 ms** to compose (five elements, 200 ms step, 400 ms transition); the six project cards span **1150 ms** at a 150 ms step; the sixteenth 3D tile starts **2250 ms** after the first and settles at 2650 ms. The audit's "2.4 s" figure was one step out — sixteen elements at a 150 ms step give fifteen gaps, not sixteen.

Two numbers, both binding, both arithmetic on the tokens:

> **Cap A — the stagger span of a group never exceeds 240 ms.** `stagger × cap ≤ 240 ms`.
>
> **Cap B — no group takes more than 550 ms from its first pixel moving to its last pixel settling**, including any head start and the container's own entrance. `lead + stagger × cap + item duration ≤ 550 ms`.

**Why 240 ms.** A saccade-and-fixation cycle runs roughly 200–250 ms — the one figure in this document taken from outside the site rather than measured on it. A group whose members all arrive inside one fixation is perceived as a single event with an internal direction. Past that, late arrivals stop reading as part of the group and read as late. That is exactly what the sixteenth tile does today: by the time it appears, the visitor has decided the gallery is finished.

**Why the caps are two tokens and not one.** A cap is a maximum _multiplier_ on a base-0 index, so `--stagger-cap-grid: 6` lets members 1 through 7 cascade and makes the eighth share the seventh's delay. Lists and grids have different steps, so they need different multipliers to land on the same 240 ms span. Both are exact:

| Family | Stagger | Cap | Span       | + item duration                                                                                           | Cap B |
| ------ | ------- | --- | ---------- | --------------------------------------------------------------------------------------------------------- | ----- |
| List   | 60 ms   | 4   | **240 ms** | 240 + 255 = 495                                                                                           | ✅    |
| Grid   | 40 ms   | 6   | **240 ms** | 240 + 255 = 495                                                                                           | ✅    |
| Menu   | 60 ms   | 4   | **240 ms** | 125 + 240 + 180 = **545**                                                                                 | ✅    |
| Hero   | 60 ms   | 4   | **240 ms** | 125 + 240 + 255 = 620 → the hero has three staged elements, so the real span is 125 + 120 + 255 = **500** | ✅    |

The hero row is the one place where the cap is not the binding constraint and the member count is. Three elements means a maximum multiplier of 2, so the group settles at 500 ms; if a fourth were ever added it would land at 560 ms and break Cap B, which is the check §13.2 makes.

**Why elements past the cap share a delay rather than resetting per row.** Resetting cannot be expressed in CSS on an `auto-fill` grid, because neither `nth-child` nor a custom property knows the resolved column count. Clamping is one `min()` and it is exact. In practice it rarely fires, because §4.3 indexes elements per intersection batch rather than by DOM position.

### What it produces

Both columns are the same measurement: first pixel moving to last pixel settling.

| Group                    | Today                        | Here                                                                                                  | Change                         |
| ------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------ |
| Home hook readable       | 1200 ms                      | **380 ms** (§8.6)                                                                                     | −68 %                          |
| Home fully composed      | 1200 ms                      | **510 ms**                                                                                            | −58 %                          |
| Six project cards        | 1150 ms (150 × 5 + 400)      | **455 ms** (40 × 5 + 255)                                                                             | −60 %                          |
| Sixteen 3D tiles         | 2650 ms (150 × 15 + 400)     | **495 ms** for any batch (40 × 6 + 255); a tile arriving alone takes **255 ms** and waits for nothing | −81 %, and unbounded → bounded |
| Off-canvas menu, 5 items | ~600 ms (audit, approximate) | **545 ms**, last item landing 185 ms after the panel instead of ~300 ms                               | tighter wave                   |

---

## 6. The off-canvas navigation

This is the piece Stéphane named. It is preserved and raised, not replaced.

### 6.1 What is kept, verbatim in intent

1. **The page recedes while the menu advances.** This is the whole idea — it says the page is still there, behind. **It is kept at every width**, including mobile (§6.2).
2. **The items arrive in a cascade, from the right.** Kept; retimed.
3. **The burger transforms in place into a cross**, with its round pastille filling behind it. Kept; regeometried and recoloured.

### 6.2 The `scale(.9)` trap, the structure, and the inert boundary

`transform` on an element creates a containing block for its `position: fixed` descendants. The current site scales `main` and hosts the fixed menu panel inside it, so the "fixed" panel is positioned, scaled and offset relative to a shrinking box. The audit records the consequence: **the slightest failure and the links are unreachable.** `filter`, `backdrop-filter`, `perspective`, `contain: paint` and `will-change: transform` all create the same containing block — a trap with five doors.

**The fix is structural: the receding surface and the menu are siblings.**

```html
<body>
  <a class="skip-link" href="#contenu">Aller au contenu</a>

  <div class="shell" [attr.inert]="menuOpen() || null">
    <header class="site-header">
      <a class="brand">…</a>
      <nav class="nav-desktop" aria-label="Navigation principale">…</nav>
      <div class="burger-slot" aria-hidden="true"></div>
    </header>
    <main id="contenu" tabindex="-1">…</main>
    <footer>…</footer>
  </div>

  <button
    #burger
    class="burger"
    type="button"
    aria-controls="menu"
    [attr.aria-expanded]="menuOpen()"
    (click)="toggle(!menuOpen())"
  >
    <span class="burger__bar"></span>
    <span class="burger__bar"></span>
    <span class="burger__bar"></span>
    <span class="burger__cross" aria-hidden="true"></span>
    <span class="visually-hidden">{{ menuOpen() ? 'Fermer le menu' : 'Ouvrir le menu' }}</span>
  </button>

  <button
    class="menu-scrim"
    type="button"
    tabindex="-1"
    aria-hidden="true"
    (click)="toggle(false)"
  ></button>

  <nav #panel id="menu" class="offcanvas" aria-label="Menu" [attr.inert]="!menuOpen() || null">
    <ul>
      @for (item of items(); track item.path) {
      <li class="offcanvas__item" [style.--item-index]="$index">
        <a [routerLink]="item.path" (click)="closeFromLink()">{{ item.label }}</a>
      </li>
      }
    </ul>
  </nav>

  <p class="visually-hidden" aria-live="polite" aria-atomic="true">{{ routeAnnouncement() }}</p>
</body>
```

**`.shell` is what recedes, and `inert` goes on `.shell` as a whole — one attribute, not an enumeration.** The burger is hoisted out of `.shell` and positioned over the `.burger-slot` the header reserves. **The trade, named:** the burger's coordinates now duplicate the header's padding tokens in one place instead of being carried by the header's own layout. That is one duplicated geometry against an enumeration that silently rots — ADR-0011 requires Contact and CV at every width, so the header _will_ grow, and an enumerated `inert` list is one merge away from leaving a new control focusable behind a scrim.

Hoisting the burger also removes a defect the previous draft carried: inside `.shell` the burger rode the recession. At 1440 × 900 and `scale(.92)` about `transform-origin: center`, the top-right corner travels **57.6 px horizontally and 34 px vertically** — the control moves out from under the pointer during the very gesture that opened it. Outside `.shell` it does not move at all.

**One rule to keep the containing-block trap from coming back:** nothing inside `.shell` may be `position: fixed`. Overlays are siblings of `.shell`. The sticky header (spec 06 §9.3) is `position: sticky`, which resolves against the scroll container and is unaffected by an ancestor transform — that is why it may stay inside.

**`<dialog>` + `showModal()` was the alternative and it lost.** The top layer is outside the containing-block chain by construction and brings `Escape`, inertness and `::backdrop` for free. It was rejected because `showModal()` makes everything outside the dialog inert — the burger included — so the single control that morphs from hamburger to cross would have to be split into two elements at identical coordinates, swapped at frame 0. The burger toggling in place is what Stéphane likes. **What that costs is stated in §6.5: `inert` gives containment, not wrap-around, so the wrap is hand-written.** The previous draft claimed otherwise.

**The scrim is a `<button>`, not a `<div>` with a `(click)`.** `@angular-eslint/template/click-events-have-key-events` is blocking in CI, so a clickable `<div>` fails `pnpm verify`. `tabindex="-1"` and `aria-hidden="true"` keep it out of the tab order and the accessibility tree — legal on a non-focusable element — and `Escape` and the burger are the keyboard equivalents.

**Why 0.92 and not 0.9.** The recession's job is to say "this is behind now", carried by the change rather than its size. At 0.9 on 1440 × 900 the page pulls 72 px off each side and 45 px off top and bottom; the body background reads as a picture frame, and a frame competes with the panel. At 0.92 the insets are 57.6 px and 36 px — depth, not a border.

**The recession gains a scrim**, `var(--scrim)` from spec 06 §9.2: the flat 72 % variant, measured at 7.68:1 for white ink in spec 06 §3.5. A scale-down alone reads as a zoom-out; on the 3D section, where the page is already `#252422`, it is close to invisible. The scrim is what makes the recession mean something, and it gives the visitor an obvious place to click to close.

**The recession applies at every width, mobile included.** The previous draft removed it below `--md` because 85 vw of panel left only 54 px of shell visible. The correction is to narrow the panel, not to delete the gesture — this is the move Stéphane named as what he likes, and mobile is where most of a portfolio's traffic arrives. At 360 × 800:

| Quantity                                     | Value                          |
| -------------------------------------------- | ------------------------------ |
| Panel width, `min(20rem, 75vw)`              | 270 px                         |
| Shell strip left visible                     | 360 − 270 = **90 px**          |
| Shell left edge displacement at `scale(.92)` | 180 − 180 × 0.92 = **14.4 px** |
| Shell top edge displacement                  | 400 − 400 × 0.92 = **32 px**   |

14.4 px of horizontal travel inside a 90 px strip, and 32 px of vertical travel across the full width above the panel. Both are an order of magnitude above the ~3 px at which a recession stops being visible, so **0.92 is kept on mobile and no separate mobile scale factor is introduced.** One token, one behaviour, every width.

**Panel width: `--menu-width: min(20rem, 75vw)`.** The `20rem` cap binds from 427 px upward; below that, 75 vw. At 360 px that is 270 px, less `--page-inline` (24 px each side) = 222 px of text width. At `--text-body` = 16 px in Instrument Sans, French labels measure roughly: « Développeur » ~88 px, « Graphisme 3D » ~96 px, « Télécharger le CV » ~136 px. All clear 222 px without hyphenation, with room for the longest of them at a 320 px viewport (192 px of text width). The current `max-width: 270px; width: 25vw` gives a **100 px panel at 400 px wide**, which is broken.

```css
.offcanvas {
  --menu-width: min(20rem, 75vw);
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  inline-size: var(--menu-width);
  overscroll-behavior: contain;
  translate: 100% 0;
}

.shell {
  transform-origin: center;
  scale: 1;
  transition: scale var(--motion-dismiss) var(--ease-exit);
}

.menu-scrim {
  position: fixed;
  inset: 0;
  background: var(--scrim);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-dismiss) var(--ease-exit);
}

[data-menu='open'] .shell {
  scale: var(--shell-scale);
  transition-duration: var(--motion-panel);
  transition-timing-function: var(--ease-enter);
}

[data-menu='open'] .menu-scrim {
  opacity: 1;
  pointer-events: auto;
  transition-duration: var(--motion-panel);
  transition-timing-function: var(--ease-enter);
}
```

The transition is declared twice on purpose. **The declaration on the base rule governs the change _out_ of the state; the one on the state governs the change _into_ it.** That is the house idiom for asymmetry and it appears again in §8 and §10.

**Scroll lock.** While open, `body { overflow: hidden }` and `html { scrollbar-gutter: stable }` — the gutter reserved globally, so locking never shifts the layout by a scrollbar width. This is a step, not a transition, applied at open and removed at close.

### 6.3 The items and the burger

**Item cascade: 60 ms, not 100 ms.** At 100 ms, five items read as five separate arrivals; at 60 ms they read as one wave with a direction, and 60 × 4 = 240 ms lands exactly on Cap A.

**Own-axis offset: `--motion-slide`, provisionally 4rem (64 px).** The current items each translate their own full width — roughly 320 px — while the panel simultaneously carries them 320 px, doubling the travel. 64 px is a provisional midpoint pending the in-browser comparison in §14 item 1; it is not a measured result and it is not frozen.

`--item-index` is written by the template from `@for`'s `$index` (see the markup in §6.2). It is never a literal, which is what makes the §13.2 check possible.

```css
.offcanvas__item {
  opacity: 0;
  translate: var(--motion-slide) 0;
  transition:
    opacity var(--motion-exit-state) var(--ease-exit),
    translate var(--motion-exit-state) var(--ease-exit);
}

[data-menu='open'] .offcanvas__item {
  opacity: 1;
  translate: 0 0;
  transition-duration: var(--motion-state);
  transition-timing-function: var(--ease-enter);
  transition-delay: calc(
    var(--motion-lead) + var(--stagger-list) * min(var(--item-index, 0), var(--stagger-cap-list))
  );
}
```

**The head start is `--motion-lead` (125 ms), not a literal.** At 125 ms of a 360 ms panel travel, `--ease-enter` has covered **71.8 %** of the distance, so the items begin moving on a surface that has nearly arrived. The previous draft wrote `110ms` and claimed "~70 %"; the curve gives **65.1 %** at that point, and 110 ms is not a token. `--duration-125` is the ladder step that actually produces the intended number.

Sequence, five entries (Accueil · Développeur · Graphisme 3D · Contact · CV):

| Element               | Starts | Ends       |
| --------------------- | ------ | ---------- |
| Panel + scrim + shell | 0 ms   | 360 ms     |
| Item 1                | 125 ms | 305 ms     |
| Item 5                | 365 ms | **545 ms** |

545 ms, inside Cap B, last item landing 185 ms after the panel instead of the current ~300 ms.

**On close, delays are zero and everything leaves together** at `--motion-dismiss`. A staggered exit replays a decision the visitor has already made.

**The burger.** Kept as a single control that morphs in place. Three corrections.

The current geometry rotates and translates by `35px, -35px` — a 35 px correction inside a 24 px icon, which is what you write when a rotation's origin is fighting the composite. With `transform-origin: center` and the translate applied before the rotation in one `transform`, no correction is needed.

The current colours put the bars at `#f2a154` — **2.10:1 on white**, a straight 1.4.11 failure for a control's own boundary. The bars stay `--text-primary` in both states and never change colour; **the pastille carries the state**, filling to `--accent-wash`. That also keeps spec 06 §10's rule: never transition `color`.

The current pastille fades over 300 ms while the bars rotate over 200 ms — the same desync class as the card hover (§10.2). One duration for both, with one deliberate exception.

```css
.burger {
  position: fixed;
  inset-block-start: var(--space-3);
  inset-inline-end: var(--page-inline);
  inline-size: 3rem;
  block-size: 3rem;
  background: transparent;
  transition: background-color var(--motion-exit-state) var(--ease-exit);
}

.burger__bar {
  background: var(--text-primary);
  transform-origin: center;
  transition:
    transform var(--motion-exit-state) var(--ease-exit),
    opacity var(--motion-press-dur) var(--ease-exit);
}

.burger__cross {
  display: none;
}

[data-menu='open'] .burger {
  background: var(--accent-wash);
  transition-duration: var(--motion-state);
  transition-timing-function: var(--ease-state);
}

[data-menu='open'] .burger__bar {
  transition-duration: var(--motion-state);
  transition-timing-function: var(--ease-state);
}
[data-menu='open'] .burger__bar:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}
[data-menu='open'] .burger__bar:nth-child(2) {
  opacity: 0;
}
[data-menu='open'] .burger__bar:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}
```

**The one deliberate desync: the middle bar leaves over `--motion-press-dur` (90 ms) while the outer two travel over `--motion-state` (180 ms).** The middle bar must be gone before the outer two cross the space it occupies, or the cross is drawn through a third line. A desync with a stated reason is timing; a desync without one is the bug in §10.2.

**The burger is 48 px.** Spec 06 §10 sets a 44 px minimum target; 48 px is the next step on the spacing scale and gives 4 px of margin. It no longer rides the recession (§6.2), so no counter-transform and no scaled-target arithmetic are involved.

**Open and close are symmetric.** §7's asymmetry rule governs elements entering and leaving; the burger is a control toggling between two resting states, and neither is an arrival. It uses `--motion-state` both ways.

The reduced-motion form of the burger — a glyph swap with **no rotation at all** — is in §11.2, where the CSS actually delivers what the table promises.

### 6.4 Interruption — the one Web Animations API use on the site

The menu must be interruptible: a visitor who opens it and immediately changes their mind should see it leave at the speed it arrived, not spend a full `--motion-dismiss` travelling the 30 % of distance it has left. A CSS transition reversed mid-flight restarts from the current computed value and takes the **full** declared duration for whatever distance remains, which reads as sluggish exactly when the visitor is being decisive.

```ts
private animation?: Animation;

private durations(): { panel: number; dismiss: number } {
  const style = getComputedStyle(document.documentElement);
  return {
    panel: msOf(style.getPropertyValue('--motion-panel')),
    dismiss: msOf(style.getPropertyValue('--motion-dismiss')),
  };
}

toggle(open: boolean): void {
  this.menuOpen.set(open);

  const panel = this.panel().nativeElement;
  const running = this.animation?.playState === 'running';

  if (running) {
    this.animation!.reverse();
    return;
  }

  this.animation?.cancel();

  const { panel: enter, dismiss } = this.durations();
  this.animation = panel.animate(
    open
      ? [{ translate: '100% 0' }, { translate: '0 0' }]
      : [{ translate: '0 0' }, { translate: '100% 0' }],
    {
      duration: open ? enter : dismiss,
      easing: open ? EASE_ENTER : EASE_EXIT,
      fill: 'both',
    },
  );

  this.animation.onfinish = () => {
    panel.style.translate = this.menuOpen() ? '0 0' : '100% 0';
    this.animation?.cancel();
    this.animation = undefined;
  };
}
```

Four things this gets right that the previous draft did not:

- **The keyframes are explicitly reversed for the closing direction.** The previous code always animated toward `translate: 0 0` and varied only duration and easing, so with `fill: 'both'` a close played the panel out and then snapped it back to open — while `menuOpen()` said `false` and `inert` landed on a visible panel. The visitor was locked in.
- **`reverse()` is only called on a _running_ animation.** On a finished one it would replay from the end.
- **`onfinish` reads `menuOpen()` rather than the captured `open` argument**, because after a `reverse()` the direction that finishes is the opposite of the one that started.
- **The final value is committed as an inline style, then `cancel()` drops the fill.** No animation object survives its own gesture, so a rapid open/close/open cannot stack filling animations: at most one exists at any time, and it is either reversed or cancelled and replaced.

The durations are read from `:root` **at the moment the animation is created**, not once at bootstrap. That is one `getComputedStyle` call per menu toggle — negligible — and it is what makes §11.4's requirement true: a visitor who flips `prefers-reduced-motion` mid-session gets the new durations on the very next open, with no reload and no subscription.

**Zoneless.** The animation runs on the compositor and never re-triggers Angular rendering. Everything the template needs — `aria-expanded`, `inert`, `data-menu`, the burger's state — hangs off the `menuOpen` signal. Nothing reads the animation's state; **the signal is the source of truth and the animation is a consequence.**

### 6.5 Focus and keyboard

**`inert` gives containment, not wrap-around.** With `.shell` inert, `Tab` cannot reach anything behind the menu — but nothing follows `#menu` in the DOM, so `Tab` from the last link leaves for the browser chrome, and `Shift+Tab` from the burger does the same. That is not a focus trap. **The wrap is written by hand**, because a modal surface needs both halves.

The modal surface is the burger plus `#menu`, in that DOM order.

```ts
private readonly onKeydown = (event: KeyboardEvent): void => {
  if (!this.menuOpen()) return;

  if (event.key === 'Escape') {
    this.toggle(false);
    this.burger().nativeElement.focus();
    return;
  }

  if (event.key !== 'Tab') return;

  const first = this.burger().nativeElement;
  const last = lastFocusable(this.panel().nativeElement);
  if (!last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};
```

The listener is added on open and removed on close, on `document`, in the capture phase.

- **`Escape` closes and returns focus to the burger.** The burger opened the menu and is still on screen, so there is no focus restoration to record.
- **A link click is the path that actually breaks focus, and it is handled explicitly.** `closeFromLink()` moves focus to the burger **before** `menuOpen` flips, so `inert` is never applied to the element that currently holds focus. Without that ordering the focus falls to `<body>`, the next `Tab` restarts from the top of the document, and nothing tells a screen reader anything happened. The route-change handling in §9.5 then moves focus to `<main>` and announces the new page.
- **`inert` is applied on open, before the animation starts, and removed on close, before it starts.** Never on `finished` — a visitor pressing `Tab` during a 360 ms animation must already be inside the menu.
- `aria-expanded` on the burger tracks `menuOpen()`; `aria-controls` points at the panel.
- The panel's links are `min-height: 2.75rem` per spec 06 §10 — the current collapsed menu's links have neither padding nor a minimum height.

### 6.6 Compositing, honestly

`.shell` on `/graphisme-3d` contains up to sixteen decoded renders. Scaling it means the compositor rasterizes it into a layer and scales the texture.

**`will-change` is not used.** A running `translate` animation on `.offcanvas` and a running `scale` transition on `.shell` each get a compositor layer for the lifetime of the movement in Blink, WebKit and Gecko. `will-change` would only move the promotion earlier — and applied at the moment the gesture starts, as the previous draft did, it moves it earlier by nothing. It bought a rule, a JavaScript lifecycle and a CI census in exchange for no frames. All three are deleted.

**Two costs are paid rather than denied.**

**The raster lands on the first frame.** A viewport-sized layer at device pixel ratio is roughly 20 MB at 1440 × 900 on a 2× display, and it is rasterized on the frame the recession begins — which is the frame the §13.4 profile records. The pass criterion is written accordingly: **one long frame at the start of the gesture is expected; a long frame on every frame means the layer was never promoted and the scale is being re-rastered.**

**Downsampling text is not the same as downsampling a photograph.** The claim that scaling down is visually clean holds for a raster image and does not hold for antialiased type: at 0.92 every glyph in the shell is resampled from a reduced texture for 360 ms, and hinted stems thin unevenly. That is accepted, for two stated reasons: the shell sits behind `var(--scrim)` at 72 % opacity while it happens, so the text is at 7.68:1 against a near-black wash rather than being read; and the shell is `inert`, so nothing there is meant to be read. It is still a real degradation and it is what the recession costs.

The shell only ever scales **down**, 1 → 0.92, never up. A scale-up would blur the renders themselves, which is a different and much worse failure.

---

## 7. Asymmetry

> **Exits are one step down the duration ladder from their entrance. Dismissals are two.**

The asymmetry ratio and the duration scale are the same number, √2, so an exit is simply the next token down and needs no table of magic values — §3.4's "Its exit" column is the whole mapping. The two dismissals are the menu close and the lightbox close, both landing on `--motion-dismiss` (180 ms) from `--motion-panel` (360 ms).

**Why exits are faster.** An entrance has to be understood: where the element came from, what it relates to, that it has arrived. An exit has nothing to communicate — the decision is made and attention has moved on. A slow exit is the interface holding the door.

**Why dismissals get two steps.** A dismissal is the visitor actively removing something they put there. The menu close and the lightbox close are the two cases. Anything slower than 180 ms in those moments reads as the interface arguing.

**Floor: nothing is shorter than `--duration-90`.**

**Scope.** The rule governs elements entering and leaving. It does not govern a control toggling between two resting states — the burger, a checkbox, a theme switch — where neither state is an arrival and asymmetry would make one direction feel broken.

---

## 8. The home entrance and the background video

### 8.1 The video is kept

Settled by Stéphane on 2026-08-31: the 3D video plays in the background of the home page, autoplaying, looping, muted.

**This supersedes ADR-0012 on the autoplay point only.** The file still leaves the bundle and is still served from MinIO through nginx with byte-range support; the poster-and-click gate is dropped. ADR-0012 needs a superseding note — a separate edit, not this document's.

Motion's business is the **substitution**: a poster paints immediately and carries the LCP; the video fades in when it can actually play.

### 8.2 Poster → video, without a jump

```html
<div class="hero__media">
  <img class="hero__poster" ngSrc="…" width="1920" height="1080" priority alt="" />
  @if (playVideo()) {
  <video
    class="hero__video"
    [class.is-playing]="videoPlaying()"
    muted
    loop
    autoplay
    playsinline
    preload="none"
    aria-hidden="true"
    tabindex="-1"
    disablePictureInPicture
    disableRemotePlayback
    (playing)="videoPlaying.set(true)"
    (pause)="videoPlaying.set(false)"
  ></video>
  }
  <div class="hero__scrim" aria-hidden="true"></div>
</div>
```

`preload="none"` and `autoplay` are ADR-0012's own terms. The class flips on `playing`, not on `canplay`: `canplay` says the browser _could_ play, which is exactly the state an autoplay refusal leaves it in.

```css
.hero__video {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-media-swap) var(--ease-state);
}

.hero__video.is-playing {
  opacity: 1;
}

.hero__scrim {
  background: var(--hero-scrim);
  pointer-events: none;
}
```

Poster, video and scrim are absolutely positioned in the same `isolation: isolate` box with the same `object-fit: cover` and `object-position: center`. **A geometric mismatch during a crossfade is far more visible than a luminance one**, and it is the easier mistake to make; that is the only reason the layout is mentioned in a motion spec.

**Duration `--motion-media-swap` (510 ms), easing `--ease-state`.** This is not a state change and not an entrance: it is one image being replaced by an image that should be the same image. Short crossfades between near-identical frames read as a flicker; long ones read as a dissolve — a substitution nobody notices. `--ease-state` avoids the hard start and stop that `linear` would give a luminance ramp.

**Three constraints on the encode, which is Stéphane's side of the work.**

1. **The poster is frame 0 of the delivered video**, extracted from the encoded H.264 after encoding — not a separately rendered still and not a different frame. Extracted from the final file, it carries the encoder's own colour rather than the render's, and both assets are tagged sRGB / BT.709 with matching range flags.
2. **The first 1.5 s of the loop carries no fast luminance change.** During a 510 ms fade the video advances about 15 frames, so the crossfade is between the poster and frame 15.
3. **The loop seam is a cut the visitor sees repeatedly.** `loop` restarts at 0; if the last frame does not match the first, there is a visible jump every cycle. That is more damaging than anything else in this document, because it repeats.

### 8.3 When the video is not loaded, or refuses to play

**The `<video>` carries no `src` in the markup.** With prerendering (ADR-0008) a `src` in the static HTML starts the fetch before any script runs, which defeats every condition below.

```ts
readonly playVideo = computed(
  () => !this.reducedMotion() && !this.saveData() && !this.slowConnection(),
);
```

- `reducedMotion()` — `matchMedia('(prefers-reduced-motion: reduce)')`, read into a signal and **kept live** through a `change` listener.
- `saveData()` — `navigator.connection?.saveData === true`.
- `slowConnection()` — `navigator.connection?.effectiveType` in `slow-2g`, `2g`, `3g`.

In all three cases **the poster stays and nothing else happens.** A still 3D render behind the hook is not a fallback, it is a legitimate composition — and on the current site it is what a slow-connection visitor gets anyway, after waiting for 2.88 MB of it.

`navigator.connection` is unavailable in Safari and Firefox; both optional chains resolve to `undefined` and the video loads. The API's absence is not evidence of a slow connection.

**`play()` can be refused even when everything above passes** — iOS Low Power Mode, an autoplay policy that requires a gesture, a battery-saver profile. The promise rejects, no `playing` event fires, `videoPlaying()` stays `false`, the poster stays at full opacity and nothing crossfades. **The control in §8.4 therefore renders in its "play" state, not its "pause" state**, and pressing it calls `play()` from a real user gesture, which every policy allows. Offering to pause something that is not playing is the failure mode this paragraph exists to prevent.

### 8.4 The video is decorative, and WCAG 2.2.2 still applies

`aria-hidden="true"`, `tabindex="-1"`, no controls, `pointer-events: none`. Never in the tab order, never announced (ADR-0011).

**A pause control is nonetheless mandatory.** WCAG 2.2.2 (Pause, Stop, Hide) is level A and applies to automatically moving content that runs longer than five seconds and is presented in parallel with other content. Marking the video `aria-hidden` does not exempt it — 2.2.2 is about distraction, not semantics. ADR-0010 targets WCAG 2.2 AA, so the criterion is in scope and it wins over a clean hero.

Spec 02 §Home specifies this control; this section only adds the motion and the failure paths, and defers to spec 02 for everything else:

- **Persistently visible**, in a bottom corner of the hero. Never hover-revealed — an affordance nobody can see does not satisfy the criterion, and does not exist at all on touch.
- **In the tab order**, 44 × 44 px target (ADR-0010).
- **Accessible name states the action and follows the state**: « Mettre la vidéo en pause » / « Lire la vidéo ». The icon alone is not a name.
- **The choice persists for the visit** (`sessionStorage`), so a route change does not restart it.
- **It sits over the scrim's densest band**, where `--hero-scrim` reaches 78 % and white measures 9.57:1 (spec 06 §3.5) — well past the 3:1 that 1.4.11 asks of an interface control.
- **Not rendered at all when `playVideo()` is false**: nothing moving, nothing to pause, and a dead button is worse than no button.

Its label uses the `--text-meta` **type size** (13 px, spec 06 §4) and takes its ink from the hero's dark island (§8.5) — `--text-meta` is a size token and never a colour.

Pausing sets `paused` on the element and leaves opacity alone: the last frame stays visible under the scrim, which is what a visitor freezing a render wants to see.

### 8.5 Text legibility over the video

The hero text must hold against **every** frame, not against the poster. Three layers, all needed:

1. **A scrim, static, not animated**, painted with `var(--hero-scrim)` exactly as spec 06 §9.2 declares it: a **vertical** gradient, `to top`, `--color-neutral-950` at 78 % → 62 % → 30 %. Spec 06 §3.5 measures its guarantee — 62 % in the band the hook occupies gives 5.32:1 for white ink, 78 % at the bottom edge gives 9.57:1, and 58 % is the measured floor for body text. **This document declares nothing and overrides nothing here.** The previous draft proposed a horizontal gradient of its own and claimed spec 06 had no such token; spec 06 declares both `--scrim` and `--hero-scrim`, and the horizontal variant fell to **44.75 % composite opacity at the right edge** — about 3:1 by spec 06's own table, below AA, in the exact corner where §8.4 puts the pause button.
2. **The hero is a `data-theme="dark"` island.** It sits on a dark scrim on an otherwise light page, so its text uses the dark theme's semantics — the mechanism spec 06 §9.1 describes, at the cost of one attribute. This has a motion consequence, in §8.6.
3. **A constraint on the encode.** No scrim rescues a headline from a bright, busy passage moving underneath it. The region the hook occupies must stay dark and low-contrast for the whole loop. Spec 06 §3.5 states the same thing from the colour side: a scrim that has to reach 78 % to rescue a badly chosen frame has become a curtain, at which point there was no reason to ship a video.

### 8.6 The entrance, rewritten in `transform`

The current entrance is `.homepage--loading .homepage__leftside { flex-basis: 100% }` retracting to 50 % over `.45s cubic-bezier(0,.43,.16,1)`, the right panel fading in, and the portrait translating over `all 1s`. Three problems:

- **`flex-basis` triggers layout on every frame** — the exact property class §3.6 forbids, on the page that also holds the LCP media.
- **`all 1s`** means the page is not settled for a full second, and `all` transitions anything that happens to change.
- **The `--loading` class is removed by JavaScript**, so the entrance is gated on hydration. On a prerendered site that gate has no reason to exist.

**The gesture preserved:** a solid surface covers the viewport, and its right edge sweeps leftward to uncover the media.

**What changes:** the media is now full-bleed rather than confined to a right-hand half, so the sweep runs to completion instead of stopping at 50 %. The layout is final from frame 0 — the hook does not travel from viewport centre to half-panel centre, because that 360 px journey was a side effect of the `flex-basis` animation and it is the part that cost the layout. In its place the hook gets a 16 px rise on the signature curve.

```css
.hero__curtain {
  display: none;
}

.hero__content {
  z-index: 2;
}

.hero__content > * {
  opacity: 0;
  translate: 0 var(--motion-rise);
  animation: rise var(--motion-enter) var(--ease-signature) both;
  animation-delay: calc(
    var(--motion-lead) + var(--stagger-list) * min(var(--item-index, 0), var(--stagger-cap-list))
  );
}

@keyframes rise {
  to {
    opacity: 1;
    translate: 0 0;
  }
}

@keyframes home-curtain {
  from {
    scale: 1 1;
  }
  99% {
    scale: 0 1;
    visibility: visible;
  }
  to {
    scale: 0 1;
    visibility: hidden;
  }
}

@media (--md) {
  .hero__curtain {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 1;
    background: var(--surface-letterbox);
    transform-origin: left center;
    pointer-events: none;
    animation: home-curtain var(--motion-curtain) var(--ease-signature) both;
  }
}
```

Mobile-first, `min-width` only, using spec 06 §8.1's `@custom-media --md` rather than a fourth literal spelling of 768 px. ADR-0011 forbids `max-width` for layout, and the previous draft's `@media (max-width: 47.999rem)` violated it.

**The hook sits above the curtain (`z-index: 2` against `1`), so it is legible from the moment it is painted** — which is why the curtain is `--surface-letterbox` (`#12100f`) and not the page colour. The hook is light ink because it sits on a dark scrim (§8.5); a white curtain would force the ink to change colour halfway through the entrance, which spec 06 §10 forbids.

**Sequence**

| t              | What                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 0 ms           | Poster painted. Scrim at rest. Curtain covers the viewport. Hook at opacity 0, 16 px low, above the curtain.           |
| 0 → 510 ms     | Curtain `scale: 1 1 → 0 1`, origin left, `--ease-signature`. The media uncovers right to left.                         |
| 125 → 380 ms   | Hook rises and fades, `--motion-enter`, `--ease-signature`. **Readable at 380 ms.**                                    |
| 185 → 440 ms   | « Profil dev » / « Profil 3D », one `--stagger-list` behind.                                                           |
| 510 ms         | Curtain `visibility: hidden`. No JavaScript involved.                                                                  |
| network-driven | Video `playing` → 510 ms crossfade. Independent clock; it may land at 400 ms or at 4 s and the entrance is unaffected. |

**1200 ms to a readable hook becomes 380 ms**, −68 %.

**The entrance never waits.** It is a CSS animation on an element present in the prerendered HTML, so it starts at parse time, before hydration and before the video decides anything. If the poster has not decoded, the curtain uncovers ADR-0012's dominant-colour placeholder.

**On LCP.** The poster is occluded by the curtain for up to 510 ms. Chrome's LCP excludes elements at `opacity: 0` but does not test for occlusion by later-painted siblings, so the poster's paint time should still be recorded. **Verify with a real Lighthouse run rather than trusting this paragraph** — and if it does cost, the contingency is already in the CSS: the curtain is `--md` and up, and mobile is where the metric is scored.

**Below `--md` there is no curtain.** A horizontal wipe on a 360 px viewport is a 360 px sweep in 510 ms across a single-column layout with nothing to uncover. The hook keeps its rise; that is the whole entrance on a phone.

---

## 9. Route transitions and the lightbox

The current site has none: the route changes instantly and the new page's `.reveal` replays. Nothing distinguishes "the page changed" from "the page repainted" — which is exactly what the light → dark section boundary needs to communicate, and exactly what a screen-reader user gets no announcement of.

### 9.1 Configuration

```ts
provideRouter(
  routes,
  withComponentInputBinding(),
  withViewTransitions({
    skipInitialTransition: true,
    onViewTransitionCreated: (info) => inject(RouteTransitions).onCreated(info),
  }),
);
```

`skipInitialTransition: true` is explicit: on first load there is no outgoing view, and animating from nothing delays the first paint of a prerendered page for no gain.

**`onViewTransitionCreated` is used, and the previous draft's reason for avoiding it was wrong.** It does not "race the pseudo-element styling": the callback runs synchronously right after `startViewTransition()`, before the update callback, and pseudo-element styles are resolved when the animations start — after the DOM has been updated. It is also the **only** API that hands us the `ViewTransition` object, and therefore the only access to `.finished`, `.ready` and `.updateCallbackDone`, on which §9.3 and §9.5 both depend.

**Cross-document view transitions (`@view-transition { navigation: auto }`) are rejected.** They apply only to hard navigations, because the router intercepts everything else. Maintaining a second set of transition styles for the one case where nothing needs transitioning is cost with no return. A hard navigation therefore has no transition, and nobody should chase it.

### 9.2 The default: a crossfade, tuned

```css
::view-transition-old(root) {
  animation: vt-out var(--motion-exit-state) var(--ease-exit) both;
}

::view-transition-new(root) {
  animation: vt-in var(--motion-page) var(--ease-enter) both;
}

@keyframes vt-out {
  to {
    opacity: 0;
  }
}
@keyframes vt-in {
  from {
    opacity: 0;
    translate: 0 var(--motion-rise-tight);
  }
}
```

125 ms out, 255 ms in, overlapping. A crossfade rather than a slide because the LCP of most routes is a large render: a slide moves that raster across the viewport every frame, while a crossfade animates opacity on two snapshot layers, which the compositor does for free. A slide would also imply a spatial relationship between two routes that do not have one.

### 9.3 Crossing the theme boundary

Developer (light, `#ffffff`) → 3D (dark, `#252422`) is the one navigation where a crossfade is wrong, for a measurable reason: **a crossfade between a white page and a dark page passes through a mid grey with two sets of text at partial opacity over it.** Neither clears AA at any point in the middle, and spec 06 §3.4 requires every state to clear its target.

**So a theme-crossing navigation does not blend — the incoming page slides over the outgoing one, which stays opaque and static beneath it.** Nothing is ever semi-transparent over anything. Direction carries meaning: **the dark section rises over the light one; leaving it, the dark page falls away.**

```css
html[data-vt='to-dark'] ::view-transition-old(root) {
  animation: none;
}
html[data-vt='to-dark'] ::view-transition-new(root) {
  animation: vt-rise var(--motion-panel) var(--ease-enter) both;
  z-index: 1;
}
@keyframes vt-rise {
  from {
    translate: 0 100%;
  }
}

html[data-vt='to-light'] ::view-transition-new(root) {
  animation: none;
}
html[data-vt='to-light'] ::view-transition-old(root) {
  animation: vt-fall var(--motion-dismiss) var(--ease-exit) both;
  z-index: 1;
}
@keyframes vt-fall {
  to {
    translate: 0 100%;
  }
}
```

**Setting and clearing `data-vt`.** The previous draft set it on `NavigationStart` and cleared it only on `transition.finished`. Four paths never reach `finished`: a navigation cancelled by a guard, a redirect, a navigation superseded by a later one, and **the initial navigation, which `skipInitialTransition: true` excludes entirely** — so a first load straight onto `/graphisme-3d` left `data-vt='to-dark'` on `<html>` permanently, and every subsequent navigation, light → light included, played the theme crossing.

Both halves are fixed by writing it from `onViewTransitionCreated`, which is never called for a skipped initial transition, and by clearing it on **both** settlements of `finished`:

```ts
@Injectable({ providedIn: 'root' })
export class RouteTransitions {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationCancel || event instanceof NavigationError),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.clear());
  }

  onCreated({ transition, from, to }: ViewTransitionInfo): void {
    const fromTheme = themeOf(from);
    const toTheme = themeOf(to);

    if (fromTheme !== toTheme) {
      this.root.dataset['vt'] = toTheme === 'dark' ? 'to-dark' : 'to-light';
    }

    scrollMorphOriginIntoView(to);

    const clear = () => this.clear();
    transition.finished.then(clear, clear);
    transition.updateCallbackDone.then(() => focusAndAnnounce(to));
  }

  private clear(): void {
    delete this.root.dataset['vt'];
  }
}
```

`finished` settles on abort as well as on success, so `.then(clear, clear)` covers the cancel and supersede paths on its own; the router subscription is a cheap net for the case where the transition object is never created at all.

**The header and `<meta name="theme-color">` flip when the new page covers the old one, not before.** Spec 06 §9.3 drives both from one `IntersectionObserver` signal; during a route transition that observer has nothing to observe yet, so the flip runs off the same route data on `finished`. Otherwise the visitor gets a dark header over a still-light page for 360 ms.

### 9.4 The 3D lightbox opening from its tile

Spec 01 makes the lightbox a real route (`/graphisme-3d/<slug>`), so it is a router navigation and `withViewTransitions()` already wraps it.

**All three pseudo-elements are styled, not just the group.** Styling `::view-transition-group(tile)` alone leaves the old and new images on the UA's 250 ms default crossfade while the group's rect interpolates over 360 ms — the desync §10.2 forbids elsewhere, in the site's most visible single transition.

```css
::view-transition-group(tile),
::view-transition-old(tile),
::view-transition-new(tile) {
  animation-duration: var(--motion-panel);
  animation-timing-function: var(--ease-enter);
}
```

Duration `--motion-panel` (360 ms): the travel is large — typically 300 px of translation and a 3× scale — and it is the site's one genuinely spatial transition.

**Uniqueness of `view-transition-name` is mechanised, not asserted.** A duplicate silently aborts the whole transition, and the duplicate is easy to produce: the gallery is a parent route that stays mounted under the lightbox child route, so a tile still carrying `tile` while the lightbox image also carries it is the default outcome, not an edge case.

One signal decides, and both consumers read it:

```ts
readonly morphSlug = signal<string | null>(null);
readonly lightboxOpen = computed(() => this.route.child() !== null);

// gallery tile
readonly tileName = (slug: string) =>
  !this.lightboxOpen() && this.morphSlug() === slug ? 'tile' : '';

// lightbox image
readonly imageName = computed(() => (this.lightboxOpen() ? 'tile' : ''));
```

Both bindings are `[style.view-transition-name]` and both derive from `lightboxOpen()`, so **they are mutually exclusive by construction** — there is no ordering to get right and no window in which both are set. Angular's update callback activates the new router state and renders it before resolving, so both writes land inside that callback and the new snapshot sees exactly one named element. A development-mode assertion still fails loudly on a duplicate, because the browser's own failure mode is silence.

**`view-transition-name` takes a `<custom-ident>`.** A bare slug beginning with a digit is invalid and silently kills the transition. The static name `tile` sidesteps it entirely — the other reason for the single-name approach.

**On close, the tile is scrolled into view in `onViewTransitionCreated`, not in the update callback.** The previous draft specified the update callback, which with `withViewTransitions()` belongs to the router and exposes no hook. It does not need to: the UA captures the old state synchronously inside `startViewTransition()`, _before_ `onViewTransitionCreated` runs, and the gallery is still mounted underneath — so scrolling there with `behavior: 'instant'` affects only the new state, which is exactly what is wanted. If the visitor keyboard-navigated to image 12 and closes, the group would otherwise animate toward an off-screen rect and the lightbox would appear to fly away into nothing. This is also the element focus returns to (spec 01), so it has to be on screen regardless.

When the lightbox URL is hit directly there is no gallery, no name on either side, and the route simply crossfades per §9.2.

**The rest of the page crossfades** on the `root` pseudo-element as usual; only the tile is grouped.

### 9.5 Focus and announcement on every route change

Neither a View Transition nor the Angular router moves focus, and neither announces anything. Without this section a keyboard user's next `Tab` restarts from the top of the document and a screen-reader user is never told the page changed.

```ts
function focusAndAnnounce(to: ActivatedRouteSnapshot): void {
  const main = document.getElementById('contenu');
  main?.focus({ preventScroll: true });
  announcement.set(titleOf(to));
}
```

- **Called from `transition.updateCallbackDone`.** That promise settles after the DOM has been updated and before the new snapshot is captured, so the focused state is what the snapshot records — no flash of a focus ring appearing after the transition lands.
- **The target is `<main id="contenu" tabindex="-1">`**, already in the markup for the skip link. `main:focus { outline: none }` is correct here and only here: `<main>` is not an interactive control, the page change is announced by the live region, and a full-viewport focus ring on every navigation is noise. Every actual control keeps its ring (§10.1).
- **The live region is `<p class="visually-hidden" aria-live="polite" aria-atomic="true">`, a sibling of `.shell`, not a descendant.** Inside `.shell` it would go `inert` with the menu, and an inert live region does not announce.
- **The menu-link path is handled in §6.5**, where focus leaves `#menu` for the burger before `inert` is applied; this function then takes it to `<main>`. `Escape` is not the only way out of the menu and was not the one that was broken.

---

## 10. Everything else that moves

### 10.1 Hover, focus and press

All of this obeys spec 06 §3.4 and §10. Motion's contribution is the timing and the asymmetry idiom.

**Gate.** Every hover rule sits inside `@media (hover: hover) and (pointer: fine)` (ADR-0011). Hover adds polish and never information.

```css
.button {
  transition:
    background-color var(--motion-exit-state) var(--ease-exit),
    border-color var(--motion-exit-state) var(--ease-exit),
    box-shadow var(--motion-exit-state) var(--ease-exit),
    translate var(--motion-exit-state) var(--ease-exit);
}

@media (hover: hover) and (pointer: fine) {
  .button:hover {
    transition-duration: var(--motion-state);
    transition-timing-function: var(--ease-state);
  }
}

.button:active {
  translate: 0 var(--motion-press);
  box-shadow: var(--elevation-1);
  transition-duration: var(--motion-press-dur);
}
```

The base rule times the exit; the state rule times the entrance. 180 ms in, 125 ms out. **Every hover component in this document is that shape** — only the animated properties change — so it is written once here and referenced afterwards rather than repeated.

**`:active` is the shortest duration on the site, 90 ms.** Press feedback is a causality signal; past roughly 100 ms it stops reading as "I pressed that" and starts reading as lag.

**Three properties are never transitioned.**

- **`outline`.** The focus ring appears on frame 1. A ring that fades in over 180 ms is not yet an indicator when a fast keyboard user has moved on (WCAG 2.4.7, 2.4.11).
- **`color`.** Spec 06 §10, for contrast reasons.
- **`all`.** It transitions whatever happens to change, and on several engines that includes `outline`. The current site writes `all .2s ease-in-out` on buttons and `all .4s` on reveals. Both go, and §13.1 checks for it.

**Links** therefore have no hover transition: their ink and underline both step. A 180 ms ramp between two measured inks passes through inks that were never measured, and the underline already carries the state without colour (spec 06 §10.2).

**The skip link appears instantly.** `transform: translateY(-200%)` → `none`, no transition. A skip link that slides in over 255 ms delays exactly the visitor it exists for.

### 10.2 The two hover desyncs the audit found

**Project card — background `.3s`, title and hashtags `.15s`.** The content arrives twice as fast as the ground it sits on.

Most of it disappears by design: ADR-0010 puts title, technologies and year **visible at rest**, so there is no content to reveal on hover. What remains is `box-shadow: var(--elevation-2)` and `translate: 0 calc(var(--motion-lift) * -1)`, both on the §10.1 idiom — one shared duration, 180 ms in and 125 ms out.

> **Within one component, every hover transition shares one duration.** If two properties seem to need different durations, one of them is wrong. The only exception in this document is the burger's middle bar (§6.3), which has a stated geometric reason.

This supersedes the literal `200ms` in spec 06 §10.4, which that section defers to this one.

**3D tile — `img { transform: scale(1.2) }` with no transition declared.** An instantaneous jump on hover, colliding with a reveal that animates `scale(1.2) → scale(1)` on the same element: two animations, one property, opposite directions.

1. **The reveal drops its scale entirely.** Sixteen tiles each scaling as they appear is noise; opacity plus `--motion-rise-tight` carries the arrival, and the collision ends at its source.
2. **The hover zoom moves to the image and gets a declared transition**, `--motion-enter` with `--ease-enter`. It is travel, so it decelerates.
3. **1.2 becomes 1.04.** At 1.2 the visible crop loses **16.7 % of each axis, 30 % of the frame area** — on a render whose composition is Stéphane's, that is a re-crop the author did not make, and it contradicts ADR-0012's rule that renders are not cropped by CSS. At 1.04 on a 320 px tile each edge moves 6.4 px: legible as a response, no meaningful loss of frame, no resolution penalty at the served widths.

```css
.tile__media img {
  scale: 1;
  transition: scale var(--motion-exit) var(--ease-exit);
}

@media (hover: hover) and (pointer: fine) {
  .tile:hover .tile__media img,
  .tile:focus-within .tile__media img {
    scale: var(--zoom-media);
    transition-duration: var(--motion-enter);
    transition-timing-function: var(--ease-enter);
  }
}
```

`.tile__media` carries `overflow: hidden`. `:focus-within` is included so a keyboard user gets the same affordance.

**Social icons.** Rest `opacity: .2` is not a hover problem, it is a contrast failure: a link at 20 % opacity does not clear 3:1 against anything. Rest goes to `--text-secondary` at full opacity. Hover steps the ink to `--text-accent` (a step, not a transition) and transitions `scale` to **`var(--zoom-icon)`** over `--motion-state`. On a 24 px icon, 1.08 is 1.92 px of total growth against 2.4 px at the current site's 1.1 — the difference between a nudge and a pop at that size. **It is a token, not a literal**, precisely so that §11.1's reduced variant can set it to 1; a literal `1.08` in a component rule would escape `prefers-reduced-motion` entirely, because the reduced variant works by redefining tokens and touches no component rule.

### 10.3 Decorative SVG shapes

The audit notes they sit at absolute positions with inline `animation-delay` and **do not move on scroll**, which makes them read as stuck to the glass. This is the one place scroll-scrubbed animation is right: the shape is `aria-hidden`, carries no information, has no contrast requirement, and parking mid-range is a valid resting state.

```css
.deco {
  translate: 0 0;
}

@supports (animation-timeline: scroll()) {
  .deco {
    animation: deco-drift var(--ease-linear) both;
    animation-timeline: scroll(root block);
  }
}

@keyframes deco-drift {
  to {
    translate: 0 -8vh;
  }
}
```

**The `@supports` guard is not optional.** Without it, an engine that does not implement `animation-timeline` ignores the property, keeps the `animation` shorthand, resolves `animation-duration` to `0s`, and with `both` fill jumps every shape **immediately and permanently** to `translate: 0 -8vh`. That is not a missing parallax, it is decoration permanently displaced — and ADR-0011 records that the current triangle already covers the home `<h2>`, so a permanent 8 vh displacement is the exact defect the ADR names. The guard is the whole difference between "no parallax" and "a decorative shape parked on a heading".

`var(--ease-linear)` rather than the literal, for §3's rule. Linear is correct here for the same reason as the progress bar: the animated value is scroll position, and easing it would decouple the shape from the page it parallaxes against.

Per ADR-0011 the shapes are `aria-hidden="true"`, not focusable, and **never over text at any width** — including at their drifted extreme, which is what the drift range must be authored against. Under reduced motion, `animation: none`; the shapes still paint, because they are composition.

### 10.4 The carousel — the second WCAG 2.2.2 case

`--slide-interval` is 7 s (§3.3). Seven seconds of automatic movement beside other content is squarely inside 2.2.2, and **2.2.2 applies whether or not the visitor has asked for reduced motion** — it is a level A criterion about control, not a motion preference.

The control is specified at the same level as spec 02's video control, and matches it wherever it can:

- **Persistently visible**, in the carousel's chrome beside the previous/next controls. Never hover-revealed.
- **In the tab order**, 44 × 44 px (ADR-0010).
- **The accessible name states the action and follows the state**: « Mettre le défilement en pause » / « Reprendre le défilement ». The icon is not the name.
- **The choice persists for the visit** in `sessionStorage`, under a key distinct from the video's. A visitor who stopped the carousel on one project page does not want it running on the next.
- **Paused freezes the progress bar where it stands** — `animation-play-state: paused` on `.carousel__progress`, not a reset. Resuming continues from that position, so the bar keeps telling the truth about how long is left, which is the only reason it exists. The slide timer and the bar are the same animation, so they cannot drift apart.
- **Hover and `:focus-within` also pause**, as a courtesy. That is not the 2.2.2 mechanism and is never presented as one — it does not exist on touch.
- **Under reduced motion the carousel does not autoplay at all** (§11.2). The control still renders, in its "play" state: starting the motion is then the visitor's own action, which 2.2.2 permits without further mechanism.

```css
.carousel__progress {
  block-size: 4px;
  background: var(--accent-rim);
  transform-origin: left center;
  animation: carousel-progress var(--slide-interval) var(--ease-linear) both;
}

[data-carousel='paused'] .carousel__progress {
  animation-play-state: paused;
}

@keyframes carousel-progress {
  from {
    scale: 0 1;
  }
  to {
    scale: 1 1;
  }
}
```

Three corrections to the current bar, beyond the control:

- **`width` becomes `scale` on the X axis.** `width` is layout, and this bar runs continuously for the whole time a slide is showing — the most expensive animation on the site per second of screen time.
- **`linear` stays.** The value is elapsed time; §3.2.
- **`opacity: .5` on `--accent` goes.** It conveys time remaining, which is state, so spec 06 §3.4 applies: full opacity, `--accent-rim` on light (3.17:1) and `--accent` on dark (7.39:1), 4 px tall rather than 3.

### 10.5 Form feedback, the submit spinner, lightbox chrome

**Field errors.** No shake — a shake is an attention grab that adds nothing to a message that is already announced. `opacity` plus a 4 px rise, `--motion-enter`, `--ease-enter`, with `@starting-style` so the element animates on insertion without a class toggle:

```css
.field-error {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity var(--motion-enter) var(--ease-enter),
    translate var(--motion-enter) var(--ease-enter);

  @starting-style {
    opacity: 0;
    translate: 0 0.25rem;
  }
}
```

The `aria-describedby` link and the live announcement are spec 02's business and are unaffected: the message is announced whether or not it moved. **The confirmation block** uses the same pattern and durations.

`@starting-style` is used only on elements that actually enter and leave the DOM. It has no business on a permanent element — the menu scrim, for instance, never leaves, so it uses an ordinary transition (§6.2).

**The submit spinner.** Spec 06 §10.1 specifies that the submitting button keeps its full primary appearance, gains `aria-busy="true"`, swaps its label to « Envoi en cours… » **and shows a spinner**. That spinner is the only indefinite rotation on this site, so it needs both a reduced variant and an answer to 2.2.2.

```css
.spinner {
  animation: spinner-spin 900ms var(--ease-linear) infinite;
}

@keyframes spinner-spin {
  to {
    rotate: 360deg;
  }
}

[data-submit='stalled'] .spinner {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    display: none;
  }
}
```

- **Under reduced motion the spinner is not painted.** The label is the indicator, and `aria-busy` carries it to assistive technology. Nothing is lost: the label already says what is happening in words.
- **WCAG 2.2.2 has a five-second threshold, and a submit can exceed it.** If the request has not resolved after 5 s the component sets `data-submit="stalled"`: the rotation stops, the label becomes « Envoi toujours en cours… », and the visitor is no longer watching an indefinite spin. That keeps the criterion satisfied without a pause button on a control the visitor cannot meaningfully pause, and it is also better feedback — a spinner that has been turning for eight seconds tells you nothing that a sentence cannot tell you better.

**The lightbox** enters at `--motion-panel` and dismisses at `--motion-dismiss` (§7), scrim on `opacity`, chrome on `opacity`. The tile morph (§9.4) is the entrance when it is opened from a tile; a direct URL hit has nothing to morph from and simply renders. Focus trap, `Escape`, focus return and keyboard navigation between images are spec 01's requirements, driven by the route and by `inert`, not by the animation.

### 10.6 The keyframe inventory

> **`@keyframes` is for motion that is not a state change. A hover is a transition; a curtain is an animation.**

Nine keyframes, down from 29, **each with a named consumer in this document**:

| Keyframe              | Consumers                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `rise`                | Home hook and entry buttons (§8.6); the reveal safety net (§4.2) |
| `home-curtain`        | Home entrance wipe (§8.6)                                        |
| `deco-drift`          | Decorative parallax (§10.3)                                      |
| `carousel-progress`   | Carousel bar (§10.4)                                             |
| `spinner-spin`        | Submit spinner (§10.5)                                           |
| `vt-out` / `vt-in`    | Default route crossfade (§9.2), and the reduced variant (§11.2)  |
| `vt-rise` / `vt-fall` | Theme-crossing route transition (§9.3)                           |

The previous draft listed `reveal-rise`, which was defined nowhere and consumed by nothing. It is deleted; `rise` covers both the hero and the reveal net, which is why the hook's keyframe lost its hero-specific name. Everything else is a `transition`.

---

## 11. `prefers-reduced-motion`

The current site has **no `@media (prefers-reduced-motion)` anywhere**, on a site with cascades running past two seconds. ADR-0010 requires it, and requires the result to be usable and not degraded.

### 11.1 The mechanism: redefine semantics, not components

The reduced variant is expressed the way a theme is (spec 06 §9): **the semantic tokens are redefined in one block, and no component rule is touched.** One place to read, nothing to forget, and no component can opt out by accident — which is exactly why §10.2's icon scale had to become `--zoom-icon` instead of a literal.

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    /* Travel goes to zero; feedback keeps its timing. */
    --motion-rise: 0px;
    --motion-rise-tight: 0px;
    --motion-slide: 0px;
    --motion-lift: 0px;
    --motion-press: 0px;
    --shell-scale: 1;
    --zoom-media: 1;
    --zoom-icon: 1;

    /* Cascades collapse: the group arrives as a group. */
    --stagger-list: 0ms;
    --stagger-grid: 0ms;
    --motion-lead: 0ms;

    /* Long moves shorten. Nothing gets slower than it was. */
    --motion-panel: var(--duration-125);
    --motion-enter: var(--duration-125);
    --motion-page: var(--duration-90);
    --motion-curtain: 0ms;
    --motion-media-swap: 0ms;

    /* Curves flatten: no deceleration to read when there is no travel. */
    --ease-enter: var(--ease-state);
    --ease-signature: var(--ease-state);
  }
}
```

**`* { animation-duration: 0.01ms !important }` is the anti-pattern and it is not used.** It flattens staged sequences into simultaneous jumps, removes the feedback that tells a visitor a control responded, and produces exactly the degraded version ADR-0010 forbids.

### 11.2 What each animation becomes

| Animation          | Full                                          | Reduced                                                                                                                                                                           |
| ------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scroll reveal      | opacity + 16 px rise, 255 ms, staggered       | opacity only, 125 ms, no stagger — the group appears as a group                                                                                                                   |
| Home curtain       | 510 ms wipe                                   | **not painted**; the hero is in its resting state at frame 0                                                                                                                      |
| Hero video         | autoplays, 510 ms crossfade from the poster   | **never fetched** (§8.3); the poster is the hero, and the pause control is not rendered                                                                                           |
| Off-canvas open    | panel slides, shell recedes, items cascade    | panel appears over 125 ms on opacity; the shell does not scale; scrim fades; items appear with the panel. `Escape`, the hand-written wrap, `inert` and focus return are identical |
| Burger morph       | rotate ±45°, pastille fills                   | the icon **swaps glyph** over a 90 ms opacity crossfade, with **no rotation at all** — see the CSS below                                                                          |
| Card hover         | elevation + 2 px lift                         | elevation only, 180 ms. The hover still visibly responds                                                                                                                          |
| Tile / icon hover  | image scale 1.04, icon scale 1.08             | overlay and ink only; nothing scales                                                                                                                                              |
| Route transition   | slide on theme crossings, crossfade otherwise | 90 ms opacity crossfade on `root` in every case; no `vt-rise` / `vt-fall`, no group morph                                                                                         |
| Lightbox from tile | 360 ms rect morph                             | 125 ms opacity fade, in place                                                                                                                                                     |
| Carousel           | autoplays, bar runs                           | **autoplay off**, bar not painted; manual controls only, pause control still rendered (§10.4)                                                                                     |
| Decorative shapes  | scroll parallax                               | `animation: none`. The shapes still paint — they are composition, not motion                                                                                                      |
| Form error         | opacity + 4 px rise                           | opacity only. Announcement unchanged                                                                                                                                              |
| Submit spinner     | indefinite rotation                           | not painted; the label and `aria-busy` are the indicator (§10.5)                                                                                                                  |

```css
@media (prefers-reduced-motion: reduce) {
  .hero__curtain {
    display: none;
  }

  .deco {
    animation: none;
  }

  .burger__bar,
  .burger__cross {
    transition: opacity var(--motion-press-dur) var(--ease-state);
  }
  .burger__cross {
    display: block;
    opacity: 0;
  }
  [data-menu='open'] .burger__bar {
    transform: none;
    opacity: 0;
  }
  [data-menu='open'] .burger__cross {
    opacity: 1;
  }

  html[data-vt] ::view-transition-old(root) {
    animation: vt-out var(--motion-page) var(--ease-state) both;
    z-index: auto;
  }
  html[data-vt] ::view-transition-new(root) {
    animation: vt-in var(--motion-page) var(--ease-state) both;
    z-index: auto;
  }

  ::view-transition-group(tile) {
    animation: none;
  }
  ::view-transition-old(tile),
  ::view-transition-new(tile) {
    animation-duration: var(--motion-exit-state);
    animation-timing-function: var(--ease-state);
  }
}
```

Three corrections are load-bearing in that block. The burger rules **override `transform`**, not just the opacity transition: the previous draft rewrote the transition and left `rotate(45deg)` in force, so the bars pivoted anyway, in one step — breaking both the table's promise and §13's reduced-motion pass. Each view-transition pseudo-element gets **exactly one** animation: the previous draft assigned `animation-name: vt-out, vt-in` to both, and since both touch `opacity` the last one wins, so the outgoing snapshot faded _in_ and the page flashed white — served precisely to the visitors who asked for less motion. And `::view-transition-group(tile) { animation: none }` neutralises only the group; the image pair kept the UA's 250 ms default rather than the announced 125 ms, so old and new are styled too.

`vt-in` starts from `translate: 0 var(--motion-rise-tight)`, which §11.1 has already set to `0px`, so the reduced crossfade carries no travel without needing a second keyframe.

**One arbitration, stated rather than hidden.** §9.3 refuses a light→dark crossfade because its intermediates are unmeasured. Under reduced motion the slide is not available, so the crossfade is used anyway — for 90 ms, which is the shortest duration on the site. A visitor who has asked for less motion is not served by a full-viewport slide, and 90 ms of unmeasured intermediate is the smaller harm. That is a decision, not an oversight.

### 11.3 Two rules that make the reduced version a design

> **Reduced motion removes travel, not feedback.** Every state change still has a visible transition; it simply has no vector. A visitor who has asked for less motion has not asked to stop knowing whether their click landed.

> **Nothing is slower in the reduced variant than in the full one.** Every duration above is less than or equal to its counterpart.

### 11.4 It must be live

The preference is read into a signal through a `matchMedia` `change` listener, not sampled once at bootstrap. A visitor who toggles the OS setting sees the change without reloading — which matters most for the hero video, where the setting decides whether a multi-megabyte file is fetched at all.

CSS handles its own half automatically. The JavaScript half is the video gate (§8.3) and the carousel autoplay default (§10.4). **The WAAPI menu durations are not on that list, because §6.4 reads them from `:root` at each toggle rather than caching them at bootstrap** — the previous draft cached them and then required them to be live, which could not both be true.

---

## 12. Implementation contract

**Zoneless.** Where animation state has to reach the template it goes through a signal read by a binding: `menuOpen()` (§6.4), `revealed()` (§4.3), `playVideo()` / `videoPlaying()` (§8.2), `reducedMotion()` (§11.4), `morphSlug()` (§9.4). **The signal is the source of truth and the animation is a consequence, never the reverse.** No `NgZone`, no `markForCheck`, no reading of `Animation.currentTime` to decide what to render.

**Tokens in TypeScript.** The one place that needs a duration in JS (§6.4) reads it from `getComputedStyle(document.documentElement)` at the moment it is needed, not at bootstrap — that is what keeps §11.4 true. No duration literal is written in a `.ts` file, for the same reason none is written in a `.scss` file.

**Prerendering.** Every entrance runs from CSS present in the prerendered HTML and starts at parse time. Nothing waits on hydration; the reveal system's hidden state is gated on a class added _before_ first paint, with the `js-booted` net behind it (§4.2).

---

## 13. Verification

Four checks. Two are cheap and automated; two are done by a person in five minutes because no tool sees them honestly.

### 13.1 No `all`, no literal durations — Stylelint, blocking

The rule in §3.6 is worth nothing if `transition: all` reappears in six months. This is a linter configuration on the **source**, not a parser over built CSS:

- `declaration-property-value-disallowed-list`: `transition` and `transition-property` may not contain `all`.
- `declaration-property-value-allowed-list`: `transition-duration`, `transition-delay`, `animation-duration`, `animation-delay` and `animation-timing-function` accept only `var(--…)`, `calc(…)`, `0s` and `0ms` — everywhere except the token file.

The animated-property allowlist is `opacity`, `transform`, `translate`, `scale`, `rotate`, `visibility`, plus the three paint-only exceptions §3.6 names individually: `background-color`, `border-color`, `box-shadow`. **Those three are not compositor-safe and the list does not claim they are** — they repaint every frame, which is why they are an exception with a stated cost rather than an entry on a "safe" list.

`visibility` is allowed because it is discrete, animates in one step and triggers nothing; it is how the home curtain removes itself without JavaScript.

### 13.2 The caps hold — unit test on the tokens, blocking

The delays are `calc()` expressions, so no scan of built CSS can evaluate them. The test evaluates the arithmetic from the token values instead, which is where the numbers actually live:

```ts
it.each([
  ['list', STAGGER_LIST, CAP_LIST, MOTION_LEAD, MOTION_STATE],
  ['grid', STAGGER_GRID, CAP_GRID, 0, MOTION_ENTER],
])('%s cascade respects both caps', (_name, stagger, cap, lead, duration) => {
  expect(stagger * cap).toBeLessThanOrEqual(240);
  expect(lead + stagger * cap + duration).toBeLessThanOrEqual(550);
});
```

Paired with one template lint: `--reveal-index` and `--item-index` are only ever bound from `$index` or from the cascade service, never written as a literal. That is what makes the token arithmetic an upper bound rather than a hope.

### 13.3 Menu keyboard behaviour — component test, blocking

- Open the menu. `document.activeElement` is the burger or inside `#menu`; `.shell` reports `inert`.
- `Tab` from the last link in `#menu` lands on the burger. `Shift+Tab` from the burger lands on the last link in `#menu`. **Both directions, because `inert` provides neither** (§6.5).
- `Escape` closes and `document.activeElement` is the burger.
- Click a menu link: focus is not on `<body>` at any point, and after the navigation it is on `#contenu`.
- Open and close 100 ms apart: the panel settles at `translate: 100% 0`, one `Animation` object exists at most, and `inert` is removed from `.shell`.

Plus the axe-core suite (ADR-0010) run a second time with `prefers-reduced-motion: reduce` emulated, asserting only that every route is reachable and the menu opens and closes.

### 13.4 The two things a person checks

**Frames, on real content.** `/graphisme-3d`, warm cache, sixteen renders decoded, 4× CPU throttling, DevTools Performance. Record a menu open and close, a hover across four tiles, and `/developpeur` → `/graphisme-3d`. Pass: **one long frame at the start of the menu gesture is expected — that is the shell's layer being rasterized (§6.6) — and no long frame after it.** A long frame on every frame of the recession means the layer was never promoted. On the route change, the header and `theme-color` flip once, after the new page has covered the old one.

**The hero, by eye.** Load the home page at full size and watch the poster hand over to the video: if you can see the crossfade at all, the poster is not frame 0 of the delivered file. Watch the loop through two cycles: if you can see the seam, the encode is wrong. Then scrub to the brightest passage under the hook and read it. Three minutes, no tooling, and it catches what a per-frame luminance script would only quantify after the fact.

---

## 14. À valider avec Stéphane — To validate with Stéphane

Only the things that need his eye. Everything else above is settled by a measurement, an ADR or his own instruction.

**1. The menu — submitted as one question, because it is one gesture.** The current menu does four things at once: items travel their own full width (~320 px), on a 100 ms cascade, on `cubic-bezier(0, .43, .16, 1)` with its critically-damped settle, over a panel of its current width. **This document changes all four simultaneously** — 320 px → a provisional 64 px, 100 ms → 60 ms (a 40 % tighter cascade), the signature curve → `--ease-enter` (no settle, by design: §3.2 fences the signature to non-interruptible moves and the menu is the definition of interruptible), and the panel to `min(20rem, 75vw)`. Any one of those is a recalibration; together they are a different gesture, and presenting them as four independent line items was the previous draft's mistake.

**The travel is the biggest of the four and is deliberately not frozen.** `--motion-slide` ships at **4rem (64 px)**, a provisional midpoint. **Three values are to be compared in the browser before the token is fixed: 24 px, 64 px, 320 px** — the minimum that expresses rank, the midpoint, and what the site does today. Hold the other three at their new values, step through the distances, then try 80 ms and 100 ms on whichever wins. If it still does not feel like his menu, the signature curve is the next variable to put back, and §3.2 says what that costs on a reversal.

**2. The recession: 0.9 → 0.92, plus a scrim.** He named the navigation as what he likes, and this number defines how it feels. The scrim is an addition, not a recalibration — it makes the recession read as depth rather than as a zoom-out, and without it the effect is nearly invisible on the dark 3D page. Worth seeing side by side against the current site rather than argued. **Its presence on mobile is not open**: an earlier draft deleted it below 768 px, which removed the gesture precisely where most of a portfolio's traffic sees it. The panel narrows to 75 vw instead — 90 px of shell visible at 360 px, 14.4 px of edge travel (§6.2).

**3. The home entrance becomes a full wipe rather than a retraction to 50 %.** The gesture is preserved and its endpoint is not, because the media is now full-bleed. The hook's 360 px journey from viewport centre to half-panel centre is gone, replaced by a 16 px rise. Largest change to something he built, after the menu.

**4. The tile zoom: 1.2 → 1.04.** He framed these renders; at 1.2 the hover throws away 30 % of the frame area he composed. The argument is his to accept or reject.

**5. The route-transition direction: 3D rises, Developer falls.** An arbitrary convention that becomes non-arbitrary once it is consistent. If the opposite reads better to him, flipping costs nothing.

**6. The two pause controls.** WCAG 2.2.2 makes both mandatory and ADR-0010 puts 2.2.2 in scope, so the buttons exist; what is open is where they sit and how quiet they can be before they stop satisfying the criterion. The hero one should be seen on the real hero — it is the only chrome this document adds to a composition he already likes.

**7. The encode.** Three constraints land on him rather than on the code: the first 1.5 s of the loop slow enough that the poster crossfade is invisible, a clean loop seam, and a dark low-contrast region under the hook for the whole loop. No scrim rescues a bright, busy passage moving under a headline, and spec 06 §3.5 says the same from the colour side.

---

**One ADR needs a superseding note:** ADR-0012's "the video leaves the bundle and leaves autoplay behind". The bundle half stands; the autoplay half was reversed by Stéphane on 2026-08-31 and is now recorded in spec 02 and here.
