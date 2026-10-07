// Cartes perforées 80 colonnes : le programme FORTRAN IV du joueur, le code
// Hollerith de la perforatrice IBM 029 (lignes 12, 11, 0 à 9) et le dessin SVG
// de chaque carte. Unités : centièmes de pouce, une carte mesure 7 3/8 × 3 1/4.

export const CARD_W = 738;
export const CARD_H = 325;
// Hauteur de la bande visible de chaque carte dans le paquet en cascade
export const BAND = 46;

const PITCH = 8.7;
const ROWS = [12, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const colX = (col) => 25.1 + (col - 1) * PITCH;
export const rowY = (row) => 25 + ROWS.indexOf(row) * 25;

// ——— Le programme : une carte par ligne, numéro de séquence en colonnes 73 à 80 ———

export const PROGRAM = [
  'C     SAUT TEMPOREL - PROGRAMME PRINCIPAL',
  '      INTEGER AN',
  '      AN = 1965',
  '   10 AN = AN + 1',
  '      IF (AN .LT. 1974) GO TO 10',
  '      PRINT 20, AN',
  '   20 FORMAT (33H TERMINAL DISPONIBLE - SALLE 2 - ,I4)',
  '      END',
];

export const RESULT = 'TERMINAL DISPONIBLE - SALLE 2 - 1974';

export const seqOf = (rank) => String((rank + 1) * 10).padStart(8, '0');
export const cardText = (rank) => PROGRAM[rank].padEnd(72) + seqOf(rank);

// ——— Code Hollerith (IBM 029) ———

const SPECIALS = {
  '&': [12],
  '-': [11],
  '/': [0, 1],
  '¢': [12, 2, 8],
  '.': [12, 3, 8],
  '<': [12, 4, 8],
  '(': [12, 5, 8],
  '+': [12, 6, 8],
  '|': [12, 7, 8],
  '!': [11, 2, 8],
  $: [11, 3, 8],
  '*': [11, 4, 8],
  ')': [11, 5, 8],
  ';': [11, 6, 8],
  '¬': [11, 7, 8],
  ',': [0, 3, 8],
  '%': [0, 4, 8],
  _: [0, 5, 8],
  '>': [0, 6, 8],
  '?': [0, 7, 8],
  ':': [2, 8],
  '#': [3, 8],
  '@': [4, 8],
  "'": [5, 8],
  '=': [6, 8],
  '"': [7, 8],
};

export function punchRows(ch) {
  if (ch === ' ') return [];
  if (ch >= '0' && ch <= '9') return [Number(ch)];
  const code = ch.charCodeAt(0);
  if (ch >= 'A' && ch <= 'I') return [12, code - 64];
  if (ch >= 'J' && ch <= 'R') return [11, code - 73];
  if (ch >= 'S' && ch <= 'Z') return [0, code - 81];
  return SPECIALS[ch] ?? [];
}

// Toutes les perforations d'une carte, en un seul tracé.
function holesPath(text) {
  let d = '';
  for (let col = 1; col <= 80; col++) {
    const x = (colX(col) - 2.75).toFixed(2);
    for (const row of punchRows(text[col - 1] ?? ' ')) {
      d += `M${x} ${(rowY(row) - 6.25).toFixed(2)}h5.5v12.5h-5.5z`;
    }
  }
  return d;
}

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const xs = (cols) => cols.map((c) => colX(c).toFixed(1)).join(' ');

// Contour : coin supérieur gauche coupé, autres coins arrondis.
const OUTLINE = 'M17 0H732Q738 0 738 6V319Q738 325 732 325H6Q0 325 0 319V30Z';

// ——— Face imprimée, partagée par toutes les cartes (<symbol> + <use>) ———

export function cardDefs(p) {
  const all = Array.from({ length: 80 }, (_, i) => i + 1);
  const digits = ROWS.filter((r) => r <= 9)
    .map((r) => `<text class="pc-dg" y="${(rowY(r) + 3.3).toFixed(1)}" x="${xs(all)}">${String(r).repeat(80)}</text>`)
    .join('');
  // Numéros de colonne : chaque chiffre a sa position, centrée sur la colonne
  const numX = [];
  let numText = '';
  for (const col of all) {
    const label = String(col);
    [...label].forEach((ch, i) => {
      numX.push((colX(col) + (i - (label.length - 1) / 2) * 2.5).toFixed(2));
      numText += ch;
    });
  }
  const numbers = [90, 318.5].map((y) => `<text class="pc-cn" y="${y}" x="${numX.join(' ')}">${numText}</text>`).join('');
  const sep = (col) => (colX(col) + PITCH / 2).toFixed(2);
  return `<svg class="cr-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${p}-paper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f8efd6"/>
        <stop offset=".55" stop-color="#f2e6c6"/>
        <stop offset="1" stop-color="#eadbb5"/>
      </linearGradient>
      <symbol id="${p}-face" viewBox="0 0 ${CARD_W} ${CARD_H}">
        <path d="${OUTLINE}" fill="url(#${p}-paper)"/>
        <path class="pc-field" d="M${sep(5)} 60V312M${sep(6)} 60V312M${sep(72)} 60V312"/>
        <text class="pc-lb" y="65.5" x="42.5" text-anchor="middle">Nº</text>
        <text class="pc-lb" y="65.5" x="${((colX(7) + colX(72)) / 2).toFixed(1)}" text-anchor="middle">INSTRUCTION FORTRAN</text>
        <text class="pc-lb" y="65.5" x="${((colX(73) + colX(80)) / 2).toFixed(1)}" text-anchor="middle">IDENTIFICATION</text>
        ${digits}
        ${numbers}
        <path d="${OUTLINE}" fill="none" stroke="#cdb98c" stroke-width="1.4"/>
      </symbol>
    </defs>
  </svg>`;
}

// ——— Une carte : interprétation imprimée, perforations, numéro, trait de feutre ———

// Trait de feutre : un segment de la diagonale tracée sur la tranche du paquet,
// à la hauteur du rang correct de la carte. Il n'est droit que si le paquet est trié.
const FELT_X = 30;
const FELT_STEP = 54;

export function feltPath(rank) {
  const slope = FELT_STEP / BAND;
  const x0 = FELT_X + rank * FELT_STEP;
  return `M${(x0 - 6 * slope).toFixed(1)} -6L${(x0 + FELT_STEP + 6 * slope).toFixed(1)} ${BAND + 6}`;
}

export function cardSvg(rank, p) {
  const text = cardText(rank);
  const cols = [];
  let chars = '';
  for (let col = 1; col <= 72; col++) {
    const ch = text[col - 1];
    if (ch === ' ') continue;
    cols.push(col);
    chars += ch;
  }
  const seq = seqOf(rank);
  const zeros = seq.match(/^0*/)[0];
  return `<svg class="pc-svg" viewBox="0 0 ${CARD_W} ${CARD_H}" aria-hidden="true" focusable="false">
    <use href="#${p}-face"/>
    <rect class="pc-hl" x="560" y="6" width="174" height="38" rx="6"/>
    <text class="pc-print" y="13.5" x="${xs(cols)}">${esc(chars)}</text>
    <path class="pc-holes" d="${holesPath(text)}"/>
    <text class="pc-num" x="731" y="36.5" text-anchor="end"><tspan class="pc-num-z">${zeros}</tspan>${seq.slice(zeros.length)}</text>
    <path class="pc-felt" d="${feltPath(rank)}"/>
    <path class="pc-felt pc-felt-sheen" d="${feltPath(rank)}"/>
  </svg>`;
}

// ——— Ce que l'imprimante sort ———

const pad4 = (n) => String(n).padStart(4, '0');

export function listing(job) {
  let isn = 0;
  const source = PROGRAM.map((line) => {
    const label = line.startsWith('C') ? '    ' : pad4(++isn);
    return ` ${label}  ${line}`;
  });
  return {
    compile: [
      `SALLE DES MACHINES        TRAVAIL ${pad4(job)}     07/10/65`,
      'COMPILATEUR FORTRAN IV                         PAGE 1',
      '',
      ' ISN   SOURCE',
      ...source,
      '',
      '*** COMPILATION TERMINEE : 0 ERREUR ***',
      '*** EXECUTION ***',
    ],
    result: RESULT,
    end: `*** FIN DU TRAVAIL ${pad4(job)} ***`,
  };
}

// Le ticket d'erreur, déchiré et épinglé au mur par l'opérateur.
export function slip(job, { kind, count = 0, before, after }) {
  const head = `TRAVAIL ${pad4(job)} - LECTEUR`;
  if (kind === 'sequence') {
    return [head, '*** ERREUR DE SEQUENCE ***', `CARTE ${seqOf(after)}`, `APRES ${seqOf(before)}`, 'TRAVAIL REJETE'];
  }
  if (kind === 'empty') return [head, '*** BAC VIDE ***', 'AUCUNE CARTE A LIRE', 'TRAVAIL REJETE'];
  return [head, '*** PAQUET INCOMPLET ***', `${count} CARTE${count > 1 ? 'S' : ''} SUR 8`, 'TRAVAIL REJETE'];
}
