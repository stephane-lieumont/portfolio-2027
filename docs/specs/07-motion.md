# Spec 07 — Motion

This document sets the motion of the site: every duration, every curve, every distance, and the mechanism each animation is built on. It is the motion counterpart of spec 06 — same method, same two token tiers, same rule that components consume semantics and never literals.

**It is a recalibration, not a rewrite.** Stéphane's instruction on 2026-08-31: _« conserve les animations que j'avais précédemment intégrées car la navigation était cool. À toi de voir avec l'expert design si on ne peut pas le travailler un peu plus. »_ The audit reached the same conclusion independently — motion is "the most crafted part of the site, to recalibrate, not to remove". So the gestures of the current site are the starting material. What changes is their timing, the properties they animate, and what happens when the visitor has asked for less of it.

**What it freezes.** The duration and easing scales, the asymmetry rule, the cascade cap, the reveal mechanism, the off-canvas navigation, the home entrance and its background video, hover/focus/press timing, route transitions, and the `prefers-reduced-motion` variant of every one of them.

**What it leaves open.** Layout composition (spec 02), the exact copy of any label quoted here (spec 05), and the two colour tokens this document needs and spec 06 does not yet declare (`--scrim`, `--hero-scrim`) — flagged in §14.

> Interface labels quoted here stay in French. Everything else, token names included, is English.

**Every number in this document is justified where it appears.** A duration without a reason is an arbitrary duration, and this site has 29 of those today.

---

## 1. Philosophy

Four lines, and every decision below is downstream of them.

**The images are the product; the interface is the frame.** Motion exists to direct the eye toward a render, to say where a page went, and to confirm that a control was pressed. It is never the thing being looked at.

**On a portfolio, gratuitous animation reads as compensation.** A site that performs suggests content that cannot carry itself. Stéphane's renders carry themselves. The most expensive mistake this spec could make is to be impressive.

**Motion is a cost paid by the visitor in time.** Every millisecond of animation is a millisecond in which the content is not yet fully available. That is affordable when the movement carries meaning — where something came from, what is now behind — and indefensible otherwise. The current hero takes **1.2 s** to assemble itself; the visitor learns nothing during those 1.2 s.

**The reduced variant is a design, not a fallback.** `prefers-reduced-motion` is a real need, and the version it produces must be a considered version of the site, not the site with its animations deleted (ADR-0010).

---

## 2. Technique ladder — what builds what

ADR-0007 sets the order of preference and this document holds to it. Stated up front so no section has to re-argue it.

| Tier | Technique                      | Used here for                                                                                                                                                                      |
| ---- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | CSS `transition`               | Every hover, focus and press state. Every reversible state change.                                                                                                                 |
| 1    | CSS `@keyframes`               | One-shot entrances that are not state changes: the home curtain, the reveal, the carousel progress bar. **Nine keyframes total, down from 29** (§11).                              |
| 1    | `@starting-style`              | Elements that enter the DOM and must animate from a defined start without a class toggle or a double `requestAnimationFrame`: form errors, the confirmation block, the menu scrim. |
| 1    | `animation-timeline: scroll()` | Decorative SVG parallax only (§10.2). **Rejected for content reveals** — see §4.                                                                                                   |
| 2    | View Transitions API           | Route changes and the 3D lightbox opening from its tile (§9). `withViewTransitions()` is already provided in `app.config.ts`.                                                      |
| 3    | Web Animations API             | **Exactly one use: the off-canvas panel open/close** (§6.4), because a CSS transition cannot reverse in the time it has already spent.                                             |
| 4    | A library                      | **Not needed.** No animation library is added, and GSAP is not carried over.                                                                                                       |

**The conclusion on libraries, stated plainly so it is not re-litigated:** every animation in this document is expressible in tiers 1–3. GSAP's value on the 2022 site was timeline sequencing and a scroll plugin; the sequencing here is four staged offsets in CSS, and the scroll work is an `IntersectionObserver` plus one `scroll()` timeline. A ~70 kB dependency to replace roughly forty lines is not a trade this site can justify against ADR-0007's criterion 3.

---

## 3. Tokens

Two tiers, per ADR-0009 and spec 06 §1. **Primitives name values, semantics name roles, and no component writes a literal duration or curve.** A component with `transition: 200ms` in it is the same category of mistake as one with `#f2a154` in it.

### 3.1 Duration primitives — a √2 ladder

Six steps, anchored at **180 ms**, ratio **√2**, rounded to 5 ms.

√2 is chosen because it is the f-stop ratio: one step is a clearly perceptible change in speed without being a different animation, and two steps is a doubling — unmistakable. That gives a scale with enough resolution to express "a shade quicker" and enough spread to express "this is a different kind of movement", in six values instead of the current site's eighteen distinct durations.

| Token            | Value   | Position     | Rationale                                                                                                                                                                                                    |
| ---------------- | ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--duration-90`  | `90ms`  | anchor ÷ 2   | ~5.4 frames at 60 fps. The floor. Below this a transition stops reading as a transition and reads as a repaint, so nothing on this site is shorter.                                                          |
| `--duration-125` | `125ms` | anchor ÷ √2  | Leaving a hover state. Seven frames — enough for the first two to barely move, which is what makes it read as _released_ rather than _yanked_.                                                               |
| `--duration-180` | `180ms` | **anchor**   | The standard state change. Under ~100 ms a pointer-driven change reads as instant; over ~250 ms it reads as lag. 180 sits in the middle of that band.                                                        |
| `--duration-255` | `255ms` | anchor × √2  | An element entering with travel. At `--motion-rise` (16 px) this is 0.06 px/ms — slow in the absolute, correct in perception, because short travel needs time to register direction.                         |
| `--duration-360` | `360ms` | anchor × 2   | A full-height surface crossing the viewport. The off-canvas panel travels 320 px: 0.89 px/ms, at the settled end of the comfortable 0.8–1.6 px/ms band.                                                      |
| `--duration-510` | `510ms` | anchor × 2√2 | The two moves that sweep the whole viewport: the home curtain (1440 px of edge travel, 2.8 px/ms — fast, because the eye tracks an edge rather than waiting on a control) and the poster→video substitution. |

### 3.2 Easing primitives

Four curves. Linear is a fifth, and it has exactly one legitimate consumer.

| Token              | Value                              | Shape                                                                                                                                            |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--ease-enter`     | `cubic-bezier(0.33, 0.7, 0.35, 1)` | Moderate deceleration. **76 % of the distance at 38 % of the duration.** Finite initial slope, so it reverses cleanly.                           |
| `--ease-exit`      | `cubic-bezier(0.6, 0, 0.85, 0.4)`  | Acceleration out. **14 % of the distance at 51 % of the duration.** The element is released, then leaves; you do not watch it go.                |
| `--ease-state`     | `cubic-bezier(0.4, 0.15, 0.3, 1)`  | Gentle in-out. For changes with no travel — a fill, a border, an elevation. There is no arrival to sell, so there is nothing to decelerate into. |
| `--ease-signature` | `cubic-bezier(0, 0.43, 0.16, 1)`   | **Kept from the current site.** See the judgement below.                                                                                         |
| `--ease-linear`    | `linear`                           | One consumer: the carousel progress bar.                                                                                                         |

**Judgement on `cubic-bezier(0, .43, .16, 1)` — keep it, name it, and fence it.**

Sampled: it covers **41 % of the distance in 5.7 % of the duration**, **66 % in 18.5 %**, **86 % in 41 %**, and spends its final third travelling the last 3.6 %. That is a critically-damped settle — the curve you get from a mass arriving and stopping without overshoot. It is the reason the current site's staged moments feel deliberate rather than scripted, and it is worth keeping as a signature.

Its one real property, which is also its constraint: **the first control point sits at x = 0, so the initial slope is unbounded.** The animation starts at maximum velocity. Visually that is fine — the browser samples at the frame boundary — but it means the curve cannot be interrupted or reversed gracefully: by a third of the way through, 86 % of the distance is already spent, and a reversal from there looks dead.

**So: `--ease-signature` is allowed only on one-way, non-interruptible moves** — the home curtain, and nothing else by default. It is forbidden on anything a visitor can reverse mid-flight, which is why the off-canvas panel (§6) uses `--ease-enter` instead, and why that is an improvement rather than a loss.

**On linear.** A linear easing is normally the giveaway of unconsidered animation — nothing in the physical world starts and stops at constant velocity. The exception is when the animated value _is_ time. The carousel progress bar maps elapsed seconds to width; easing it would make it lie about how long is left. It keeps `linear`, and it is the only thing on this site that does.

