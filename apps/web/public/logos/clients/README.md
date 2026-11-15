# Client logos

The logos on the client references' cards and pages (Stéphane, 2026-11-15).
Third-party trademarks, shown by his choice.

- One file per reference, named after the project's French slug
  (`static-content.ts`, `logo.src`): `immobilier-ch.svg`, `web-atrio.svg`,
  `cir-scancir.png`, `linxea.svg`, `ledger.svg`.
- Drawn as a CSS mask filled with the world's ink: only the shape's alpha
  counts, its colours never show. An SVG must have no script and no embedded
  style that hides a shape; a PNG must carry the mark in its alpha channel.
- Replacing a file under the same name swaps the logo with no code change.

Sources, all supplied by Stéphane on 2026-11-15:

- `web-atrio.svg`: the mark only, as supplied.
- `linxea.svg`: the wordmark; its embedded `<style>` (white fill) removed.
- `immobilier-ch.svg`: the wordmark; its two-colour `<style>` removed, and the
  white Swiss cross merged into the red square as an even-odd hole, so it stays
  cut out in one ink.
- `cir-scancir.png`: an alpha mask made from his JPG (gradients), 783×414.
- `ledger.svg`: the wordmark from Ledger's own site, as supplied.
