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
  /** One sentence, for the card. The detail page never repeats it. */
  readonly summary: string;
  /** What the product is, for someone who has never heard of it. */
  readonly context: string;
  /** What Stéphane was responsible for. */
  readonly mission: string;
  /**
   * Plain sentences, never markup. The 2022 data wrapped tool names in
   * `<strong>`, which would have to be either rendered as HTML or escaped and
   * shown raw. The tools are already listed as chips, so the emphasis carried
   * nothing the page does not say elsewhere.
   */
  readonly missionSteps: readonly string[];
  readonly technologies: readonly TechnologySlug[];
  readonly series?: string;
  readonly releasedAt: string;
  readonly role: string;
  /**
   * Served by the nginx reverse proxy on this host, so a root-relative path and
   * never an absolute URL — the demos move with the site (see ADR-0005).
   */
  readonly demoUrl?: string;
  readonly cover: StaticImage;
}

/** A rendered image with its intrinsic size, so nothing reflows once it loads. */
export interface StaticImage {
  /**
   * Object key inside the MinIO bucket, never a URL. The origin serving it
   * differs between development and production, so the base is injected
   * (MEDIA_BASE_URL) and joined at render time — see media-url.ts.
   */
  readonly key: string;
  /**
   * Describes the picture for someone who cannot see it — never a repeat of the
   * title, which is already read out beside it. The 2022 alt text was the title
   * again, typos included.
   */
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export interface StaticArtwork {
  readonly slug: string;
  readonly title: string;
  readonly image: StaticImage;
  readonly software: readonly SoftwareSlug[];
  readonly releasedAt: string;
  readonly featured: boolean;
}

// Ordered by releasedAt descending, as spec 03 settles. No manual sort field:
// two sources of truth for order always drift.
export const PROJECTS: readonly StaticProject[] = [
  {
    slug: 'case-tes-potes-mobile',
    cover: {
      key: 'projects/case-tes-potes-mobile.jpg',
      alt: 'Écrans de l’application mobile Case Tes Potes',
      width: 400,
      height: 300,
    },
    title: 'Case Tes Potes — application mobile',
    summary:
      'Une application de rencontre où ce sont les amis qui présentent. J’ai défini la stratégie technique, écrit les user stories et la roadmap, et mené le développement avec deux développeurs.',
    context:
      'Une application de rencontre où ce sont les amis qui présentent le célibataire. Le parcours accompagne les deux côtés, de la recherche de profils à l’organisation du premier rendez-vous.',
    mission:
      'Co-fondateur et lead developer. J’ai défini la stratégie technique, piloté une équipe de deux développeurs et mené la première version jusqu’au test marché.',
    missionSteps: [
      'Analyse des besoins et rédaction des user stories.',
      'Roadmap produit : priorités de développement et jalons de livraison.',
      'Maquette interactive sous Adobe XD, pour valider le parcours avant d’écrire du code.',
      'Pilotage de l’équipe et arbitrage des choix techniques au fil du développement.',
      'Développement multiplateforme en Flutter, livré sur Android et iOS.',
    ],
    technologies: ['flutter', 'dart', 'xd', 'git', 'jira'],
    series: 'Case Tes Potes',
    releasedAt: '2022-08-30',
    role: 'Co-fondateur et lead developer',
  },
  {
    slug: 'case-tes-potes-landing-page',
    cover: {
      key: 'projects/case-tes-potes-landing-page.jpg',
      alt: 'Landing page de préinscription de Case Tes Potes',
      width: 400,
      height: 329,
    },
    title: 'Case Tes Potes — landing page',
    summary:
      'La page d’entrée de la campagne de préinscription. Développée en React, adossée à une API Koa qui alimente la base de contacts et déclenche les envois.',
    context:
      'La page d’entrée de la campagne de préinscription à la bêta fermée. Elle collecte les contacts, répond aux questions et sert de vitrine au projet.',
    mission:
      'Conception et développement, de la maquette à la mise en production, API de collecte comprise.',
    missionSteps: [
      'Cadrage des objectifs avec la stratégie marketing.',
      'Maquette Figma, UX et UI.',
      'Développement de la page en React.',
      'API Koa pour la gestion des contacts et l’intégration au service d’emailing.',
      'Tests unitaires et d’intégration avec Jest.',
      'Déploiement en image Docker.',
    ],
    demoUrl: '/demo/casetespotes-landingpage',
    technologies: ['react', 'typescript', 'sass', 'node', 'mongodb', 'docker'],
    series: 'Case Tes Potes',
    releasedAt: '2022-03-15',
    role: 'Conception et développement',
  },
  {
    slug: 'case-tes-potes-web-app',
    cover: {
      key: 'projects/case-tes-potes-web-app.jpg',
      alt: 'Formulaire de témoignage de la web app Case Tes Potes',
      width: 400,
      height: 300,
    },
    title: 'Case Tes Potes — web app',
    summary:
      'Une application accessible par lien d’invitation, pour que les proches d’un célibataire complètent son profil sans installer l’application mobile.',
    context:
      'Le profil d’un célibataire se nourrit des témoignages de ses proches. Cette application, ouverte par lien d’invitation, leur permet de les écrire sans installer l’application mobile.',
    mission:
      'Conception et développement d’une application autonome branchée sur l’API du produit mobile.',
    missionSteps: [
      'Maquette Adobe XD, cohérente avec l’application mobile.',
      'Développement avec Webpack, sans framework.',
      'Validation des invitations et authentification avant rédaction.',
      'Branchement direct sur l’API de l’application mobile.',
    ],
    demoUrl: '/demo/casetespotes-webapp',
    technologies: ['webpack', 'javascript', 'sass', 'node'],
    series: 'Case Tes Potes',
    releasedAt: '2021-11-10',
    role: 'Conception et développement',
  },
  {
    slug: 'kasa-openclassrooms',
    cover: {
      key: 'projects/kasa-openclassrooms.jpg',
      alt: 'Page d’accueil de la plateforme de location Kasa',
      width: 500,
      height: 375,
    },
    title: 'Kasa — OpenClassrooms',
    summary:
      'Une plateforme de location entre particuliers, réalisée dans le cadre de ma formation. L’occasion de poser proprement une architecture React et un typage strict.',
    context:
      'Une plateforme de location entre particuliers, sujet d’un projet de formation OpenClassrooms : intégrer fidèlement une maquette Figma sur une stack JavaScript moderne.',
    mission:
      'Développement de l’application. Ma première expérience React, et l’occasion de poser proprement le routage et un typage strict.',
    missionSteps: [
      'Développement en React, au plus près de la maquette Figma.',
      'Routage applicatif avec React Router.',
      'Passage à TypeScript et typage strict des composants.',
    ],
    demoUrl: '/demo/openclassrooms-kasa',
    technologies: ['react', 'typescript', 'sass', 'node'],
    releasedAt: '2021-06-01',
    role: 'Développement',
  },
  {
    slug: 'portfolio-3d-2018',
    cover: {
      key: 'projects/portfolio-3d-2018.jpg',
      alt: 'Page d’accueil du portfolio 3D de 2018',
      width: 400,
      height: 300,
    },
    title: 'Portfolio 3D',
    summary:
      'Ma première vitrine, écrite sans framework. Elle m’a appris ce que coûte une animation mal pensée bien avant que je sache le nommer.',
    context:
      'Ma première vitrine en ligne, écrite sans framework, pour montrer mes créations 3D à une époque où c’était mon métier à plein temps.',
    mission: 'Conception et développement, seul, en JavaScript natif.',
    missionSteps: [
      'Mise en ligne de mes réalisations 3D.',
      'Développement sans framework, en JavaScript natif.',
      'Première confrontation au coût réel d’une animation mal pensée.',
    ],
    demoUrl: '/demo/portfolio2018',
    technologies: ['javascript'],
    releasedAt: '2018-04-01',
    role: 'Conception et développement',
  },
  {
    slug: 'pixmodels',
    cover: {
      key: 'projects/pixmodels.jpg',
      alt: 'Site vitrine de Pixmodels',
      width: 400,
      height: 300,
    },
    title: 'Pixmodels',
    summary:
      'Un service de communication audiovisuelle : site vitrine et outils de gestion, à une époque où je faisais encore de la 3D à plein temps.',
    context:
      'En 2015 je crée mon entreprise de communication audiovisuelle. Il fallait une présence en ligne à la hauteur : sur ce marché, l’image de marque est l’argument.',
    mission: 'Conception et développement du site vitrine et des outils de gestion associés.',
    missionSteps: [
      'Étude du marché et des besoins.',
      'Identité visuelle et maquettes.',
      'Développement du site vitrine et du formulaire de contact.',
      'Outils de gestion pour le suivi des prestations.',
    ],
    demoUrl: '/demo/pixmodels',
    technologies: ['javascript', 'php'],
    releasedAt: '2015-09-01',
    role: 'Conception et développement',
  },
];

/**
 * The sixteen pieces the current site shows, with Stéphane's own titles and
 * tool lists, carried over on his instruction: "conserve ce qui est présent
 * actuellement." Nine more renders sit unused in the 2022 repository and are
 * deliberately not here — the selection is his, not ours.
 *
 * Years come from the file names rather than from the 2022 `released` field,
 * which contradicts itself: that data dated Escart Wild to 2014 while its own
 * slider dated the same image to 2015. The file name is what he typed when he
 * saved the render.
 */
export const ARTWORKS: readonly StaticArtwork[] = [
  {
    slug: 'legos-minions',
    title: 'Légos : les Minions',
    image: {
      key: 'cgi/legos-minions.jpg',
      alt: 'Les Minions reconstitués en Légos',
      width: 1200,
      height: 675,
    },
    software: ['3dsmax', 'vray', 'photoshop', 'illustrator'],
    releasedAt: '2016-01-01',
    featured: true,
  },
  {
    slug: 'extraterrestre',
    title: 'Extraterrestre',
    image: {
      key: 'cgi/extraterrestre.jpg',
      alt: 'Extraterrestre de science-fiction photoréaliste',
      width: 1200,
      height: 675,
    },
    software: ['3dsmax', 'vray', 'photoshop', 'substance-painter'],
    releasedAt: '2016-01-01',
    featured: true,
  },
  {
    slug: 'escart-wild',
    title: 'Escart Wild',
    image: {
      key: 'cgi/escart-wild.jpg',
      alt: 'Escargot cartoon photoréaliste',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray', 'zbrush', 'photoshop'],
    releasedAt: '2015-01-01',
    featured: true,
  },
  {
    slug: 'beebop',
    title: 'Beebop',
    image: {
      key: 'cgi/beebop.jpg',
      alt: 'Le robot Beebop, sculpté et texturé',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'substance-painter', 'zbrush', 'photoshop'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'gorgotte',
    title: 'Gorgotte',
    image: {
      key: 'cgi/gorgotte.jpg',
      alt: 'Créature monstrueuse sculptée en 3D',
      width: 1280,
      height: 696,
    },
    software: ['3dsmax', 'zbrush', 'photoshop'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'immeuble',
    title: 'Immeuble',
    image: {
      key: 'cgi/immeuble.jpg',
      alt: 'Immeuble d’habitation photoréaliste',
      width: 1280,
      height: 1078,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'salon-nuit',
    title: 'Architecture d’intérieur — salon, nuit',
    image: {
      key: 'cgi/salon-nuit.jpg',
      alt: 'Salon décoré, éclairage de nuit',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'chambre',
    title: 'Architecture d’intérieur — chambre',
    image: {
      key: 'cgi/chambre.jpg',
      alt: 'Chambre décorée, lumière du jour',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'salon-jour',
    title: 'Architecture d’intérieur — salon, jour',
    image: {
      key: 'cgi/salon-jour.jpg',
      alt: 'Salon décoré, lumière du jour',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    slug: 'caricature',
    title: 'Caricature',
    image: {
      key: 'cgi/caricature.jpg',
      alt: 'Caricature 3D de Stéphane Lieumont',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray', 'zbrush', 'photoshop'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    slug: 'maison-moderne',
    title: 'Maison moderne',
    image: {
      key: 'cgi/maison-moderne.jpg',
      alt: 'Maison moderne photoréaliste, vue extérieure',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2014-01-01',
    featured: true,
  },
  {
    slug: 'entree',
    title: 'Architecture d’intérieur — entrée',
    image: {
      key: 'cgi/entree.jpg',
      alt: 'Entrée d’habitation aux murs blancs',
      width: 1280,
      height: 864,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    slug: 'exterieur',
    title: 'Extérieur',
    image: {
      key: 'cgi/exterieur.jpg',
      alt: 'Extérieur avec herbe photoréaliste',
      width: 1200,
      height: 848,
    },
    software: ['3dsmax', 'vray', 'photoshop'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    slug: 'ampoule',
    title: 'Ampoule',
    image: {
      key: 'cgi/ampoule.jpg',
      alt: 'Ampoule photoréaliste sur fond neutre',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    slug: 'support-marketing',
    title: 'Support marketing',
    image: {
      key: 'cgi/support-marketing.jpg',
      alt: 'Canette Pixmodels, visuel publicitaire',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray', 'photoshop'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    slug: 'tomates',
    title: 'Tomates',
    image: {
      key: 'cgi/tomates.jpg',
      alt: 'Tomates photoréalistes',
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray', 'photoshop'],
    releasedAt: '2014-01-01',
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
