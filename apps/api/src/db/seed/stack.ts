import type { StackEntryRecord } from '@portfolio/shared-types/stack';

import { toolId } from './tools.ts';

/**
 * The world pages' Stack section and its « Maîtrise » panel, one entry per
 * tool and world. Each point states what Stéphane does with the tool, kept
 * generic (his brief, 2026-11-15): no claim about this repository, a client,
 * a figure or a date. French approved on the « Bascule Dev / 3D » mockup.
 */
export const STACK: readonly StackEntryRecord[] = [
  {
    id: 'f9ff3653-9aa2-4db4-9ab9-61d67dfeaad1',
    domain: 'dev',
    position: 0,
    tool: toolId('angular'),
    points: [
      {
        strongLine: { fr: 'Standalone, zoneless, signals.', en: 'Standalone, zoneless, signals.' },
        secondLine: {
          fr: 'Des applications Angular modernes, sans NgModule ni zone.js, où l’état vit dans des signals et le dérivé dans des computed.',
          en: 'Modern Angular apps without NgModules or zone.js: state lives in signals, derived state in computed.',
        },
      },
      {
        strongLine: { fr: 'Un rendu sous contrôle.', en: 'Rendering under control.' },
        secondLine: {
          fr: 'OnPush, @for avec track, @defer : un rendu qui ne travaille que lorsqu’il le faut, et ne charge que ce qui s’affiche.',
          en: 'OnPush, @for with track, @defer: rendering that only runs when it needs to, and loads only what is on screen.',
        },
      },
      {
        strongLine: { fr: 'Une architecture qui se lit.', en: 'An architecture you can read.' },
        secondLine: {
          fr: 'Des couches et des composants clairs dès la première lecture, qui restent maintenables quand le périmètre grandit.',
          en: 'Layers and components that are clear on first read, and stay maintainable as the scope grows.',
        },
      },
      {
        strongLine: { fr: 'La qualité outillée.', en: 'Quality, built in.' },
        secondLine: {
          fr: 'Tests unitaires, lint et couverture en intégration continue, accessibilité pensée dès le composant.',
          en: 'Unit tests, linting and coverage in continuous integration, accessibility designed in from the component up.',
        },
      },
    ],
  },
  {
    id: 'e6ea9248-0e4c-4533-991f-61ba5d38f0f3',
    domain: 'dev',
    position: 1,
    tool: toolId('typescript'),
    points: [
      {
        strongLine: { fr: 'Strict, sans any.', en: 'Strict, no any.' },
        secondLine: {
          fr: 'Un typage strict qui arrête les erreurs à la compilation, et un as qui fait taire le compilateur traité comme un bug différé.',
          en: 'Strict typing that catches errors at compile time, where an as that silences the compiler counts as a deferred bug.',
        },
      },
      {
        strongLine: { fr: 'Le domaine typé.', en: 'A typed domain.' },
        secondLine: {
          fr: 'Des types métier explicites, partagés entre le front et l’API plutôt que redéclarés de chaque côté.',
          en: 'Explicit domain types, shared between the front end and the API rather than redeclared on each side.',
        },
      },
      {
        strongLine: { fr: 'Validé à la frontière.', en: 'Validated at the boundary.' },
        secondLine: {
          fr: 'Formulaires, réponses d’API : ce qui vient de l’extérieur passe par un schéma avant d’être typé.',
          en: 'Forms, API responses: whatever comes from outside is checked against a schema before it is typed.',
        },
      },
      {
        strongLine: { fr: 'Du navigateur au serveur.', en: 'From browser to server.' },
        secondLine: {
          fr: 'Le même langage côté client et côté Node, pour un code cohérent de bout en bout.',
          en: 'The same language in the browser and on Node, for code that holds together end to end.',
        },
      },
    ],
  },
  {
    id: '7cdac960-2125-401b-bb4a-549a44f0da5f',
    domain: 'dev',
    position: 2,
    tool: toolId('rxjs'),
    points: [
      {
        strongLine: { fr: 'Signals pour l’état.', en: 'Signals for state.' },
        secondLine: {
          fr: 'L’état local et dérivé en signals et computed, lisible sans souscription.',
          en: 'Local and derived state in signals and computed, readable without subscribing.',
        },
      },
      {
        strongLine: { fr: 'RxJS pour les flux.', en: 'RxJS for streams.' },
        secondLine: {
          fr: 'Requêtes, annulation, debounce : ce qui est réellement asynchrone reste un observable.',
          en: 'Requests, cancellation, debounce: what is truly asynchronous stays an observable.',
        },
      },
      {
        strongLine: { fr: 'Les deux modèles réunis.', en: 'Both models, together.' },
        secondLine: {
          fr: 'toSignal, toObservable : passer de l’un à l’autre sans fuite ni double source de vérité.',
          en: 'toSignal, toObservable: moving between the two with no leak and no second source of truth.',
        },
      },
      {
        strongLine: { fr: 'Les opérateurs qui comptent.', en: 'The operators that matter.' },
        secondLine: {
          fr: 'switchMap, combineLatest, takeUntilDestroyed : composer des flux et les fermer proprement.',
          en: 'switchMap, combineLatest, takeUntilDestroyed: composing streams and closing them cleanly.',
        },
      },
    ],
  },
  {
    id: '282c5890-7f2c-4b6a-9dd7-91f443367ec3',
    domain: 'dev',
    position: 3,
    tool: toolId('dotnet'),
    points: [
      {
        strongLine: { fr: 'Référent technique.', en: 'The technical go-to.' },
        secondLine: {
          fr: 'J’accompagne des développeurs backend .NET et j’arbitre les choix qui touchent le front comme le back.',
          en: 'I support .NET back-end developers and make the calls that affect both front end and back end.',
        },
      },
      {
        strongLine: { fr: 'Des contrats d’API clairs.', en: 'Clear API contracts.' },
        secondLine: {
          fr: 'Endpoints, DTO, codes d’erreur : la frontière front / back se conçoit à deux, avant le code.',
          en: 'Endpoints, DTOs, error codes: the boundary between front end and back end is designed jointly, before any code.',
        },
      },
      {
        strongLine: { fr: 'La revue de code.', en: 'Code review.' },
        secondLine: {
          fr: 'Lire et challenger du C#, expliquer un choix, faire monter une équipe.',
          en: 'Reading and challenging C#, explaining a choice, helping a team level up.',
        },
      },
      {
        strongLine: { fr: 'Une vision de bout en bout.', en: 'An end-to-end view.' },
        secondLine: {
          fr: 'De la base de données au composant, savoir ce que chaque couche coûte à l’autre.',
          en: 'From the database to the component, knowing what each layer costs the next.',
        },
      },
    ],
  },
  {
    id: '80eff3aa-c9ac-490f-9b9c-08caba57a067',
    domain: 'dev',
    position: 4,
    tool: toolId('react'),
    points: [
      {
        strongLine: { fr: 'Composants et hooks.', en: 'Components and hooks.' },
        secondLine: {
          fr: 'Des interfaces React en TypeScript, l’état et les effets portés par des hooks.',
          en: 'React UIs in TypeScript, with state and effects handled by hooks.',
        },
      },
      {
        strongLine: { fr: 'De la maquette à la mise en ligne.', en: 'From mockup to launch.' },
        secondLine: {
          fr: 'Une interface React branchée sur une API Node, conçue, développée et livrée.',
          en: 'A React front end wired to a Node API, designed, built and shipped.',
        },
      },
      {
        strongLine: { fr: 'Les mêmes principes.', en: 'The same principles.' },
        secondLine: {
          fr: 'Composants simples, état explicite, typage strict, quel que soit le framework.',
          en: 'Simple components, explicit state, strict typing, whatever the framework.',
        },
      },
      {
        strongLine: { fr: 'Toujours opérationnel.', en: 'Still hands-on.' },
        secondLine: {
          fr: 'Angular au quotidien, React quand le projet le demande.',
          en: 'Angular day to day, React when the project calls for it.',
        },
      },
    ],
  },
  {
    id: '6ac94ad4-0c8d-4f1e-9b57-3d13e7bd1180',
    domain: 'dev',
    position: 5,
    tool: toolId('docker'),
    points: [
      {
        strongLine: { fr: 'Un environnement reproductible.', en: 'A reproducible environment.' },
        secondLine: {
          fr: 'Une application et ses services conteneurisés, qui démarrent de la même façon sur chaque poste.',
          en: 'An application and its services in containers, starting the same way on every machine.',
        },
      },
      {
        strongLine: { fr: 'Docker Compose.', en: 'Docker Compose.' },
        secondLine: {
          fr: 'API, base de données, stockage : une stack locale décrite dans un fichier et lancée en une commande.',
          en: 'API, database, storage: a local stack described in one file and started with one command.',
        },
      },
      {
        strongLine: { fr: 'Du poste au serveur.', en: 'From laptop to server.' },
        secondLine: {
          fr: 'La même image du développement à la production, la configuration passée par l’environnement.',
          en: 'The same image from development to production, configuration passed in through the environment.',
        },
      },
      {
        strongLine: { fr: 'Le réseau maîtrisé.', en: 'The network under control.' },
        secondLine: {
          fr: 'Un reverse proxy nginx en frontal, les services isolés derrière.',
          en: 'An nginx reverse proxy in front, the services isolated behind it.',
        },
      },
    ],
  },
  {
    id: '383caf7e-c568-4c5f-9213-28c97ab39111',
    domain: 'dev',
    position: 6,
    tool: toolId('git'),
    points: [
      {
        strongLine: { fr: 'Conventional Commits.', en: 'Conventional Commits.' },
        secondLine: {
          fr: 'Un historique qui se lit comme un journal : une intention par commit.',
          en: 'A history that reads like a log: one intent per commit.',
        },
      },
      {
        strongLine: {
          fr: 'Tout passe par une pull request.',
          en: 'Everything goes through a pull request.',
        },
        secondLine: {
          fr: 'Branche courte, revue, puis fusion : rien n’arrive sur la branche principale sans relecture.',
          en: 'Short-lived branch, review, then merge: nothing reaches the main branch unreviewed.',
        },
      },
      {
        strongLine: { fr: 'Une CI qui fait foi.', en: 'CI has the final say.' },
        secondLine: {
          fr: 'Typecheck, lint, tests et couverture : la fusion attend que tout soit vert.',
          en: 'Typecheck, lint, tests and coverage: the merge waits until everything is green.',
        },
      },
      {
        strongLine: { fr: 'Un historique qu’on remonte.', en: 'A history you can trace.' },
        secondLine: {
          fr: 'Rebase, cherry-pick, conflits résolus : retrouver quand et pourquoi une ligne a changé.',
          en: 'Rebase, cherry-pick, conflict resolution: finding when and why a line changed.',
        },
      },
    ],
  },
  {
    id: 'dfed2a57-3541-41d7-b9eb-31c4a9240f84',
    domain: 'dev',
    position: 7,
    tool: toolId('aws'),
    points: [
      {
        strongLine: { fr: 'EC2.', en: 'EC2.' },
        secondLine: {
          fr: 'J’administre les instances : mise en service, configuration et maintenance des serveurs.',
          en: 'I administer the instances: provisioning, configuring and maintaining the servers.',
        },
      },
      {
        strongLine: { fr: 'Secrets Manager.', en: 'Secrets Manager.' },
        secondLine: {
          fr: 'Les clés et identifiants restent hors du code et hors du dépôt, servis à l’exécution.',
          en: 'Keys and credentials stay out of the code and out of the repository, supplied at runtime.',
        },
      },
      {
        strongLine: { fr: 'S3.', en: 'S3.' },
        secondLine: {
          fr: 'Des buckets pour les médias et les livrables, avec des droits stricts : lisibles quand il le faut, jamais inscriptibles publiquement.',
          en: 'Buckets for media and deliverables, with strict permissions: readable when they need to be, never publicly writable.',
        },
      },
      {
        strongLine: { fr: 'Des déploiements automatisés.', en: 'Automated deployments.' },
        secondLine: {
          fr: 'Des pipelines Azure DevOps qui construisent et livrent sur l’infrastructure AWS.',
          en: 'Azure DevOps pipelines that build and deliver to the AWS infrastructure.',
        },
      },
    ],
  },
  {
    id: '8602a32c-d55b-4f62-87d8-e0d0b3b6c661',
    domain: 'dev',
    position: 8,
    tool: toolId('claude-code'),
    points: [
      {
        strongLine: { fr: 'Orchestrer, pas déléguer.', en: 'Orchestrating, not delegating.' },
        secondLine: {
          fr: 'Des agents spécialisés que je mets en contradiction plutôt qu’en accord.',
          en: 'Specialised agents I pit against each other instead of letting them agree.',
        },
      },
      {
        strongLine: { fr: 'Un contexte versionné.', en: 'Versioned context.' },
        secondLine: {
          fr: 'Consignes, skills et mémoire dans le dépôt : le contexte ne se perd pas d’une session à l’autre.',
          en: 'Instructions, skills and memory in the repository: context carries over from one session to the next.',
        },
      },
      {
        strongLine: { fr: 'Vérifier, pas croire.', en: 'Verifying, not trusting.' },
        secondLine: {
          fr: 'Ce que l’agent produit est testé ou mesuré avant d’être accepté.',
          en: 'What the agent produces is tested or measured before it is accepted.',
        },
      },
      {
        strongLine: { fr: 'Le dernier mot reste humain.', en: 'A human has the last word.' },
        secondLine: {
          fr: 'Chaque affirmation se rattache à une source, et c’est moi qui tranche.',
          en: 'Every claim traces back to a source, and I make the call.',
        },
      },
    ],
  },
  {
    id: '8a753248-949a-4c5d-88ef-c2563713ac7e',
    domain: 'cgi',
    position: 0,
    tool: toolId('3dsmax'),
    points: [
      {
        strongLine: { fr: 'La modélisation polygonale.', en: 'Polygon modelling.' },
        secondLine: {
          fr: 'Une scène construite de zéro : volumes, détails, puis mise en place pour le rendu.',
          en: 'A scene built from scratch: volumes, detail, then set up for rendering.',
        },
      },
      {
        strongLine: { fr: 'L’architecture.', en: 'Architecture.' },
        secondLine: {
          fr: 'Bâtiments et extérieurs modélisés aux bonnes proportions, prêts à être éclairés.',
          en: 'Buildings and exteriors modelled to the right proportions, ready to be lit.',
        },
      },
      {
        strongLine: { fr: 'L’intérieur.', en: 'Interiors.' },
        secondLine: {
          fr: 'Des pièces meublées et mises en scène, du mobilier jusqu’aux accessoires.',
          en: 'Rooms furnished and staged, from the furniture down to the props.',
        },
      },
      {
        strongLine: { fr: 'L’objet et le produit.', en: 'Objects and products.' },
        secondLine: {
          fr: 'Des objets du quotidien modélisés avec précision, jusqu’au visuel publicitaire.',
          en: 'Everyday objects modelled with precision, all the way to a finished advertising visual.',
        },
      },
    ],
  },
  {
    id: '2168c7d7-b1df-44a5-b110-7dcfbd6831a9',
    domain: 'cgi',
    position: 1,
    tool: toolId('vray'),
    points: [
      {
        strongLine: { fr: 'Le photoréalisme.', en: 'Photorealism.' },
        secondLine: {
          fr: 'Des images de synthèse qui doivent passer pour des photographies.',
          en: 'Computer-generated images that have to pass for photographs.',
        },
      },
      {
        strongLine: { fr: 'La lumière d’abord.', en: 'Light first.' },
        secondLine: {
          fr: 'Lumière naturelle ou artificielle, de jour comme de nuit : l’éclairage raconte la scène.',
          en: 'Daylight or artificial light, by day or by night: the lighting tells the story of the scene.',
        },
      },
      {
        strongLine: { fr: 'Les matériaux.', en: 'Materials.' },
        secondLine: {
          fr: 'Réflexion, réfraction, rugosité : chaque surface réglée pour réagir juste à la lumière.',
          en: 'Reflection, refraction, roughness: every surface tuned to react to light just right.',
        },
      },
      {
        strongLine: { fr: 'Les personnages aussi.', en: 'Characters too.' },
        secondLine: {
          fr: 'Le même réalisme appliqué aux créatures et aux personnages, pas seulement aux décors.',
          en: 'The same realism applied to creatures and characters, not just to environments.',
        },
      },
    ],
  },
  {
    id: 'f2b978de-33bb-4f3a-bd75-85cf7b22c9a0',
    domain: 'cgi',
    position: 2,
    tool: toolId('zbrush'),
    points: [
      {
        strongLine: { fr: 'La sculpture organique.', en: 'Organic sculpting.' },
        secondLine: {
          fr: 'Créatures et personnages sculptés du volume général jusqu’au détail de la peau.',
          en: 'Creatures and characters sculpted from the overall form down to the detail of the skin.',
        },
      },
      {
        strongLine: { fr: 'Du cartoon au réaliste.', en: 'From cartoon to realistic.' },
        secondLine: {
          fr: 'Pousser un design cartoon jusqu’à un rendu crédible, sans lui faire perdre son caractère.',
          en: 'Taking a cartoon design to a believable finish without losing its character.',
        },
      },
      {
        strongLine: { fr: 'Le portrait.', en: 'Portraits.' },
        secondLine: {
          fr: 'Saisir une ressemblance, et savoir l’exagérer jusqu’à la caricature.',
          en: 'Capturing a likeness, and knowing how to push it into caricature.',
        },
      },
      {
        strongLine: { fr: 'Le mécanique aussi.', en: 'Hard-surface too.' },
        secondLine: {
          fr: 'Des formes dures et nettes, sculptées puis préparées pour la texture.',
          en: 'Hard, clean forms, sculpted then prepared for texturing.',
        },
      },
    ],
  },
  {
    id: 'e11fd533-3522-4f46-8a8b-febe132c7b1b',
    domain: 'cgi',
    position: 3,
    tool: toolId('substance-painter'),
    points: [
      {
        strongLine: { fr: 'Texturer ce qu’on a sculpté.', en: 'Texturing what was sculpted.' },
        secondLine: {
          fr: 'Des textures peintes directement sur le modèle, couche par couche.',
          en: 'Textures painted straight onto the model, layer by layer.',
        },
      },
      {
        strongLine: { fr: 'Des surfaces crédibles.', en: 'Believable surfaces.' },
        secondLine: {
          fr: 'Usure, salissure, variations : ce qui fait passer une matière de neuve à vraie.',
          en: 'Wear, grime, variation: what turns a surface from brand new to real.',
        },
      },
    ],
  },
  {
    id: '437bb00d-fa79-4ba3-aa2a-924209f1cb99',
    domain: 'cgi',
    position: 4,
    tool: toolId('photoshop'),
    points: [
      {
        strongLine: { fr: 'La dernière étape.', en: 'The last step.' },
        secondLine: {
          fr: 'Retouche et étalonnage du rendu avant qu’il soit montré.',
          en: 'Retouching and colour grading the render before it is shown.',
        },
      },
      {
        strongLine: { fr: 'Du rendu au visuel.', en: 'From render to visual.' },
        secondLine: {
          fr: 'Composer une image finie, prête pour un support marketing.',
          en: 'Composing a finished image, ready for marketing material.',
        },
      },
    ],
  },
];
