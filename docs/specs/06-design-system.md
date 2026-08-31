# Spec 06 — Design system

This document implements ADR-0009. The ADR settled the method — two token tiers, themes as semantic redefinitions, named scales, an opening ratio on the heading scale bounded by a 3× floor and a monotonicity rule. This spec sets the numbers: every hex value, every step of every scale, every measured contrast ratio, and the CSS that wires it together.

**What it freezes.** One type family, the palette and its semantic mapping, the type scale and its composed level classes, the spacing scale, three radii, three elevation levels, named breakpoints, content widths, the theming mechanism, and the full state matrix for buttons, links and form fields. These are the values components consume; adding one off-scale value is the failure mode this system exists to prevent.

**What it leaves open.** Layout composition per page (spec 02), motion (spec 07), and any component beyond the base set below. Component-level tokens (`--card-padding` and friends) are deliberately absent: they get defined when a component is built, always as aliases of the scales below.

> Interface labels quoted in this document stay in French — the site's visitor-facing content is French. Everything else, token names included, is English.

**Every ratio in this document was computed with the WCAG 2.x relative-luminance formula and states the surface it was measured against.** A ratio without a named background is not a ratio.

Guiding principle, unchanged: **the design is the frame, the images are the product.** Every value below is calibrated to be legible and then get out of the way.

---

## 1. Token layering

Two tiers, per ADR-0009.

- **Primitives** name raw values: `--color-orange-500`, `--space-4`, `--text-h2`. They are theme-agnostic and never referenced by a component.
- **Semantics** name roles: `--surface-page`, `--text-primary`, `--accent`, `--border-strong`. They resolve to primitives and are the only thing components read.

The rule that makes theming work: **a component that reads `--color-orange-500` directly breaks dark mode silently.** Lint can't catch it; review has to.

Naming: `--<category>-<role>` for semantics, `--<category>-<name>-<step>` for primitives. Numeric steps run 0 → 950, higher is darker, in every ramp.

One extension of the rule, from §4.3: **type levels are consumed as composed classes, never as bare size tokens.** `font-size: var(--text-h2)` alone is the same category of mistake as reading a primitive.

---

## 2. Color primitives

The HSL column is derived from the hex, which is the source of truth. The ramp is not at a single hue: it drifts between 24 and 40 as it darkens, and the `#252422` anchor is the yellowest step in it. That drift is deliberate and it is what keeps the darkest neutrals from going violet next to the accent.

### 2.1 Neutrals — warm grey

The current site's `#242424` is a pure neutral sitting next to a warm orange; the pairing reads slightly cold and slightly cheap. The ramp below carries 4–20% saturation in the warm quadrant, which is enough to sit with the accent without reading as beige. Step 850 (`#252422`) is the deliberate stand-in for `#242424` — same value, warmed.

| Token                 | Hex       | HSL          | Use                                                                                                   |
| --------------------- | --------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `--color-neutral-0`   | `#ffffff` | `0 0% 100%`  | Light page background, light field background, dark-theme focus ring                                  |
| `--color-neutral-50`  | `#fbfaf9` | `30 20% 98%` | Light raised surface, dark-theme primary text                                                         |
| `--color-neutral-100` | `#f6f5f3` | `40 14% 96%` | Light sunken surface (replaces `#f9f9f9`)                                                             |
| `--color-neutral-200` | `#eae8e6` | `30 9% 91%`  | Light hairline, light inset fill                                                                      |
| `--color-neutral-300` | `#d7d4d0` | `34 8% 83%`  | Dark-theme secondary text, dark border on inset                                                       |
| `--color-neutral-400` | `#a9a39e` | `27 6% 64%`  | Dark-theme hover border                                                                               |
| `--color-neutral-500` | `#7b756f` | `30 5% 46%`  | Interactive borders, both themes                                                                      |
| `--color-neutral-600` | `#605c57` | `33 5% 36%`  | Light secondary text, light hover border                                                              |
| `--color-neutral-700` | `#46423f` | `26 5% 26%`  | Dark hairline, dark inset fill                                                                        |
| `--color-neutral-800` | `#2e2b29` | `24 6% 17%`  | Dark raised surface                                                                                   |
| `--color-neutral-850` | `#252422` | `40 4% 14%`  | **Dark page background** — the `#242424` anchor                                                       |
| `--color-neutral-900` | `#1b1a18` | `40 6% 10%`  | Light primary text, ink on accent, dark sunken surface, dark field background, light-theme focus ring |

| `--color-neutral-950` | `#12100f` | `30 9% 6%` | **Letterboxing** behind full-bleed 3D media |

`--color-neutral-950` was deleted in the previous revision as unconsumed, then reinstated: Stéphane compared the two framings on 2026-08-31 and chose the darker frame. It sits **1.22:1** from `--surface-page` and **1.35:1** from `--surface-raised` — enough to read as a distinct frame, far too little to compete with the render inside it. It has exactly one consumer, `--surface-letterbox`, and no other element may use it:

```css
.media--bleed {
  background: var(--surface-letterbox);
  display: grid;
  place-items: center;
}
.media--bleed img {
  max-inline-size: 100%;
  block-size: auto;
}
```

### 2.2 Orange — brand ramp derived from `#f2a154`

`#f2a154` is `hsl(29 86% 64%)`. It is step **500** and it does not move. The ramp shifts hue slightly redder as it darkens and slightly yellower as it lightens, which keeps the dark steps from turning muddy brown.

| Token                | Hex           | HSL          | Use                                                            |
| -------------------- | ------------- | ------------ | -------------------------------------------------------------- |
| `--color-orange-100` | `#fce9d4`     | `31 87% 91%` | Light accent wash — tertiary hover fill, chip fill             |
| `--color-orange-200` | `#f9d4ae`     | `30 86% 83%` | Light accent wash strong — tertiary active fill                |
| `--color-orange-300` | `#f7c28d`     | `30 87% 76%` | Primary active fill, dark-theme accent hover text              |
| `--color-orange-400` | `#f5b170`     | `29 87% 70%` | Primary hover fill, dark-theme accent text                     |
| `--color-orange-500` | **`#f2a154`** | `29 86% 64%` | **Brand accent.** Fill in both themes; foreground on dark only |
| `--color-orange-600` | `#db7624`     | `27 72% 50%` | Accent rim on light, current-page rule on light                |
| `--color-orange-700` | `#ad571a`     | `25 74% 39%` | Light-theme accent text and links; **primary button fill**     |
| `--color-orange-750` | `#944915`     | `24 75% 33%` | Primary button hover fill                                      |
| `--color-orange-800` | `#853f14`     | `23 74% 30%` | Light accent hover text, ink on light washes                   |
| `--color-orange-850` | `#7a3c11`     | `24 75% 27%` | Primary button active fill                                     |

White on `#ad571a` is **5.05:1**, on `#944915` **6.52:1**, on `#7a3c11` **8.46:1** — monotonically increasing, which is why the primary button darkens on hover rather than brightening (§3.4, §10.1).
| `--color-orange-900` | `#4c3c2f` | `27 24% 24%` | Dark accent wash strong — tertiary active fill |
| `--color-orange-950` | `#3d3024` | `29 26% 19%` | Dark accent wash — tertiary hover fill, chip fill |

Steps 900 and 950 replace the former `#532a13`, which the previous revision itself documented as "Reserved" — a token nothing consumed. `--color-orange-50` (`#fef5ec`) is deleted: it sat 1.03:1 from `--surface-raised` and could not carry a hover state on a card (see §3.4).

**The single most important consequence:** `#f2a154` on `#ffffff` is **2.10:1**. It fails AA for text and fails 1.4.11 for interface elements. On the light theme the accent is a **fill that carries dark ink**, never a foreground colour and never an interface boundary on its own. Wherever the current site writes orange text on white, this spec writes `--color-orange-700` (5.05:1 on `#ffffff`).

### 2.3 Status

Two ramps, deliberately minimal — the site has one form.

| Token             | Hex       | Use                  | Token               | Hex       | Use                           |
| ----------------- | --------- | -------------------- | ------------------- | --------- | ----------------------------- |
| `--color-red-100` | `#fbe3df` | Light danger surface | `--color-green-100` | `#dcf2e4` | Light success surface         |
| `--color-red-300` | `#f0a196` | Dark danger text     | `--color-green-300` | `#84cfa0` | Dark success text             |
| `--color-red-400` | `#e8705c` | Dark danger border   | `--color-green-400` | `#3fb06d` | Dark success border           |
| `--color-red-600` | `#b7331f` | Light danger border  | `--color-green-600` | `#16713e` | Light success text and border |
| `--color-red-700` | `#8f2717` | Light danger text    | `--color-green-950` | `#25372c` | Dark success surface          |
| `--color-red-950` | `#43302d` | Dark danger surface  |                     |           |                               |

`--color-green-700` is deleted: nothing consumed it. The 950 steps are new — without them `--surface-danger` and `--surface-success` both resolved to `--color-neutral-800` in dark, which is byte-identical to `--surface-raised`: an error block on a card would have been invisible, and a "success surface" that is not green is a token that lies about its role.

The current site's `#cc4534` / `#1aa260` are both below 4.5:1 on white (4.2 and 3.2). They are replaced.

---

## 3. Semantic tokens and measured contrast

**AA targets: 4.5:1 body text, 3:1 for text ≥ 24px or ≥ 18.66px bold, 3:1 for interface component boundaries, states and focus indicators (WCAG 2.2, 1.4.3 / 1.4.11).**

**Two levels of body text, not three.** `--text-muted` is deleted. `#7b756f` cleared 4.5 on `#ffffff` (4.55) and failed on five of the six other light surfaces — 4.36 on `--surface-raised`, 4.18 on `--surface-sunken`, 3.72 on `--surface-inset`, 3.84 on the old light accent wash, 3.72 on `--surface-danger`. Card captions and metadata are exactly the content it was declared for, and cards are `--surface-raised`. A portfolio does not need a third grey it cannot use. Everything that read `--text-muted` now reads `--text-secondary`, which clears 4.5 on every surface of both themes — published below.

