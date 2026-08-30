---
name: new-adr
description: Crée une Architecture Decision Record locale dans docs/adr/ à partir du template du repo. À utiliser quand une décision structurante est prise sur Portfolio 2027 — choix de librairie, pattern d'architecture, modèle de données, stratégie d'infra ou de déploiement. Distinct du skill global "adr" qui publie sur Notion : celui-ci reste versionné dans le dépôt.
---

# Créer une ADR locale

Les ADR de ce repo vivent dans `docs/adr/` et sont versionnées avec le code. Une ADR fige le _pourquoi_ d'une décision, pour qu'on ne la rediscute pas six mois plus tard sans se souvenir des contraintes de l'époque.

## Quand écrire une ADR

Écris-en une quand la décision est **coûteuse à inverser** ou **surprenante pour un lecteur** : ajouter une dépendance structurante, changer de modèle de données, choisir une stratégie d'auth ou de cache, renoncer à une approche évidente pour une raison non évidente.

N'en écris pas pour un choix local et réversible — nommer une variable, découper un composant, ajouter un champ. La valeur d'un dossier d'ADR tient à sa densité : vingt ADR triviales enterrent les trois qui comptent.

## Procédure

1. Liste `docs/adr/` et prends le numéro suivant, sur 4 chiffres.
2. Copie `docs/adr/0000-template.md` vers `docs/adr/NNNN-titre-en-kebab-case.md`.
3. Remplis les sections. La plus importante est **Conséquences** — c'est celle qu'on relit. Elle doit inclure les inconvénients acceptés, pas seulement les bénéfices.
4. Dans **Alternatives écartées**, dis pourquoi chacune l'a été. Une alternative listée sans motif n'aide personne.
5. Statut `Accepted` si la décision est prise. Si une ADR antérieure est remplacée, passe-la en `Superseded by ADR-NNNN` et référence-la depuis la nouvelle.
6. Mets à jour `.claude/memory/tech-stack.md` si la décision change le socle technique.

## Ton

Écris au passé pour le contexte, au présent pour la décision. Sois franc sur les compromis : une ADR qui ne présente que des avantages n'a pas fait son travail d'analyse.
