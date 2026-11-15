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
 * Points not yet confirmed by Stéphane are written as plain points: a review
 * marker is not content (spec 03). The mockup flagged them « à valider »; the
 * list lives in .claude/runtime/STATUS.md until he settles them.
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
              fr: 'Des applications sans NgModule ni zone.js, où l’état vit dans des signals et le dérivé dans des computed.',
              en: 'Applications with no NgModule and no zone.js, where state lives in signals and derived state in computed.',
            },
          },
          {
            lead: { fr: 'OnPush partout.', en: 'OnPush everywhere.' },
            text: {
              fr: 'input(), output(), @if et @for avec track : un rendu qui ne se recalcule que lorsqu’une donnée change vraiment.',
              en: 'input(), output(), @if and @for with track: rendering that only recomputes when data actually changes.',
            },
          },
          {
            lead: { fr: 'Une architecture qui se lit.', en: 'An architecture you can read.' },
            text: {
              fr: 'Des composants simples à la première lecture, des types de domaine partagés, aucune abstraction prématurée.',
              en: 'Components that are simple on first reading, shared domain types, no premature abstraction.',
            },
          },
          {
            lead: { fr: 'La qualité mesurée.', en: 'Quality, measured.' },
            text: {
              fr: 'Tests Vitest, 80 % de couverture imposés en CI, accessibilité WCAG 2.2 AA vérifiée à chaque build.',
              en: 'Vitest tests, 80% coverage enforced in CI, WCAG 2.2 AA accessibility checked on every build.',
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
              fr: 'La règle est en erreur, et un as qui fait taire le compilateur est traité comme un bug différé.',
              en: 'The rule is set to error, and an as that silences the compiler is treated as a deferred bug.',
            },
          },
          {
            lead: { fr: 'Une source de vérité.', en: 'One source of truth.' },
            text: {
              fr: 'Des schémas Zod partagés entre le front et l’API : un type, une validation, un seul endroit.',
              en: 'Zod schemas shared between the front end and the API: one type, one validation, one place.',
            },
          },
          {
            lead: { fr: 'TypeScript natif côté serveur.', en: 'Native TypeScript on the server.' },
            text: {
              fr: 'Node 22 exécute le code sans étape de build, avec une syntaxe strictement effaçable.',
              en: 'Node 22 runs the code with no build step, in strictly erasable syntax.',
            },
          },
          {
            lead: { fr: 'Un monorepo typé.', en: 'A typed monorepo.' },
            text: {
              fr: 'Les types du domaine vivent dans un paquet partagé, jamais redéclarés d’une application à l’autre.',
              en: 'Domain types live in a shared package, never redeclared from one application to the next.',
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
              fr: 'Requêtes, annulation, debounce : ce qui est réellement asynchrone reste un observable.',
              en: 'Requests, cancellation, debounce: what is truly asynchronous stays an observable.',
            },
          },
          {
            lead: { fr: 'L’interop maîtrisée.', en: 'Interop under control.' },
            text: {
              fr: 'Passer d’un modèle à l’autre sans fuite ni double source de vérité.',
              en: 'Moving from one model to the other with no leak and no second source of truth.',
            },
          },
          {
            lead: { fr: 'Zoneless.', en: 'Zoneless.' },
            text: {
              fr: 'Une détection de changement pilotée par les signals, sans zone.js.',
              en: 'Change detection driven by signals, without zone.js.',
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
              fr: 'J’accompagne des développeurs backend .NET et j’arbitre les choix qui touchent les deux côtés.',
              en: 'I support .NET backend developers and make the calls that affect both sides.',
            },
          },
          {
            lead: { fr: 'Des contrats d’API clairs.', en: 'Clear API contracts.' },
            text: {
              fr: 'La frontière front / back se conçoit ensemble, avant d’écrire le code.',
              en: 'The front / back boundary is designed together, before the code is written.',
            },
          },
          {
            lead: { fr: 'La revue comme outil.', en: 'Review as a tool.' },
            text: {
              fr: 'Challenger une solution, expliquer un choix, faire monter une équipe.',
              en: 'Challenging a solution, explaining a choice, helping a team grow.',
            },
          },
          {
            lead: { fr: 'Une vision de bout en bout.', en: 'An end-to-end view.' },
            text: {
              fr: 'Du schéma de données au composant, le même niveau d’exigence.',
              en: 'From the data schema to the component, the same standard.',
            },
          },
        ],
      },
      {
        tool: 'react',
        points: [
          {
            lead: { fr: 'En production.', en: 'In production.' },
            text: {
              fr: 'Une landing page React et TypeScript adossée à une API Koa, de la maquette à la mise en ligne.',
              en: 'A React and TypeScript landing page backed by a Koa API, from mockup to launch.',
            },
          },
          {
            lead: { fr: 'Le parcours complet.', en: 'The whole journey.' },
            text: {
              fr: 'Cadrage, maquette, développement et déploiement sur le même projet.',
              en: 'Scoping, mockup, development and deployment on the same project.',
            },
          },
          {
            lead: { fr: 'Toujours opérationnel.', en: 'Still hands-on.' },
            text: {
              fr: 'Angular au quotidien, React quand le projet le demande.',
              en: 'Angular day to day, React when the project calls for it.',
            },
          },
          {
            lead: { fr: 'Les mêmes principes.', en: 'The same principles.' },
            text: {
              fr: 'Composants simples, état explicite, typage strict.',
              en: 'Simple components, explicit state, strict typing.',
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
              fr: 'Une commande pour lancer l’infrastructure locale : stockage objet, API, base.',
              en: 'One command to start the local infrastructure: object storage, API, database.',
            },
          },
          {
            lead: { fr: 'La production en miroir.', en: 'Production, mirrored.' },
            text: {
              fr: 'Les mêmes conteneurs du poste de développement au serveur.',
              en: 'The same containers from the development machine to the server.',
            },
          },
          {
            lead: { fr: 'Le stockage objet.', en: 'Object storage.' },
            text: {
              fr: 'Un bucket compatible S3, lisible par tous, jamais inscriptible publiquement.',
              en: 'An S3-compatible bucket, readable by anyone, never publicly writable.',
            },
          },
          {
            lead: { fr: 'Le réseau maîtrisé.', en: 'The network under control.' },
            text: {
              fr: 'nginx en frontal, les services derrière.',
              en: 'nginx in front, the services behind it.',
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
              fr: 'Un historique qui se lit comme un journal, en anglais, une intention par commit.',
              en: 'A history that reads like a log, in English, one intent per commit.',
            },
          },
          {
            lead: {
              fr: 'Tout passe par une pull request.',
              en: 'Everything goes through a pull request.',
            },
            text: {
              fr: 'Branche, commits, vérification complète, puis revue avant la fusion.',
              en: 'Branch, commits, full verification, then review before the merge.',
            },
          },
          {
            lead: { fr: 'Une CI qui fait foi.', en: 'CI as the authority.' },
            text: {
              fr: 'Typecheck, lint, format, tests et couverture avant chaque fusion.',
              en: 'Typecheck, lint, format, tests and coverage before every merge.',
            },
          },
          {
            lead: { fr: 'Les décisions tracées.', en: 'Decisions on record.' },
            text: {
              fr: 'Les choix structurants consignés dans des ADR, avec leurs inconvénients assumés.',
              en: 'Structural choices recorded in ADRs, with the downsides they accept.',
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
              fr: 'J’administre les instances : mise en service, configuration et maintenance des serveurs.',
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
              fr: 'Des buckets pour les médias et les livrables, avec des droits stricts : lisibles quand il le faut, jamais inscriptibles publiquement.',
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
              fr: 'Des agents spécialisés (Angular, design, rédaction, motion) que je mets en contradiction plutôt qu’en accord.',
              en: 'Specialised agents (Angular, design, copy, motion) that I set against each other rather than in agreement.',
            },
          },
          {
            lead: { fr: 'Des règles versionnées.', en: 'Versioned rules.' },
            text: {
              fr: 'Consignes de projet, skills et mémoire dans le dépôt : le contexte ne se perd pas d’une session à l’autre.',
              en: 'Project instructions, skills and memory in the repository: context is not lost from one session to the next.',
            },
          },
          {
            lead: { fr: 'Mesurer, pas lire.', en: 'Measuring, not reading.' },
            text: {
              fr: 'Chaque changement visuel vérifié sur le DOM réel, pas sur une relecture du CSS.',
              en: 'Every visual change checked on the live DOM, not by rereading the CSS.',
            },
          },
          {
            lead: { fr: 'Le dernier mot reste humain.', en: 'The last word stays human.' },
            text: {
              fr: 'Chaque affirmation se rattache à une source, et j’arbitre.',
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
            lead: { fr: 'La base de chaque pièce.', en: 'The base of every piece.' },
            text: {
              fr: 'Les seize rendus de la galerie partent de 3ds Max : architecture, intérieurs, objets, personnages.',
              en: 'All sixteen renders in the gallery start in 3ds Max: architecture, interiors, objects, characters.',
            },
          },
          {
            lead: { fr: 'L’architecture.', en: 'Architecture.' },
            text: {
              fr: 'Un immeuble d’habitation, une maison moderne vue de l’extérieur.',
              en: 'An apartment building, a modern house seen from outside.',
            },
          },
          {
            lead: { fr: 'L’intérieur.', en: 'Interiors.' },
            text: {
              fr: 'Salon, chambre, entrée aux murs blancs : des pièces décorées et mises en scène.',
              en: 'Living room, bedroom, a white-walled entrance hall: rooms furnished and staged.',
            },
          },
          {
            lead: { fr: 'L’objet et le produit.', en: 'Objects and products.' },
            text: {
              fr: 'Une ampoule, des tomates, une canette en visuel publicitaire pour Pixmodels.',
              en: 'A light bulb, tomatoes, a can as an advertising visual for Pixmodels.',
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
              fr: 'Immeuble, maison, herbe, tomates : des images qui doivent passer pour des photographies.',
              en: 'Building, house, grass, tomatoes: images that have to pass for photographs.',
            },
          },
          {
            lead: { fr: 'La lumière d’abord.', en: 'Light first.' },
            text: {
              fr: 'Le même salon rendu de jour et de nuit : l’éclairage raconte la scène.',
              en: 'The same living room rendered by day and by night: the lighting tells the scene.',
            },
          },
          {
            lead: { fr: 'Les personnages aussi.', en: 'Characters too.' },
            text: {
              fr: 'L’extraterrestre et Escart Wild, rendus en photoréaliste.',
              en: 'The alien and Escart Wild, rendered photorealistically.',
            },
          },
          {
            lead: { fr: 'Les matières.', en: 'Materials.' },
            text: {
              fr: 'Chaque surface réglée pour réagir juste à la lumière.',
              en: 'Every surface tuned to respond to light correctly.',
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
              fr: 'Gorgotte, une créature monstrueuse sculptée en 3D.',
              en: 'Gorgotte, a monstrous creature sculpted in 3D.',
            },
          },
          {
            lead: { fr: 'Du cartoon au réaliste.', en: 'From cartoon to realistic.' },
            text: {
              fr: 'Escart Wild, un escargot cartoon traité en photoréaliste.',
              en: 'Escart Wild, a cartoon snail treated photorealistically.',
            },
          },
          {
            lead: { fr: 'Le portrait.', en: 'Portraits.' },
            text: { fr: 'Une caricature 3D de moi-même.', en: 'A 3D caricature of myself.' },
          },
          {
            lead: { fr: 'Le mécanique aussi.', en: 'Mechanical too.' },
            text: {
              fr: 'Beebop, un robot sculpté puis texturé.',
              en: 'Beebop, a robot sculpted, then textured.',
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
              fr: 'Beebop, sculpté dans ZBrush puis texturé dans Substance Painter.',
              en: 'Beebop, sculpted in ZBrush, then textured in Substance Painter.',
            },
          },
          {
            lead: { fr: 'Une créature crédible.', en: 'A believable creature.' },
            text: {
              fr: 'Les textures de l’extraterrestre, rendu en photoréaliste.',
              en: 'The alien’s textures, rendered photorealistically.',
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
              fr: 'Une partie des rendus passe par Photoshop avant d’être montrée.',
              en: 'Some of the renders go through Photoshop before they are shown.',
            },
          },
          {
            lead: { fr: 'Le visuel publicitaire.', en: 'The advertising visual.' },
            text: {
              fr: 'La canette Pixmodels, de la 3D au support marketing.',
              en: 'The Pixmodels can, from 3D to marketing material.',
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
