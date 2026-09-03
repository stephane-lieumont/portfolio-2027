import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { PROJECTS } from '../../core/static-content';
import { ProjectDetail } from './project-detail';

async function render(slug: string): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [ProjectDetail],
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProjectDetail);
  fixture.componentRef.setInput('slug', slug);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

// Every project, not a sample: the copy is hand-written per entry and a missing
// field or an empty step list would only ever show up on the one page nobody
// opened.
describe.each(PROJECTS.map((p) => [p.slug, p] as const))('project %s', (slug, project) => {
  it('renders its title as the only h1', async () => {
    const host = await render(slug);
    const h1s = host.querySelectorAll('h1');

    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent?.trim()).toBe(project.title);
  });

  it('lists every mission step and technology', async () => {
    const host = await render(slug);

    expect(host.querySelectorAll('.steps__item')).toHaveLength(project.missionSteps.length);
    expect(host.querySelectorAll('app-tech-chip')).toHaveLength(project.technologies.length);
  });

  it('shows a demo link only when the project has one', async () => {
    const host = await render(slug);
    const demo = host.querySelector<HTMLAnchorElement>('.project-page__actions a');

    if (project.demoUrl) {
      // Root-relative: the demos are proxied on this host (ADR-0005), so an
      // absolute URL here would survive a domain change and quietly 404.
      expect(demo?.getAttribute('href')).toBe(project.demoUrl);
    } else {
      expect(demo).toBeNull();
    }
  });

  it('has no skipped heading level', async () => {
    const host = await render(slug);
    const levels = Array.from(host.querySelectorAll('h1, h2, h3, h4')).map((h) =>
      Number(h.tagName[1]),
    );

    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('has no detectable accessibility violation', async () => {
    const host = await render(slug);
    document.body.appendChild(host);
    const results = await axe.run(host, { resultTypes: ['violations'] });
    host.remove();

    expect(results.violations).toEqual([]);
  });
});

describe('series', () => {
  it('links the other projects of the same series, never itself', async () => {
    const host = await render('case-tes-potes-mobile');
    const links = Array.from(host.querySelectorAll('.siblings__link'));

    expect(links).toHaveLength(2);
    expect(links.some((l) => l.textContent?.includes('application mobile'))).toBe(false);
  });

  it('omits the series block for a standalone project', async () => {
    const host = await render('kasa-openclassrooms');

    expect(host.querySelector('.siblings')).toBeNull();
  });
});