### 3.1 Light theme — page background `#ffffff`

| Semantic token            | Primitive   | Hex       | Measured on             | Ratio     | Target |                                                             |
| ------------------------- | ----------- | --------- | ----------------------- | --------- | ------ | ----------------------------------------------------------- |
| `--surface-page`          | neutral-0   | `#ffffff` | —                       | —         | —      |                                                             |
| `--surface-raised`        | neutral-50  | `#fbfaf9` | page                    | 1.04      | —      | Cards; separation is elevation + content, not value (§10.4) |
| `--surface-sunken`        | neutral-100 | `#f6f5f3` | page                    | 1.09      | —      | Replaces `#f9f9f9`; image placeholders                      |
| `--surface-inset`         | neutral-200 | `#eae8e6` | page                    | 1.22      | —      | Truly disabled fills only                                   |
| `--surface-field`         | neutral-0   | `#ffffff` | page                    | 1.00      | —      | Form control background                                     |
| `--accent-wash`           | orange-100  | `#fce9d4` | page 1.18 / raised 1.14 | —         | ≥ 1.05 | Tertiary hover fill, chip fill                              |
| `--accent-wash-strong`    | orange-200  | `#f9d4ae` | page 1.39 / raised 1.34 | —         | ≥ 1.05 | Tertiary active fill                                        |
| `--surface-danger`        | red-100     | `#fbe3df` | page                    | 1.22      | —      | Error block                                                 |
| `--surface-success`       | green-100   | `#dcf2e4` | page                    | 1.18      | —      | Confirmation block                                          |
| `--text-primary`          | neutral-900 | `#1b1a18` | page                    | **17.39** | 4.5    | ✅                                                          |
| `--text-secondary`        | neutral-600 | `#605c57` | page                    | **6.63**  | 4.5    | ✅                                                          |
| `--text-accent`           | orange-700  | `#ad571a` | page                    | **5.05**  | 4.5    | ✅                                                          |
| `--text-accent-hover`     | orange-800  | `#853f14` | page                    | **7.73**  | 4.5    | ✅                                                          |
| `--text-on-accent`        | neutral-900 | `#1b1a18` | accent fill             | **8.28**  | 4.5    | ✅                                                          |
| `--text-on-accent-strong` | neutral-0   | `#ffffff` | —                       | —         | —      | Dark-theme use only, see §10.1                              |
| `--accent`                | orange-500  | `#f2a154` | page                    | 2.10      | —      | **Fill only**                                               |
| `--accent-rim`            | orange-600  | `#db7624` | page                    | **3.17**  | 3.0    | ✅ Boundary of accent fills — page and raised only          |
| `--border-subtle`         | neutral-200 | `#eae8e6` | page                    | 1.22      | —      | Decorative hairlines only                                   |
| `--border-strong`         | neutral-500 | `#7b756f` | page                    | **4.55**  | 3.0    | ✅ Field and control borders                                |
| `--border-hover`          | neutral-600 | `#605c57` | page                    | **6.63**  | 3.0    | ✅                                                          |
| `--border-on-inset`       | neutral-500 | `#7b756f` | inset                   | **3.72**  | 3.0    | ✅ Boundary of inset fills                                  |
| `--focus-ring`            | neutral-900 | `#1b1a18` | page                    | **17.39** | 3.0    | ✅ Neutral, not accent — see §10                            |
| `--text-danger`           | red-700     | `#8f2717` | page                    | **8.50**  | 4.5    | ✅                                                          |
| `--border-danger`         | red-600     | `#b7331f` | page                    | **5.99**  | 3.0    | ✅                                                          |
| `--text-success`          | green-600   | `#16713e` | page                    | **6.06**  | 4.5    | ✅                                                          |
| `--border-success`        | green-600   | `#16713e` | page                    | **6.06**  | 3.0    | ✅                                                          |

**Guards, light theme.**

- `--accent-rim` clears 3:1 on `--surface-page` (3.17) and `--surface-raised` (3.04) only. It drops to 2.91 on `--surface-sunken` and 2.68 on `--accent-wash`. Primary buttons live on page and raised. A primary button placed on `--surface-sunken` steps its rim to `--text-accent` (`#ad571a`, 4.64 on sunken).
- `--text-accent` clears AA on page (5.05), raised (4.85) and sunken (4.64) and nowhere else: 4.14 on inset, 4.27 on `--accent-wash`, 3.62 on `--accent-wash-strong`, 4.13 on `--surface-danger`. On those surfaces accent-coloured text uses `--text-accent-hover`, whose worst light surface is **5.54** (on `--accent-wash-strong`).

### 3.2 Dark theme — page background `#252422`

| Semantic token            | Primitive   | Hex       | Measured on             | Ratio     | Target |                                   |
| ------------------------- | ----------- | --------- | ----------------------- | --------- | ------ | --------------------------------- |
| `--surface-page`          | neutral-850 | `#252422` | —                       | —         | —      | The `#242424` anchor              |
| `--surface-raised`        | neutral-800 | `#2e2b29` | page                    | 1.10      | —      | Depth comes from the ring, see §7 |
| `--surface-sunken`        | neutral-900 | `#1b1a18` | page                    | 1.12      | —      | Image placeholders                |
| `--surface-inset`         | neutral-700 | `#46423f` | page                    | 1.56      | —      | Truly disabled fills only         |
| `--surface-field`         | neutral-900 | `#1b1a18` | page                    | 1.12      | —      | Form control background           |
| `--accent-wash`           | orange-950  | `#3d3024` | page 1.22 / raised 1.10 | —         | ≥ 1.05 | Tertiary hover fill, chip fill    |
| `--accent-wash-strong`    | orange-900  | `#4c3c2f` | page 1.47 / raised 1.34 | —         | ≥ 1.05 | Tertiary active fill              |
| `--surface-danger`        | red-950     | `#43302d` | page 1.25 / raised 1.14 | —         | —      | Error block                       |
| `--surface-success`       | green-950   | `#25372c` | page 1.23 / raised 1.11 | —         | —      | Confirmation block                |
| `--text-primary`          | neutral-50  | `#fbfaf9` | page                    | **14.88** | 4.5    | ✅                                |
| `--text-secondary`        | neutral-300 | `#d7d4d0` | page                    | **10.50** | 4.5    | ✅                                |
| `--text-accent`           | orange-400  | `#f5b170` | page                    | **8.42**  | 4.5    | ✅                                |
| `--text-accent-hover`     | orange-300  | `#f7c28d` | page                    | **9.64**  | 4.5    | ✅                                |
| `--text-on-accent`        | neutral-900 | `#1b1a18` | accent fill             | **8.28**  | 4.5    | ✅                                |
| `--text-on-accent-strong` | neutral-0   | `#ffffff` | raised                  | **14.06** | 4.5    | ✅ Secondary hover/active ink     |
| `--accent`                | orange-500  | `#f2a154` | page                    | **7.39**  | 3.0    | ✅ Usable as a foreground here    |
| `--accent-rim`            | orange-500  | `#f2a154` | page                    | **7.39**  | 3.0    | ✅ No separate rim needed         |
| `--border-subtle`         | neutral-700 | `#46423f` | page                    | 1.56      | —      | Decorative hairlines only         |
| `--border-strong`         | neutral-500 | `#7b756f` | page                    | **3.41**  | 3.0    | ✅ (3.82 on `--surface-field`)    |
| `--border-hover`          | neutral-400 | `#a9a39e` | page                    | **6.22**  | 3.0    | ✅                                |
| `--border-on-inset`       | neutral-300 | `#d7d4d0` | inset                   | **6.73**  | 3.0    | ✅                                |
| `--focus-ring`            | neutral-0   | `#ffffff` | page                    | **15.51** | 3.0    | ✅ Neutral, not accent — see §10  |
| `--text-danger`           | red-300     | `#f0a196` | page                    | **7.56**  | 4.5    | ✅                                |
| `--border-danger`         | red-400     | `#e8705c` | page                    | **5.10**  | 3.0    | ✅ (5.72 on `--surface-field`)    |
| `--text-success`          | green-300   | `#84cfa0` | page                    | **8.43**  | 4.5    | ✅                                |
| `--border-success`        | green-400   | `#3fb06d` | page                    | **5.64**  | 3.0    | ✅ (6.33 on `--surface-field`)    |

**Guard, dark theme: `--border-strong` is forbidden on `--surface-inset`.** `#7b756f` on `#46423f` is **2.19:1** — a straight 1.4.11 failure that the previous revision hid by omitting the inset row from this table. Anything that needs a boundary on `--surface-inset` uses `--border-on-inset` (`#d7d4d0`, **6.73** on inset).

The asymmetry between the themes is intentional: on dark, `#f2a154` clears 7.39:1 on the page and can be text. On light it cannot. `--text-accent` therefore points at a different primitive in each theme — which is exactly what semantic tokens are for.

**`--surface-sunken` carries image placeholders and inset panels. It does not carry code blocks: this site has none** (§4.1).

### 3.3 `--text-secondary` on every surface

The token that absorbed `--text-muted`, published in full. Worst case light **4.76**, worst case dark **6.73**. Both clear AA.

| Surface                | Light — `#605c57` | Dark — `#d7d4d0` |
| ---------------------- | ----------------- | ---------------- |
| `--surface-page`       | 6.63              | 10.50            |
| `--surface-raised`     | 6.36              | 9.52             |
| `--surface-sunken`     | 6.09              | 11.77            |
| `--surface-inset`      | 5.43              | 6.73             |
| `--surface-field`      | 6.63              | 11.77            |
| `--accent-wash`        | 5.61              | 8.63             |
| `--accent-wash-strong` | **4.76**          | 7.13             |
| `--surface-danger`     | 5.42              | 8.37             |
| `--surface-success`    | 5.64              | 8.56             |

### 3.4 The state-contrast rule

The current site's worst accessibility defect is the button hover: peach fill with orange text, ≈2:1, less legible hovered than at rest. Three rules prevent it from coming back:

