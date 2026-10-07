// Visuels originaux du téléphone de 2007, tout en SVG : icônes brillantes,
// emblème de démarrage, fond d'écran « gouttes de rosée ». Aucun logo, aucune
// icône ni fond d'écran d'origine : des recréations dans l'esprit.

let seq = 0;

const stops = (list) =>
  list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');

export const lg = (id, list, [x1, y1, x2, y2] = [0, 0, 0, 1]) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;

export const rg = (id, list, { cx = 0.5, cy = 0.5, r = 0.5, fx = cx, fy = cy } = {}) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${stops(list)}</radialGradient>`;

// Identifiants uniques : une même icône peut apparaître deux fois (reflet du dock).
export function ids(name = 'x') {
  const prefix = `ph${name}${(seq += 1)}`;
  return (key) => `${prefix}-${key}`;
}

// Générateur pseudo-aléatoire déterministe : le décor est le même à chaque partie.
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;

// ——— Glyphes partagés ———

// Combiné téléphonique, dessiné droit puis incliné à 45°
const HANDSET =
  'M22 9.5C28 9.5 33 9.5 36 10.5S39.5 15 38.5 18 35 21 32 21 25.5 22.5 25.2 26V31c.3 3.5 2.8 5 6.8 5s5.5.5 6.5 3 .5 6.5-2.5 7.5-8 1-14 1S13.5 42 13.5 28.5 16 9.5 22 9.5z';

export const handset = (fill = '#fff') => `<path d="${HANDSET}" fill="${fill}" transform="rotate(-45 28.5 28.5)"/>`;

const BUBBLE =
  'M28.5 12C17.7 12 9.5 18.6 9.5 26.7c0 4.8 2.9 9 7.4 11.6-.5 2.6-1.9 5-4.1 6.7 4 0 7.6-1.6 10.1-4 1.8.4 3.7.6 5.6.6 10.8 0 19-6.6 19-14.9S39.3 12 28.5 12z';

function gear(cx, cy, teeth, outer, inner, hole) {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const w = step * 0.22;
    pts.push([a - step / 2 + w, inner], [a - w * 1.1, outer], [a + w * 1.1, outer], [a + step / 2 - w, inner]);
  }
  const d = pts
    .map(([a, r], i) => `${i ? 'L' : 'M'}${r1(cx + Math.cos(a) * r)} ${r1(cy + Math.sin(a) * r)}`)
    .join('');
  return `${d}Z M${cx + hole} ${cy}a${hole} ${hole} 0 1 0 ${-hole * 2} 0a${hole} ${hole} 0 1 0 ${hole * 2} 0z`;
}

function clockHands(h, m, cx, cy, r, { hour = '#1d1d1f', minute = '#1d1d1f', second = '#f0821e', sec = 9 } = {}) {
  const ha = ((h % 12) + m / 60) * 30;
  const ma = m * 6;
  const sa = sec * 6;
  return `<g stroke-linecap="round">
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${r1(cy - r * 0.52)}" stroke="${hour}" stroke-width="${r1(r * 0.13)}" transform="rotate(${ha} ${cx} ${cy})"/>
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${r1(cy - r * 0.78)}" stroke="${minute}" stroke-width="${r1(r * 0.09)}" transform="rotate(${ma} ${cx} ${cy})"/>
    <line x1="${cx}" y1="${r1(cy + r * 0.18)}" x2="${cx}" y2="${r1(cy - r * 0.84)}" stroke="${second}" stroke-width="${r1(r * 0.04)}" transform="rotate(${sa} ${cx} ${cy})"/>
  </g>
  <circle cx="${cx}" cy="${cy}" r="${r1(r * 0.07)}" fill="${second}"/>`;
}

export function clockFace(h, m, { size = 64, night = false, sec = 9 } = {}) {
  const c = size / 2;
  const r = c - 2;
  const id = ids('clk');
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const long = i % 3 === 0;
    const r0 = r * (long ? 0.78 : 0.84);
    return `<line x1="${r1(c + Math.sin(a) * r0)}" y1="${r1(c - Math.cos(a) * r0)}" x2="${r1(c + Math.sin(a) * r * 0.92)}" y2="${r1(c - Math.cos(a) * r * 0.92)}" stroke-width="${long ? 1.6 : 0.9}"/>`;
  }).join('');
  const ink = night ? '#f4f4f4' : '#1d1d1f';
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">
    <defs>${night ? rg(id('f'), [[0, '#3a3c42'], [1, '#0d0e10']], { cy: 0.3, r: 0.75 }) : rg(id('f'), [[0, '#ffffff'], [0.7, '#f1f1f1'], [1, '#d5d5d8']], { cy: 0.3, r: 0.75 })}</defs>
    <circle cx="${c}" cy="${c}" r="${r + 1.5}" fill="${night ? '#5b5e66' : '#9a9da3'}"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="url(#${id('f')})"/>
    <g stroke="${ink}" stroke-linecap="round">${ticks}</g>
    ${clockHands(h, m, c, c, r, { hour: ink, minute: ink, sec })}
  </svg>`;
}

