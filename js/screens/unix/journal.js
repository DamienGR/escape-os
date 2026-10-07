// Journal de la salle machine (1974) : 500 lignes générées de façon déterministe.
// Une seule contient « sortie ». Partagé avec l'écran Ubuntu (bonus « Toujours là »).

export const EXIT_LINE = 'sortie : la machine de 1981 vous attend. Mot à retenir : multics';
export const EXIT_INDEX = 377;
export const JOURNAL_SIZE = 500;

export const README = [
  'Ici, chaque programme fait une seule chose.',
  'La sortie est notée dans le journal, quelque part parmi ses 500 lignes.',
  'Pour chercher : grep.',
  'Pour relier : |',
];

// Générateur pseudo-aléatoire (mulberry32) : même journal à chaque partie.
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const USERS = ['ken', 'dmr', 'doug', 'bwk', 'joe', 'lem', 'rhm'];

// [poids, gabarit] : le gabarit reçoit des tirages et renvoie le message.
const COMMON = [
  [9, (r) => `${r.user()} se connecte sur tty${r.int(0, 7)}`],
  [7, (r) => `${r.user()} se déconnecte de tty${r.int(0, 7)}`],
  [5, (r) => `rk${r.int(0, 2)} : vérification, aucune erreur`],
  [3, (r) => `rk${r.int(0, 2)} : ${r.int(2, 9)} erreurs corrigées`],
  [4, (r) => `sauvegarde de /usr sur la bande ${r.int(1, 24)}`],
  [4, (r) => `bande ${r.int(1, 24)} montée sur tm0`],
  [3, (r) => `bande ${r.int(1, 24)} rangée dans l’armoire ${r.int(1, 6)}`],
  [3, () => 'imprimante ligne : ruban changé'],
  [3, (r) => `tty${r.int(0, 7)} : papier coincé, opérateur appelé`],
  [3, (r) => `tty${r.int(0, 7)} : rouleau de papier remplacé`],
  [4, (r) => `climatisation : ${r.int(17, 22)} °C`],
  [2, () => 'mémoire à tores : test complet, OK'],
  [4, (r) => `${r.user()} compile le noyau (${r.int(2, 9)} min)`],
  [4, (r) => `${r.user()} imprime un listing de ${r.int(3, 60)} pages`],
  [4, (r) => `file d’impression : ${r.int(1, 7)} travaux`],
  [3, (r) => `disque rk${r.int(0, 2)} rempli à ${r.int(61, 96)} %`],
  [3, (r) => `icheck /dev/rk${r.int(0, 2)} : ${r.int(90, 900)} blocs libres`],
  [2, (r) => `dcheck /dev/rk${r.int(0, 2)} : OK`],
  [2, () => 'fusible changé sur le PDP-11/45'],
  [2, (r) => `redémarrage du système (${r.int(40, 95)} s)`],
  [2, (r) => `voyant rouge sur rk${r.int(0, 2)}, fausse alerte`],
  [2, (r) => `ventilateur bruyant, armoire ${r.int(1, 6)}`],
  [3, (r) => `${r.user()} relit le manuel, section ${r.pick(['I', 'II', 'III', 'IV', 'V'])}`],
  [3, (r) => `courrier pour ${r.user()} : ${r.int(1, 4)} message(s)`],
  [2, (r) => `horloge système recalée de ${r.int(2, 40)} s`],
  [2, () => 'nettoyage des têtes de lecture'],
  [2, (r) => `${r.user()} réclame du papier pour tty${r.int(0, 7)}`],
  [2, (r) => `tty${r.int(0, 7)} : touche E dure, à graisser`],
  [2, () => 'nouvelle bobine de ruban encreur'],
  [2, (r) => `lecteur de cartes : ${r.int(80, 2400)} cartes lues`],
  [3, (r) => `${r.user()} réécrit un utilitaire en C`],
  [2, () => 'test de la ligne téléphonique : OK'],
  [3, (r, m) => (m > 705 && m < 800 ? `${r.user()} part déjeuner` : null)],
  [3, (r, m) => (m > 760 && m < 860 ? `${r.user()} revient de déjeuner` : null)],
  [2, (r, m) => (m > 1260 ? 'ronde de nuit : portes fermées' : null)],
  [2, () => 'ronde de l’opérateur : rien à signaler'],
  [2, (r) => `${r.user()} trie ${r.int(40, 900)} fiches avec sort`],
  [2, () => 'café renversé près de la console'],
  [2, (r) => `${r.user()} cherche son crayon rouge`],
  [2, (r) => `${r.user()} : « qui a pris ma bande ? »`],
  [2, (r) => `processus ${r.int(12, 140)} arrêté par l’opérateur`],
  [2, (r) => `${r.int(3, 9)} utilisateurs connectés`],
  [1, () => 'odeur de chaud : fausse alerte'],
  [1, () => 'livraison de 12 rouleaux de papier'],
];

// Lignes uniques, clins d'œil à l'histoire d'Unix.
const SPECIALS = new Map([
  [1, 'mise sous tension du PDP-11/45'],
  [12, 'ken joue à space travel sur le PDP-7'],
  [64, 'dmr : le compilateur C se compile lui-même'],
  [131, 'doug : « reliez donc les programmes ! »'],
  [188, 'le noyau tourne, entièrement réécrit en C'],
  [246, 'bande pour Berkeley postée ce matin'],
  [302, 'article sur Unix accepté par les CACM'],
  [433, 'bwk prend des notes pour un livre sur le C'],
  [471, 'opérateur de nuit : relève à minuit'],
]);

function build() {
  const rand = prng(1974);
  const r = {
    int: (a, b) => a + Math.floor(rand() * (b - a + 1)),
    pick: (list) => list[Math.floor(rand() * list.length)],
    user: () => USERS[Math.floor(rand() * USERS.length)],
  };
  const total = COMMON.reduce((sum, [w]) => sum + w, 0);
  const weighted = () => {
    let n = rand() * total;
    for (const [w, make] of COMMON) {
      n -= w;
      if (n < 0) return make;
    }
    return COMMON[0][1];
  };

  const lines = ['journal de la salle 2 — lundi 15 juillet 1974'];
  let minutes = 7 * 60 + 2;
  let previous = '';
  for (let i = 1; i < JOURNAL_SIZE; i++) {
    if (i === EXIT_INDEX) {
      lines.push(EXIT_LINE);
      continue;
    }
    if (i > 1) minutes += r.int(1, 3);
    const hh = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    let message = SPECIALS.get(i);
    while (!message || message === previous) message = weighted()(r, minutes);
    previous = message;
    lines.push(`${hh}:${mm} ${message}`);
  }
  return lines;
}

export const JOURNAL = build();

export const FILES = {
  journal: JOURNAL,
  lisezmoi: README,
};

// Taille en octets, comme ls -l et wc l'auraient comptée.
export const byteSize = (lines) => new TextEncoder().encode(`${lines.join('\n')}\n`).length;
