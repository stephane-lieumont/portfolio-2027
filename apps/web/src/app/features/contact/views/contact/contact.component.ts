import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { ContactService, contactFailureOf } from '../../../../core/services/contact.service';
import { InLocalePipe } from '../../../../core/i18n/in-locale.pipe';
import {
  CONTACT_PAGE,
  SITE_SETTINGS,
  STATIC_ASSETS,
  STATIC_FILES,
} from '../../../../core/data/world-content';
import { ICONS } from '../../../../common/constants/icons';
import { NETWORK_NAMES } from '../../../../common/constants/network-names';
import { ContactPortraitComponent } from '../../components/contact-portrait/contact-portrait.component';

const FIELDS = ['name', 'email', 'message'] as const;
type Field = (typeof FIELDS)[number];

type SendState = 'idle' | 'sending' | 'sent' | 'unavailable' | 'rejected';

const MISSING: Readonly<Record<Field, string>> = {
  name: $localize`:@@contact.missing.name:Indiquez votre nom.`,
  email: $localize`:@@contact.missing.email:Indiquez votre email pour que je puisse répondre.`,
  message: $localize`:@@contact.missing.message:Écrivez quelques mots avant d’envoyer.`,
};
const MALFORMED_EMAIL = $localize`:@@contact.malformedEmail:Cette adresse email ne semble pas complète, par exemple nom@domaine.fr.`;

const STATUS: Readonly<Record<SendState, string>> = {
  idle: '',
  sending: $localize`:@@contact.status.sending:Envoi en cours…`,
  sent: $localize`:@@contact.status.sent:Merci, votre message est parti. Je vous réponds au plus vite.`,
  unavailable: $localize`:@@contact.status.unavailable:L’envoi par formulaire n’est pas encore en service. En attendant, écrivez-moi sur LinkedIn.`,
  rejected: $localize`:@@contact.status.rejected:Le message n’est pas parti. Réessayez dans un instant, ou écrivez-moi sur LinkedIn.`,
};

// Whitespace alone is not a name or a message; the API trims and would refuse it.
const filled = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value.trim() ? null : { required: true };

const NO_ERRORS: Readonly<Record<Field, string>> = { name: '', email: '', message: '' };

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, InLocalePipe, ContactPortraitComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private readonly api = inject(ContactService);
  private readonly formRef = viewChild.required<ElementRef<HTMLFormElement>>('formEl');

  protected readonly page = CONTACT_PAGE;
  protected readonly portrait = STATIC_ASSETS[CONTACT_PAGE.portraitAssetId];
  protected readonly cv = STATIC_FILES[SITE_SETTINGS.cvAssetId];
  protected readonly cvIcon = ICONS.cv;
  protected readonly networks = SITE_SETTINGS.socials.map((social) => ({
    kind: social.kind,
    url: social.url,
    name: NETWORK_NAMES[social.kind],
    label: $localize`:@@contact.network:${NETWORK_NAMES[social.kind]}:network: (nouvel onglet)`,
    icon: ICONS[social.kind],
  }));

  /**
   * How the page arrived: under the ink wipe or a sweep, the entrance waits
   * for the band to uncover it. Read once, while RouteTransitionsService' stamp is
   * on the document; absent on a direct load, so hydration agrees with the
   * prerendered page.
   */
  protected readonly arrival = arrivalOf(inject(DOCUMENT).documentElement.getAttribute('data-vt'));

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [filled] }),
    email: new FormControl('', { nonNullable: true, validators: [filled, Validators.email] }),
    message: new FormControl('', { nonNullable: true, validators: [filled] }),
  });

  protected readonly errors = signal<Readonly<Record<Field, string>>>(NO_ERRORS);
  protected readonly state = signal<SendState>('idle');
  protected readonly status = computed(() => STATUS[this.state()]);

  protected submit(): void {
    if (this.state() === 'sending') return;

    const errors = { ...NO_ERRORS };
    for (const field of FIELDS) errors[field] = this.errorOf(field);
    this.errors.set(errors);

    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      this.state.set('idle');
      const control = this.formRef().nativeElement.elements.namedItem(firstInvalid);
      if (control instanceof HTMLElement) control.focus();
      return;
    }

    this.state.set('sending');
    this.api.send(this.form.getRawValue()).subscribe({
      next: () => {
        this.state.set('sent');
        this.form.reset();
      },
      error: (error: unknown) => this.state.set(contactFailureOf(error)),
    });
  }

  /** As on the mockup: once a field is flagged, leaving it re-checks it. */
  protected recheck(event: FocusEvent): void {
    const target = event.target;
    const name = target instanceof HTMLElement ? target.getAttribute('name') : null;
    const field = FIELDS.find((f) => f === name);
    if (!field || !this.errors()[field]) return;
    this.errors.update((errors) => ({ ...errors, [field]: this.errorOf(field) }));
  }

  private errorOf(field: Field): string {
    const control = this.form.controls[field];
    if (control.hasError('required')) return MISSING[field];
    if (control.hasError('email')) return MALFORMED_EMAIL;
    return '';
  }
}

function arrivalOf(transition: string | null): 'wipe' | 'sweep' | null {
  if (transition === 'wipe') return 'wipe';
  if (transition?.startsWith('sweep')) return 'sweep';
  return null;
}
