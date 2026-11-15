import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { toolView } from '../../core/content/tool-marks';
import { mediaSrcset, mediaUrl } from '../../core/media.config';
import { SmoothScroll } from '../../core/motion/smooth-scroll';
import { PROJECTS, type StaticProject } from '../../core/static-content';
import { DevWork } from '../world/dev-work';
import { PlateImage } from '../world/plate-image';
import { BODY_RAMP, ScrubSentence } from '../world/scrub-sentence';
import { WorldReveal } from '../world/world-reveal';
import { PlateLean } from './plate-lean';
import { ProjectHero } from './project-hero';
import { closingBand } from './project-view';
import { VideoFacade } from './video-facade';

/** Where the sticky header ends: the video lands under it, not behind it. */
const HEADER_CLEARANCE = 96;

function projectBySlug(slug: string): StaticProject {
  const project = PROJECTS.find((p) => p.slug === slug);
  // The route only matches known slugs (app.routes.ts, canMatch).
  if (!project) throw new Error(`No project "${slug}"`);
  return project;
}

/**
 * A development project's page (« fiche projet »), as on its approved
 * prototype: the hero, the presentation visual cut along the sweep's diagonal,
 * then context, mission and tools, and a band of the series or other work.
 * The summary is not shown: it is the card's line and the meta description.
 */
@Component({
  selector: 'app-project-page',
  imports: [ProjectHero, ScrubSentence, DevWork, PlateImage, PlateLean, WorldReveal, VideoFacade],
  templateUrl: './project-page.html',
  styleUrl: './project-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPage {
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

  private readonly document = inject(DOCUMENT);
  private readonly smooth = inject(SmoothScroll);
  private readonly video = viewChild(VideoFacade);

  /** « Voir la vidéo »: to the player's poster, focus on its play button. */
  protected toVideo(event: MouseEvent): void {
    const target = this.document.getElementById('video');
    const view = this.document.defaultView;
    if (!target || !view || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    this.smooth.jumpTo(target.getBoundingClientRect().top + view.scrollY - HEADER_CLEARANCE);
    this.video()?.focus();
  }
}
