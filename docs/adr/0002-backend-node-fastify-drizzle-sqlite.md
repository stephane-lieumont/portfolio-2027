# ADR-0002 — Backend Node + Fastify + Drizzle + SQLite

- **Statut** : Accepted
- **Date** : 2026-08-30

## Contexte

Le portfolio a besoin d'un backend pour saisir les projets et gérer les visuels 3D, au lieu de redéployer le site à chaque ajout comme c'était le cas en 2022.

Le volume est minuscule et le restera : quelques dizaines de projets, un seul rédacteur — Stéphane —, un trafic de site vitrine. Aucune contrainte de charge, de concurrence en écriture ou de haute disponibilité. La vraie contrainte est le **coût de maintenance sur la durée** : ce projet vivra plusieurs années avec des mois sans y toucher, et il ne doit pas devenir un serveur à administrer.

Stéphane fait du .NET au quotidien en entreprise, et Angular en TypeScript ici.

## Décision

**Node 22 + Fastify + Drizzle ORM + SQLite** (`better-sqlite3`), en TypeScript, validé par Zod.

Node 22 exécute nativement le TypeScript par type stripping : **l'API n'a pas d'étape de build**. `node src/server.ts` en développement comme en production. Le tsconfig impose `erasableSyntaxOnly` pour garantir que le code reste compatible avec ce mode.

Les migrations sont générées par drizzle-kit et **appliquées au démarrage du serveur**, dans le plugin `db`.

## Conséquences

Un seul langage sur tout le repo. Les schémas Zod de `@portfolio/shared-types` valident les entrées de l'API et typent le client Angular — la même définition sert aux deux bouts. Pour un projet mené avec des agents IA, ce mono-langage réduit aussi la surface à raisonner.

SQLite n'a **aucun serveur à faire tourner** : la base est un fichier, la sauvegarde est une copie de fichier. Sur un projet personnel qu'on laisse dormir des mois, c'est décisif — il n'y a pas de service à maintenir, mettre à jour ou surveiller.

Pas d'étape de build sur l'API : le Dockerfile copie les sources et démarre. Moins de pièces, moins de casse.

En contrepartie, on assume des limites réelles : **une seule écriture concurrente** (sans objet ici, un seul rédacteur), **pas de réplication ni de scaling horizontal**, et une base liée au système de fichiers du conteneur — le volume doit être persistant et sauvegardé, sinon les données disparaissent avec le conteneur. Le fichier SQLite n'est jamais dans le dépôt.

Drizzle est plus proche de SQL qu'un ORM classique : on écrit davantage de requêtes explicites qu'avec EF Core, mais on garde le typage de bout en bout et aucun moteur binaire à installer.

Le type stripping natif interdit les enums TypeScript, les namespaces et les propriétés de paramètre de constructeur. `erasableSyntaxOnly` le vérifie au typecheck, donc l'erreur se voit à l'écriture et pas au déploiement.

## Alternatives écartées

**.NET Minimal API + EF Core** — l'expertise quotidienne de Stéphane, et un déploiement en binaire unique. Écarté parce qu'il introduit un second langage dans un repo qui tient sur le partage de types entre front et back : le contrat aurait dû être dupliqué ou généré, ce qui est précisément ce que l'ADR-0001 cherche à éviter.

**NestJS** — l'architecture en modules et l'injection de dépendances ressemblent à Angular, ce qui aurait été confortable. Écarté pour son volume de boilerplate, disproportionné pour une API qui expose des projets et des médias.

**PostgreSQL** — le choix par défaut, et un vrai serveur à administrer et sauvegarder pour stocker quelques dizaines de lignes. Le rapport bénéfice/charge ne tient pas ici. Si le besoin change, Drizzle rend la bascule raisonnable.

**Un CMS headless (Strapi, Directus, Payload)** — l'interface d'administration arrive gratuitement, mais on hérite d'un produit entier à mettre à jour et d'un modèle de données contraint, pour un site qui a besoin de deux entités.
