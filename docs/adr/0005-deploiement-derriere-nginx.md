# ADR-0005 — Déploiement derrière le reverse proxy nginx existant

- **Statut** : Accepted
- **Date** : 2026-08-30

## Contexte

`stephane-lieumont.fr` tourne déjà derrière **nginx**, qui sert le portfolio et **redirige les liens de démo vers les projets hébergés séparément**. Le portfolio 2022 s'appuie sur ce mécanisme : les champs `demoLink` des projets pointent vers des chemins que nginx route vers d'autres applications.

Cette infrastructure fonctionne et n'est pas à remettre en cause. Portfolio 2027 s'y insère.

La contrainte nouvelle est qu'il y a désormais **trois choses à servir** au lieu d'une : les fichiers statiques Angular, l'API Fastify, et les médias MinIO — sans casser les liens de démo existants.

## Décision

Un seul domaine, nginx en frontal, routage par chemin :

| Chemin     | Destination                                                 |
| ---------- | ----------------------------------------------------------- |
| `/api/*`   | conteneur Fastify (port 3000)                               |
| `/media/*` | bucket MinIO en lecture                                     |
| `/demo/*`  | projets hébergés à part — **routes existantes, préservées** |
| `/*`       | fichiers statiques Angular, avec repli sur `index.html`     |

Angular appelle l'API en chemin relatif (`/api`, via le jeton `API_BASE_URL`) : **aucune URL absolue d'API dans le bundle**, donc pas de configuration à recompiler selon l'environnement, et pas de CORS en production puisque tout est de même origine.

L'API et MinIO tournent en conteneurs via `infra/docker-compose.yml`. Ils n'exposent pas de port publiquement : seul nginx les atteint.

Le repli sur `index.html` est nécessaire au routage côté client d'Angular, mais il ne doit **jamais** s'appliquer à `/api`, `/media` ou `/demo` — sinon une erreur d'API renverrait silencieusement du HTML à la place d'une réponse JSON, et le bug serait pénible à diagnostiquer.

## Conséquences

Même origine pour tout : pas de CORS en production, cookie de session naturellement transmis, aucune configuration d'URL par environnement dans le front.

Les liens de démo continuent de fonctionner sans y toucher, ce qui était la contrainte non négociable.

Un seul certificat TLS, terminé par nginx ; les services internes parlent en HTTP sur le réseau Docker.

En contrepartie : la configuration nginx devient un point de défaillance unique et **vit en dehors du dépôt** — un ordre de blocs `location` mal choisi peut faire disparaître l'API derrière le repli `index.html`, et rien dans le code ne l'indiquerait. Cette configuration mérite d'être sauvegardée avec le même soin que la base.

Le développement local, lui, est en origines croisées (Angular sur 4200, API sur 3000) : CORS y est donc actif et configuré via `WEB_ORIGIN`. Le développement et la production diffèrent sur ce point, ce qu'il faut garder en tête en cas de bug de cookie ou d'en-tête.

## Alternatives écartées

**Un sous-domaine pour l'API (`api.stephane-lieumont.fr`)** — plus net conceptuellement, mais cela réintroduit CORS en production et complique le cookie de session (cookie de domaine parent, `sameSite` à revoir). Aucun bénéfice pour un site mono-domaine.

**Servir Angular par Fastify** — un service de moins, mais Node servirait des fichiers statiques que nginx sert mieux, et il faudrait de toute façon nginx devant pour TLS et les redirections de démo.

**Un hébergement de site statique (Vercel, Netlify) pour le front** — excellent pour le front seul, mais le back et MinIO resteraient à héberger ailleurs, et les liens de démo dépendent du nginx actuel. On se retrouverait avec deux infrastructures pour un seul site.
