import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { technologyOf } from '@portfolio/shared-types/registries';

import { mediaUrl } from '../../core/media.config';
import { HIGHLIGHTED_TECHNOLOGIES, PROJECTS } from '../../core/static-content';
import { Reveal } from '../../shared/reveal';
import { TechChip } from '../../shared/tech-chip';
import { TechLogo } from '../../shared/tech-logo';

@Component({
  selector: 'app-developer',
  imports: [Reveal, RouterLink, TechChip, TechLogo],
  templateUrl: './developer.html',
  styleUrl: './developer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Developer {
  protected readonly mediaUrl = mediaUrl();
  protected readonly projects = PROJECTS;
  protected readonly highlighted = HIGHLIGHTED_TECHNOLOGIES.map(technologyOf);
  protected readonly technologyOf = technologyOf;

  protected year(iso: string): string {
    return iso.slice(0, 4);
  }
}
