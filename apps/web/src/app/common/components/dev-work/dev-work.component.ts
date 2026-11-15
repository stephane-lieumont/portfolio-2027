import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PlateImageDirective } from '@common/directives/plate-image/plate-image.directive';
import { WorldRevealDirective } from '@common/directives/world-reveal/world-reveal.directive';
import { ClientLogoComponent } from '@common/components/client-logo/client-logo.component';
import { workCount, workPeriod } from '@common/utils/work-count/work-count';
import { mediaSrcset, mediaUrl } from '@core/config/media-config/media.config';
import { PROJECTS } from '@core/data/content/content.generated';
import type { Project } from '@portfolio/shared-types';
import { toolView } from '@core/data/tool-marks/tool-marks';
import { InLocalePipe, inLocale } from '@core/i18n/in-locale.pipe';
import { PATHS } from '@core/i18n/site-locale/site-locale';

/** A card names this many tools; its page lists them all. */
export const CARD_TOOLS = 6;

/**
 * The card's second line: the role, behind the employer it was held for when
 * the title does not already name it (« Chez Web-Atrio · » on a client
 * mission, not on Web-Atrio's own site nor on Case Tes Potes' products).
 */
function roleLine(project: Project): string {
  const role = inLocale(project.role);
  const { series } = project;
  if (!series || inLocale(project.title).startsWith(series)) return role;
  return `${$localize`:@@work.at:Chez ${series}:series:`} · ${role}`;
}

/**
 * The developer world's work: a sticky label column, then the projects as
 * numbered plates, a client reference's plate bearing its logo. Every card
 * says its title, years, role and tools at rest; hover and focus only bring one
 * forward (spec 01: nothing editorial on hover alone).
 * Cards lead to each project's page. A project page ends on the same band,
 * with its series or a few other projects, the page's own card marked and not
 * a link.
 */
@Component({
  selector: 'app-dev-work',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    InLocalePipe,
    WorldRevealDirective,
    PlateImageDirective,
    ClientLogoComponent,
  ],
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
      @if (project.logo; as logo) {
        <span
          class="row__frame row__frame--logo plate"
          [class.logo-plate--dark]="project.logoPlate === 'dark'"
          [style.--logo-tint]="project.logoTint"
        >
          <app-client-logo class="row__logo" [logo]="logo" />
        </span>
      } @else if (project.cover; as cover) {
        <span class="row__frame plate" [style.--plate-tone]="cover.averageColor">
          <img
            class="row__img"
            appPlate="wall"
            [src]="mediaUrl(cover.key)"
            [srcset]="srcset(cover.key, cover.width)"
            [sizes]="sizes()"
            alt=""
            [width]="cover.width"
            [height]="cover.height"
            loading="lazy"
            decoding="async"
          />
          <span class="plate__wait" aria-hidden="true" i18n="@@plate.loading">Chargement…</span>
          <span class="plate__fallback" aria-hidden="true">
            <span class="plate__fallback-label" i18n="@@plate.unavailable">Image indisponible</span>
            <span class="plate__fallback-alt">{{ cover.alt | inLocale }}</span>
          </span>
        </span>
      }
      <span class="row__cap">
        <span class="row__title">{{ project.title | inLocale }}</span>
        <span class="row__year">{{ project.period }}</span>
        <span class="row__role">{{ project.roleLine }}</span>
        <span class="row__tools">
          @for (tool of project.tools; track tool.slug) {
            <span class="tool">
              @if (tool.mask) {
                <span class="tool__icon" [style.--mask]="tool.mask" aria-hidden="true"></span>
              }
              {{ tool.label }}
            </span>
          }
          @if (project.moreTools) {
            <span class="tool"
              >+{{ project.moreTools
              }}<span class="visually-hidden" i18n="@@work.moreTools"> autres outils</span></span
            >
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
  readonly projects = input<readonly Project[]>(PROJECTS);
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
  protected readonly count = computed(() => workCount(this.projects()));
  protected readonly cards = computed(() =>
    this.projects().map((project) => ({
      ...project,
      period: workPeriod(project),
      roleLine: roleLine(project),
      tools: project.technologies.slice(0, CARD_TOOLS).map((tool) => toolView(tool)),
      moreTools: Math.max(0, project.technologies.length - CARD_TOOLS),
    })),
  );
}
