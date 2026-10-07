// Ce que dit l'agent : accueil, réponses aux suggestions et aux mots-clés du
// champ libre. Aucun modèle de langage : tout est écrit à l'avance.
// Mini-balisage des répliques : `code` et **gras**. Une chaîne = un paragraphe.

// Espaces insécables de la typographie française, posées au rendu.
export const fr = (text) =>
  text
    .replace(/ ([:;!?»])/g, '\u00a0$1')
    .replace(/« /g, '«\u00a0')
    .replace(/(\d) (h|min|s|ans|kbit\/s)(?![\p{L}\d])/gu, '$1\u00a0$2')
    .replace(/(\d\u00a0(?:h|min)) (\d)/g, '$1\u00a0$2');

// `code` et **gras** → segments à taper un par un.
export function segments(text) {
  const out = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) });
    out.push(m[1] ? { kind: 'code', text: m[1] } : { kind: 'strong', text: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out.map((seg) => ({ ...seg, text: fr(seg.text) }));
}

export const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

export function tally(hints, errors) {
  if (!hints && !errors) return 'sans indice ni erreur';
  if (!hints) return `sans indice et avec ${plural(errors, 'erreur')}`;
  if (!errors) return `avec ${plural(hints, 'indice')} et sans erreur`;
  return `avec ${plural(hints, 'indice')} et ${plural(errors, 'erreur')}`;
}

// ——— Titres ———

export const TITLES = {
  guru: {
    name: 'Gourou système',
    icon: 'guru',
    text: 'Pas un seul indice : les machines n’ont plus aucun secret pour toi.',
  },
  archaeo: {
    name: 'Archéologue du numérique',
    icon: 'archaeo',
    text: 'Quelques indices, beaucoup de flair : tu as fouillé chaque couche du passé.',
  },
  tourist: {
    name: 'Touriste temporel',
    icon: 'tourist',
    text: 'Tu as pris le temps de tout visiter, guide en main : c’est aussi ça, voyager.',
  },
  visitor: {
    name: 'Visiteur pressé',
    icon: 'visitor',
    text: 'Tu as pris des raccourcis temporels : fais le voyage complet pour décrocher un vrai titre.',
    unranked: true,
  },
};

export function titleFor({ hints, visit }) {
  if (visit) return TITLES.visitor;
  if (hints === 0) return TITLES.guru;
  return hints <= 5 ? TITLES.archaeo : TITLES.tourist;
}

// ——— Accueil ———

export function opening({ visit }) {
  return [
    { type: 'think', ms: 1000 },
    { type: 'h', text: visit ? 'Bienvenue en 2026 !' : 'Bon retour en 2026 !' },
    visit
      ? 'Le mode visite t’a fait sauter quelques étapes : te voici déjà au bout du voyage. Le parcours complet, des cartes perforées à aujourd’hui, t’attend quand tu veux.'
      : 'À 9 h 41, une mise à jour a déraillé et l’horloge du système a filé jusqu’en 1965. Machine après machine, tu as remonté plus de soixante ans d’interfaces pour revenir au présent. Bravo !',
    `${visit ? 'Le' : 'Ton'} voyage tient en neuf gestes :`,
    { type: 'frieze' },
    'Des cartes perforées à l’écran tactile, il fallait chaque fois apprendre la langue de la machine. Aujourd’hui, plus besoin de syntaxe : il suffit de demander.',
    { type: 'think', ms: 700 },
    'Et voici ton bilan :',
    { type: 'stats' },
    'Une question ? Écris-moi, ou choisis une suggestion ci-dessous.',
  ];
}

// ——— Suggestions ———

export const CHIPS = [
  { id: 'restart', label: 'Rejouer', icon: 'replay' },
  { id: 'facts', label: 'Revoir les fiches', icon: 'sheet' },
  { id: 'share', label: 'Partager mon score', icon: 'share' },
  { id: 'ask', icon: 'agent' },
];

// La quatrième suggestion change une fois sa réponse donnée.
export const QUESTIONS = [
  {
    label: 'Quelle sera la prochaine interface ?',
    reply: [
      'Personne ne le sait vraiment, et c’est ce qui rend la question passionnante.',
      'Regarde ton voyage : chaque époque a effacé un intermédiaire. Les cartes perforées ont laissé place à la ligne de commande, la commande à la souris, la souris au doigt… et le doigt à la phrase. La suite sera peut-être une interface qui se fait oublier : la voix, le regard, des objets qui comprennent le contexte sans qu’on les touche.',
      'Mais une chose n’a pas changé depuis 1965 : il faudra toujours savoir ce que l’on veut demander.',
    ],
  },
  {
    label: 'Pourquoi revenir au texte ?',
    reply: [
      'Parce que la boucle est bouclée ! En 1974, on tapait déjà du texte dans une invite, sur un télétype qui imprimait sa réponse caractère par caractère… un peu comme moi.',
      'La différence, c’est qu’il fallait alors parler la langue de la machine, au caractère près. En 2026, c’est la machine qui apprend la nôtre.',
    ],
  },
  {
    label: 'Qui es-tu vraiment ?',
    reply: [
      'Un agent simulé, et fier de l’être ! Quelques centaines de lignes de JavaScript, sans modèle de langage ni serveur : mes réponses sont écrites à l’avance, et je ne reconnais que quelques mots-clés.',
      'Rien de ce que tu tapes ne quitte ton navigateur. Mais l’illusion fonctionne plutôt bien, non ?',
    ],
  },
];

export const RESTART = {
  ask: 'Avec plaisir ! Attention : le carnet, le chrono et les statistiques repartiront de zéro. On y retourne ?',
  yes: 'Repartir en 1965',
  no: 'Rester en 2026',
  go: 'Attache ta ceinture : cap sur 1965 !',
  stay: 'Bonne idée : profite un peu du présent. Le voyage t’attendra.',
};

export const FACTS = {
  reply: 'Bonne idée ! Voici les fiches « Le saviez-vous ? » des dix époques, réunies sur une seule page et prêtes à imprimer : parfait pour la classe.',
  again: 'Rouvrir les fiches',
};

// La salle annexe (Macintosh, 1984), cachée sous DOS.
export const MAC = {
  found:
    'Tu as même trouvé la salle annexe ! Le Macintosh de 1984 éjectait sa disquette quand on la glissait… dans la poubelle. Une bizarrerie restée célèbre.',
  hidden:
    'Le Macintosh de 1984 ? Il t’attend dans une salle annexe, cachée sous DOS : rejoue et essaie la commande `ANNEXE`. Pour éjecter sa disquette, on la glissait… dans la poubelle.',
};

export const SHARE = {
  shared: 'C’est envoyé ! Merci de faire voyager Escape OS.',
  cancelled: 'Pas de souci : ton score reste ici, si jamais tu changes d’avis.',
  copied: 'Je l’ai copié dans ton presse-papiers : il ne reste plus qu’à le coller où tu veux.',
  failed: 'Ton navigateur n’a pas voulu le copier. Le voici, à sélectionner à la main :',
};

export function shareText({ duration, hints, errors, title, visit }) {
  if (visit) {
    return fr(
      'J’ai exploré Escape OS en mode visite : dix époques d’interfaces, des cartes perforées à l’agent IA de 2026. Et toi, sauras-tu en sortir ?',
    );
  }
  return fr(
    `J’ai bouclé Escape OS en ${duration}, ${tally(hints, errors)} : me voilà « ${title} » ! Dix époques d’interfaces, des cartes perforées à l’agent IA. Sauras-tu faire mieux ?`,
  );
}

export function scoreReply({ time, duration, hints, errors, title, visit }) {
  if (visit) {
    return [
      time >= 60_000
        ? `Mode visite oblige, ta partie n’est pas classée. Ton chrono affiche tout de même ${duration} de voyage.`
        : 'Mode visite oblige, ta partie n’est pas classée : fais le voyage complet pour décrocher un titre.',
    ];
  }
  return [`Tu as bouclé le voyage en ${duration}, ${tally(hints, errors)}. Ton titre : **${title}**.`];
}

// ——— Champ libre : quelques mots-clés, et l'époque d'où ils viennent ———
// Testés dans l'ordre, sur un texte en minuscules et sans accents.

export const RULES = [
  { id: 'restart', test: /\b(rejouer|rejoue|recommencer|recommence|nouvelle partie|restart|replay)\b/ },
  { id: 'facts', test: /\b(fiches?|saviez|imprimer)\b/ },
  { id: 'share', test: /\b(partager|partage|share)\b/ },
  { id: 'future', test: /\b(prochaine interface|futur|avenir|demain)\b/ },
  {
    id: 'who',
    test: /\b(qui es[ -]?tu|t'?es qui|tu es qui|(tu es|es[ -]tu) (une |un )?(ia|robot|humain|vrai)|ia|intelligence artificielle|llm|chatgpt|gpt|claude|robot)\b/,
  },
  { id: 'text', test: /\b(texte|invite|prompt)\b/ },
  { id: 'mac', test: /\b(mac|macintosh|apple|poubelle|annexe|1984)\b/ },
  {
    id: 'pipe',
    test: /\||\b(cat|grep|pipe)\b/,
    reply: [
      'Un pipe ! Doug McIlroy serait ravi : c’était en 1974, sur le télétype d’Unix, avec `cat journal | grep sortie`. Aujourd’hui, c’est moi qui relie les outils entre eux.',
    ],
  },
  {
    id: 'sudo',
    test: /\b(sudo|apt|root|admin|administrateur)\b/,
    reply: [
      'Pas besoin de `sudo` ici : tu es chez toi ! C’était en 2006, sous Ubuntu, avec le mot de passe trouvé en 1974. Aujourd’hui, je te demande simplement la permission.',
    ],
  },
  {
    id: 'win',
    test: /(^|[^a-z0-9])win(\.com)?($|[^a-z0-9])/,
    reply: [
      'Plus besoin de taper `WIN` : c’était en 1981, sous MS-DOS, pour lancer Windows depuis le disque dur. Aujourd’hui, l’ordinateur démarre tout seul… et il t’écoute.',
    ],
  },
  {
    id: 'files',
    test: /\b(ls|dir|cd|pwd|mkdir|dossiers?)\b/,
    reply: [
      '`ls`, `dir`, `cd`… les bons vieux réflexes ! Ils viennent d’Unix (1974) et de MS-DOS (1981), quand il fallait parcourir ses dossiers à la main. Aujourd’hui, dis-moi ce que tu cherches : je m’occupe du chemin.',
    ],
  },
  {
    id: 'drive',
    test: /(^|\s)[abc]:|\b(disquette|lecteur|1981|ms-dos|dos)\b/,
    reply: [
      'Changer de lecteur, c’était en 1981 : `A:` pour la disquette, `C:` pour le disque dur. Ce bon vieux `C:` est d’ailleurs toujours là aujourd’hui !',
    ],
  },
  {
    id: 'help',
    test: /^\?+$|\b(help|aide|aidez|au secours|sos)\b/,
    reply: [
      'En 1981, `HELP` affichait la liste des commandes. Ici, rien à apprendre par cœur : pose ta question comme tu la poserais à quelqu’un. Tu peux aussi tester de vieux réflexes, comme `WIN`, `sudo` ou `ls`.',
    ],
  },
  {
    id: 'wizz',
    test: /\b(wizz|wiz|msn|messenger|2001)\b/,
    reply: ['Bzzz ! Pas la peine de me secouer, je suis bien réveillé. Le Wizz, c’était en 2001, sur la messagerie de Windows XP.'],
  },
  {
    id: 'multics',
    test: /\bmultics\b/,
    reply: [
      '`multics` ! Le mot de passe trouvé en 1974, qui t’a fait passer administrateur en 2006. Multics, c’est aussi le système des années 1960 dont Unix a détourné le nom.',
    ],
  },
  {
    id: 'unix',
    test: /\b(unix|teletype|1974)\b/,
    reply: [
      'En 1974, Unix tournait sur un télétype : chaque réponse s’imprimait sur du papier, caractère par caractère… un peu comme moi. C’est là que tu as appris à relier deux commandes.',
    ],
  },
  {
    id: 'linux',
    test: /\b(ubuntu|linux|2006|manchot|pingouin)\b/,
    reply: [
      'Ubuntu, en 2006 : un Linux enfin accessible à tous, avec des dépôts qui installaient un logiciel d’une seule commande. Aujourd’hui, Linux fait tourner la plupart des serveurs du web et le cœur d’Android.',
    ],
  },
  {
    id: 'now',
    test: /\b2026\b/,
    reply: ['On y est : 2026, le présent. Tu as traversé plus de soixante ans d’interfaces pour y revenir. Bienvenue chez toi !'],
  },
  {
    id: 'start',
    test: /\b(demarrer|arreter|eteindre|shutdown|start|1995)\b/,
    reply: [
      'Cliquer sur Démarrer… pour arrêter : c’était en 1995, avec Windows 95. Aujourd’hui, on n’éteint presque plus rien : tout se met en veille.',
    ],
  },
  {
    id: 'modem',
    test: /\b(modem|internet|56k|www|http|https|connexion|connecter|1998)\b/,
    reply: [
      'Pas besoin de modem ! En 1998, il fallait libérer la ligne téléphonique et patienter à 56 kbit/s. Aujourd’hui, la connexion est partout, et sans un bruit.',
    ],
  },
  {
    id: 'pinch',
    test: /\b(pincer|pince|zoom|zoomer|tactile|smartphone|iphone|2007)\b/,
    reply: [
      'Pincer pour zoomer : un geste né en 2007 avec le premier smartphone multitouch, devenu si naturel qu’on l’oublie. Ici, il suffit de demander.',
    ],
  },
  {
    id: 'cards',
    test: /\b(cartes?|perforees?|trier|1965|annees 60)\b/,
    reply: [
      'Trier des cartes perforées : c’était dans les années 1960, quand on programmait sans écran. Une carte par ligne de code, et le résultat parfois des heures plus tard !',
    ],
  },
  {
    id: 'mouse',
    test: /\b(double[- ]?clic|double[- ]?cliquer|souris|1992)\b/,
    reply: [
      'Le double-clic, c’était en 1992 avec Windows 3.1 : deux clics rapides, au même endroit. La souris, elle, date des années 1960 et de Douglas Engelbart.',
    ],
  },
  {
    id: 'windows',
    test: /\b(windows|fenetres?|xp)\b/,
    reply: [
      'Windows ? Tu en as croisé quatre : 3.1 en 1992, 95, 98, puis XP en 2001. Chacun t’a appris un geste : double-cliquer, éteindre, se connecter, wizzer.',
    ],
  },
  {
    id: 'exit',
    test: /\b(exit|quit|quitter|logout|bye|au revoir|ciao)\b/,
    reply: ['On ne quitte pas 2026 si facilement : c’est le présent ! Mais tu peux toujours rejouer le voyage.'],
  },
  { id: 'score', test: /\b(score|stats?|statistiques|bilan|chrono|titre|classement)\b/ },
  {
    id: 'thanks',
    test: /\b(merci|thanks|thx|bravo|genial|super)\b/,
    reply: ['Avec plaisir ! C’était un beau voyage. Reviens quand tu veux : les machines t’attendront.'],
  },
  {
    id: 'hello',
    test: /\b(bonjour|salut|hello|coucou|hey|bonsoir)\b/,
    reply: ['Bonjour ! Ravi de te retrouver en 2026. Que veux-tu savoir ?'],
  },
];

export const FALLBACKS = [
  [
    'Je ne suis qu’un agent simulé, mais j’ai compris l’intention. Je ne reconnais que quelques mots : essaie de vieux réflexes comme `WIN`, `sudo` ou `ls`, ou choisis une suggestion.',
  ],
  [
    'Je ne suis qu’un agent simulé, mais j’ai compris l’intention : en 1981, il aurait fallu la commande exacte ; en 2026, une phrase suffit. Pour le reste, les fiches du voyage en savent plus que moi.',
  ],
  [
    'Bonne question ! Je ne suis qu’un agent simulé : mes réponses sont écrites à l’avance. Les suggestions ci-dessous, elles, marchent à tous les coups.',
  ],
];

export function match(text) {
  const clean = normalize(text);
  return RULES.find((rule) => rule.test.test(clean)) ?? null;
}
