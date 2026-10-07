// Icônes des époques Windows 95 et 98, redessinées en pixel art : 16 × 16 pour
// les menus, la barre des tâches et les titres, 32 × 32 pour le bureau et le
// menu Démarrer, 20 × 20 pour la barre d'outils du navigateur. Aucune copie :
// formes simples, palette VGA 16 couleurs (voir ui/pixel.js).

import { pixelArt } from '../../ui/pixel.js';
import { ICONS } from '../../ui/icons.js';

const i16 = (draw) => pixelArt(16, draw);
const i32 = (draw) => pixelArt(32, draw);
const i20 = (draw) => pixelArt(20, draw);

// ——— Briques communes ———

function folder16(p, x = 0, y = 2) {
  p.map(x, y, [
    '.KKKKK..........',
    'KyWyyyK.........',
    'KyyyyyyKKKKKKKK.',
    'KWWWWWWWWWWWWWWK',
    'KWyyyyyyyyyyyyYK',
    'KWyyyyyyyyyyyyYK',
    'KWyyyyyyyyyyyyYK',
    'KWyyyyyyyyyyyyYK',
    'KWyyyyyyyyyyyyYK',
    'KWyyyyyyyyyyyyYK',
    'KYYYYYYYYYYYYYYK',
    'KKKKKKKKKKKKKKKK',
  ]);
}

function folder32(p) {
  p.rect(2, 7, 12, 4, 'K');
  p.rect(3, 8, 10, 3, 'y');
  p.hline(3, 8, 9, 'W');
  p.rect(2, 10, 28, 19, 'K');
  p.rect(3, 11, 26, 17, 'y');
  p.hline(3, 11, 26, 'W');
  p.vline(3, 11, 17, 'W');
  p.hline(3, 27, 26, 'Y');
  p.vline(28, 12, 16, 'Y');
}

function page16(p, x, y, w = 9, h = 12, lines = 'D') {
  p.rect(x, y, w, h, 'K');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'W');
  p.rect(x + w - 3, y, 3, 3, '.');
  p.px(x + w - 3, y + 1, 'K');
  p.px(x + w - 2, y + 2, 'K');
  p.px(x + w - 3, y + 2, 'L');
  p.vline(x + w - 1, y + 2, h - 2, 'K');
  for (let j = y + 4; j < y + h - 2; j += 2) p.hline(x + 2, j, w - 4 - ((j / 2) % 2), lines);
}

function monitor16(p, x, y, screen = 'C') {
  p.rect(x, y, 13, 10, 'K');
  p.rect(x + 1, y + 1, 11, 8, 'L');
  p.rect(x + 2, y + 2, 9, 6, 'K');
  p.rect(x + 3, y + 3, 7, 4, screen);
  p.hline(x + 3, y + 3, 3, 'c');
  p.rect(x + 4, y + 10, 5, 1, 'K');
  p.rect(x + 2, y + 11, 9, 2, 'K');
  p.hline(x + 3, y + 11, 7, 'L');
}

function magnifier(p, x, y, r = 3) {
  p.disc(x, y, r + 1, 'K');
  p.disc(x, y, r, 'c');
  p.px(x - 1, y - 1, 'W');
  p.px(x - r + 1, y - 1, 'W');
  for (let i = 0; i < 4; i++) p.rect(x + r + i - 1, y + r + i - 1, 2, 2, 'K');
}

// ——— Bouton Démarrer : une horloge à quatre couleurs (pas de drapeau) ———

export const START_LOGO = pixelArt(16, (p) => {
  const c = 7.5;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > 7.6) continue;
      if (d > 6.4) {
        p.px(x, y, 'K');
        continue;
      }
      p.px(x, y, y < 8 ? (x < 8 ? 'r' : 'g') : x < 8 ? 'b' : 'y');
    }
  }
  p.map(2, 2, ['.WW', 'W', 'W']);
  p.rect(7, 3, 2, 6, 'K');
  p.rect(9, 7, 3, 2, 'K');
  p.rect(7, 7, 2, 2, 'W');
});

// ——— 16 × 16 ———

