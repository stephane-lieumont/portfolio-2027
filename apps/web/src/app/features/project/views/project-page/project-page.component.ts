import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ClientLogoComponent } from '@common/components/client-logo/client-logo.component';
import { DevWorkComponent } from '@common/components/dev-work/dev-work.component';
import {
  BODY_RAMP,
  ScrubSentenceComponent,
} from '@common/components/scrub-sentence/scrub-sentence.component';
import { PlateImageDirective } from '@common/directives/plate-image/plate-image.directive';
import { WorldRevealDirective } from '@common/directives/world-reveal/world-reveal.directive';
import { mediaSrcset, mediaUrl } from '@core/config/media-config/media.config';
import { PROJECTS } from '@core/data/content/content.generated';
import type { Project } from '@portfolio/shared-types';
import { toolView } from '@core/data/tool-marks/tool-marks';
import { InLocalePipe } from '@core/i18n/in-locale.pipe';
import { SITE_LOCALE } from '@core/i18n/site-locale/site-locale';
import { ProjectHeroComponent } from '@features/project/components/project-hero/project-hero.component';
import { PlateLeanDirective } from '@features/project/directives/plate-lean/plate-lean.directive';
import { closingBand } from '@features/project/utils/project-view/project-view';

function projectBySlug(slug: string): Project {
  const project = PROJECTS.find((p) => p.slug[SITE_LOCALE] === slug);
  // The route only matches known slugs (app.routes.ts, canMatch).
  if (!project) throw new Error(`No project "${slug}"`);
  return project;
}

/**
 * A development project's page (« fiche projet »), as on its approved
 * prototype: the hero, the presentation visual cut along the sweep's diagonal
 * (a client reference's logo on the same plate: no screenshot of a client's
 * product is shown),
 * then context, mission and tools, and a band of the series or other work.
 * The summary is not shown: it is the card's line and the meta description.
 */
@Component({
  selector: 'app-project-page',
  imports: [
    InLocalePipe,
    ProjectHeroComponent,
    ScrubSentenceComponent,
    DevWorkComponent,
    PlateImageDirective,
    PlateLeanDirective,
    WorldRevealDirective,
    ClientLogoComponent,
  ],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPageComponent {
  // Bound from the route parameter by withComponentInputBinding().
  readonly slug = input.required<string>();

  protected readonly project = computed(() => projectBySlug(this.slug()));
  protected readonly total = String(PROJECTS.length).padStart(2, '0');
  protected readonly rank = computed(() =>
    String(PROJECTS.indexOf(this.project()) + 1).padStart(2, '0'),
  );
  protected readonly tools = computed(() =>
    this.project().technologies.map((slug) => toolView(slug)),
  );
  protected readonly band = computed(() => closingBand(this.project(), PROJECTS));

  protected readonly ramp = BODY_RAMP;
  protected readonly mediaUrl = mediaUrl();
  protected readonly srcset = mediaSrcset();
  // The shot's width: 155% then 120% of the screen while it bleeds, then the
  // column less the plate's padding, at most 1224px.
  protected readonly presentationSizes =
    '(min-width: 1600px) 1224px, (min-width: 1352px) calc(1320px - 6vw), (min-width: 900px) calc(94vw - 32px), (min-width: 600px) 120vw, 155vw';
}
