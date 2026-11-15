# Client logos

The logos on the client references' cards and pages (Stéphane, 2026-11-15).
Third-party trademarks, shown by his choice, in their own colours.

- One file per reference, named after the project's French slug
  (`static-content.ts`, `logo.src`, with the file's intrinsic `width` and
  `height`, which set its optical size): `immobilier-ch.svg`, `web-atrio.svg`,
  `cir-scancir.png`, `linxea.svg`, `ledger.svg`.
- Shown as an image on a light plate (`--color-sand-100`) in both worlds: a
  logo must read on that light ground. No script in an SVG.
- Replacing a file under the same name swaps the logo with no code change;
  if its proportions change, update `width` and `height` beside `src`.

Sources, all supplied by Stéphane on 2026-11-15:

- `immobilier-ch.svg`, `web-atrio.svg`, `ledger.svg`: his files, unchanged.
- `cir-scancir.png`: a transparent colour PNG made from his JPG (gradients
  kept, white background removed), 783×414. Its WebP variants
  `cir-scancir-240.webp` and `-480.webp` (alpha kept) are written by
  `pnpm --filter @portfolio/api media:public`; re-run it after replacing the
  PNG.
- `linxea.svg`: his file is the white version, invisible on the light plate;
  filled here in the site's dark ink (`#12100f`, `--color-neutral-950`) until
  a colour version arrives — replace the file to swap it.
