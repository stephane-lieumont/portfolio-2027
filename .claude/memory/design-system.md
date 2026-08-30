---
name: design-system
description: Art direction for Portfolio 2027 — audit of the current site, what we keep, what we modernize, tokens
metadata:
  type: project
---

# Art direction

## The brief, in Stéphane's words

He is **broadly happy with the current look** of stephane-lieumont.fr, but finds it **short on modernity**. The rebuild is a refresh, not a blank slate — getting the level of ambition wrong here means throwing away what works.

He explicitly asks to **go through the current site, respect its design and modernize it, while revising the wording**.

## Audit of the existing site (2026-08-31)

### The site is light, not dark

Corrected assumption: the home page and the Developer section are on a **light theme** (white background, text `#242424`). Only the **3D Graphics section switches to dark** (`#242424`), to let the renders dominate.

**This is a good design decision, to keep and to commit to further**: the theme follows the nature of the content. The code expresses it through two classes on `<main>` — `theme-ligth` (typo included) and `theme-dark` — which recolor everything by hand.

### Actual palette

| Role                    | Value                                                    |
| ----------------------- | -------------------------------------------------------- |
| Primary accent          | `#f2a154` (sand orange) — written **40 times hardcoded** |
| Primary text            | `#242424` — also serves as the 3D section background     |
| Secondary text          | `#7e7d7d`                                                |
| Light accent (hover)    | `#fad8b8`, `#fcecdd`, `hsla(29,87%,85%,.9)`              |
| Dark accent             | `#c28143`                                                |
| Footer background       | `#464646`                                                |
| Work section background | `#f9f9f9`                                                |
| Error / success         | `#cc4534` / `#1aa260`                                    |

**Zero CSS custom properties** across the whole site. No `prefers-color-scheme`.

### Typography

`html { font-size: 62.5% }` (1rem = 10px). **Open Sans** everywhere, **Poppins** on the header's single `<h1>`, and **Arial on every button** — because `.button` declares no `font-family` and inherits the user agent's. The Poppins/Open Sans pairing is the default duo of 2018 templates.

**11 sizes between 9.6px and 28px, with no ratio**: body at 14px, hero `h2` at 25.2px, `h1` at 28px — and that 28px is only the browser's default `2em`, not a decision. `line-height: normal` almost everywhere, no `letter-spacing` at all, a single `clamp()` in the entire CSS.

### Spacing, radii, shadows

No system: px, em and rem mixed together; gutters in `%` on the projects grid (34.8px at 1160px, 57.6px at 1920px) and in `px` on the 3D gallery. **Four radii with no scale** (`2em`, `10px`, `5px`, `3px`). **A single shadow** (`0 8px 24px hsla(210,8%,62%,.2)`) for the whole site.

**No maximum content width** outside the Contact page: at 1920px, paragraphs stretch across 1800px.

### Motion

This is the most crafted part of the site — 29 `@keyframes`, a homegrown `.reveal` system, a home page entrance built on a retracting panel. But the cascades are linear and uncapped: the hero takes **1.2s** to assemble, and the 16th gallery tile arrives **2.4s** after the first. **No `prefers-reduced-motion` anywhere.**

## Assets to preserve

- **Orange accent `#f2a154`** as the brand signature.
- **The theme follows the content**: light for dev, dark for 3D.
- **Full-screen background** (render or video) at first contact.
- **Dual dev / 3D path** straight from the home page — Stéphane confirmed on 2026-08-31 that he wants to **keep two separate paths**, not a unified filtered list.
- Sections: Home, Developer, 3D Graphics, Contact, plus a downloadable CV.
- **The care put into motion** — to recalibrate, not to remove.

## Dropped

- **The opening quotation** (« La passion est un désir qui se mue en plaisir », attributed to Romain Guilleaumes). Settled by Stéphane on 2026-08-31: it is one thing too many. The audit confirms the formal problem — the attribution set at 9.6px right under the `<h1>` « Stéphane Lieumont » reads as a mistaken identity.

## Functional defects to fix first

These are not matters of taste: the site is losing information and visitors.

1. **All editorial content on the cards sits behind `:hover`**, with no `@media (hover:hover)`. On mobile, the Work section is **six anonymous screenshots** — no title, no technology, no year. Same for the 16 3D tiles.
2. **Contact is unreachable from the navigation on mobile**: the Contact and CV buttons are `display:none` below 1200px, and the burger menu contains no Contact link.
3. **Button hover degrades contrast** (peach on peach, ≈ 2:1): the hovered state is less legible than the resting state. WCAG failure.
4. **Home page at 3.46 MB**, of which **2.88 MB is an autoplaying MP4 bundled into the build**. Portrait loaded twice, logos in base64, no WebP/AVIF, no `srcset`, no `loading="lazy"`.
5. **The fixed transparent header** passes over the colored logos of the Developer section: the title becomes illegible.
6. **Main navigation locked inside a burger even at 1920px.**
7. **Type hierarchy collapses on mobile**: body rises to 16px while headings drop to 19.2px — the ratio falls from 1.7× to 1.2×.

## Guiding principle

**The design is the frame, the images are the product.** If an interface element competes with a render, the element is wrong.

## Hard constraints

- **AA contrast minimum**, hover states included — that is exactly where the current site fails.
- Everything through **CSS custom property tokens**, no hardcoded values.
- **No editorial information reachable only on hover.**
- The site's content is **in French**: never size a width around a short English word.

## Token status

To be settled during the specs phase with the `design-expert` agent, from the audit above. Directions already identified: anchor the body at 16–18px and open the hero with a `clamp()`, set a type scale with a named ratio, a spacing scale, three radii at most, two or three tinted shadow layers, and a maximum content width.

See [[tech-stack]] for implementation constraints and [[content-guidelines]] for editorial.