> **1. Ink never changes between rest and hover — only the surface does.** Every state clears its own AA target, and no persistent state (rest, hover, focus) falls below **90% of the rest-state ratio**. `:active` is transient and only has to clear AA.

> **2. No hover state may sit closer than 1.05:1 to the surface it is drawn on.** A hover fill that is invisible is not a hover state. This is measured against _every_ surface the component is allowed to sit on, not just the page.

> **3. State is never carried by colour alone.** Weight, underline, border or icon carries it too.

Rule 2 is the reason `--color-orange-50` (`#fef5ec`) was deleted. It measured 1.08:1 against `--surface-page` and **1.03:1 against `--surface-raised`** — so the tertiary button hover did literally nothing on a card, which is where tertiary buttons mostly live. `--accent-wash` is now `orange-100`, at 1.18 / 1.14. The same failure existed in dark, where `--accent-wash` resolved to `--color-neutral-800`, byte-identical to `--surface-raised`: ratio **1.00**. It is now `orange-950` at 1.22 / 1.10.

A direct consequence of rule 1: **pin the ink first, then move the surface in whichever direction raises the ratio.** The direction is not a house style, it falls out of the ink. On the primary button, whose ink is white (§10.1), the surface darkens: 5.05 → 6.52 → 8.46. On a fill carrying dark ink — chips, overlines, the dark-theme accent — it brightens instead. Both obey the same rule and both climb.

The pressed feeling comes from elevation and a 1px translate (spec 07), not from a value that would drag contrast down.

### 3.5 Scrims — text over imagery

Everywhere else in this system, contrast is computed against a known surface. Over a render or a video frame it cannot be: the background changes with the content, and on the home page it changes 25 times a second. A ratio that holds on the average frame is worthless — the guarantee has to hold on the **worst** frame.

The worst frame is white. Measured for white ink, with the scrim built on `--color-neutral-950` (`#12100f`) — **not** pure black, which is what the ramp actually gives us and which costs a few points of ratio:

| Scrim opacity | Composited background | White ink |
| ------------- | --------------------- | --------- |
| 45%           | `#949393`             | 3.06      |
| 55%           | `#7d7c7b`             | 4.17 ❌   |
| **58%**       | `#767474`             | **4.65**  |
| 62%           | `#6c6b6a`             | **5.32**  |
| 72%           | `#545352`             | **7.68**  |
| 78%           | `#464544`             | **9.57**  |

**58% is the floor for body-size text**, and nothing on this site sits over imagery below it. The intuitive round number, 55%, lands at 4.17 and fails — a reminder that the scrim colour matters as much as its opacity, and that a tinted near-black is not a black.

`--hero-scrim` reaches 62% in the band the hook occupies and 78% at the bottom edge, so the guarantee holds with margin while the top of the frame stays open and the render keeps its light.

`--scrim` is the flat variant at 72%, for the off-canvas menu backdrop and the lightbox, where the content behind must recede rather than merely darken.

Both are identical in the two themes. A scrim covers imagery, not a surface token, so it has no theme to follow.

**This is also an encoding constraint, not only a CSS one.** A scrim that has to reach 78% to rescue a badly chosen frame has stopped being a scrim and become a curtain — at which point the video is no longer visible and there was no reason to ship it. The passage behind the hook should be dark and quiet in the source. Spec 07 carries that requirement.

---

## 4. Typography

### 4.1 One family

**Instrument Sans, variable, weight axis 400–700. There is no second family and no monospace.**

Poppins is a geometric sans whose wide round bowls are the single most dating element of the current site, and Open Sans is the humanist default it shipped with. Both go. Instrument Sans is a contemporary neo-grotesque with slightly narrow proportions and tight apertures. It sets large without going soft — which matters, because the display size reaches 76px — and it holds up at 15px for UI. Full French diacritics, including the œ ligature and guillemets. SIL OFL, self-hostable.

The argument for stopping at one family is the guiding principle: **one voice, because the images carry the personality.** A serif for the case studies (Source Serif 4) reads editorial and risks a magazine template; a characterful display face (Bricolage Grotesque) is the most designed option and the one most likely to date. Neither earns its third-family cost on a site where a 3D render sits next to the type on every screen.

**A monospace was doing four real jobs. Each one is replaced by type mechanics, not by a second font.**

| What the mono signalled               | Replacement                                                                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack and technology chips            | `.t-overline` — 13px, `letter-spacing: 0.12em`, uppercase, weight 600, on `--accent-wash` with an `--accent-rim` hairline and `--radius-pill` (§10.5) |
| Years and figures aligning in columns | `font-variant-numeric: tabular-nums` with `font-feature-settings: "tnum" 1` as the fallback (§4.4)                                                    |
| Back-office identifiers and slugs     | `.t-ident` — `--text-meta` size, weight 500, `letter-spacing: 0.04em`, tabular numerals                                                               |
| Code blocks                           | **The site has none.** No page in spec 02 renders code                                                                                                |

If a code block ever becomes necessary, `pre, code` use the system monospace stack — `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` — and no webfont is embedded for it.

```css
--font-sans:
  'Instrument Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
  sans-serif;
```

**Loading — one file.** The variable roman WOFF2, `unicode-range` limited to `latin` + `latin-ext`, self-hosted from the app's own origin, not Google's CDN, which would put a third-party request in a site that ships a legal-notice page. Instrument Sans ships its italic as a **separate** variable file: two files only if italic is actually used, and nothing in this spec uses it.

```html
<link
  rel="preload"
  as="font"
  type="font/woff2"
  href="/fonts/instrument-sans-var.woff2"
  crossorigin
/>
```

**`font-display: swap` with a metric-matched fallback.** `swap` alone against a fallback with different metrics produces a visible reflow — the exact defect the fluid scale exists to avoid. The fix is one extra `@font-face` that overrides the local fallback's metrics to Instrument Sans's, so the swap changes glyph shapes and nothing else. `optional` was the alternative and was rejected: on a slow connection it silently ships the wrong face for the whole session, on a site whose type is half the design.

```css
@font-face {
  font-family: 'Instrument Sans';
  src: url('/fonts/instrument-sans-var.woff2') format('woff2-variations');
  font-weight: 400 700;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0100-017F, U+0180-024F, U+2000-206F, U+20AC;
}
@font-face {
  font-family: 'Instrument Sans Fallback';
  src: local('Helvetica Neue'), local('Arial');
  size-adjust: 96.5%;
  ascent-override: 92%;
  descent-override: 24%;
  line-gap-override: 0%;
}
```

The three override percentages are starting values: they must be measured against the real face with the browser's font-metrics panel before this is frozen.

**Buttons declare their family.** The current site renders every `.button` in Arial because `.button` sets no `font-family` and form controls do not inherit it. Both halves of the fix ship:

```css
button,
input,
select,
textarea,
optgroup {
  font: inherit; /* the actual fix */
  letter-spacing: inherit;
}
.button {
  font-family: var(--font-sans);
} /* and the explicit belt */
```

### 4.2 The scale

`html { font-size: 100% }`. The `62.5%` hack goes — it makes every `rem` in the codebase a lie and breaks any user who has changed their browser's default size.

Named ratio, per ADR-0009: **major third (1.25) at 360px opening to perfect fourth (1.333) at 1440px, on the heading levels.** The ladder does not merely scale with the viewport, it opens up. That is the direct answer to the current site's mobile collapse, where the ratio between hero and body falls from 1.7× to 1.2×.

All levels above `--text-meta` are fluid between 360px and 1440px, linear, clamped at both ends.

| Token             | 360px | 768px | 1024px | 1440px | `clamp()`                                           |
| ----------------- | ----- | ----- | ------ | ------ | --------------------------------------------------- |
| `--text-display`  | 48    | 58.6  | 65.2   | 76     | `clamp(3rem, 2.4167rem + 2.5926vw, 4.75rem)`        |
| `--text-h1`       | 38    | 45.2  | 49.7   | 57     | `clamp(2.375rem, 1.9792rem + 1.7593vw, 3.5625rem)`  |
| `--text-h2`       | 31    | 35.5  | 38.4   | 43     | `clamp(1.9375rem, 1.6875rem + 1.1111vw, 2.6875rem)` |
| `--text-h3`       | 25    | 27.6  | 29.3   | 32     | `clamp(1.5625rem, 1.4167rem + 0.6481vw, 2rem)`      |
| `--text-h4`       | 20    | 21.5  | 22.5   | 24     | `clamp(1.25rem, 1.1667rem + 0.3704vw, 1.5rem)`      |
| `--text-lead`     | 18    | 18.8  | 19.2   | 20     | `clamp(1.125rem, 1.0833rem + 0.1852vw, 1.25rem)`    |
| `--text-body`     | 16    | 16.8  | 17.2   | 18     | `clamp(1rem, 0.9583rem + 0.1852vw, 1.125rem)`       |
| `--text-small`    | 14    | 14.4  | 14.6   | 15     | `clamp(0.875rem, 0.8542rem + 0.0926vw, 0.9375rem)`  |
| `--text-meta`     | 13    | 13    | 13     | 13     | `0.8125rem`                                         |
| `--text-overline` | 13    | 13    | 13     | 13     | `var(--text-meta)`                                  |

`--text-meta` is fixed on purpose: it is the floor, it is already small, and a fluid floor is a floor that eventually breaks. Nothing on this site is smaller. The current site's 9.6px attribution is gone with the quotation it belonged to.

**Hierarchy check.** Display-to-body: **3.00× at 360px, 3.49× at 768px, 3.79× at 1024px, 4.22× at 1440px.** The 3× floor ADR-0009 requires holds at every viewport, and it holds at its tightest exactly at 360px. Every level is monotonically non-decreasing with viewport width, as ADR-0011 requires. The current site: 1.2× on mobile, 1.7× on desktop — its _desktop_ figure is below this spec's _mobile_ figure.

**Step ratios between adjacent levels.** Two rules, both true on this scale:

> **Heading levels (display → h4) are never tighter than 1.22×.** Measured minimum: **1.226** (h1/h2 at 360px).

