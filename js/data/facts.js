// Fiches « Le saviez-vous ? », indices progressifs et solutions (mode ?debug).
// Un indice peut être une fonction : elle reçoit { hasNote, touch } et renvoie le texte.

export const FACTS = {
  cards: {
    title: 'Le traitement par lots',
    lines: [
      '1956 : GM-NAA I/O, écrit par General Motors et North American Aviation pour l’IBM 704, est souvent cité comme le premier système d’exploitation.',
      'On programmait sans écran : une carte perforée par ligne de code.',
      'On déposait son paquet au guichet, et le listing revenait parfois des heures plus tard : c’est le traitement par lots.',
      'Il en reste les 80 colonnes de la carte, longtemps la largeur standard des terminaux et du code.',
    ],
  },
  unix: {
    title: 'Unix et le pipe',
    lines: [
      '1969, Bell Labs : Ken Thompson et Dennis Ritchie créent Unix, bientôt réécrit dans leur nouveau langage, le C.',
      '1973 : le pipe | arrive, sur une idée de Doug McIlroy. Chaque programme fait une seule chose, et on les combine.',
      'Son nom est un jeu de mots sur Multics, un système plus ancien et bien plus lourd.',
      'macOS, Linux et Android héritent tous de ses idées.',
    ],
  },
  dos: {
    title: 'MS-DOS et le lecteur C:',
    lines: [
      '1981 : MS-DOS équipe l’IBM PC. Microsoft l’a tiré de 86-DOS, lui-même inspiré de CP/M (Gary Kildall, 1974), qui avait déjà l’invite A>.',
      'A: et B: étaient réservés aux disquettes : le disque dur a hérité du C:, toujours utilisé aujourd’hui.',
      'Windows 3.x n’était pas autonome : on le lançait depuis DOS, en tapant WIN.',
    ],
  },
  win31: {
    title: 'Les fenêtres et la souris',
    lines: [
      '1990 puis 1992 : Windows 3.0 et 3.1 installent l’interface graphique sur les PC.',
      'Windows 1.0 (1985) posait les fenêtres côte à côte ; elles ne se superposent qu’à partir de Windows 2.0 (1987).',
      'La souris, inventée par Douglas Engelbart dans les années 1960, devient indispensable.',
      'Le Solitaire et le Démineur aidaient aussi à l’apprivoiser : glisser, viser, clic droit.',
    ],
  },
  win95: {
    title: 'Le menu Démarrer',
    lines: [
      'Août 1995 : Windows 95 introduit le menu Démarrer et la barre des tâches, toujours présents dans Windows 11.',
      'Il démarre directement en mode graphique, sans taper WIN, même si DOS reste présent en coulisses.',
      'On cliquait sur « Démarrer »… pour arrêter : un paradoxe resté célèbre.',
      'Les alimentations ne savaient pas encore se couper seules, d’où le fameux message orange.',
    ],
  },
  win98: {
    title: 'Internet à la maison',
    lines: [
      'Juin 1998 : Windows 98 intègre le navigateur Internet Explorer au système, un point au cœur du procès antitrust contre Microsoft.',
      'On se connectait par la ligne téléphonique, à 56 kbit/s au mieux : impossible de téléphoner en même temps.',
      'Il popularise aussi l’USB… non sans un écran bleu en pleine démonstration publique, en avril 1998.',
    ],
  },
  xp: {
    title: 'XP et la messagerie instantanée',
    lines: [
      'Octobre 2001 : Windows XP apporte au grand public la base de Windows NT, bien plus stable.',
      'L’un des Windows les plus durables : son support ne s’arrête qu’en avril 2014.',
      'MSN Messenger (1999-2013) et son Wizz ont marqué toute une génération.',
    ],
  },
  ubuntu: {
    title: 'Linux et le logiciel libre',
    lines: [
      '1991 : Linus Torvalds, étudiant à Helsinki, publie le noyau Linux, un système libre de la famille Unix.',
      'Ubuntu (2004) le rend accessible au grand public. Ses dépôts installent un logiciel d’une commande, bien avant les magasins d’applications.',
      'sudo permet d’agir ponctuellement en administrateur, avec son propre mot de passe.',
      'Linux fait tourner aujourd’hui la plupart des serveurs web et le cœur d’Android.',
    ],
  },
  phone: {
    title: 'Le multitouch',
    lines: [
      'Janvier 2007 : le premier iPhone généralise l’écran multitouch et les gestes : glisser, pincer.',
      '2008 : l’App Store ouvre, et le premier téléphone Android sort, sur un noyau Linux.',
      'Le doigt remplace la souris pour une grande partie des usages.',
    ],
  },
  mac: {
    title: 'Le Macintosh et la poubelle',
    lines: [
      'Janvier 1984 : le Macintosh popularise l’interface graphique et la souris auprès du grand public, après le Xerox Alto (1973) et le Lisa (1983).',
      'Pour éjecter une disquette, on la glissait… dans la poubelle : une bizarrerie célèbre, qui inquiétait les débutants.',
      'Sa barre de menus, ses icônes et ses fenêtres ont inspiré tous les systèmes graphiques qui ont suivi.',
    ],
  },
  agent: {
    title: 'De la syntaxe à l’intention',
    lines: [
      'Les interfaces sont passées de la commande exacte à l’intention : on décrit ce qu’on veut obtenir.',
      'Et la boucle est bouclée : on tape de nouveau du texte dans une invite, comme en 1974.',
    ],
  },
};

