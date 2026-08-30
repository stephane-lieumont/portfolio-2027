# ADR-0003 — Stockage des médias dans MinIO, uploads présignés

- **Statut** : Accepted
- **Date** : 2026-08-30

## Contexte

Le portfolio expose des renders 3D et des captures de projets : ce sont les fichiers les plus lourds du site, et son contenu le plus important puisque c'est le travail de Stéphane qui est vendu.

En 2022, les images étaient importées en dur dans le bundle React. Ajouter un projet exigeait un commit et un redéploiement, et chaque image alourdissait la compilation. Le nouveau back-office doit permettre d'ajouter un projet sans toucher au code.

Stocker les binaires dans SQLite serait techniquement possible et pratiquement mauvais : la base gonflerait, les sauvegardes deviendraient lourdes, et l'API servirait des octets qu'un serveur de fichiers sert mieux.

## Décision

**MinIO** (compatible S3) pour tous les médias, en conteneur aux côtés de l'API.

Les uploads passent par des **URL présignées** : l'API délivre un ticket, le navigateur pousse le fichier directement vers MinIO, puis confirme l'upload à l'API qui enregistre les métadonnées. **Le fichier ne transite jamais par le processus Node.**

En base, on ne stocke qu'une **clé d'objet**, jamais une URL absolue. L'URL publique est reconstruite à la lecture depuis `MEDIA_PUBLIC_URL`.

## Conséquences

L'API ne fait pas de proxy de fichiers : pas de mémoire consommée par des renders de plusieurs mégaoctets, pas de timeout sur les gros uploads. C'est le principal gain.

Stocker la clé plutôt que l'URL rend l'origine des médias déplaçable — passer MinIO derrière un autre domaine ou un CDN ne demande qu'un changement de variable d'environnement, sans migration de données. Une URL absolue en base aurait figé cette décision pour toujours.

Compatible S3 : si l'hébergement change un jour, le code reste, seule la configuration bouge.

En contrepartie : un service de plus à faire tourner et à sauvegarder, et la sauvegarde du site devient double — le fichier SQLite **et** le bucket. Les deux doivent être cohérents ; une restauration partielle laisse des projets pointant vers des médias absents.

Les URL présignées ont une durée de vie courte et le client doit gérer leur expiration. Le flux d'upload en deux temps est plus complexe qu'un simple POST multipart, et un ticket délivré puis abandonné laisse une ligne orpheline en base : il faudra un nettoyage périodique.

Le bucket doit être en lecture publique pour les médias publiés, mais **jamais en écriture publique**. Cette distinction est la seule chose qui empêche n'importe qui de déposer des fichiers dans le stockage du site.

## Alternatives écartées

**Système de fichiers local servi par nginx** — plus simple, sans service supplémentaire. Écarté parce que les médias seraient liés à la machine : pas de séparation entre stockage et calcul, et une migration d'hébergement deviendrait un déplacement manuel de fichiers.

**Un service S3 managé (AWS, Scaleway, Cloudflare R2)** — zéro administration, mais un coût mensuel et une dépendance externe pour un projet personnel. MinIO garde la porte ouverte : le code étant compatible S3, la bascule reste possible sans réécriture.

**Upload en multipart à travers l'API** — plus simple à implémenter, mais Node porte alors tout le poids des fichiers, avec les limites de taille et les timeouts qui vont avec. Mauvais compromis pour des renders 3D.

**Images dans le dépôt Git** — le mode actuel. Le dépôt grossit indéfiniment, et publier un projet reste un acte de développeur alors que l'objectif est précisément de s'en affranchir.