> **Text levels (lead / body / small / meta) are deliberately close.** They are distinguished by weight and colour, not by size. Size alone would push `--text-body` up or `--text-meta` down, and both are already at their limits.

| Pair         | 360px     | 768px | 1024px | 1440px |
| ------------ | --------- | ----- | ------ | ------ |
| display / h1 | 1.263     | 1.296 | 1.312  | 1.333  |
| h1 / h2      | **1.226** | 1.273 | 1.294  | 1.326  |
| h2 / h3      | 1.240     | 1.286 | 1.311  | 1.344  |
| h3 / h4      | 1.250     | 1.284 | 1.302  | 1.333  |
| h4 / lead    | 1.111     | 1.144 | 1.172  | 1.200  |
| lead / body  | 1.125     | 1.119 | 1.116  | 1.111  |
| body / small | 1.143     | 1.167 | 1.178  | 1.200  |
| small / meta | 1.077     | 1.108 | 1.123  | 1.154  |

**"The gap grows" is true of the headings and false of `lead`/`body`.** Every heading pair widens from 360px to 1440px. `lead` and `body` share the same `clamp()` slope (`0.1852vw`), so their difference is pinned at **2px at every viewport** and their _ratio_ narrows from 1.125 to 1.111. That is intentional — `--text-lead` is an intro paragraph, not a heading — but it must not be described as a scale that opens.

### 4.3 Composed level classes

`line-height`, `letter-spacing` and `font-weight` are not separate token scales. **The class is the composed token.** A component that writes `font-size: var(--text-h2)` and then hand-picks the other three properties is the ADR-0009 violation this section exists to prevent, one indirection deeper.

Optical compensation is baked in: large type gets tighter leading and negative tracking, small type the reverse. `line-height: normal` everywhere, as the current site has it, gets both wrong.

```css
.t-display {
  font-size: var(--text-display);
  line-height: 1.02;
  letter-spacing: -0.03em;
  font-weight: 700;
}
.t-h1 {
  font-size: var(--text-h1);
  line-height: 1.08;
  letter-spacing: -0.025em;
  font-weight: 600;
}
.t-h2 {
  font-size: var(--text-h2);
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-weight: 600;
}
.t-h3 {
  font-size: var(--text-h3);
  line-height: 1.25;
  letter-spacing: -0.015em;
  font-weight: 600;
}
.t-h4 {
  font-size: var(--text-h4);
  line-height: 1.3;
  letter-spacing: -0.01em;
  font-weight: 600;
}
.t-lead {
  font-size: var(--text-lead);
  line-height: 1.55;
  letter-spacing: -0.005em;
  font-weight: 400;
}
.t-body {
  font-size: var(--text-body);
  line-height: 1.65;
  letter-spacing: 0;
  font-weight: 400;
}
.t-small {
  font-size: var(--text-small);
  line-height: 1.5;
  letter-spacing: 0.005em;
  font-weight: 400;
}
.t-label {
  font-size: var(--text-small);
  line-height: 1.2;
  letter-spacing: 0.01em;
  font-weight: 600;
}
.t-meta {
  font-size: var(--text-meta);
  line-height: 1.4;
  letter-spacing: 0.01em;
  font-weight: 500;
}
.t-ident {
  font-size: var(--text-meta);
  line-height: 1.4;
  letter-spacing: 0.04em;
  font-weight: 500;
}
.t-overline {
  font-size: var(--text-overline);
  line-height: 1.2;
  letter-spacing: 0.12em;
  font-weight: 600;
  text-transform: uppercase;
}
```

`--text-display` is the only consumer of weight 700; that is what justifies the 400–700 axis range in §4.1. Every other level tops out at 600.

`.t-label` is the UI-control level: buttons, form labels, nav items. It exists so that the button's 0.01em tracking is a scale value rather than a number typed into a component — the tighter 0.005em of `.t-small` is right for running text and slightly too tight for a 15px all-caps-adjacent control label.

`.t-ident` is for back-office identifiers and slugs. `.t-overline` is for section eyebrows and stack chips — "Réalisations", "Compétences", "Angular". Uppercase at 13px is unreadable without heavy tracking; 0.12em is the minimum that works.

Body at 1.65 is loose on purpose. French runs about 20% longer than English at equal content, the paragraphs on this site are short, and the extra air is what keeps a text block from competing with a render next to it.

### 4.4 Numerals

```css
.t-meta,
.t-ident,
.tabular,
table {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
```

Both properties are declared: `font-variant-numeric` is the correct one and wins wherever it is supported; `font-feature-settings` is the fallback for engines that are not. Years in a timeline, project counts, and every column of figures in the back office use `.tabular` so digits stay in register between rows. Running prose does not — proportional figures read better inside a sentence.

---

## 5. Spacing

One scale, `rem` only, **4px base**, eight steps and zero. The previous revision had twelve, which is an application's scale, not a one-person portfolio's. No percentages anywhere — the current site's grid gutter varies from 10px to 57px because it is expressed as a percentage.

| Token       | rem  | px  | Typical use                                                            |
| ----------- | ---- | --- | ---------------------------------------------------------------------- |
| `--space-0` | 0    | 0   | Reset                                                                  |
| `--space-1` | 0.25 | 4   | Icon-to-label gap, chip vertical padding                               |
| `--space-2` | 0.5  | 8   | Chip horizontal padding, control vertical padding, tight stacks        |
| `--space-3` | 1    | 16  | Paragraph rhythm, card inner gap, field horizontal padding             |
| `--space-4` | 1.5  | 24  | Card padding, page inline padding (mobile), control horizontal padding |
| `--space-5` | 2    | 32  | Grid gutter, page inline padding (≥768), block separation              |
| `--space-6` | 4    | 64  | Section spacing (mobile)                                               |
| `--space-7` | 6    | 96  | Section spacing (≥768)                                                 |
| `--space-8` | 8    | 128 | Section spacing (≥1280), hero breathing room                           |

The 12px and 48px steps are gone. 12px existed for button vertical padding, which the 44px `min-height` makes redundant (§10.1); 48px existed for a page-inline tier that was dead code (§8).

Section rhythm is a token in its own right so it can move in one place:

```css
:root {
  --section-gap: var(--space-6);
}
@media (min-width: 48rem) {
  :root {
    --section-gap: var(--space-7);
  }
}
@media (min-width: 80rem) {
  :root {
    --section-gap: var(--space-8);
  }
}
```

---

## 6. Radii

Three. The current site has four with no scale (`2em`, `10px`, `5px`, `3px`).

| Token         | Value      | px  | Applies to                              |
| ------------- | ---------- | --- | --------------------------------------- |
| `--radius-sm` | `0.375rem` | 6   | Form fields, checkboxes, small controls |
| `--radius-md` | `0.75rem`  | 12  | Buttons, cards, panels                  |
| `--radius-lg` | `1.5rem`   | 24  | Media containers, lightbox, modals      |

`--radius-pill: 100vmax` also exists. It is a **shape**, not a scale step — it applies to tag chips and avatars only, and it is not a fourth size.

**Nesting rule:** `inner = max(0, outer − padding)`. The floor is the whole point: once the padding is at least as large as the outer radius, the inner element gets a **straight edge**, because its corner is far enough from the container's corner that curvature is arbitrary. A `--radius-md` card (12px) with `--space-2` padding (8px) around an image gives the image 4px. The same card with `--space-4` padding (24px) gives it 0 — a square image inside a rounded card, which is correct, and which the previous revision described as `--radius-sm` on the strength of `12 − 24 = −12`.

---

## 7. Elevation

Three levels, each built from **five layers in the same order and the same inset/outset pattern**, each tinted toward the warm neutral rather than pure black. A single-layer black shadow — the current site's `0 8px 24px hsla(210,8%,62%,.2)`, which is also _cool_ against a warm palette — is the generic look ADR-0009 set out to replace.

The geometry is identical in both themes; only the colours flip. That is what keeps this to one definition.

**Why five layers everywhere.** `box-shadow` interpolates only between lists of equal length whose corresponding layers agree on the `inset` keyword. The previous revision gave `--elevation-1` three layers and `--elevation-2` five, and after the shorter list is padded, position 2 pairs an _outset_ layer against an _inset_ one — which makes the whole list non-interpolable and turns the card hover into a hard jump. Card rest → card hover is the only elevation transition the system actually uses, so this is the one that has to work.

```css
:root {
  /* Shadow colour layers. Transparent in light where the layer does not apply. */
  --shadow-ring: light-dark(transparent, hsl(30 12% 100% / 0.07));
  --shadow-highlight: light-dark(transparent, hsl(30 30% 100% / 0.06));
  --shadow-near: light-dark(hsl(28 25% 18% / 0.1), hsl(20 10% 2% / 0.45));
  --shadow-mid: light-dark(hsl(28 25% 18% / 0.08), hsl(20 10% 2% / 0.4));
  --shadow-far: light-dark(hsl(28 25% 18% / 0.06), hsl(20 10% 2% / 0.35));

  --elevation-1:
    0 0 0 1px var(--shadow-ring), inset 0 1px 0 transparent, 0 1px 2px -1px var(--shadow-near),
    0 2px 6px -2px var(--shadow-mid), 0 4px 10px -6px transparent;

  --elevation-2:
    0 0 0 1px var(--shadow-ring), inset 0 1px 0 var(--shadow-highlight),
    0 2px 4px -2px var(--shadow-near), 0 8px 16px -6px var(--shadow-mid),
    0 16px 32px -12px var(--shadow-far);

  --elevation-3:
    0 0 0 1px var(--shadow-ring), inset 0 1px 0 var(--shadow-highlight),
    0 4px 8px -4px var(--shadow-near), 0 16px 32px -12px var(--shadow-mid),
    0 40px 72px -24px var(--shadow-far);
}
```

Layer 2 of `--elevation-1` is an `inset` layer painted in `transparent`: it costs nothing, paints nothing, and is what makes the three levels mutually interpolable. Layer 5 is the same trick for the far shadow. **Verify this in a browser before freezing it** — set a card to `--elevation-1`, transition `box-shadow` to `--elevation-2` over 600ms, and watch for a jump at frame one. A jump means one of the five pairs is still mismatched.

