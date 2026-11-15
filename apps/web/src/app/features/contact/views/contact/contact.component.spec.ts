import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

import { API_BASE_URL } from '@core/config/api.config';
import { CONTACT_PAGE, SITE_SETTINGS } from '@core/data/world-content/world-content';
import {
  type FrameCallback,
  FrameLoopService,
} from '@core/services/motion/frame-loop/frame-loop.service';
import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';
import { TurnstileService } from '@core/services/turnstile/turnstile.service';
import { ContactComponent, titleParts } from './contact.component';

interface Setup {
  readonly reduced?: boolean;
  readonly transition?: string;
}

const frames = new Set<FrameCallback>();
const fakeFrames = {
  add(callback: FrameCallback) {
    frames.add(callback);
    return () => frames.delete(callback);
  },
};

const reducedMotion = signal(false);

interface FakeTurnstile {
  mounts: number;
  removed: number;
  failToken: boolean;
  failMount: boolean;
}
const turnstile: FakeTurnstile = { mounts: 0, removed: 0, failToken: false, failMount: false };
let showChallenge: (shown: boolean) => void = () => undefined;
const fakeTurnstile = {
  async mount(_container: HTMLElement, onChallenge: (shown: boolean) => void) {
    showChallenge = onChallenge;
    turnstile.mounts += 1;
    if (turnstile.failMount) throw new Error('blocked');
    return {
      token: async () => {
        if (turnstile.failToken) throw new Error('refused');
        return 'turnstile-token';
      },
      remove: () => {
        turnstile.removed += 1;
      },
    };
  },
};

async function render({ reduced = false, transition }: Setup = {}) {
  reducedMotion.set(reduced);
  frames.clear();
  Object.assign(turnstile, { mounts: 0, removed: 0 });
  if (transition) document.documentElement.dataset['vt'] = transition;
  TestBed.configureTestingModule({
    imports: [ContactComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: '/api' },
      { provide: FrameLoopService, useValue: fakeFrames },
      { provide: ReducedMotionService, useValue: { reduced: reducedMotion } },
      { provide: TurnstileService, useValue: fakeTurnstile },
    ],
  });
  const fixture = TestBed.createComponent(ContactComponent);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  delete document.documentElement.dataset['vt'];
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
  };
}

afterEach(() => {
  document.body.replaceChildren();
  Object.assign(turnstile, { failToken: false, failMount: false });
});

function field(host: HTMLElement, name: string): HTMLInputElement | HTMLTextAreaElement {
  const el = host.querySelector(`[name="${name}"]`);
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
    throw new Error(`no field ${name}`);
  }
  return el;
}

function type(host: HTMLElement, name: string, value: string): void {
  const el = field(host, name);
  el.value = value;
  el.dispatchEvent(new Event('input'));
}

async function submit(fixture: ComponentFixture<ContactComponent>): Promise<void> {
  const form = (fixture.nativeElement as HTMLElement).querySelector('form');
  form?.dispatchEvent(new Event('submit', { cancelable: true }));
  await fixture.whenStable();
}

const errorOf = (host: HTMLElement, name: string) =>
  host.querySelector(`#contact-${name}-error`)?.textContent?.trim() ?? '';
const statusOf = (host: HTMLElement) =>
  host.querySelector('[role="status"]')?.textContent?.trim() ?? '';
const button = (host: HTMLElement) => host.querySelector('button[type="submit"]');

async function fillValid(fixture: ComponentFixture<ContactComponent>, host: HTMLElement) {
  type(host, 'name', 'Ada Lovelace');
  type(host, 'email', 'ada@example.org');
  type(host, 'message', 'Bonjour');
  await submit(fixture);
}

