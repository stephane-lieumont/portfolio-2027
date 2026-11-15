import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { WorldKey, WorldPage } from '@portfolio/shared-types';

import { toolView } from '../../core/content/tool-marks';
import { localized } from '../../core/i18n/localized';
import { SITE_LOCALE, type SiteLocale } from '../../core/i18n/site-locale';
import { NAV } from '../../shell/nav-items';

export const NAME = 'Stéphane Lieumont';

export interface Glyph {
  readonly char: string;
  /** Position among the visible letters, for the stagger. */
  readonly index: number;
}

/** The name as words of letters, indexed across the whole name. */
export function nameWords(name: string): Glyph[][] {
  let index = 0;
  return name.split(' ').map((word) => [...word].map((char) => ({ char, index: index++ })));
}

export interface RoleGlyph extends Glyph {
  readonly space: boolean;
  readonly italic: boolean;
  /** Position among the letters only, spaces skipped: the flip's stagger. */
  readonly step: number;
}

/**
 * The accent letters of each role word, set in Instrument Serif italic: the A
 * of LEAD, and « 3D » whole (presentation, spec 03). Positions in the word,
 * which differ between « GRAPHISTE 3D » and « 3D ARTIST ».
 */
const ACCENTS: Readonly<Record<WorldKey, Readonly<Record<SiteLocale, readonly number[]>>>> = {
  dev: { fr: [2], en: [2] },
  cgi: { fr: [10, 11], en: [0, 1] },
};

export function roleGlyphs(
  word: string,
  world: WorldKey,
  locale: SiteLocale = SITE_LOCALE,
): RoleGlyph[] {
  let step = 0;
  return [...word].map((char, index) => ({
    char,
    index,
    space: char === ' ',
    italic: ACCENTS[world][locale].includes(index),
    step: char === ' ' ? step : step++,
  }));
}

/** Letters before the role flips in: the name's rise, ending at 260 + n × 38 ms, then 220 ms. */
export function introBase(name: string): number {
  return 260 + name.replace(/\s/g, '').length * 38 + 220;
}

/**
 * The hero of a world page: the label row, the name rising letter by letter,
 * the role flipping in. The letters are split in the template, so the
 * prerendered page carries them and the entrance runs from first paint on CSS
 * alone (src/styles/_world-page.scss); the heading keeps its plain name.
 */
@Component({
  selector: 'app-world-hero',
  template: `
    <div class="eyebrow">
      <span class="enter-line" style="--line: 0">{{ label() }}</span>
      <span class="enter-line" style="--line: 1">{{ tools() }}</span>
    </div>
    <h1 class="name" [attr.aria-label]="name">
      @for (word of words; track $index) {
        <span class="name__word" aria-hidden="true">
          @for (glyph of word; track glyph.index) {
            <span class="name__char" [style.--c]="glyph.index">{{ glyph.char }}</span>
          }
        </span>
        {{ ' ' }}
      }
    </h1>
    <p class="word">
      <span class="visually-hidden">{{ roleWord() }}</span>
      @for (glyph of role(); track glyph.index) {
        @if (glyph.space) {
          <span class="word__space" aria-hidden="true"></span>
        } @else {
          <span
            class="word__char"
            [class.word__char--italic]="glyph.italic"
            [style.--c]="glyph.step"
            aria-hidden="true"
            >{{ glyph.char }}</span
          >
        }
      }
    </p>
  `,
  styleUrl: './world-hero.scss',
  host: { class: 'hero' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldHero {
  readonly page = input.required<WorldPage>();

  protected readonly name = NAME;
  protected readonly words = nameWords(NAME);

  protected readonly label = computed(() => NAV[this.page().world].label);
  protected readonly tools = computed(() => {
    const page = this.page();
    return page.eyebrowTools.map((slug) => toolView(slug).label).join(' · ');
  });
  protected readonly roleWord = computed(() => localized(this.page().roleWord));
  protected readonly role = computed(() => roleGlyphs(this.roleWord(), this.page().world));
}
