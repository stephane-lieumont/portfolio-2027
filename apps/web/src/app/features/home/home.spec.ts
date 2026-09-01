import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';

import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Home] }).compileComponents();
  });

  it('exposes the type scale and the surfaces it documents', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.specimen__row');
    const swatches = fixture.nativeElement.querySelectorAll('.specimen__swatch');

    expect(rows.length).toBeGreaterThan(0);
    expect(swatches.length).toBeGreaterThan(0);
  });

  it('keeps the submit button full-strength while busy rather than disabling it', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelectorAll(
      '.specimen__row-buttons button',
    )[4];

    expect(button.textContent?.trim()).toBe('Envoyer');
    expect(button.getAttribute('aria-busy')).toBeNull();

    button.click();
    fixture.detectChanges();

    // aria-busy rather than [disabled]: a disabled fill has no visible boundary,
    // and the control has to stay focusable to explain itself.
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(false);
    expect(button.textContent?.trim()).toBe('Envoi en cours…');
  });

  it('has no detectable accessibility violation', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    document.body.appendChild(fixture.nativeElement);
    const results = await axe.run(fixture.nativeElement, {
      resultTypes: ['violations'],
      // Contrast is computed from the token stylesheet, which is not loaded in
      // jsdom. It is verified against the measured tables in spec 06 instead.
      rules: { 'color-contrast': { enabled: false } },
    });
    document.body.removeChild(fixture.nativeElement);

    expect(results.violations).toEqual([]);
  });
});