| Level           | Light                | Dark                                 | Used by                      |
| --------------- | -------------------- | ------------------------------------ | ---------------------------- |
| `--elevation-1` | Two painted layers   | Ring + two layers                    | Cards at rest, sticky header |
| `--elevation-2` | Three painted layers | Ring + top highlight + three layers  | Cards on hover, dropdowns    |
| `--elevation-3` | Three wide layers    | Ring + highlight + three wide layers | Lightbox, modal              |

**Why the ring exists.** On `#252422` a drop shadow has almost nothing to darken — the classic dark-mode problem where every card floats on nothing. Depth on dark comes from three sources instead, in this order: a **1px luminous ring** at 7% white (the primary cue), a **1px inset top highlight** simulating a light source above, and a **lighter surface** (`--surface-raised` at 1.10:1 against the page). The blur layers remain but are doing much less work.

In light mode `--shadow-ring` and `--shadow-highlight` are `transparent`, so the same declaration paints nothing. One geometry, two renderings, no duplicated rules.

**In forced-colors mode none of this paints at all.** See §9.

---

## 8. Breakpoints, widths and grid

### 8.1 Named breakpoints

There was one set of breakpoints implied by the media queries, a second implied by a "12 columns at ≥1024" sentence, and a third by a grid comment that switched at 1152. There is now one list, each value justified by the content, per ADR-0011. All are `min-width`, mobile-first.

| Name      | Value   | px   | Why the content changes here                                                                                                                                             |
| --------- | ------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bp-md` | `48rem` | 768  | The project grid reaches two columns: 2 × 19rem + 2rem gutter = 40rem, which fits inside 48rem minus page padding. Page padding steps up; the gutter is constant at 32px |
| `--bp-lg` | `72rem` | 1152 | The project grid reaches three columns: 3 × 19rem + 2 × 2rem = 61rem. This is also `--width-content`, so the container stops growing here                                |
| `--bp-xl` | `80rem` | 1280 | Section rhythm takes its widest step. Nothing else changes                                                                                                               |

The `≥1024` column claim is deleted. It described a 12-column framework that does not exist: both grids are intrinsic (`auto-fill`), so column count is a consequence of the item minimum and the gutter, not a declared breakpoint. Inventing a third number to describe it was the source of the contradiction.

**Custom properties do not work inside a media query condition.** `@media (min-width: var(--bp-md))` is invalid and fails silently. The tokens above are therefore declared twice: once as custom properties, for anything that reads them in `calc()` or in a container query, and once as a PostCSS `@custom-media` for the queries themselves. If the PostCSS step is ever dropped, the three numbers are documented constants and get written literally, with this table as the reference.

```css
@custom-media --md (min-width: 48rem);
@custom-media --lg (min-width: 72rem);
@custom-media --xl (min-width: 80rem);
```

### 8.2 Widths

The current site sets no maximum content width: at 1920px a paragraph runs 1800px, roughly 220 characters per line.

| Token             | Value   | px   | Meaning                                                      |
| ----------------- | ------- | ---- | ------------------------------------------------------------ |
| `--measure`       | `62ch`  | ~590 | Readable line length for French prose — the only prose width |
| `--width-content` | `72rem` | 1152 | Standard page container                                      |
| `--width-wide`    | `90rem` | 1440 | Galleries, project grids                                     |
| `--width-full`    | `100%`  | —    | Full-bleed media only                                        |

`--width-text` is deleted. It described the same thing as `--measure` and disagreed with it by 80px, which meant two paragraph widths on the same site depending on which token a component happened to reach for. Article bodies get `max-inline-size: var(--measure)`.

**Why 62ch and not 68ch.** `ch` is the advance width of the `0` glyph, which in a neo-grotesque is wider than the average mixed-case character: roughly 1ch of width holds 1.10–1.18 rendered characters of French prose. 68ch therefore lands around 75–80 characters, above the readable band, not inside it. 62ch lands around **68–73** characters — the top of the 60–70 guidance, chosen deliberately because French averages longer words and more accented glyphs than the English the guidance was written for. This wants a measurement against the real face at the real size before it is frozen; the reasoning, not the exact integer, is what matters.

### 8.3 Page padding and gutters

Fixed per breakpoint, never percentages:

```css
:root {
  --page-inline: var(--space-4); /* 24px */
  --grid-gap: var(--space-5); /* 32px */
}
@media (--md) {
  :root {
    --page-inline: var(--space-5);
  } /* 32px */
}
```

The former 48px tier at 80rem is deleted. Any container capped at `--width-content` (1152px) already has 64px of free space on each side at 1280px, so the padding never applied — it was reachable only by `--width-wide`, which is a gallery and wants its media closer to the edge, not further from it.

```css
--grid-projects: repeat(auto-fill, minmax(19rem, 1fr)); /* 1 col @360, 2 @768, 3 @1152 */
--grid-gallery: repeat(auto-fill, minmax(14rem, 1fr)); /* 3D mosaic */
```

`auto-fill` with a fixed `--grid-gap` replaces the percentage gutter identified in spec 02.

---

## 9. Theming mechanics

### 9.1 The themes are fixed and follow the content

**The home page and the Developer section are light. The 3D section is dark. Always, for every visitor.** `prefers-color-scheme` does not select a section theme.

The reason is that the light/dark break is an identity decision, not a display preference. The whole point of the 3D section is that the site _changes character_ when you enter it — that contrast is the strongest effect the design has. If the OS dark setting turns the home page dark, the 3D section arrives against an already-dark page and the effect cancels itself. A visitor in OS dark mode would get a site that is quieter than the one the site is for. ADR-0009 records this decision.

The mechanism is `color-scheme` + `light-dark()`. `color-scheme` inherits, so putting `data-theme="dark"` on a single `<section>` flips every token inside it, with **no duplicated dark block**.

```css
/* ---------- 1. Scheme resolution ------------------------------------ */
:root {
  color-scheme: light;
}
[data-theme='light'] {
  color-scheme: light;
}
[data-theme='dark'] {
  color-scheme: dark;
}
```

**`:root { color-scheme: light dark }` is specifically wrong here** and was the previous revision's rule. It hands the root's scheme to `prefers-color-scheme`, which does two things: it re-opens the decision above, and — because native control rendering follows the _computed_ scheme, not the painted colours — it gives a visitor in OS dark mode dark-rendered scrollbars, dark date pickers and dark select popups on a page this spec paints white.

**What actually follows what.** The previous revision claimed a nested `<section data-theme="dark">` buys "native dark scrollbars for free". It does not:

- The **page scrollbar** follows the `color-scheme` of the root element — or of whichever element is actually the scroll container. A nested `<section>` is neither. Scrolling through the dark 3D section leaves the page scrollbar light, and that is the correct and unavoidable behaviour.
- **Form controls** — the select popup, the date picker, the checkbox tick, the spinner — _do_ follow the `color-scheme` computed on the control itself, so a form inside a dark section renders dark natively. There are no form controls in the 3D section; the contact form is on a light page. The mechanism is right, the claim was too broad.
- A scroll container that must have a dark scrollbar carries `data-theme="dark"` **and** `overflow: auto` on the same element.

### 9.2 The full declaration

```css
/* ---------- 2. Primitives — theme-agnostic, never read by a component */
:root {
  --color-neutral-0: #ffffff;
  --color-neutral-50: #fbfaf9;
  --color-neutral-100: #f6f5f3;
  --color-neutral-200: #eae8e6;
  --color-neutral-300: #d7d4d0;
  --color-neutral-400: #a9a39e;
  --color-neutral-500: #7b756f;
  --color-neutral-600: #605c57;
  --color-neutral-700: #46423f;
  --color-neutral-800: #2e2b29;
  --color-neutral-850: #252422;
  --color-neutral-900: #1b1a18;
  --color-neutral-950: #12100f;

  --color-orange-100: #fce9d4;
  --color-orange-200: #f9d4ae;
  --color-orange-300: #f7c28d;
  --color-orange-400: #f5b170;
  --color-orange-500: #f2a154; /* brand — does not move */
  --color-orange-600: #db7624;
  --color-orange-700: #ad571a;
  --color-orange-750: #944915;
  --color-orange-800: #853f14;
  --color-orange-850: #7a3c11;
  --color-orange-900: #4c3c2f;
  --color-orange-950: #3d3024;

  --color-red-100: #fbe3df;
  --color-green-100: #dcf2e4;
  --color-red-300: #f0a196;
  --color-green-300: #84cfa0;
  --color-red-400: #e8705c;
  --color-green-400: #3fb06d;
  --color-red-600: #b7331f;
  --color-green-600: #16713e;
  --color-red-700: #8f2717;
  --color-green-950: #25372c;
  --color-red-950: #43302d;
}

