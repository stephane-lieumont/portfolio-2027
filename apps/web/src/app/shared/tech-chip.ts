import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RegistryEntry } from '@portfolio/shared-types/registries';

/**
 * A tool, named and — where the font has a glyph — marked.
 *
 * The 2022 icon font predates Angular and .NET in Stéphane's stack, so those
 * carry no mark. That is deliberate: the label already carries the meaning, and
 * a hand-drawn stand-in for a logo everyone recognises looks worse than nothing
 * at all. If the marks matter, the answer is to extend the font, not to
 * approximate its glyphs in SVG.
 */
@Component({
  selector: 'app-tech-chip',
  template: `
    @if (entry().glyph) {
      <span class="icon tech-chip__glyph" aria-hidden="true">{{ char() }}</span>
    }
    <span>{{ entry().label }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding-inline: var(--space-2);
      padding-block: var(--space-1);
      background: var(--accent-wash);
      color: var(--text-accent-on-texture);
      border: 1px solid var(--accent-rim);
      border-radius: var(--radius-pill);
      font-size: var(--text-overline);
      line-height: 1.2;
      letter-spacing: 0.08em;
      font-weight: 600;
      text-transform: uppercase;
    }

    .tech-chip__glyph {
      font-size: 1.1em;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechChip {
  readonly entry = input.required<RegistryEntry>();

  // The registry stores a CSS escape (\e927); the template needs the character.
  protected char(): string {
    const glyph = this.entry().glyph;
    return glyph ? String.fromCodePoint(Number.parseInt(glyph.replace('\\', ''), 16)) : '';
  }
}
