import type { LocalizedSlug, LocalizedText, Project } from '@portfolio/shared-types';
import type { SoftwareSlug, TechnologySlug } from '@portfolio/shared-types/registries';

/**
 * Content held in the app until the API and back office exist.
 *
 * Deliberately shaped like spec 03's entities so the swap is a change of source
 * and not a rewrite of the pages. Every visitor-facing field is `{ fr, en }`
 * (ADR-0017); the English is a draft written from the French, no new claim,
 * until the content review.
 */
export interface StaticProject extends Pick<
  Project,
  'id' | 'slug' | 'title' | 'summary' | 'context' | 'role' | 'releasedAt'
> {
  /** What he did, when the context does not already say it all. */
  readonly mission?: LocalizedText;
  /**
   * Plain sentences, never markup. The 2022 data wrapped tool names in
   * `<strong>`, which would have to be either rendered as HTML or escaped and
   * shown raw. Never invented: empty when none are sourced.
   */
  readonly missionSteps: readonly LocalizedText[];
  readonly technologies: readonly TechnologySlug[];
  /** A proper name, the same in both languages. */
  readonly series?: string;
  /** Where a period starts, when the work spans more than its release year. */
  readonly startedAt?: string;
  /**
   * « Voir le site ». A demo proxied by nginx on this host is a root-relative
   * path, never an absolute URL — the demos move with the site (ADR-0005).
   */
  readonly websiteUrl?: string;
  /** « Voir la vidéo »: a YouTube address, opened on YouTube in a new tab. */
  readonly videoUrl?: string;
  /** « Voir sur Google Play ». */
  readonly googlePlayUrl?: string;
  /** The 4:3 card image. A client reference has none: it shows its logo. */
  readonly cover?: StaticImage;
  /** The wide visual the project page opens on: the product staged on white. */
  readonly presentation?: StaticImage;
  readonly presentationCaption?: LocalizedText;
  /** A client's logo, in place of the cover and the presentation visual. */
  readonly logo?: StaticLogo;
  /**
   * The brand colour (`#rrggbb`) tinting the logo plate's point field and
   * tone; absent for a black or ink logo, which keeps the ink.
   */
  readonly logoTint?: string;
  /**
   * A dark plate, for a logo whose light colours vanish on the sand. A trial
   * (Stéphane, 2026-11-15), front end only until he keeps it.
   */
  readonly logoPlate?: 'dark';
}

/**
 * A client's logo: an SVG or a transparent PNG in `public/logos/clients/`,
 * named after the project's French slug, shown in its own colours on a light
 * plate (Stéphane, 2026-11-15). Replacing the file swaps the logo with no code
 * change.
 */
export interface StaticLogo {
  readonly src: string;
  /** The file's intrinsic proportions (its viewBox or pixels): they set its optical size. */
  readonly width: number;
  readonly height: number;
  /**
   * A raster logo's WebP variants (`<name>-<width>.webp`, apps/api
   * `media:public`); an SVG has none.
   */
  readonly variants?: readonly number[];
  /** Names the logo on the project page; the card leaves it to the title beside it. */
  readonly alt: LocalizedText;
}

/** A rendered image with its intrinsic size, so nothing reflows once it loads. */
export interface StaticImage {
  /**
   * Object key inside the MinIO bucket, never a URL. The origin serving it
   * differs between development and production, so the base is injected
   * (MEDIA_BASE_URL) and joined at render time — see media-url.ts. One file
   * for both languages, named after the French slug.
   */
  readonly key: string;
  /**
   * Describes the picture for someone who cannot see it — never a repeat of the
   * title, which is already read out beside it. The 2022 alt text was the title
   * again, typos included.
   */
  readonly alt: LocalizedText;
  readonly width: number;
  readonly height: number;
  /**
   * The picture's mean colour (`#rrggbb`), painted on its frame while it
   * loads, so a wall of images arrives as a wall of their own tones rather
   * than of grey boxes. Measured on the originals (sharp channel means).
   */
  readonly averageColor?: string;
}

