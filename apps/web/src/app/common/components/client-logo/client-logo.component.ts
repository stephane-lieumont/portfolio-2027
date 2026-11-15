import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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
  template: `<img
    class="logo"
    [src]="logo().src"
    [alt]="label() ?? ''"
    [width]="logo().width"
    [height]="logo().height"
    decoding="async"
  />`,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
    }

    /* A field of points in the brand's tint, the cloud's motes at rest: a
       fixed-size tile, so a point is the same size on a card and on the page,
       cleared in an ellipse around the logo. */
    :host::before {
      content: '';
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
      :host::before {
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

  protected readonly width = computed(() => logoWidth(this.logo()).toFixed(3));
}
