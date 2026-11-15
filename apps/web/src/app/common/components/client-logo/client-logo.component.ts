import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { PlateImageDirective } from '@common/directives/plate-image/plate-image.directive';
import { logoWidth } from '@common/utils/logo-width/logo-width';
import type { StaticLogo } from '@core/data/static-content/static-content';

/**
 * A client's logo in its own colours, covering its whole plate, sized by its
 * proportions so every logo weighs the same (logoWidth). The plate must be a
 * size container, and light: the logo is a share of the width the plate would
 * have at 4:3. Covering the plate, it takes the same reveal, hover scale and
 * sibling greying as a picture would.
 *
 * Named, it is an image; without a label it is decoration beside a title that
 * already says the name.
 */
@Component({
  selector: 'app-client-logo',
  imports: [PlateImageDirective],
  template: `<span class="field" aria-hidden="true"><span class="field__dots"></span></span
    ><img
      class="logo"
      appPlate="wall"
      [src]="logo().src"
      [attr.srcset]="srcset()"
      [attr.sizes]="srcset() ? sizes() : null"
      [alt]="label() ?? ''"
      [width]="logo().width"
      [height]="logo().height"
      decoding="async"
    /><span class="plate__wait" aria-hidden="true" i18n="@@plate.loading">Chargement…</span>`,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
    }

    /* A field of points in the brand's tint, the cloud's motes at rest: a
       fixed-size tile, so a point is the same size on a card and on the page,
       cleared in an ellipse around the logo. The card spreads it on hover by
       --logo-spread: the scale is on the unmasked wrapper, because Chrome
       repaints a masked element on every frame its transform moves. */
    .field {
      position: absolute;
      inset: 0;
      scale: var(--logo-spread, 1);
      transform-origin: 50% var(--logo-y, 47%);
      transition: scale var(--logo-spread-duration, var(--duration-360)) var(--ease-state);
    }

    .field__dots {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--logo-tint) 40%, var(--logo-plate));
      -webkit-mask:
        url('/textures/motes.svg') 0 0 / 480px 360px repeat,
        radial-gradient(
          ellipse calc(var(--logo-w) * 70% + 12%) 42% at 50% 47%,
          transparent 70%,
          #000
        );
      -webkit-mask-composite: source-in;
      mask:
        url('/textures/motes.svg') 0 0 / 480px 360px repeat,
        radial-gradient(
          ellipse calc(var(--logo-w) * 70% + 12%) 42% at 50% 47%,
          transparent 70%,
          #000
        );
      mask-composite: intersect;
    }

    @media (forced-colors: active) {
      .field {
        display: none;
      }
    }

    .logo {
      position: absolute;
      left: 50%;
      top: var(--logo-y, 47%);
      width: calc(var(--logo-w) * min(100cqi, 133.33cqb));
      height: auto;
      max-width: none;
      translate: -50% -50%;
    }
  `,
  host: { '[style.--logo-w]': 'width()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientLogoComponent {
  readonly logo = input.required<StaticLogo>();
  readonly label = input<string | null>(null);
  /**
   * Its rendered width for a raster logo's srcset. Measured on CIR's (the one
   * raster logo): 74–214px on a card, 107–281px on its page.
   */
  readonly sizes = input('(min-width: 900px) 179px, 214px');

  protected readonly srcset = computed(() => {
    const { src, variants } = this.logo();
    if (!variants?.length) return null;
    return variants
      .map((width) => `${src.replace(/\.[a-z]+$/, `-${width}.webp`)} ${width}w`)
      .join(', ');
  });

  protected readonly width = computed(() => logoWidth(this.logo()).toFixed(3));
}
