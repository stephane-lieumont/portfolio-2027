# ADR-0001 — Monorepo en pnpm workspaces

- **Statut** : Accepted
- **Date** : 2026-08-30

## Contexte

Portfolio 2027 réunit trois briques : une application Angular, une API Node, et le modèle de données qu'elles partagent. Le portfolio 2022 n'avait qu'un front, avec ses données en dur dans des fichiers TypeScript — la question de la cohérence front/back ne se posait pas.

Elle se pose maintenant. Un projet est décrit une fois et consommé des deux côtés ; si les deux définitions divergent, le bug se manifeste à l'exécution, en production, sur la vitrine professionnelle de Stéphane.

Le projet est développé par une seule personne assistée d'agents IA, sur son temps personnel. L'outillage doit rester compréhensible sans documentation externe.

## Décision

Un monorepo unique géré par **pnpm workspaces**, sans couche d'orchestration supplémentaire :

```
apps/web              Angular
apps/api              Fastify
packages/shared-types Schémas Zod + types, source de vérité du domaine
```

Les applications consomment le package partagé via le protocole `workspace:*`. Angular le résout par un alias `paths` vers les sources TypeScript directement : pas d'étape de build intermédiaire pour le package partagé.

## Conséquences

Le modèle de données est défini à un seul endroit. Un changement de contrat casse le typecheck des deux côtés immédiatement, au lieu de passer inaperçu jusqu'au runtime — c'est le bénéfice principal, et il justifie à lui seul le monorepo.

Un seul `pnpm install`, un seul lockfile, une version unique de TypeScript pour tout le repo.

En contrepartie : la racine porte de la configuration que ni `apps/web` ni `apps/api` ne porteraient seuls, et un développeur qui découvre le repo doit comprendre les workspaces avant de lancer quoi que ce soit. Sans cache de tâches, `pnpm -r build` reconstruit tout à chaque fois — acceptable à trois packages, à revoir si le repo grossit.

Un changement de type partagé impacte les deux applications d'un coup : c'est voulu, mais cela veut dire qu'on ne peut pas déployer un front et un back désynchronisés sans y penser.

## Alternatives écartées

**Nx** — la génération de code et le cache de tâches sont réels, mais s'amortissent sur un repo de dix packages, pas de trois. Sur un projet solo, `nx.json` et les `project.json` ajoutent une couche d'indirection que ni Stéphane ni un agent IA n'ont besoin de décoder pour comprendre comment le projet se construit.

**Deux dépôts séparés** — c'est exactement le scénario où le modèle de données diverge. Il aurait fallu publier le package partagé sur un registre, ou vivre avec deux définitions à synchroniser à la main. Le coût de la duplication dépasse largement celui du monorepo.

**Un seul package, front et back mélangés** — moins de configuration, mais les deux ont des cibles de build, des tsconfig et des cycles de vie incompatibles. La séparation ne coûte presque rien ici.
