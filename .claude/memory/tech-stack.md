---
name: tech-stack
description: Socle technique de Portfolio 2027 et raisons des choix — versions, outils, contraintes d'exécution
metadata:
  type: project
---

# Socle technique

Résumé opérationnel des choix. Le raisonnement complet est dans `docs/adr/`.

## Versions

| Brique      | Version            | Contrainte                                               |
| ----------- | ------------------ | -------------------------------------------------------- |
| Node        | 22.23.2 (`.nvmrc`) | Angular 22 exige ≥ 22.22.3                               |
| pnpm        | 11.24.0            | workspaces, `allowBuilds` requis pour les modules natifs |
| Angular     | 22                 | standalone, zoneless, signals                            |
| TypeScript  | 6.0.x              | imposé par Angular 22 (`>=6.0 <6.1`)                     |
| Fastify     | 5                  |                                                          |
| Drizzle ORM | 0.45               | SQLite via `better-sqlite3`                              |
| Zod         | 4                  | validation partagée front/back                           |

## Contraintes d'exécution non évidentes

**L'API n'a pas d'étape de build.** Node 22 exécute le TypeScript par type stripping. Conséquences directes : les imports relatifs portent l'extension `.ts`, et `erasableSyntaxOnly` interdit enums, namespaces et propriétés de paramètre de constructeur. Le typecheck le vérifie, donc l'erreur apparaît à l'écriture.

**Le registre npm est forcé sur le registre public** par le `.npmrc` du projet. Le `~/.npmrc` global de Stéphane pointe vers le CodeArtifact de Web Atrio, avec un jeton qui expire — sans ce fichier local, `pnpm install` échoue en 401.

**pnpm 11 bloque les scripts de build natifs par défaut.** `better-sqlite3`, `argon2`, `esbuild`, `lmdb`, `@parcel/watcher` et `msgpackr-extract` sont explicitement autorisés dans `pnpm-workspace.yaml`. Sans cela, l'installation passe mais l'API ne démarre pas.

**Le boot de l'API dépend de MinIO** : le plugin `storage` vérifie l'existence du bucket au démarrage et le crée si besoin. `pnpm infra:up` doit précéder `pnpm dev:api`.

**Le script de vérification s'appelle `verify`, pas `ci`.** `pnpm ci` est une commande intégrée à pnpm (réinstallation propre) qui masque silencieusement un script du même nom — elle supprime `node_modules` au lieu de lancer les vérifications.

## Commandes

```bash
pnpm dev                              # web + api en parallèle
pnpm infra:up                         # MinIO (console sur :9001)
pnpm verify                           # typecheck + lint + format + tests
pnpm --filter @portfolio/api db:generate   # migration après modif du schéma Drizzle
pnpm --filter @portfolio/api admin:hash    # hash argon2 du mot de passe admin
```

## Ce qui n'a pas été retenu

Nx, NestJS, .NET, PostgreSQL, JWT, GSAP. Chacun a sa raison écrite dans l'ADR correspondante — relire avant de reproposer.

Voir [[design-system]] pour la couche visuelle et [[content-guidelines]] pour l'éditorial.
