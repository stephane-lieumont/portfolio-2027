# ADR-0015 — The 3D mosaic crops renders around a focal point

- **Status**: Accepted
- **Date**: 2026-11-14
- **Amends**: ADR-0012 (« Renders are no longer cropped by CSS »)

## Context

ADR-0012 stopped cropping renders: a 3D piece's framing is an authorial choice, and the 2022 site lost half of a vertical render to a fixed-height box. Containers take the media's intrinsic ratio, and only screenshots may use `object-fit: cover`.

The 3D world's work section was then redesigned as a composed mosaic: renders packed edge to edge in tiles of deliberately different shapes — 16:9, 4:3, 8:3, 2:3, 2:1 — with a full-screen viewer behind each tile. Stéphane reviewed the mockup and approved its crops on 2026-11-14 (« les recadrages me vont »), then chose to keep cropping for the real gallery of sixteen pieces, with a focal point per piece and the layout repeated.

## Decision

- **The mosaic may crop.** Its tiles use `object-fit: cover`, positioned by a focal point.
- **The crop is never the only way to see a piece.** Every tile opens the viewer, which always shows the whole render at its own ratio. ADR-0012's rule stands everywhere else.
- **Each artwork view carries a focal point**: `focal: { x, y }` in `[0, 1]`, defaulting to the centre. It is content, editable in the back office next to the view it belongs to (spec 03).
- **The layout is a pattern of six tiles in five shapes (16:9, 4:3, 8:3, 2:3, 2:1 — two tiles are 4:3), repeated** in `releasedAt` order across all published pieces. A piece's tile shape follows from its position in that order, not from a field.

## Consequences

The mosaic keeps the density and rhythm Stéphane approved, at sixteen pieces as well as six, and the viewer still honours every render's full composition.

Accepted downsides:

- **Some crops will be wrong until set.** A new piece is cropped around its centre; a face or a subject off-centre needs its focal point adjusted by hand, or it loses what matters in an 8:3 band or a 2:3 column.
- **Publishing order moves crops.** Because the shape follows the position, adding a newer piece shifts every older one into a different tile shape. A focal point chosen for a 2:3 column may be wrong in an 8:3 band. The back office has to preview the mosaic, not a single tile.
- **The rule now has an exception**, which is how rules erode. This ADR limits it to the mosaic tiles, with the viewer as the guarantee.

## Alternatives considered

**No cropping: tiles at each render's intrinsic ratio** — fully faithful to ADR-0012. Rejected by Stéphane: the composition becomes a regular masonry and loses the « deconstructed » mosaic he asked for.

**A mosaic of the `featured` pieces only, the rest in the viewer** — crops fewer pieces. Rejected by Stéphane: the other pieces would only be reachable by paging through the viewer.

**A stored tile shape per piece** — no crop moves when a piece is added. Rejected for now: it makes the layout an editorial chore with sixteen pieces and lets two choices collide in the grid. Revisit if publishing order keeps breaking crops in practice.
