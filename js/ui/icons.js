// Icônes 32 × 32 « dans l'esprit » des années 90, dessinées en pixel art.
// Aucune n'est une copie : formes simples, palette VGA 16 couleurs.

import { pixelArt } from './pixel.js';

const icon = (draw) => pixelArt(32, draw);

export const ICONS = {
  // Groupe du Gestionnaire de programmes réduit
  group: icon((p) => {
    p.rect(3, 6, 26, 21, 'K');
    p.rect(4, 7, 24, 3, 'B');
    p.rect(4, 10, 24, 16, 'W');
    p.rect(7, 13, 5, 4, 'r');
    p.rect(14, 13, 5, 4, 'y');
    p.rect(21, 13, 4, 4, 'g');
    p.rect(7, 19, 5, 4, 'b');
    p.rect(14, 19, 5, 4, 'C');
    p.rect(5, 27, 25, 1, 'D');
    p.rect(29, 7, 1, 21, 'D');
  }),

  // Gestionnaire de fichiers : armoire à tiroirs
  files: icon((p) => {
    p.rect(7, 3, 18, 26, 'K');
    p.rect(8, 4, 16, 24, 'y');
    p.rect(8, 4, 16, 1, 'W');
    for (const y of [6, 14, 22]) {
      p.rect(10, y, 12, 6, 'K');
      p.rect(11, y + 1, 10, 4, 'Y');
      p.rect(14, y + 2, 4, 2, 'L');
    }
    p.rect(9, 29, 15, 1, 'D');
  }),

  // Panneau de configuration : écran et souris
  control: icon((p) => {
    p.rect(3, 4, 20, 16, 'K');
    p.rect(4, 5, 18, 14, 'L');
    p.rect(6, 7, 14, 10, 'C');
    p.rect(7, 8, 5, 3, 'c');
    p.rect(10, 20, 6, 2, 'K');
    p.rect(6, 22, 14, 3, 'K');
    p.rect(7, 23, 12, 1, 'L');
    p.rect(22, 18, 7, 10, 'K');
    p.rect(23, 19, 5, 8, 'W');
    p.rect(25, 19, 1, 3, 'K');
    p.vline(25, 12, 6, 'K');
    p.hline(25, 12, 4, 'K');
  }),

  // Invite MS-DOS
  msdos: icon((p) => {
    p.rect(2, 6, 28, 20, 'K');
    p.rect(3, 7, 26, 3, 'B');
    p.rect(3, 10, 26, 15, 'K');
    p.text(5, 13, 'C:\\>', 'L');
    p.rect(22, 18, 3, 1, 'L');
    p.rect(3, 26, 27, 1, 'D');
  }),

  // Bloc-notes : bloc à spirale
  notepad: icon((p) => {
    p.rect(6, 3, 20, 27, 'K');
    p.rect(7, 4, 18, 25, 'W');
    for (let x = 8; x < 25; x += 3) p.rect(x, 2, 1, 4, 'D');
    for (let y = 9; y < 28; y += 3) p.hline(9, y, 14, 'c');
    p.hline(9, 9, 10, 'B');
    p.hline(9, 12, 13, 'B');
    p.hline(9, 15, 8, 'B');
    p.rect(26, 5, 1, 25, 'D');
  }),

  // Lisez-moi : document à coin plié
  readme: icon((p) => {
    p.rect(7, 3, 16, 26, 'K');
    p.rect(8, 4, 14, 24, 'W');
    p.rect(19, 3, 4, 4, 'L');
    p.line(19, 3, 23, 7, 'K');
    for (let y = 9; y < 26; y += 3) p.hline(10, y, 10, 'D');
    p.rect(23, 7, 1, 22, 'D');
  }),

  // Horloge
  clock: icon((p) => {
    p.disc(15.5, 15.5, 13, 'K');
    p.disc(15.5, 15.5, 12, 'L');
    p.disc(15.5, 15.5, 10, 'W');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      p.px(15.5 + Math.cos(a) * 8.6, 15.5 + Math.sin(a) * 8.6, 'K');
    }
    p.line(16, 16, 16, 8, 'K');
    p.line(16, 16, 21, 19, 'K');
    p.rect(15, 15, 2, 2, 'r');
  }),

  // Calculatrice
  calc: icon((p) => {
    p.rect(6, 2, 20, 28, 'K');
    p.rect(7, 3, 18, 26, 'L');
    p.rect(9, 5, 14, 5, 'K');
    p.rect(10, 6, 12, 3, 'g');
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) p.rect(9 + c * 4, 12 + r * 4, 3, 3, c === 3 ? 'R' : 'D');
    }
  }),

  // Solitaire : deux cartes
  cards: icon((p) => {
    p.rect(3, 6, 15, 21, 'K');
    p.rect(4, 7, 13, 19, 'b');
    for (let y = 8; y < 25; y += 2) for (let x = 5 + (y % 4 === 0 ? 1 : 0); x < 16; x += 2) p.px(x, y, 'c');
    p.rect(13, 3, 16, 22, 'K');
    p.rect(14, 4, 14, 20, 'W');
    p.text(15, 6, 'A', 'r');
    p.map(18, 11, ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...']);
    p.rect(29, 4, 1, 21, 'D');
  }),

  // Démineur : une mine
  mine: icon((p) => {
    p.line(15, 3, 15, 28, 'K');
    p.line(3, 15, 28, 15, 'K');
    p.line(7, 7, 24, 24, 'K');
    p.line(24, 7, 7, 24, 'K');
    p.disc(15.5, 15.5, 8, 'K');
    p.rect(12, 11, 3, 3, 'W');
  }),

  // SAUT.EXE : un portail temporel
  portal: icon((p) => {
    p.disc(15.5, 15.5, 14, 'K');
    p.disc(15.5, 15.5, 13, 'M');
    p.disc(15.5, 15.5, 10, 'm');
    p.disc(15.5, 15.5, 7, 'b');
    p.disc(15.5, 15.5, 4, 'c');
    p.disc(15.5, 15.5, 1.5, 'W');
    p.map(19, 3, ['..KK....', '..KyK...', 'KKKyyK..', 'KyyyyyK.', 'KKKyyK..', '..KyK...', '..KK....']);
  }),

  // Poste de travail (95/98)
  computer: icon((p) => {
    p.rect(4, 3, 22, 18, 'K');
    p.rect(5, 4, 20, 16, 'L');
    p.rect(7, 6, 16, 12, 'K');
    p.rect(8, 7, 14, 10, 'C');
    p.rect(9, 8, 5, 2, 'c');
    p.rect(11, 21, 8, 2, 'K');
    p.rect(3, 23, 26, 6, 'K');
    p.rect(4, 24, 24, 4, 'L');
    p.rect(19, 25, 6, 1, 'D');
    p.rect(6, 25, 2, 2, 'g');
  }),

  // Corbeille
  trash: icon((p) => {
    p.rect(8, 6, 16, 3, 'K');
    p.rect(9, 7, 14, 1, 'L');
    p.rect(13, 4, 6, 2, 'K');
    p.rect(9, 9, 14, 20, 'K');
    p.rect(10, 10, 12, 18, 'L');
    for (let x = 12; x < 22; x += 3) p.vline(x, 11, 16, 'D');
    p.rect(10, 10, 12, 1, 'W');
  }),

  // Dossier
  folder: icon((p) => {
    p.rect(3, 8, 11, 4, 'K');
    p.rect(4, 9, 9, 3, 'y');
    p.rect(3, 11, 26, 17, 'K');
    p.rect(4, 12, 24, 15, 'y');
    p.rect(4, 12, 24, 1, 'W');
    p.rect(4, 26, 24, 1, 'Y');
  }),

  // Globe (navigateur)
  globe: icon((p) => {
    p.disc(15.5, 15.5, 13, 'K');
    p.disc(15.5, 15.5, 12, 'b');
    p.map(6, 7, [
      '...ggg.......gg.',
      '..ggggg....gggg.',
      '..gggggg..ggggg.',
      '...gggg...gggg..',
      '....ggg....gg...',
      '.....gg.........',
      '......g...gg....',
      '.........gggg...',
      '.........ggggg..',
      '..........ggg...',
      '...........g....',
    ]);
    p.ring(15.5, 15.5, 12, 'c');
  }),

  // Connexion à Internet : téléphone et ordinateur
  dialup: icon((p) => {
    p.rect(2, 6, 16, 13, 'K');
    p.rect(3, 7, 14, 11, 'L');
    p.rect(5, 9, 10, 7, 'b');
    p.rect(7, 19, 6, 2, 'K');
    p.rect(4, 21, 12, 2, 'K');
    p.rect(18, 15, 12, 10, 'K');
    p.rect(19, 16, 10, 8, 'R');
    p.rect(17, 12, 14, 4, 'K');
    p.rect(18, 13, 12, 2, 'r');
    p.rect(21, 18, 2, 2, 'W');
    p.rect(25, 18, 2, 2, 'W');
    p.rect(21, 21, 2, 2, 'W');
    p.rect(25, 21, 2, 2, 'W');
    p.line(16, 10, 22, 4, 'y');
    p.line(22, 4, 26, 8, 'y');
  }),

  // Documents
  documents: icon((p) => {
    p.rect(3, 8, 11, 4, 'K');
    p.rect(4, 9, 9, 3, 'y');
    p.rect(3, 11, 26, 17, 'K');
    p.rect(4, 12, 24, 15, 'y');
    p.rect(9, 4, 14, 18, 'K');
    p.rect(10, 5, 12, 16, 'W');
    for (let y = 8; y < 19; y += 3) p.hline(12, y, 8, 'D');
    p.rect(3, 16, 26, 12, 'K');
    p.rect(4, 17, 24, 10, 'y');
    p.rect(4, 17, 24, 1, 'W');
  }),

  // Réseau
  network: icon((p) => {
    for (const [x, y] of [[2, 4], [18, 4], [10, 17]]) {
      p.rect(x, y, 12, 9, 'K');
      p.rect(x + 1, y + 1, 10, 7, 'C');
      p.rect(x + 3, y + 9, 6, 2, 'K');
    }
    p.line(8, 15, 14, 19, 'K');
    p.line(24, 15, 18, 19, 'K');
  }),

  // Exécutable générique
  exe: icon((p) => {
    p.rect(3, 5, 26, 22, 'K');
    p.rect(4, 6, 24, 3, 'B');
    p.rect(4, 9, 24, 17, 'W');
    p.text(10, 14, 'EXE', 'K');
  }),
};