export const ICON16 = {
  folder: i16((p) => folder16(p)),

  doc: i16((p) => page16(p, 3, 1, 10, 14)),

  notepad: i16((p) => {
    p.rect(2, 2, 12, 13, 'K');
    p.rect(3, 3, 10, 11, 'W');
    for (let x = 3; x < 13; x += 2) p.rect(x, 1, 1, 3, 'D');
    p.hline(3, 4, 10, 'b');
    for (const [y, w] of [[6, 8], [8, 9], [10, 6], [12, 8]]) p.hline(4, y, w, 'B');
    p.vline(14, 3, 12, 'D');
    p.hline(3, 15, 12, 'D');
  }),

  calc: i16((p) => {
    p.rect(3, 0, 11, 16, 'K');
    p.rect(4, 1, 9, 14, 'L');
    p.hline(4, 1, 9, 'W');
    p.rect(5, 2, 7, 3, 'K');
    p.rect(6, 3, 5, 1, 'g');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) p.rect(5 + c * 3, 6 + r * 2, 2, 1, c === 2 ? 'R' : 'D');
  }),

  paint: i16((p) => {
    p.map(0, 2, [
      '...KKKKKKK......',
      '..KWWWWWWWKK....',
      '.KWrrWWggWWWK...',
      'KWWrrWWggWWWWK..',
      'KWWWWWWWWWWWWK..',
      'KWbbWWWWWWWyyK..',
      'KWbbWWWKKWWyyK..',
      '.KWWWWK..KWWK...',
      '..KWmmWKKWWK....',
      '...KWmmWWWK.....',
      '....KKKKKK......',
    ]);
    p.line(15, 0, 9, 8, 'R');
    p.line(14, 0, 8, 8, 'Y');
    p.rect(7, 8, 2, 2, 'K');
  }),

  wordpad: i16((p) => {
    page16(p, 2, 1, 11, 14, 'D');
    p.line(14, 3, 8, 11, 'B');
    p.line(15, 4, 9, 12, 'b');
    p.px(8, 12, 'K');
  }),

  msdos: i16((p) => {
    p.rect(0, 1, 16, 14, 'K');
    p.rect(1, 2, 14, 2, 'B');
    p.text(2, 6, 'C:>', 'L');
    p.hline(13, 10, 2, 'W');
    p.hline(1, 14, 15, 'D');
  }),

  explorer: i16((p) => {
    folder16(p, 0, 3);
    magnifier(p, 10, 6, 2);
  }),

  mine: i16((p) => {
    p.line(7, 1, 7, 13, 'K');
    p.line(1, 7, 13, 7, 'K');
    p.line(3, 3, 11, 11, 'K');
    p.line(11, 3, 3, 11, 'K');
    p.disc(7, 7, 4, 'K');
    p.rect(5, 5, 2, 2, 'W');
  }),

  cards: i16((p) => {
    p.rect(1, 3, 8, 11, 'K');
    p.rect(2, 4, 6, 9, 'b');
    for (let y = 5; y < 12; y += 2) for (let x = 3; x < 7; x += 2) p.px(x + ((y / 2) % 2 ? 0 : 1), y, 'c');
    p.rect(6, 1, 9, 12, 'K');
    p.rect(7, 2, 7, 10, 'W');
    p.map(8, 4, ['r.r.r', 'rrrrr', '.rrr.', '..r..']);
    p.px(7, 2, 'r');
  }),

  scandisk: i16((p) => {
    p.rect(0, 5, 14, 9, 'K');
    p.rect(1, 6, 12, 7, 'L');
    p.hline(1, 6, 12, 'W');
    p.rect(2, 10, 8, 1, 'D');
    p.rect(11, 10, 1, 1, 'g');
    magnifier(p, 11, 4, 2);
  }),

  defrag: i16((p) => {
    p.rect(0, 1, 16, 14, 'K');
    const cols = ['b', 'b', 'r', 'W', 'b', 'c', 'b', 'r', 'b', 'W', 'c', 'b'];
    let k = 0;
    for (let y = 2; y < 14; y += 3) for (let x = 1; x < 15; x += 3) p.rect(x, y, 2, 2, cols[k++ % cols.length]);
  }),

  control: i16((p) => {
    monitor16(p, 0, 0, 'C');
    p.rect(11, 8, 5, 7, 'K');
    p.rect(12, 9, 3, 5, 'W');
    p.px(13, 9, 'K');
    p.px(13, 10, 'K');
  }),

  printer: i16((p) => {
    p.rect(3, 1, 9, 6, 'K');
    p.rect(4, 2, 7, 5, 'W');
    p.hline(5, 4, 5, 'D');
    p.rect(0, 6, 16, 7, 'K');
    p.rect(1, 7, 14, 5, 'L');
    p.hline(1, 7, 14, 'W');
    p.rect(11, 9, 2, 1, 'g');
    p.rect(3, 12, 10, 3, 'K');
    p.rect(4, 12, 8, 2, 'W');
  }),

  taskbar: i16((p) => {
    p.rect(0, 1, 16, 14, 'K');
    p.rect(1, 2, 14, 9, 'C');
    p.rect(1, 11, 14, 3, 'L');
    p.hline(1, 11, 14, 'W');
    p.rect(2, 12, 4, 1, 'K');
    p.rect(12, 12, 2, 1, 'D');
  }),

  find: i16((p) => {
    page16(p, 1, 0, 10, 13);
    magnifier(p, 9, 9, 3);
  }),

  findpc: i16((p) => {
    monitor16(p, 0, 0, 'C');
    magnifier(p, 10, 9, 3);
  }),

  help: i16((p) => {
    p.rect(2, 1, 12, 14, 'K');
    p.rect(3, 2, 10, 12, 'B');
    p.rect(3, 2, 2, 12, 'b');
    p.rect(4, 13, 10, 2, 'W');
    p.hline(4, 15, 10, 'K');
    p.map(7, 4, ['.yyy.', 'y...y', '...y.', '..y..', '.....', '..y..']);
  }),

  computer: i16((p) => {
    monitor16(p, 1, 0, 'C');
    p.rect(0, 13, 16, 3, 'K');
    p.rect(1, 14, 14, 1, 'L');
    p.px(3, 14, 'g');
  }),

  trash: i16((p) => {
    p.rect(3, 2, 10, 2, 'K');
    p.rect(6, 1, 4, 1, 'K');
    p.rect(4, 4, 8, 11, 'K');
    p.rect(5, 4, 6, 10, 'L');
    p.hline(5, 4, 6, 'W');
    for (const x of [6, 8, 10]) p.vline(x, 5, 9, 'D');
  }),

  network: i16((p) => {
    for (const [x, y] of [[0, 1], [9, 1]]) {
      p.rect(x, y, 7, 6, 'K');
      p.rect(x + 1, y + 1, 5, 4, 'C');
      p.rect(x + 2, y + 6, 3, 1, 'K');
    }
    p.rect(4, 10, 8, 5, 'K');
    p.rect(5, 11, 6, 3, 'C');
    p.line(3, 8, 6, 10, 'K');
    p.line(12, 8, 9, 10, 'K');
  }),

  globe: i16((p) => {
    p.disc(7.5, 7.5, 7, 'K');
    p.disc(7.5, 7.5, 6, 'b');
    p.map(3, 3, ['.gg....g.', 'gggg..ggg', '.ggg..gg.', '..g....g.', '......gg.', '.....ggg.', '......g..']);
    p.px(4, 2, 'c');
    p.px(3, 3, 'c');
  }),

  dialup: i16((p) => {
    p.rect(0, 2, 9, 7, 'K');
    p.rect(1, 3, 7, 5, 'L');
    p.rect(2, 4, 5, 3, 'b');
    p.rect(3, 9, 3, 1, 'K');
    p.rect(1, 10, 7, 1, 'K');
    p.rect(9, 9, 7, 6, 'K');
    p.rect(10, 10, 5, 4, 'R');
    p.rect(9, 7, 7, 2, 'K');
    p.hline(10, 8, 5, 'r');
    p.px(11, 11, 'W');
    p.px(13, 11, 'W');
    p.px(11, 13, 'W');
    p.px(13, 13, 'W');
  }),

  modem: i16((p) => {
    p.rect(0, 1, 9, 8, 'K');
    p.rect(1, 2, 7, 6, 'L');
    p.rect(2, 3, 5, 4, 'K');
    p.rect(2, 9, 5, 1, 'K');
    p.rect(6, 6, 10, 9, 'K');
    p.rect(7, 7, 8, 7, 'L');
    p.rect(8, 8, 6, 4, 'K');
    p.rect(8, 13, 6, 1, 'D');
  }),

  speaker: i16((p) => {
    p.map(0, 2, [
      '......K.........',
      '.....KK.........',
      '....KWK....K....',
      'KKKKWWK.....K...',
      'KWWWWWK..K...K..',
      'KWWWWWK...K..K..',
      'KWWWWWK...K..K..',
      'KWWWWWK..K...K..',
      'KKKKWWK.....K...',
      '....KWK....K....',
      '.....KK.........',
      '......K.........',
    ]);
  }),

  welcome: i16((p) => {
    p.rect(0, 2, 16, 13, 'K');
    p.rect(1, 3, 14, 2, 'B');
    p.rect(1, 5, 14, 9, 'W');
    p.map(3, 6, ['..y..', '.yyy.', 'yyWyy', '.yyy.', '..y..']);
    p.hline(9, 7, 4, 'D');
    p.hline(9, 9, 4, 'D');
    p.hline(9, 11, 3, 'D');
  }),

  run: i16((p) => {
    p.rect(0, 3, 13, 11, 'K');
    p.rect(1, 4, 11, 2, 'B');
    p.rect(1, 6, 11, 7, 'W');
    p.map(7, 0, ['....K...', '....KK..', 'KKKKKgK.', 'KggggggK', 'KKKKKgK.', '....KK..', '....K...']);
  }),

  shutdown: i16((p) => {
    monitor16(p, 0, 1, 'B');
    p.map(5, 3, ['.yy', 'yy.', 'y..', 'yy.', '.yy']);
  }),

  desktop: i16((p) => {
    p.rect(0, 3, 16, 10, 'K');
    p.rect(1, 4, 14, 8, 'C');
    p.rect(2, 5, 2, 2, 'W');
    p.rect(2, 8, 2, 2, 'y');
    p.rect(1, 11, 14, 1, 'L');
    p.line(14, 1, 8, 7, 'R');
    p.line(15, 2, 9, 8, 'y');
    p.px(8, 8, 'K');
  }),

  mail: i16((p) => {
    p.rect(0, 3, 16, 11, 'K');
    p.rect(1, 4, 14, 9, 'W');
    p.line(1, 4, 7, 9, 'D');
    p.line(14, 4, 8, 9, 'D');
    p.rect(11, 5, 3, 3, 'r');
  }),

  favorites: i16((p) => {
    folder16(p, 0, 3);
    p.map(7, 0, ['...K...', '..KyK..', 'KKKyKKK', 'KyyyyyK', '.KyyyK.', 'KyKKKyK', 'KK...KK']);
  }),

  scanner: i16((p) => {
    p.rect(0, 6, 16, 7, 'K');
    p.rect(1, 7, 14, 5, 'L');
    p.rect(1, 7, 14, 1, 'W');
    p.rect(2, 9, 12, 1, 'c');
    p.rect(12, 11, 2, 1, 'g');
    p.rect(1, 4, 14, 2, 'K');
    p.rect(2, 4, 12, 1, 'D');
  }),

  browser: i16((p) => {
    p.rect(0, 1, 16, 14, 'K');
    p.rect(1, 2, 14, 2, 'B');
    p.rect(1, 4, 14, 10, 'W');
    p.disc(7.5, 9, 3.6, 'b');
    p.map(5, 7, ['.gg.', 'ggg.', '..g.', '.gg.']);
  }),
};

