# Escape game — remonter le temps des OS

*Document de conception · 7 octobre 2026*

## Concept

Le joueur traverse 10 époques, des cartes perforées à 2026 : chaque système se quitte par un geste différent, et le dernier écran célèbre le retour au présent. Durée visée : 25 à 35 minutes.

**Fil narratif.** Un bug temporel a renvoyé le joueur dans les années 1960. Chaque machine cache la commande, le geste ou le réglage qui déclenche le saut vers l'époque suivante, jusqu'au retour en 2026.

**Titres de travail :** « Ctrl+Alt+Époque », « Reboot temporel », « Escape OS ».

**Y a-t-il plus ancien que DOS ? Oui :**

- **CP/M** (1974, Gary Kildall) : DOS lui reprend l'invite `A>` et beaucoup de commandes.
- **Unix** (1969, Bell Labs) : utilisé sur des terminaux qui imprimaient sur papier, les télétypes.
- **Le traitement par lots sur cartes perforées** (années 1950-60) : GM-NAA I/O (1956, IBM 704) est souvent cité comme le premier système d'exploitation.

Le scénario démarre donc par un prologue « cartes perforées », puis Unix, avant ton écran DOS. Pour démarrer directement sur DOS, les écrans 0 et 1 deviennent des bonus.

**Fil pédagogique :** chaque écran fait découvrir un mode d'interaction qui a changé notre rapport à la machine. Ordre physique, commande, aide, fenêtre, menu, adresse web, messagerie instantanée, droits d'administration, geste, et pour finir la simple conversation.

## Les 10 écrans en un coup d'œil

Une action différente par écran, du clavier au geste. Le dernier écran est une récompense, pas une épreuve.

| # | Époque | Système | Action pour sortir | Ce qu'on apprend |
| --- | --- | --- | --- | --- |
| 0 | Années 1960 | Traitement par lots, cartes perforées | Remettre un paquet de cartes dans l'ordre (glisser-déposer) | Programmer sans écran, attendre son résultat |
| 1 | Vers 1974 | Unix sur télétype | Enchaîner deux commandes avec un pipe | Des petits outils qu'on combine |
| 2 | 1981-1995 | MS-DOS | Lire l'aide, passer de A: à C:, taper `WIN` | Les lecteurs A:/C:, Windows 3.x lancé depuis DOS |
| 3 | 1992 | Windows 3.1 | Déplacer une fenêtre pour révéler une icône, double-cliquer | Fenêtres superposées, souris, double-clic |
| 4 | 1995 | Windows 95 | Cliquer sur « Démarrer » pour arrêter, puis sur le bouton du boîtier | Menu Démarrer, barre des tâches |
| 5 | 1998 | Windows 98 (étape éclair) | Se connecter par modem et taper une adresse web | Internet à la maison, navigateur intégré |
| 6 | 2001-2005 | Windows XP (étape éclair) | Envoyer un « Wizz » à un contact absent | Messagerie instantanée, XP grand public |
| 7 | Vers 2006 | Ubuntu (Linux) | Installer un paquet avec `sudo` et le mot de passe trouvé à l'écran 1 | Logiciel libre, droits admin, dépôts |
| 8 | 2007 | Smartphone tactile | Glisser pour déverrouiller, pincer pour zoomer, composer un numéro | Multitouch, gestes |
| 9 | 2026 | Agent IA | Aucune : écran de réussite, l'agent félicite le joueur | De la syntaxe exacte à l'intention |

## Mécaniques communes

Cinq mécaniques reviennent à chaque écran pour garder le jeu fluide, jouable et pédagogique.

- **Carnet du voyageur.** Un panneau latéral note automatiquement chaque indice trouvé : commande, mot de passe, numéro. Indispensable à l'écran 7, qui réutilise un mot trouvé à l'écran 1.
- **Indices progressifs.** Trois niveaux, proposés après 60 s sans progrès ou 3 erreurs : orientation, méthode, puis solution exacte. Un bouton « Indice » reste accessible en permanence.
- **Saut temporel.** Extinction façon écran cathodique, compteur d'années qui défile, puis bruitage de démarrage de l'époque suivante.
- **Fiche « Le saviez-vous ? ».** À chaque sortie, 3 ou 4 lignes : date, créateurs, ce qui a changé, ce qu'il en reste aujourd'hui. Le joueur peut la passer.
- **Anachronismes.** Une commande d'une autre époque (`ls` sous DOS, `dir` sous Unix) déclenche une réponse humoristique plutôt qu'une simple erreur.