describe('Contact — validation', () => {
  it('names every missing field and focuses the first', async () => {
    const { fixture, host, http } = await render();

    await submit(fixture);

    expect(errorOf(host, 'name')).toBe('Indiquez votre nom.');
    expect(errorOf(host, 'email')).toBe('Indiquez votre email pour que je puisse répondre.');
    expect(errorOf(host, 'message')).toBe('Écrivez quelques mots avant d’envoyer.');
    for (const name of ['name', 'email', 'message']) {
      const el = field(host, name);
      expect(el.getAttribute('aria-invalid')).toBe('true');
      expect(el.getAttribute('aria-describedby')).toBe(`contact-${name}-error`);
    }
    expect(document.activeElement).toBe(field(host, 'name'));
    http.expectNone('/api/contact');
  });

  it('flags a malformed address and whitespace for a message, focusing the email', async () => {
    const { fixture, host } = await render();
    type(host, 'name', 'Ada');
    type(host, 'email', 'ada@');
    type(host, 'message', '   ');

    await submit(fixture);

    expect(errorOf(host, 'name')).toBe('');
    expect(field(host, 'name').hasAttribute('aria-invalid')).toBe(false);
    expect(errorOf(host, 'email')).toBe(
      'Cette adresse email ne semble pas complète, par exemple nom@domaine.fr.',
    );
    expect(errorOf(host, 'message')).toBe('Écrivez quelques mots avant d’envoyer.');
    expect(document.activeElement).toBe(field(host, 'email'));
  });

  it('clears a flagged field once it is fixed and left', async () => {
    const { fixture, host } = await render();
    await submit(fixture);

    type(host, 'name', 'Ada');
    field(host, 'name').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await fixture.whenStable();

    expect(errorOf(host, 'name')).toBe('');
    expect(errorOf(host, 'email')).not.toBe('');
  });

  it('does not flag a field on blur before any submit', async () => {
    const { fixture, host } = await render();
    field(host, 'email').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await fixture.whenStable();

    expect(errorOf(host, 'email')).toBe('');
  });
});

describe('Contact — sending', () => {
  it('posts the message to the API and says it is busy meanwhile', async () => {
    const { fixture, host, http } = await render();
    await fillValid(fixture, host);

    const request = http.expectOne('/api/contact');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.org',
      message: 'Bonjour',
      captchaToken: 'turnstile-token',
    });
    expect(button(host)?.getAttribute('aria-busy')).toBe('true');
    expect(statusOf(host)).toBe('Envoi en cours…');
    // Never disabled: it stays focusable and keeps its boundary.
    expect(button(host)?.hasAttribute('disabled')).toBe(false);

    request.flush(null, { status: 202, statusText: 'Accepted' });
    await fixture.whenStable();

    expect(button(host)?.hasAttribute('aria-busy')).toBe(false);
    expect(statusOf(host)).toMatch(/^Merci/);
    expect(field(host, 'message').value).toBe('');
  });

  it('sends once when submitted twice while busy', async () => {
    const { fixture, host, http } = await render();
    await fillValid(fixture, host);
    await submit(fixture);

    expect(http.match('/api/contact')).toHaveLength(1);
  });

  it.each([
    [404, 'Not Found'],
    [405, 'Not Allowed'],
  ])('says sending is not available yet on %i, keeping the text', async (status, statusText) => {
    const { fixture, host, http } = await render();
    await fillValid(fixture, host);

    http.expectOne('/api/contact').flush(null, { status, statusText });
    await fixture.whenStable();

    expect(statusOf(host)).toBe(
      'L’envoi par formulaire n’est pas encore en service. En attendant, écrivez-moi sur LinkedIn.',
    );
    expect(button(host)?.hasAttribute('aria-busy')).toBe(false);
    expect(field(host, 'message').value).toBe('Bonjour');
  });

  it('says sending is not available yet when the network fails', async () => {
    const { fixture, host, http } = await render();
    await fillValid(fixture, host);

    http.expectOne('/api/contact').error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(statusOf(host)).toMatch(/pas encore en service/);
  });

  it('invites a retry when the API answers with a failure', async () => {
    const { fixture, host, http } = await render();
    await fillValid(fixture, host);

    http.expectOne('/api/contact').flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(statusOf(host)).toMatch(/^Le message n’est pas parti\. Réessayez/);
  });
});

