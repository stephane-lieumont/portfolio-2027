import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { youtubeEmbedUrl, youtubeVideoId } from '@portfolio/shared-types/video';

import { mediaSrcset, mediaUrl } from '../../core/media.config';
import type { StaticImage } from '../../core/static-content';

/**
 * A YouTube video behind its own poster (ADR-0016). Until the visitor presses
 * play, nothing is requested from YouTube or Google: the poster is the
 * project's own visual from the bucket. The press swaps the button for the
 * privacy-enhanced player, already playing, and hands it the focus.
 */
@Component({
  selector: 'app-video-facade',
  template: `
    <div class="frame">
      @if (playing()) {
        <iframe
          #player
          class="player"
          [src]="embed()"
          [title]="playerTitle()"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      } @else {
        <button #play type="button" class="poster" (click)="start()">
          <span class="visually-hidden" i18n="@@video.play">Lire la vidéo : {{ title() }}</span>
          <img
            class="poster__img"
            [src]="mediaUrl(poster().key)"
            [srcset]="srcset(poster().key, poster().width)"
            sizes="(min-width: 1352px) 972px, (min-width: 900px) calc(75vw - 42px), calc(100vw - 32px)"
            alt=""
            [width]="poster().width"
            [height]="poster().height"
            loading="lazy"
            decoding="async"
          />
          <span class="poster__play" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg>
          </span>
        </button>
      }
    </div>
  `,
  styleUrl: './video-facade.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoFacade {
  readonly url = input.required<string>();
  readonly title = input.required<string>();
  readonly poster = input.required<StaticImage>();

  protected readonly mediaUrl = mediaUrl();
  protected readonly srcset = mediaSrcset();
  protected readonly playing = signal(false);
  protected readonly playerTitle = computed(
    () => $localize`:@@video.player:Vidéo : ${this.title()}:title:`,
  );

  private readonly sanitizer = inject(DomSanitizer);
  private readonly injector = inject(Injector);
  private readonly playButton = viewChild<ElementRef<HTMLButtonElement>>('play');
  private readonly player = viewChild<ElementRef<HTMLIFrameElement>>('player');

  // A resource URL Angular will not bind unvetted. It is built here from an
  // id that matched YouTube's eleven-character alphabet, onto a fixed origin.
  protected readonly embed = computed(() => {
    const id = youtubeVideoId(this.url());
    return id === null ? null : this.sanitizer.bypassSecurityTrustResourceUrl(youtubeEmbedUrl(id));
  });

  /** Moves focus to the play button without scrolling: the caller places the page. */
  focus(): void {
    this.playButton()?.nativeElement.focus({ preventScroll: true });
  }

  protected start(): void {
    if (this.embed() === null) return;
    this.playing.set(true);
    afterNextRender(() => this.player()?.nativeElement.focus(), { injector: this.injector });
  }
}