// ——— Icônes des applications (57 × 57) ———

const icon = (draw) => () => {
  const id = ids('i');
  const { defs = '', body } = draw(id);
  return `<svg viewBox="0 0 57 57" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;
};

const bg = (id, list) => ({ def: lg(id('bg'), list), rect: `<rect width="57" height="57" fill="url(#${id('bg')})"/>` });

export const ICONS = {
  messages: icon((id) => {
    const b = bg(id, [[0, '#b8f58c'], [0.5, '#52c439'], [1, '#27921a']]);
    return {
      defs: b.def + lg(id('b'), [[0, '#ffffff'], [1, '#e3f4da']]),
      body: `${b.rect}<path d="${BUBBLE}" transform="translate(0 1.4)" fill="#0b4d05" opacity=".35"/>
        <path d="${BUBBLE}" fill="url(#${id('b')})"/>`,
    };
  }),

  calendar: icon((id) => {
    const b = bg(id, [[0, '#ffffff'], [1, '#dcdcdf']]);
    return {
      defs: b.def + lg(id('h'), [[0, '#ff7b6b'], [1, '#c81e17']]),
      body: `${b.rect}<rect width="57" height="17" fill="url(#${id('h')})"/>
        <rect y="17" width="57" height="1.2" fill="#000" opacity=".28"/>
        <text x="28.5" y="12.4" text-anchor="middle" font-size="9.5" font-weight="700" fill="#fff">mardi</text>
        <text x="28.5" y="49" text-anchor="middle" font-size="31" font-weight="700" fill="#1d1d1f" letter-spacing="-1">9</text>`,
    };
  }),

  photos: icon((id) => ({
    defs:
      lg(id('s'), [[0, '#3f8ff0'], [0.7, '#a9d6ff'], [1, '#f2ead2']]) +
      lg(id('h'), [[0, '#6fc04d'], [1, '#2f7d26']]) +
      lg(id('r'), [[0, '#8d9096'], [1, '#45484d']]) +
      rg(id('g'), [[0, '#fffbe0'], [0.35, '#fff2a8', 0.9], [1, '#fff2a8', 0]]),
    body: `<rect width="57" height="57" fill="url(#${id('s')})"/>
      <circle cx="41" cy="15" r="13" fill="url(#${id('g')})"/>
      <circle cx="41" cy="15" r="5.2" fill="#fffbe6"/>
      <path d="M0 33 Q10 27 20 31 T40 29 T57 32 V57 H0Z" fill="#7aa37f"/>
      <path d="M0 37 Q14 31 28 36 T57 35 V57 H0Z" fill="url(#${id('h')})"/>
      <path d="M26.5 35.5 L29.5 35.5 L46 57 L6 57Z" fill="url(#${id('r')})"/>
      <path d="M27.9 37 L28.3 37 L28.9 41 L27.5 41Z M27.2 44 L29.2 44 L30.2 50 L26.4 50Z" fill="#fff" opacity=".85"/>
      <rect x="33" y="30" width="7" height="4.5" rx=".6" fill="#13774a" stroke="#fff" stroke-width=".7"/>
      <path d="M35 34.5v2.6M38 34.5v2.6" stroke="#5c5f63" stroke-width=".7"/>`,
  })),

  camera: icon((id) => {
    const b = bg(id, [[0, '#9a9fa6'], [0.5, '#5d6168'], [1, '#2a2c30']]);
    return {
      defs:
        b.def +
        lg(id('ring'), [[0, '#ffffff'], [0.5, '#b5bac1'], [1, '#6c727a']]) +
        rg(id('glass'), [[0, '#47609e'], [0.55, '#151c33'], [1, '#05070c']], { cx: 0.45, cy: 0.4, r: 0.6 }),
      body: `${b.rect}
        <path d="M0 9h57M0 13h57M0 44h57M0 48h57" stroke="#fff" stroke-opacity=".06"/>
        <circle cx="28.5" cy="29.5" r="19.5" fill="#1a1b1e" opacity=".55"/>
        <circle cx="28.5" cy="28.5" r="19" fill="url(#${id('ring')})"/>
        <circle cx="28.5" cy="28.5" r="15" fill="#111216"/>
        <circle cx="28.5" cy="28.5" r="12" fill="url(#${id('glass')})"/>
        <path d="M19.5 26a9.5 9.5 0 0 1 9-8" stroke="#8fb0ff" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".75"/>
        <circle cx="33.5" cy="33" r="3.4" fill="#6d5bd0" opacity=".35"/>
        <circle cx="23.5" cy="23" r="2.4" fill="#fff" opacity=".85"/>`,
    };
  }),

  videos: icon((id) => {
    const b = bg(id, [[0, '#9a77f0'], [0.55, '#5a33c4'], [1, '#2e1585']]);
    return {
      defs: b.def + lg(id('k'), [[0, '#3a3a40'], [1, '#141418']]),
      body: `${b.rect}
        <rect x="10" y="22" width="37" height="24" rx="2.5" fill="url(#${id('k')})"/>
        <g transform="rotate(-14 10 21)">
          <rect x="10" y="13.5" width="37" height="7.5" rx="1.5" fill="#f4f4f6"/>
          <path d="M15 13.5h5l-4 7.5h-5zM25 13.5h5l-4 7.5h-5zM35 13.5h5l-4 7.5h-5z" fill="#1d1d22"/>
        </g>
        <rect x="10" y="22" width="37" height="5" fill="#f4f4f6"/>
        <path d="M15 22h5l-3 5h-5zM25 22h5l-3 5h-5zM35 22h5l-3 5h-5z" fill="#1d1d22"/>
        <path d="M24.5 31v10.5l9-5.25z" fill="#fff"/>`,
    };
  }),

  stocks: icon((id) => {
    const b = bg(id, [[0, '#2d333c'], [1, '#08090b']]);
    return {
      defs: b.def + lg(id('a'), [[0, '#5dff86', 0.45], [1, '#5dff86', 0]]),
      body: `${b.rect}
        <path d="M6 17h45M6 28h45M6 39h45" stroke="#fff" stroke-opacity=".12"/>
        <path d="M6 44 L14 39 L20 41 L27 31 L33 34 L40 22 L49 15 V49 H6Z" fill="url(#${id('a')})"/>
        <path d="M6 44 L14 39 L20 41 L27 31 L33 34 L40 22 L49 15" fill="none" stroke="#5dff86" stroke-width="5" stroke-opacity=".18" stroke-linejoin="round"/>
        <path d="M6 44 L14 39 L20 41 L27 31 L33 34 L40 22 L49 15" fill="none" stroke="#7dffa0" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="49" cy="15" r="2.6" fill="#fff"/>`,
    };
  }),

  maps: icon((id) => {
    const b = bg(id, [[0, '#f7f2e4'], [1, '#e6dcc2']]);
    return {
      defs: b.def + lg(id('p'), [[0, '#ff6f61'], [1, '#c4160d']]),
      body: `${b.rect}
        <path d="M0 0h22q-4 10 4 16t-6 15H0z" fill="#bfe0a2"/>
        <path d="M57 38q-14-2-20 6t-6 13h26z" fill="#a8d4f5"/>
        <path d="M-2 40 L60 18" stroke="#e8b64a" stroke-width="6"/>
        <path d="M-2 40 L60 18" stroke="#fff6cf" stroke-width="3.6"/>
        <path d="M18 -2 Q26 30 14 60" stroke="#d9cfb6" stroke-width="5" fill="none"/>
        <path d="M18 -2 Q26 30 14 60" stroke="#fff" stroke-width="3" fill="none"/>
        <ellipse cx="35" cy="40" rx="5" ry="1.8" fill="#000" opacity=".25"/>
        <path d="M35 39.5 C35 39.5 25.5 28 25.5 21.5 a9.5 9.5 0 0 1 19 0 C44.5 28 35 39.5 35 39.5z" fill="url(#${id('p')})"/>
        <circle cx="35" cy="21.5" r="3.6" fill="#fff"/>`,
    };
  }),

  weather: icon((id) => {
    const b = bg(id, [[0, '#2b86f2'], [1, '#8fd0ff']]);
    const rays = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return `<line x1="${r1(21 + Math.cos(a) * 12.5)}" y1="${r1(21 + Math.sin(a) * 12.5)}" x2="${r1(21 + Math.cos(a) * 16.5)}" y2="${r1(21 + Math.sin(a) * 16.5)}"/>`;
    }).join('');
    return {
      defs: b.def + rg(id('s'), [[0, '#fff9c4'], [0.6, '#ffd84a'], [1, '#ffb21e']]) + lg(id('c'), [[0, '#ffffff'], [1, '#d5e3f3']]),
      body: `${b.rect}
        <g stroke="#ffe066" stroke-width="2.4" stroke-linecap="round">${rays}</g>
        <circle cx="21" cy="21" r="9.5" fill="url(#${id('s')})"/>
        <path d="M19 46h24a8 8 0 0 0 .6-16 10.5 10.5 0 0 0-20-1.5A8.8 8.8 0 0 0 19 46z" fill="#0d4f9e" opacity=".25" transform="translate(0 1.5)"/>
        <path d="M19 46h24a8 8 0 0 0 .6-16 10.5 10.5 0 0 0-20-1.5A8.8 8.8 0 0 0 19 46z" fill="url(#${id('c')})"/>`,
    };
  }),

  clock: icon((id) => {
    const b = bg(id, [[0, '#4a4d54'], [1, '#0e0f11']]);
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      const long = i % 3 === 0;
      return `<line x1="${r1(28.5 + Math.sin(a) * (long ? 15.5 : 17))}" y1="${r1(28.5 - Math.cos(a) * (long ? 15.5 : 17))}" x2="${r1(28.5 + Math.sin(a) * 19)}" y2="${r1(28.5 - Math.cos(a) * 19)}" stroke-width="${long ? 1.8 : 1}"/>`;
    }).join('');
    return {
      defs: b.def + rg(id('f'), [[0, '#ffffff'], [0.75, '#f0f0f0'], [1, '#cfcfd3']], { cy: 0.3, r: 0.75 }),
      body: `${b.rect}
        <circle cx="28.5" cy="29.5" r="22" fill="#000" opacity=".45"/>
        <circle cx="28.5" cy="28.5" r="22" fill="#a7aab0"/>
        <circle cx="28.5" cy="28.5" r="21" fill="url(#${id('f')})"/>
        <g stroke="#1d1d1f" stroke-linecap="round">${ticks}</g>
        ${clockHands(9, 42, 28.5, 28.5, 21)}`,
    };
  }),

  calc: icon((id) => {
    const b = bg(id, [[0, '#7a7e86'], [1, '#26282c']]);
    const key = (x, y, fill, sign) =>
      `<rect x="${x}" y="${y + 1}" width="19" height="19" rx="4.5" fill="#000" opacity=".35"/>
       <rect x="${x}" y="${y}" width="19" height="19" rx="4.5" fill="url(#${id(fill)})"/>
       <text x="${x + 9.5}" y="${y + 14.6}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">${sign}</text>`;
    return {
      defs: b.def + lg(id('o'), [[0, '#ffc266'], [1, '#ee7400']]) + lg(id('g'), [[0, '#b7bcc3'], [1, '#62676e']]),
      body: `${b.rect}${key(8, 8, 'g', '−')}${key(30, 8, 'g', '×')}${key(8, 30, 'o', '+')}${key(30, 30, 'o', '=')}`,
    };
  }),

  notes: icon((id) => {
    const b = bg(id, [[0, '#fff3a6'], [1, '#f2cf43']]);
    return {
      defs: b.def + lg(id('l'), [[0, '#b07a42'], [1, '#6b4220']]),
      body: `${b.rect}
        <g stroke="#c6a032" stroke-opacity=".7" stroke-width=".9"><path d="M0 24.5h57M0 31.5h57M0 38.5h57M0 45.5h57M0 52.5h57"/></g>
        <path d="M11.5 14v43" stroke="#e0705f" stroke-opacity=".7" stroke-width="1"/>
        <path d="M15 22c3-2 5 1 8-1s5 1 8-.5 4 .5 6 0M15 29c4-1.5 7 1 10-.5s5 1 8 0" fill="none" stroke="#3b3b3b" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>
        <rect width="57" height="13" fill="url(#${id('l')})"/>
        <path d="M2 10.5h53" stroke="#efc994" stroke-width=".9" stroke-dasharray="2.2 1.6"/>
        <rect y="13" width="57" height="1.2" fill="#000" opacity=".3"/>`,
    };
  }),

  settings: icon((id) => {
    const b = bg(id, [[0, '#dadde2'], [1, '#7b818a']]);
    return {
      defs: b.def + lg(id('g'), [[0, '#ffffff'], [0.5, '#c4c9d0'], [1, '#7c838c']]) + lg(id('h'), [[0, '#5d636b'], [1, '#aeb3ba']]),
      body: `${b.rect}
        <path d="${gear(28.5, 29.5, 10, 21, 16, 7)}" fill="#000" opacity=".3" fill-rule="evenodd"/>
        <path d="${gear(28.5, 28.5, 10, 21, 16, 7)}" fill="url(#${id('g')})" stroke="#5b6168" stroke-width=".6" fill-rule="evenodd"/>
        <circle cx="28.5" cy="28.5" r="11" fill="none" stroke="#8a9098" stroke-width="1.2"/>
        <circle cx="28.5" cy="28.5" r="7" fill="url(#${id('h')})"/>`,
    };
  }),

  contacts: icon((id) => {
    const b = bg(id, [[0, '#f6ecd8'], [1, '#d2b88a']]);
    return {
      defs: b.def + lg(id('p'), [[0, '#9a8763'], [1, '#6a5838']]),
      body: `${b.rect}
        <rect x="48" y="6" width="9" height="10" fill="#e2574c"/>
        <rect x="48" y="17" width="9" height="10" fill="#f2c03b"/>
        <rect x="48" y="28" width="9" height="10" fill="#57b85a"/>
        <rect x="48" y="39" width="9" height="10" fill="#4a8fd9"/>
        <rect x="46.5" y="0" width="1.5" height="57" fill="#000" opacity=".15"/>
        <circle cx="25" cy="21" r="8" fill="url(#${id('p')})"/>
        <path d="M10 46c0-9 6.5-14 15-14s15 5 15 14z" fill="url(#${id('p')})"/>`,
    };
  }),

  store: icon((id) => {
    const b = bg(id, [[0, '#cf84ff'], [0.55, '#8b45ea'], [1, '#4c22c4']]);
    return {
      defs: b.def + lg(id('w'), [[0, '#ffffff'], [1, '#e7defc']]),
      body: `${b.rect}
        <path d="M21 20v-3.5a7.5 7.5 0 0 1 15 0V20" fill="none" stroke="#fff" stroke-width="2.4"/>
        <path d="M13 20h31l-2.6 25.5a3 3 0 0 1-3 2.5H18.6a3 3 0 0 1-3-2.5z" fill="url(#${id('w')})"/>
        <path d="M32.5 26.5v12.6a3.6 3.6 0 1 1-2-3.2V28.6l-6.5 1.6v10.4a3.6 3.6 0 1 1-2-3.2V28.4z" fill="#7a3bdd"/>`,
    };
  }),

  apps: icon((id) => {
    const b = bg(id, [[0, '#62dcf6'], [1, '#0a6fbd']]);
    const tile = (x, y, c, glyph) =>
      `<rect x="${x}" y="${y + 1}" width="17" height="17" rx="4.5" fill="#032b55" opacity=".35"/>
       <rect x="${x}" y="${y}" width="17" height="17" rx="4.5" fill="#fff"/>
       <g transform="translate(${x} ${y})" fill="${c}" stroke="${c}">${glyph}</g>`;
    return {
      defs: b.def,
      body: `${b.rect}
        ${tile(10, 10, '#ff5b4f', '<circle cx="8.5" cy="8.5" r="4.5" stroke="none"/>')}
        ${tile(30, 10, '#2bb24c', '<path d="M3.8 12.8 8.5 4 13.2 12.8z" stroke="none"/>')}
        ${tile(10, 30, '#ffb300', '<rect x="4.3" y="4.3" width="8.4" height="8.4" rx="1.2" stroke="none"/>')}
        ${tile(30, 30, '#1c7ce0', '<path d="M8.5 4v9M4 8.5h9" stroke-width="2.6" stroke-linecap="round" fill="none"/>')}`,
    };
  }),

  games: icon((id) => {
    const b = bg(id, [[0, '#45c47a'], [1, '#0f5f31']]);
    const pip = (x, y) => `<circle cx="${x}" cy="${y}" r="1.9"/>`;
    const die = (pips) => `<rect x="-10" y="-10" width="20" height="20" rx="4.5" fill="url(#${id('d')})"/><g fill="#1d1d1f">${pips}</g>`;
    return {
      defs: b.def + lg(id('d'), [[0, '#ffffff'], [1, '#d9dce1']]),
      body: `${b.rect}
        <path d="M0 0h57v57H0z" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="5" stroke-dasharray="1 3"/>
        <g transform="translate(21 25) rotate(-14)"><rect x="-10" y="-9" width="20" height="20" rx="4.5" fill="#000" opacity=".3"/>${die(pip(-5, -5) + pip(0, 0) + pip(5, 5))}</g>
        <g transform="translate(36 35) rotate(16)"><rect x="-10" y="-9" width="20" height="20" rx="4.5" fill="#000" opacity=".3"/>${die(pip(-5, -5) + pip(5, -5) + pip(-5, 5) + pip(5, 5))}</g>`,
    };
  }),

  phone: icon((id) => {
    const b = bg(id, [[0, '#9bf27a'], [0.5, '#3fb22d'], [1, '#1f8a17']]);
    return {
      defs: b.def + lg(id('h'), [[0, '#ffffff'], [1, '#e2f3dc']]),
      body: `${b.rect}<g transform="translate(0 1.4)" opacity=".35">${handset('#0c5207')}</g>${handset(`url(#${id('h')})`)}`,
    };
  }),

  mail: icon((id) => {
    const b = bg(id, [[0, '#7cc6ff'], [1, '#1765d8']]);
    return {
      defs: b.def + lg(id('e'), [[0, '#ffffff'], [1, '#dde5ee']]),
      body: `${b.rect}
        <rect x="8.5" y="17.5" width="40" height="26" rx="2.5" fill="#0b3f86" opacity=".3"/>
        <rect x="8.5" y="16" width="40" height="26" rx="2.5" fill="url(#${id('e')})"/>
        <path d="M9.5 41 L24 28.5 M47.5 41 L33 28.5" stroke="#aeb9c6" stroke-width="1.2"/>
        <path d="M9.3 17.2 L28.5 32 L47.7 17.2" fill="none" stroke="#8d9aab" stroke-width="1.4" stroke-linejoin="round"/>`,
    };
  }),

  browser: icon((id) => {
    const b = bg(id, [[0, '#f2f7fd'], [1, '#a9c7ea']]);
    return {
      defs:
        b.def +
        rg(id('g'), [[0, '#9ad9ff'], [0.6, '#2c86e0'], [1, '#0f4fa8']], { cx: 0.38, cy: 0.32, r: 0.75 }) +
        lg(id('l'), [[0, '#8ee07a'], [1, '#3d9a3c']]),
      body: `${b.rect}
        <circle cx="28.5" cy="30" r="20" fill="#0a2f66" opacity=".3"/>
        <circle cx="28.5" cy="28.5" r="20" fill="url(#${id('g')})"/>
        <path d="M14 20c4-3 8-2 10 1s-1 6 2 8 3 7-1 9-7-2-8-6-6-6-3-12zM33 13c4 0 9 3 10 7s-3 3-5 2-6-1-6-4 0-5 1-5zM37 32c3-1 6 0 7 3s-2 8-5 9-4-3-4-6 0-5 2-6z" fill="url(#${id('l')})"/>
        <g fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".9">
          <ellipse cx="28.5" cy="28.5" rx="9" ry="20"/><path d="M8.5 28.5h40M11 19h35M11 38h35M28.5 8.5v40"/>
        </g>
        <circle cx="28.5" cy="28.5" r="20" fill="none" stroke="#0b3c80" stroke-opacity=".5"/>`,
    };
  }),

  music: icon((id) => {
    const b = bg(id, [[0, '#ff8cc0'], [0.55, '#f0357f'], [1, '#bd0f55']]);
    const note = 'M39 11v24.5a6 6 0 1 1-3-5.2V18.6l-14 3.4v17.5a6 6 0 1 1-3-5.2V15.8z';
    return {
      defs: b.def + lg(id('n'), [[0, '#ffffff'], [1, '#ffe0ee']]),
      body: `${b.rect}<path d="${note}" fill="#6e0630" opacity=".35" transform="translate(0 1.4)"/><path d="${note}" fill="url(#${id('n')})"/>`,
    };
  }),
};

// ——— Petits glyphes d'interface ———

export const GLYPHS = {
  lock: '<svg viewBox="0 0 10 13" aria-hidden="true"><path d="M2.4 5.6V4a2.6 2.6 0 0 1 5.2 0v1.6" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x=".5" y="5.4" width="9" height="7.1" rx="1.3" fill="currentColor"/></svg>',
  plane:
    '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M15 6c0-.6-.6-1-1.2-1H10L6.6.4H5.2L7 5H3.6L2.4 3.4H1.3L2 6l-.7 2.6h1.1L3.6 7H7l-1.8 4.6h1.4L10 7h3.8c.6 0 1.2-.4 1.2-1z" fill="currentColor"/></svg>',
  arrow:
    '<svg viewBox="0 0 34 24" aria-hidden="true"><path fill="currentColor" d="M3 9.2h15.5V3.6c0-1.1 1.3-1.6 2.1-.9l10.6 8.4c.6.5.6 1.4 0 1.9L20.6 21.4c-.8.7-2.1.2-2.1-.9v-5.7H3c-.8 0-1.5-.7-1.5-1.5v-2.6c0-.8.7-1.5 1.5-1.5z"/></svg>',
  chevron: '<svg viewBox="0 0 8 13" aria-hidden="true"><path d="M1.5 1.5 6.5 6.5 1.5 11.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  call: `<svg viewBox="0 0 57 57" aria-hidden="true">${handset('currentColor')}</svg>`,
  hangup: `<svg viewBox="0 0 57 57" aria-hidden="true"><g transform="rotate(135 28.5 28.5)">${handset('currentColor')}</g></svg>`,
  backspace:
    '<svg viewBox="0 0 34 24" aria-hidden="true"><path d="M11 2h18.5A3.5 3.5 0 0 1 33 5.5v13a3.5 3.5 0 0 1-3.5 3.5H11L1.5 12z" fill="currentColor"/><path d="M15.5 7.5l9 9m0-9l-9 9" stroke="#2a2d33" stroke-width="2.4" stroke-linecap="round"/></svg>',
  zoomIn:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 15l6 6M7 10h6M10 7v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  zoomOut:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 15l6 6M7 10h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  mute:
    '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="12" y="4" width="8" height="15" rx="4" fill="currentColor"/><path d="M8 15a8 8 0 0 0 16 0M16 23v5M11 28h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 5l20 22" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  keypad:
    '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><circle cx="8" cy="6" r="2.6"/><circle cx="16" cy="6" r="2.6"/><circle cx="24" cy="6" r="2.6"/><circle cx="8" cy="13" r="2.6"/><circle cx="16" cy="13" r="2.6"/><circle cx="24" cy="13" r="2.6"/><circle cx="8" cy="20" r="2.6"/><circle cx="16" cy="20" r="2.6"/><circle cx="24" cy="20" r="2.6"/><circle cx="16" cy="27" r="2.6"/></svg>',
  speaker:
    '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 12h5l7-6v20l-7-6H4z" fill="currentColor"/><path d="M20 11a6 6 0 0 1 0 10M23.5 7.5a11 11 0 0 1 0 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  add: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 6v20M6 16h20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  hold: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><rect x="8" y="6" width="5.5" height="20" rx="1.5"/><rect x="18.5" y="6" width="5.5" height="20" rx="1.5"/></svg>',
  person:
    '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><circle cx="16" cy="11" r="6"/><path d="M5 28c0-7 5-11 11-11s11 4 11 11z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="6" y="4.5" width="4.5" height="15" rx="1"/><rect x="13.5" y="4.5" width="4.5" height="15" rx="1"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="4" y="5" width="2.6" height="14" rx="1"/><path d="M20 5v14l-6.5-7zM13.5 5v14L7 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="17.4" y="5" width="2.6" height="14" rx="1"/><path d="M4 5v14l6.5-7zM10.5 5v14l6.5-7z"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  forward: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pages:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7" width="12" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 4h11a1.5 1.5 0 0 1 1.5 1.5V17" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5c3-1.5 6-1.5 9 0 3-1.5 6-1.5 9 0v14c-3-1.5-6-1.5-9 0-3-1.5-6-1.5-9 0z M12 5v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};

// ——— Emblème de démarrage : une goutte lumineuse ———

export function emblem() {
  const id = ids('em');
  return `<svg viewBox="0 0 64 84" aria-hidden="true">
    <defs>
      ${lg(id('b'), [[0, '#ffffff'], [0.55, '#e6ecf5'], [1, '#9fb0c8']])}
      ${rg(id('h'), [[0, '#ffffff', 0.95], [1, '#ffffff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })}
      ${lg(id('r'), [[0, '#ffffff', 0], [1, '#ffffff', 0.55]])}
    </defs>
    <path d="M32 3C32 3 7 35 7 54a25 25 0 0 0 50 0C57 35 32 3 32 3z" fill="url(#${id('b')})"/>
    <path d="M14 56a18 18 0 0 0 18 18" fill="none" stroke="url(#${id('r')})" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
    <ellipse cx="22" cy="50" rx="5" ry="9" transform="rotate(18 22 50)" fill="url(#${id('h')})"/>
  </svg>`;
}

// ——— Fond d'écran : gouttes de rosée sur un verre teinté ———

export function wallpaper() {
  const id = ids('wp');
  const rnd = seeded(907);
  const drops = [];
  for (let tries = 0; drops.length < 58 && tries < 4000; tries++) {
    const big = drops.length < 9;
    const r = big ? 11 + rnd() * 11 : 1.6 + rnd() ** 2.4 * 10;
    const x = -10 + rnd() * 340;
    const y = 24 + rnd() * 450;
    if (drops.some((d) => Math.hypot(d.x - x, d.y - y) < d.r + r + 3)) continue;
    drops.push({ x, y, r, sx: 0.88 + rnd() * 0.24, rot: Math.round(rnd() * 360) });
  }
  const bokeh = Array.from({ length: 9 }, () => ({
    x: rnd() * 320,
    y: rnd() * 480,
    r: 24 + rnd() * 60,
    o: 0.05 + rnd() * 0.1,
  }));
  const drop = ({ x, y, r, sx, rot }) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${r1(sx)} 1) rotate(${-rot})">
      <ellipse cx="${r1(r * 0.14)}" cy="${r1(r * 0.34)}" rx="${r1(r * 1.08)}" ry="${r1(r * 1.02)}" fill="url(#${id('sh')})"/>
      <circle r="${r1(r)}" fill="url(#${id('d')})"/>
      <circle r="${r1(r)}" fill="url(#${id('c')})"/>
      <circle r="${r1(r - 0.3)}" fill="none" stroke="#e8fffb" stroke-opacity=".22" stroke-width=".6"/>
      <ellipse cx="${r1(-r * 0.36)}" cy="${r1(-r * 0.42)}" rx="${r1(r * 0.3)}" ry="${r1(r * 0.17)}" transform="rotate(-38 ${r1(-r * 0.36)} ${r1(-r * 0.42)})" fill="#fff" opacity=".9"/>
      ${r > 6 ? `<circle cx="${r1(r * 0.42)}" cy="${r1(-r * 0.5)}" r="${r1(r * 0.07)}" fill="#fff" opacity=".7"/>` : ''}
    </g>`;
  return `<svg class="ph-wall-svg" viewBox="0 0 320 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      ${lg(id('bg'), [[0, '#0d4f5c'], [0.45, '#1b8077'], [0.75, '#156270'], [1, '#081f33']], [0, 0, 0.35, 1])}
      ${rg(id('glow'), [[0, '#9df5dd', 0.55], [1, '#9df5dd', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })}
      ${rg(id('bk'), [[0, '#d9fff6', 0.9], [0.7, '#d9fff6', 0.35], [1, '#d9fff6', 0]])}
      ${rg(id('sh'), [[0, '#021a1f', 0.55], [0.75, '#021a1f', 0.28], [1, '#021a1f', 0]])}
      ${rg(id('d'), [[0, '#c9fff4', 0.62], [0.42, '#5fc7b6', 0.32], [0.82, '#0d4b52', 0.32], [1, '#032a33', 0.7]], { cx: 0.5, cy: 0.7, r: 0.62, fy: 0.85 })}
      ${rg(id('c'), [[0, '#ffffff', 0], [0.78, '#ffffff', 0], [0.92, '#e9fffb', 0.35], [1, '#ffffff', 0]], { cx: 0.5, cy: 0.62, r: 0.5 })}
      ${lg(id('v'), [[0, '#000', 0.35], [0.25, '#000', 0], [0.75, '#000', 0], [1, '#000', 0.45]])}
    </defs>
    <rect width="320" height="480" fill="url(#${id('bg')})"/>
    <ellipse cx="96" cy="190" rx="230" ry="190" fill="url(#${id('glow')})" opacity=".55"/>
    ${bokeh.map((b) => `<circle cx="${r1(b.x)}" cy="${r1(b.y)}" r="${r1(b.r)}" fill="url(#${id('bk')})" opacity="${r1(b.o * 10) / 10}"/>`).join('')}
    ${drops.map(drop).join('')}
    <rect width="320" height="480" fill="url(#${id('v')})"/>
  </svg>`;
}
