import type { SoftwareSlug, TechnologySlug } from '@portfolio/shared-types/registries';

/**
 * Content held in the app until the API and back office exist.
 *
 * Deliberately shaped like spec 03's entities so the swap is a change of source
 * and not a rewrite of the pages. Copy is French: it is what a visitor reads.
 */
export interface StaticProject {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly technologies: readonly TechnologySlug[];
  readonly series?: string;
  readonly releasedAt: string;
  readonly role: string;
}

export interface StaticArtwork {
  readonly slug: string;
  readonly title: string;
  readonly software: readonly SoftwareSlug[];
  readonly releasedAt: string;
  readonly featured: boolean;
}

// Ordered by releasedAt descending, as spec 03 settles. No manual sort field:
// two sources of truth for order always drift.
export const PROJECTS: readonly StaticProject[] = [
  {
    slug: 'case-tes-potes-mobile',
    title: 'Case Tes Potes — application mobile',
    summary:
      'Une application de rencontre où ce sont les amis qui présentent. J’ai défini la stratégie technique, écrit les user stories et la roadmap, et mené le développement avec deux développeurs.',
    technologies: ['flutter', 'dart', 'xd', 'git', 'jira'],
    series: 'Case Tes Potes',
    releasedAt: '2022-08-30',
    role: 'Co-fondateur et lead developer',
  },
  {
    slug: 'case-tes-potes-landing-page',
    title: 'Case Tes Potes — landing page',
    summary:
      'La page d’entrée de la campagne de préinscription. Développée en React, adossée à une API Koa qui alimente la base de contacts et déclenche les envois.',
    technologies: ['react', 'typescript', 'sass', 'node', 'mongodb', 'docker'],
    series: 'Case Tes Potes',
    releasedAt: '2022-03-15',
    role: 'Conception et développement',
  },
  {
    slug: 'case-tes-potes-web-app',
    title: 'Case Tes Potes — web app',
    summary:
      'Une application accessible par lien d’invitation, pour que les proches d’un célibataire complètent son profil sans installer l’application mobile.',
    technologies: ['webpack', 'javascript', 'sass', 'node'],
    series: 'Case Tes Potes',
    releasedAt: '2021-11-10',
    role: 'Conception et développement',
  },
  {
    slug: 'kasa-openclassrooms',
    title: 'Kasa — OpenClassrooms',
    summary:
      'Une plateforme de location entre particuliers, réalisée dans le cadre de ma formation. L’occasion de poser proprement une architecture React et un typage strict.',
    technologies: ['react', 'typescript', 'sass', 'node'],
    releasedAt: '2021-06-01',
    role: 'Développement',
  },
  {
    slug: 'portfolio-3d-2018',
    title: 'Portfolio 3D',
    summary:
      'Ma première vitrine, écrite sans framework. Elle m’a appris ce que coûte une animation mal pensée bien avant que je sache le nommer.',
    technologies: ['javascript'],
    releasedAt: '2018-04-01',
    role: 'Conception et développement',
  },
  {
    slug: 'pixmodels',
    title: 'Pixmodels',
    summary:
      'Un service de communication audiovisuelle : site vitrine et outils de gestion, à une époque où je faisais encore de la 3D à plein temps.',
    technologies: ['javascript', 'php'],
    releasedAt: '2015-09-01',
    role: 'Conception et développement',
  },
];

export const ARTWORKS: readonly StaticArtwork[] = [
  {
    slug: 'escart-wild',
    title: 'Escart Wild',
    software: ['zbrush', '3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: true,
  },
  {
    slug: 'maison-moderne',
    title: 'Maison moderne',
    software: ['3dsmax', 'vray'],
    releasedAt: '2014-01-01',
    featured: true,
  },
  {
    slug: 'legos-minions',
    title: 'Légos — les Minions',
    software: ['3dsmax', 'vray'],
    releasedAt: '2016-01-01',
    featured: false,
  },
  {
    slug: 'immeuble',
    title: 'Immeuble',
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'beebop',
    title: 'Beebop',
    software: ['zbrush', '3dsmax'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'gorgotte',
    title: 'Gorgotte',
    software: ['zbrush', 'substance-painter'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'salon',
    title: 'Architecture d’intérieur — salon',
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'chambre',
    title: 'Architecture d’intérieur — chambre',
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'entree',
    title: 'Architecture d’intérieur — entrée',
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'exterieur',
    title: 'Extérieur',
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'ampoule',
    title: 'Ampoule',
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'tomates',
    title: 'Tomates',
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'extraterrestre',
    title: 'Extraterrestre',
    software: ['zbrush', 'substance-painter'],
    releasedAt: '2016-01-01',
    featured: false,
  },
  {
    slug: 'caricature',
    title: 'Caricature',
    software: ['zbrush'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'support-marketing',
    title: 'Support marketing',
    software: ['3dsmax', 'photoshop'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'maison-abandonnee',
    title: 'Maison abandonnée',
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
];

/**
 * Highlighted on the Developer page, settled 2026-08-31.
 *
 * Flutter is deliberately absent: Stéphane no longer wants to be approached for
 * it. The Case Tes Potes mobile project keeps it below, because that is a fact
 * of his record and the one carrying the most responsibility.
 */
export const HIGHLIGHTED_TECHNOLOGIES: readonly TechnologySlug[] = [
  'angular',
  'typescript',
  'dotnet',
  'react',
  'docker',
  'git',
];