**Accessibilité.** Chaque geste a une alternative : clavier pour le glisser-déposer, boutons +/− pour le pincement, clavier virtuel sur mobile pour les écrans en ligne de commande.

**Point de vigilance.** Sons de démarrage, logos et fonds d'écran d'origine sont protégés. Mieux vaut des recréations « dans l'esprit » que des copies.

## Écran 0 — Années 1960 : le paquet renversé

Le joueur doit remettre dans l'ordre un paquet de cartes perforées tombé par terre, puis le donner au lecteur de cartes.

- **Décor.** Une salle machine : armoires à bandes, un lecteur de cartes, une imprimante. Aucun écran : la seule réponse de la machine sera un listing papier.
- **Situation.** 8 cartes éparpillées au sol. Une note de l'opérateur : « Votre programme a été rejeté : cartes dans le désordre. »
- **Action attendue.** Glisser-déposer les cartes pour les classer selon le numéro imprimé au bout de chaque carte (colonnes 73 à 80). Deuxième piste visuelle : un trait de feutre tracé en diagonale sur la tranche du paquet ne redevient droit qu'une fois les cartes en ordre.
- **Validation.** Le paquet part dans le lecteur, l'imprimante crépite et sort un listing. Dernière ligne : « TERMINAL DISPONIBLE — SALLE 2 — 1974 ».
- **Indices.** 1 : « Chaque carte porte un numéro tout au bout. » 2 : « Classe-les du plus petit au plus grand, ou aligne le trait de feutre. » 3 : l'ordre exact.
- **Bonus.** Cliquer sur le paquet trié le fait retomber, avec la note « Les programmeurs traçaient ce trait diagonal justement pour ça. »
- **Ce qu'on apprend.** On programmait sans écran, une carte par ligne de code. On déposait son paquet et le résultat revenait parfois des heures plus tard : c'est le traitement par lots.

## Écran 1 — Vers 1974 : Unix sur télétype

Le joueur doit relier deux commandes par un pipe pour extraire une seule ligne d'un fichier beaucoup trop long.

- **Décor.** Un télétype imprime sur un rouleau de papier, caractère par caractère, avec le bruit de frappe. Invite : `$`.
- **Situation.** Le rouleau affiche `$` et une seule consigne : « tapez ls ».
- **Exploration.** `ls` liste deux fichiers : `journal` et `lisezmoi`. `cat lisezmoi` affiche : « Ici, chaque programme fait une seule chose. Pour chercher : grep. Pour relier : | ». `cat journal` déroule 500 lignes : le papier déborde et devient illisible (gag).
- **Action attendue.** `cat journal | grep sortie` (accepter aussi `grep sortie journal`). Le rouleau imprime une seule ligne : « sortie : la machine de 1981 vous attend. Mot à retenir : multics ».
- **Carnet.** Le mot « multics » s'y ajoute : c'est le mot de passe de l'écran 7.
- **Indices.** 1 : « Lis le fichier lisezmoi. » 2 : « grep cherche un mot ; le caractère | envoie le résultat d'une commande à la suivante. » 3 : la commande complète.
- **Erreurs.** Une commande inconnue reçoit pour toute réponse « ? », clin d'œil à l'éditeur ed, connu pour cette sobriété.
- **Ce qu'on apprend.** Unix naît en 1969 aux Bell Labs (Ken Thompson, Dennis Ritchie), avec le langage C. Le pipe arrive en 1973, sur une idée de Doug McIlroy. Son nom est un jeu de mots sur Multics, un système plus ancien ; macOS, Linux et Android héritent de ses idées.

## Écran 2 — 1981-1995 : MS-DOS

Le joueur doit lire l'aide, comprendre qu'il est sur la disquette, passer au disque dur et lancer Windows avec `WIN`.

