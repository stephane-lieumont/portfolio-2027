import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LocalizedPipe, localized } from '../../core/i18n/localized';
import { PATHS } from '../../core/i18n/site-locale';
import type { StaticProject } from '../../core/static-content';
import { introBase } from '../world/world-hero';
import { heroTitle, projectLinks } from './project-view';

/**
 * The project page's hero: the way back and the project's rank, series · year
 * and role, the title rising letter by letter as the world pages' name does,
 * then the links the project has. The letters are split in the template, so
 * the prerendered page carries them and the entrance runs on CSS alone; the
 * heading keeps its plain title for screen readers.
 */
@Component({
  selector: 'app-project-hero',
  imports: [RouterLink, LocalizedPipe],
  templateUrl: './project-hero.html',
  styleUrl: './project-hero.scss',
  host: {
    class: 'hero entrance--intro',
    '[style.--entrance-base.ms]': 'entranceBase()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectHero {
  readonly project = input.required<StaticProject>();
  readonly rank = input.required<string>();
  readonly total = input.required<string>();
  /** « Voir la vidéo » pressed: the page brings its player into view. */
  readonly videoRequested = output<MouseEvent>();

  protected readonly eyebrow = computed(() => {
    const { series, releasedAt } = this.project();
    return [series, releasedAt.slice(0, 4)].filter(Boolean).join(' · ');
  });
  protected readonly heading = computed(() => heroTitle(localized(this.project().title)));
  protected readonly entranceBase = computed(() => introBase(this.heading().nameText));
  protected readonly links = computed(() => projectLinks(this.project()));
  protected readonly devPath = PATHS.dev;
  // A plain href, so it carries the tree's base (`/en/`) itself.
  protected readonly videoHref = computed(() =>
    this.location.prepareExternalUrl(`${PATHS.dev}/${localized(this.project().slug)}#video`),
  );
  private readonly location = inject(Location);

  protected requestVideo(event: MouseEvent): void {
    this.videoRequested.emit(event);
  }
}