/* ---------- 3. Semantics — the only tier components may read --------- */
:root {
  --surface-page: light-dark(var(--color-neutral-0), var(--color-neutral-850));
  --surface-raised: light-dark(var(--color-neutral-50), var(--color-neutral-800));
  --surface-sunken: light-dark(var(--color-neutral-100), var(--color-neutral-900));
  --surface-inset: light-dark(var(--color-neutral-200), var(--color-neutral-700));
  --surface-field: light-dark(var(--color-neutral-0), var(--color-neutral-900));

  --text-primary: light-dark(var(--color-neutral-900), var(--color-neutral-50));
  --text-secondary: light-dark(var(--color-neutral-600), var(--color-neutral-300));
  --text-accent: light-dark(var(--color-orange-700), var(--color-orange-400));
  --text-accent-hover: light-dark(var(--color-orange-800), var(--color-orange-300));
  --text-on-accent: var(--color-neutral-900); /* identical in both themes */
  --text-on-accent-strong: var(--color-neutral-0);

  /* Fills carrying DARK ink — chips, overlines, dark-theme accent. Brighten on hover. */
  --accent: var(--color-orange-500);
  --accent-hover: var(--color-orange-400);
  --accent-active: var(--color-orange-300);
  --accent-rim: light-dark(var(--color-orange-600), var(--color-orange-500));

  /* Fills carrying WHITE ink — the primary button. Darken on hover (§10.1). */
  --accent-solid: var(--color-orange-700);
  --accent-solid-hover: var(--color-orange-750);
  --accent-solid-active: var(--color-orange-850);

  /* Letterboxing behind full-bleed 3D media, darker than the section page. */
  --surface-letterbox: var(--color-neutral-950);

  /* Scrims — see §3.5. Identical in both themes: they darken toward black
     regardless of the surface underneath, because what they cover is imagery. */
  --scrim: color-mix(in srgb, var(--color-neutral-950) 72%, transparent);
  --hero-scrim: linear-gradient(
    to top,
    color-mix(in srgb, var(--color-neutral-950) 78%, transparent) 0%,
    color-mix(in srgb, var(--color-neutral-950) 62%, transparent) 45%,
    color-mix(in srgb, var(--color-neutral-950) 30%, transparent) 100%
  );
  --accent-wash: light-dark(var(--color-orange-100), var(--color-orange-950));
  --accent-wash-strong: light-dark(var(--color-orange-200), var(--color-orange-900));

  --border-subtle: light-dark(var(--color-neutral-200), var(--color-neutral-700));
  --border-strong: var(--color-neutral-500); /* identical in both themes */
  --border-hover: light-dark(var(--color-neutral-600), var(--color-neutral-400));
  --border-on-inset: light-dark(var(--color-neutral-500), var(--color-neutral-300));

  --focus-ring: light-dark(var(--color-neutral-900), var(--color-neutral-0));

  --text-danger: light-dark(var(--color-red-700), var(--color-red-300));
  --border-danger: light-dark(var(--color-red-600), var(--color-red-400));
  --surface-danger: light-dark(var(--color-red-100), var(--color-red-950));
  --text-success: light-dark(var(--color-green-600), var(--color-green-300));
  --border-success: light-dark(var(--color-green-600), var(--color-green-400));
  --surface-success: light-dark(var(--color-green-100), var(--color-green-950));
}

/* ---------- 4. Application ------------------------------------------ */
html {
  font-size: 100%; /* 62.5% hack removed */
  background: var(--surface-page);
  scroll-padding-block-start: var(--header-height); /* WCAG 2.2 SC 2.4.11 */
}
body {
  font-family: var(--font-sans);
  color: var(--text-primary);
  background: var(--surface-page);
}
body {
  font-size: var(--text-body);
  line-height: 1.65;
} /* = .t-body */

/* Any subtree can flip. The 3D section carries this permanently. */
[data-theme] {
  background: var(--surface-page);
  color: var(--text-primary);
}

::selection {
  background: var(--accent-wash-strong);
  color: var(--text-primary);
}
:root {
  caret-color: var(--text-accent);
}
```

```html
<!-- The 3D section, themed by content — French copy, per project rules -->
<section data-theme="dark" aria-labelledby="galerie-3d-titre">
  <h2 id="galerie-3d-titre" class="t-h2">Graphisme 3D</h2>
</section>
```

Without the two lines above, a text selection is system blue and the text caret is system blue, on an orange palette. `::selection` uses `--accent-wash-strong`, which carries `--text-primary` at **12.47** (light) and **10.10** (dark).

### 9.3 The sticky header crosses the theme boundary

The header lives in `<body>`, outside the 3D `<section>`. Left alone it would stay light while dark content scrolls underneath it — the audit's defect no. 5, reintroduced in a new form.

**Decision: the header is opaque and adopts the theme of the section it is covering.** One `IntersectionObserver` watches the section boundaries against a root margin equal to the header height and writes `data-theme` onto the header element. The Angular app is zoneless, so the observer callback writes to a **signal** and the template binds `[attr.data-theme]` to it; there is no `NgZone` to re-enter and no `markForCheck()`.

The header is opaque, not translucent: a `backdrop-filter` header over a theme boundary produces a band of blended colour whose contrast against its own label text is not knowable in advance, and this system publishes every ratio.

`--header-height` is a real custom property, set once and reused by `scroll-padding-block-start` on `html`. That one line satisfies **WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum)**, an AA criterion: without it, tabbing to an anchor target scrolls the target under the sticky header and its focus ring is hidden. ADR-0010 targets WCAG 2.2 AA, and this is the criterion a sticky header most reliably breaks.

### 9.4 `<meta name="theme-color">`

The browser UI chrome must follow the section, or a phone shows a white status bar over the dark 3D gallery.

```html
<meta name="theme-color" content="#ffffff" />
```

The same observer that themes the header updates this tag's `content` to `#ffffff` on light sections and `#252422` on dark ones. It is one extra line in the same signal effect, and it is the difference between a section that fills the screen and one that has a white bar on top of it.

### 9.5 Forced colors

In Windows high-contrast mode `box-shadow` is not painted. The entire depth system disappears — and in the light theme a card's only separation from the page is elevation, at **1.04:1**. Cards become invisible rectangles of text.

```css
@media (forced-colors: active) {
  .button,
  .card,
  .field-input {
    border: 1px solid ButtonText;
  }
  :focus-visible {
    outline-color: Highlight;
  }
}
```

System colour keywords are used deliberately: in forced-colors mode the palette above is overridden anyway, so the only correct choice is the keywords the OS is substituting.

### 9.6 Two implementation traps

1. **Do not register colour tokens with `@property`.** A registered custom property with `syntax: "<color>"` computes at the element that declares it, which freezes `light-dark()` to the root's scheme and silently kills per-section theming. Unregistered custom properties substitute as token streams and resolve at the point of use — that is precisely the behaviour this design depends on.
2. **`light-dark()` only takes colours.** Anything else that differs by theme — shadow geometry, image sources — is handled by making the _colour_ vary (see §7) or by a `[data-theme]` rule.

`light-dark()` is Baseline since 2024 (Chrome 123, Safari 17.5, Firefox 120). No fallback is planned; if one becomes necessary it is a single `@supports not (color: light-dark(#000, #fff))` block restating the light theme.

---

## 10. Base components

Shared rules, applying to every interactive element.

**Touch target ≥ 44×44px.** WCAG 2.2 SC 2.5.8 requires 24×24; 44 is the target because this site is browsed on phones. This applies to navigation links first — they are the most-tapped controls on the site and the previous revision gave them neither `min-height` nor padding.

```css
.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem; /* 44px */
  padding-inline: var(--space-3);
}
```

Where a control must render smaller than 44px, the hit area is extended by a transparent pseudo-element — six lines, and the parent needs the positioning context or the `inset` resolves against the wrong box:

```css
.icon-button {
  position: relative;
}
.icon-button::after {
  content: '';
  position: absolute;
  inset: -0.625rem; /* grows a 24px control to 44px */
  border-radius: inherit; /* legal here: ::after inherits from the control */
}
```

**Visible focus, always, never removed.**

```css
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible,
[tabindex]:not([tabindex='-1']):focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

Three corrections to the previous revision, all of them bugs:

- **The selector is no longer wrapped in `:where()`.** `:where()` has specificity 0, so any component rule with a `:focus` or `:focus-visible` declaration overrode it silently. Focus rules are the last thing that should lose a specificity race.
- **`border-radius: inherit` is deleted.** `border-radius` is not an inherited property, so `inherit` takes the _parent's_ radius — a `--radius-md` button inside a square container focuses with square corners. It was never needed: `outline` follows the element's own `border-radius` natively in Chrome 94+, Firefox 88+ and Safari 16.4+.
- **`[tabindex="-1"]` is excluded.** The skip-link target is `<main tabindex="-1">`; without the exclusion, using the skip link draws a 3px ring around the entire page.

**The focus ring is neutral, not accent.** `--focus-ring` was `orange-700` / `orange-400`, which put an orange ring around an orange button:

| Ring on the primary button's fill | Old ring  | Ratio                             |
| --------------------------------- | --------- | --------------------------------- |
| Light, rest fill `#f2a154`        | `#ad571a` | **2.41**                          |
| Light, hover fill `#f5b170`       | `#ad571a` | **2.74**                          |
| Dark, rest fill `#f2a154`         | `#f5b170` | **1.14**                          |
| Dark, hover fill `#f5b170`        | `#f5b170` | **1.00** — the ring _is_ the fill |

A neutral ring cannot collide with a brand fill by construction. `--focus-ring` is now `neutral-900` on light and `neutral-0` on dark: **17.39** on `--surface-page` (light) and **15.51** on `--surface-page` (dark), against the accent fill itself **8.28** (light) and **2.10** (dark, where the offset keeps it off the fill anyway).

Published bounds, recomputed against every surface token in §3:

> **The focus ring measures ≥ 12.47:1 on every light surface and ≥ 9.95:1 on every dark surface.** The light minimum is on `--accent-wash-strong`, the dark minimum on `--surface-inset`.

The previous revision's "≥ 4.14 on every light surface" and "≥ 7.64 on every dark surface" were both false — the true minima for the orange ring were 4.13 (on `--surface-danger`) and 5.40 (on `--surface-inset`). Both are moot now.

**`transition` on `background-color`, `border-color`, `box-shadow`, `transform` only — never on `color`.** The reason is not flicker: a `color` transition interpolates smoothly in sRGB. The reason is the one this system states everywhere else — **the intermediate values are not guaranteed to clear AA.** A 200ms ramp between two compliant inks passes through inks that were never measured, and §3.4's rule is that every state clears its target. Fills are transitioned because the ink is pinned and brightening a fill can only raise contrast. Durations and easing live in spec 07.

### 10.1 Buttons

```css
.button {
  font-family: var(--font-sans);
  /* metrics from .t-label: 15px / 1.2 / 0.01em / 600 */
  font-size: var(--text-small);
  line-height: 1.2;
  letter-spacing: 0.01em;
  font-weight: 600;
  min-height: 2.75rem; /* 44px */
  padding: var(--space-2) var(--space-4); /* 8 / 24 — min-height carries the height */
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
```

