import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Contact } from './contact';

async function render(): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [Contact],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(Contact);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Contact', () => {
  it('binds every label to its own field', async () => {
    const host = await render();
    const labels = Array.from(host.querySelectorAll<HTMLLabelElement>('label'));

    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      const id = label.getAttribute('for');
      expect(id, 'a label with no `for`').toBeTruthy();
      expect(host.querySelector(`#${id}`), `no field with id ${id}`).toBeTruthy();
    }
  });

  it('gives each field the autocomplete a browser can act on', async () => {
    const host = await render();

    expect(host.querySelector('#nom')?.getAttribute('autocomplete')).toBe('name');
    expect(host.querySelector('#email')?.getAttribute('autocomplete')).toBe('email');
    expect(host.querySelector('#email')?.getAttribute('type')).toBe('email');
  });

  it('says plainly that the form is not wired yet', async () => {
    const host = await render();

    // Better than a form that silently swallows a message. When the API lands,
    // this note goes and this test goes with it.
    expect(host.querySelector('.contact__note')?.textContent).toContain('pas encore branché');
  });

  it('offers a route that works today', async () => {
    const host = await render();
    const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');

    expect(hrefs.some((h) => h.startsWith('mailto:'))).toBe(true);
    expect(hrefs.some((h) => h.includes('linkedin.com'))).toBe(true);
    expect(hrefs.some((h) => h.includes('artstation.com/s-lieumont'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('.pdf'))).toBe(true);
  });

  it('carries no phone number', async () => {
    const host = await render();
    const hrefs = Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');

    // Stéphane's instruction, and worth a test: a phone number is the kind of
    // thing that gets added back by reflex on a contact page.
    expect(hrefs.some((h) => h.startsWith('tel:'))).toBe(false);
    expect(host.textContent).not.toMatch(/(?:\+33|\b0[1-9])(?:[ .-]?\d{2}){4}\b/);
  });

  it('does not announce itself busy at rest', async () => {
    const host = await render();
    const submit = host.querySelector('.contact__submit');

    expect(submit?.hasAttribute('aria-busy')).toBe(false);
    expect(submit?.textContent?.trim()).toBe('Envoyer');
    // Never `disabled`: a disabled fill has no visible boundary and the control
    // has to stay focusable to explain itself.
    expect(submit?.hasAttribute('disabled')).toBe(false);
  });
});
