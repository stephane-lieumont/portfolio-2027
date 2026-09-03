import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RegistryEntry } from '@portfolio/shared-types/registries';

/**
 * A tool as a mark and a name, the 2022 site's "specialities" treatment.
 *
 * Three sources, in order of preference:
 *
 * 1. The **transparent PNG** carried over from the 2022 site — the real brand
 *    mark, which is what Stéphane asked for. Twelve exist. They cover all six
 *    of the 3D tools and, of his current dev stack, only React.
 * 2. The **icon font** glyph. It covers TypeScript, Docker and Git, which have
 *    no PNG, so dropping the font would make the dev page emptier rather than
 *    truer to 2022.
 * 3. A **placeholder block** — a block, not an icon of a missing icon, so it
 *    reads as "not yet" instead of pretending to be a mark. Today that is
 *    Angular and .NET, which post-date both the font and the PNGs.
 *
 * The label carries the meaning in all three cases, which is why the row stays
 * legible while two tiles are empty. Adding a PNG to `public/logos/` and a line
 * to the registry is all it takes to fill one.
 */
@Component({
  selector: 'app-tech-logo',
  template: `
    <span class="tech-logo__tile" [class.tech-logo__tile--empty]="!marked()">
      @if (entry().logo) {
        <!-- Decorative: the label beside it is the accessible name, so an alt
             here would make a screen reader say the tool twice. -->
        <img class="tech-logo__mark" [src]="entry().logo" alt="" width="100" height="100" />
      } @else if (entry().glyph) {
        <span class="icon tech-logo__glyph" aria-hidden="true">{{ char() }}</span>
      }
    </span>
    <span class="t-label tech-logo__name">{{ entry().label }}</span>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      text-align: center;
    }

    /* No plate. The 2022 marks sat directly on the page, and that is what
       makes a row of them read as a shelf of tools rather than a set of
       buttons. Only the placeholder below draws a box. */
    .tech-logo__tile {
      display: grid;
      place-items: center;
      inline-size: var(--tech-logo-size);
      block-size: var(--tech-logo-size);
      color: var(--text-secondary);
    }

    /* Waiting on a mark. This one does need a box: without a plate, a tile
       with nothing in it is invisible and the row silently loses an item. */
    .tech-logo__tile--empty {
      background: var(--surface-inset);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-md);
    }

    /* Nearly the full box, since there is no plate to sit inside any more. */
    .tech-logo__glyph {
      font-size: calc(var(--tech-logo-size) * 0.86);
      line-height: 1;
    }

    /* The 2022 marks run 74 to 126px wide and are not square. Containing them
       in a fixed box gives them one optical size without distorting any. */
    .tech-logo__mark {
      inline-size: 100%;
      block-size: 100%;
      object-fit: contain;
    }

    .tech-logo__name {
      color: var(--text-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechLogo {
  readonly entry = input.required<RegistryEntry>();

  protected marked(): boolean {
    const entry = this.entry();
    return entry.logo !== null || entry.glyph !== null;
  }

  // The registry stores a CSS escape (\e927); the template needs the character.
  protected char(): string {
    const glyph = this.entry().glyph;
    return glyph ? String.fromCodePoint(Number.parseInt(glyph.replace('\\', ''), 16)) : '';
  }
}
