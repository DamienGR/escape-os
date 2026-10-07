// La salle machine des années 1960, dessinée en SVG et en CSS : armoires à
// bandes, unité centrale, imprimante à chaîne, lecteur de cartes, horloge,
// calendrier, note de l'opérateur et bureau où l'on reconstitue le paquet.
// Chaque élément a une taille de référence ; la mise en page (paysage ou
// portrait) le place et le met à l'échelle.

export const SIZES = {
  tape1: [108, 262],
  tape2: [108, 262],
  cpu: [172, 214],
  printer: [224, 184],
  reader: [214, 178],
  readerFront: [214, 178],
  note: [204, 156],
  clock: [64, 64],
  calendar: [62, 84],
  sign: [126, 26],
  slip: [190, 98],
};

// Points de référence dans le repère du lecteur et de l'imprimante
export const HOPPER = { x: 60, y: 21, w: 82 }; // carte posée dans la trémie
export const SLOT = { x: 112, y: 17 }; // fente de sortie du papier

// ——— Mises en page ———
// Cartes : largeur dans le bac (tray) et par terre (floor).
// floor : zone où tombent les centres des cartes éparpillées ; drop : zone où
// l'on peut reposer une carte. slots : positions normalisées (u, v), rotation et
// ordre d'empilement des cartes au sol : les rangées proches recouvrent les plus
// lointaines, et dans une rangée la carte de gauche passe dessus, pour ne jamais
// cacher un numéro (il est au bout droit de chaque carte).

export const LAYOUTS = {
  landscape: {
    key: 'landscape',
    w: 1120,
    h: 640,
    floorY: 296,
    parts: {
      tape1: { x: 22, y: 38 },
      tape2: { x: 136, y: 38 },
      cpu: { x: 256, y: 88 },
      sign: { x: 280, y: 40 },
      clock: { x: 470, y: 22 },
      calendar: { x: 560, y: 14 },
      note: { x: 450, y: 112, r: -2.2 },
      printer: { x: 662, y: 116 },
      reader: { x: 896, y: 120 },
      slip: { x: 468, y: 198, r: 4 },
    },
    desk: { x: 690, y: 262, w: 450, h: 400 },
    tray: { x: 712, y: 272, pad: 15 },
    card: { tray: 368, floor: 212 },
    floor: { x0: 118, y0: 364, x1: 572, y1: 578 },
    drop: { x0: 108, y0: 340, x1: 584, y1: 600 },
    slots: [
      [0, 0.02, -14, 2],
      [0.5, -0.04, 9, 1],
      [1, 0.06, -6, 0],
      [0.1, 0.52, 12, 4],
      [0.58, 0.47, -17, 3],
      [-0.02, 1, 5, 7],
      [0.45, 1.02, -9, 6],
      [0.98, 0.88, 15, 5],
    ],
    jitter: [0.035, 0.045, 5],
    camera: { width: 330, slot: 0.8 },
    bubble: { x: 318, y: 292 },
  },
  portrait: {
    key: 'portrait',
    w: 640,
    h: 1300,
    floorY: 384,
    parts: {
      note: { x: 20, y: 20, s: 1.28, r: -2 },
      clock: { x: 332, y: 22, s: 1.12 },
      calendar: { x: 418, y: 16, s: 1.12 },
      tape1: { x: 12, y: 196, s: 0.72 },
      printer: { x: 98, y: 214, s: 0.93 },
      reader: { x: 318, y: 134, s: 1.4 },
      slip: { x: 26, y: 44, s: 1.66, r: 2.5 },
    },
    hide: ['tape2', 'cpu', 'sign'],
    desk: { x: 38, y: 372, w: 564, h: 546 },
    tray: { x: 68, y: 384, pad: 16 },
    // Bandes plus hautes qu'en paysage : des cibles confortables au doigt
    card: { tray: 472, floor: 300 },
    band: 62,
    floor: { x0: 162, y0: 986, x1: 466, y1: 1214 },
    drop: { x0: 152, y0: 962, x1: 476, y1: 1230 },
    slots: [
      [0, 0, -7, 1],
      [0.98, 0.03, 5, 0],
      [0.04, 0.34, 8, 3],
      [0.95, 0.32, -5, 2],
      [-0.02, 0.66, -3, 5],
      [0.98, 0.68, 7, 4],
      [0.05, 1, 6, 7],
      [0.94, 0.99, -3, 6],
    ],
    jitter: [0.03, 0.025, 2.5],
    camera: { width: 192, slot: 0.84 },
    bubble: { x: 320, y: 806 },
  },
};

