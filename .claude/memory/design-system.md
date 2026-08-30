---
name: design-system
description: Direction artistique de Portfolio 2027 — ce qu'on garde du site actuel, ce qu'on modernise, et les tokens en vigueur
metadata:
  type: project
---

# Direction artistique

## Le brief, dans les mots de Stéphane

Il est **globalement satisfait du rendu actuel** de stephane-lieumont.fr, mais le trouve **en manque de modernité**. La refonte est donc une remise à niveau, pas une table rase — se tromper de niveau d'ambition ici, c'est jeter ce qui marche.

Il demande explicitement de **parcourir le site actuel, en respecter le design et le moderniser, en révisant le wording**.

## Acquis à préserver

- **Thème sombre**, qui laisse les renders 3D occuper l'écran.
- **Accent orange** comme signature de marque.
- **Fond plein écran** (render ou vidéo) au premier contact.
- **Double parcours dev / 3D** proposé dès l'accueil, avec deux boutons distincts.
- Navigation minimaliste : Accueil, Développeur, Graphisme 3D, Contact, plus un CV téléchargeable.
- Une **citation personnelle** en ouverture — touche humaine assumée, à ne pas raboter au nom du professionnalisme.

## Principe directeur

**Le design est le cadre, les images sont le produit.** Si un élément d'interface rivalise avec un render, c'est l'élément qui a tort. C'est la règle qui tranche les arbitrages visuels sur ce projet.

## Contraintes fermes

- **Contraste AA minimum.** L'orange sur fond sombre passe rarement en petit corps de texte : vérifier, jamais supposer.
- Tout par **tokens CSS custom properties**, aucune valeur en dur dans les composants.
- **Thème clair et sombre** supportés par les tokens, le sombre restant le défaut.
- Le site est **en français** : les libellés sont plus longs qu'en anglais, ne jamais caler une largeur sur un mot anglais court.

## État des tokens

Non définis à ce stade. Ils seront arrêtés pendant la phase de specs, avec l'agent `design-expert`, à partir du relevé du site actuel. Cette section est à remplir à ce moment-là — palette, échelle typographique, échelle d'espacement, rayons, élévations.

Voir [[tech-stack]] pour les contraintes d'implémentation et [[content-guidelines]] pour l'éditorial.
