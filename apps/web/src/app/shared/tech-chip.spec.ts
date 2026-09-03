import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { technologyOf } from '@portfolio/shared-types/registries';
import { describe, expect, it } from 'vitest';

import { TechChip } from './tech-chip';

async function render(slug: 'typescript' | 'angular'): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [TechChip],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(TechChip);
  fixture.componentRef.setInput('entry', technologyOf(slug));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('TechChip', () => {
  it('marks a tool the 2022 icon font has a glyph for', async () => {
    const host = await render('typescript');

    expect(host.querySelector('.tech-chip__glyph')).toBeTruthy();
    expect(host.textContent).toContain('TypeScript');
  });

  it('names a tool the font has no glyph for, without an empty box', async () => {
    // Angular and .NET post-date the 2022 font, so their glyph is null. The
    // label is the content; the glyph was only ever decoration.
    const host = await render('angular');

    expect(host.querySelector('.tech-chip__glyph')).toBeNull();
    expect(host.textContent).toContain('Angular');
  });

  it('hides the glyph from assistive technology', async () => {
    const host = await render('typescript');
    const glyph = host.querySelector('.tech-chip__glyph');

    // It is a private-use codepoint: read aloud it is noise, and the label
    // beside it already says the name.
    expect(glyph?.getAttribute('aria-hidden')).toBe('true');
  });
});