// ——— Dessins ———

const lens = (cls, x, y, w, h, label, two) => `
  <g class="cr-lens ${cls}">
    <rect class="cr-lens-glow" x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="4"/>
    <rect class="cr-lens-face" x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>
    ${
      two
        ? `<text class="cr-lens-tx" x="${x + w / 2}" y="${y + h / 2 - 1}" text-anchor="middle">${label}</text>
           <text class="cr-lens-tx" x="${x + w / 2}" y="${y + h / 2 + 5.5}" text-anchor="middle">${two}</text>`
        : `<text class="cr-lens-tx" x="${x + w / 2}" y="${y + h / 2 + 2.3}" text-anchor="middle">${label}</text>`
    }
  </g>`;

function reel(cx, cy, pack, n) {
  const windows = [0, 120, 240]
    .map((a) => {
      const r = (deg) => (deg * Math.PI) / 180;
      const p = (rad, deg) => `${(cx + rad * Math.cos(r(deg))).toFixed(2)} ${(cy + rad * Math.sin(r(deg))).toFixed(2)}`;
      return `M${p(14, a - 32)}L${p(29, a - 24)}A29 29 0 0 1 ${p(29, a + 24)}L${p(14, a + 32)}A14 14 0 0 0 ${p(14, a - 32)}z`;
    })
    .join('');
  return `<g class="cr-reel cr-reel-${n}">
    <circle cx="${cx}" cy="${cy}" r="33" fill="#cfd6da" fill-opacity=".16"/>
    <circle cx="${cx}" cy="${cy}" r="${pack}" fill="#4a3327"/>
    <circle cx="${cx}" cy="${cy}" r="${pack - 4}" fill="none" stroke="#5d4130" stroke-width=".8"/>
    <path d="${windows}" fill="#0c1013" fill-opacity=".38"/>
    <circle cx="${cx}" cy="${cy}" r="11" fill="#e3e7e9"/>
    <path d="M${cx - 2} ${cy - 9}h4v5h-4zM${cx + 5.8} ${cy + 3.4}l2 3.5-4.3 2.5-2-3.5zM${cx - 5.8} ${cy + 3.4}l-2 3.5 4.3 2.5 2-3.5z" fill="#20272b"/>
    <circle cx="${cx}" cy="${cy}" r="2.6" fill="#7e878c"/>
    <path d="M${cx + 20} ${cy - 25}a32 32 0 0 1 10 9" stroke="#f4efe1" stroke-width="3" fill="none"/>
    <circle cx="${cx}" cy="${cy}" r="33" fill="none" stroke="#e6ebed" stroke-opacity=".8" stroke-width="1.5"/>
  </g>`;
}

