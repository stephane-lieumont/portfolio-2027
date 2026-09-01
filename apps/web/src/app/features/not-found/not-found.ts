import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NAV_ITEMS } from '../../shell/nav-items';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  // Every section, so a dead link is a detour and not a dead end.
  protected readonly items = NAV_ITEMS.filter((item) => item.path !== '/');
}
