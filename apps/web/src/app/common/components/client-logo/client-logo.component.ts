import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { logoWidth } from '@common/utils/logo-width/logo-width';
import type { StaticLogo } from '@core/data/static-content/static-content';

/**
 * A client's logo, covering its whole plate: a mask filled with the current
 * colour, so the file's own colours never show, sized by its proportions so
 * every logo weighs the same (logoWidth). The plate must be a size container:
 * the logo is a share of the width the plate would have at 4:3. Covering the
 * plate, it takes the same reveal and hover scale as a picture would.
 *
 * Named, it is an image; without a label it is decoration beside a title that
 * already says the name.
 */
@Component({
  selector: 'app-client-logo',
  template: '',
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      background: currentColor;
      -webkit-mask: var(--mask) center var(--logo-y, 47%) /
        calc(var(--logo-w) * min(100cqi, 133.33cqb)) auto no-repeat;
      mask: var(--mask) center var(--logo-y, 47%) / calc(var(--logo-w) * min(100cqi, 133.33cqb))
        auto no-repeat;
      forced-color-adjust: none;
    }

    @media (forced-colors: active) {
      :host {
        background: CanvasText;
      }
    }
  `,
  host: {
    '[style.--mask]': 'mask()',
    '[style.--logo-w]': 'width()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label()',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientLogoComponent {
  readonly logo = input.required<StaticLogo>();
  readonly label = input<string | null>(null);

  protected readonly mask = computed(() => `url('${this.logo().src}')`);
  protected readonly width = computed(() => logoWidth(this.logo()).toFixed(3));
}