function tape(n) {
  return `<div class="cr-part cr-tape" data-part="tape${n}">
    <svg viewBox="0 0 108 262" aria-hidden="true">
      <ellipse cx="54" cy="257" rx="62" ry="6" fill="#000" opacity=".25"/>
      <rect x="3" y="2" width="102" height="252" rx="4" fill="url(#cr-cab)" stroke="#9a9688"/>
      <path d="M3 25V6a4 4 0 0 1 4-4h94a4 4 0 0 1 4 4v19z" fill="url(#cr-slate)"/>
      <text class="cr-tx cr-tx-w" x="10" y="17">BANDE ${n}</text>
      <circle class="cr-led cr-led-g on" cx="78" cy="13.5" r="2.5"/>
      <circle class="cr-led cr-led-a" cx="86.5" cy="13.5" r="2.5"/>
      <circle class="cr-led cr-led-r" cx="95" cy="13.5" r="2.5"/>
      <rect x="9" y="31" width="90" height="160" rx="3" fill="url(#cr-glass)"/>
      ${reel(46, 70, n === 1 ? 27 : 20, 'a')}
      ${reel(46, 151, n === 1 ? 18 : 25, 'b')}
      <path d="M${46 + (n === 1 ? 27 : 20)} 72L88 101M88 121L${46 + (n === 1 ? 18 : 25)} 149" stroke="#3d2b20" stroke-width="1.4"/>
      <rect x="83" y="100" width="11" height="22" rx="2" fill="url(#cr-chrome)"/>
      <circle cx="88.5" cy="111" r="2.2" fill="#2a3135"/>
      <path d="M13 35h26L13 118z" fill="#fff" opacity=".07"/>
      <rect x="9" y="31" width="90" height="160" rx="3" fill="none" stroke="#858e93" stroke-width="2.4"/>
      <rect x="14" y="198" width="34" height="34" rx="2" fill="#141a1d"/>
      <rect x="60" y="198" width="34" height="34" rx="2" fill="#141a1d"/>
      <clipPath id="cr-vc${n}a"><rect x="14" y="198" width="34" height="34" rx="2"/></clipPath>
      <clipPath id="cr-vc${n}b"><rect x="60" y="198" width="34" height="34" rx="2"/></clipPath>
      <g clip-path="url(#cr-vc${n}a)"><path class="cr-loop cr-loop-a" d="M22 190v24a9 9 0 0 0 18 0v-24" stroke="#5a3d2c" stroke-width="2.2" fill="none"/></g>
      <g clip-path="url(#cr-vc${n}b)"><path class="cr-loop cr-loop-b" d="M68 190v20a9 9 0 0 0 18 0v-20" stroke="#5a3d2c" stroke-width="2.2" fill="none"/></g>
      <rect x="14" y="236" width="14" height="6" rx="1.5" fill="#f2efe6" stroke="#8b877a" stroke-width=".7"/>
      <rect x="32" y="236" width="14" height="6" rx="1.5" fill="#f2efe6" stroke="#8b877a" stroke-width=".7"/>
      <rect x="50" y="236" width="14" height="6" rx="1.5" fill="#9fe0a8" stroke="#6b8f6f" stroke-width=".7"/>
      <rect x="3" y="246" width="102" height="8" fill="#2b3034"/>
    </svg>
  </div>`;
}

