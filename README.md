# Escape OS

Mini escape game pédagogique : remonter le temps des systèmes d'exploitation, des cartes perforées des années 1960 jusqu'à 2026.

À chaque époque, le joueur doit trouver le geste qui fait passer à la suivante : trier des cartes, enchaîner des commandes Unix, passer de `A:` à `C:` sous DOS, déplacer une fenêtre, envoyer un « Wizz »… jusqu'au retour au présent, où un agent IA le félicite.

> **Statut : conception.** Les documents ci-dessous décrivent le jeu ; le code arrive ensuite.

## Le parcours

Cartes perforées → Unix sur télétype → MS-DOS → Windows 3.1 → Windows 95 → Windows 98 → Windows XP → Ubuntu → smartphone tactile → agent IA (2026)

## Documents

- [Scénario](docs/scenario.md) : les 10 écrans, l'action attendue à chacun, les indices et les fiches « Le saviez-vous ? ».
- [Plan d'implémentation](docs/plan-implementation.md) : architecture, direction artistique, composants partagés et étapes de réalisation.

## Principes techniques

- HTML, CSS et JavaScript natifs : zéro dépendance, pas d'étape de build.
- Un module ES par écran, chargé à la demande.
- Effets d'écran cathodique en CSS, sons synthétisés en Web Audio.
- Recréations « dans l'esprit » : aucun logo, fond d'écran ni son d'origine.