The button composes `.t-label`; the 0.01em tracking is that class's value, not a number chosen at the component. The previous revision wrote `0.01em` here while §4.3 gave `--text-small` 0.005em — the same size with two trackings depending on which file you opened.

**Primary** — `--accent-solid` fill, white ink. Settled by Stéphane on 2026-08-31: he wants the white label of the current button kept. White on `#f2a154` is **2.10:1** and unusable, so the fill deepens along the same hue to `--color-orange-700` (`#ad571a`), where white reaches **5.05:1**. The hue is Stéphane's; only its density changes, and `#f2a154` keeps every other job in the system.

**This inverts the state direction for this button.** With the ink pinned white, brightening the surface would _lower_ contrast — so here the surface darkens. The rule in §3.4 is unchanged and this is what it produces: pin the ink, then move the surface in whichever direction raises the ratio.

| State         | Fill                              | Ink                | Ink ratio                      | Border                            |
| ------------- | --------------------------------- | ------------------ | ------------------------------ | --------------------------------- |
| Rest          | `--accent-solid` `#ad571a`        | `#ffffff`          | **5.05**                       | none needed on light, see below   |
| Hover         | `--accent-solid-hover` `#944915`  | `#ffffff`          | **6.52** ↑                     | idem                              |
| Focus-visible | as rest                           | `#ffffff`          | **5.05**                       | + 3px neutral ring, 17.39 / 15.51 |
| Active        | `--accent-solid-active` `#7a3c11` | `#ffffff`          | **8.46** ↑                     | idem                              |
| Disabled      | `--surface-inset`                 | `--text-secondary` | light **5.43** / dark **6.73** | `--border-on-inset` (3.72 / 6.73) |

Contrast increases monotonically across rest → hover → active, as it did with dark ink. The direction of travel flipped; the guarantee did not.

```css
.button--primary {
  background: var(--accent-solid);
  color: var(--text-on-accent-strong);
  border-color: transparent;
}
[data-theme='dark'] .button--primary {
  border-color: var(--accent-rim);
}
@media (hover: hover) and (pointer: fine) {
  .button--primary:hover {
    background: var(--accent-solid-hover);
  }
}
.button--primary:active {
  background: var(--accent-solid-active);
}
```

**Boundary.** The fill carries its own boundary on light — `#ad571a` measures 5.05 against `--surface-page` and 4.85 against `--surface-raised`, both well past the 3:1 of 1.4.11, so no rim is required. On dark it measures 3.07 against the page but only **2.78 against `--surface-raised`**, which fails on a card. On the dark theme the primary button therefore carries an `--accent-rim` hairline (`#f2a154`, 7.39 against page and 6.70 against raised).

**Where `#f2a154` still lives.** It remains `--accent`: the chip and overline fill, the dark-theme accent text (7.39 on the dark page), the dark-theme rim, and any fill carrying dark ink (8.28). The brand colour did not move — one component stopped using it as a background for white text, because it never could.

**Secondary** — outlined. The default for "Voir le projet", "Télécharger le CV".

| State         | Light fill · ink · ratio                                     | Dark fill · ink · ratio                                          | Border                          |
| ------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------- |
| Rest          | transparent · `--text-primary` · **17.39**                   | transparent · `--text-primary` · **14.88**                       | `--border-strong` (4.55 / 3.41) |
| Hover         | `--accent-wash` · `--text-primary` · **14.70** (85% of rest) | `--surface-raised` · `--text-on-accent-strong` · **14.06** (94%) | `--border-hover` (6.63 / 6.22)  |
| Focus-visible | as rest + ring                                               | as rest + ring                                                   | `--border-strong`               |
| Active        | `--accent-wash-strong` · `--text-primary` · **12.47**        | `--surface-inset` · `--text-on-accent-strong` · **9.95**         | `--border-hover`                |
| Disabled      | `--surface-inset` · `--text-secondary` · **5.43**            | `--surface-inset` · `--text-secondary` · **6.73**                | `--border-on-inset`             |

Dark hover swaps the ink from `--text-primary` (`#fbfaf9`) to `--text-on-accent-strong` (`#ffffff`) — one step, taken so that lightening the fill does not cost contrast. It is the only place in the system where ink moves between rest and hover, and it moves _up_. The active-state figure is **9.95** against `--surface-inset` (`#46423f`) with white ink; the previous revision published 9.53 for the same cell, which is neither the white figure (9.95) nor the `#fbfaf9` figure (9.54).

The light hover at 85% of rest is the one place the 90% rule in §3.4 does not hold. It is allowed here explicitly: 14.70:1 is three times the AA requirement, the rule exists to stop states _approaching_ the threshold, and applying it mechanically at the top of the range would forbid a visible hover on the highest-contrast control in the system.

**Tertiary** — text-only. Inline actions, "Voir tout", back links.

| State         | Light fill · ink · ratio                                  | Dark fill · ink · ratio                                   |
| ------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| Rest          | none · `--text-accent` · **5.05** on page                 | none · `--text-accent` · **8.42** on page                 |
| Hover         | `--accent-wash` · `--text-accent-hover` · **6.53** ↑      | `--accent-wash` · `--text-accent-hover` · **7.93**        |
| Focus-visible | as rest + ring                                            | as rest + ring                                            |
| Active        | `--accent-wash-strong` · `--text-accent-hover` · **5.54** | `--accent-wash-strong` · `--text-accent-hover` · **6.55** |
| Disabled      | none · `--text-secondary` · **6.63** on page              | none · `--text-secondary` · **10.50** on page             |

The hover ink steps to `--text-accent-hover` because `--text-accent` measures only **4.27** on the light `--accent-wash` — below AA. The wash itself clears the 1.05 delta rule on both page and raised (§3.4).

**The disabled appearance is not used for form submission.** `--border-subtle` and `--surface-inset` both resolve to `neutral-200` in light and `neutral-700` in dark: the ratio between a disabled button's fill and its own border is **1.00**, and its fill against the page is 1.22. It has no boundary at all. That is tolerable only where WCAG's exemption applies — a genuinely `disabled`, non-focusable control.

So: **while the contact form is submitting, the button keeps its full primary appearance**, gains `aria-busy="true"`, swaps its label to « Envoi en cours… » and shows a spinner. It stays focusable, it stays announced, and it stays at 8.28:1. If a focusable disabled control is ever genuinely needed elsewhere, it carries `aria-disabled="true"` and `--border-on-inset` for its boundary (3.72 light / 6.73 dark), never `--border-subtle`.

### 10.2 Links

In-prose links are **underlined at rest**, always. Colour alone never carries link-ness (WCAG 1.4.1).

```css
a {
  color: var(--text-accent);
  text-decoration: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
  text-decoration-color: color-mix(in oklch, currentColor 70%, transparent);
}
a:hover {
  color: var(--text-accent-hover);
  text-decoration-color: currentColor;
}
```

**The underline is at 70%, not 45%.** In the dark theme the link colour `#f5b170` measures **1.77:1** against the surrounding body text `#fbfaf9` — the colour distinguishes almost nothing, and the underline is carrying the entire signal. At 45% of `currentColor` composited over the page, that underline measured **1.93:1** on light and **2.83:1** on dark. At 70% it measures **2.94:1** on light (`#ad571a` at 70% over `#ffffff`) and **4.89:1** on dark (`#f5b170` at 70% over `#252422`). 70% is a floor, not a target.

> **A link drops its underline only when it is alone in a navigation container. Never in a run of text.** Header nav, footer nav, breadcrumb: no underline. Everything inside a paragraph, a list item of prose, or a card body: underlined.

| State         | Light                                                    | Ratio vs page | Dark                            | Ratio vs page |
| ------------- | -------------------------------------------------------- | ------------- | ------------------------------- | ------------- |
| Rest          | `--text-accent` `#ad571a`                                | **5.05**      | `--text-accent` `#f5b170`       | **8.42**      |
| Hover         | `--text-accent-hover` `#853f14` + full-opacity underline | **7.73** ↑    | `--text-accent-hover` `#f7c28d` | **9.64** ↑    |
| Focus-visible | rest colour + 3px neutral ring                           | **5.05**      | rest colour + 3px neutral ring  | **8.42**      |
| Active        | `--text-accent-hover`                                    | **7.73**      | `--text-accent-hover`           | **9.64**      |
| Visited       | identical to rest                                        | —             | identical to rest               | —             |

Visited is not differentiated: a portfolio has a dozen destinations and a visited colour on a hero CTA reads as a bug.

**Current-page indicator in navigation.** The rule under the current nav item is an interface state and is held to 1.4.11's 3:1, exactly as §2.2's bold warning says. `--accent` on white is **2.10:1** and fails; `aria-current="page"` does not excuse a visual requirement, it satisfies a different one.

```css
.nav-link[aria-current='page'] {
  font-weight: 600; /* state is not colour alone */
  box-shadow: inset 0 -2px 0 var(--accent-rim);
}
```

`--accent-rim` resolves to `orange-600` on light (**3.17** against `--surface-page`, 3.04 against `--surface-raised`) and to `orange-500` on dark (**7.39** against `--surface-page`). The weight change from 500 to 600 is the redundant channel required by §3.4's rule 3 — and the reason the rule is stated three times in this document is that the previous revision published a 2.10:1 state indicator two sections after warning against exactly that number.

### 10.3 Form fields

One form on the site, and it is the conversion page. Full spec of the surrounding behaviour is in spec 02; this is the visual contract.

```css
.field-input {
  font: inherit;
  min-height: 2.75rem; /* 44px */
  padding: var(--space-2) var(--space-3); /* 8 / 16 */
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--surface-field);
  color: var(--text-primary);
}
.field-input::placeholder {
  color: var(--text-secondary);
}
.field-label {
  /* .t-label */
}
```

`background` reads `--surface-field`, not `light-dark(var(--color-neutral-0), var(--color-neutral-900))`. A component reaching into the primitive tier is the one thing ADR-0009 forbids outright, and it was doing it in the four lines that define the site's only form.

