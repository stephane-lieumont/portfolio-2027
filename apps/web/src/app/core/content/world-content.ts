import type {
  ContactPage,
  SiteSettings,
  WorldKey,
  WorldPage,
  WorldStack,
} from '@portfolio/shared-types';

import type { StaticImage } from '../static-content';

/**
 * Editorial content of the two worlds and the contact page, held in the app
 * until the back office exists. Shaped exactly like the shared-types schemas so
 * the swap to the API is a change of source, not of shape — world-content.spec
 * parses every record against them.
 *
 * Copy approved with Stéphane on the « Bascule Dev / 3D » mockup, 2026-11-14.
 */

const UPDATED_AT = '2026-11-14T00:00:00.000Z';

/**
 * Assets referenced by id, as the API will. Until media are records, the ids
 * are fixed placeholders resolved here to the bucket key and its metadata.
 */
export const STATIC_ASSETS: Readonly<Record<string, StaticImage>> = {
  '6b7c2a0e-1f3d-4c5a-9e8b-2d4f6a8c0e11': {
    key: 'portrait-stephane-pensif.png',
    alt: 'Stéphane Lieumont, pensif, la main au menton',
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
    roleWord: 'LEAD TECH',
    eyebrowTools: ['angular', 'dotnet', 'typescript'],
    lede: {
      lead: 'Lead Tech, Angular et .NET.',
      text: 'Une rigueur d’ingénieur, un œil de graphiste 3D.',
    },
    scrub:
      'J’arbitre les choix techniques, j’encadre et je challenge les équipes. Le code, je continue à l’écrire.',
    facts: [
      { label: 'Rôle', value: 'Lead Tech, référent technique' },
      { label: 'Stack', value: 'Angular, TypeScript, RxJS/Signals, .NET/C#' },
      { label: 'Aussi', value: 'React, Docker, CI/CD, Git' },
      { label: 'Avant', value: 'Quatorze ans dans l’aéronautique' },
    ],
    updatedAt: UPDATED_AT,
  },
  cgi: {
    world: 'cgi',
    roleWord: 'GRAPHISTE 3D',
    eyebrowTools: ['3dsmax', 'vray', 'zbrush'],
    lede: {
      lead: 'Une pratique apprise seule.',
      text: 'Sans école et sans commande, bien avant le développement.',
    },
    scrub:
      'C’est en 3D que j’ai appris à apprendre seul, et à regarder une image jusqu’à voir ce qui ne va pas.',
    facts: [
      { label: 'Modélisation', value: '3ds Max, ZBrush' },
      { label: 'Rendu', value: 'V-Ray' },
      { label: 'Texture', value: 'Substance Painter, Photoshop' },
      { label: 'Période', value: '2014 – 2016' },
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
            lead: 'Standalone, zoneless, signals.',
            text: 'Des applications sans NgModule ni zone.js, où l’état vit dans des signals et le dérivé dans des computed.',
          },
          {
            lead: 'OnPush partout.',
            text: 'input(), output(), @if et @for avec track : un rendu qui ne se recalcule que lorsqu’une donnée change vraiment.',
          },
          {
            lead: 'Une architecture qui se lit.',
            text: 'Des composants simples à la première lecture, des types de domaine partagés, aucune abstraction prématurée.',
          },
          {
            lead: 'La qualité mesurée.',
            text: 'Tests Vitest, 80 % de couverture imposés en CI, accessibilité WCAG 2.2 AA vérifiée à chaque build.',
          },
        ],
      },
      {
        tool: 'typescript',
        points: [
          {
            lead: 'Strict, sans any.',
            text: 'La règle est en erreur, et un as qui fait taire le compilateur est traité comme un bug différé.',
          },
          {
            lead: 'Une source de vérité.',
            text: 'Des schémas Zod partagés entre le front et l’API : un type, une validation, un seul endroit.',
          },
          {
            lead: 'TypeScript natif côté serveur.',
            text: 'Node 22 exécute le code sans étape de build, avec une syntaxe strictement effaçable.',
          },
          {
            lead: 'Un monorepo typé.',
            text: 'Les types du domaine vivent dans un paquet partagé, jamais redéclarés d’une application à l’autre.',
          },
        ],
      },
      {
        tool: 'rxjs',
        points: [
          {
            lead: 'Signals pour l’état.',
            text: 'L’état local et dérivé en signals et computed, lisible sans souscription.',
          },
          {
            lead: 'RxJS pour les flux.',
            text: 'Requêtes, annulation, debounce : ce qui est réellement asynchrone reste un observable.',
          },
          {
            lead: 'L’interop maîtrisée.',
            text: 'Passer d’un modèle à l’autre sans fuite ni double source de vérité.',
          },
          {
            lead: 'Zoneless.',
            text: 'Une détection de changement pilotée par les signals, sans zone.js.',
          },
        ],
      },
      {
        tool: 'dotnet',
        points: [
          {
            lead: 'Référent technique.',
            text: 'J’accompagne des développeurs backend .NET et j’arbitre les choix qui touchent les deux côtés.',
          },
          {
            lead: 'Des contrats d’API clairs.',
            text: 'La frontière front / back se conçoit ensemble, avant d’écrire le code.',
          },
          {
            lead: 'La revue comme outil.',
            text: 'Challenger une solution, expliquer un choix, faire monter une équipe.',
          },
          {
            lead: 'Une vision de bout en bout.',
            text: 'Du schéma de données au composant, le même niveau d’exigence.',
          },
        ],
      },
      {
        tool: 'react',
        points: [
          {
            lead: 'En production.',
            text: 'Une landing page React et TypeScript adossée à une API Koa, de la maquette à la mise en ligne.',
          },
          {
            lead: 'Le parcours complet.',
            text: 'Cadrage, maquette, développement et déploiement sur le même projet.',
          },
          {
            lead: 'Toujours opérationnel.',
            text: 'Angular au quotidien, React quand le projet le demande.',
          },
          {
            lead: 'Les mêmes principes.',
            text: 'Composants simples, état explicite, typage strict.',
          },
        ],
      },
      {
        tool: 'docker',
        points: [
          {
            lead: 'Un environnement reproductible.',
            text: 'Une commande pour lancer l’infrastructure locale : stockage objet, API, base.',
          },
          {
            lead: 'La production en miroir.',
            text: 'Les mêmes conteneurs du poste de développement au serveur.',
          },
          {
            lead: 'Le stockage objet.',
            text: 'Un bucket compatible S3, lisible par tous, jamais inscriptible publiquement.',
          },
          { lead: 'Le réseau maîtrisé.', text: 'nginx en frontal, les services derrière.' },
        ],
      },
      {
        tool: 'git',
        points: [
          {
            lead: 'Conventional Commits.',
            text: 'Un historique qui se lit comme un journal, en anglais, une intention par commit.',
          },
          {
            lead: 'Tout passe par une pull request.',
            text: 'Branche, commits, vérification complète, puis revue avant la fusion.',
          },
          {
            lead: 'Une CI qui fait foi.',
            text: 'Typecheck, lint, format, tests et couverture avant chaque fusion.',
          },
          {
            lead: 'Les décisions tracées.',
            text: 'Les choix structurants consignés dans des ADR, avec leurs inconvénients assumés.',
          },
        ],
      },
      {
        tool: 'aws',
        points: [
          {
            lead: 'EC2.',
            text: 'J’administre les instances : mise en service, configuration et maintenance des serveurs.',
          },
          {
            lead: 'Secrets Manager.',
            text: 'Les clés et identifiants restent hors du code et hors du dépôt, servis à l’exécution.',
          },
          {
            lead: 'S3.',
            text: 'Des buckets pour les médias et les livrables, avec des droits stricts : lisibles quand il le faut, jamais inscriptibles publiquement.',
          },
          {
            lead: 'Des déploiements automatisés.',
            text: 'Des pipelines Azure DevOps qui construisent et livrent sur l’infrastructure AWS.',
          },
        ],
      },
      {
        tool: 'claude-code',
        points: [
          {
            lead: 'Orchestrer, pas déléguer.',
            text: 'Des agents spécialisés (Angular, design, rédaction, motion) que je mets en contradiction plutôt qu’en accord.',
          },
          {
            lead: 'Des règles versionnées.',
            text: 'Consignes de projet, skills et mémoire dans le dépôt : le contexte ne se perd pas d’une session à l’autre.',
          },
          {
            lead: 'Mesurer, pas lire.',
            text: 'Chaque changement visuel vérifié sur le DOM réel, pas sur une relecture du CSS.',
          },
          {
            lead: 'Le dernier mot reste humain.',
            text: 'Chaque affirmation se rattache à une source, et j’arbitre.',
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
            lead: 'La base de chaque pièce.',
            text: 'Les seize rendus de la galerie partent de 3ds Max : architecture, intérieurs, objets, personnages.',
          },
          {
            lead: 'L’architecture.',
            text: 'Un immeuble d’habitation, une maison moderne vue de l’extérieur.',
          },
          {
            lead: 'L’intérieur.',
            text: 'Salon, chambre, entrée aux murs blancs : des pièces décorées et mises en scène.',
          },
          {
            lead: 'L’objet et le produit.',
            text: 'Une ampoule, des tomates, une canette en visuel publicitaire pour Pixmodels.',
          },
        ],
      },
      {
        tool: 'vray',
        points: [
          {
            lead: 'Le photoréalisme.',
            text: 'Immeuble, maison, herbe, tomates : des images qui doivent passer pour des photographies.',
          },
          {
            lead: 'La lumière d’abord.',
            text: 'Le même salon rendu de jour et de nuit : l’éclairage raconte la scène.',
          },
          {
            lead: 'Les personnages aussi.',
            text: 'L’extraterrestre et Escart Wild, rendus en photoréaliste.',
          },
          { lead: 'Les matières.', text: 'Chaque surface réglée pour réagir juste à la lumière.' },
        ],
      },
      {
        tool: 'zbrush',
        points: [
          {
            lead: 'La sculpture organique.',
            text: 'Gorgotte, une créature monstrueuse sculptée en 3D.',
          },
          {
            lead: 'Du cartoon au réaliste.',
            text: 'Escart Wild, un escargot cartoon traité en photoréaliste.',
          },
          { lead: 'Le portrait.', text: 'Une caricature 3D de moi-même.' },
          { lead: 'Le mécanique aussi.', text: 'Beebop, un robot sculpté puis texturé.' },
        ],
      },
      {
        tool: 'substance-painter',
        points: [
          {
            lead: 'Texturer ce qu’on a sculpté.',
            text: 'Beebop, sculpté dans ZBrush puis texturé dans Substance Painter.',
          },
          {
            lead: 'Une créature crédible.',
            text: 'Les textures de l’extraterrestre, rendu en photoréaliste.',
          },
        ],
      },
      {
        tool: 'photoshop',
        points: [
          {
            lead: 'La dernière étape.',
            text: 'Une partie des rendus passe par Photoshop avant d’être montrée.',
          },
          {
            lead: 'Le visuel publicitaire.',
            text: 'La canette Pixmodels, de la 3D au support marketing.',
          },
        ],
      },
    ],
    updatedAt: UPDATED_AT,
  },
};

export const CONTACT_PAGE: ContactPage = {
  title: 'Un projet, une question ou juste un Hello World ?',
  lede: 'Je réponds à tout, y compris pour dire non. Par formulaire ou sur LinkedIn, au choix.',
  portraitAssetId: PORTRAIT_ID,
  portraitCaption: 'Fontenilles, France',
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
