import type {
  ContactPage,
  LocalizedText,
  SiteSettings,
  WorldKey,
  WorldPage,
  WorldStack,
} from '@portfolio/shared-types';

/**
 * Editorial content of the two worlds and the contact page, held in the app
 * until the back office exists. Shaped exactly like the shared-types schemas so
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
      lead: { fr: 'Lead Tech, Angular et .NET.', en: 'Lead Tech, Angular and .NET.' },
      text: {
        fr: 'Une rigueur d’ingénieur, un œil de graphiste 3D.',
        en: 'An engineer’s rigour, a 3D artist’s eye.',
      },
    },
    scrub: {
      fr: 'J’arbitre les choix techniques, j’encadre et je challenge les équipes. Le code, je continue à l’écrire.',
      en: 'I make the technical calls, I mentor and challenge the teams. And I still write the code.',
    },
    facts: [
      {
        label: { fr: 'Rôle', en: 'Role' },
        value: {
          fr: 'Lead Tech, référent technique',
          en: 'Lead Tech, technical point of reference',
        },
      },
      {
        label: { fr: 'Stack', en: 'Stack' },
        value: {
          fr: 'Angular, TypeScript, RxJS/Signals, .NET/C#',
          en: 'Angular, TypeScript, RxJS/Signals, .NET/C#',
        },
      },
      {
        label: { fr: 'Aussi', en: 'Also' },
        value: { fr: 'React, Docker, CI/CD, Git', en: 'React, Docker, CI/CD, Git' },
      },
      {
        label: { fr: 'Avant', en: 'Before' },
        value: { fr: 'Quatorze ans dans l’aéronautique', en: 'Fourteen years in aeronautics' },
      },
    ],
    updatedAt: UPDATED_AT,
  },
  cgi: {
    world: 'cgi',
    roleWord: { fr: 'GRAPHISTE 3D', en: '3D ARTIST' },
    eyebrowTools: ['3dsmax', 'vray', 'zbrush'],
    lede: {
      lead: { fr: 'Une pratique apprise seule.', en: 'A self-taught practice.' },
      text: {
        fr: 'Sans école et sans commande, bien avant le développement.',
        en: 'No school and no commission, long before software development.',
      },
    },
    scrub: {
      fr: 'C’est en 3D que j’ai appris à apprendre seul, et à regarder une image jusqu’à voir ce qui ne va pas.',
      en: '3D is where I learned to teach myself, and to look at an image until I see what is wrong with it.',
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
      { label: { fr: 'Période', en: 'Period' }, value: { fr: '2014 – 2016', en: '2014 – 2016' } },
    ],
    updatedAt: UPDATED_AT,
  },
};

/**
 * Each point states what Stéphane does with the tool, kept generic (his brief,
 * 2026-11-15): no claim about this repository, a client, a figure or a date.
 */
