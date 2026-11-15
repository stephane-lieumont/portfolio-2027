import type { StaticProject } from '../../core/static-content';
import { type Glyph, nameWords } from '../world/world-hero';

export interface QualifierGlyph {
  readonly char: string;
  readonly space: boolean;
  /** Position among the letters only, spaces skipped: the flip's stagger. */
  readonly step: number;
}

export interface HeroTitle {
  /** The name's words, letter by letter, rising as the world pages' name does. */
  readonly name: Glyph[][];
  /** What follows « — », flipping in condensed under the name; empty when none. */
  readonly qualifier: QualifierGlyph[];
  /** The name as text: the qualifier's entrance waits for its letters. */
  readonly nameText: string;
}

/** « Série — qualificatif » splits into the hero's two voices. */
export function heroTitle(title: string): HeroTitle {
  const [name, ...rest] = title.split(' — ');
  let step = 0;
  const qualifier = [...rest.join(' — ')].map((char) => ({
    char,
    space: char === ' ',
    step: char === ' ' ? step : step++,
  }));
  return { name: nameWords(name), qualifier, nameText: name };
}

export interface ProjectLink {
  readonly kind: 'site' | 'video';
  readonly label: string;
  readonly href: string;
}

/** The hero's buttons: only what the project has, the site first. */
export function projectLinks(project: StaticProject): ProjectLink[] {
  const links: ProjectLink[] = [];
  if (project.websiteUrl)
    links.push({
      kind: 'site',
      label: $localize`:@@project.website:Voir le site`,
      href: project.websiteUrl,
    });
  if (project.videoUrl)
    links.push({
      kind: 'video',
      label: $localize`:@@project.watchVideo:Voir la vidéo`,
      href: '#video',
    });
  return links;
}

export interface ClosingBand {
  readonly heading: string;
  readonly projects: readonly StaticProject[];
  /** The page's own card, when the band shows it. */
  readonly current: string | null;
}

/** How many projects close a page outside a series. */
export const OTHERS_COUNT = 3;

/**
 * A project in a series ends on the whole series, itself included and marked.
 * Any other ends on the projects that follow it in the list, wrapping round,
 * so every page points somewhere different and none points back at itself.
 */
export function closingBand(
  project: StaticProject,
  projects: readonly StaticProject[],
): ClosingBand {
  if (project.series) {
    return {
      heading: $localize`:@@project.series:Série · ${project.series}:series:`,
      projects: projects.filter((p) => p.series === project.series),
      current: project.slug,
    };
  }
  const at = projects.findIndex((p) => p.slug === project.slug);
  const others = Array.from(
    { length: Math.min(OTHERS_COUNT, projects.length - 1) },
    (_, i) => projects[(at + 1 + i) % projects.length],
  );
  return {
    heading: $localize`:@@project.others:Autres réalisations`,
    projects: others,
    current: null,
  };
}