### 3.3 Distance, stagger and scale primitives

| Token                 | Value    | px  | Rationale                                                                                                                                                                                                                      |
| --------------------- | -------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--motion-rise`       | `1rem`   | 16  | Reveal travel for a single block. Large enough to carry direction, small enough that the element never reads as flying in. Current site: 20 / 30 / 15 px, unrelated.                                                           |
| `--motion-rise-tight` | `0.5rem` | 8   | Reveal travel for members of a grid. Sixteen tiles each moving 16 px is sixteen simultaneous vectors; halving the distance halves the visual noise and keeps the cue.                                                          |
| `--motion-slide`      | `1.5rem` | 24  | Own-axis offset for an item inside a moving container (menu items). The container already delivers 320 px of travel; the item only needs enough offset to express its rank.                                                    |
| `--motion-lift`       | `2px`    | 2   | Card hover lift. `--elevation-2` already implies 8–16 px of height; the lift is the parallax cue, not the effect. Beyond 3 px a card's text visibly breaks alignment with its neighbours'.                                     |
| `--motion-press`      | `1px`    | 1   | `:active` displacement. Spec 06 §3.4 requires the pressed feeling to come from elevation and a 1 px translate rather than a value change that would drag contrast down.                                                        |
| `--stagger-list`      | `60ms`   | —   | Vertical lists of a few items (menu). Below ~50 ms adjacent items merge into one event; at the current site's 100 ms they read as separate arrivals. 60 ms is 3.6 frames — an offset the eye registers as order, not as delay. |
| `--stagger-grid`      | `40ms`   | —   | Grids of many items. Tighter because a grid has more members and the cap (§5) is the binding constraint.                                                                                                                       |
| `--stagger-cap`       | `6`      | —   | Maximum index a cascade may reach. See §5.                                                                                                                                                                                     |
| `--shell-scale`       | `0.92`   | —   | Page recession while the off-canvas menu is open. See §6.2 for why it moved from 0.9.                                                                                                                                          |
| `--zoom-media`        | `1.04`   | —   | Media hover zoom. See §8.3 for why it moved from 1.2.                                                                                                                                                                          |

### 3.4 Semantic tokens

The only layer components read.

| Semantic              | Primitive        | ms  | Job                                                     | Its exit              |
| --------------------- | ---------------- | --- | ------------------------------------------------------- | --------------------- |
| `--motion-press-dur`  | `--duration-90`  | 90  | `:active` feedback                                      | symmetric             |
| `--motion-exit-state` | `--duration-125` | 125 | Leaving a hover state                                   | —                     |
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

  /* ---- Distance, stagger, scale ----------------------------------------- */
  --motion-rise: 1rem;
  --motion-rise-tight: 0.5rem;
  --motion-slide: 1.5rem;
  --motion-lift: 2px;
  --motion-press: 1px;
  --stagger-list: 60ms;
  --stagger-grid: 40ms;
  --stagger-cap: 6;
  --shell-scale: 0.92;
  --zoom-media: 1.04;

  /* ---- Semantics — the only layer components read ------------------------ */
  --motion-press-dur: var(--duration-90);
  --motion-exit-state: var(--duration-125);
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

**Only `transform`, `translate`, `scale`, `rotate` and `opacity` are animated.** `width`, `height`, `top`, `left`, `flex-basis`, `margin` and `padding` trigger layout on every frame. The current home entrance animates `flex-basis` — that is the exact anti-pattern, and §8 replaces it.

Three properties are allowed by exception, each because it is paint-only and each named individually rather than by a blanket rule: `background-color`, `border-color`, `box-shadow`. They are what spec 06 §10 requires for state changes. `color` is never transitioned — spec 06 §10 gives the reason and it is a contrast reason, not a performance one: a 180 ms ramp between two compliant inks passes through inks that were never measured.

**Prefer the independent `translate` / `scale` / `rotate` properties over the `transform` shorthand.** They compose instead of overwriting. This is not stylistic: a card that has both a reveal rise and a hover lift needs two independent Y offsets on the same element, and with `transform` the second silently cancels the first. That collision exists on the current site by construction; using the independent properties removes the whole class of bug.

`transform` stays where a single composite is genuinely wanted and ordering matters (the burger bars, §6.3).

---

## 4. The reveal system

The current `.reveal` — `opacity: 0; transform: translateY(20px); transition: all .4s ease-out` with `.reveal--0…N` classes and a 200 ms step — is replaced by one directive and one pair of classes.

### 4.1 Scroll-scrubbed reveals are rejected, and this is deliberate

`animation-timeline: view()` is available and it is the fashionable answer. It is wrong here.

A scroll-scrubbed animation is not played, it is **scrubbed**: its progress is the scroll position. Stop scrolling halfway through the range — which is what reading is — and the element sits permanently at 40 % opacity. Text at 40 % opacity fails AA, and ADR-0010 states that every state keeps AA contrast. This is not a hypothetical edge case; it is the normal behaviour of someone reading the page.

**Content reveals are therefore time-based and one-shot, driven by `IntersectionObserver`. Scroll-scrubbed animation is reserved for decoration** (§10.2), where an element parked mid-range is `aria-hidden`, carries no information and has no contrast requirement. The line between the two is exactly the line between content and decoration.

### 4.2 A JavaScript failure must not hide the content

The current site declares `.reveal { opacity: 0 }` in CSS. If the script never runs, the site is blank. That is unacceptable on a prerendered site (ADR-0008) whose whole point is that the HTML is complete in the first response.

**The hidden state is gated on a class set before first paint, and the prerendered HTML is fully visible without it.**

```html
<!-- end of <head> in index.html -->
<script>
  document.documentElement.classList.add('js-motion');
</script>
```

```css
.reveal {
  /* nothing: visible by default, which is what a crawler and a no-JS visitor get */
}

.js-motion .reveal {
  opacity: 0;
  translate: 0 var(--motion-rise);
}

.js-motion .reveal.is-revealed {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity var(--motion-enter) var(--ease-enter),
    translate var(--motion-enter) var(--ease-enter);
  transition-delay: calc(var(--stagger-grid) * min(var(--reveal-index, 0), var(--stagger-cap)));
}

.js-motion .reveal--list.is-revealed {
  transition-delay: calc(var(--stagger-list) * min(var(--reveal-index, 0), var(--stagger-cap)));
}

.js-motion .reveal--grid {
  translate: 0 var(--motion-rise-tight);
}
```

If a Content Security Policy with a `script-src` directive is ever added at the nginx layer (ADR-0005), that inline one-liner needs a hash or a nonce. Noted here because it is the kind of thing that silently blanks a site months later.

### 4.3 The directive

Signals, host bindings, no `NgZone`, no manual change detection — the `IntersectionObserver` callback writes a signal and the host binding reads it.

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
  readonly index = input(0, { alias: 'appReveal' });
  readonly revealed = signal(false);

  private readonly element = inject(ElementRef<HTMLElement>);

  constructor() {
    if (typeof IntersectionObserver === 'undefined') {
      afterNextRender(() => this.revealed.set(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        this.revealed.set(true);
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    afterNextRender(() => observer.observe(this.element.nativeElement));
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
```

`threshold: 0.15` with `rootMargin: -10%` means an element starts revealing once 15 % of it has crossed 10 % above the viewport's bottom edge — early enough that the movement is finished before the element is being read, late enough that it is not revealing off-screen.

The observer disconnects on first intersection. Reveals are one-shot: an element that re-animates every time it scrolls back into view is the single most tiring pattern in this category.

---

## 5. Cascade capping

The measured problem: the hero takes **1.2 s** to compose (five elements at a 200 ms step); the six project cards span **900 ms** at a 150 ms step; the sixteenth 3D tile arrives **2.4 s** after the first.

Two numbers, both binding.

> **Cap A — the stagger span of a group never exceeds 240 ms.** Elements beyond `--stagger-cap` (6) share the sixth's delay.
>
> **Cap B — no group takes more than 550 ms from its first pixel moving to its last pixel settling**, including the container's own entrance.

**Why 240 ms.** A saccade-and-fixation cycle runs roughly 200–250 ms. A group whose members all arrive inside one fixation is perceived as a single event with an internal direction. Past that the eye has had time to move away and come back, and late arrivals stop reading as part of the group — they read as late. That is precisely what the sixteenth tile at 2.4 s does: by the time it appears, the visitor has already decided the gallery is finished.