function cpu() {
  let lamps = '';
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 13; c++) {
      lamps += `<circle class="cr-lamp" cx="${20 + c * 11.1}" cy="${40 + r * 11}" r="2.7"/>`;
    }
  }
  let switches = '';
  for (let i = 0; i < 13; i++) {
    const up = (i * 7) % 3 !== 0;
    switches += `<rect x="${17.5 + i * 11.1}" y="133" width="5" height="12" rx="1.3" fill="#ece8dc" stroke="#7d796d" stroke-width=".6"/>
      <rect x="${18.5 + i * 11.1}" y="${up ? 133.5 : 139.5}" width="3" height="5" rx=".8" fill="#5a5d60"/>`;
  }
  return `<div class="cr-part cr-cpu" data-part="cpu">
    <svg viewBox="0 0 172 214" aria-hidden="true">
      <ellipse cx="86" cy="209" rx="96" ry="6" fill="#000" opacity=".25"/>
      <rect x="3" y="2" width="166" height="204" rx="4" fill="url(#cr-cab)" stroke="#9a9688"/>
      <path d="M3 22V6a4 4 0 0 1 4-4h158a4 4 0 0 1 4 4v16z" fill="url(#cr-slate)"/>
      <text class="cr-tx cr-tx-w" x="86" y="15.5" text-anchor="middle">UNITÉ CENTRALE</text>
      <rect x="9" y="28" width="154" height="94" rx="3" fill="url(#cr-slate-dark)"/>
      <g class="cr-lamps">${lamps}</g>
      <path d="M13 96.5h146M13 63.5h146" stroke="#ffffff" stroke-opacity=".08"/>
      <rect x="9" y="127" width="154" height="24" rx="2" fill="#d6d2c5" stroke="#aaa598" stroke-width=".7"/>
      ${switches}
      <circle cx="24" cy="168" r="7.5" fill="url(#cr-knob)" stroke="#7c786c" stroke-width=".6"/>
      <path d="M24 168l3.5-5" stroke="#3d3f42" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="46" cy="168" r="7.5" fill="url(#cr-knob)" stroke="#7c786c" stroke-width=".6"/>
      <path d="M46 168l-4.5 3" stroke="#3d3f42" stroke-width="1.4" stroke-linecap="round"/>
      <rect x="64" y="161" width="20" height="13" rx="2" fill="#a8f0b4" stroke="#5f8466" stroke-width=".7"/>
      <rect x="88" y="161" width="20" height="13" rx="2" fill="#f3efe4" stroke="#8b877a" stroke-width=".7"/>
      <text class="cr-tx cr-tx-xs" x="74" y="182" text-anchor="middle">MARCHE</text>
      <text class="cr-tx cr-tx-xs" x="98" y="182" text-anchor="middle">ARRÊT</text>
      <circle cx="144" cy="167" r="10.5" fill="#e8e3d4" stroke="#8b877a" stroke-width=".7"/>
      <circle cx="144" cy="167" r="7.5" fill="url(#cr-red)"/>
      <text class="cr-tx cr-tx-xs" x="144" y="185" text-anchor="middle">URGENCE</text>
      <path d="M14 190h144M14 193.5h144M14 197h144" stroke="#000" stroke-opacity=".14"/>
      <rect x="3" y="198" width="166" height="8" fill="#2b3034"/>
    </svg>
  </div>`;
}

function printer() {
  return `<div class="cr-part cr-printer" data-part="printer">
    <div class="cr-paper" aria-hidden="true"><div class="cr-paper-strip"><div class="cr-paper-lines"><svg class="cr-pencil"><path/></svg></div></div></div>
    <svg viewBox="0 0 224 184" aria-hidden="true">
      <ellipse cx="112" cy="180" rx="122" ry="6" fill="#000" opacity=".25"/>
      <rect x="6" y="56" width="212" height="120" rx="4" fill="url(#cr-cab)" stroke="#9a9688"/>
      <g class="cr-printer-head">
        <path d="M3 66C3 30 16 16 42 16h140c26 0 39 14 39 50z" fill="url(#cr-slate)" stroke="#2c4054"/>
        <path d="M14 46c2-18 12-24 30-24h136c18 0 28 6 30 24" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
        <rect x="22" y="13.5" width="180" height="6" rx="2.5" fill="#12171b"/>
        <rect x="32" y="32" width="160" height="22" rx="3" fill="#1b242b" stroke="#22303a"/>
        <clipPath id="cr-chain-clip"><rect x="34" y="34" width="156" height="18" rx="2"/></clipPath>
        <g clip-path="url(#cr-chain-clip)">
          <rect class="cr-chain" x="28" y="39" width="176" height="8" fill="url(#cr-chain-pat)"/>
          <rect x="34" y="34" width="156" height="18" fill="url(#cr-glass-sheen)"/>
        </g>
      </g>
      <rect x="14" y="70" width="196" height="34" rx="3" fill="url(#cr-slate-dark)"/>
      <text class="cr-tx cr-tx-w" x="22" y="84">IMPRIMANTE</text>
      <text class="cr-tx cr-tx-s" x="22" y="96">600 LIGNES / MINUTE</text>
      ${lens('cr-lens-ready on', 116, 79, 36, 16, 'PRÊT')}
      ${lens('cr-lens-print', 157, 79, 47, 16, 'IMPRESSION')}
      <rect x="28" y="112" width="168" height="50" rx="3" fill="#252c31"/>
      <rect x="40" y="128" width="144" height="34" fill="url(#cr-fanfold)"/>
      <path d="M40 128h144" stroke="#fff" stroke-opacity=".5"/>
      <path d="M31 115h162l-6 12H37z" fill="#fff" opacity=".05"/>
      <rect x="6" y="168" width="212" height="8" fill="#2b3034"/>
    </svg>
  </div>`;
}