export const WORLD_STACKS: Readonly<Record<WorldKey, WorldStack>> = {
  dev: {
    world: 'dev',
    entries: [
      {
        tool: 'angular',
        points: [
          {
            lead: { fr: 'Standalone, zoneless, signals.', en: 'Standalone, zoneless, signals.' },
            text: {
              fr: 'Des applications Angular modernes, sans NgModule ni zone.js, où l’état vit dans des signals et le dérivé dans des computed.',
              en: 'Modern Angular applications with no NgModule and no zone.js, state held in signals and derived state in computed.',
            },
          },
          {
            lead: { fr: 'Un rendu sous contrôle.', en: 'Rendering under control.' },
            text: {
              fr: 'OnPush, @for avec track, @defer : un rendu qui ne travaille que lorsqu’il le faut, et ne charge que ce qui s’affiche.',
              en: 'OnPush, @for with track, @defer: rendering that only works when it has to, and loads only what is on screen.',
            },
          },
          {
            lead: { fr: 'Une architecture qui se lit.', en: 'An architecture you can read.' },
            text: {
              fr: 'Des couches et des composants clairs dès la première lecture, qui restent maintenables quand le périmètre grandit.',
              en: 'Layers and components that are clear on first reading, and stay maintainable as the scope grows.',
            },
          },
          {
            lead: { fr: 'La qualité outillée.', en: 'Quality, built in.' },
            text: {
              fr: 'Tests unitaires, lint et couverture en intégration continue, accessibilité pensée dès le composant.',
              en: 'Unit tests, linting and coverage in continuous integration, accessibility designed in from the component up.',
            },
          },
        ],
      },
      {
        tool: 'typescript',
        points: [
          {
            lead: { fr: 'Strict, sans any.', en: 'Strict, no any.' },
            text: {
              fr: 'Un typage strict qui arrête les erreurs à la compilation, et un as qui fait taire le compilateur traité comme un bug différé.',
              en: 'Strict typing that stops errors at compile time, and an as that silences the compiler treated as a deferred bug.',
            },
          },
          {
            lead: { fr: 'Le domaine typé.', en: 'A typed domain.' },
            text: {
              fr: 'Des types métier explicites, partagés entre le front et l’API plutôt que redéclarés de chaque côté.',
              en: 'Explicit domain types, shared between the front end and the API rather than redeclared on each side.',
            },
          },
          {
            lead: { fr: 'Validé à la frontière.', en: 'Validated at the boundary.' },
            text: {
              fr: 'Formulaires, réponses d’API : ce qui vient de l’extérieur passe par un schéma avant d’être typé.',
              en: 'Forms, API responses: whatever comes from outside is checked against a schema before it is typed.',
            },
          },
          {
            lead: { fr: 'Du navigateur au serveur.', en: 'From browser to server.' },
            text: {
              fr: 'Le même langage côté client et côté Node, pour un code cohérent de bout en bout.',
              en: 'The same language in the browser and on Node, for code that holds together end to end.',
            },
          },
        ],
      },
      {
        tool: 'rxjs',
        points: [
          {
            lead: { fr: 'Signals pour l’état.', en: 'Signals for state.' },
            text: {
              fr: 'L’état local et dérivé en signals et computed, lisible sans souscription.',
              en: 'Local and derived state in signals and computed, readable without a subscription.',
            },
          },
          {
            lead: { fr: 'RxJS pour les flux.', en: 'RxJS for streams.' },
            text: {
              fr: 'Requêtes, annulation, debounce : ce qui est réellement asynchrone reste un observable.',
              en: 'Requests, cancellation, debounce: what is truly asynchronous stays an observable.',
            },
          },
          {
            lead: { fr: 'Les deux modèles réunis.', en: 'Both models, together.' },
            text: {
              fr: 'toSignal, toObservable : passer de l’un à l’autre sans fuite ni double source de vérité.',
              en: 'toSignal, toObservable: moving between the two with no leak and no second source of truth.',
            },
          },
          {
            lead: { fr: 'Les opérateurs qui comptent.', en: 'The operators that matter.' },
            text: {
              fr: 'switchMap, combineLatest, takeUntilDestroyed : composer des flux et les fermer proprement.',
              en: 'switchMap, combineLatest, takeUntilDestroyed: composing streams and closing them cleanly.',
            },
          },
        ],
      },
      {
        tool: 'dotnet',
        points: [
          {
            lead: { fr: 'Référent technique.', en: 'Technical point of reference.' },
            text: {
              fr: 'J’accompagne des développeurs backend .NET et j’arbitre les choix qui touchent le front comme le back.',
              en: 'I support .NET backend developers and make the calls that affect both front and back end.',
            },
          },
          {
            lead: { fr: 'Des contrats d’API clairs.', en: 'Clear API contracts.' },
            text: {
              fr: 'Endpoints, DTO, codes d’erreur : la frontière front / back se conçoit à deux, avant le code.',
              en: 'Endpoints, DTOs, error codes: the front / back boundary is designed together, before the code.',
            },
          },
          {
            lead: { fr: 'La revue de code.', en: 'Code review.' },
            text: {
              fr: 'Lire et challenger du C#, expliquer un choix, faire monter une équipe.',
              en: 'Reading and challenging C#, explaining a choice, helping a team grow.',
            },
          },
          {
            lead: { fr: 'Une vision de bout en bout.', en: 'An end-to-end view.' },
            text: {
              fr: 'De la base de données au composant, savoir ce que chaque couche coûte à l’autre.',
              en: 'From the database to the component, knowing what each layer costs the next.',
            },
          },
        ],
      },
      {
        tool: 'react',
        points: [
          {
            lead: { fr: 'Composants et hooks.', en: 'Components and hooks.' },
            text: {
              fr: 'Des interfaces React en TypeScript, l’état et les effets portés par des hooks.',
              en: 'React interfaces in TypeScript, state and effects carried by hooks.',
            },
          },
          {
            lead: { fr: 'De la maquette à la mise en ligne.', en: 'From mockup to launch.' },
            text: {
              fr: 'Une interface React branchée sur une API Node, conçue, développée et livrée.',
              en: 'A React front end wired to a Node API, designed, built and shipped.',
            },
          },
          {
            lead: { fr: 'Les mêmes principes.', en: 'The same principles.' },
            text: {
              fr: 'Composants simples, état explicite, typage strict, quel que soit le framework.',
              en: 'Simple components, explicit state, strict typing, whatever the framework.',
            },
          },
          {
            lead: { fr: 'Toujours opérationnel.', en: 'Still hands-on.' },
            text: {
              fr: 'Angular au quotidien, React quand le projet le demande.',
              en: 'Angular day to day, React when the project calls for it.',
            },
          },
        ],
      },
      {
        tool: 'docker',
        points: [
          {
            lead: { fr: 'Un environnement reproductible.', en: 'A reproducible environment.' },
            text: {
              fr: 'Une application et ses services conteneurisés, qui démarrent de la même façon sur chaque poste.',
              en: 'An application and its services in containers, starting the same way on every machine.',
            },
          },
          {
            lead: { fr: 'Docker Compose.', en: 'Docker Compose.' },
            text: {
              fr: 'API, base de données, stockage : une stack locale décrite dans un fichier et lancée en une commande.',
              en: 'API, database, storage: a local stack described in one file and started with one command.',
            },
          },
          {
            lead: { fr: 'Du poste au serveur.', en: 'From laptop to server.' },
            text: {
              fr: 'La même image du développement à la production, la configuration passée par l’environnement.',
              en: 'The same image from development to production, configuration passed in through the environment.',
            },
          },
          {
            lead: { fr: 'Le réseau maîtrisé.', en: 'The network under control.' },
            text: {
              fr: 'Un reverse proxy nginx en frontal, les services isolés derrière.',
              en: 'An nginx reverse proxy in front, the services isolated behind it.',
            },
          },
        ],
      },
      {
        tool: 'git',
        points: [
          {
            lead: { fr: 'Conventional Commits.', en: 'Conventional Commits.' },
            text: {
              fr: 'Un historique qui se lit comme un journal : une intention par commit.',
              en: 'A history that reads like a log: one intent per commit.',
            },
          },
          {
            lead: {
              fr: 'Tout passe par une pull request.',
              en: 'Everything goes through a pull request.',
            },
            text: {
              fr: 'Branche courte, revue, puis fusion : rien n’arrive sur la branche principale sans relecture.',
              en: 'Short-lived branch, review, then merge: nothing reaches the main branch unreviewed.',
            },
          },
          {
            lead: { fr: 'Une CI qui fait foi.', en: 'CI as the authority.' },
            text: {
              fr: 'Typecheck, lint, tests et couverture : la fusion attend que tout soit vert.',
              en: 'Typecheck, lint, tests and coverage: the merge waits until everything is green.',
            },
          },
          {
            lead: { fr: 'Un historique qu’on remonte.', en: 'A history you can trace.' },
            text: {
              fr: 'Rebase, cherry-pick, conflits résolus : retrouver quand et pourquoi une ligne a changé.',
              en: 'Rebase, cherry-pick, conflicts resolved: finding when and why a line changed.',
            },
          },
        ],
      },
      {
        tool: 'aws',
        points: [
          {
            lead: { fr: 'EC2.', en: 'EC2.' },
            text: {
              fr: 'J’administre les instances : mise en service, configuration et maintenance des serveurs.',
              en: 'I administer the instances: provisioning, configuring and maintaining the servers.',
            },
          },
          {
            lead: { fr: 'Secrets Manager.', en: 'Secrets Manager.' },
            text: {
              fr: 'Les clés et identifiants restent hors du code et hors du dépôt, servis à l’exécution.',
              en: 'Keys and credentials stay out of the code and out of the repository, served at runtime.',
            },
          },
          {
            lead: { fr: 'S3.', en: 'S3.' },
            text: {
              fr: 'Des buckets pour les médias et les livrables, avec des droits stricts : lisibles quand il le faut, jamais inscriptibles publiquement.',
              en: 'Buckets for media and deliverables, with strict permissions: readable when they need to be, never publicly writable.',
            },
          },
          {
            lead: { fr: 'Des déploiements automatisés.', en: 'Automated deployments.' },
            text: {
              fr: 'Des pipelines Azure DevOps qui construisent et livrent sur l’infrastructure AWS.',
              en: 'Azure DevOps pipelines that build and deliver to the AWS infrastructure.',
            },
          },
        ],
      },
      {
        tool: 'claude-code',
        points: [
          {
            lead: { fr: 'Orchestrer, pas déléguer.', en: 'Orchestrating, not delegating.' },
            text: {
              fr: 'Des agents spécialisés que je mets en contradiction plutôt qu’en accord.',
              en: 'Specialised agents I set against each other rather than in agreement.',
            },
          },
          {
            lead: { fr: 'Un contexte versionné.', en: 'Versioned context.' },
            text: {
              fr: 'Consignes, skills et mémoire dans le dépôt : le contexte ne se perd pas d’une session à l’autre.',
              en: 'Instructions, skills and memory in the repository: context carries over from one session to the next.',
            },
          },
          {
            lead: { fr: 'Vérifier, pas croire.', en: 'Verifying, not trusting.' },
            text: {
              fr: 'Ce que l’agent produit est testé ou mesuré avant d’être accepté.',
              en: 'What the agent produces is tested or measured before it is accepted.',
            },
          },
          {
            lead: { fr: 'Le dernier mot reste humain.', en: 'The last word stays human.' },
            text: {
              fr: 'Chaque affirmation se rattache à une source, et c’est moi qui tranche.',
              en: 'Every claim traces back to a source, and I make the call.',
            },
          },
        ],
      },
    ],
    updatedAt: UPDATED_AT,
  },
  cgi: {
    world: 'cgi',
    entries: [
      {
        tool: '3dsmax',
        points: [
          {
            lead: { fr: 'La modélisation polygonale.', en: 'Polygon modelling.' },
            text: {
              fr: 'Une scène construite de zéro : volumes, détails, puis mise en place pour le rendu.',
              en: 'A scene built from nothing: volumes, detail, then set up for rendering.',
            },
          },
          {
            lead: { fr: 'L’architecture.', en: 'Architecture.' },
            text: {
              fr: 'Bâtiments et extérieurs modélisés aux bonnes proportions, prêts à être éclairés.',
              en: 'Buildings and exteriors modelled to the right proportions, ready to be lit.',
            },
          },
          {
            lead: { fr: 'L’intérieur.', en: 'Interiors.' },
            text: {
              fr: 'Des pièces meublées et mises en scène, du mobilier jusqu’aux accessoires.',
              en: 'Rooms furnished and staged, from the furniture down to the props.',
            },
          },
          {
            lead: { fr: 'L’objet et le produit.', en: 'Objects and products.' },
            text: {
              fr: 'Des objets du quotidien modélisés avec précision, jusqu’au visuel publicitaire.',
              en: 'Everyday objects modelled precisely, all the way to an advertising visual.',
            },
          },
        ],
      },
      {
        tool: 'vray',
        points: [
          {
            lead: { fr: 'Le photoréalisme.', en: 'Photorealism.' },
            text: {
              fr: 'Des images de synthèse qui doivent passer pour des photographies.',
              en: 'Computer-generated images that have to pass for photographs.',
            },
          },
          {
            lead: { fr: 'La lumière d’abord.', en: 'Light first.' },
            text: {
              fr: 'Lumière naturelle ou artificielle, de jour comme de nuit : l’éclairage raconte la scène.',
              en: 'Daylight or artificial light, by day or by night: the lighting tells the scene.',
            },
          },
          {
            lead: { fr: 'Les matériaux.', en: 'Materials.' },
            text: {
              fr: 'Réflexion, réfraction, rugosité : chaque surface réglée pour réagir juste à la lumière.',
              en: 'Reflection, refraction, roughness: every surface tuned to respond to light correctly.',
            },
          },
          {
            lead: { fr: 'Les personnages aussi.', en: 'Characters too.' },
            text: {
              fr: 'Le même réalisme appliqué aux créatures et aux personnages, pas seulement aux décors.',
              en: 'The same realism applied to creatures and characters, not just to sets.',
            },
          },
        ],
      },
      {
        tool: 'zbrush',
        points: [
          {
            lead: { fr: 'La sculpture organique.', en: 'Organic sculpting.' },
            text: {
              fr: 'Créatures et personnages sculptés du volume général jusqu’au détail de la peau.',
              en: 'Creatures and characters sculpted from the overall form down to the detail of the skin.',
            },
          },
          {
            lead: { fr: 'Du cartoon au réaliste.', en: 'From cartoon to realistic.' },
            text: {
              fr: 'Pousser un design cartoon jusqu’à un rendu crédible, sans lui faire perdre son caractère.',
              en: 'Taking a cartoon design to a believable finish without losing its character.',
            },
          },
          {
            lead: { fr: 'Le portrait.', en: 'Portraits.' },
            text: {
              fr: 'Saisir une ressemblance, et savoir l’exagérer jusqu’à la caricature.',
              en: 'Capturing a likeness, and knowing how to push it into caricature.',
            },
          },
          {
            lead: { fr: 'Le mécanique aussi.', en: 'Mechanical too.' },
            text: {
              fr: 'Des formes dures et nettes, sculptées puis préparées pour la texture.',
              en: 'Hard, clean forms, sculpted then prepared for texturing.',
            },
          },
        ],
      },
      {
        tool: 'substance-painter',
        points: [
          {
            lead: { fr: 'Texturer ce qu’on a sculpté.', en: 'Texturing what was sculpted.' },
            text: {
              fr: 'Des textures peintes directement sur le modèle, couche par couche.',
              en: 'Textures painted straight onto the model, layer by layer.',
            },
          },
          {
            lead: { fr: 'Des surfaces crédibles.', en: 'Believable surfaces.' },
            text: {
              fr: 'Usure, salissure, variations : ce qui fait passer une matière de neuve à vraie.',
              en: 'Wear, grime, variation: what turns a surface from brand new to real.',
            },
          },
        ],
      },
      {
        tool: 'photoshop',
        points: [
          {
            lead: { fr: 'La dernière étape.', en: 'The last step.' },
            text: {
              fr: 'Retouche et étalonnage du rendu avant qu’il soit montré.',
              en: 'Retouching and colour grading the render before it is shown.',
            },
          },
          {
            lead: { fr: 'Du rendu au visuel.', en: 'From render to visual.' },
            text: {
              fr: 'Composer une image finie, prête pour un support marketing.',
              en: 'Composing a finished image, ready for marketing material.',
            },
          },
        ],
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
    fr: 'Je réponds à tout, y compris pour dire non. Par formulaire ou sur LinkedIn, au choix.',
    en: 'I answer everything, even when the answer is no. Through the form or on LinkedIn, as you prefer.',
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