// ——— 32 × 32 ———

export const ICON32 = {
  // Menu Démarrer
  programs: i32((p) => {
    folder32(p);
    p.rect(9, 13, 18, 13, 'K');
    p.rect(10, 14, 16, 2, 'B');
    p.rect(10, 16, 16, 9, 'W');
    p.rect(12, 18, 4, 3, 'r');
    p.rect(18, 18, 4, 3, 'g');
    p.rect(12, 22, 4, 2, 'b');
    p.rect(18, 22, 4, 2, 'y');
  }),

  documents: ICONS.documents,

  settings: i32((p) => {
    folder32(p);
    p.rect(9, 13, 16, 12, 'K');
    p.rect(10, 14, 14, 10, 'L');
    p.rect(11, 15, 12, 7, 'C');
    p.hline(11, 15, 5, 'c');
    p.rect(13, 25, 8, 2, 'K');
    p.rect(22, 18, 7, 9, 'K');
    p.rect(23, 19, 5, 7, 'W');
    p.rect(25, 19, 1, 3, 'K');
  }),

  find: i32((p) => {
    p.rect(4, 2, 18, 24, 'K');
    p.rect(5, 3, 16, 22, 'W');
    for (let y = 6; y < 23; y += 3) p.hline(7, y, 11, 'D');
    p.disc(19, 17, 7, 'K');
    p.disc(19, 17, 5.6, 'c');
    p.rect(16, 13, 2, 2, 'W');
    p.rect(15, 15, 1, 2, 'W');
    for (let i = 0; i < 6; i++) p.rect(23 + i, 21 + i, 3, 3, 'K');
    p.rect(24, 22, 1, 1, 'D');
  }),

  help: i32((p) => {
    p.rect(5, 2, 22, 27, 'K');
    p.rect(6, 3, 20, 23, 'B');
    p.rect(6, 3, 4, 23, 'b');
    p.vline(10, 3, 23, 'K');
    p.rect(7, 26, 20, 3, 'W');
    p.hline(7, 27, 19, 'L');
    p.hline(6, 29, 21, 'K');
    p.map(13, 7, [
      '..yyyyy..',
      '.yyKKKyy.',
      'yyK...Kyy',
      '......yy.',
      '.....yy..',
      '....yy...',
      '....yy...',
      '.........',
      '....yy...',
      '....yy...',
    ]);
  }),

  run: i32((p) => {
    p.rect(2, 6, 24, 20, 'K');
    p.rect(3, 7, 22, 3, 'B');
    p.rect(3, 10, 22, 15, 'W');
    p.hline(3, 25, 23, 'D');
    p.map(14, 2, [
      '..........K....',
      '..........KK...',
      '..........KgK..',
      'KKKKKKKKKKKggK.',
      'KgggggggggggggK',
      'KgggggggggggggK',
      'KKKKKKKKKKKggK.',
      '..........KgK..',
      '..........KK...',
      '..........K....',
    ]);
    p.hline(6, 15, 6, 'D');
    p.hline(6, 18, 8, 'D');
    p.hline(6, 21, 5, 'D');
  }),

  shutdown: i32((p) => {
    p.rect(3, 2, 26, 20, 'K');
    p.rect(4, 3, 24, 18, 'L');
    p.hline(4, 3, 24, 'W');
    p.rect(6, 5, 20, 14, 'K');
    p.rect(7, 6, 18, 12, 'B');
    p.map(12, 7, ['...yyyy.', '.yyyy...', 'yyyy....', 'yyy.....', 'yyyy....', '.yyyy...', '...yyyy.']);
    p.px(21, 8, 'W');
    p.px(19, 13, 'W');
    p.px(23, 15, 'W');
    p.rect(12, 22, 8, 2, 'K');
    p.rect(6, 24, 20, 5, 'K');
    p.rect(7, 25, 18, 3, 'L');
    p.rect(20, 26, 4, 1, 'D');
    p.rect(8, 26, 2, 1, 'g');
  }),

  update: i32((p) => {
    p.disc(14.5, 15.5, 12, 'K');
    p.disc(14.5, 15.5, 11, 'b');
    p.map(6, 7, ['...ggg.....gg', '..ggggg..gggg', '..gggggg.gggg', '...gggg...gg.', '....ggg......', '.....gg...gg.', '..........ggg', '..........gg.']);
    p.ring(14.5, 15.5, 11, 'c');
    p.map(20, 18, ['....K....', '...KyK...', '..KyyyK..', '.KyyyyyK.', 'KKKyyyKKK', '..KyyyK..', '..KyyyK..', '..KKKKK..']);
  }),

  favorites: i32((p) => {
    folder32(p);
    p.map(12, 12, [
      '......K......',
      '.....KyK.....',
      '.....KyK.....',
      'KKKKKyyyKKKKK',
      'KyyyyyyyyyyyK',
      '.KyyyyyyyyyK.',
      '..KyyyyyyyK..',
      '..KyyyKyyyK..',
      '.KyyK...KyyK.',
      '.KKK.....KKK.',
    ]);
  }),

  logoff: i32((p) => {
    p.rect(1, 9, 22, 18, 'K');
    p.rect(2, 10, 20, 3, 'B');
    p.rect(2, 13, 20, 13, 'L');
    p.hline(2, 13, 20, 'W');
    p.disc(21, 9, 6, 'K');
    p.disc(21, 9, 4.7, 'y');
    p.disc(21, 9, 1.6, 'K');
    p.px(19, 6, 'W');
    p.px(18, 7, 'W');
    p.line(17, 13, 8, 22, 'K');
    p.line(18, 13, 9, 22, 'K');
    p.line(17, 14, 9, 22, 'y');
    p.rect(9, 18, 3, 3, 'K');
    p.rect(12, 21, 3, 3, 'K');
  }),

  // Bureau
  briefcase: i32((p) => {
    p.rect(11, 4, 10, 6, 'K');
    p.rect(13, 6, 6, 4, '.');
    p.rect(2, 9, 28, 19, 'K');
    p.rect(3, 10, 26, 17, 'R');
    p.hline(3, 10, 26, 'r');
    p.hline(3, 17, 26, 'K');
    p.rect(14, 15, 4, 5, 'y');
    p.rect(15, 16, 2, 3, 'Y');
    p.hline(3, 26, 26, 'K');
  }),

  inbox: i32((p) => {
    p.rect(2, 12, 28, 16, 'K');
    p.rect(3, 13, 26, 14, 'L');
    p.hline(3, 13, 26, 'W');
    p.rect(8, 17, 16, 4, 'D');
    p.rect(9, 17, 14, 3, 'K');
    p.rect(7, 3, 18, 12, 'K');
    p.rect(8, 4, 16, 10, 'W');
    p.line(8, 4, 15, 10, 'D');
    p.line(23, 4, 16, 10, 'D');
    p.rect(20, 5, 3, 3, 'r');
  }),

  scanner: i32((p) => {
    p.rect(1, 13, 30, 13, 'K');
    p.rect(2, 14, 28, 11, 'L');
    p.hline(2, 14, 28, 'W');
    p.rect(1, 9, 30, 5, 'K');
    p.rect(2, 10, 28, 3, 'D');
    p.hline(2, 10, 28, 'L');
    p.rect(4, 17, 22, 2, 'c');
    p.hline(4, 17, 22, 'W');
    p.rect(25, 21, 3, 2, 'g');
    p.rect(4, 22, 12, 1, 'D');
    p.rect(29, 18, 2, 2, 'K');
    p.line(31, 19, 31, 30, 'K');
    p.rect(26, 28, 6, 3, 'K');
    p.rect(27, 29, 4, 1, 'L');
  }),

  bulb: i32((p) => {
    p.disc(15.5, 12, 9.6, 'K');
    p.disc(15.5, 12, 8.4, 'y');
    p.rect(10, 6, 2, 4, 'W');
    p.rect(12, 5, 2, 2, 'W');
    p.map(12, 10, ['K.K..K.K', '.K.KK.K.', '...KK...', '...KK...']);
    p.rect(11, 20, 10, 2, 'y');
    p.rect(11, 22, 10, 6, 'K');
    p.rect(12, 22, 8, 1, 'L');
    p.rect(12, 24, 8, 1, 'L');
    p.rect(12, 26, 8, 1, 'L');
    p.rect(14, 28, 4, 2, 'K');
    for (const [x, y] of [[3, 3], [28, 3], [1, 13], [30, 13], [4, 22], [27, 22]]) p.px(x, y, 'y');
  }),

  floppy: i32((p) => {
    p.rect(3, 6, 26, 21, 'K');
    p.rect(4, 7, 24, 19, 'D');
    p.rect(6, 7, 20, 3, 'L');
    p.rect(8, 8, 3, 2, 'D');
    p.rect(6, 22, 20, 3, 'K');
    p.rect(9, 23, 14, 1, 'L');
    p.rect(4, 7, 24, 1, 'L');
    p.rect(4, 27, 25, 1, 'K');
  }),

  hdd: i32((p) => {
    p.rect(2, 10, 28, 14, 'K');
    p.rect(3, 11, 26, 12, 'L');
    p.hline(3, 11, 26, 'W');
    p.vline(3, 11, 12, 'W');
    p.rect(5, 18, 14, 2, 'D');
    p.rect(23, 18, 3, 2, 'g');
    p.rect(3, 24, 27, 2, 'D');
    p.text(5, 13, 'C:', 'K');
  }),

  cdrom: i32((p) => {
    p.rect(2, 13, 28, 12, 'K');
    p.rect(3, 14, 26, 10, 'L');
    p.hline(3, 14, 26, 'W');
    p.rect(5, 18, 18, 2, 'K');
    p.rect(25, 20, 2, 2, 'g');
    p.disc(16, 9, 7, 'K');
    p.disc(16, 9, 6, 'c');
    p.map(11, 4, ['..mm', '.mmy', 'mmy.', 'myy.']);
    p.disc(16, 9, 1.4, 'K');
  }),

  printer: i32((p) => {
    p.rect(8, 3, 16, 10, 'K');
    p.rect(9, 4, 14, 9, 'W');
    for (let y = 6; y < 12; y += 2) p.hline(11, y, 10, 'D');
    p.rect(2, 12, 28, 12, 'K');
    p.rect(3, 13, 26, 10, 'L');
    p.hline(3, 13, 26, 'W');
    p.rect(22, 16, 4, 2, 'g');
    p.rect(6, 22, 20, 7, 'K');
    p.rect(7, 22, 18, 6, 'W');
    p.hline(3, 23, 26, 'D');
  }),

  keys: i32((p) => {
    p.disc(10, 10, 7, 'K');
    p.disc(10, 10, 5.6, 'y');
    p.disc(10, 10, 2.2, 'K');
    p.line(14, 14, 26, 26, 'K');
    p.line(15, 14, 27, 26, 'K');
    p.line(14, 15, 26, 27, 'y');
    p.rect(22, 25, 3, 3, 'K');
    p.rect(25, 22, 3, 3, 'K');
    p.px(7, 7, 'W');
    p.px(6, 8, 'W');
  }),

  dialupFolder: i32((p) => {
    folder32(p);
    p.rect(9, 14, 12, 9, 'K');
    p.rect(10, 15, 10, 7, 'L');
    p.rect(11, 16, 8, 5, 'b');
    p.rect(19, 19, 9, 7, 'K');
    p.rect(20, 20, 7, 5, 'R');
    p.hline(20, 18, 7, 'K');
  }),

  disc: i32((p) => {
    p.disc(15.5, 15.5, 13, 'K');
    p.disc(15.5, 15.5, 12, 'L');
    p.map(6, 6, ['.....cc', '...cccm', '..ccmm.', '.cmmy..', '.cmy...', 'cmy....', 'cy.....']);
    p.disc(15.5, 15.5, 4, 'K');
    p.disc(15.5, 15.5, 3, 'W');
    p.disc(15.5, 15.5, 1.4, 'K');
  }),
};

