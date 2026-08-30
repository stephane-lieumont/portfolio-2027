---
name: add-project
description: Ajoute un projet au portfolio de bout en bout — rédaction du contenu, upload des visuels vers MinIO, création via l'API, vérification de l'affichage. À utiliser quand Stéphane veut publier une nouvelle réalisation dev ou 3D, ou mettre à jour un projet existant.
---

# Ajouter un projet au portfolio

Un projet se compose de **texte** (rédigé), de **médias** (uploadés vers MinIO) et d'une **entrée en base** (créée via l'API). Les trois doivent être cohérents avant publication.

## Avant de commencer

Vérifie que l'environnement tourne :

```bash
pnpm infra:up && pnpm dev:api
```

Le modèle de données fait autorité dans `packages/shared-types/src/project.ts`. Si un champ te manque pour décrire le projet, **ne le bricole pas dans une chaîne existante** : modifie le schéma partagé, puis le schéma Drizzle (`apps/api/src/db/schema.ts`), génère la migration (`pnpm --filter @portfolio/api db:generate`) et note-le. Un champ détourné de son usage est une dette qu'on paie au projet suivant.

## Étapes

**1. Le contenu.** Délègue la rédaction à l'agent `communication-expert`. Il lui faut : le contexte du projet, le rôle exact de Stéphane, les étapes concrètes, les technos, les dates. Ne remplis jamais un trou par une supposition — demande.

**2. Les médias.** Chaque projet a une image de couverture et, souvent, une galerie. Le flux d'upload passe par une URL présignée : l'API délivre un ticket (`POST /media/upload-ticket`), le fichier part directement vers MinIO, puis l'upload est confirmé (`POST /media/confirm`). Renseigne un `alt` réel sur chaque média — c'est une obligation d'accessibilité et le lint template la vérifie côté web.

Pour les renders 3D, surveille le poids : ce sont les fichiers les plus lourds du site et la principale menace pour les performances.

**3. La création.** Appelle l'API en `POST /projects` avec un payload conforme à `createProjectInputSchema`. Le `slug` est kebab-case et définitif : il devient l'URL publique, donc le changer casse les liens existants et le référencement.

Statut `draft` d'abord. On passe en `published` après relecture, pas avant.

**4. La vérification.** Affiche le projet dans l'application (`pnpm dev:web`) et contrôle : les images se chargent, le texte ne déborde pas, le lien de démo répond.

## Le cas des liens de démo

`demoUrl` pointe vers des projets hébergés à part, **redirigés par le reverse proxy nginx** (voir `docs/adr/0005`). Un lien de démo n'est pas une simple URL externe : vérifie que la route nginx correspondante existe réellement avant de publier, sinon le visiteur atterrit sur une erreur depuis la vitrine.