function reader() {
  return `<div class="cr-part cr-reader" data-part="reader">
    <svg viewBox="0 0 214 178" aria-hidden="true">
      <ellipse cx="107" cy="174" rx="116" ry="6" fill="#000" opacity=".25"/>
      <rect x="14" y="0" width="92" height="46" rx="3" fill="url(#cr-slate-dark)"/>
      <path d="M18 4h84" stroke="#fff" stroke-opacity=".14"/>
      <path d="M24 9v30M34 9v30M44 9v30M54 9v30M64 9v30M74 9v30M84 9v30M94 9v30" stroke="#000" stroke-opacity=".16"/>
      <rect x="20" y="14" width="80" height="22" rx="1.5" fill="#000" opacity=".18"/>
      <rect x="14" y="2" width="5" height="44" rx="1.5" fill="url(#cr-chrome)"/>
      <rect x="101" y="2" width="5" height="44" rx="1.5" fill="url(#cr-chrome)"/>
      <rect x="4" y="40" width="206" height="130" rx="4" fill="url(#cr-cab)" stroke="#9a9688"/>
      <rect x="122" y="18" width="80" height="28" rx="2" fill="#26323b"/>
      <rect class="cr-stack" x="129" y="44" width="66" height="0" fill="#f0e3c0" stroke="#c9b68a" stroke-width=".6"/>
      <rect x="120" y="36" width="84" height="12" rx="2" fill="url(#cr-slate)"/>
      <text class="cr-tx cr-tx-xs cr-tx-w" x="162" y="44.5" text-anchor="middle">RÉCEPTION</text>
      <rect x="12" y="56" width="190" height="66" rx="3" fill="url(#cr-slate-dark)"/>
      <text class="cr-tx cr-tx-w" x="20" y="69">LECTEUR DE CARTES</text>
      ${lens('cr-lens-ready', 20, 75, 44, 16, 'PRÊT')}
      ${lens('cr-lens-run', 70, 75, 44, 16, 'MARCHE')}
      ${lens('cr-lens-error', 20, 96, 94, 20, 'ERREUR DE', 'SÉQUENCE')}
      <path d="M14 134h186M14 138h186M14 142h186M14 146h186M14 150h186" stroke="#000" stroke-opacity=".12"/>
      <rect x="4" y="162" width="206" height="8" fill="#2b3034"/>
    </svg>
  </div>`;
}

// Devant les cartes : la lèvre de la trémie, qui cache le paquet posé dedans,
// et le gros bouton LECTURE.
function readerFront() {
  return `<div class="cr-part cr-reader-front" data-part="readerFront">
    <svg viewBox="0 0 214 178" aria-hidden="true">
      <path d="M8 27h104v29H8z" fill="url(#cr-cab)"/>
      <rect x="10" y="26" width="100" height="16" rx="2" fill="url(#cr-slate)"/>
      <path d="M12 28h96" stroke="#fff" stroke-opacity=".22"/>
      <text class="cr-tx cr-tx-xs cr-tx-w" x="60" y="36.5" text-anchor="middle">ALIMENTATION</text>
      <path d="M8 56h104" stroke="#9a9688"/>
    </svg>
    <button class="cr-read" type="button" aria-describedby="cr-read-help"><span>Lecture</span></button>
  </div>`;
}

