# Log

What shipped, most recent first. One entry per merged pull request.

Commit messages carry the reasoning; this is the index.

## 2026-09-03

- **#10 — Project detail pages.** `/developpeur/<slug>` with context, mission,
  numbered steps, tools and series siblings. Copy revised from the 2022 site
  rather than carried over. Unknown slugs fall through to the 404 via `canMatch`.
  Corrected a false claim in `index.html` that the site was prerendered.

## 2026-09-01

- **#9 — Pac-Man loader, home entrance, 404 easter egg.** Inline loader with
  three independent exits and a one-second floor; the 2022 dot-eating and
  seamless-loop bugs fixed. Five-phase entrance. Travolta 404. Fixed the hover
  release, which had no transition at all because a `transition` shorthand was
  stripping `scale`.
- **#8 — Zoom release curve.** `cubic-bezier(0.45, 0, 0.25, 1)` after two wrong
  answers, one of which covered 49% of its distance in the first 10% of time.
- **#7 — Static Developer, 3D and Contact pages.**

## 2026-08-31 and before

- **#6 and earlier** — app shell and menu, home split, design system, monorepo
  scaffolding, ADRs 0000–0012, specs 00–03, 06, 07.