**Why elements past the cap share a delay rather than getting their own.** The alternative — resetting the index per row — cannot be expressed in CSS on an `auto-fill` grid, because neither `nth-child` nor a custom property knows the resolved column count. Clamping is one `min()` and it is exact. In practice it rarely fires: an `IntersectionObserver`-driven cascade indexes elements as they enter, and only the elements above the fold on load form a large batch.

### What it produces

| Group                    | Today                 | Here                                                                                                           | Change                        |
| ------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Home hook readable       | 1200 ms               | **345 ms** (§8)                                                                                                | −71 %                         |
| Home fully composed      | ~1200 ms              | **510 ms**                                                                                                     | −58 %                         |
| Six project cards        | 900 ms (150 ms × 6)   | **455 ms** (40 ms × 5 stagger + 255 ms)                                                                        | −49 %                         |
| Sixteen 3D tiles         | 2400 ms (150 ms × 16) | **495 ms** for the first viewport; below the fold, each tile reveals on its own as it arrives — no wait at all | −79 % and unbounded → bounded |
| Off-canvas menu, 5 items | ~600 ms               | **530 ms**, and the last item lands 170 ms after the panel instead of 300 ms                                   | tighter wave                  |

---

## 6. The off-canvas navigation

This is the piece Stéphane named. It is preserved and raised, not replaced.

### 6.1 What is kept, verbatim in intent

1. **The page recedes while the menu advances.** This is the whole idea — it says the page is still there, behind. Nothing about it changes except its amount and one structural bug.
2. **The items arrive in a cascade, from the right.** Kept; retimed.
3. **The burger transforms in place into a cross**, with its round pastille filling behind it. Kept; regeometried and recoloured.

### 6.2 The `scale(.9)` trap, and how the effect survives it

`transform` on an element creates a containing block for its `position: fixed` descendants. The current site scales `main` and hosts the fixed menu panel inside it, so the "fixed" panel is positioned, scaled and offset relative to a shrinking box. The audit records the consequence: **the slightest failure and the links are unreachable.** `filter`, `backdrop-filter`, `perspective`, `contain: paint` and `will-change: transform` all create the same containing block, so this is a trap with five doors.

**The fix is structural, not defensive: the receding surface and the menu are siblings.**

```html
<body>
  <a class="skip-link" href="#contenu" [attr.inert]="menuOpen() || null">Aller au contenu</a>

  <div class="shell">
    <header class="site-header">
      <a class="brand" [attr.inert]="menuOpen() || null">…</a>
      <nav class="nav-desktop" [attr.inert]="menuOpen() || null" aria-label="Navigation principale">
        …
      </nav>
      <button class="burger" type="button" aria-controls="menu" [attr.aria-expanded]="menuOpen()">
        …
      </button>
    </header>
    <main id="contenu" tabindex="-1" [attr.inert]="menuOpen() || null">…</main>
    <footer [attr.inert]="menuOpen() || null">…</footer>
  </div>

  <div class="menu-scrim" aria-hidden="true" (click)="close()"></div>
  <nav id="menu" class="offcanvas" aria-label="Menu" [attr.inert]="!menuOpen() || null">…</nav>
</body>
```

`.shell` is what recedes. `#menu` and `.menu-scrim` are its siblings and are never its descendants. The trap cannot recur, because the geometry that caused it no longer contains the menu.

**One rule to keep it from coming back:** nothing inside `.shell` may host a fixed-position overlay. Overlays are siblings of `.shell`. That is one sentence in review and it is the whole guard.

**`<dialog>` + `showModal()` was the alternative and it lost.** The top layer is outside the containing-block chain by construction, and it brings the focus trap, `Escape`, inertness and `::backdrop` for free. It was rejected because `showModal()` makes everything outside the dialog inert — including the burger — so the single control that morphs from hamburger to cross would have to be split into two elements at identical coordinates, hidden and swapped at frame 0. The burger toggling in place is the thing Stéphane likes; trading it for machinery we get almost as cheaply from one `inert` attribute is the wrong trade. `inert` on the shell gives real focus containment: nothing outside the burger and the menu is focusable, so there is no trap to hand-write and no wrap-around to get wrong.

**Why 0.92 and not 0.9.** The recession's job is to say "this is behind now", and that is carried by the change, not by its size. At 0.9 on a 1440 × 900 viewport the page pulls 72 px off each side and 45 px off the top and bottom; the body background reads as a picture frame around the page, and a frame competes with the panel. At 0.92 the insets are 57.6 px and 36 px — legible as depth, not yet a border.

**The recession gains a scrim, which it does not have today.** A scale-down alone reads as a zoom-out, not as depth; on the 3D section, where the page is already `#252422`, it is close to invisible. The scrim is what makes the recession mean something, and it also gives the visitor an obvious place to click to close.

**Below `--md` the shell does not recede at all.** With the panel at 85 vw on a 360 px phone, 54 px of shell remains visible; a recession legible only inside a 54 px strip is cost without effect. On mobile the shell only dims.

**Panel width.** `--menu-width: min(20rem, 85vw)`. The current `max-width: 270px; width: 25vw` gives a **100 px panel at 400 px wide**, which is broken, and 270 px at `--text-body` holds about 22 French characters — tight for « Télécharger le CV » and « Graphisme 3D ».

```css
.offcanvas {
  --menu-width: min(20rem, 85vw);
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  inline-size: var(--menu-width);
  background: var(--surface-page);
  box-shadow: var(--elevation-3);
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
  transition-duration: var(--motion-panel);
  transition-timing-function: var(--ease-enter);
}

[data-menu='open'] .menu-scrim {
  opacity: 1;
  pointer-events: auto;
  transition-duration: var(--motion-panel);
  transition-timing-function: var(--ease-enter);
}

@media (min-width: 48rem) {
  [data-menu='open'] .shell {
    scale: var(--shell-scale);
  }
}
```

The transition is declared twice on purpose. **The declaration on the base rule governs the change _out_ of the state; the one on the state governs the change _into_ it.** That is the house idiom for asymmetry and it appears again in §8.

**Scroll lock.** While open, `body { overflow: hidden }` and `html { scrollbar-gutter: stable }` — the gutter reserved globally, so locking the scroll never shifts the layout by a scrollbar width. This is a step, not a transition; it is applied at open and removed at close.

### 6.3 The items and the burger

**Item cascade: 60 ms, not 100 ms; own-axis offset 24 px, not 100 %.**

At 100 ms, five items read as five separate arrivals. At 60 ms they read as one wave with a direction, which is what the effect is for. And the current items each translate their own full width — roughly 320 px — while the panel simultaneously carries them 320 px: the travel is doubled for no gain. `--motion-slide` (24 px) is enough to express rank.

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
  transition-delay: calc(110ms + var(--stagger-list) * var(--item-index));
}
```

The 110 ms head start is not arbitrary: at 110 ms of a 360 ms panel travel the panel is ~70 % of the way across under `--ease-enter`, so the items begin moving on a surface that has nearly arrived. Earlier and the items fight the panel; later and they read as a second event.

Sequence, five entries (Accueil · Développeur · Graphisme 3D · Contact · CV):

| Element               | Starts | Ends       |
| --------------------- | ------ | ---------- |
| Panel + scrim + shell | 0 ms   | 360 ms     |
| Item 1                | 110 ms | 290 ms     |
| Item 5                | 350 ms | **530 ms** |

530 ms total, inside Cap B, and the last item lands 170 ms after the panel instead of the current ~300 ms.

**On close, delays are zero and everything leaves together** at `--motion-dismiss`. A staggered exit is a decision the visitor has already made being replayed back at them.

**The burger.** Kept as a single control that morphs in place. Three corrections.

The current geometry rotates and translates by `35px, -35px` — a 35 px correction inside a 24 px icon, which is what you write when a rotation's origin is fighting the composite. With `transform-origin: center` and the translate applied before the rotation in a single `transform`, no correction is needed.

The current colours put the bars at `#f2a154` — **2.10:1 on white**, a straight 1.4.11 failure for a control's own boundary — over a `rgba(106,99,93,.2)` pastille. The bars stay `--text-primary` in both states and never change colour; **the pastille carries the state**, filling to `--accent-wash`. That also keeps the rule from spec 06 §10: never transition `color`.

