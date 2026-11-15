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
} from '../../core/content/world-content';
import { InLocalePipe } from '../../core/i18n/in-locale';
import { PATHS } from '../../core/i18n/site-locale';
import { CloudState } from '../../core/world/cloud-state';
import { ArtMosaic } from './art-mosaic';
import { DevWork } from './dev-work';
import { PointCloud } from './point-cloud';
import { ScrubSentence } from './scrub-sentence';
import { NAME, WorldHero, introBase } from './world-hero';
import { WorldStack } from './world-stack';

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
    WorldHero,
    PointCloud,
    ScrubSentence,
    DevWork,
    ArtMosaic,
    WorldStack,
  ],
  templateUrl: './world-page.html',
  styleUrl: './world-page.scss',
  host: {
    '[class.entrance--intro]': "entrance === 'intro'",
    '[class.entrance--build]': "entrance === 'build'",
    '[style.--entrance-base.ms]': 'entranceBase',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldPage {
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
    const cloud = inject(CloudState);
    cloud.arrive();
    inject(DestroyRef).onDestroy(() => cloud.leave());

    const vt = inject(DOCUMENT).documentElement.getAttribute('data-vt') ?? '';
    // The first navigation is the page the site was loaded on, prerendered or not.
    this.entrance = !inject(Router).navigated ? 'intro' : vt.startsWith('sweep') ? 'build' : 'none';
    // A sweep shows the new page once its band has covered the old one (640ms).
    this.entranceBase = this.entrance === 'intro' ? introBase(NAME) : 640;
  }
}
