# ADR-0004 — Authentification administrateur : compte unique, session par cookie

- **Statut** : Accepted
- **Date** : 2026-08-30

## Contexte

Le back-office permet de créer et modifier des projets et d'uploader des médias. Il sera exposé sur internet, comme le reste du site, derrière le reverse proxy nginx existant.

Il n'y a **qu'un seul utilisateur, et il n'y en aura jamais d'autre** : Stéphane. Pas d'inscription, pas de rôles, pas de mot de passe oublié à gérer par email, pas d'invitation.

Rien ne serait plus coûteux — et plus risqué — que de plaquer ici un système d'authentification complet conçu pour du multi-utilisateur : plus de code d'authentification veut dire plus de surface d'attaque, pour un bénéfice nul.

## Décision

Un **compte administrateur unique** défini par variables d'environnement : `ADMIN_EMAIL` et `ADMIN_PASSWORD_HASH`.

Le mot de passe est haché en **argon2** et n'existe en clair nulle part. Le hash est généré hors ligne par `pnpm --filter @portfolio/api admin:hash` et déposé dans l'environnement de production.

La session est un **cookie signé, `httpOnly`, `sameSite=lax`, `secure` en production**, d'une durée limitée (`SESSION_TTL_HOURS`, 12 h par défaut). Le secret de signature vient de `SESSION_SECRET`.

`loadConfig()` **refuse de démarrer en production** si `ADMIN_PASSWORD_HASH` est vide ou si `SESSION_SECRET` est resté à sa valeur de développement. Une mauvaise configuration doit faire échouer le déploiement, pas ouvrir le back-office.

Toutes les routes d'écriture passent par le garde `requireAdmin`. Les routes de lecture publiques restent ouvertes.

## Conséquences

La surface d'authentification tient en un fichier (`apps/api/src/plugins/auth.ts`), ce qui la rend intégralement auditable d'un coup d'œil.

`httpOnly` met le cookie hors de portée de JavaScript : une faille XSS ne permet pas de voler la session. `sameSite=lax` couvre l'essentiel du CSRF pour un back-office sans requêtes cross-site. Aucun jeton n'est stocké dans `localStorage`, où il serait lisible par n'importe quel script.

En contrepartie : **changer le mot de passe demande de regénérer le hash et de redéployer**. Acceptable pour un usage personnel, mais c'est une friction réelle et assumée.

Le secret de session est global : le modifier invalide la session en cours — sans conséquence à un seul utilisateur.

Il n'y a **pas de révocation de session côté serveur** : un cookie volé reste valide jusqu'à son expiration. C'est le compromis d'une session sans état ; la durée de vie courte le borne.

Ce modèle ne s'étend pas au multi-utilisateur. C'est délibéré : si le besoin apparaissait, il faudrait une nouvelle ADR et un vrai magasin d'utilisateurs, pas une extension de celui-ci.

## Sécurité — points de vigilance permanents

Le back-office est limité en débit comme le reste de l'API (`@fastify/rate-limit`), ce qui borne le bruteforce. La réponse d'échec de connexion ne distingue jamais « email inconnu » de « mot de passe faux ».

`ADMIN_PASSWORD_HASH` et `SESSION_SECRET` ne sont **jamais** commités : `.env` est ignoré par git, et `.env.example` ne contient que des valeurs de développement explicitement marquées comme telles.

## Alternatives écartées

**JWT en en-tête Authorization** — le réflexe habituel, mais il impose de stocker le jeton côté client, et le seul emplacement accessible au JS (`localStorage`) est exactement celui qu'une XSS sait lire. Un cookie `httpOnly` est plus sûr pour une application web servie depuis le même domaine, et le JWT n'apporte rien ici : il n'y a ni API tierce ni service distribué à qui prouver une identité.

**Un fournisseur externe (Auth0, Clerk, Supabase Auth)** — robuste et sans code d'auth à maintenir, mais c'est une dépendance externe, un compte de plus et un coût potentiel, pour authentifier une seule personne.

**Authentification HTTP basique au niveau de nginx** — le minimum absolu, et cela fonctionnerait. Écarté parce que l'API ne saurait alors plus qui est connecté, l'expérience de connexion serait celle d'une popup navigateur, et la sécurité du back-office dépendrait entièrement d'une configuration d'infra vivant hors du dépôt.

**Table d'utilisateurs en base** — la structure classique, inutile ici : une table dont on sait qu'elle ne contiendra qu'une ligne, plus le code de gestion associé, contre deux variables d'environnement.
