import { Location, isPlatformBrowser, isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { mediaSrcset, mediaUrl } from '../../core/media.config';
import { ReducedMotion } from '../../core/motion/reduced-motion';
import { toolView } from '../../core/content/tool-marks';
import { inLocale } from '../../core/i18n/in-locale';
import { PATHS } from '../../core/i18n/site-locale';
import { RouteTransitions } from '../../core/route-transitions';
import { ARTWORKS } from '../../core/static-content';
import { ArtViewer, PLATE, type ViewerPiece } from './art-viewer';
import { mosaicLayout } from './mosaic-layout';
import { PlateImage } from './plate-image';
import { workCount } from './work-count';
import { WorldReveal } from './world-reveal';

export const GALLERY_PATH = PATHS.cgi;

/** A tile's width: its share of twelve columns from 900px, half or all of the wall below. */
export function tileSizes(tile: { readonly area: string; readonly wide: boolean }): string {
  const [, c1, , c2] = tile.area.split(' / ').map(Number);
  // Exact, not rounded up: a 959px hero read as 67vw would pick the 1280 file.
  const share = Math.floor(((c2 - c1) * 10000) / 12) / 100;
  return `(min-width: 900px) ${share}vw, ${tile.wide ? 100 : 50}vw`;
}

/**
 * The 3D world’s work: every render on a full-bleed wall of tiles in blocks of eight
 * repeated (ADR-0015), each tile a link to the piece's own address, which opens
 * the viewer over the wall (spec 01). The address is the source of truth: a
 * tile, the viewer's steps, Back and a direct load all go through the router,
 * and the viewer follows.
 */
@Component({
  selector: 'app-art-mosaic',
  imports: [ArtViewer, WorldReveal, PlateImage],
  templateUrl: './art-mosaic.html',
  styleUrl: './art-mosaic.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtMosaic {
  /** Where the tiles fall in the page's entrance, after the hero's lines. */
  readonly lineStart = input(0);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly motion = inject(ReducedMotion);
  private readonly transitions = inject(RouteTransitions);
  private readonly viewer = viewChild.required(ArtViewer);
  private readonly wall = viewChild.required<ElementRef<HTMLElement>>('wall');

  protected readonly count = workCount(ARTWORKS.map((a) => a.releasedAt));
  private readonly layout = mosaicLayout(ARTWORKS.length);
  protected readonly rows = this.layout.rows;
  protected readonly pieces: readonly (ViewerPiece & {
    readonly href: string;
    readonly label: string;
    readonly focus: string;
    readonly area: string;
    readonly wide: boolean;
    readonly sizes: string;
    readonly phoneRatio: number;
  })[];

  /** The piece in the address, if any. */
  private readonly slug = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.slugInRoute()),
    ),
    { initialValue: this.slugInRoute() },
  );
  private readonly ready = signal(false);
  /** Whether this page put the open piece in the history, so closing can go back. */
  private pushed = false;

  constructor() {
    const media = mediaUrl();
    const srcset = mediaSrcset();
    this.pieces = ARTWORKS.map((artwork, i) => {
      const slug = inLocale(artwork.slug);
      const title = inLocale(artwork.title);
      return {
        slug,
        title,
        year: artwork.releasedAt.slice(0, 4),
        alt: inLocale(artwork.image.alt),
        src: media(artwork.image.key),
        srcset: srcset(artwork.image.key, artwork.image.width),
        tone: artwork.image.averageColor,
        width: artwork.image.width,
        height: artwork.image.height,
        tools: artwork.software.map((slug) => toolView(slug)),
        // A plain href, so it carries the tree's base (`/en/`) itself.
        href: this.location.prepareExternalUrl(`${GALLERY_PATH}/${slug}`),
        label: $localize`:@@mosaic.tileLabel:${title}:title: (${artwork.releasedAt.slice(0, 4)}:year:), agrandir`,
        focus: `${(artwork.focal?.x ?? 0.5) * 100}% ${(artwork.focal?.y ?? 0.5) * 100}%`,
        ...this.layout.tiles[i],
        sizes: tileSizes(this.layout.tiles[i]),
        // On a phone a full-width band takes its render's own ratio, held
        // between 4:3 and 16:9: the near-square Immeuble lost 33% in a 16:9 band.
        phoneRatio: Math.min(16 / 9, Math.max(4 / 3, artwork.image.width / artwork.image.height)),
      };
    });

    const platform = inject(PLATFORM_ID);
    if (isPlatformBrowser(platform)) {
      afterNextRender(() => this.ready.set(true));
    }
    // A piece's own address opens on its render: the prerendered page asks for
    // it in the head, before the bundle that will show it has even arrived.
    const slug = this.slug();
    const piece = this.pieces.find((p) => p.slug === slug);
    if (piece && isPlatformServer(platform)) {
      const document = inject(DOCUMENT);
      const link = document.createElement('link');
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'image');
      link.setAttribute('href', piece.src);
      link.setAttribute('imagesrcset', piece.srcset);
      link.setAttribute('imagesizes', 'min(100vw, 1920px)');
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    }

    effect(() => {
      const slug = this.slug();
      if (!this.ready()) return;
      untracked(() => this.follow(slug));
    });
  }

  protected open(index: number, event: MouseEvent): void {
    // A new tab, a new window or a download stays the browser's.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (!this.motion.reduced()) this.tileImage(index).style.viewTransitionName = PLATE;
    this.pushed = true;
    void this.router.navigate([GALLERY_PATH, this.pieces[index].slug], { scroll: 'manual' });
  }

  protected moved(index: number): void {
    void this.router.navigate([GALLERY_PATH, this.pieces[index].slug], {
      replaceUrl: true,
      scroll: 'manual',
    });
  }

  protected close(): void {
    if (this.pushed) {
      this.location.back();
    } else {
      void this.router.navigate([GALLERY_PATH], { replaceUrl: true, scroll: 'manual' });
    }
  }

  private follow(slug: string | null): void {
    const viewer = this.viewer();
    const index = slug === null ? -1 : this.pieces.findIndex((p) => p.slug === slug);
    if (index >= 0) {
      // The viewer stepped and the address caught up: nothing to do, and
      // above all nothing to restart — its cut is under way.
      if (viewer.isOpen && viewer.current === index) return;
      for (let i = 0; i < this.pieces.length; i++) {
        this.tileImage(i).style.viewTransitionName = '';
      }
      viewer.show(index);
      return;
    }
    if (!viewer.isOpen) return;
    const back = this.pushed;
    this.pushed = false;
    const shown = viewer.hide();
    const tile = this.wall().nativeElement.querySelectorAll<HTMLElement>('.tile__btn')[shown];
    const image = this.tileImage(shown);
    if (!tile || !image) return;
    // Morph into the tile only if it is on screen where the page will stand:
    // Back restores the scroll the wall had when the viewer opened, which is
    // where it still is under the dialog. A tile reached by stepping may be
    // elsewhere; then the viewer just fades.
    const view = tile.ownerDocument.defaultView;
    const rect = tile.getBoundingClientRect();
    const onScreen = !!view && rect.bottom > 0 && rect.top < view.innerHeight;
    if (!back) tile.scrollIntoView({ block: 'nearest' });
    if (!this.motion.reduced() && this.isMorphing() && (onScreen || !back)) {
      image.style.viewTransitionName = PLATE;
    }
    tile.focus({ preventScroll: true });
    // Once the router has restored the scroll (Back) and the transition is
    // over, the tile with focus is brought on screen (WCAG 2.4.11).
    void this.transitions.settled().then(() => {
      image.style.viewTransitionName = '';
      view?.requestAnimationFrame(() => {
        tile.scrollIntoView({ block: 'nearest' });
        tile.focus({ preventScroll: true });
      });
    });
  }

  /** Whether the viewer's own transition is under way, the plate's morph to name. */
  private isMorphing(): boolean {
    return this.wall().nativeElement.ownerDocument.documentElement.dataset['vt'] === 'viewer';
  }

  private tileImage(index: number): HTMLElement {
    return this.wall().nativeElement.querySelectorAll<HTMLElement>('.tile__img')[index];
  }

  private slugInRoute(): string | null {
    return this.route.snapshot.firstChild?.paramMap.get('slug') ?? null;
  }
}