// ——— Barre d'outils du navigateur (20 × 20) ———

export const TOOL20 = {
  back: i20((p) => {
    p.map(2, 4, [
      '.......KK.......',
      '......KgK.......',
      '.....KggK.......',
      '....KgggKKKKKKK.',
      '...KggggggggggK.',
      '..KgggggggggggK.',
      '...KGgggggggggK.',
      '....KGggKKKKKKK.',
      '.....KGgK.......',
      '......KGK.......',
      '.......KK.......',
    ]);
  }),
  forward: i20((p) => {
    p.map(2, 4, [
      '.......KK.......',
      '.......KgK......',
      '.......KggK.....',
      'KKKKKKKKgggK....',
      'KgggggggggggK...',
      'KggggggggggggK..',
      'KggggggggggGK...',
      'KKKKKKKggGK.....',
      '.......KgGK.....',
      '.......KGK......',
      '.......KK.......',
    ]);
  }),
  stop: i20((p) => {
    p.rect(3, 2, 13, 16, 'K');
    p.rect(4, 3, 11, 14, 'W');
    for (let i = 0; i < 8; i++) {
      p.rect(5 + i, 6 + i, 2, 1, 'r');
      p.rect(12 - i, 6 + i, 2, 1, 'r');
    }
  }),
  refresh: i20((p) => {
    p.rect(3, 1, 14, 18, 'K');
    p.rect(4, 2, 12, 16, 'W');
    for (let a = 50; a <= 330; a += 4) {
      const r = (a * Math.PI) / 180;
      for (const d of [3.6, 4.5]) p.px(9.5 + Math.cos(r) * d, 10 + Math.sin(r) * d, a > 190 ? 'g' : 'G');
    }
    p.map(11, 3, ['GK...', 'GGK..', 'GgGK.', 'GggGK', 'GGGGG']);
  }),
  home: i20((p) => {
    p.map(1, 2, [
      '........KK........',
      '.......KrrK..KK...',
      '......KrrrrK.KK...',
      '.....KrrrrrrKKK...',
      '....KrrrrrrrrKK...',
      '...KrrrrrrrrrrK...',
      '..KrrrrrrrrrrrrK..',
      '.KKKKKKKKKKKKKKKK.',
      '..KyyyyyyyyyyyyK..',
      '..KyKKKyyyyKKKyK..',
      '..KyKcKyyyyKRKyK..',
      '..KyKKKyyyyKRKyK..',
      '..KyyyyyyyyKRKyK..',
      '..KyyyyyyyyKRKyK..',
      '..KKKKKKKKKKKKKK..',
    ]);
  }),
  search: i20((p) => {
    p.disc(8, 8, 6.5, 'K');
    p.disc(8, 8, 5.4, 'b');
    p.map(4, 4, ['.gg..', 'gggg.', '.gg.g', '..ggg', '...g.']);
    p.ring(8, 8, 5.4, 'c');
    for (let i = 0; i < 5; i++) p.rect(12 + i, 12 + i, 3, 3, 'K');
    p.rect(13, 13, 1, 1, 'D');
  }),
  favorites: i20((p) => {
    p.map(2, 2, [
      '.......KK.......',
      '......KyyK......',
      '......KyyK......',
      '.....KyyyyK.....',
      'KKKKKKyyyyKKKKKK',
      'KyyyyyyyyyyyyyyK',
      '.KyyyyyyyyyyyyK.',
      '..KyyyyyyyyyyK..',
      '...KyyyyyyyyK...',
      '...KyyyyyyyyK...',
      '..KyyyyKKyyyyK..',
      '..KyyyK..KyyyK..',
      '.KyyK......KyyK.',
      '.KKK........KKK.',
    ]);
  }),
  history: i20((p) => {
    p.disc(9.5, 9.5, 8, 'K');
    p.disc(9.5, 9.5, 7, 'W');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      p.px(9.5 + Math.cos(a) * 6, 9.5 + Math.sin(a) * 6, i % 3 ? 'D' : 'K');
    }
    p.vline(9, 4, 6, 'K');
    p.hline(9, 9, 4, 'B');
    p.rect(9, 9, 2, 2, 'r');
  }),
  print: i20((p) => {
    p.rect(5, 2, 10, 7, 'K');
    p.rect(6, 3, 8, 6, 'W');
    p.rect(1, 8, 18, 7, 'K');
    p.rect(2, 9, 16, 5, 'L');
    p.hline(2, 9, 16, 'W');
    p.rect(14, 10, 2, 1, 'g');
    p.rect(4, 13, 12, 5, 'K');
    p.rect(5, 13, 10, 4, 'W');
  }),
};

