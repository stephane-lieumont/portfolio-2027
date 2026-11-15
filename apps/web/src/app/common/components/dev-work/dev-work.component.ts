import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { mediaSrcset, mediaUrl } from '../../../core/config/media.config';
import { toolView } from '../../../core/data/tool-marks';
import { InLocalePipe } from '../../../core/i18n/in-locale.pipe';
import { PATHS } from '../../../core/i18n/site-locale';
import { PROJECTS, type StaticProject } from '../../../core/data/static-content';
import { PlateImageDirective } from '../../directives/plate-image/plate-image.directive';
import { workCount } from '../../utils/work-count';
import { WorldRevealDirective } from '../../directives/world-reveal/world-reveal.directive';

/**
 * The developer world's work: a sticky label column, then the projects as
 * numbered plates. Every card says its title, year and tools at rest; hover
 * and focus only bring one forward (spec 01: nothing editorial on hover alone).
 * Cards lead to each project's page. A project page ends on the same band,
 * with its series or a few other projects, the page's own card marked and not
 * a link.
 */
@Component({
  selector: 'app-dev-work',
  imports: [NgTemplateOutlet, RouterLink, InLocalePipe, WorldRevealDirective, PlateImageDirective],
  template: `
    <section class="work band" aria-labelledby="work-title">
      <div class="work__head" appWorldReveal="lines">
        <h2 id="work-title">{{ heading() }}</h2>
        <p class="work__count">
          <ng-container i18n="@@work.count"
            ><b>{{ count().count }}</b> projets · {{ count().span }}</ng-container
          >
        </p>
      </div>
      <ul class="rows" [class.rows--3]="columns() === 3" role="list">
        @for (project of cards(); track project.id) {
          <li
            class="row enter-line"
            [class.is-current]="project.id === current()"
            [style.--line]="lineStart() + $index"
            appWorldReveal="row"
          >
            @if (project.id === current()) {
              <div class="row__link" aria-current="page">
                <ng-container
                  [ngTemplateOutlet]="card"
                  [ngTemplateOutletContext]="{ $implicit: project, here: true }"
                />
              </div>
            } @else {
              <a class="row__link" [routerLink]="[devPath, project.slug | inLocale]">
                <ng-container
                  [ngTemplateOutlet]="card"
                  [ngTemplateOutletContext]="{ $implicit: project, here: false }"
                />
              </a>
            }
          </li>
        }
      </ul>
    </section>

    <ng-template #card let-project let-here="here">
      <span class="row__frame plate" [style.--plate-tone]="project.cover.averageColor">
        <img
          class="row__img"
          appPlate="wall"
          [src]="mediaUrl(project.cover.key)"
          [srcset]="srcset(project.cover.key, project.cover.width)"
          [sizes]="sizes()"
          [alt]="project.cover.alt | inLocale"
          [width]="project.cover.width"
          [height]="project.cover.height"
          loading="lazy"
          decoding="async"
        />
        <span class="plate__fallback" aria-hidden="true">
          <span class="plate__fallback-label" i18n="@@plate.unavailable">Image indisponible</span>
          <span class="plate__fallback-alt">{{ project.cover.alt | inLocale }}</span>
        </span>
      </span>
      <span class="row__cap">
        <span class="row__title">{{ project.title | inLocale }}</span>
        <span class="row__year">{{ project.year }}</span>
        <span class="row__tools">
          @for (tool of project.tools; track tool.slug) {
            <span class="tool">
              @if (tool.mask) {
                <span class="tool__icon" [style.--mask]="tool.mask" aria-hidden="true"></span>
              }
              {{ tool.label }}
            </span>
          }
        </span>
        @if (here) {
          <span class="row__here" i18n="@@work.here">Cette fiche</span>
        }
      </span>
    </ng-template>
  `,
  styleUrl: './dev-work.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevWorkComponent {
  /** Where the cards fall in the page's entrance, after the hero's lines. */
  readonly lineStart = input(0);

  readonly heading = input($localize`:@@work.heading:Réalisations`);
  readonly projects = input<readonly StaticProject[]>(PROJECTS);
  /** The id of the project whose page this band closes, if it is one of the cards. */
  readonly current = input<string | null>(null);
  readonly columns = input<2 | 3>(2);

  protected readonly devPath = PATHS.dev;
  protected readonly mediaUrl = mediaUrl();
  protected readonly srcset = mediaSrcset();
  // The plates' width in each layout: a full column below 600px, half the
  // grid from 600px, then a half or a third of the three-quarter column from
  // 900px, capped with the 1320px page.
  protected readonly sizes = computed(() =>
    this.columns() === 3
      ? '(min-width: 1352px) 308px, (min-width: 900px) calc(25vw - 30px), (min-width: 600px) calc(50vw - 28px), calc(100vw - 32px)'
      : '(min-width: 1352px) 474px, (min-width: 900px) calc(37.5vw - 33px), (min-width: 600px) calc(50vw - 28px), calc(100vw - 32px)',
  );
  protected readonly count = computed(() => workCount(this.projects().map((p) => p.releasedAt)));
  protected readonly cards = computed(() =>
    this.projects().map((project) => ({
      ...project,
      year: project.releasedAt.slice(0, 4),
      tools: project.technologies.map((slug) => toolView(slug)),
    })),
  );
}
