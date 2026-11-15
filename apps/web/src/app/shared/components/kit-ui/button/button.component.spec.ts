import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { ButtonComponent } from './button.component';

@Component({
  imports: [ButtonComponent, RouterLink],
  template: `
    <nav>
      <a appButton class="btn" routerLink="/contact">Me contacter</a>
      <a appButton class="btn btn--ghost" href="/cv.pdf" target="_blank" rel="noopener"
        >Mon CV<span class="visually-hidden"> (PDF, nouvel onglet)</span></a
      >
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {}

function render(): HTMLElement {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ButtonComponent', () => {
  it('stays the link itself: no wrapper between the nav and the anchor', () => {
    const nav = render().querySelector('nav')!;
    const links = [...nav.children];
    expect(links.map((l) => l.tagName)).toEqual(['A', 'A']);
    expect(links[0]!.getAttribute('href')).toBe('/contact');
    expect(links[1]!.getAttribute('href')).toBe('/cv.pdf');
    expect(links[1]!.getAttribute('target')).toBe('_blank');
  });

  it('keeps the projected label whole, the hidden hint included', () => {
    const ghost = render().querySelector('.btn--ghost')!;
    expect(ghost.textContent).toBe('Mon CV (PDF, nouvel onglet)');
  });
});