The current pastille fades over 300 ms while the bars rotate over 200 ms — the same class of desync as the card hover (§8.2). One duration for both, with one deliberate exception.

```css
.burger {
  inline-size: 3rem; /* 48px — see below */
  block-size: 3rem;
  border-radius: var(--radius-pill);
  background: transparent;
  transition: background-color var(--motion-exit-state) var(--ease-exit);
}

.burger__bar {
  block-size: 2px;
  inline-size: 20px;
  background: var(--text-primary);
  border-radius: 1px;
  transform-origin: center;
  transition:
    transform var(--motion-exit-state) var(--ease-exit),
    opacity var(--motion-press-dur) var(--ease-exit);
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

**The one deliberate desync: the middle bar leaves over `--motion-press-dur` (90 ms) while the outer two travel over `--motion-state` (180 ms).** It has a reason — the middle bar must be gone before the outer two cross the space it occupies, or the cross is drawn through a third line. A desync with a stated reason is timing; a desync without one is the bug in §8.2.

**The burger is 48 px, not 44 px.** It sits inside `.shell` and therefore rides the recession: 48 × 0.92 = **44.16 px**, which still clears the 44 px target from spec 06 §10 in the open state. That is why the size is 48 and not 44, and it is why no counter-transform is needed.

**Open and close are symmetric.** The asymmetry rule in §7 governs elements entering and leaving; the burger is a control toggling between two resting states, and neither state is an arrival. It uses `--motion-state` both ways.

### 6.4 Interruption — the one Web Animations API use on the site

The menu must be interruptible: a visitor who opens it and immediately changes their mind should see it leave at the speed it arrived, not spend a full `--motion-dismiss` travelling the 30 % of distance it has left.

A CSS transition cannot do this. Reversed mid-flight it restarts from the current computed value and takes the **full** declared duration for whatever distance remains, which reads as sluggish exactly when the visitor is being decisive.

`Animation.reverse()` does it correctly — it plays back from the current time, so an interruption at 100 ms takes 100 ms to undo.

```ts
private animation?: Animation;

private toggle(open: boolean): void {
  if (this.animation) {
    this.animation.reverse();
  } else {
    this.animation = this.panel.nativeElement.animate(
      [{ translate: '100% 0' }, { translate: '0 0' }],
      {
        duration: open ? DURATION_PANEL : DURATION_DISMISS,
        easing: open ? EASE_ENTER : EASE_EXIT,
        fill: 'both',
      },
    );
  }
  this.animation.onfinish = () => { this.animation = undefined; };
  this.menuOpen.set(open);
}
```

**Zoneless.** The animation runs on the compositor and never re-triggers Angular rendering. Everything the template needs — `aria-expanded`, the `inert` attributes, the `data-menu` attribute, the burger's class — hangs off the `menuOpen` signal. Nothing reads the animation's state; the signal is the source of truth and the animation is a consequence. That is the discipline that keeps a JS-driven animation from needing change detection at all.

The durations and easings are read once from the computed style of `:root` into constants, so the tokens stay the single source and no literal reappears in TypeScript.

### 6.5 Focus and keyboard

- Focus containment comes from `inert`, not from a hand-written trap: while the menu is open, only the burger and the menu's own contents are focusable, so `Tab` cannot leave.
- `Escape` closes and **returns focus to the burger**. The burger is the element that opened the menu and it is still on screen, so there is no focus restoration to record.
- `aria-expanded` on the burger tracks `menuOpen()`. `aria-controls` points at the panel.
- A click on the scrim closes. The scrim is `aria-hidden` and has no keyboard equivalent, which is correct — `Escape` is the keyboard equivalent.
- The menu panel's links are `min-height: 2.75rem` per spec 06 §10, which is the current site's other gap: the collapsed menu's links have neither padding nor a minimum height.
- **`inert` is applied on open, before the animation starts, and removed on close, before it starts.** Never on `finished` — a visitor pressing `Tab` during a 360 ms animation must already be inside the menu.

### 6.6 Compositing note, and why this is safe on the 3D page

`.shell` on `/graphisme-3d` contains up to sixteen decoded renders. Scaling it means the compositor either re-rasterizes each frame (jank) or scales an existing texture (cheap).

**The shell only ever scales _down_, 1 → 0.92, never up.** Downsampling a raster is visually clean; upsampling is what looks soft. So promoting the layer and letting the compositor scale the texture is free and invisible here. If the recession ever became a scale-up, it would blur, and that is the reason it must not.

`will-change: transform` is applied to `.shell` and to `.offcanvas` **only while the menu is in flight**, added on open and removed on `finished`. A permanently promoted shell costs a viewport-sized layer at device pixel ratio — roughly 20 MB at 1440 × 900 on a 2× display — for the 99 % of the session in which nothing is moving.

> **`will-change` appears exactly twice in the entire stylesheet, and both occurrences are toggled.** That is auditable (§13) and it is the rule.

---

## 7. Asymmetry

> **Exits are one step down the duration ladder from their entrance. Dismissals are two.**

The asymmetry ratio and the duration scale are the same number, √2, which is why the rule needs no separate table of magic values: an exit is the next token down.

| Entrance           | ms  | Exit (general, ÷√2) | Dismissal (÷2) |
| ------------------ | --- | ------------------- | -------------- |
| `--motion-state`   | 180 | 125                 | —              |
| `--motion-enter`   | 255 | 180                 | —              |
| `--motion-panel`   | 360 | 255                 | **180**        |
| `--motion-curtain` | 510 | 360                 | —              |

**Why exits are faster.** An entrance has to be understood: where the element came from, what it relates to, that it has arrived. An exit has nothing to communicate — the decision is already made and the visitor's attention has already moved to whatever is behind. A slow exit is the interface holding the door.

**Why dismissals get two steps and not one.** A dismissal is not merely an element leaving, it is the visitor actively removing something they put there. The menu close and the lightbox close are the two cases. Anything slower than 180 ms in those moments reads as the interface arguing.

**Floor: nothing is shorter than `--duration-90`.** Below that a transition stops being perceived as a transition and becomes a repaint, at which point it is not doing the job the asymmetry rule exists to preserve.

**Scope.** The rule governs elements entering and leaving. It does not govern a control toggling between two resting states — the burger (§6.3), a checkbox, a theme switch — where neither state is an arrival and asymmetry would just make one direction feel broken.

---

## 8. The home entrance and the background video

### 8.1 The video is kept

Settled by Stéphane on 2026-08-31: the 3D video plays in the background of the home page, autoplaying, looping, muted. He finds it well integrated and it stays.

**This supersedes ADR-0012 on the autoplay point.** That ADR's "the video leaves the bundle and leaves autoplay behind" is now half correct: the file still leaves the bundle and is still served from MinIO through nginx with byte-range support, but the poster-and-click gate is dropped. ADR-0012 needs a superseding note; that is a separate edit, not this document's.

What is motion's business is the **substitution**: a poster paints immediately and carries the LCP; the video fades in when it can actually play.

### 8.2 Poster → video, without a jump

```html
<div class="hero__media">
  <img class="hero__poster" ngSrc="…" width="1920" height="1080" priority alt="" />
  @if (playVideo()) {
  <video
    class="hero__video"
    [class.is-playing]="videoReady()"
    muted
    loop
    playsinline
    preload="metadata"
    aria-hidden="true"
    tabindex="-1"
    disablePictureInPicture
    disableRemotePlayback
    (canplay)="onCanPlay($event)"
  ></video>
  }
  <div class="hero__scrim" aria-hidden="true"></div>
</div>
```

```css
.hero__media {
  position: relative;
  isolation: isolate;
}

.hero__poster,
.hero__video {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: center;
}

.hero__video {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-media-swap) var(--ease-state);
}