function clock() {
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const big = i % 5 === 0;
    const r1 = big ? 21.5 : 24;
    ticks += `M${(32 + Math.sin(a) * r1).toFixed(2)} ${(32 - Math.cos(a) * r1).toFixed(2)}L${(32 + Math.sin(a) * 25.5).toFixed(2)} ${(32 - Math.cos(a) * 25.5).toFixed(2)}`;
  }
  const nums = Array.from({ length: 12 }, (_, i) => {
    const a = ((i + 1) / 12) * Math.PI * 2;
    return `<text x="${(32 + Math.sin(a) * 17).toFixed(2)}" y="${(32 - Math.cos(a) * 17 + 2.3).toFixed(2)}" text-anchor="middle">${i + 1}</text>`;
  }).join('');
  return `<div class="cr-part cr-clock" data-part="clock">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="33" cy="34" r="30" fill="#000" opacity=".18"/>
      <circle cx="32" cy="32" r="30" fill="#30353a"/>
      <circle cx="32" cy="32" r="27.5" fill="#faf8f1"/>
      <path d="${ticks}" stroke="#2a2d31" stroke-width=".9"/>
      <g class="cr-clock-nums">${nums}</g>
      <path class="cr-hand cr-hand-h" d="M32 35V19" stroke="#1d1f22" stroke-width="3" stroke-linecap="round"/>
      <path class="cr-hand cr-hand-m" d="M32 36V10.5" stroke="#1d1f22" stroke-width="2" stroke-linecap="round"/>
      <g class="cr-hand cr-hand-s"><path d="M32 38V9" stroke="#c8382e" stroke-width=".9"/></g>
      <circle cx="32" cy="32" r="1.8" fill="#c8382e"/>
      <path d="M12 22a22 22 0 0 1 30-14" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35" fill="none"/>
    </svg>
  </div>`;
}

function calendar() {
  const days = [];
  for (let i = 0; i < 4; i++) days.push('');
  for (let d = 1; d <= 31; d++) days.push(d);
  const cells = days
    .map((d, i) => {
      if (!d) return '';
      const x = 9 + (i % 7) * 7.4;
      const y = 51 + Math.floor(i / 7) * 6.6;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle"${i % 7 === 6 ? ' class="sun"' : ''}>${d}</text>`;
    })
    .join('');
  return `<div class="cr-part cr-calendar" data-part="calendar">
    <svg viewBox="0 0 62 84" aria-hidden="true">
      <rect x="3" y="7" width="58" height="76" rx="1.5" fill="#000" opacity=".16"/>
      <rect x="2" y="5" width="58" height="76" rx="1.5" fill="#fbf9f2"/>
      <rect x="2" y="5" width="58" height="22" rx="1.5" fill="#b9332b"/>
      <text class="cr-cal-m" x="31" y="14.5" text-anchor="middle">OCTOBRE</text>
      <text class="cr-cal-y" x="31" y="24.5" text-anchor="middle">1965</text>
      <g class="cr-cal-d">
        ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => `<text x="${9 + i * 7.4}" y="34" text-anchor="middle" class="hd">${d}</text>`).join('')}
        ${cells}
      </g>
      <ellipse cx="31.2" cy="42.6" rx="4.6" ry="3.8" fill="none" stroke="#c8382e" stroke-width=".9" transform="rotate(-8 31 43)"/>
      <circle cx="31" cy="3.5" r="2.2" fill="#6d6a62"/>
    </svg>
  </div>`;
}