- **Décor.** Écran noir, texte gris, curseur clignotant. Invite : `A:\>`. Au démarrage : « Tapez HELP pour obtenir la liste des commandes. »
- **Étape 1.** `HELP` affiche une liste simplifiée : DIR, CD, TYPE, CLS, VER, DATE et WIN (« lance Microsoft Windows »).
- **Étape 2, le piège.** `WIN` répond « Commande ou nom de fichier incorrect ». `DIR` ne montre que `LISEZMOI.TXT`, et `TYPE LISEZMOI.TXT` affiche : « Windows est installé sur le disque dur, pas sur cette disquette. »
- **Action attendue.** Taper `C:` pour changer de lecteur, puis `WIN`. Variante plus corsée : exiger `CD WINDOWS` avant `WIN`.
- **Indices.** 1 : « Regarde la lettre de l'invite : A:, c'est la disquette. » 2 : « Pour changer de lecteur, tape sa lettre suivie de deux-points. » 3 : `C:` puis `WIN`.
- **Bonus.** `ls` répond « On n'est pas sous Unix ici ! ». `VER` affiche la version. Ctrl+Alt+Suppr redémarre la machine et ramène à `A:\>`.
- **Ce qu'on apprend.** MS-DOS (1981) vient de 86-DOS, racheté par Microsoft, lui-même inspiré de CP/M. A: et B: étaient réservés aux disquettes, d'où le C: du disque dur, encore utilisé aujourd'hui. Windows 3.x n'était pas autonome : on le lançait depuis DOS.

**À propos de « winexec ».** WinExec était une fonction de programmation de Windows, pas une commande DOS. La vraie commande était `WIN` : plus juste pour un jeu pédagogique.

## Écran 3 — 1992 : Windows 3.1

Le joueur doit déplacer une fenêtre pour découvrir ce qu'elle cache, puis ouvrir l'icône trouvée d'un double-clic.

- **Décor.** Le Gestionnaire de programmes et ses groupes : Principal, Accessoires, Jeux. Ni barre des tâches, ni menu Démarrer.
- **Situation.** La fenêtre du Gestionnaire couvre presque tout l'écran. Un Post-it virtuel collé sur le bord du moniteur : « La sortie est derrière. »
- **Action attendue.** Attraper la fenêtre par sa barre de titre et la déplacer (ou la réduire). Sur le bureau apparaît l'icône `SAUT.EXE`. Un simple clic ne fait que la sélectionner : il faut un double-clic pour la lancer.
- **Indices.** 1 : « Et si quelque chose se cachait sous cette fenêtre ? » 2 : « Attrape-la par sa barre de titre bleue et fais-la glisser. » 3 : « Double-clique sur l'icône apparue. »
- **Bonus.** Le groupe Jeux contient un solitaire et un démineur jouables. On raconte souvent qu'ils servaient à apprivoiser la souris : glisser, viser, clic droit.
- **Ce qu'on apprend.** Windows 3.0 (1990) et 3.1 (1992) installent l'interface graphique sur les PC. Windows 1.0 posait les fenêtres côte à côte ; elles ne se superposent qu'à partir de Windows 2.0. La souris, inventée par Douglas Engelbart dans les années 1960, devient indispensable.

## Écran 4 — 1995 : Windows 95

Le joueur doit cliquer sur « Démarrer » pour éteindre l'ordinateur, puis appuyer sur le bouton d'alimentation du boîtier, hors de l'écran.

- **Décor.** Bureau bleu-vert, barre des tâches, bouton Démarrer en bas à gauche. Pour la première fois, le jeu dessine aussi le moniteur et l'unité centrale autour de l'écran.
- **Situation.** Une fenêtre de bienvenue : « Pour quitter cette époque, éteignez l'ordinateur. » Aucun bouton « Éteindre » sur le bureau.
- **Action 1.** Démarrer, puis Arrêter, puis confirmer. C'est le paradoxe resté célèbre : on clique sur « Démarrer » pour arrêter.
- **Action 2.** Écran noir, message orange : « Vous pouvez maintenant éteindre votre ordinateur en toute sécurité. » Le jeu attend un clic sur le bouton de l'unité centrale : l'action sort littéralement de l'interface.
- **Indices.** 1 : « Tout commence par... Démarrer. » 2 : « Le menu Démarrer contient aussi de quoi arrêter. » 3 : « L'ordinateur attend qu'on appuie sur son bouton. »
- **Bonus.** Le clic droit sur le bureau ouvre un menu contextuel, nouveauté de l'époque. Trois erreurs d'affilée déclenchent un écran bleu pour rire, avant de revenir au bureau.
- **Ce qu'on apprend.** Windows 95 (août 1995) introduit le menu Démarrer et la barre des tâches, toujours présents dans Windows 11. Il démarre directement en mode graphique, sans taper WIN, même si DOS reste présent en coulisses.

