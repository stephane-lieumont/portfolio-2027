---
name: design-system
description: Direction artistique de Portfolio 2027 — relevé du site actuel, ce qu'on garde, ce qu'on modernise, tokens
metadata:
  type: project
---

# Direction artistique

## Le brief, dans les mots de Stéphane

Il est **globalement satisfait du rendu actuel** de stephane-lieumont.fr, mais le trouve **en manque de modernité**. La refonte est une remise à niveau, pas une table rase — se tromper de niveau d'ambition ici, c'est jeter ce qui marche.

Il demande explicitement de **parcourir le site actuel, en respecter le design et le moderniser, en révisant le wording**.

## Relevé de l'existant (audit du 2026-08-31)

### Le site est clair, pas sombre

Erreur d'hypothèse corrigée : l'accueil et la section Développeur sont en **thème clair** (fond blanc, texte `#242424`). Seule la **section Graphisme 3D passe en sombre** (`#242424`), pour laisser les renders dominer.

**C'est une bonne décision de design, à conserver et à assumer davantage** : le thème suit la nature du contenu. Le code l'exprime par deux classes sur `<main>` — `theme-ligth` (faute incluse) et `theme-dark` — qui recolorent à la main.

### Palette réelle

| Rôle                      | Valeur                                              |
| ------------------------- | --------------------------------------------------- |
| Accent primaire           | `#f2a154` (orange sable) — écrit **40 fois en dur** |
| Texte principal           | `#242424` — sert aussi de fond à la section 3D      |
| Texte secondaire          | `#7e7d7d`                                           |
| Accent clair (hover)      | `#fad8b8`, `#fcecdd`, `hsla(29,87%,85%,.9)`         |
| Accent foncé              | `#c28143`                                           |
| Fond footer               | `#464646`                                           |
| Fond section Réalisations | `#f9f9f9`                                           |
| Erreur / succès           | `#cc4534` / `#1aa260`                               |

**Zéro custom property CSS** dans tout le site. Aucun `prefers-color-scheme`.

### Typographie

`html { font-size: 62.5% }` (1rem = 10px). **Open Sans** partout, **Poppins** sur le seul `<h1>` du header, et **Arial sur tous les boutons** — parce que `.button` ne déclare pas de `font-family` et hérite du user-agent. Le couple Poppins/Open Sans est le duo par défaut des templates 2018.

**11 tailles entre 9,6 px et 28 px, sans ratio** : corps à 14 px, `h2` du hero à 25,2 px, `h1` à 28 px — et ce 28 px n'est qu'un `2em` par défaut du navigateur, pas une décision. `line-height: normal` presque partout, aucun `letter-spacing`, un seul `clamp()` dans tout le CSS.

### Espacement, rayons, ombres

Aucun système : px, em et rem mélangés ; gouttières en `%` sur la grille projets (34,8 px à 1160 px, 57,6 px à 1920 px) et en `px` sur la galerie 3D. **Quatre rayons sans échelle** (`2em`, `10px`, `5px`, `3px`). **Une seule ombre** (`0 8px 24px hsla(210,8%,62%,.2)`) pour tout le site.

**Pas de largeur maximale de contenu** hors la page Contact : à 1920 px, les paragraphes s'étirent sur 1800 px.

### Motion

C'est la partie la plus travaillée du site — 29 `@keyframes`, système `.reveal` maison, entrée d'accueil en panneau qui se rétracte. Mais les cascades sont linéaires et sans plafond : le hero met **1,2 s** à se composer, la 16ᵉ tuile de la galerie arrive **2,4 s** après la première. **Aucun `prefers-reduced-motion`.**

## Acquis à préserver

- **Accent orange `#f2a154`** comme signature de marque.
- **Le thème suit le contenu** : clair pour le dev, sombre pour la 3D.
- **Fond plein écran** (render ou vidéo) au premier contact.
- **Double parcours dev / 3D** dès l'accueil — Stéphane a confirmé le 2026-08-31 vouloir **garder deux parcours séparés**, pas une liste unifiée avec filtre.
- Sections : Accueil, Développeur, Graphisme 3D, Contact, plus un CV téléchargeable.
- **Le soin apporté au mouvement** — à recalibrer, pas à supprimer.

## Abandonné

- **La citation d'ouverture** (« La passion est un désir qui se mue en plaisir », attribuée à Romain Guilleaumes). Tranché par Stéphane le 2026-08-31 : elle est de trop. L'audit confirme le problème de forme — l'attribution en 9,6 px collée sous le `<h1>` « Stéphane Lieumont » se lit comme une erreur d'identité.

## Défauts fonctionnels à corriger en priorité

Ce ne sont pas des questions de goût : le site perd des informations et des visiteurs.

1. **Tout le contenu éditorial des cartes est en `:hover`**, sans `@media (hover:hover)`. Sur mobile, les Réalisations sont **six captures anonymes** — ni titre, ni techno, ni année. Idem pour les 16 tuiles 3D.
2. **Le contact est inatteignable depuis la navigation sur mobile** : les boutons Contact et CV sont en `display:none` sous 1200 px, et le menu burger ne contient pas de lien Contact.
3. **Le hover des boutons dégrade le contraste** (pêche sur pêche, ≈ 2:1) : l'état survolé est moins lisible que l'état repos. Échec WCAG.
4. **Accueil à 3,46 Mo**, dont **2,88 Mo pour un MP4 en autoplay empaqueté dans le build**. Portrait chargé deux fois, logos en base64, aucun WebP/AVIF, aucun `srcset`, aucun `loading="lazy"`.
5. **Le header transparent fixe** passe au-dessus des logos colorés de la section Développeur : le titre devient illisible.
6. **Navigation principale enfermée dans un burger même à 1920 px.**
7. **Hiérarchie typographique qui s'écrase en mobile** : le corps monte à 16 px pendant que les titres tombent à 19,2 px — le rapport passe de 1,7× à 1,2×.

## Principe directeur

**Le design est le cadre, les images sont le produit.** Si un élément d'interface rivalise avec un render, c'est l'élément qui a tort.

## Contraintes fermes

- **Contraste AA minimum**, états de survol inclus — c'est précisément là que le site actuel échoue.
- Tout par **tokens CSS custom properties**, aucune valeur en dur.
- **Aucune information éditoriale accessible uniquement au survol.**
- Le site est **en français** : ne jamais caler une largeur sur un mot anglais court.

## État des tokens

À arrêter en phase de specs avec l'agent `design-expert`, à partir du relevé ci-dessus. Pistes déjà identifiées : ancrer le corps à 16–18 px et ouvrir le hero avec un `clamp()`, poser une échelle typographique à ratio nommé, une échelle d'espacement, trois rayons maximum, deux ou trois couches d'ombre teintées, et une largeur maximale de contenu.

Voir [[tech-stack]] pour les contraintes d'implémentation et [[content-guidelines]] pour l'éditorial.