**Every ratio in this table is measured against the field's own background** — `#ffffff` in light, `#1b1a18` in dark. The previous revision measured the rest row against the field and the error, success and placeholder rows against the _page_ (`#252422`), which understated three figures and made the table internally inconsistent.

| State         | Light — on `#ffffff`                                                | Dark — on `#1b1a18`                                                 |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Rest          | ink `--text-primary` **17.39**, border `--border-strong` **4.55**   | ink `--text-primary` **16.68**, border `--border-strong` **3.82**   |
| Placeholder   | `--text-secondary` **6.63**                                         | `--text-secondary` **11.77**                                        |
| Hover         | border `--border-hover` **6.63**                                    | border `--border-hover` **6.97**                                    |
| Focus-visible | border `--focus-ring` **17.39**, + 3px ring at offset 2             | border `--focus-ring` **17.39**, + 3px ring                         |
| Error         | border `--border-danger` **5.99**, message `--text-danger` **8.50** | border `--border-danger` **5.72**, message `--text-danger` **8.48** |
| Success       | border `--border-success` **6.06**                                  | border `--border-success` **6.33**                                  |
| Disabled      | bg `--surface-sunken`, ink `--text-secondary` **6.09**              | bg `--surface-raised`, ink `--text-secondary` **9.52**              |

For reference, the same dark borders measured against the _page_ rather than the field: `--border-danger` 5.10, `--border-success` 5.64, placeholder 10.50. Those are the numbers the previous revision published as if they described the field.

Placeholders use `--text-secondary`, which is now the only secondary ink. A placeholder sits on the least forgiving background in the system and clears 6.63 / 11.77 there.

Error state never relies on colour alone: red border **and** an icon **and** the message text, wired with `aria-describedby` and `aria-invalid`. The label is a real `<label>`; floating labels do not replace one.

**Checkboxes and radios.** The contact form carries a GDPR consent checkbox. Without `accent-color` the browser paints the tick in system blue on an orange site.

```css
input[type='checkbox'],
input[type='radio'] {
  accent-color: var(--accent);
  inline-size: 1.25rem;
  block-size: 1.25rem;
  margin: 0;
}
.field-check {
  display: grid;
  grid-template-columns: 1.25rem 1fr;
  gap: var(--space-2);
  align-items: start;
  min-height: 2.75rem; /* the label is the 44px target */
  align-content: center;
}
.field-check > label {
  /* .t-small */
}
```

`accent-color: var(--accent)` renders the checked box as `#f2a154` with the browser's own tick. The tick is white in both themes at the browser's discretion; `--accent` against white is 2.10:1, so the box's _boundary_ is what carries the state visually and it comes from the UA's own high-contrast border — which is why the `forced-colors` block in §9.5 covers `.field-input` and why the checkbox is never the sole indicator of a required consent (the submit is blocked and the error message is announced).

### 10.4 Cards

A project card is `--surface-raised` on `--surface-page`: **1.04:1** in light, 1.10:1 in dark. That will be raised in any audit, so the position is stated rather than discovered:

> **The card is not identified by its outline. It is identified by its content** — image, title, technology chips. 1.4.11 requires 3:1 for the boundary of a control _whose boundary is what identifies it_; a card whose visible content is a photograph and a heading is not in that case. The whole card is the clickable region, wrapped by a single link over the title with the card as its extended hit area, so there is one target and one accessible name.

The card's only required contour indicator is its focus state, which is the ring from §10 at 17.39 (light) / 15.51 (dark) against the page.

```css
.card {
  position: relative;
  background: var(--surface-raised);
  border-radius: var(--radius-md);
  box-shadow: var(--elevation-1);
  transition:
    box-shadow 200ms,
    transform 200ms;
}
.card:hover {
  box-shadow: var(--elevation-2);
}
.card:focus-within {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

**`outline-offset` on a full-bleed card.** At `--width-full` the card touches the viewport edge and a `+2px` offset is drawn outside it, where it is clipped and can trigger horizontal overflow. Any card that reaches the viewport edge flips to `outline-offset: -3px`, drawing the ring just inside its own boundary. The ratio is unchanged — the ring is measured against `--surface-raised` (16.68 light / 14.06 dark), not the page.

### 10.5 Chips, images and tables

**Chips** — the stack and technology pills that replace the monospace.

```css
.chip {
  /* .t-overline metrics: 13px / 1.2 / 0.12em / 600 / uppercase */
  color: var(--text-accent-hover);
  background: var(--accent-wash);
  border: 1px solid var(--accent-rim);
  border-radius: var(--radius-pill);
  padding: var(--space-1) var(--space-2);
}
```

The ink is `--text-accent-hover`, not `--text-accent`: on `--accent-wash` the latter measures **4.27** in light, below AA at 13px. `--text-accent-hover` measures **6.53** (light) and **7.93** (dark) on the same fill. The rim measures 2.68 against the chip fill in light — below 3:1, and acceptable because a chip is not interactive and its label carries all of its information; the rim is decoration.

**Images.**

```css
img {
  max-inline-size: 100%;
  block-size: auto;
  background: var(--surface-sunken);
}
img[width][height] {
  aspect-ratio: attr(width) / attr(height);
} /* or an inline style */
.media {
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
}
.media > img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
```

Every `<img>` carries an `aspect-ratio` — from its own `width`/`height` attributes where they are known, from `.media` where the container fixes the crop. Without it the fluid type above reflows around images as they load, which is the CLS the whole spec is trying to avoid. The `--surface-sunken` background is what the reader sees while the image is in flight, and it is also what they see if it never arrives: a broken image renders its `alt` text on that surface, so the alt string is styled deliberately rather than left as unstyled 16px black on transparent.

```css
img {
  font: inherit;
  color: var(--text-secondary);
} /* alt text, on --surface-sunken */
```

`--text-secondary` on `--surface-sunken` is **6.09** (light) / **11.77** (dark). Alt text is content, and it is legible.

**Tables.** The back office lists projects and media; removing the monospace makes tables one of the two places where numeric alignment matters (§4.4 is the other).

```css
table {
  inline-size: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
th {
  text-align: start;
  color: var(--text-secondary); /* .t-label */
  border-block-end: 1px solid var(--border-strong);
}
td {
  border-block-end: 1px solid var(--border-subtle);
}
th,
td {
  padding: var(--space-2) var(--space-3);
}
tbody tr:hover {
  background: var(--surface-sunken);
}
caption {
  text-align: start;
  color: var(--text-secondary);
  margin-block-end: var(--space-2);
}
```

`--text-secondary` on `--surface-page` for headers: **6.63** / **10.50**. The row hover uses `--surface-sunken`, at 1.09 against the light page and 1.12 against the dark one; that is below the 1.05 rule's spirit in light but a table row hover is a pointer affordance on a static list, not a state that carries information, and the 1.09 figure is stated here rather than left implicit.

**Skip link.** ADR-0010 requires one; it had no style.

```css
.skip-link {
  position: absolute;
  inset-block-start: var(--space-2);
  inset-inline-start: var(--space-2);
  z-index: 100;
  transform: translateY(-200%);
  background: var(--surface-page);
  color: var(--text-primary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  box-shadow: var(--elevation-2);
}
.skip-link:focus-visible {
  transform: none;
}
```

```html
<a class="skip-link t-label" href="#contenu">Aller au contenu</a>
...
<main id="contenu" tabindex="-1">…</main>
```

It is moved out of view by `transform`, not `display: none` or `visibility: hidden`, which would make it unfocusable. `<main tabindex="-1">` is why the focus selector in §10 excludes `[tabindex="-1"]`.

---

## À valider avec Stéphane — To validate with Stéphane

Everything below is **settled**. Stéphane reviewed the rendered specimens on 2026-08-31 and ruled on each. Kept here with the reasoning, because these choices change how the site looks and someone reading this file later will want to know they were deliberate.

1. **One type family, no monospace.** Instrument Sans, variable, 400–700. The mono's four jobs are done by an overline class, tabular numerals, a tracked identifier class, and — for code blocks — nothing, because the site has none. One voice; the images carry the personality.

2. **Section themes are fixed and ignore `prefers-color-scheme`.** Home and Developer are always light, 3D is always dark. `:root { color-scheme: light }`, never `light dark`. The light/dark break is the site's strongest effect and an OS setting must not be able to cancel it. Recorded in ADR-0009.

3. **Warm neutrals, and body at 16→18px.** Every grey carries a warm hue at 4–20% saturation; the dark page becomes `#252422` instead of `#242424`. The body scale moves from the current 14px to 16–18px, with `--text-meta` floored at 13px. Fewer words per screen, more air — the right trade on a site where images are the product.

4. **The primary button keeps its white label, on a deeper orange.** Stéphane wanted the white ink of the current button. White on `#f2a154` is 2.10:1 and unusable, so the fill deepens along the same hue to `#ad571a` (5.05:1). The hue is unchanged; only its density moves, and `#f2a154` keeps every other job in the system. Consequence: this button's states **darken** rather than brighten — 5.05 → 6.52 → 8.46. See §3.4 and §10.1.

5. **The 3D section letterboxes in `#12100f`, not in the page colour.** Compared side by side against a render, the darker frame won: it detaches the image and concentrates the eye. `--color-neutral-950` returns as a primitive with exactly one consumer, `--surface-letterbox`, at 1.22:1 from the page and 1.35:1 from a raised surface — a readable frame that cannot compete with the render inside it.

6. **The dark status blocks are approved as derived.** `#43302d` and `#25372c` were computed rather than designed; seen next to the orange in a real confirmation block, they hold. No change.

7. **`--measure: 62ch` is confirmed by reading.** Judged on real French copy set in Instrument Sans at 18px rather than on the character-per-`ch` estimate.

**Two things still to watch in a browser, not decisions:** the three `size-adjust` / `ascent-override` / `descent-override` values in §4.1 are placeholders until measured against the real face, and the five-layer `box-shadow` interpolation in §7 is arithmetically sound but the card hover has to be seen fading before it is signed off.