.hero__video.is-playing {
  opacity: 1;
}
```

**Duration `--motion-media-swap` (510 ms), easing `--ease-state`.** This is not a state change and not an entrance: it is one image being replaced by an image that should be the same image. Short crossfades between near-identical frames read as a flicker; long ones read as a dissolve, which is what we want — a substitution nobody notices. `--ease-state` avoids the hard start and stop that `linear` would give a luminance ramp.

**Five requirements that make the fade invisible.** The fade cannot be made safe in CSS alone; most of this is a constraint on the encode, which is Stéphane's side of the work.

1. **The poster is frame 0 of the delivered video**, extracted from the encoded H.264 after encoding — not a separately rendered still and not a different frame. Extracting it from the final file means it carries the encoder's own colour, not the render's.
2. **Same colour pipeline.** The poster goes through the ADR-0012 derivative pipeline (AVIF/WebP/JPEG). Both assets are tagged sRGB / BT.709 with matching range flags, or the fade passes through a visible colour shift. The check is numeric: **the mean luminance of the poster and of video frame 0 must agree within 2 %.** Beyond that the crossfade reads as a flash.
3. **Identical box, fit and position.** Both elements are absolutely positioned in the same box with the same `object-fit: cover` and the same `object-position`. A geometric mismatch during a crossfade is far more visible than a luminance mismatch, and it is the easier mistake to make.
4. **`play()` is called one frame before the fade begins, from `currentTime = 0`.** During a 510 ms fade the video advances about 15 frames, so the crossfade is between the poster and frame 15, not frame 0. That is invisible if — and only if — **the first 1.5 s of the loop carries no fast luminance change.** This is an encoding constraint and it should be stated to whoever cuts the loop.
5. **The loop seam is a cut the visitor sees repeatedly.** `loop` restarts at 0; if the last frame does not match the first, there is a visible jump every cycle. That is motion the design did not ask for and it is more damaging than anything in this document, because it repeats. The encode must be seamless.

### 8.3 When the video is not loaded at all

**The `<video>` element carries no `src` in the markup.** With prerendering (ADR-0008) a `src` in the static HTML starts the fetch before any script runs, which defeats every condition below.

```ts
readonly playVideo = computed(() =>
  !this.reducedMotion() && !this.saveData() && !this.slowConnection(),
);
```

- `reducedMotion()` — `matchMedia('(prefers-reduced-motion: reduce)')`, read into a signal and **kept live** through a `change` listener. A visitor who toggles the OS setting gets the change without a reload.
- `saveData()` — `navigator.connection?.saveData === true`.
- `slowConnection()` — `navigator.connection?.effectiveType` in `slow-2g`, `2g`, `3g`.

In all three cases **the poster stays and nothing else happens.** This is the clearest example in the document of the ADR-0010 principle that the reduced version must be usable and not degraded: a still 3D render behind the hook is not a fallback, it is a legitimate composition — and on the current site it is what a visitor on a slow connection gets anyway, after waiting 2.88 MB for it.

`navigator.connection` is unavailable in Safari and Firefox; both optional chains resolve to `undefined` and the video loads. That is the correct default — the API's absence is not evidence of a slow connection.

### 8.4 The video is decorative, but WCAG 2.2.2 still applies

`aria-hidden="true"`, `tabindex="-1"`, no controls, `pointer-events: none`. It is never in the tab order and never announced (ADR-0011).

**A pause control is nonetheless mandatory, and this is an arbitration.** WCAG 2.2.2 (Pause, Stop, Hide) is level A and applies to any automatically moving content that runs longer than five seconds _and is presented in parallel with other content_. A looping video under the hero text is exactly that case, and 2.2.2 is about distraction, not about semantics — marking the video `aria-hidden` does not exempt it. ADR-0010 targets WCAG 2.2 AA, so the criterion is in scope and it wins over a clean hero.

The resolution: **the video is not focusable; its control is.** A single quiet button in the hero's lower corner, permanently visible (not hover-revealed — an affordance nobody can see does not satisfy 2.2.2), labelled « Mettre l'animation en pause » / « Reprendre l'animation », `--text-meta` on the scrim, 44 × 44 px. Its state persists in `sessionStorage` so a visitor who paused does not have to pause again on their next visit within the session. It is not rendered at all when `playVideo()` is false, because there is nothing moving to pause.

### 8.5 Text legibility over the video

The hero text has to hold against **every** frame, not against the poster. Three layers of defence, and all three are needed:

1. **A scrim, static, not animated.** A gradient weighted toward the text: heavier where the hook sits, clearing toward the opposite edge so the render is not uniformly muddied.

   ```css
   .hero__scrim {
     position: absolute;
     inset: 0;
     background: var(--hero-scrim);
     pointer-events: none;
   }
   ```

   Starting value, to be measured against real frames: `linear-gradient(to right, hsl(20 10% 2% / 0.72) 0%, hsl(20 10% 2% / 0.45) 45%, hsl(20 10% 2% / 0.15) 100%)`, over a flat floor of `hsl(20 10% 2% / 0.35)`. The token belongs in spec 06 (§14).

2. **The hero is a `data-theme="dark"` island.** It sits on a dark scrim on an otherwise light page, so its text uses the dark theme's semantics — that is exactly the mechanism spec 06 §9.1 describes, and it costs one attribute. This has a motion consequence, in §8.6.

3. **A constraint on the encode.** No scrim rescues a headline from a bright, busy passage moving underneath it. The region of frame the hook occupies must stay dark and low-contrast for the whole loop. This is a shot decision, not a CSS decision, and it is the one that actually determines whether the hero works.

**Verification is per-frame, not per-poster:** sample the loop every 250 ms, composite the scrim, and measure the text's contrast against the worst frame. The worst frame is the one that has to clear 4.5:1, not the average.

### 8.6 The entrance, rewritten in `transform`

The current entrance is `.homepage--loading .homepage__leftside { flex-basis: 100% }` retracting to 50 % over `.45s cubic-bezier(0,.43,.16,1)`, the right panel fading in, and the portrait translating over `all 1s`. Three problems, in order of severity:

- **`flex-basis` triggers layout on every frame** — the exact property class §3.6 forbids, on the page that also holds the LCP media.
- **`all 1s`** means the page is not settled for a full second, and `all` will transition anything that happens to change, including properties nobody intended.
- **The `--loading` class is removed by JavaScript**, so the entrance is gated on hydration. On a prerendered site that is a gate with no reason to exist.

**The gesture that is preserved:** a solid surface covers the viewport, and its right edge sweeps leftward to uncover the media.

**What changes, and why:** the media is now full-bleed rather than confined to a right-hand half, so the same sweep runs to completion instead of stopping at 50 %. The layout is final from frame 0 — the hook does not travel from the centre of the viewport to the centre of a half-panel, because that 360 px journey was a side effect of the `flex-basis` animation rather than an intention, and it is the part that cost the layout. In its place the hook gets a 16 px rise on the signature curve: an echo of the original, not a re-enactment of it.

```css
.hero__curtain {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--surface-letterbox);
  transform-origin: left center;
  pointer-events: none;
  animation: home-curtain var(--motion-curtain) var(--ease-signature) both;
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

.hero__content {
  z-index: 2;
}

.hero__content > * {
  opacity: 0;
  translate: 0 var(--motion-rise);
  animation: hook-rise var(--motion-enter) var(--ease-signature) both;
  animation-delay: calc(90ms + var(--stagger-list) * var(--item-index, 0));
}

@keyframes hook-rise {
  to {
    opacity: 1;
    translate: 0 0;
  }
}

@media (max-width: 47.999rem) {
  .hero__curtain {
    display: none;
  }
}
```

**The curtain is painted in `--surface-letterbox` (`#12100f`), not in the page colour.** This matters and it is not a detail: the hook is light ink because it sits on a dark scrim (§8.5). A white curtain would force the ink to change colour halfway through the entrance — a colour transition mid-animation, which spec 06 §10 forbids and which would look wrong regardless. A dark curtain means **the ink never changes**, and the hook is readable from the first frame it is painted.

**Sequence**

| t              | What                                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 0 ms           | Poster painted. Scrim at rest. Curtain covers the viewport. Hook at opacity 0, 16 px low.                                         |
| 0 → 510 ms     | Curtain `scale: 1 1 → 0 1`, origin left, `--ease-signature`. The media uncovers right to left.                                    |
| 90 → 345 ms    | Hook rises and fades, `--motion-enter`, `--ease-signature`. **Readable at 345 ms.**                                               |
| 150 → 405 ms   | « Profil dev » / « Profil 3D », one `--stagger-list` behind.                                                                      |
| 510 ms         | Curtain `visibility: hidden`. No JavaScript involved.                                                                             |
| network-driven | Video `canplay` → `play()` → 510 ms crossfade. Independent clock; it may land at 400 ms or at 4 s and the entrance is unaffected. |

**1200 ms to a readable hook becomes 345 ms.** That is the headline number of this section.

**The entrance never waits.** It is a CSS animation on an element present in the prerendered HTML, so it starts at parse time, before hydration and before the video decides anything. If the poster has not decoded, the curtain uncovers ADR-0012's dominant-colour placeholder — which is strictly better than delaying, and it is why the entrance is not gated on `load`.

