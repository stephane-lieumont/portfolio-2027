import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { technologyOf } from '@portfolio/shared-types/registries';

import { mediaUrl } from '../../core/media.config';
import { PROJECTS } from '../../core/static-content';
import { Reveal } from '../../shared/reveal';
import { TechChip } from '../../shared/tech-chip';

@Component({
  selector: 'app-project-detail',
  imports: [Reveal, RouterLink, TechChip],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  protected readonly mediaUrl = mediaUrl();
  // Bound from the route parameter by withComponentInputBinding(). The route
  // only matches known slugs, so this always resolves; an unknown one falls
  // through to the 404 rather than rendering an empty page here.
  readonly slug = input.required<string>();

  protected readonly project = computed(() => PROJECTS.find((p) => p.slug === this.slug())!);

  protected readonly technologies = computed(() =>
    this.project().technologies.map((s) => technologyOf(s)),
  );

  protected readonly siblings = computed(() => {
    const current = this.project();
    if (!current.series) return [];
    return PROJECTS.filter((p) => p.series === current.series && p.slug !== current.slug);
  });

  protected year(iso: string): string {
    return iso.slice(0, 4);
  }
}