describe('Contact — anti-spam check', () => {
  it('prepares the check with the page, once', async () => {
    await render();

    expect(turnstile.mounts).toBe(1);
  });

  it('sends nothing and says so when the check fails in the browser', async () => {
    const { fixture, host, http } = await render();
    turnstile.failToken = true;
    await fillValid(fixture, host);
    await fixture.whenStable();

    http.expectNone('/api/contact');
    expect(statusOf(host)).toBe(
      'La vérification anti-spam n’a pas abouti. Réessayez, ou écrivez-moi sur LinkedIn.',
    );
    expect(button(host)?.hasAttribute('aria-busy')).toBe(false);
    expect(field(host, 'message').value).toBe('Bonjour');
  });

  it('tries to load the check again when it could not the first time', async () => {
    turnstile.failMount = true;
    const { fixture, host, http } = await render();
    turnstile.failMount = false;
    await fillValid(fixture, host);
    await fixture.whenStable();

    expect(turnstile.mounts).toBe(2);
    expect(http.expectOne('/api/contact').request.body.captchaToken).toBe('turnstile-token');
  });

  it('says so when the API refuses the check', async () => {
    const { fixture, host, http } = await render();
    await fillValid(fixture, host);

    http.expectOne('/api/contact').flush(null, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();

    expect(statusOf(host)).toMatch(/^La vérification anti-spam n’a pas abouti/);
  });

  it('makes room for the challenge only while Cloudflare shows it', async () => {
    const { fixture, host } = await render();
    const box = host.querySelector('.form__captcha');

    showChallenge(true);
    await fixture.whenStable();
    expect(box?.classList.contains('form__captcha--challenge')).toBe(true);

    showChallenge(false);
    await fixture.whenStable();
    expect(box?.classList.contains('form__captcha--challenge')).toBe(false);
  });

  it('removes the widget with the page', async () => {
    const { fixture } = await render();
    fixture.destroy();
    await Promise.resolve();
    await Promise.resolve();

    expect(turnstile.removed).toBe(1);
  });
});

describe('Contact — content', () => {
  // Stéphane's instruction, and worth a test: a phone number is the kind of
  // thing that gets added back by reflex on a contact page.
  it('carries no phone number', async () => {
    const { host } = await render();

    expect(host.querySelector('a[href^="tel:"]')).toBeNull();
    expect(host.textContent).not.toMatch(/(?:\+33|\b0[1-9])(?:[ .-]?\d{2}){4}\b/);
  });

  it('publishes no email address and no mailto', async () => {
    const { host } = await render();
    const attributes = Array.from(host.querySelectorAll('*')).flatMap((el) =>
      Array.from(el.attributes).map((a) => a.value),
    );

    expect(host.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(host.textContent).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(attributes.join(' ')).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  it('links every network once, in a new tab, named for it', async () => {
    const { host } = await render();
    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('.socials a[target]'));

    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      SITE_SETTINGS.socials.map((s) => s.url),
    );
    expect(links.map((a) => a.getAttribute('aria-label'))).toEqual([
      'LinkedIn (nouvel onglet)',
      'GitHub (nouvel onglet)',
      'ArtStation (nouvel onglet)',
    ]);
    for (const a of links) expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('offers the CV as a download', async () => {
    const { host } = await render();
    const cv = host.querySelector('.socials a[download]');

    expect(cv?.getAttribute('href')).toBe('/cv-stephane-lieumont.pdf');
    expect(cv?.getAttribute('aria-label')).toBe('Télécharger mon CV (PDF)');
  });

  it('describes the portrait from the site, without repeating its caption', async () => {
    const { host } = await render();
    const img = host.querySelector('.portrait img');

    expect(img?.getAttribute('alt')).toBe('Stéphane Lieumont, pensif, la main au menton');
    expect(img?.getAttribute('src')).toBe('/images/portrait-stephane-pensif.png');
    expect(img?.getAttribute('alt')).not.toContain(CONTACT_PAGE.portraitCaption.fr);
  });

  it('has one h1, the page title, and no detectable accessibility violation', async () => {
    const { host } = await render();

    expect(Array.from(host.querySelectorAll('h1')).map((h) => h.textContent?.trim())).toEqual([
      CONTACT_PAGE.title.fr,
    ]);
    const results = await axe.run(host, {
      resultTypes: ['violations'],
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('marks the English the French title quotes, and reads the same', async () => {
    const { host } = await render();
    const title = host.querySelector('h1')!;

    expect(title.textContent).toBe(CONTACT_PAGE.title.fr);
    expect(
      Array.from(title.querySelectorAll('[lang]')).map((s) => [
        s.textContent,
        s.getAttribute('lang'),
      ]),
    ).toEqual([['Hello World', 'en']]);
  });

  it('leaves an English title, or one quoting nothing, in one run', () => {
    expect(titleParts(CONTACT_PAGE.title.en, 'en')).toEqual([
      { text: CONTACT_PAGE.title.en, lang: null },
    ]);
    expect(titleParts('Écrivez-moi', 'fr')).toEqual([{ text: 'Écrivez-moi', lang: null }]);
  });

  it('keeps the message out of the smooth scroll', async () => {
    const { host } = await render();

    expect(field(host, 'message').hasAttribute('data-lenis-prevent')).toBe(true);
  });
});

describe('Contact — entrance', () => {
  it('waits for the ink wipe when it arrived under one', async () => {
    const { host } = await render({ transition: 'wipe' });

    expect(host.querySelector('.contact')?.getAttribute('data-arrival')).toBe('wipe');
  });

  it('starts at once on a direct load', async () => {
    const { host } = await render();

    expect(host.querySelector('.contact')?.hasAttribute('data-arrival')).toBe(false);
  });
});

describe('Contact — portrait depth', () => {
  function point(host: HTMLElement, pointerType: string) {
    const portrait = host.querySelector<HTMLElement>('.portrait');
    if (!portrait) throw new Error('no portrait');
    portrait.getBoundingClientRect = () => new DOMRect(0, 0, 400, 400);
    host
      .querySelector('.contact')
      ?.dispatchEvent(new PointerEvent('pointermove', { pointerType, clientX: 400, clientY: 200 }));
  }

  function runFrames(count: number) {
    for (let i = 0; i < count; i += 1) for (const frame of [...frames]) frame(i * 16, 16);
  }

  const plate = (host: HTMLElement) =>
    host.querySelector<HTMLElement>('.portrait__plate')?.style.transform ?? '';
  const figure = (host: HTMLElement) =>
    host.querySelector<HTMLElement>('.portrait__mask')?.style.transform ?? '';

  it('moves the plate against a mouse and the figure with it', async () => {
    const { host } = await render();
    point(host, 'mouse');
    runFrames(400);

    // The pointer at the portrait's right edge: full reach on x.
    expect(plate(host)).toBe('translate(-26.00px, 0.00px)');
    expect(figure(host)).toBe('translate(10.00px, 0.00px)');
    expect(frames.size).toBe(0);
  });

  it('stays still under reduced motion', async () => {
    const { host } = await render({ reduced: true });
    point(host, 'mouse');
    runFrames(10);

    expect(frames.size).toBe(0);
    expect(plate(host)).toBe('');
    expect(figure(host)).toBe('');
  });

  it('settles at once when reduced motion is turned on mid-drift', async () => {
    const { fixture, host } = await render();
    point(host, 'mouse');
    runFrames(5);
    expect(plate(host)).not.toBe('');

    reducedMotion.set(true);
    await fixture.whenStable();

    expect(frames.size).toBe(0);
    expect(plate(host)).toBe('');
    expect(figure(host)).toBe('');
  });

  it('ignores touch', async () => {
    const { host } = await render();
    point(host, 'touch');

    expect(frames.size).toBe(0);
  });
});
