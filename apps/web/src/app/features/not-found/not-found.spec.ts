import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { NotFound } from './not-found';

async function render(): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [NotFound],
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotFound);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('NotFound', () => {
  it('says what happened and offers a way back into the site', async () => {
    const host = await render();

    expect(host.querySelector('h1')?.textContent?.trim()).toBeTruthy();
    expect(host.textContent).toContain('404');
    expect(Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual([
      '/developpeur',
    ]);
  });

  it('has no detectable accessibility violation', async () => {
    const host = await render();
    document.body.appendChild(host);
    const results = await axe.run(host, {
      resultTypes: ['violations'],
      rules: { 'color-contrast': { enabled: false } },
    });
    host.remove();

    expect(results.violations).toEqual([]);
  });
});