**On LCP.** The poster is occluded by the curtain for up to 510 ms. Chrome's LCP excludes elements at `opacity: 0` but does not test for occlusion by later-painted siblings, so the poster's paint time should still be recorded. **Verify this with a real Lighthouse run rather than trusting the paragraph** — and if it does cost, the contingency is already in the CSS above: the curtain is desktop-only, and mobile is where the metric is scored.

**Below `--md` there is no curtain.** A horizontal wipe on a 360 px viewport is a 360 px sweep in 510 ms across a single-column layout that has nothing to uncover. The hook keeps its rise; that is the whole entrance on a phone, and it is enough.

---

## 9. Route transitions and the lightbox

The current site has none: the route changes instantly and the new page's `.reveal` replays. That is not a neutral choice — it means nothing distinguishes "the page changed" from "the page repainted", which is exactly what the light → dark section boundary needs to communicate.

`withViewTransitions()` is already provided. What follows is what to do with it.

### 9.1 Configuration

```ts
provideRouter(
  routes,
  withComponentInputBinding(),
  withViewTransitions({ skipInitialTransition: true }),
);
```

`skipInitialTransition: true` is explicit: on first load there is no outgoing view, and animating from nothing delays the first paint of a prerendered page for no gain.

**Cross-document view transitions (`@view-transition { navigation: auto }`) are rejected.** They would apply only to hard navigations — entry loads and links opened outside the app — because the router intercepts everything else. Maintaining a second set of transition styles, kept in sync with the first, for the one case where nothing needs transitioning, is cost with no visible return.

**A hard navigation therefore has no transition, and that is correct.** Nobody should chase it.

### 9.2 The default: a crossfade, tuned

The UA default is a 250 ms crossfade with a fixed easing. Override it so it obeys the tokens and the asymmetry rule.

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

125 ms out, 255 ms in, overlapping. A crossfade rather than a slide because the LCP of most routes is a large render: a slide moves that raster across the whole viewport every frame, and a crossfade animates opacity on two snapshot layers, which the compositor does for free. A slide would also imply a spatial relationship between two routes that do not have one.

### 9.3 Crossing the theme boundary

Developer (light, `#ffffff`) → 3D (dark, `#252422`) is the one navigation where a crossfade is wrong, and the reason is measurable rather than aesthetic.

**A crossfade between a white page and a dark page passes through a mid grey, with two sets of text at partial opacity over it.** Neither clears AA at any point in the middle. Spec 06 §3.4's rule is that every state clears its target; a crossfade has no states, only unmeasured intermediates.

**So a theme-crossing navigation does not blend — the incoming page slides over the outgoing one, which stays opaque and static beneath it.** Nothing is ever semi-transparent over anything.

Direction carries meaning: **the dark section rises over the light one; leaving it, the dark page falls away.** Reciprocal, and it tells you which way you moved in the site.

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

`translate` on a snapshot layer, not `clip-path` — a snapshot is compositor-only and `clip-path` would work, but §3.6 has one allowlist and it does not need an exception here.

**Setting `data-vt`.** It is written on `<html>` **before** the navigation, from the route's own `data` (`data: { theme: 'dark' }`), by comparing outgoing and incoming routes on `NavigationStart`, and cleared on `transition.finished`. Not from `onViewTransitionCreated`, which fires after `startViewTransition` and races the pseudo-element styling.

**The header and `<meta name="theme-color">` flip when the new page covers the old one, not before.** Spec 06 §9.3 drives both from one `IntersectionObserver` signal; during a route transition that observer has nothing to observe yet, so the flip is driven by the same route data on `finished`. Otherwise the visitor gets a dark header over a still-light page for 360 ms — the audit's defect no. 5 reappearing in a new costume.

**`view-transition-name` must be unique in the document at any moment.** A duplicate silently aborts the whole transition. With route reuse and prerendering this is a live footgun; §13 makes it a checked assertion.

### 9.4 The 3D lightbox opening from its tile

This is the one place where View Transitions earn their keep rather than being a nicer crossfade. Spec 01 makes the lightbox a real route (`/graphisme-3d/<slug>`), so it is a router navigation and `withViewTransitions()` already wraps it.

```css
::view-transition-group(tile) {
  animation-duration: var(--motion-panel);
  animation-timing-function: var(--ease-enter);
}
```

The browser interpolates the tile's rect into the lightbox's rect. Duration `--motion-panel` (360 ms): the travel is large — typically 300 px of translation and a 3× scale — and it is the site's one genuinely spatial transition, so it is worth reading.

Four details without which it does not work:

- **The name is set on one element at a time.** Sixteen permanently named tiles means sixteen snapshot layers on _every_ transition on the page, including ones that have nothing to do with the gallery. The clicked tile's image gets `view-transition-name: tile` from a signal (`[style.view-transition-name]`), and the lightbox image carries the same name. One name, one pair.
- **`view-transition-name` takes a `<custom-ident>`.** A bare slug beginning with a digit is invalid and silently kills the transition. The static name `tile` sidesteps it entirely, which is the other reason for the single-name approach.
- **On close, the tile must be in the viewport before the reverse transition starts.** If the visitor keyboard-navigated to image 12 and closes, the group animates toward an off-screen rect and the lightbox appears to fly away into nothing. The originating tile is scrolled into view with `behavior: 'instant'` inside the update callback, before the snapshot is taken. This is the same element focus returns to (spec 01), so it has to be on screen regardless.
- **The rest of the page crossfades to the lightbox scrim** on the `root` pseudo-element as usual; only the tile is grouped.

Focus trap, `Escape`, focus return and keyboard navigation between images are spec 01's requirements and are unaffected by the transition — they are driven by the route and by `inert`, not by the animation.

---

## 10. Everything else that moves

### 10.1 Hover, focus and press

All of this obeys spec 06 §3.4 and §10. Motion's contribution is the timing and the asymmetry idiom.

**Gate.** Every hover rule sits inside `@media (hover: hover) and (pointer: fine)` (ADR-0011). Hover adds polish and never information.

**The asymmetry idiom**, once, as the house pattern:

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

The base rule times the exit; the state rule times the entrance. 180 ms in, 125 ms out.

**`:active` is the shortest duration on the site, at 90 ms, and deliberately so.** Press feedback is a causality signal. Anything above roughly 100 ms stops reading as "I pressed that" and starts reading as lag, which is the one perception a portfolio cannot afford on its own buttons.

**Three properties are never transitioned.**

- **`outline`.** The focus ring appears on frame 1. A ring that fades in over 180 ms is a focus indicator that is not yet an indicator when a fast keyboard user has already moved on (WCAG 2.4.7, 2.4.11).
- **`color`.** Spec 06 §10, for contrast reasons.
- **`all`.** It transitions whatever happens to change, including properties nobody chose, and on several engines it includes `outline`, which reintroduces the previous point through the back door. The current site writes `all .2s ease-in-out` on buttons and `all .4s` on reveals. Both go, and §13 checks for it.

**Links** therefore have no hover transition at all: their ink and underline both step. That is correct, not lazy — a 180 ms ramp between two measured inks passes through inks that were never measured, and the underline already carries the state without colour (spec 06 §10.2).

**The skip link appears instantly.** `transform: translateY(-200%)` → `none` with no transition. A skip link that slides in over 255 ms is a skip link that delays exactly the visitor it exists for.

### 10.2 The two hover desyncs the audit found

**Project card — background `.3s`, title and hashtags `.15s`.** The content arrives twice as fast as the ground it sits on, which is visible and reads as a mistake because it is one.

Most of it disappears by design: ADR-0010 puts title, technologies and year **visible at rest**, so there is no content to reveal on hover. What remains is elevation and a lift.

```css
.card {
  transition:
    box-shadow var(--motion-exit-state) var(--ease-exit),
    translate var(--motion-exit-state) var(--ease-exit);
}

@media (hover: hover) and (pointer: fine) {
  .card:hover {
    box-shadow: var(--elevation-2);
    translate: 0 calc(var(--motion-lift) * -1);
    transition-duration: var(--motion-state);
    transition-timing-function: var(--ease-state);
  }
}
```

> **Within one component, every hover transition shares one duration.** If two properties seem to need different durations, one of them is wrong. The only exception in this document is the burger's middle bar (§6.3), which has a stated geometric reason.

This supersedes the literal `200ms` in spec 06 §10.4, which that section defers to this one.