export const HINTS = {
  cards: [
    'Chaque carte porte un numéro tout au bout.',
    'Classe-les du plus petit au plus grand, ou aligne le trait de feutre. Puis appuie sur LECTURE.',
    'Ordre exact : 00000010, 00000020, 00000030… jusqu’à 00000080, puis LECTURE sur le lecteur de cartes.',
  ],
  unix: [
    'Lis le fichier lisezmoi : tape cat lisezmoi.',
    'Cherche le mot « sortie » dans le journal. grep cherche un mot ; le caractère | envoie le résultat d’une commande à la suivante.',
    'Tape : cat journal | grep sortie',
  ],
  dos: [
    'Regarde la lettre de l’invite : A:, c’est la disquette.',
    'Pour changer de lecteur, tape sa lettre suivie de deux-points.',
    'Tape C: puis WIN.',
  ],
  win31: [
    'Et si quelque chose se cachait sous cette fenêtre ?',
    'Attrape-la par sa barre de titre bleue et fais-la glisser.',
    ({ touch }) => (touch ? 'Touche deux fois de suite l’icône SAUT.EXE apparue.' : 'Double-clique sur l’icône SAUT.EXE apparue.'),
  ],
  win95: [
    'Tout commence par… Démarrer.',
    'Le menu Démarrer contient aussi de quoi arrêter.',
    'Démarrer › Arrêter › Oui. Ensuite, l’ordinateur attend qu’on appuie sur le bouton de son boîtier.',
  ],
  win98: [
    ({ touch }) =>
      `Pour aller sur Internet, il faut d’abord se connecter : ${touch ? 'touche deux fois de suite' : 'double-clique sur'} « Connexion à Internet ».`,
    'L’adresse est écrite sur la pochette du CD, à côté de l’écran.',
    'Une fois connecté, tape www.saut-temporel.98 dans la barre d’adresse du navigateur.',
  ],
  xp: [
    'Il ne lit pas ses messages… il faut attirer son attention.',
    'Cherche le bouton qui fait trembler la fenêtre.',
    ({ touch }) => (touch ? 'Touche le bouton Wizz, sous la conversation.' : 'Clique sur le bouton Wizz, sous la conversation.'),
  ],
  ubuntu: [
    'Tape sortie : le terminal te souffle la commande.',
    'sudo veut dire : fais-le en tant qu’administrateur. Tape sudo apt install sortie.',
    ({ hasNote }) =>
      hasNote('multics')
        ? 'Le mot de passe est dans ton carnet, trouvé en 1974. Puis lance sortie.'
        : 'Le mot de passe est multics (il venait de 1974). Puis lance sortie.',
  ],
  phone: [
    'Ce texte est trop petit… et si on l’agrandissait ?',
    ({ touch }) =>
      touch
        ? 'Écarte deux doigts sur la photo.'
        : 'Pince le pavé tactile, utilise Ctrl + molette, ou les boutons + et − sur la photo.',
    'Compose 2026 dans l’app Téléphone.',
  ],
  mac: [
    'Il faut récupérer la disquette… mais la machine n’a aucun bouton d’éjection.',
    'Sur ce Mac, on éjecte une disquette en la jetant… à la poubelle.',
    'Glisse l’icône « Disquette » sur la Poubelle, en bas à droite.',
  ],
  agent: [
    'Plus rien à trouver : savoure ton retour en 2026.',
    'Tu peux poser une question à l’agent, ou choisir une réponse proposée.',
    'Clique sur « Rejouer » pour recommencer le voyage.',
  ],
};

export const SOLUTIONS = {
  cards: 'Classer 00000010 → 00000080 dans le bac, puis LECTURE.',
  unix: 'cat journal | grep sortie',
  dos: 'C:  puis  WIN',
  win31: 'Déplacer le Gestionnaire de programmes, double-clic sur SAUT.EXE.',
  win95: 'Démarrer › Arrêter › Oui, puis bouton du boîtier.',
  win98: 'Double-clic « Connexion à Internet » › Se connecter, puis www.saut-temporel.98',
  xp: 'Ouvrir la session, ouvrir la messagerie, bouton Wizz.',
  ubuntu: 'sudo apt install sortie · multics · sortie',
  phone: 'Glisser pour déverrouiller › Photos › zoomer › Téléphone › 2026.',
  mac: 'Glisser l’icône de la disquette sur la Poubelle.',
  agent: '—',
};
