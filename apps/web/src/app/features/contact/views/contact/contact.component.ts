import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
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

import { ICONS } from '@common/constants/icons';
import { NETWORK_NAMES } from '@common/constants/network-names';
import {
  CONTACT_PAGE,
  SITE_SETTINGS,
  STATIC_ASSETS,
  STATIC_FILES,
} from '@core/data/world-content/world-content';
import { InLocalePipe, inLocale } from '@core/i18n/in-locale.pipe';
import { SITE_LOCALE, type SiteLocale } from '@core/i18n/site-locale/site-locale';
import { ContactService, contactFailureOf } from '@core/services/contact/contact.service';
import { type CaptchaWidget, TurnstileService } from '@core/services/turnstile/turnstile.service';
import { ContactPortraitComponent } from '@features/contact/components/contact-portrait/contact-portrait.component';

const FIELDS = ['name', 'email', 'message'] as const;
type Field = (typeof FIELDS)[number];

type SendState = 'idle' | 'sending' | 'sent' | 'unavailable' | 'captcha' | 'rejected';

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
  captcha: $localize`:@@contact.status.captcha:La vérification anti-spam n’a pas abouti. Réessayez, ou écrivez-moi sur LinkedIn.`,
  rejected: $localize`:@@contact.status.rejected:Le message n’est pas parti. Réessayez dans un instant, ou écrivez-moi sur LinkedIn.`,
};

// Whitespace alone is not a name or a message; the API trims and would refuse it.
const filled = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value.trim() ? null : { required: true };

/** A run of a heading, with the language it is in when it differs from the page's. */
export interface TitlePart {
  readonly text: string;
  readonly lang: 'en' | null;
}

/**
 * The English phrase the French title quotes, marked so a screen reader reads
 * it in an English voice (WCAG 3.1.2).
 */
const QUOTED_ENGLISH = 'Hello World';

export function titleParts(title: string, locale: SiteLocale): readonly TitlePart[] {
  const at = title.indexOf(QUOTED_ENGLISH);
  if (locale === 'en' || at < 0) return [{ text: title, lang: null }];
  return [
    { text: title.slice(0, at), lang: null },
    { text: QUOTED_ENGLISH, lang: 'en' },
    { text: title.slice(at + QUOTED_ENGLISH.length), lang: null },
  ];
}

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
  private readonly captchaRef = viewChild.required<ElementRef<HTMLElement>>('captchaEl');
  private readonly turnstile = inject(TurnstileService);
  private captcha: Promise<CaptchaWidget> | null = null;
  protected readonly challenge = signal(false);

  constructor() {
    // Loaded with the page rather than on submit: the check then runs while
    // the visitor writes. Never during prerendering.
    afterNextRender(() => void this.captchaWidget().catch(() => undefined));
    inject(DestroyRef).onDestroy(() => {
      void this.captcha?.then((widget) => widget.remove()).catch(() => undefined);
    });
  }

  protected readonly page = CONTACT_PAGE;
  protected readonly title = titleParts(inLocale(CONTACT_PAGE.title), SITE_LOCALE);
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
    void this.send();
  }

  private async send(): Promise<void> {
    let captchaToken: string;
    try {
      captchaToken = await (await this.captchaWidget()).token();
    } catch {
      this.state.set('captcha');
      return;
    }
    this.api.send({ ...this.form.getRawValue(), captchaToken }).subscribe({
      next: () => {
        this.state.set('sent');
        this.form.reset();
      },
      error: (error: unknown) => this.state.set(contactFailureOf(error)),
    });
  }

  /** Mounted once; a widget that failed to load is tried again on the next send. */
  private captchaWidget(): Promise<CaptchaWidget> {
    this.captcha ??= this.turnstile
      .mount(this.captchaRef().nativeElement, (shown) => this.challenge.set(shown))
      .catch((error: unknown) => {
        this.captcha = null;
        throw error;
      });
    return this.captcha;
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
