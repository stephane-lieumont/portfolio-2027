import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The site's pill call to action, on a link: it goes somewhere, so it stays an
 * `<a>` and keeps its semantics (`routerLink`, `href`, `target`). The block's
 * class is written by the caller (`class="btn"`, `btn--ghost` for the outline),
 * which can extend it from its own stylesheet.
 */
@Component({
  selector: 'a[appButton]',
  template: '<ng-content />',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {}
