import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { mediaSrcset, mediaUrl } from '../../core/media.config';
import { toolView } from '../../core/content/tool-marks';
import { PROJECTS } from '../../core/static-content';
import { PlateImage } from './plate-image';
import { workCount } from './work-count';
import { WorldReveal } from './world-reveal';

/**
 * The developer world's work: a sticky label column, then the projects as
 * numbered plates. Every card says its title, year and tools at rest; hover
 * and focus only bring one forward (spec 01: nothing editorial on hover alone).
 * Cards lead to /developpeur/<slug>, the interim detail page.
 */
@Component({
  selector: 'app-dev-work',
  imports: [RouterLink, WorldReveal, PlateImage],
  template: `
    <section class="work band" aria-labelledby="work-title">
      <div class="work__head" appWorldReveal="lines">
        <h2 id="work-title">Réalisations</h2>
        <p class="work__count">
          <b>{{ count.count }}</b> projets · {{ count.span }}
        </p>
      </div>
      <ul class="rows" role="list">
        @for (project of projects; track project.slug) {
          <li class="row enter-line" [style.--line]="lineStart() + $index" appWorldReveal="row">
            <a class="row__link" [routerLink]="['/developpeur', project.slug]">
              <span class="row__frame plate" [style.--plate-tone]="project.cover.averageColor">
                <img
                  class="row__img"
                  appPlate="wall"
                  [src]="mediaUrl(project.cover.key)"
                  [srcset]="srcset(project.cover.key, project.cover.width)"
                  [sizes]="sizes"
                  [alt]="project.cover.alt"
                  [width]="project.cover.width"
                  [height]="project.cover.height"
                  loading="lazy"
                  decoding="async"
                />
                <span class="plate__fallback" aria-hidden="true">
                  <span class="plate__fallback-label">Image indisponible</span>
                  <span class="plate__fallback-alt">{{ project.cover.alt }}</span>
                </span>
              </span>
              <span class="row__cap">
                <span class="row__title">{{ project.title }}</span>
                <span class="row__year">{{ project.year }}</span>
                <span class="row__tools">
                  @for (tool of project.tools; track tool.slug) {
                    <span class="tool">
                      @if (tool.mask) {
                        <span
                          class="tool__icon"
                          [style.--mask]="tool.mask"
                          aria-hidden="true"
                        ></span>
                      }
                      {{ tool.label }}
                    </span>
                  }
                </span>
              </span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styleUrl: './dev-work.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevWork {
  /** Where the cards fall in the page's entrance, after the hero's lines. */
  readonly lineStart = input(0);

  protected readonly mediaUrl = mediaUrl();
  protected readonly srcset = mediaSrcset();
  // The plates' width in each layout: a full column below 600px, half the
  // grid from 600px, half of the three-quarter column from 900px, capped with
  // the 1320px page.
  protected readonly sizes =
    '(min-width: 1352px) 474px, (min-width: 900px) calc(37.5vw - 33px), (min-width: 600px) calc(50vw - 28px), calc(100vw - 32px)';
  protected readonly count = workCount(PROJECTS.map((p) => p.releasedAt));
  protected readonly projects = PROJECTS.map((project) => ({
    ...project,
    year: project.releasedAt.slice(0, 4),
    tools: project.technologies.map((slug) => toolView(slug)),
  }));
}