// Globe qui tourne (logo animé du navigateur) : 8 images côte à côte.
export const GLOBE_FRAMES = 8;
export const GLOBE_SPRITE = (() => {
  const land = [
    '...gg.....g.....ggg.....',
    '..gggg...ggg...ggggg....',
    '.ggggg...gggg..gggggg...',
    '.gggg.....ggg...gggg....',
    '..ggg......gg....gg.....',
    '...gg.....ggg...........',
    '....g....gggg.......gg..',
    '.........ggg.......gggg.',
    '..........g........ggg..',
    '....................g...',
  ];
  const w = 24;
  return pixelArt([24 * GLOBE_FRAMES, 24], (p) => {
    for (let f = 0; f < GLOBE_FRAMES; f++) {
      const ox = f * 24;
      const shift = f * 3;
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 24; x++) {
          const d = Math.hypot(x - 11.5, y - 11.5);
          if (d > 10.6) continue;
          if (d > 9.6) {
            p.px(ox + x, y, 'K');
            continue;
          }
          const row = land[y - 7];
          const ch = row ? row[(x + shift) % w] : '.';
          const lit = x + y < 18;
          p.px(ox + x, y, ch === 'g' ? (lit ? 'g' : 'G') : lit ? 'b' : 'B');
        }
      }
      p.px(ox + 7, 5, 'W');
      p.px(ox + 6, 6, 'c');
      p.px(ox + 5, 7, 'c');
    }
  });
})();

// Pointeur « travail en arrière-plan » : flèche et petit sablier
export const APPSTARTING = pixelArt([22, 22], (p) =>
  p.map(0, 0, [
    'K.....................',
    'KK....................',
    'KWK...................',
    'KWWK..................',
    'KWWWK.................',
    'KWWWWK................',
    'KWWWWWK...............',
    'KWWWWWWK..............',
    'KWWWWWWWK.............',
    'KWWWWWWWWK.KKKKKKKK...',
    'KWWWWWWWWWKKWWWWWWK...',
    'KWWWWWWKKKKKKKKKKKK...',
    'KWWWKWWK....KWWWWK....',
    'KWWKKWWK....KKWWKK....',
    'KWK..KWWK....KKKK.....',
    'KK...KWWK.....KK......',
    'K.....KWWK...KWWK.....',
    '......KWWK..KWWWWK....',
    '.......KK...KKKKKK....',
    '...........KWWWWWWK...',
    '...........KKKKKKKK...',
    '......................',
  ]),
);
