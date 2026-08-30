# ADR-0007 — Doctrine sur les librairies tierces

- **Statut** : Accepted
- **Date** : 2026-08-30

## Contexte

Stéphane a posé une règle claire : quand une brique est **fastidieuse à construire à la main**, chercher une librairie plutôt que réinventer. Il cite trois cas — la **galerie d'images**, le **carrousel pleine largeur**, l'**envoi des emails de contact**.

Ces trois-là ont un point commun : ce sont des problèmes déjà résolus, avec des pièges non évidents. Une galerie « simple » doit gérer le clavier, le focus piégé dans la lightbox, le zoom tactile, le préchargement, l'annonce aux lecteurs d'écran. Un carrousel maison finit presque toujours inaccessible. Un envoi d'email direct depuis le front expose une clé.

À l'inverse, empiler des dépendances a un coût réel sur un site vitrine : chaque kilo-octet retarde l'affichage des renders 3D, qui sont le vrai contenu.

## Décision

Une librairie s'ajoute quand elle satisfait **tous** les critères suivants :

1. Le problème est fastidieux **ou** truffé de pièges d'accessibilité.
2. La librairie est maintenue, compatible Angular 22 zoneless, et sans dépendance à `zone.js`.
3. Son poids est proportionné à ce qu'elle apporte, mesuré sur le bundle réel.
4. Elle ne rend pas la main sur le style : le design doit rester pilotable par nos tokens.

Aucune librairie n'est retenue par défaut pour ces trois besoins **avant la phase de specs** : le choix se fait quand le besoin précis est arrêté, et se documente alors dans une ADR dédiée.

Ce qui est en revanche déjà tranché :

- **Animation** : pas de librairie par défaut. CSS, View Transitions et Web Animations couvrent le besoin (voir l'agent `motion-design-expert`). GSAP, utilisé en 2022, n'est pas reconduit sans justification.
- **Formulaires** : les Reactive Forms d'Angular, sans surcouche.
- **Requêtes HTTP** : `HttpClient`, pas d'axios.
- **Validation** : Zod, déjà présent via `@portfolio/shared-types`.

Sur l'**email de contact**, un point de sécurité prime sur le confort : **l'envoi passe obligatoirement par l'API**, jamais directement depuis le navigateur. Le portfolio 2022 utilisait EmailJS côté client, ce qui expose la clé publique du service à quiconque ouvre les sources — et donc au spam via ce compte. Le formulaire poste vers l'API, qui valide, limite le débit, puis relaie. La clé du fournisseur reste côté serveur.

## Conséquences

Le bundle reste maîtrisé, et chaque dépendance présente est justifiée par écrit — un lecteur qui découvre le repo peut savoir pourquoi elle est là.

Reporter le choix des librairies après les specs évite d'installer un carrousel avant de savoir ce qu'il doit afficher, puis de le remplacer.

En contrepartie : ce choix devra être fait, et il coûtera du temps d'évaluation au moment où le besoin sera clair. Et certaines briques seront écrites à la main là où une librairie aurait fait l'affaire — c'est acceptable tant que l'accessibilité est tenue.

Faire transiter l'email par l'API ajoute une route à écrire et à protéger, là où EmailJS ne demandait que quelques lignes côté client. C'est le coût direct de ne pas exposer une clé, et il est assumé.

## Alternatives écartées

**Un framework de composants complet (Angular Material, PrimeNG)** — tout est là et accessible. Écarté parce qu'un portfolio de graphiste 3D ne peut pas ressembler à une application d'entreprise : le design est ici un argument de vente, et repartir d'un système visuel préexistant pour le désapprendre ensuite coûte plus cher que de partir des tokens.

**Zéro dépendance, tout à la main** — séduisant sur le papier, mais c'est ainsi qu'on livre une lightbox qui ne se ferme pas à la touche Échap et un carrousel invisible aux lecteurs d'écran.

**Garder EmailJS depuis le front** — le plus rapide, et exactement ce que cette ADR refuse : une clé de service publiée dans le bundle.
