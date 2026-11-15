import type {
  ContactPage,
  LocalizedText,
  SiteSettings,
  WorldKey,
  WorldPage,
} from '@portfolio/shared-types';

/**
 * Editorial content of the two worlds and the contact page, held in the app
 * until the back office exists (#54); the Stack section and the tools come
 * from the API (ADR-0022). Shaped exactly like the shared-types schemas so
 * the swap to the API is a change of source, not of shape — world-content.spec
 * parses every record against them.
 *
 * French copy approved with Stéphane on the « Bascule Dev / 3D » mockup,
 * 2026-11-14. The English is a draft written from it, no new claim, until the
 * content review (ADR-0017).
 */

const UPDATED_AT = '2026-11-14T00:00:00.000Z';

/** An image shipped from public/, served from the site's own origin. */
export interface PublicImage {
  /** Root-relative; never under /medias, which is the bucket's. */
  readonly src: string;
  readonly alt: LocalizedText;
  readonly width: number;
  readonly height: number;
  /**
   * The widths of its WebP variants beside it (`<name>-<width>.webp`, apps/api
   * `media:public`), never above the source's own.
   */
  readonly variants: readonly number[];
}

/**
 * Assets referenced by id, as the API will. Until media are records, the ids
 * are fixed placeholders resolved here. The portrait ships from public/ until
 * the media pipeline (ADR-0012) takes it over.
 */
export const STATIC_ASSETS: Readonly<Record<string, PublicImage>> = {
  '6b7c2a0e-1f3d-4c5a-9e8b-2d4f6a8c0e11': {
    src: '/images/portrait-stephane-pensif.png',
    alt: {
      fr: 'Stéphane Lieumont, pensif, la main au menton',
      en: 'Stéphane Lieumont, thoughtful, his hand on his chin',
    },
    width: 500,
    height: 392,
    // The 2022 cut-out is 500px wide: no larger variant until a larger master.
    variants: [500],
  },
};

const PORTRAIT_ID = '6b7c2a0e-1f3d-4c5a-9e8b-2d4f6a8c0e11';
const CV_ID = '9a1e5d3c-7b2f-4e6a-8c0d-1f3b5d7e9a22';

/** Files that are not images, by the same placeholder ids. The CV ships from public/. */
export const STATIC_FILES: Readonly<Record<string, string>> = {
  [CV_ID]: '/cv-stephane-lieumont.pdf',
};

export const WORLD_PAGES: Readonly<Record<WorldKey, WorldPage>> = {
  dev: {
    world: 'dev',
    roleWord: { fr: 'LEAD TECH', en: 'LEAD TECH' },
    eyebrowTools: ['angular', 'dotnet', 'typescript'],
    lede: {
      lead: { fr: 'Angular et .NET.', en: 'Angular and .NET.' },
      text: {
        fr: 'Une rigueur d’ingénieur, un œil de graphiste 3D.',
        en: 'An engineer’s rigour, a 3D artist’s eye.',
      },
    },
    scrub: {
      fr: 'J’arbitre les choix techniques, j’encadre et je challenge les équipes. Le code, je continue à l’écrire.',
      en: 'I make the technical calls, I mentor and challenge teams. And I still write code.',
    },
    facts: [
      {
        label: { fr: 'Rôle', en: 'Role' },
        value: {
          fr: 'Aujourd’hui — Lead Tech front & back, équipe de 5 à 8',
          en: 'Currently — front & back-end Lead Tech, team of five to eight',
        },
      },
      {
        label: { fr: 'Équipe', en: 'Team' },
        value: {
          fr: 'Jusqu’à 8 développeurs encadrés',
          en: 'Leading up to eight developers',
        },
      },
      {
        label: { fr: 'Aussi', en: 'Also' },
        value: { fr: 'React, Docker, CI/CD, Git', en: 'React, Docker, CI/CD, Git' },
      },
      {
        label: { fr: 'Avant', en: 'Before' },
        value: { fr: 'Quatorze ans dans l’aéronautique', en: 'Fourteen years in aerospace' },
      },
    ],
    updatedAt: UPDATED_AT,
  },
  cgi: {
    world: 'cgi',
    roleWord: { fr: 'GRAPHISTE 3D', en: '3D ARTIST' },
    eyebrowTools: ['3dsmax', 'vray', 'zbrush'],
    lede: {
      lead: { fr: 'Une pratique d’autodidacte.', en: 'A self-taught practice.' },
      text: {
        fr: 'Sans école, avant le développement.',
        en: 'No formal training, before development.',
      },
    },
    scrub: {
      fr: 'De la forme à la lumière, je construis l’image jusqu’au moindre reflet. Le détail, c’est là que tout se joue.',
      en: 'From form to light, I build the image down to the last reflection. Detail is where it is won or lost.',
    },
    facts: [
      {
        label: { fr: 'Modélisation', en: 'Modelling' },
        value: { fr: '3ds Max, ZBrush', en: '3ds Max, ZBrush' },
      },
      { label: { fr: 'Rendu', en: 'Rendering' }, value: { fr: 'V-Ray', en: 'V-Ray' } },
      {
        label: { fr: 'Texture', en: 'Texturing' },
        value: { fr: 'Substance Painter, Photoshop', en: 'Substance Painter, Photoshop' },
      },
      {
        label: { fr: 'Depuis', en: 'Since' },
        value: { fr: '2010, en autodidacte', en: '2010, self-taught' },
      },
      {
        label: { fr: 'Distinction', en: 'Recognition' },
        value: { fr: 'Escart Wild, primé par TDT3D en 2015', en: 'Escart Wild, TDT3D award, 2015' },
      },
    ],
    updatedAt: UPDATED_AT,
  },
};

export const CONTACT_PAGE: ContactPage = {
  title: {
    fr: 'Un projet, une question ou juste un Hello World ?',
    en: 'A project, a question or just a Hello World?',
  },
  lede: {
    fr: 'Une idée à confronter, un retour d’expérience ou simplement l’envie d’échanger\u00a0: écrivez-moi ici ou sur LinkedIn.',
    en: 'An idea to challenge, lessons learned to share or just a chat: write to me here or on LinkedIn.',
  },
  portraitAssetId: PORTRAIT_ID,
  portraitCaption: { fr: 'Fontenilles, France', en: 'Fontenilles, France' },
  updatedAt: UPDATED_AT,
};

export const SITE_SETTINGS: SiteSettings = {
  socials: [
    { kind: 'linkedin', url: 'https://www.linkedin.com/in/stephane-lieumont/' },
    { kind: 'github', url: 'https://github.com/stephane-lieumont' },
    { kind: 'artstation', url: 'https://www.artstation.com/s-lieumont' },
  ],
  cvAssetId: CV_ID,
  updatedAt: UPDATED_AT,
};
