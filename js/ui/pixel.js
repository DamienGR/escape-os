// Pixel art en SVG : on dessine sur une petite grille (rect, ligne, disque, texte
// 3 × 5) et on obtient un SVG net à toute taille (shape-rendering: crispEdges).
// Sert aux icônes et aux pointeurs (flèche, sablier) des époques graphiques.

export const VGA = {
  K: '#000000',
  B: '#000080',
  G: '#008000',
  C: '#008080',
  R: '#800000',
  M: '#800080',
  Y: '#808000',
  L: '#c0c0c0',
  D: '#808080',
  b: '#0000ff',
  g: '#00ff00',
  c: '#00ffff',
  r: '#ff0000',
  m: '#ff00ff',
  y: '#ffff00',
  W: '#ffffff',
};

// Police 3 × 5 pour les petites inscriptions d'icônes
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111101101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111',
  2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110',
  6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  ':': '000010000010000', '\\': '100100010001001', '>': '100010001010100', '.': '000000000000010',
  '-': '000000111000000', '!': '010010010000010', '?': '110001010000010', ' ': '000000000000000',
};

export function pixelArt(size, draw, { palette = VGA, className = '', label } = {}) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  const grid = Array.from({ length: h }, () => new Array(w).fill(null));
  const color = (c) => palette[c] ?? c;
  const set = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    grid[y][x] = c === '.' || c == null ? null : color(c);
  };

  const p = {
    w,
    h,
    px: set,
    rect(x, y, rw, rh, c) {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) set(x + i, y + j, c);
    },
    hline(x, y, len, c) {
      for (let i = 0; i < len; i++) set(x + i, y, c);
    },
    vline(x, y, len, c) {
      for (let j = 0; j < len; j++) set(x, y + j, c);
    },
    frame(x, y, rw, rh, c) {
      p.hline(x, y, rw, c);
      p.hline(x, y + rh - 1, rw, c);
      p.vline(x, y, rh, c);
      p.vline(x + rw - 1, y, rh, c);
    },
    // Biseau façon Windows : clair en haut à gauche, sombre en bas à droite
    bevel(x, y, rw, rh, light = 'W', dark = 'D', fill = 'L') {
      if (fill) p.rect(x, y, rw, rh, fill);
      p.hline(x, y, rw, light);
      p.vline(x, y, rh, light);
      p.hline(x, y + rh - 1, rw, dark);
      p.vline(x + rw - 1, y, rh, dark);
    },
    line(x0, y0, x1, y1, c) {
      let dx = Math.abs(x1 - x0);
      let dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        set(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y0 += sy;
        }
      }
    },
    disc(cx, cy, r, c) {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.6) set(x, y, c);
        }
      }
    },
    ring(cx, cy, r, c) {
      for (let a = 0; a < 360; a += 2) {
        set(cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r, c);
      }
    },
    // Motif de lignes : '.' transparent, sinon lettre de palette (ou légende)
    map(x, y, rows, legend = {}) {
      rows.forEach((row, j) => {
        [...row].forEach((ch, i) => {
          if (ch !== '.' && ch !== ' ') set(x + i, y + j, legend[ch] ?? ch);
        });
      });
    },
    text(x, y, str, c) {
      let cx = x;
      for (const ch of String(str).toUpperCase()) {
        const glyph = FONT[ch] ?? FONT['?'];
        for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (glyph[j * 3 + i] === '1') set(cx + i, y + j, c);
        cx += 4;
      }
    },
  };

  draw(p);

  const paths = new Map();
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const c = grid[y][x];
      if (!c) {
        x += 1;
        continue;
      }
      let run = 1;
      while (x + run < w && grid[y][x + run] === c) run += 1;
      paths.set(c, `${paths.get(c) ?? ''}M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  const body = [...paths].map(([c, d]) => `<path fill="${c}" d="${d}"/>`).join('');
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="px ${className}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges" ${aria}>${body}</svg>`;
}

// Pointeur CSS à partir d'un SVG pixel art
export function svgCursor(svg, hotX = 0, hotY = 0, fallback = 'default', scale = 1) {
  const sized = scale === 1 ? svg : svg.replace(/width="(\d+)" height="(\d+)"/, (_, w, h) => `width="${w * scale}" height="${h * scale}"`);
  return `url("data:image/svg+xml,${encodeURIComponent(sized)}") ${hotX * scale} ${hotY * scale}, ${fallback}`;
}

// ——— Pointeurs classiques, redessinés ———

export const ARROW = pixelArt([12, 19], (p) =>
  p.map(0, 0, [
    'K...........',
    'KK..........',
    'KWK.........',
    'KWWK........',
    'KWWWK.......',
    'KWWWWK......',
    'KWWWWWK.....',
    'KWWWWWWK....',
    'KWWWWWWWK...',
    'KWWWWWWWWK..',
    'KWWWWWWWWWK.',
    'KWWWWWWKKKKK',
    'KWWWKWWK....',
    'KWWKKWWK....',
    'KWK..KWWK...',
    'KK...KWWK...',
    'K.....KWWK..',
    '......KWWK..',
    '.......KK...',
  ]),
);

export const HOURGLASS = pixelArt([13, 22], (p) =>
  p.map(0, 0, [
    'KKKKKKKKKKKKK',
    'KWWWWWWWWWWWK',
    'KKKKKKKKKKKKK',
    '.KWWWWWWWWWK.',
    '.KWWWWWWWWWK.',
    '.KWKKKKKKKWK.',
    '.KWWKKKKKWWK.',
    '..KWWKKKWWK..',
    '...KWWKWWK...',
    '....KWKWK....',
    '.....KWK.....',
    '.....KWK.....',
    '....KWWWK....',
    '...KWWKWWK...',
    '..KWWWKWWWK..',
    '.KWWWWKWWWWK.',
    '.KWWWKKKWWWK.',
    '.KWWKKKKKWWK.',
    '.KWKKKKKKKWK.',
    'KKKKKKKKKKKKK',
    'KWWWWWWWWWWWK',
    'KKKKKKKKKKKKK',
  ]),
);

export const HAND = pixelArt([17, 22], (p) =>
  p.map(0, 0, [
    '.....KK..........',
    '....KWWK.........',
    '....KWWK.........',
    '....KWWK.........',
    '....KWWK.........',
    '....KWWKKK.......',
    '....KWWKWWKKK....',
    '....KWWKWWKWWKK..',
    'KKK.KWWKWWKWWKWK.',
    'KWWKKWWWWWWWWKWWK',
    'KWWWKWWWWWWWWWWWK',
    '.KWWKWWWWWWWWWWWK',
    '..KWWWWWWWWWWWWWK',
    '..KWWWWWWWWWWWWWK',
    '...KWWWWWWWWWWWK.',
    '...KWWWWWWWWWWWK.',
    '....KWWWWWWWWWK..',
    '....KWWWWWWWWWK..',
    '.....KWWWWWWWK...',
    '.....KWWWWWWWK...',
    '.....KKKKKKKKK...',
    '.................',
  ]),
);
