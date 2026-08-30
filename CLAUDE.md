# Portfolio 2027 — règles du projet

Portfolio de Stéphane Lieumont, développeur fullstack et graphiste 3D. C'est sa vitrine professionnelle : le site vend ce qu'il sait faire et ce qu'il propose. Une régression visible ou un texte approximatif coûtent plus qu'un bug ordinaire.

## Structure

```
apps/web              Angular 22 — le site public et le back-office
apps/api              Fastify + SQLite — projets, médias, contact
packages/shared-types Schémas Zod + types : source de vérité du domaine
docs/adr              Décisions d'architecture et leur pourquoi
.claude/memory        Contexte durable du projet
```

**Avant toute décision structurante**, lis `.claude/memory/` et `docs/adr/`. La réponse y est souvent déjà, avec ses raisons.

## Démarrer

```bash
nvm use && pnpm install && pnpm infra:up && pnpm dev
```

Node 22 est requis (`.nvmrc`). Le registre npm public est forcé par le `.npmrc` du projet.

## Style de code

Le code doit être **simple et lisible en première lecture**. Un lecteur qui découvre un fichier doit comprendre ce qu'il fait sans dérouler d'indirections.

- **Pas de commentaires**, sauf pour un _pourquoi_ non déductible du code : une contrainte cachée, un invariant subtil, un contournement. Un commentaire qui paraphrase le code est du bruit qui se périmera.
- Nommer précisément plutôt qu'expliquer après coup.
- Pas d'abstraction anticipée. Trois lignes qui se ressemblent valent mieux qu'un helper prématuré.
- **Pas de `any`.** La règle ESLint est en `error`. Un `as` pour faire taire le compilateur est un bug reporté à plus tard.
- Prettier et ESLint font autorité sur la forme. `pnpm format` avant de committer, et on ne discute pas du placement des virgules.

## Frontend — Angular 22

Standalone, **zoneless**, signals. Détail complet dans l'agent `angular-expert`, à consulter avant d'écrire du code Angular.

Les points qui ne se négocient pas : aucun `NgModule` ; `OnPush` partout ; `input()`/`output()`/`computed()` plutôt que les décorateurs ; `@if`/`@for` (avec `track`) plutôt que les directives structurelles ; types du domaine importés de `@portfolio/shared-types` et jamais redéclarés.

## Backend — Fastify

Node 22 exécute le TypeScript nativement : **aucune étape de build**, et les imports relatifs portent l'extension `.ts`. `erasableSyntaxOnly` est actif, donc pas d'enum TypeScript, pas de namespace, pas de propriété de paramètre de constructeur.

Un plugin par responsabilité (`config`, `db`, `storage`, `auth`), déclaré avec `fastify-plugin`. Toute entrée est validée par un schéma Zod venu de `@portfolio/shared-types`.

## Sécurité

Le site est public et le back-office le sera aussi. Ces règles ne sont pas négociables :

- **Aucun secret dans le dépôt ni dans le bundle.** Clés, hash, jetons vivent dans `.env`, qui est ignoré par git. Une clé de service tierce ne part jamais côté client — c'est la raison pour laquelle l'email de contact transite par l'API (voir ADR-0007).
- **Toute entrée est validée** par Zod avant d'atteindre la base ou le stockage. Aucune donnée client n'est fiable.
- **Les routes d'écriture passent par `requireAdmin`.** Une route d'écriture non gardée est une faille, pas un oubli.
- Session en cookie `httpOnly` signé. Jamais de jeton dans `localStorage`.
- Requêtes via Drizzle, jamais de SQL concaténé à la main.
- Uploads : type et taille contrôlés côté serveur. Le bucket est en lecture publique, **jamais en écriture publique**.
- Le message d'erreur d'une connexion échouée ne dit jamais _quelle_ partie a échoué.

## Tests

**80 % de couverture minimum** (lignes, branches, fonctions), seuil bloquant. Vitest côté web, runner natif de Node côté API. Voir ADR-0006.

Teste le comportement observable, pas l'implémentation : un test qui casse à chaque refactoring sans qu'aucun comportement ne change est un test à réécrire. Franchir la barre avec des assertions creuses est pire que 60 % de tests honnêtes.

## Librairies

Une dépendance s'ajoute quand elle résout un problème réellement fastidieux ou piégeux en accessibilité — galerie, carrousel, envoi d'email. Elle ne s'ajoute pas par réflexe : voir ADR-0007 pour les critères. Toute nouvelle dépendance structurante mérite une ADR.

## Décisions

Une décision coûteuse à inverser ou surprenante → une ADR, via le skill `new-adr`. La section _Conséquences_ doit inclure les inconvénients acceptés. Une ADR qui ne liste que des avantages n'a pas fait son travail.

Un choix local et réversible ne mérite pas d'ADR : la valeur du dossier tient à sa densité.

## Agents

Quatre experts dédiés dans `.claude/agents/` :

| Agent                  | Quand                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `angular-expert`       | code frontend, architecture de composants, performance, a11y |
| `design-expert`        | tokens, hiérarchie visuelle, direction artistique            |
| `communication-expert` | tout texte visible, wording, SEO                             |
| `motion-design-expert` | animations, transitions, `prefers-reduced-motion`            |

## Git

Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). Aucun push sans accord explicite de Stéphane. Jamais de `.env`, de fichier SQLite ni de média dans un commit.