function note() {
  return `<div class="cr-part cr-note" data-part="note">
    <div class="cr-note-paper">
      <i class="cr-note-pin" aria-hidden="true"></i>
      <p class="cr-note-head">Exploitation<br>Travail nº 0042</p>
      <span class="cr-stamp" aria-hidden="true">Rejeté</span>
      <p class="cr-note-msg">Votre programme a été rejeté&#8239;: cartes dans le désordre.</p>
      <p class="cr-note-sign">— L’opérateur</p>
    </div>
  </div>`;
}

function sign() {
  return `<div class="cr-part cr-sign" data-part="sign" aria-hidden="true"><span>Défense de fumer</span></div>`;
}

function slip() {
  return `<div class="cr-part cr-slip" data-part="slip" hidden>
    <div class="cr-slip-paper"><i class="cr-note-pin" aria-hidden="true"></i><pre class="cr-slip-text"></pre></div>
  </div>`;
}

export function roomDefs() {
  return `<svg class="cr-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="cr-cab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eeebe2"/>
        <stop offset=".55" stop-color="#dcd8cb"/>
        <stop offset="1" stop-color="#c7c2b3"/>
      </linearGradient>
      <linearGradient id="cr-slate" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5f7a94"/>
        <stop offset="1" stop-color="#405a73"/>
      </linearGradient>
      <linearGradient id="cr-slate-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a4f63"/>
        <stop offset="1" stop-color="#2a3a4b"/>
      </linearGradient>
      <linearGradient id="cr-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#27323a"/>
        <stop offset="1" stop-color="#12181c"/>
      </linearGradient>
      <linearGradient id="cr-glass-sheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
        <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="cr-chrome" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8f989d"/>
        <stop offset=".45" stop-color="#eef1f2"/>
        <stop offset="1" stop-color="#9aa3a8"/>
      </linearGradient>
      <radialGradient id="cr-knob" cx=".4" cy=".35" r=".7">
        <stop offset="0" stop-color="#fbfaf6"/>
        <stop offset="1" stop-color="#a9a496"/>
      </radialGradient>
      <radialGradient id="cr-red" cx=".4" cy=".35" r=".7">
        <stop offset="0" stop-color="#ff7a6a"/>
        <stop offset="1" stop-color="#a8261c"/>
      </radialGradient>
      <filter id="cr-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>
      <pattern id="cr-chain-pat" width="6" height="8" patternUnits="userSpaceOnUse">
        <rect width="6" height="8" fill="#2c3943"/>
        <rect x="1" y="1" width="3.4" height="6" rx=".8" fill="#9fb0bb"/>
      </pattern>
      <pattern id="cr-fanfold" width="144" height="6" patternUnits="userSpaceOnUse">
        <rect width="144" height="6" fill="#f4f6ef"/>
        <rect y="3" width="144" height="3" fill="#d3e7cf"/>
        <path d="M0 5.6h144" stroke="#9aa59a" stroke-width=".5"/>
      </pattern>
    </defs>
  </svg>`;
}

export function roomMarkup() {
  return `
    <div class="cr-wall" aria-hidden="true"><i class="cr-light"></i><i class="cr-light cr-light-2"></i><i class="cr-wainscot"></i></div>
    <div class="cr-floor" aria-hidden="true"><i class="cr-tiles"></i><i class="cr-floor-shade"></i></div>
    ${sign()}
    ${clock()}
    ${calendar()}
    ${note()}
    ${slip()}
    ${tape(1)}
    ${tape(2)}
    ${cpu()}
    ${printer()}
    ${reader()}
    <div class="cr-desk" aria-hidden="true"><i class="cr-desk-top"></i><i class="cr-pen"></i></div>
    <div class="cr-tray">
      <div class="cr-tray-well">
        <span class="cr-tray-ghost" aria-hidden="true"></span>
        <span class="cr-tray-stencil" aria-hidden="true">Posez le paquet ici</span>
      </div>
      <div class="cr-tray-plate" aria-hidden="true">Bac de lecture <b class="cr-count">0/8</b></div>
    </div>`;
}

export { readerFront };
