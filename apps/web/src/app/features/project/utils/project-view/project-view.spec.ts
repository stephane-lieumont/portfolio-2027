import { describe, expect, it } from 'vitest';

import { PROJECTS, type StaticProject } from '@core/data/static-content/static-content';
import { plateLean } from '@features/project/directives/plate-lean/plate-lean.directive';
import { OTHERS_COUNT, closingBand, heroTitle, projectLinks } from './project-view';

const base = PROJECTS[0];
const variant = (changes: Partial<StaticProject>): StaticProject => ({ ...base, ...changes });

describe('heroTitle', () => {
  it('splits « Série — qualificatif » into the name and the condensed word', () => {
    const title = heroTitle('Case Tes Potes — application mobile');

    expect(title.nameText).toBe('Case Tes Potes');
    expect(title.name.map((word) => word.map((g) => g.char).join(''))).toEqual([
      'Case',
      'Tes',
      'Potes',
    ]);
    expect(title.qualifier.map((g) => g.char).join('')).toBe('application mobile');
  });

  it('staggers the letters only, a space taking no step', () => {
    const steps = heroTitle('A — b c')
      .qualifier.filter((g) => !g.space)
      .map((g) => g.step);

    expect(steps).toEqual([0, 1]);
  });

  it('has no qualifier for a plain title', () => {
    expect(heroTitle('Pixmodels').qualifier).toEqual([]);
  });
});

describe('projectLinks', () => {
  it('offers nothing a project does not have', () => {
    expect(projectLinks(variant({ websiteUrl: undefined, videoUrl: undefined }))).toEqual([]);
  });

  it('puts the site first, then the video, which stays on the page', () => {
    const links = projectLinks(
      variant({ websiteUrl: '/demo/x', videoUrl: 'https://youtu.be/dQw4w9WgXcQ' }),
    );

    expect(links.map((l) => [l.label, l.href])).toEqual([
      ['Voir le site', '/demo/x'],
      ['Voir la vidéo', '#video'],
    ]);
  });
});

describe('closingBand', () => {
  it('ends a project outside a series on others, distinct and never itself', () => {
    for (const project of PROJECTS.filter((p) => !p.series)) {
      const band = closingBand(project, PROJECTS);
      const ids = band.projects.map((p) => p.id);

      expect(ids).toHaveLength(OTHERS_COUNT);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).not.toContain(project.id);
      expect(band.current).toBeNull();
    }
  });

  it('never asks for more others than there are', () => {
    const lone = variant({ series: undefined });

    expect(closingBand(lone, [lone, PROJECTS[3]]).projects).toEqual([PROJECTS[3]]);
  });
});

describe('plateLean', () => {
  it('leans the edge as the sweep does: 20% of the width across the height, at the viewport aspect', () => {
    expect(plateLean(1000, 400, 1440, 900)).toBeCloseTo(128);
  });

  it('caps the lean at 22% of the plate in a short, wide window', () => {
    expect(plateLean(1000, 600, 1440, 500)).toBeCloseTo(220);
  });
});
