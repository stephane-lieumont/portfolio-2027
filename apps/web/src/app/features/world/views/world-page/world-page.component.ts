import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  inject,
  input,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { WorldKey } from '@portfolio/shared-types';

import {
  SITE_SETTINGS,
  STATIC_FILES,
  WORLD_PAGES,
  WORLD_STACKS,
} from '../../../../core/data/world-content';
import { InLocalePipe } from '../../../../core/i18n/in-locale.pipe';
import { PATHS } from '../../../../core/i18n/site-locale';
import { CloudStore } from '../../../../core/stores/cloud.store';
import { ArtMosaicComponent } from '../../components/art-mosaic/art-mosaic.component';
import { DevWorkComponent } from '../../../../common/components/dev-work/dev-work.component';
import { PointCloudComponent } from '../../components/point-cloud/point-cloud.component';
import { ScrubSentenceComponent } from '../../../../common/components/scrub-sentence/scrub-sentence.component';
import { introBase } from '../../../../common/utils/hero-letters';
import { NAME, WorldHeroComponent } from '../../components/world-hero/world-hero.component';
import { WorldStackComponent } from '../../components/world-stack/world-stack.component';

/**
 * How the page arrives:
 * - `intro` on the page the site was loaded on: the name rises, then the rest;
 * - `build` after the sweep from the other world: the role flips and the lines
 *   rise once the band has covered the old page;
 * - `none` otherwise (back from contact, from a project): it is simply there.
 */
export type Entrance = 'intro' | 'build' | 'none';

/** Lines of the hero and its text column before the work: two eyebrow halves and the lede. */
const LEAD_LINES = 3;

/**
 * One skeleton, two worlds (ADR-0014): the developer and 3D sections
 * render this page with their own content, palette and work.
 */
@Component({
  selector: 'app-world-page',
  imports: [
    RouterLink,
    InLocalePipe,
    WorldHeroComponent,
    PointCloudComponent,
    ScrubSentenceComponent,
    DevWorkComponent,
    ArtMosaicComponent,
    WorldStackComponent,
  ],
  templateUrl: './world-page.component.html',
  styleUrl: './world-page.component.scss',
  host: {
    '[class.entrance--intro]': "entrance === 'intro'",
    '[class.entrance--build]': "entrance === 'build'",
    '[style.--entrance-base.ms]': 'entranceBase',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldPageComponent {
  readonly world = input.required<WorldKey>();

  protected readonly page = computed(() => WORLD_PAGES[this.world()]);
  protected readonly stack = computed(() => WORLD_STACKS[this.world()]);
  protected readonly workStart = computed(() => LEAD_LINES + this.page().facts.length);
  protected readonly cv = STATIC_FILES[SITE_SETTINGS.cvAssetId];
  protected readonly contactPath = PATHS.contact;

  protected readonly entrance: Entrance;
  protected readonly entranceBase: number;

  constructor() {
    // Here and not in the cloud: the page is created while the router
    // activates it, before the navigation ends; its cloud only at first render.
    const cloud = inject(CloudStore);
    cloud.arrive();
    inject(DestroyRef).onDestroy(() => cloud.leave());

    const vt = inject(DOCUMENT).documentElement.getAttribute('data-vt') ?? '';
    // The first navigation is the page the site was loaded on, prerendered or not.
    this.entrance = !inject(Router).navigated ? 'intro' : vt.startsWith('sweep') ? 'build' : 'none';
    // A sweep shows the new page once its band has covered the old one (640ms).
    this.entranceBase = this.entrance === 'intro' ? introBase(NAME) : 640;
  }
}