**3D tile — `img { transform: scale(1.2) }` with no transition declared on the image's transform.** The result is an instantaneous jump on hover, and it collides with the reveal, which animates `scale(1.2) → scale(1)` on the same element. Two animations, one property, opposite directions.

Three corrections:

1. **The reveal drops its scale entirely.** Sixteen tiles each scaling as they appear is noise; opacity plus `--motion-rise-tight` carries the arrival. This also ends the collision at its source.
2. **The hover zoom moves to the image and gets a declared transition**, at `--motion-enter` with `--ease-enter`. It is travel, so it decelerates.
3. **1.2 becomes 1.04.** At 1.2 the visible crop loses **17 % of the frame** — on a render whose composition is Stéphane's, that is a re-crop the author did not make, and it contradicts ADR-0012's rule that renders are not cropped by CSS. At 1.04 on a 320 px tile the edges travel 12.8 px: legible as a response, no meaningful loss of frame, and no resolution penalty at the served widths.

```css
.tile__media {
  overflow: hidden;
  border-radius: var(--radius-md);
}

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

`:focus-within` is included so a keyboard user gets the same affordance. The overlay, if any, shares the same duration — one component, one duration.

**Social icons.** Rest `opacity: .2` is not a hover problem, it is a contrast failure: a link at 20 % opacity does not clear 3:1 against anything. Rest goes to `--text-secondary` at full opacity. Hover steps the ink to `--text-accent` (a step, not a transition — §10.1) and transitions `scale` to 1.08 over `--motion-state`. The 1.1 of the current site on a 24 px icon is 2.4 px of growth; 1.08 is 1.9 px, which is the difference between a nudge and a pop on an element that small.

### 10.3 Decorative SVG shapes

The audit notes they sit at absolute positions with inline `animation-delay` and **do not move on scroll**, which makes them read as stuck to the glass.

This is the one place scroll-scrubbed animation is right: the shape is `aria-hidden`, carries no information, has no contrast requirement, and parking mid-range is a valid resting state.

```css
.deco {
  animation: deco-drift linear both;
  animation-timeline: scroll(root block);
}

@keyframes deco-drift {
  to {
    translate: 0 -8vh;
  }
}
```

`linear` is correct here for the same reason as the progress bar: the animated value is scroll position, and easing it would decouple the shape from the page it is supposed to be parallaxing against.

Per ADR-0011 the shapes are `aria-hidden="true"`, not focusable, and **never over text** — the current triangle covers the home `<h2>` and the Specialties heading. Under reduced motion, `animation: none`; the shapes still paint, because they are part of the composition, they just do not drift.

### 10.4 Carousel progress bar

Currently `height: 3px; background: #f2a154; opacity: .5` with `transition-property: width` and `linear`.

- **`width` becomes `scale` on the X axis**, `transform-origin: left`. `width` is layout; this bar runs continuously for the whole time a slide is showing, so it is the most expensive animation on the site per second of screen time.
- **`linear` stays.** The value is elapsed time; see §3.2.
- **`opacity: .5` on `--accent` goes.** It conveys time remaining, which is state, so spec 06 §3.4 applies: full opacity, `--accent-rim` on light (3.17:1) and `--accent` on dark (7.39:1), 4 px tall rather than 3.
- **A pause control is required** for the same WCAG 2.2.2 reason as the hero video (§8.4).

```css
.carousel__progress {
  block-size: 4px;
  background: var(--accent-rim);
  transform-origin: left center;
  animation: carousel-progress var(--slide-interval) var(--ease-linear) both;
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

### 10.5 Form feedback, lightbox chrome, submission state

**Field errors.** No shake — a shake is an attention grab that adds nothing to a message that is already announced. `opacity` plus a 4 px rise, `--motion-enter`, `--ease-enter`, using `@starting-style` so the element animates on insertion without a class toggle:

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

The `aria-describedby` link and the live announcement are spec 02's business and are unaffected by the animation — the message is announced whether or not it moved.

**The confirmation block** uses the same pattern and the same durations.

**Submission state.** Spec 06 §10.1 settles it: the button keeps its full primary appearance, gains `aria-busy="true"` and swaps its label to « Envoi en cours… ». **The label is the indicator.** No spinner is specified, which means there is no rotation to have an opinion about and nothing to disable under reduced motion.

**The lightbox itself** enters at `--motion-panel` and dismisses at `--motion-dismiss` (§7), scrim on `opacity`, chrome on `opacity`. The tile morph (§9.4) is the entrance when it is opened from a tile; when the URL is hit directly there is nothing to morph from and it simply renders.

### 10.6 The keyframe inventory

> **`@keyframes` is for motion that is not a state change. A hover is a transition; a curtain is an animation.**

That line takes 29 keyframes down to nine.

| Keyframe              | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| `hook-rise`           | Home hook and entry buttons (§8.6)                      |
| `home-curtain`        | Home entrance wipe (§8.6)                               |
| `deco-drift`          | Decorative parallax (§10.3)                             |
| `carousel-progress`   | Carousel bar (§10.4)                                    |
| `vt-out` / `vt-in`    | Default route crossfade (§9.2)                          |
| `vt-rise` / `vt-fall` | Theme-crossing route transition (§9.3)                  |
| `reveal-rise`         | Kept only for the no-`IntersectionObserver` path (§4.3) |

Everything else is a `transition`.

---

## 11. `prefers-reduced-motion`

The current site has **no `@media (prefers-reduced-motion)` anywhere**, on a site with cascades running to 2.4 s. ADR-0010 requires it, and requires the result to be usable and not degraded.

### 11.1 The mechanism: redefine semantics, not components

The reduced variant is expressed the same way a theme is (spec 06 §9): **the semantic tokens are redefined in one block, and no component rule is touched.** One place to read, nothing to forget, and no component can opt out by accident.

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

    /* Cascades collapse: the group arrives as a group. */
    --stagger-list: 0ms;
    --stagger-grid: 0ms;

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

**`* { animation-duration: 0.01ms !important }` is the anti-pattern and it is not used here.** It flattens staged sequences into simultaneous jumps, removes the feedback that tells a visitor a control responded, and produces exactly the degraded version ADR-0010 forbids.

### 11.2 What each animation becomes

Redefining tokens covers most of it. Six animations need a different _form_, not just a shorter duration, and they get targeted rules.

| Animation          | Full                                            | Reduced                                                                                                                                                        |
| ------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scroll reveal      | opacity + 16 px rise, 255 ms, staggered         | opacity only, 125 ms, **no stagger** — the group appears as a group                                                                                            |
| Home curtain       | 510 ms wipe                                     | **not painted** (`display: none`); the hero is in its resting state at frame 0                                                                                 |
| Hero video         | autoplays, 510 ms crossfade from the poster     | **never fetched** (§8.3); the poster is the hero, and it is a complete one                                                                                     |
| Off-canvas open    | panel slides, shell recedes 0.92, items cascade | panel appears over 125 ms on opacity; **the shell does not scale**; scrim fades; items appear with the panel. `Escape`, `inert` and focus return are identical |
| Burger morph       | rotate ±45°, pastille fills                     | the icon **swaps glyph** — hamburger to cross — over a 90 ms opacity crossfade. Still an unmistakable state change, with no rotation                           |
| Card hover         | elevation + 2 px lift                           | elevation only, 180 ms. The hover still visibly responds                                                                                                       |
| Tile hover         | image scale 1.04                                | overlay only; the image does not move                                                                                                                          |
| Route transition   | slide on theme crossings, crossfade otherwise   | 90 ms opacity crossfade on `root`; **no `vt-rise` / `vt-fall`**, no group morph                                                                                |
| Lightbox from tile | 360 ms rect morph                               | 125 ms opacity fade, in place                                                                                                                                  |
| Carousel           | autoplays, progress bar runs                    | **autoplay off**, bar not painted; manual controls only. WCAG 2.2.2 makes this the right default anyway                                                        |
| Decorative shapes  | scroll parallax                                 | `animation: none`. The shapes still paint — they are composition, not motion                                                                                   |
| Form error         | opacity + 4 px rise                             | opacity only. Announcement unchanged                                                                                                                           |

```css
@media (prefers-reduced-motion: reduce) {
  .hero__curtain {
    display: none;
  }
  .deco {
    animation: none;
  }
  .burger__bar {
    transition: opacity var(--motion-press-dur) var(--ease-state);
  }
  html[data-vt] ::view-transition-old(root),
  html[data-vt] ::view-transition-new(root) {
    animation-name: vt-out, vt-in;
    animation-duration: var(--motion-page);
  }
  ::view-transition-group(tile) {
    animation: none;
  }
}
```

### 11.3 Two rules that make the reduced version a design

> **Reduced motion removes travel, not feedback.** Every state change still has a visible transition; it simply has no vector. A visitor who has asked for less motion has not asked to stop knowing whether their click landed.

> **Nothing is slower in the reduced variant than in the full one.** Every duration above is less than or equal to its counterpart. A reduced variant that lingers is a reduced variant nobody wants.

### 11.4 It must be live

The preference is read into a signal through a `matchMedia` `change` listener, not sampled once at bootstrap. A visitor who toggles the OS setting sees the change without reloading — which matters most for the hero video, where the setting decides whether a multi-megabyte file is fetched at all.

CSS handles its own half automatically. The JavaScript half — the video gate (§8.3), the WAAPI menu durations (§6.4) and the view-transition types (§9.3) — reads the signal.

---

## 12. Implementation contract

Short, because most of it is stated in place.

**Zoneless.** A compositor-driven animation never re-triggers Angular rendering, and nothing in this document relies on it doing so. Where animation state has to reach the template it goes through a signal, and the template reads it through a host binding or an ordinary binding: `menuOpen()` (§6.4), `revealed()` (§4.3), `playVideo()` / `videoReady()` (§8.2), `reducedMotion()` (§11.4). **The signal is the source of truth and the animation is a consequence, never the reverse.** No `NgZone`, no `markForCheck`, no reading of `Animation.currentTime` to decide what to render.

**Tokens in TypeScript.** The three places that need a duration in JS (§6.4) read it once from `getComputedStyle(document.documentElement)` at bootstrap into constants. No duration literal is written in a `.ts` file, for the same reason none is written in a `.scss` file.

**Prerendering.** Every entrance in this document runs from CSS present in the prerendered HTML and starts at parse time. Nothing waits on hydration, and nothing is gated on a class that JavaScript adds after the fact — except the reveal system's `is-armed` state, which is gated on a class added _before_ first paint by an inline script (§4.2), specifically so that the failure mode is "visible with no animation" rather than "blank".

---

## 13. Verification

Five checks. Three run in CI; two are manual because no tool sees them.

### 13.1 The animated-property allowlist — automated, blocking

The rule in §3.6 is worth nothing if a `transition: all` reappears in six months. A test parses the built CSS and fails on any violation. This is cheap, exact, and it is the check that keeps the whole document from eroding.

```ts
const ALLOWED = new Set([
  'opacity',
  'transform',
  'translate',
  'scale',
  'rotate',
  'background-color',
  'border-color',
  'box-shadow',
  'visibility',
]);

