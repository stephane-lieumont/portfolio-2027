import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { softwareOf } from '@portfolio/shared-types/registries';

import { mediaUrl } from '../../core/media.config';
import { ARTWORKS } from '../../core/static-content';
import { TechChip } from '../../shared/tech-chip';

@Component({
  selector: 'app-gallery',
  imports: [RouterLink, TechChip],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
  host: { 'data-theme': 'dark' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gallery {
  protected readonly mediaUrl = mediaUrl();
  protected readonly artworks = ARTWORKS;
  protected readonly softwareOf = softwareOf;

  // Distinct from the dev stack by construction: two registries, never mixed.
  protected readonly tools = ['zbrush', '3dsmax', 'vray', 'substance-painter', 'photoshop'].map(
    (slug) => softwareOf(slug as Parameters<typeof softwareOf>[0]),
  );

  protected year(iso: string): string {
    return iso.slice(0, 4);
  }
}
