import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { PROJECTS, type StaticProject } from '@core/data/static-content/static-content';
import { ProjectHeroComponent } from './project-hero.component';

@Component({
  imports: [ProjectHeroComponent],
  template: `<app-project-hero [project]="project()" rank="04" total="07" />`,
})
class Host {
  readonly project = signal<StaticProject>(PROJECTS[3]);
}

async function render(project: StaticProject) {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.project.set(project);
  fixture.detectChanges();
  return fixture;
}

const linxea = PROJECTS.find((p) => p.slug.fr === 'linxea')!;
const withVideo: StaticProject = {
  ...linxea,
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

describe('ProjectHeroComponent', () => {
  // Stéphane, 2026-11-15: the video plays on YouTube, nothing is embedded.
  it('sends « Voir la vidéo » to YouTube in a new tab, saying so', async () => {
    const host = (await render(withVideo)).nativeElement as HTMLElement;
    const video = Array.from(host.querySelectorAll<HTMLAnchorElement>('.ctas a')).find((a) =>
      a.textContent?.includes('Voir la vidéo'),
    );

    expect(video?.getAttribute('href')).toBe(withVideo.videoUrl);
    expect(video?.getAttribute('target')).toBe('_blank');
    expect(video?.getAttribute('rel')).toBe('noopener');
    expect(video?.textContent).toContain('(nouvel onglet)');
  });

  it('draws the site as the solid button and the video as the ghost after it', async () => {
    const host = (await render(withVideo)).nativeElement as HTMLElement;
    const buttons = Array.from(host.querySelectorAll('.ctas a'), (a) => ({
      ghost: a.classList.contains('btn--ghost'),
      text: a.textContent?.trim(),
    }));

    expect(buttons).toEqual([
      { ghost: false, text: 'Voir le site (nouvel onglet)' },
      { ghost: true, text: 'Voir la vidéo (nouvel onglet)' },
    ]);
  });

  it('starts the qualifier once the name has risen, as the world pages do', async () => {
    const mobile = PROJECTS.find((p) => p.slug.fr === 'case-tes-potes-mobile')!;
    const host = (await render(mobile)).nativeElement as HTMLElement;
    const header = host.querySelector<HTMLElement>('app-project-hero');

    // « Case Tes Potes »: 12 letters, 260 + 12 × 38 + 220.
    expect(header?.style.getPropertyValue('--entrance-base')).toBe('936ms');
    expect(header?.classList.contains('entrance--intro')).toBe(true);
  });
});
