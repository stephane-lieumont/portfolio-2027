import { Reveal } from '../../shared/reveal';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  imports: [Reveal],
  selector: 'app-contact',
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  // Static for now: the send goes through the API, never from the browser
  // (ADR-0007). The current site calls EmailJS client-side, which puts the
  // service key in anything that opens the sources.
  protected readonly submitting = signal(false);
}