## Écran 5 — 1998 : Windows 98 (étape éclair)

Le joueur doit se connecter à Internet par modem, puis taper dans le navigateur l'adresse imprimée sur un CD d'abonnement.

- **Décor.** Bureau Windows 98 avec sa barre de lancement rapide et une icône « Connexion à Internet ». Autour de l'écran : un CD d'abonnement reçu par la poste, et un téléphone fixe.
- **Action attendue.** Double-cliquer sur « Connexion à Internet » : le modem compose le numéro, crisse, siffle, puis annonce une connexion à 56 000 bit/s. Le navigateur s'ouvre sur une page vide, et le joueur tape l'adresse lue sur la pochette du CD, par exemple `www.saut-temporel.98`.
- **Rythme.** Une seule action, 1 à 2 minutes. L'étape mise sur la nostalgie : bruit du modem, page qui s'affiche ligne par ligne.
- **Indices.** 1 : « Pour aller sur Internet, il faut d'abord se connecter. » 2 : « L'adresse est écrite sur la pochette du CD. » 3 : l'adresse exacte.
- **Bonus.** Si le joueur traîne, quelqu'un « décroche le téléphone » et la connexion coupe : il faut relancer. Autre gag possible : un écran bleu a surgi en public en avril 1998, pendant une démonstration de Windows 98 où l'on branchait un scanner USB.
- **Ce qu'on apprend.** Windows 98 (juin 1998) intègre le navigateur Internet Explorer au système, un point au cœur du procès antitrust contre Microsoft. On se connectait par la ligne téléphonique, impossible donc de téléphoner en même temps. Il popularise aussi l'USB.

## Écran 6 — 2001-2005 : Windows XP (étape éclair)

Le joueur doit réveiller un contact absent sur la messagerie instantanée en lui envoyant un « Wizz ».

- **Décor.** L'écran d'accueil affiche les comptes utilisateurs : un clic sur son nom ouvre la session. Bureau à colline verte et ciel bleu (image originale, pas le fond d'écran d'époque), barre des tâches bleue, bouton Démarrer vert.
- **Situation.** Une fenêtre de messagerie clignote en orange dans la barre des tâches. Un contact au statut « Absent » a laissé : « jte donne la sortie quand tu me réveilles lol ».
- **Action attendue.** Lui écrire ne suffit pas : il reste absent. Il faut cliquer sur le bouton « Wizz » : la fenêtre tremble, un son retentit, et le contact répond avec la sortie.
- **Rythme.** 1 à 2 minutes, à fond sur la nostalgie : pseudos à rallonge, smileys animés, son de connexion d'un contact.
- **Indices.** 1 : « Il ne lit pas ses messages... il faut attirer son attention. » 2 : « Cherche le bouton qui fait trembler la fenêtre. » 3 : « Clique sur Wizz. »
- **Ce qu'on apprend.** Windows XP (octobre 2001) apporte au grand public la base de Windows NT, plus stable. Il reste l'un des Windows les plus durables : son support ne s'arrête qu'en avril 2014. MSN Messenger (1999-2013) et son Wizz ont marqué toute une génération.

## Écran 7 — Vers 2006 : Ubuntu (Linux)

Le joueur doit installer le programme « sortie » avec le gestionnaire de paquets, en s'identifiant comme administrateur grâce au mot trouvé à l'écran 1.

- **Décor.** Un bureau Linux des années 2000 aux tons orangés, un terminal ouvert, un manchot dans un coin.
- **Étape 1.** `sortie` répond : « La commande 'sortie' est introuvable, mais peut être installée avec : sudo apt install sortie ». Ubuntu affiche réellement ce genre de suggestion.
- **Étape 2.** `apt install sortie` sans sudo répond : « Permission refusée. Êtes-vous administrateur ? »
- **Action attendue.** `sudo apt install sortie`, puis le mot de passe `multics`, noté dans le carnet. Une barre de téléchargement façon apt défile, puis `sortie` lance le saut.
- **Indices.** 1 : « Le terminal te souffle la commande. » 2 : « sudo veut dire : fais-le en tant qu'administrateur. » 3 : « Le mot de passe est dans ton carnet, écran 1. »
- **Bonus.** `cat journal | grep sortie` fonctionne encore, avec la réponse « Toujours là depuis 1974 ! ».
- **Ce qu'on apprend.** Linux (1991, Linus Torvalds) est un système libre de la famille Unix. Ses dépôts permettaient d'installer un logiciel d'une commande, bien avant les magasins d'applications. Il fait tourner aujourd'hui la plupart des serveurs web et le cœur d'Android.

