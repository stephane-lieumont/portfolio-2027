import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { technologyOf } from '@portfolio/shared-types/registries';

import { HIGHLIGHTED_TECHNOLOGIES, PROJECTS } from '../../core/static-content';
import { TechChip } from '../../shared/tech-chip';

@Component({
  selector: 'app-developer',
  imports: [RouterLink, TechChip],
  templateUrl: './developer.html',
  styleUrl: './developer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Developer {
  protected readonly projects = PROJECTS;
  protected readonly highlighted = HIGHLIGHTED_TECHNOLOGIES.map(technologyOf);
  protected readonly technologyOf = technologyOf;

  protected year(iso: string): string {
    return iso.slice(0, 4);
  }
}
