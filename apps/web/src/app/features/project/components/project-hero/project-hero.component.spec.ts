import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { PROJECTS, type StaticProject } from '@core/data/static-content/static-content';
import { ProjectHeroComponent } from './project-hero.component';

@Component({
  imports: [ProjectHeroComponent],
  template: `<app-project-hero
    [project]="project()"
    rank="04"
    total="06"
    (videoRequested)="requests.push($event)"
  />`,
})
class Host {
  readonly project = signal<StaticProject>(PROJECTS[3]);
  readonly requests: MouseEvent[] = [];
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
  it('sends « Voir la vidéo » to the player on this page, and lets the page take it there', async () => {
    const fixture = await render(withVideo);
    const host = fixture.nativeElement as HTMLElement;
    const video = Array.from(host.querySelectorAll<HTMLAnchorElement>('.ctas a')).find((a) =>
      a.textContent?.includes('Voir la vidéo'),
    );

    // An address of its own, so a new tab or a page without script still lands on it.
    expect(video?.getAttribute('href')).toBe('/developpeur/linxea#video');
    expect(video?.hasAttribute('target')).toBe(false);
    video?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(fixture.componentInstance.requests).toHaveLength(1);
  });

  it('draws the site as the solid button and the video as the ghost after it', async () => {
    const host = (await render(withVideo)).nativeElement as HTMLElement;
    const buttons = Array.from(host.querySelectorAll('.ctas a'), (a) => ({
      ghost: a.classList.contains('btn--ghost'),
      text: a.textContent?.trim(),
    }));

    expect(buttons).toEqual([
      { ghost: false, text: 'Voir le site (nouvel onglet)' },
      { ghost: true, text: 'Voir la vidéo' },
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