## Écran 8 — 2007 : le smartphone tactile

Le joueur doit déverrouiller le téléphone d'un glissement, zoomer à deux doigts sur une photo pour lire un numéro minuscule, puis l'appeler.

- **Décor.** La page se réduit à un téléphone à écran tactile et bouton unique, icônes arrondies. Visuels originaux, sans logo de marque.
- **Étape 1.** « Glisser pour déverrouiller » : une glissière à tirer jusqu'au bout. Un clic simple ne fait rien.
- **Action attendue.** L'app Photos ne contient qu'une image : un panneau au loin, avec un texte illisible. Pincer pour zoomer révèle « Pour rentrer, appelez le 2026 ». Le joueur compose 2026 dans l'app Téléphone.
- **Pincement selon l'appareil.** Deux doigts sur mobile ; pincement du trackpad ou Ctrl + molette sur ordinateur (les navigateurs les transmettent comme un défilement avec Ctrl) ; boutons +/− en secours.
- **Indices.** 1 : « Ce texte est trop petit... et si on l'agrandissait ? » 2 : « Écarte deux doigts sur la photo. » 3 : « Compose 2026 dans l'app Téléphone. »
- **Ce qu'on apprend.** Le premier iPhone, présenté en janvier 2007, généralise l'écran multitouch et les gestes : glisser, pincer. L'App Store et Android arrivent en 2008, Android sur le noyau Linux. Le doigt remplace la souris pour une grande partie des usages.

## Écran 9 — 2026 : l'agent IA, écran de réussite

Plus d'épreuve ici : le joueur est rentré en 2026, et un agent IA simulé le félicite en retraçant son voyage.

- **Décor.** Une interface de conversation épurée. L'agent écrit son message caractère par caractère, clin d'œil au télétype de 1974.
- **Message de l'agent.** Des félicitations, puis le rappel des 9 gestes du voyage : trier, relier, changer de lecteur, double-cliquer, éteindre, se connecter, wizzer, passer administrateur, pincer. Il conclut : « Aujourd'hui, plus besoin de syntaxe : il suffit de demander. »
- **Statistiques.** Temps total, indices utilisés, erreurs. Un titre selon le score : « Gourou système » sans indice, « Archéologue du numérique » jusqu'à 5 indices, « Touriste temporel » au-delà.
- **Suite de la conversation.** 3 ou 4 réponses proposées en boutons : « Rejouer », « Revoir les fiches », « Partager mon score », « Quelle sera la prochaine interface ? ». L'agent répond par des textes écrits à l'avance.
- **Simulation.** Aucun modèle de langage nécessaire : messages scénarisés, effet de frappe, court délai « l'agent réfléchit… » pour l'illusion. Un champ libre peut reconnaître quelques mots-clés.
- **Bonus.** Taper `WIN`, `sudo` ou `ls` dans le champ : l'agent répond en souriant que ces réflexes ne servent plus, en citant l'époque d'origine.
- **Ce qu'on apprend.** Les interfaces sont passées de la commande exacte à l'intention. Et la boucle est bouclée : on tape de nouveau du texte dans une invite, comme en 1974.

## Écrans bonus et extensions

Cinq pistes pour enrichir le parcours sans casser l'enchaînement principal.

- **Macintosh (1984), salle annexe.** Action : glisser l'icône de la disquette dans la corbeille pour l'éjecter, une bizarrerie célèbre du Mac. Accessible par une commande cachée à l'écran 2, pour garder la sortie `WIN` vers Windows.
- **CP/M (1974).** Visuellement très proche de DOS : plutôt une mention dans la fiche de l'écran 2 qu'un écran à part.
- **Windows NT ou 2000.** Action : Ctrl+Alt+Suppr pour ouvrir la session, une séquence pensée pour la sécurité.
- **Mac OS X (2001).** Rappel d'Unix : ouvrir le Terminal et retrouver le fichier `journal` de 1974.
- **Mode classe.** Les fiches « Le saviez-vous ? » regroupées en une page imprimable pour les enseignants.
