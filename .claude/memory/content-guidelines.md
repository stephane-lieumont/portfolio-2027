---
name: content-guidelines
description: Ligne éditoriale du portfolio — ton, structure des textes de projet, SEO, et les corrections à apporter au wording actuel
metadata:
  type: project
---

# Ligne éditoriale

## Objectif du site

C'est la **vitrine de ce que Stéphane fait et de ce qu'il propose**. Le lecteur type — recruteur, CTO, client — accorde trente secondes avant de décider s'il continue. Chaque texte se juge à cette aune.

## Ton

Première personne, français, professionnel sans raideur. **Concret plutôt que grandiloquent** : « j'ai développé l'application mobile en Flutter » vaut mieux que « passionné par l'innovation ».

Interdits : superlatifs invérifiables, jargon marketing, emoji. Ne jamais inventer une compétence, un client, une date ou un chiffre — un portfolio qui exagère se retourne contre son auteur en entretien.

## Structure d'une description de projet

Héritée du site actuel, elle fonctionne et se conserve :

1. **Contexte** du projet — ce qu'était le produit.
2. **Mission de Stéphane** précisément — c'est ce qui intéresse le lecteur.
3. **Étapes concrètes** — les livrables réels.

Quand il a piloté, le dire. Quand il a exécuté, le dire aussi : l'honnêteté sur le périmètre est plus crédible qu'un rôle gonflé.

Chaque projet a un `summary` court pour les cartes et une `description` longue. **Le résumé n'est pas le premier paragraphe tronqué** : c'est un texte écrit pour son usage.

## SEO

`title` et `meta description` uniques par page, écrits pour un humain d'abord. « Stéphane Lieumont » doit figurer dans les titres : la recherche nominative amène l'essentiel du trafic d'un portfolio.

## Wording à revoir — relevé sur le site actuel

Stéphane a demandé une révision du wording. Points déjà identifiés :

### Fautes

| Où                       | Actuel                                                | Correct        |
| ------------------------ | ----------------------------------------------------- | -------------- |
| `h2` accueil, navigation | « Developpeur Fullstack »                             | Développeur    |
| Contact                  | « une question **où** juste un Hello World ? »        | ou             |
| Alt galerie 3D           | « **imeuble** photo-réaliste »                        | immeuble       |
| Alt galerie 3D           | « exterieur **photo-réalise** »                       | photo-réaliste |
| Titre galerie 3D         | « **Exterieur** »                                     | Extérieur      |
| Classes CSS              | `theme-ligth`, `header--ligth`, `homepage__rigthside` | light / right  |

### Contenu à retravailler

- **La citation d'ouverture disparaît** (voir [[design-system]]). L'accroche d'accueil est à réécrire pour dire directement ce que Stéphane fait et propose — c'est le premier texte que lit un recruteur, il doit travailler. Le sous-titre actuel « Développeur Fullstack & Graphiste 3D » est factuel mais dit _ce qu'il est_, pas _ce qu'il propose_.
- **« Après une reconversion dans le domaine il y a 5 ans »** — une formulation en années relatives se périme toute seule. Préférer une date.
- Le ton de la section Développeur est **tourné vers la légitimation** (« mon potentiel », « mes objectifs ») plutôt que vers la valeur apportée. C'est le réflexe du reconverti ; il n'a plus lieu d'être.
- Les **descriptions de projet sont nettement mieux écrites** que les pages de section — elles ont déjà la structure contexte → rôle → livrables. C'est le niveau à atteindre partout.
- **Mélange français/anglais irrégulier** : « lead developer », « Users Stories », « Roadmap produit », « Hello World », « Designed & Developed on React ». Trancher une règle et s'y tenir.
- **La section 3D n'a aucun texte de présentation** — que des images. Un client 3D n'a rien à lire.

### Incohérences factuelles

- Le pied de page affiche **« ©2026 »** alors que le dernier projet date de **2022** : le site paraît abandonné.
- « Designed & Developed on **React** » à mettre à jour après la migration Angular.
- Le CV téléchargeable s'appelle **`CV_LIEUMONT-stephane_2024_FrontEnd.pdf`** alors que le site se positionne « Fullstack ».
- Dates contradictoires entre carrousel et galerie 3D : « Escart Wild © 2015 » vs « Escart wild — 2014 » ; « Légos minions © 2015 » vs fichier `Lego-Minions-2016`.

### SEO cassé

- `og:image` = `//preview.jpg` — protocole-relatif sans hôte, donc **aucun aperçu au partage**.
- `og:description` ne parle **que du profil 3D** (« CG Artist Toulouse | Portfolio 3D — Zbrush, 3DSmax, Vray… ») alors que le site est mixte.
- `og:url` pointe sur `www.stephane-lieumont.fr` alors que le site est servi **sans `www`**.
- Une seule `meta description` globale, pas de canonical, pas de JSON-LD, et aucun rendu serveur : le contenu est injecté par JS.

## Éléments récurrents

CV téléchargeable, formulaire de contact, liens GitHub / LinkedIn / ArtStation. Sections : Accueil, Développeur, Graphisme 3D, Contact.

Les **pages de détail projet n'ont aucun lien sortant** : ni vers le projet en ligne, ni vers GitHub, ni vers le projet suivant. Le visiteur arrive dans un cul-de-sac.

Voir [[user-profile]] pour les éléments biographiques validés et [[design-system]] pour le cadre visuel.
