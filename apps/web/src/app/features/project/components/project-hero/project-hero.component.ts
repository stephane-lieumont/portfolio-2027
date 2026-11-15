import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { introBase } from '@common/utils/hero-letters';
import { workPeriod } from '@common/utils/work-count/work-count';
import type { Project } from '@portfolio/shared-types';
import { InLocalePipe, inLocale } from '@core/i18n/in-locale.pipe';
import { PATHS } from '@core/i18n/site-locale/site-locale';
import { heroTitle, projectLinks } from '@features/project/utils/project-view/project-view';
import { ButtonComponent } from '@shared/components/kit-ui/button/button.component';

/**
 * The project page's hero: the way back and the project's rank, series · years
 * and role, the title rising letter by letter as the world pages' name does,
 * then the links the project has. The letters are split in the template, so
 * the prerendered page carries them and the entrance runs on CSS alone; the
 * heading keeps its plain title for screen readers.
 */
@Component({
  selector: 'app-project-hero',
  imports: [ButtonComponent, RouterLink, InLocalePipe],
  templateUrl: './project-hero.component.html',
  styleUrl: './project-hero.component.scss',
  host: {
    class: 'hero entrance--intro',
    '[style.--entrance-base.ms]': 'entranceBase()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectHeroComponent {
  readonly project = input.required<Project>();
  readonly rank = input.required<string>();
  readonly total = input.required<string>();

  protected readonly eyebrow = computed(() => {
    const project = this.project();
    return [project.series, workPeriod(project)].filter(Boolean).join(' · ');
  });
  protected readonly heading = computed(() => heroTitle(inLocale(this.project().title)));
  protected readonly entranceBase = computed(() => introBase(this.heading().nameText));
  protected readonly links = computed(() => projectLinks(this.project()));
  protected readonly devPath = PATHS.dev;
}
