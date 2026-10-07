# Escape OS

Mini escape game pédagogique : remonter le temps des systèmes d'exploitation, des cartes perforées des années 1960 jusqu'à 2026.

À chaque époque, le joueur doit trouver le geste qui fait passer à la suivante : trier des cartes, enchaîner des commandes Unix, passer de `A:` à `C:` sous DOS, déplacer une fenêtre, envoyer un « Wizz »… jusqu'au retour au présent, où un agent IA le félicite.

> **Statut : jouable.** Les 10 époques, le HUD, le carnet, les indices, les fiches et le saut temporel sont en place.

## Jouer

Le jeu est une page statique : il suffit de servir le dossier (les modules ES ne se chargent pas en `file://`).

```sh
npx serve .
# ou
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`. Le jeu dure de 25 à 35 minutes, se joue à la souris, au clavier ou au doigt, et se sauvegarde tout seul dans le navigateur.

## Le parcours

| # | Époque | Système | Geste |
| --- | --- | --- | --- |
| 0 | Années 1960 | Cartes perforées | Trier le paquet, puis le donner au lecteur |
| 1 | 1974 | Unix sur télétype | Relier deux commandes avec un pipe |
| 2 | 1981 | MS-DOS | Changer de lecteur, puis lancer `WIN` |
| 3 | 1992 | Windows 3.1 | Déplacer une fenêtre, double-cliquer |
| 4 | 1995 | Windows 95 | Démarrer pour arrêter, puis le bouton du boîtier |
| 5 | 1998 | Windows 98 | Se connecter par modem, taper une adresse |
| 6 | 2001 | Windows XP | Envoyer un Wizz |
| 7 | 2006 | Ubuntu | Passer administrateur avec `sudo` |
| 8 | 2007 | Smartphone | Glisser, pincer, composer un numéro |
| 9 | 2026 | Agent IA | Plus besoin de syntaxe : il suffit de demander |

Le détail de chaque écran est dans le [scénario](docs/scenario.md). Une salle annexe, hors parcours, se cache aussi quelque part sur le disque dur de 1981…

## Pour les curieux et les enseignants

- **Carnet du voyageur** : chaque indice trouvé s'y note tout seul (le mot de passe de 2006 vient de 1974).
- **Indices progressifs** : trois niveaux, proposés après 60 secondes sans progrès ou trois erreurs.
- **Mode visite** : depuis la frise du HUD ou l'écran titre, accès direct à chaque époque.
- **Mode classe** : toutes les fiches « Le saviez-vous ? » sur une page imprimable (menu ⋯).
- **Making-of** : les choix techniques expliqués, avec un extrait de code par effet ([making-of.html](making-of.html)).

## Raccourcis de développement

- `?screen=5` ouvre directement un écran (de 0 à 9).
- `?debug` affiche la solution de l'écran courant et des boutons pour passer d'un écran à l'autre.

## Architecture

```text
escape-os/
├── index.html            page unique : écran titre, HUD, scène
├── making-of.html        coulisses techniques
├── css/
│   ├── base.css          jetons, typographies, HUD, panneaux, fenêtres modales
│   ├── frame.css         cadre matériel de chaque époque
│   ├── crt.css           effets cathodiques
│   ├── jump.css          saut temporel, odomètre, ouverture
│   ├── ui/               terminal et gestionnaire de fenêtres
│   └── eras/             un thème par époque, chargé à la demande
├── js/
│   ├── main.js           démarrage, écran titre, ?screen= et ?debug
│   ├── core/             routeur, état, saut, audio, HUD, scène, indices
│   ├── ui/               terminal, fenêtres, gestes, pixel art, icônes
│   ├── screens/          00-cards.js … 09-agent.js, un module par écran
│   └── data/             époques, fiches et indices
└── assets/               polices (et leurs licences), favicon, image de partage
```

Chaque écran exporte `{ id, era, year, decor?, mount(root, ctx) }` ; `mount` renvoie sa fonction de nettoyage. Le contexte `ctx` fournit `complete()`, `progress()`, `error()`, `note()`, `hints`, `audio`, `wait()` et quelques utilitaires. Le [plan d'implémentation](docs/plan-implementation.md) détaille l'architecture et la direction artistique.

## Principes techniques

- HTML, CSS et JavaScript natifs : zéro dépendance, pas d'étape de build.
- Un module ES par écran, chargé à la demande avec `import()`.
- Effets d'écran cathodique en CSS, sons synthétisés en Web Audio.
- Pointer Events pour la souris et le doigt, animations FLIP, pincement au trackpad (`wheel` + `ctrlKey`).
- Recréations « dans l'esprit » : aucun logo, fond d'écran ni son d'origine.
- Accessibilité : alternatives clavier à chaque geste, sorties des terminaux annoncées aux lecteurs d'écran, `prefers-reduced-motion` respecté.

## Crédits

- [Inter](https://rsms.me/inter/) — The Inter Project Authors, SIL Open Font License 1.1.
- [Courier Prime](https://quoteunquoteapps.com/courierprime/) — The Courier Prime Project Authors, SIL Open Font License 1.1.
- [Px437 IBM VGA 8x16](https://int10h.org/oldschool-pc-fonts/) — VileR, Ultimate Oldschool PC Font Pack, CC BY-SA 4.0.

Les licences complètes sont dans [assets/fonts/LICENSES](assets/fonts/LICENSES). Les noms de systèmes et de logiciels cités appartiennent à leurs propriétaires respectifs ; ils servent ici à raconter leur histoire.