export interface StaticArtwork {
  /** Names the piece across both trees: the language switch goes through it. */
  readonly id: string;
  readonly slug: LocalizedSlug;
  readonly title: LocalizedText;
  readonly image: StaticImage;
  readonly software: readonly SoftwareSlug[];
  readonly releasedAt: string;
  readonly featured: boolean;
  /**
   * Where the mosaic crops around, each axis in [0, 1]; the centre when absent
   * (spec 03, ADR-0015). The viewer always shows the whole render.
   */
  readonly focal?: { readonly x: number; readonly y: number };
}
// Ordered by releasedAt descending, as spec 03 settles, work still going on
// first. No manual sort field: two sources of truth for order always drift.
// Only the years are sourced and shown (Stéphane, 2026-11-15); the months of
// the 2024 missions only keep them in the order he gave.
export const PROJECTS: readonly StaticProject[] = [
  {
    id: '0e047938-97a1-42f5-823f-5d57a605e56f',
    slug: { fr: 'immobilier-ch', en: 'immobilier-ch' },
    logo: {
      src: '/logos/clients/immobilier-ch.svg',
      width: 433.15,
      height: 61.2,
      alt: { fr: 'Logo d’immobilier.ch', en: 'immobilier.ch logo' },
    },
    logoTint: '#dc1622',
    title: { fr: 'immobilier.ch', en: 'immobilier.ch' },
    summary: {
      fr: 'Des outils de gestion des candidatures pour agences immobilières. Lead Tech Angular et .NET, j’encadre 5 à 8 développeurs, de la faisabilité à la production.',
      en: 'Applicant-management tools for real-estate agencies. As Angular and .NET Lead Tech, I lead five to eight developers, from feasibility to production.',
    },
    context: {
      fr: 'Des outils de gestion des candidatures pour les agences immobilières.',
      en: 'Applicant-management tools for real-estate agencies.',
    },
    mission: {
      fr: 'Je mène une équipe de 5 à 8 développeurs, de l’étude de faisabilité à la mise en production, CI/CD et instances AWS comprises.',
      en: 'I lead a team of five to eight developers from the feasibility study through to production, CI/CD and AWS instances included.',
    },
    missionSteps: [
      {
        fr: 'Encadrer une équipe de 5 à 8 développeurs, planifier et piloter le projet.',
        en: 'Leading a team of five to eight developers, planning and running the project.',
      },
      {
        fr: 'Étudier la faisabilité des besoins et accompagner le client.',
        en: 'Assessing the feasibility of each requirement and supporting the client.',
      },
      {
        fr: 'Développer le front et le back, le back structuré en clean architecture.',
        en: 'Developing the front end and the back end, the back end built on a clean architecture.',
      },
      {
        fr: 'Construire les écrans sur le design system.',
        en: 'Building the screens from the design system.',
      },
      {
        fr: 'Mettre en place le déploiement continu et gérer les instances AWS.',
        en: 'Setting up continuous deployment and managing the AWS instances.',
      },
      {
        fr: 'Maintenir et mettre en production, sur Azure et AWS.',
        en: 'Maintaining and releasing to production, on Azure and AWS.',
      },
    ],
    technologies: [
      'angular',
      'typescript',
      'dotnet',
      'claude-code',
      'python',
      'aws',
      'azure',
      'terraform',
      'ci-cd',
      'sonarqube',
    ],
    series: 'Web-Atrio',
    websiteUrl: 'https://www.immobilier.ch/',
    videoUrl: 'https://www.youtube.com/watch?v=5BKBQRbmZE8',
    startedAt: '2025-01-01',
    releasedAt: null,
    role: {
      fr: 'Lead Tech front & back — Angular / .NET',
      en: 'Front & back-end Lead Tech — Angular / .NET',
    },
  },
  {
    id: 'e9afb2f8-9b7b-48a4-b31c-972cfcc56bb2',
    slug: { fr: 'web-atrio', en: 'web-atrio' },
    logo: {
      src: '/logos/clients/web-atrio.svg',
      width: 72.731,
      height: 59.227,
      alt: { fr: 'Logo de Web-Atrio', en: 'Web-Atrio logo' },
    },
    logoTint: '#0051ff',
    logoPlate: 'dark',
    title: { fr: 'Web-Atrio', en: 'Web-Atrio' },
    summary: {
      fr: 'La refonte complète du site vitrine de Web-Atrio, en 2024. J’ai conçu le nouveau design puis je l’ai développé en React et TypeScript.',
      en: 'A complete redesign of the Web-Atrio company website, in 2024. I designed the new look, then developed it in React and TypeScript.',
    },
    context: {
      fr: 'La refonte complète du site de Web-Atrio, design et développement, en React.',
      en: 'A complete redesign of the Web-Atrio website, design and development, in React.',
    },
    missionSteps: [
      {
        fr: 'Concevoir le nouveau design.',
        en: 'Designing the new look.',
      },
      {
        fr: 'Le développer en React.',
        en: 'Building it in React.',
      },
    ],
    technologies: ['react', 'typescript', 'gitlab', 'jira', 'ci-cd'],
    series: 'Web-Atrio',
    websiteUrl: 'https://web-atrio.com/',
    releasedAt: '2024-12-01',
    role: {
      fr: 'Refonte du site vitrine, conçu et développé — React',
      en: 'Company website redesign, designed and built — React',
    },
  },
  {
    id: 'eff2a265-368b-49aa-a4dc-a5215723f46e',
    slug: { fr: 'cir-scancir', en: 'cir-scancir' },
    logo: {
      src: '/logos/clients/cir-scancir.png',
      width: 783,
      height: 414,
      variants: [240, 480],
      alt: { fr: 'Logo de CIR', en: 'CIR logo' },
    },
    logoTint: '#e3201b',
    title: { fr: 'CIR — Scancir', en: 'CIR — Scancir' },
    summary: {
      fr: 'Une application mobile de gestion des commandes en React Native. Je l’ai menée seul, du recueil du besoin à la publication sur l’App Store et Google Play.',
      en: 'A mobile order-management app in React Native. I ran it on my own, from gathering the requirements to release on the App Store and Google Play.',
    },
    context: {
      fr: 'Une application mobile de gestion des commandes pour une entreprise de roulements.',
      en: 'A mobile order-management app for a bearings company.',
    },
    mission: {
      fr: 'Je l’ai menée seul : recueil du besoin, maquettes jusqu’à leur validation, développement et ajustements, puis publication sur l’App Store et Google Play.',
      en: 'I ran it on my own: gathering the requirements, mockups through to sign-off, development and fine-tuning, then release on the App Store and Google Play.',
    },
    missionSteps: [
      {
        fr: 'Recueillir le besoin.',
        en: 'Gathering the requirements.',
      },
      {
        fr: 'Concevoir les maquettes sur Figma, jusqu’à leur validation.',
        en: 'Designing the mockups in Figma through to sign-off.',
      },
      {
        fr: 'Développer en React Native et ajuster.',
        en: 'Building in React Native and fine-tuning.',
      },
      {
        fr: 'Publier sur l’App Store et Google Play.',
        en: 'Releasing on the App Store and Google Play.',
      },
    ],
    technologies: [
      'react-native',
      'typescript',
      'figma',
      'redux',
      'android',
      'ios',
      'google-play-console',
      'testflight',
      'google-analytics',
    ],
    series: 'Web-Atrio',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.cir.scancir&hl=fr',
    releasedAt: '2024-09-01',
    role: { fr: 'Seul, de bout en bout — React Native', en: 'Solo, end to end — React Native' },
  },
  {
    id: 'e9ddf086-9f58-4bcf-b34a-cbf2d58b7ecf',
    slug: { fr: 'linxea', en: 'linxea' },
    logo: {
      src: '/logos/clients/linxea.svg',
      width: 1678.45,
      height: 366.17,
      alt: { fr: 'Logo de Linxea', en: 'Linxea logo' },
    },
    title: { fr: 'Linxea', en: 'Linxea' },
    summary: {
      fr: 'La refonte du parcours d’adhésion en ligne, en React et TypeScript. Référent technique de la squad Web-Atrio, j’ai aussi automatisé le déploiement en CI/CD.',
      en: 'I rebuilt the online sign-up journey in React and TypeScript. As the Web-Atrio squad’s technical go-to, I also automated deployment with CI/CD.',
    },
    context: {
      fr: 'La refonte du parcours d’adhésion en ligne, avec un déploiement automatique en CI/CD.',
      en: 'A redesign of the online sign-up journey, with automated CI/CD deployment.',
    },
    missionSteps: [
      {
        fr: 'Refondre le parcours d’adhésion en React.',
        en: 'Rebuilding the sign-up journey in React.',
      },
      {
        fr: 'Être le référent technique de la squad.',
        en: 'Acting as the squad’s technical go-to.',
      },
      {
        fr: 'Automatiser le déploiement en CI/CD.',
        en: 'Automating deployment with CI/CD.',
      },
    ],
    technologies: [
      'react',
      'tailwind',
      'typescript',
      'dotnet',
      'azure-devops',
      'jira',
      'ci-cd',
      'sonarqube',
      'unit-tests',
    ],
    series: 'Web-Atrio',
    websiteUrl: 'https://www.linxea.com/',
    videoUrl: 'https://www.youtube.com/watch?v=d7Em82mCUWY',
    startedAt: '2023-01-01',
    releasedAt: '2024-06-01',
    role: {
      fr: 'Référent technique de la squad — React',
      en: 'The squad’s technical go-to — React',
    },
  },
  {
    id: '67de9227-795d-466d-842e-557cc24a3d58',
    slug: { fr: 'ledger', en: 'ledger' },
    logo: {
      src: '/logos/clients/ledger.svg',
      width: 383,
      height: 128,
      alt: { fr: 'Logo de Ledger', en: 'Ledger logo' },
    },
    title: { fr: 'Ledger', en: 'Ledger' },
    summary: {
      fr: 'J’ai travaillé sur une application web grand public en Next.js et sur son intégration dans l’application mobile Ledger en React Native. Tests e2e automatisés.',
      en: 'I worked on a consumer web app in Next.js and on its integration into the Ledger mobile app in React Native, with automated end-to-end tests.',
    },
    context: {
      fr: 'L’application web d’un service grand public, en Next.js, et son intégration dans l’application mobile Ledger, en React Native.',
      en: 'The web app of a consumer service, in Next.js, and its integration into the Ledger mobile app, in React Native.',
    },
    missionSteps: [
      {
        fr: 'Développer l’application web en Next.js.',
        en: 'Building the web app in Next.js.',
      },
      {
        fr: 'L’intégrer à l’application mobile en React Native.',
        en: 'Integrating it into the mobile app in React Native.',
      },
      {
        fr: 'Construire les écrans sur le design system.',
        en: 'Building the screens from the design system.',
      },
      {
        fr: 'Automatiser les tests de bout en bout.',
        en: 'Automating end-to-end tests.',
      },
    ],
    // Only the open-source stack: the rest of the environment is not shown
    // (Stéphane, 2026-11-15).
    technologies: ['nextjs', 'react-native', 'typescript', 'jira', 'github'],
    series: 'Web-Atrio',
    websiteUrl: 'https://www.ledger.com/',
    videoUrl: 'https://www.youtube.com/watch?v=e6Ioxi1UBgI',
    startedAt: '2022-01-01',
    releasedAt: '2023-06-01',
    role: {
      fr: 'Développement web et mobile — Next.js, React Native',
      en: 'Web and mobile development — Next.js, React Native',
    },
  },
  {
    id: 'ecf5e664-665a-4f13-a302-6f508fe887ca',
    slug: { fr: 'case-tes-potes-mobile', en: 'case-tes-potes-mobile' },
    cover: {
      key: 'projects/case-tes-potes-mobile.jpg',
      averageColor: '#bcc0ca',
      alt: {
        fr: 'Écrans de l’application mobile Case Tes Potes',
        en: 'Screens of the Case Tes Potes mobile app',
      },
      width: 400,
      height: 300,
    },
    presentation: {
      key: 'projects/case-tes-potes-mobile-presentation.jpg',
      alt: {
        fr: 'Six écrans de l’application mobile alignés, du fil des profils au rendez-vous',
        en: 'Six screens of the mobile app side by side, from the profile feed to the date',
      },
      width: 1080,
      height: 384,
    },
    presentationCaption: {
      fr: 'Six écrans de l’application, du fil des profils à la création d’un rendez-vous.',
      en: 'Six screens of the app, from the profile feed to setting up a date.',
    },
    title: {
      fr: 'Case Tes Potes — application mobile',
      en: 'Case Tes Potes — mobile app',
    },
    summary: {
      fr: 'Une application de rencontre où ce sont les amis qui présentent. Co-fondateur, j’ai défini la stratégie technique et piloté une équipe de deux développeurs.',
      en: 'A dating app where your friends do the introducing. As co-founder, I set the technical strategy and led a team of two developers.',
    },
    context: {
      fr: 'Une application de rencontre où ce sont les amis qui présentent le célibataire. Le parcours accompagne les deux côtés, de la recherche de profils à l’organisation du premier rendez-vous.',
      en: 'A dating app where friends make the introductions for someone single. The journey guides both sides, from browsing profiles to arranging the first date.',
    },
    mission: {
      fr: 'Co-fondateur et lead developer. J’ai défini la stratégie technique, piloté une équipe de deux développeurs et mené la première version jusqu’au test marché.',
      en: 'Co-founder and lead developer. I set the technical strategy, led a team of two developers and took the first version through to market testing.',
    },
    missionSteps: [
      {
        fr: 'Analyse des besoins et rédaction des user stories.',
        en: 'Requirements analysis and writing the user stories.',
      },
      {
        fr: 'Roadmap produit : priorités de développement et jalons de livraison.',
        en: 'Product roadmap: development priorities and delivery milestones.',
      },
      {
        fr: 'Maquette interactive sous Adobe XD, pour valider le parcours avant d’écrire du code.',
        en: 'Interactive mockup in Adobe XD, to validate the journey before writing any code.',
      },
      {
        fr: 'Pilotage de l’équipe et arbitrage des choix techniques au fil du développement.',
        en: 'Leading the team and making the technical calls throughout development.',
      },
      {
        fr: 'Développement multiplateforme en Flutter, livré sur Android et iOS.',
        en: 'Cross-platform development in Flutter, shipped on Android and iOS.',
      },
      {
        fr: 'Une web app ouverte par lien d’invitation, pour que les proches complètent le profil sans installer l’application.',
        en: 'A web app opened from an invitation link, so friends can fill in the profile without installing the app.',
      },
    ],
    technologies: ['flutter', 'dart', 'xd', 'git', 'jira'],
    series: 'Case Tes Potes',
    startedAt: '2020-01-01',
    releasedAt: '2022-08-30',
    role: {
      fr: 'Associé, co-fondateur et Lead Developer Frontend',
      en: 'Partner, co-founder and lead front-end developer',
    },
  },
  {
    id: 'a695d06f-5a4c-4101-864d-acc071656954',
    slug: { fr: 'case-tes-potes-landing-page', en: 'case-tes-potes-landing-page' },
    cover: {
      key: 'projects/case-tes-potes-landing-page.jpg',
      averageColor: '#3f3862',
      alt: {
        fr: 'Landing page de préinscription de Case Tes Potes',
        en: 'Case Tes Potes pre-registration landing page',
      },
      width: 400,
      height: 329,
    },
    presentation: {
      key: 'projects/case-tes-potes-landing-page-presentation.jpg',
      alt: {
        fr: 'La landing page affichée sur un ordinateur, une tablette et un téléphone',
        en: 'The landing page shown on a computer, a tablet and a phone',
      },
      width: 1100,
      height: 434,
    },
    presentationCaption: {
      fr: 'La landing page sur ordinateur, tablette et mobile.',
      en: 'The landing page on desktop, tablet and mobile.',
    },
    title: { fr: 'Case Tes Potes — landing page', en: 'Case Tes Potes — landing page' },
    summary: {
      fr: 'La page d’entrée de la campagne de préinscription. Développée en React, adossée à une API Koa qui alimente la base de contacts et déclenche les envois.',
      en: 'The landing page for the pre-registration campaign. Built in React, backed by a Koa API that feeds the contact database and triggers the emails.',
    },
    context: {
      fr: 'La page d’entrée de la campagne de préinscription à la bêta fermée. Elle collecte les contacts, répond aux questions et sert de vitrine au projet.',
      en: 'The landing page for the closed-beta pre-registration campaign. It collects contacts, answers questions and showcases the project.',
    },
    mission: {
      fr: 'Conception et développement, de la maquette à la mise en production, API de collecte comprise.',
      en: 'Design and development, from mockup to production, including the API that collects sign-ups.',
    },
    missionSteps: [
      {
        fr: 'Cadrage des objectifs avec la stratégie marketing.',
        en: 'Defining the goals in line with the marketing strategy.',
      },
      { fr: 'Maquette Figma, UX et UI.', en: 'Figma mockup, UX and UI.' },
      { fr: 'Développement de la page en React.', en: 'Building the page in React.' },
      {
        fr: 'API Koa pour la gestion des contacts et l’intégration au service d’emailing.',
        en: 'A Koa API to manage contacts and connect to the email service.',
      },
      {
        fr: 'Tests unitaires et d’intégration avec Jest.',
        en: 'Unit and integration tests with Jest.',
      },
      { fr: 'Déploiement en image Docker.', en: 'Deployment as a Docker image.' },
    ],
    websiteUrl: '/demo/casetespotes-landingpage',
    technologies: ['react', 'typescript', 'sass', 'node', 'mongodb', 'docker'],
    series: 'Case Tes Potes',
    releasedAt: '2022-03-15',
    role: { fr: 'Conception et développement', en: 'Design and development' },
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
    id: '75643113-fe5b-4f36-9880-626c333087be',
    slug: { fr: 'legos-minions', en: 'lego-minions' },
    title: { fr: 'Lego : les Minions', en: 'Lego Minions' },
    image: {
      key: 'cgi/legos-minions.jpg',
      averageColor: '#33605d',
      alt: { fr: 'Les Minions reconstitués en Lego', en: 'The Minions rebuilt in Lego' },
      width: 1200,
      height: 675,
    },
    software: ['3dsmax', 'vray', 'photoshop', 'illustrator'],
    releasedAt: '2016-01-01',
    featured: true,
  },
  {
    id: '5b82d9e1-4b47-424f-8fd4-8aad287ca035',
    slug: { fr: 'extraterrestre', en: 'alien' },
    title: { fr: 'Extraterrestre', en: 'Alien' },
    image: {
      key: 'cgi/extraterrestre.jpg',
      averageColor: '#1f363c',
      alt: {
        fr: 'Extraterrestre de science-fiction photoréaliste',
        en: 'Photorealistic science-fiction alien',
      },
      width: 1200,
      height: 675,
    },
    software: ['3dsmax', 'vray', 'photoshop', 'substance-painter'],
    releasedAt: '2016-01-01',
    featured: true,
  },
  {
    id: '08b6fcaa-8a35-4693-a5f4-ea199e3a5a26',
    slug: { fr: 'escart-wild', en: 'escart-wild' },
    title: { fr: 'Escart Wild', en: 'Escart Wild' },
    image: {
      key: 'cgi/escart-wild.jpg',
      averageColor: '#807a3b',
      alt: { fr: 'Escargot cartoon photoréaliste', en: 'Photorealistic cartoon snail' },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray', 'zbrush', 'photoshop'],
    releasedAt: '2015-01-01',
    featured: true,
  },
  {
    id: 'a8610633-77bf-44c8-b9ca-19c7d8b66cb1',
    slug: { fr: 'beebop', en: 'beebop' },
    title: { fr: 'Beebop', en: 'Beebop' },
    image: {
      key: 'cgi/beebop.jpg',
      averageColor: '#858281',
      alt: {
        fr: 'Le robot Beebop, sculpté et texturé',
        en: 'The Beebop robot, sculpted and textured',
      },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'substance-painter', 'zbrush', 'photoshop'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    id: 'ab93edce-6a0f-4041-aac3-ea60a6360d97',
    slug: { fr: 'gorgotte', en: 'gorgotte' },
    title: { fr: 'Gorgotte', en: 'Gorgotte' },
    image: {
      key: 'cgi/gorgotte.jpg',
      averageColor: '#c5ccc6',
      alt: { fr: 'Créature monstrueuse sculptée en 3D', en: 'Monstrous creature sculpted in 3D' },
      width: 1280,
      height: 696,
    },
    software: ['3dsmax', 'zbrush', 'photoshop'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    id: '8837e715-56d3-435d-80c6-51bf5f4290ef',
    slug: { fr: 'immeuble', en: 'building' },
    title: { fr: 'Immeuble', en: 'Building' },
    image: {
      key: 'cgi/immeuble.jpg',
      averageColor: '#afbdbf',
      alt: {
        fr: 'Immeuble d’habitation photoréaliste',
        en: 'Photorealistic apartment building',
      },
      width: 1280,
      height: 1078,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    id: '52662d9b-8610-4f46-89b7-a27e4dda8a58',
    slug: { fr: 'salon-nuit', en: 'living-room-night' },
    title: {
      fr: 'Architecture d’intérieur — salon, nuit',
      en: 'Interior design — living room, night',
    },
    image: {
      key: 'cgi/salon-nuit.jpg',
      averageColor: '#605246',
      alt: { fr: 'Salon décoré, éclairage de nuit', en: 'Furnished living room, night lighting' },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    id: 'c0e82274-3d0d-4476-bf24-db9da81238e6',
    slug: { fr: 'chambre', en: 'bedroom' },
    title: { fr: 'Architecture d’intérieur — chambre', en: 'Interior design — bedroom' },
    image: {
      key: 'cgi/chambre.jpg',
      averageColor: '#676468',
      alt: { fr: 'Chambre décorée, lumière du jour', en: 'Furnished bedroom, daylight' },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    id: '1170fa47-b865-4c0f-8c1e-2862ee38ba86',
    slug: { fr: 'salon-jour', en: 'living-room-day' },
    title: {
      fr: 'Architecture d’intérieur — salon, jour',
      en: 'Interior design — living room, day',
    },
    image: {
      key: 'cgi/salon-jour.jpg',
      averageColor: '#746c6a',
      alt: { fr: 'Salon décoré, lumière du jour', en: 'Furnished living room, daylight' },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2015-01-01',
    featured: false,
  },
  {
    id: '786bad49-4437-4c58-807c-26109c56427a',
    slug: { fr: 'caricature', en: 'caricature' },
    title: { fr: 'Caricature', en: 'Caricature' },
    image: {
      key: 'cgi/caricature.jpg',
      averageColor: '#a1a6ad',
      alt: { fr: 'Autoportrait en caricature 3D', en: 'Self-portrait as a 3D caricature' },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray', 'zbrush', 'photoshop'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    id: '18455d4c-bcc3-42b8-af01-c392d96ebdb9',
    slug: { fr: 'maison-moderne', en: 'modern-house' },
    title: { fr: 'Maison moderne', en: 'Modern house' },
    image: {
      key: 'cgi/maison-moderne.jpg',
      averageColor: '#4e4d3c',
      alt: {
        fr: 'Maison moderne photoréaliste, vue extérieure',
        en: 'Photorealistic modern house, exterior view',
      },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2014-01-01',
    featured: true,
  },
  {
    id: '97f2580a-358c-497d-8a51-dcc5126cb72c',
    slug: { fr: 'entree', en: 'entrance-hall' },
    title: { fr: 'Architecture d’intérieur — entrée', en: 'Interior design — entrance hall' },
    image: {
      key: 'cgi/entree.jpg',
      averageColor: '#ada39a',
      alt: { fr: 'Entrée d’habitation aux murs blancs', en: 'White-walled entrance hall' },
      width: 1280,
      height: 864,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    id: '255bafe2-8f05-4993-9195-6c160a110153',
    slug: { fr: 'exterieur', en: 'exterior' },
    title: { fr: 'Extérieur', en: 'Exterior' },
    image: {
      key: 'cgi/exterieur.jpg',
      averageColor: '#5b6e3e',
      alt: { fr: 'Extérieur avec herbe photoréaliste', en: 'Exterior with photorealistic grass' },
      width: 1200,
      height: 848,
    },
    software: ['3dsmax', 'vray', 'photoshop'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    id: 'cf2c7ce5-6335-4db8-9b72-103f7094a070',
    slug: { fr: 'ampoule', en: 'light-bulb' },
    title: { fr: 'Ampoule', en: 'Light bulb' },
    image: {
      key: 'cgi/ampoule.jpg',
      averageColor: '#d2d2d2',
      alt: {
        fr: 'Ampoule photoréaliste sur fond neutre',
        en: 'Photorealistic light bulb on a neutral background',
      },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    id: '1f978759-45d4-47ea-9d09-70d4e2630f15',
    slug: { fr: 'support-marketing', en: 'marketing-visual' },
    title: { fr: 'Support marketing', en: 'Marketing visual' },
    image: {
      key: 'cgi/support-marketing.jpg',
      averageColor: '#191817',
      alt: {
        fr: 'Canette Pixmodels, visuel publicitaire',
        en: 'Pixmodels drinks can, advertising visual',
      },
      width: 1280,
      height: 720,
    },
    software: ['3dsmax', 'vray', 'photoshop'],
    releasedAt: '2014-01-01',
    featured: false,
  },
  {
    id: 'd1cbb7b8-b138-48b3-81f1-97922b99fa4d',
    slug: { fr: 'tomates', en: 'tomatoes' },
    title: { fr: 'Tomates', en: 'Tomatoes' },
    image: {
      key: 'cgi/tomates.jpg',
      averageColor: '#cfbfc0',
      alt: { fr: 'Tomates photoréalistes', en: 'Photorealistic tomatoes' },
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
