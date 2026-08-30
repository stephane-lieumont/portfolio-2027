---
name: production-constraints
description: Contraintes de l'infrastructure de production — nginx, liens de démo proxyfiés, sauvegardes à double volet
metadata:
  type: project
---

# Contraintes de production

## Les liens de démo passent par nginx

`stephane-lieumont.fr` tourne derrière **nginx**, qui **redirige les liens de démo vers des projets hébergés séparément**. Les champs `demoUrl` ne sont pas de simples URL externes : ce sont des chemins que le proxy route vers d'autres applications.

**Pourquoi ça compte :** publier un projet avec un `demoUrl` dont la route nginx n'existe pas envoie le visiteur sur une erreur, depuis la vitrine. Le code ne peut pas détecter ce cas — seule une vérification côté infra le peut.

**Comment l'appliquer :** avant de publier un projet portant un lien de démo, vérifier que la route existe côté nginx. Ne jamais réorganiser les chemins `/demo/*` sans vérifier ce qui pointe dessus.

## La configuration nginx vit hors du dépôt

Le routage par chemin (`/api`, `/media`, `/demo`, repli `index.html`) est décrit dans l'ADR-0005, mais **la configuration réelle n'est pas versionnée ici**.

**Pourquoi ça compte :** un ordre de blocs `location` mal choisi peut faire disparaître l'API derrière le repli `index.html` — l'API renverrait alors du HTML au lieu du JSON attendu, et rien dans le code n'indiquerait la cause. C'est un point de défaillance unique invisible depuis le repo.

**Comment l'appliquer :** en cas de comportement inexplicable en production (réponse HTML sur une route d'API, média introuvable), suspecter nginx avant le code. Cette configuration mérite d'être sauvegardée avec le même soin que la base.

## La sauvegarde a deux volets

L'état du site vit dans **deux endroits distincts** : le fichier SQLite et le bucket MinIO.

**Pourquoi ça compte :** restaurer l'un sans l'autre laisse des projets pointant vers des médias absents, ou des médias orphelins. Les deux doivent être cohérents dans le temps.

**Comment l'appliquer :** toute procédure de sauvegarde ou de restauration traite les deux ensemble. Ni le fichier SQLite ni les médias ne sont dans le dépôt Git.

Voir [[tech-stack]] pour les contraintes d'exécution locales.
