import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { PROJECTS, type StaticProject } from '../../core/static-content';
import { ProjectHero } from './project-hero';

@Component({
  imports: [ProjectHero],
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

const withVideo: StaticProject = {
  ...PROJECTS[3],
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

describe('ProjectHero', () => {
  it('sends « Voir la vidéo » to the player on this page, and lets the page take it there', async () => {
    const fixture = await render(withVideo);
    const host = fixture.nativeElement as HTMLElement;
    const video = Array.from(host.querySelectorAll<HTMLAnchorElement>('.ctas a')).find((a) =>
      a.textContent?.includes('Voir la vidéo'),
    );

    // An address of its own, so a new tab or a page without script still lands on it.
    expect(video?.getAttribute('href')).toBe('/developpeur/kasa-openclassrooms#video');
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
    const host = (await render(PROJECTS[0])).nativeElement as HTMLElement;
    const header = host.querySelector<HTMLElement>('app-project-hero');

    // « Case Tes Potes »: 12 letters, 260 + 12 × 38 + 220.
    expect(header?.style.getPropertyValue('--entrance-base')).toBe('936ms');
    expect(header?.classList.contains('entrance--intro')).toBe(true);
  });
});
