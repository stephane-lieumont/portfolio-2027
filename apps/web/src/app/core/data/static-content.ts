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
  | 'id'
  | 'slug'
  | 'title'
  | 'summary'
  | 'context'
  | 'role'
  | 'mission'
  | 'presentationCaption'
  | 'releasedAt'
> {
  /**
   * Plain sentences, never markup. The 2022 data wrapped tool names in
   * `<strong>`, which would have to be either rendered as HTML or escaped and
   * shown raw.
   */
  readonly missionSteps: readonly LocalizedText[];
  readonly technologies: readonly TechnologySlug[];
  /** A proper name, the same in both languages. */
  readonly series?: string;
  /**
   * « Voir le site ». A demo proxied by nginx on this host is a root-relative
   * path, never an absolute URL — the demos move with the site (ADR-0005).
   */
  readonly websiteUrl?: string;
  /** « Voir la vidéo »: a YouTube address, embedded after a click (ADR-0016). */
  readonly videoUrl?: string;
  /** The 4:3 card image. */
  readonly cover: StaticImage;
  /** The wide visual the project page opens on: the product staged on white. */
  readonly presentation: StaticImage;
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

// Ordered by releasedAt descending, as spec 03 settles. No manual sort field:
// two sources of truth for order always drift.
export const PROJECTS: readonly StaticProject[] = [
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
      fr: 'Une application de rencontre où ce sont les amis qui présentent. J’ai défini la stratégie technique, écrit les user stories et la roadmap, et mené le développement avec deux développeurs.',
      en: 'A dating app where friends do the introducing. I set the technical strategy, wrote the user stories and the roadmap, and led development with two developers.',
    },
    context: {
      fr: 'Une application de rencontre où ce sont les amis qui présentent le célibataire. Le parcours accompagne les deux côtés, de la recherche de profils à l’organisation du premier rendez-vous.',
      en: 'A dating app where friends introduce the single person. The journey supports both sides, from browsing profiles to arranging the first date.',
    },
    mission: {
      fr: 'Co-fondateur et lead developer. J’ai défini la stratégie technique, piloté une équipe de deux développeurs et mené la première version jusqu’au test marché.',
      en: 'Co-founder and lead developer. I set the technical strategy, led a team of two developers and took the first version through to market testing.',
    },
    missionSteps: [
      {
        fr: 'Analyse des besoins et rédaction des user stories.',
        en: 'Needs analysis and user stories.',
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
    ],
    technologies: ['flutter', 'dart', 'xd', 'git', 'jira'],
    series: 'Case Tes Potes',
    releasedAt: '2022-08-30',
    role: { fr: 'Co-fondateur et lead developer', en: 'Co-founder and lead developer' },
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
      en: 'The entry page of the pre-registration campaign. Built in React, backed by a Koa API that feeds the contact database and triggers the mailings.',
    },
    context: {
      fr: 'La page d’entrée de la campagne de préinscription à la bêta fermée. Elle collecte les contacts, répond aux questions et sert de vitrine au projet.',
      en: 'The entry page of the pre-registration campaign for the closed beta. It collects contacts, answers questions and showcases the project.',
    },
    mission: {
      fr: 'Conception et développement, de la maquette à la mise en production, API de collecte comprise.',
      en: 'Design and development, from mockup to production, the collection API included.',
    },
    missionSteps: [
      {
        fr: 'Cadrage des objectifs avec la stratégie marketing.',
        en: 'Setting the goals with the marketing strategy.',
      },
      { fr: 'Maquette Figma, UX et UI.', en: 'Figma mockup, UX and UI.' },
      { fr: 'Développement de la page en React.', en: 'Building the page in React.' },
      {
        fr: 'API Koa pour la gestion des contacts et l’intégration au service d’emailing.',
        en: 'Koa API to manage contacts and connect the emailing service.',
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
  {
    id: '12274607-8f2f-4fee-b1d9-5400c230e306',
    slug: { fr: 'case-tes-potes-web-app', en: 'case-tes-potes-web-app' },
    cover: {
      key: 'projects/case-tes-potes-web-app.jpg',
      averageColor: '#f3ecec',
      alt: {
        fr: 'Formulaire de témoignage de la web app Case Tes Potes',
        en: 'Testimonial form of the Case Tes Potes web app',
      },
      width: 400,
      height: 300,
    },
    presentation: {
      key: 'projects/case-tes-potes-web-app-presentation.jpg',
      alt: {
        fr: 'Écrans successifs du parcours de témoignage de la web app',
        en: 'Successive screens of the web app’s testimonial journey',
      },
      width: 1100,
      height: 434,
    },
    presentationCaption: {
      fr: 'Le parcours de témoignage, de l’invitation à l’envoi.',
      en: 'The testimonial journey, from the invitation to sending.',
    },
    title: { fr: 'Case Tes Potes — web app', en: 'Case Tes Potes — web app' },
    summary: {
      fr: 'Une application accessible par lien d’invitation, pour que les proches d’un célibataire complètent son profil sans installer l’application mobile.',
      en: 'An app opened from an invitation link, so that a single person’s friends and family can fill in their profile without installing the mobile app.',
    },
    context: {
      fr: 'Le profil d’un célibataire se nourrit des témoignages de ses proches. Cette application, ouverte par lien d’invitation, leur permet de les écrire sans installer l’application mobile.',
      en: 'A single person’s profile is built from what their friends and family say about them. This app, opened from an invitation link, lets them write it without installing the mobile app.',
    },
    mission: {
      fr: 'Conception et développement d’une application autonome branchée sur l’API du produit mobile.',
      en: 'Design and development of a standalone app connected to the mobile product’s API.',
    },
    missionSteps: [
      {
        fr: 'Maquette Adobe XD, cohérente avec l’application mobile.',
        en: 'Adobe XD mockup, consistent with the mobile app.',
      },
      {
        fr: 'Développement avec Webpack, sans framework.',
        en: 'Development with Webpack, no framework.',
      },
      {
        fr: 'Validation des invitations et authentification avant rédaction.',
        en: 'Invitation checks and authentication before writing.',
      },
      {
        fr: 'Branchement direct sur l’API de l’application mobile.',
        en: 'Direct connection to the mobile app’s API.',
      },
    ],
    websiteUrl: '/demo/casetespotes-webapp',
    technologies: ['webpack', 'javascript', 'sass', 'node'],
    series: 'Case Tes Potes',
    releasedAt: '2021-11-10',
    role: { fr: 'Conception et développement', en: 'Design and development' },
  },
  {
    id: '170e8b9e-b686-4f5b-910c-8aaddf683eb5',
    slug: { fr: 'kasa-openclassrooms', en: 'kasa-openclassrooms' },
    cover: {
      key: 'projects/kasa-openclassrooms.jpg',
      averageColor: '#bab5b4',
      alt: {
        fr: 'Page d’accueil de la plateforme de location Kasa',
        en: 'Home page of the Kasa rental platform',
      },
      width: 500,
      height: 375,
    },
    presentation: {
      key: 'projects/kasa-openclassrooms-presentation.jpg',
      alt: {
        fr: 'Pages de Kasa en perspective : accueil, fiche logement, version mobile',
        en: 'Kasa pages in perspective: home, listing page, mobile version',
      },
      width: 1100,
      height: 434,
    },
    presentationCaption: {
      fr: 'Kasa sur ordinateur, tablette et mobile.',
      en: 'Kasa on desktop, tablet and mobile.',
    },
    title: { fr: 'Kasa — OpenClassrooms', en: 'Kasa — OpenClassrooms' },
    summary: {
      fr: 'Une plateforme de location entre particuliers, réalisée dans le cadre de ma formation. L’occasion de poser proprement une architecture React et un typage strict.',
      en: 'A peer-to-peer rental platform, built as part of my training. A chance to set up a clean React architecture and strict typing.',
    },
    context: {
      fr: 'Une plateforme de location entre particuliers, sujet d’un projet de formation OpenClassrooms : intégrer fidèlement une maquette Figma sur une stack JavaScript moderne.',
      en: 'A peer-to-peer rental platform, the subject of an OpenClassrooms training project: building a Figma mockup faithfully on a modern JavaScript stack.',
    },
    mission: {
      fr: 'Développement de l’application. Ma première expérience React, et l’occasion de poser proprement le routage et un typage strict.',
      en: 'Development of the application. My first experience of React, and a chance to set up routing and strict typing properly.',
    },
    missionSteps: [
      {
        fr: 'Développement en React, au plus près de la maquette Figma.',
        en: 'Development in React, as close to the Figma mockup as possible.',
      },
      {
        fr: 'Routage applicatif avec React Router.',
        en: 'Application routing with React Router.',
      },
      {
        fr: 'Passage à TypeScript et typage strict des composants.',
        en: 'Move to TypeScript and strict typing of the components.',
      },
    ],
    websiteUrl: '/demo/openclassrooms-kasa',
    technologies: ['react', 'typescript', 'sass', 'node'],
    releasedAt: '2021-06-01',
    role: { fr: 'Développement', en: 'Development' },
  },
  {
    id: 'd60d32b5-665c-482e-a849-d27bec13c4d7',
    slug: { fr: 'portfolio-3d-2018', en: '3d-portfolio-2018' },
    cover: {
      key: 'projects/portfolio-3d-2018.jpg',
      averageColor: '#312d18',
      alt: {
        fr: 'Page d’accueil du portfolio 3D de 2018',
        en: 'Home page of the 2018 3D portfolio',
      },
      width: 400,
      height: 300,
    },
    presentation: {
      key: 'projects/portfolio-3d-2018-presentation.jpg',
      alt: {
        fr: 'Pages du portfolio 2018 en perspective, sur fond sombre',
        en: 'Pages of the 2018 portfolio in perspective, on a dark background',
      },
      width: 1100,
      height: 434,
    },
    presentationCaption: {
      fr: 'Le portfolio sur ordinateur, tablette et mobile.',
      en: 'The portfolio on desktop, tablet and mobile.',
    },
    title: { fr: 'Portfolio 3D', en: '3D portfolio' },
    summary: {
      fr: 'Ma première vitrine, écrite sans framework. Elle m’a appris ce que coûte une animation mal pensée bien avant que je sache le nommer.',
      en: 'My first showcase, written without a framework. It taught me what a badly thought-out animation costs long before I could name it.',
    },
    context: {
      fr: 'Ma première vitrine en ligne, écrite sans framework, pour montrer mes créations 3D à une époque où c’était mon métier à plein temps.',
      en: 'My first online showcase, written without a framework, to show my 3D work at a time when it was my full-time job.',
    },
    mission: {
      fr: 'Conception et développement, seul, en JavaScript natif.',
      en: 'Design and development, on my own, in plain JavaScript.',
    },
    missionSteps: [
      { fr: 'Mise en ligne de mes réalisations 3D.', en: 'Putting my 3D work online.' },
      {
        fr: 'Développement sans framework, en JavaScript natif.',
        en: 'Development without a framework, in plain JavaScript.',
      },
      {
        fr: 'Première confrontation au coût réel d’une animation mal pensée.',
        en: 'A first encounter with the real cost of a badly thought-out animation.',
      },
    ],
    websiteUrl: '/demo/portfolio2018',
    technologies: ['javascript'],
    releasedAt: '2018-04-01',
    role: { fr: 'Conception et développement', en: 'Design and development' },
  },
  {
    id: 'de341e7b-2125-41f3-8627-89a291847102',
    slug: { fr: 'pixmodels', en: 'pixmodels' },
    cover: {
      key: 'projects/pixmodels.jpg',
      averageColor: '#4e4f36',
      alt: { fr: 'Site vitrine de Pixmodels', en: 'The Pixmodels showcase website' },
      width: 400,
      height: 300,
    },
    presentation: {
      key: 'projects/pixmodels-presentation.jpg',
      alt: {
        fr: 'Pages du site Pixmodels en perspective, bandeaux corail et gris',
        en: 'Pages of the Pixmodels website in perspective, coral and grey banners',
      },
      width: 1100,
      height: 434,
    },
    presentationCaption: {
      fr: 'Le site vitrine sur ordinateur, tablette et mobile.',
      en: 'The showcase website on desktop, tablet and mobile.',
    },
    title: { fr: 'Pixmodels', en: 'Pixmodels' },
    summary: {
      fr: 'Un service de communication audiovisuelle : site vitrine et outils de gestion, à une époque où je faisais encore de la 3D à plein temps.',
      en: 'An audiovisual communication service: showcase website and management tools, at a time when I was still doing 3D full time.',
    },
    context: {
      fr: 'En 2015 je crée mon entreprise de communication audiovisuelle. Il fallait une présence en ligne à la hauteur : sur ce marché, l’image de marque est l’argument.',
      en: 'In 2015 I started my audiovisual communication business. It needed an online presence to match: in that market, the brand image is the selling point.',
    },
    mission: {
      fr: 'Conception et développement du site vitrine et des outils de gestion associés.',
      en: 'Design and development of the showcase website and its management tools.',
    },
    missionSteps: [
      { fr: 'Étude du marché et des besoins.', en: 'Market and needs research.' },
      { fr: 'Identité visuelle et maquettes.', en: 'Visual identity and mockups.' },
      {
        fr: 'Développement du site vitrine et du formulaire de contact.',
        en: 'Building the showcase website and its contact form.',
      },
      {
        fr: 'Outils de gestion pour le suivi des prestations.',
        en: 'Management tools to track the services delivered.',
      },
    ],
    websiteUrl: '/demo/pixmodels',
    technologies: ['javascript', 'php'],
    releasedAt: '2015-09-01',
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
    title: { fr: 'Légos : les Minions', en: 'Lego: the Minions' },
    image: {
      key: 'cgi/legos-minions.jpg',
      averageColor: '#33605d',
      alt: { fr: 'Les Minions reconstitués en Légos', en: 'The Minions rebuilt in Lego' },
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
      alt: { fr: 'Créature monstrueuse sculptée en 3D', en: 'A monstrous creature sculpted in 3D' },
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
      alt: { fr: 'Caricature 3D de Stéphane Lieumont', en: '3D caricature of Stéphane Lieumont' },
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
      alt: { fr: 'Entrée d’habitation aux murs blancs', en: 'A white-walled entrance hall' },
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
        en: 'Pixmodels can, advertising visual',
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
