import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PATHS } from '@core/i18n/site-locale/site-locale';

/**
 * The legal notice and privacy page (LCEN, GDPR), from Stéphane's facts of
 * 2026-11-15. No postal address, phone number or email: a non-professional
 * publisher leaves them with the host (LCEN art. 6 III-2), and the contact
 * form is the way in (ADR-0007).
 */
@Component({
  selector: 'app-legal-notice',
  imports: [RouterLink],
  templateUrl: './legal-notice.component.html',
  styleUrl: './legal-notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalNoticeComponent {
  protected readonly contact = PATHS.contact;
}
