# Portfolio 2027

Portfolio de Stéphane Lieumont — développeur fullstack et graphiste 3D. Successeur du portfolio React de 2022, réécrit en Angular avec un back-office pour publier les projets sans redéployer le site.

## Prérequis

- Node 22 (`nvm use` — la version est dans `.nvmrc`)
- pnpm 11 (`corepack enable`)
- Docker, pour MinIO

## Démarrer

```bash
nvm use
pnpm install
cp .env.example .env
pnpm infra:up
pnpm dev
```

- Site : http://localhost:4200
- API : http://localhost:3000
- Console MinIO : http://localhost:9001

`pnpm infra:up` doit précéder l'API : le plugin de stockage vérifie le bucket au démarrage.

## Structure

```
apps/web              Angular 22 — site public et back-office
apps/api              Fastify + SQLite — projets, médias, contact
packages/shared-types Schémas Zod partagés entre front et back
docs/adr              Décisions d'architecture
.claude/              Agents, skills et mémoire du projet
infra/                docker-compose (MinIO, API)
```

## Commandes

| Commande                       | Effet                             |
| ------------------------------ | --------------------------------- |
| `pnpm dev`                     | web + api en parallèle            |
| `pnpm build`                   | build de tous les packages        |
| `pnpm test`                    | tests, seuil de couverture à 80 % |
| `pnpm verify`                  | typecheck + lint + format + tests |
| `pnpm format`                  | Prettier sur tout le repo         |
| `pnpm infra:up` / `infra:down` | conteneurs MinIO                  |

Côté API :

```bash
pnpm --filter @portfolio/api db:generate   # migration après modif du schéma
pnpm --filter @portfolio/api db:studio     # explorateur de base
pnpm --filter @portfolio/api admin:hash    # hash argon2 du mot de passe admin
```

## Configuration

Tout passe par `.env`, calqué sur `.env.example`. Les valeurs par défaut conviennent au développement local.

En production, l'API refuse de démarrer si `ADMIN_PASSWORD_HASH` est vide ou si `SESSION_SECRET` est resté à sa valeur de développement.

## Conventions

Les règles de code, de sécurité et de test sont dans [CLAUDE.md](CLAUDE.md). Le _pourquoi_ des choix techniques est dans [docs/adr](docs/adr/).
