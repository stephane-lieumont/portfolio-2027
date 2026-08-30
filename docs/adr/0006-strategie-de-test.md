# ADR-0006 — Stratégie de test et seuil de couverture à 80 %

- **Statut** : Accepted
- **Date** : 2026-08-30

## Contexte

Stéphane a fixé une exigence explicite : **80 % de couverture de tests unitaires**. Le portfolio est sa vitrine professionnelle — une régression visible en production est un coût de crédibilité, pas seulement un bug.

Le contexte de développement est particulier : un développeur seul, assisté d'agents IA qui écrivent une partie du code. Les tests jouent ici un double rôle. Ils protègent contre les régressions, et surtout ils **fixent l'intention** : un agent qui reprend le code six mois plus tard lit les tests pour comprendre le comportement attendu.

## Décision

**Deux runners, un par application**, chacun natif à son écosystème plutôt qu'un outil commun mal ajusté aux deux :

- `apps/web` : **Vitest**, via le builder `@angular/build:unit-test` d'Angular 22. Seuils configurés dans `angular.json`.
- `apps/api` : le **runner de test natif de Node** (`node --test`), avec sa couverture intégrée. Aucune dépendance de test à installer.

Le seuil est de **80 % sur les lignes, branches et fonctions**, appliqué globalement et non par fichier. Le dépassement du seuil fait **échouer la commande**, donc la CI.

Sont exclus de la couverture les fichiers sans logique à vérifier : `main.ts`, `app.config.ts`, et les fichiers de test eux-mêmes. Compter du code de câblage gonfle artificiellement le chiffre et affaiblit ce qu'il mesure.

`pnpm verify` à la racine enchaîne typecheck, lint, vérification du format et tests.

## Conséquences

Les tests s'exécutent sans navigateur, en jsdom côté web : rapides, donc réellement lancés pendant le développement plutôt que subis en fin de course.

Côté API, aucune dépendance de test dans `package.json`. Le runner Node fait le travail et une dépendance de moins est une dépendance de moins à maintenir.

Le seuil global plutôt que par fichier est un choix assumé : il évite d'écrire des tests de complaisance sur un fichier trivial juste pour franchir une barre, tout en gardant la contrainte d'ensemble.

En contrepartie : **80 % est un plancher, pas un objectif**. Un chiffre satisfait avec des tests qui n'assertent rien de significatif est pire qu'une couverture plus basse et honnête — il donne une fausse sécurité. La règle pratique est de tester le comportement observable, pas les détails d'implémentation, pour que les tests survivent aux refactorings.

Deux runners veulent dire deux syntaxes d'assertion (`expect` côté web, `node:assert` côté API). C'est le prix du choix natif de chaque côté, et il reste faible.

**Le boot complet de l'API dépend de MinIO** (le plugin `storage` vérifie l'existence du bucket au démarrage). Les tests d'intégration de routes exigent donc l'infra locale démarrée. Les tests purement unitaires, eux, n'en dépendent pas — c'est une raison de plus de garder la logique métier hors des plugins.

## Alternatives écartées

**Karma + Jasmine** — l'historique d'Angular, et ce qu'utilisait le portfolio 2022. Déprécié, et exige un vrai navigateur, ce qui alourdit chaque exécution.

**Jest sur les deux applications** — un seul outil, un seul vocabulaire. Écarté parce que Jest s'intègre mal avec le TypeScript natif de Node 22 et l'ESM, et qu'il faudrait une couche de transformation exactement là où on a choisi de ne pas avoir d'étape de build.

**Pas de seuil bloquant, la couverture en simple indicateur** — un seuil non bloquant se dégrade silencieusement. Stéphane a demandé 80 % ; la CI est le seul endroit où ce nombre reste vrai.

**Tests end-to-end (Playwright) dès maintenant** — utiles, mais ils testent des parcours qui n'existent pas encore. À reconsidérer une fois les pages construites, dans une ADR dédiée.