it('animates only compositor-safe properties', async () => {
  const css = await readBuiltCss();
  const animated = collectTransitionAndKeyframeProperties(css);

  expect(animated.filter((p) => p === 'all')).toEqual([]);
  expect(animated.filter((p) => !ALLOWED.has(p))).toEqual([]);
});
```

`visibility` is on the list because it is discrete, animates in one step and triggers nothing; it is how the home curtain removes itself without JavaScript.

### 13.2 The cascade cap — automated, blocking

Same pass over the built CSS:

- No `transition-delay` or `animation-delay` literal above **240 ms**.
- No `--reveal-index` or `--item-index` value above **6** in any template.
- The token arithmetic holds: for every group, `container duration + stagger × cap + item duration ≤ 550 ms`. Derivable from the tokens, so the test asserts the tokens.

### 13.3 `will-change` census and `view-transition-name` uniqueness — automated

- `will-change` appears **exactly twice** in the stylesheet, on `.shell` and `.offcanvas`, and both are inside a state selector rather than a base rule.
- A development-mode assertion fails loudly on a duplicate `view-transition-name` in the document, because the browser's own failure mode is to abort the transition silently.

### 13.4 Focus and reduced motion — automated

- Open the menu: `document.activeElement` is inside `#menu` or is the burger. Press `Tab` twenty times: it never leaves. `<main>` reports `inert`.
- Press `Escape`: the menu closes and `document.activeElement` is the burger.
- Open and close at 100 ms: the panel settles at `translate: 100% 0` and every `inert` attribute is removed.
- Run the axe-core suite (ADR-0010) a second time with `prefers-reduced-motion: reduce` emulated, asserting that every route is still reachable, the menu still opens and closes, and **no element finishes with a non-identity transform**.

### 13.5 60 fps on real content — manual, and it has to be

No automated tool measures this honestly. The method is specified so the result is comparable between runs.

**Scene: `/graphisme-3d`, warm cache, all sixteen renders decoded**, 4× CPU throttling, DevTools Performance. Not an empty page and not a cold cache — real pixels are the point, and the 3D page is the worst case by construction.

Record three interactions:

1. **Menu open and close.** Pass: no frame over 16.7 ms in the Frames track. With Paint flashing on, `.shell` shows **no repaint** during the recession — if it repaints, the layer was not promoted and the scale is being re-rastered every frame.
2. **Tile hover, then move across four tiles.** Pass: no frame over 16.7 ms; exactly one promoted layer at a time.
3. **Route change `/developpeur` → `/graphisme-3d`.** Pass: the transition completes in one animation frame budget per frame, and the header and `theme-color` flip only once the new page has covered the old one.

**Second manual check: the hero, per frame.** Sample the video loop every 250 ms, composite the scrim, measure the hook's contrast against the **worst** frame — not the average and not the poster. And watch the loop seam for thirty seconds: a visible jump every cycle is worse than any single mistimed animation in this document, because it repeats.

---

## 14. À valider avec Stéphane — To validate with Stéphane

Only the things that need his eye. Everything else above is settled by a measurement, an ADR or his own instruction.

1. **The recession: 0.9 → 0.92, plus a scrim.** He named the navigation as the thing he likes, and this is the number that defines how it feels. The scrim is an addition, not a recalibration — it makes the recession read as depth rather than as a zoom-out, and without it the effect is nearly invisible on the dark 3D page. Both want to be seen side by side against the current site rather than argued.

2. **The item cascade: 100 ms → 60 ms.** The single most characteristic number in the menu. 60 ms turns five arrivals into one wave; if he wants the individual beats back, 80 ms is the compromise and 100 ms is what he has today.

3. **The home entrance becomes a full wipe rather than a retraction to 50 %, and the hook no longer travels.** The gesture is preserved and its endpoint is not, because the media is now full-bleed. The hook's 360 px journey from viewport-centre to half-panel-centre is gone, replaced by a 16 px rise. This is the largest change to something he built, and it is the one to look at first.

4. **The tile zoom: 1.2 → 1.04.** He framed these renders. At 1.2 the hover throws away 17 % of the frame he composed. The argument is his to accept or reject.

5. **Where `cubic-bezier(0, .43, .16, 1)` is allowed to live.** It is kept and named `--ease-signature`, and it is fenced to non-interruptible moves because its unbounded initial slope makes reversal look dead. That fencing means the menu — the thing he likes — does _not_ use it. Worth checking that the menu on `--ease-enter` still feels like his menu.

6. **The route-transition direction: 3D rises, Developer falls.** An arbitrary convention that becomes non-arbitrary once it is consistent. If the opposite reads better to him, it costs nothing to flip.

7. **The pause control on the hero video.** WCAG 2.2.2 makes it mandatory and ADR-0010 makes 2.2.2 in scope, so the button exists; what is open is where it sits and how quiet it can be before it stops satisfying the criterion. He should see it on the real hero, because it is the one piece of chrome this document adds to a composition he already likes.

8. **The encode.** Three constraints land on him rather than on the code: the first 1.5 s of the loop must be slow enough that the poster crossfade is invisible; the loop seam must be clean; and the region under the hook must stay dark and low-contrast for the whole loop. No scrim rescues a bright, busy passage moving under a headline.

**Two tokens this document needs and spec 06 does not yet declare:** `--scrim` (the off-canvas dim, starting value `hsl(20 10% 2% / 0.5)`) and `--hero-scrim` (the hero gradient, §8.5). They are colour decisions and belong in spec 06, not here.

**One ADR needs a superseding note:** ADR-0012's "the video leaves the bundle and leaves autoplay behind". The bundle half stands; the autoplay half was reversed by Stéphane on 2026-08-31 and is now recorded in spec 02 and here.
