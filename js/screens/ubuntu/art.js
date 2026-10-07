// Dessins originaux « dans l'esprit » de 2006 : emblème de démarrage, fond d'écran
// chaud et abstrait, icônes à dégradés façon thème Human, et un manchot (pas Tux).

let uid = 0;
const id = (prefix) => `ub-${prefix}-${(uid += 1)}`;

const svg = (viewBox, body, cls = '', label = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="${cls}" ${
    label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'
  } focusable="false">${body}</svg>`;

const lin = (gid, stops, [x1, y1, x2, y2] = [0, 0, 0, 1]) =>
  `<linearGradient id="${gid}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join('')}</linearGradient>`;

// ——— Emblème : un soleil levant rayé sur l'horizon ———

export function emblem(cls = '') {
  const sun = id('sun');
  const glow = id('glow');
  const cut = id('cut');
  return svg(
    '0 0 120 120',
    `<defs>
      ${lin(sun, [[0, '#ffe08a'], [0.55, '#f7a23b'], [1, '#e2561b']])}
      <radialGradient id="${glow}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb04a" stop-opacity=".5"/><stop offset=".55" stop-color="#ffb04a" stop-opacity=".16"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
      <clipPath id="${cut}"><path d="M0 0h120v62H0zM0 66h120v5H0zM0 75.5h120v4H0zM0 84h120v3H0z"/></clipPath>
    </defs>
    <circle cx="60" cy="62" r="56" fill="url(#${glow})"/>
    <g clip-path="url(#${cut})"><circle cx="60" cy="64" r="34" fill="url(#${sun})"/></g>
    <path d="M14 92h92" stroke="#f3b066" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 100h60" stroke="#f3b066" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
    <path d="M44 107h32" stroke="#f3b066" stroke-width="2" stroke-linecap="round" opacity=".3"/>`,
    cls,
  );
}

// ——— Fond d'écran : nappes de lumière orangée sur brun profond ———

export function wallpaper() {
  const bg = id('bg');
  const sheen = id('sheen');
  const shade = id('shade');
  const vignette = id('vig');
  const soft = id('soft');
  const haze = id('haze');
  const glint = id('glint');
  return svg(
    '0 0 1024 768',
    `<defs>
      <radialGradient id="${bg}" cx=".3" cy=".4" r=".95">
        <stop offset="0" stop-color="#c76d29"/>
        <stop offset=".3" stop-color="#934617"/>
        <stop offset=".64" stop-color="#53250c"/>
        <stop offset="1" stop-color="#261106"/>
      </radialGradient>
      ${lin(sheen, [[0, '#ffd08a', 0], [0.45, '#ffb35c', 0.55], [1, '#ff9a3c', 0]], [0, 0, 1, 0])}
      ${lin(shade, [[0, '#2a1206', 0], [0.55, '#2a1206', 0.15], [1, '#1c0b03', 0.7]], [0.1, 0.35, 0, 1])}
      <radialGradient id="${vignette}" cx=".45" cy=".42" r=".78"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
      <filter id="${soft}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="30"/></filter>
      <filter id="${haze}" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="${glint}" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter>
    </defs>
    <rect width="1024" height="768" fill="url(#${bg})"/>
    <circle cx="310" cy="290" r="210" fill="#ffc271" opacity=".1" filter="url(#${soft})"/>
    <rect width="1024" height="768" fill="url(#${shade})"/>
    <path d="M-60 575C200 435 420 525 650 405S940 195 1090 155" fill="none" stroke="#2a1105" stroke-width="40" opacity=".22" filter="url(#${haze})"/>
    <path d="M-60 610C200 470 420 560 650 440S940 230 1090 190" fill="none" stroke="url(#${sheen})" stroke-width="64" opacity=".5" filter="url(#${haze})"/>
    <path d="M-60 700C230 570 470 650 700 530S960 350 1090 320" fill="none" stroke="#2a1105" stroke-width="34" opacity=".2" filter="url(#${haze})"/>
    <path d="M-60 660C230 530 470 610 700 490S960 310 1090 280" fill="none" stroke="url(#${sheen})" stroke-width="22" opacity=".45" filter="url(#${haze})"/>
    <path d="M-60 612C200 472 420 562 650 442S940 232 1090 192" fill="none" stroke="#ffe2b0" stroke-width="1.7" opacity=".8" filter="url(#${glint})"/>
    <path d="M-60 664C236 534 474 614 704 494S962 314 1090 284" fill="none" stroke="#ffd59a" stroke-width="1.1" opacity=".5" filter="url(#${glint})"/>
    <path d="M-60 560C190 440 400 500 610 400S920 200 1090 160" fill="none" stroke="#ffcf8f" stroke-width=".9" opacity=".35" filter="url(#${glint})"/>
    <path d="M-60 724C260 604 500 684 740 564S990 404 1090 384" fill="none" stroke="#ffb46a" stroke-width="1" opacity=".28" filter="url(#${glint})"/>
    <rect width="1024" height="768" fill="url(#${vignette})"/>`,
    'ub-wallpaper-svg',
  );
}

// Le fond rendu comme une image : Chrome découpe en tuiles les filtres SVG en ligne.
export function wallpaperUrl() {
  const markup = wallpaper().replace('<svg ', '<svg width="1024" height="768" ');
  return `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
}

// ——— Icônes ———

function folderBody(front, back, edge) {
  return `<path d="M5 11a2.5 2.5 0 0 1 2.5-2.5h10.2l3.3 3.2h19.5A2.5 2.5 0 0 1 43 14.2V37a2.5 2.5 0 0 1-2.5 2.5h-33A2.5 2.5 0 0 1 5 37Z" fill="url(#${back})" stroke="${edge}" stroke-width="1"/>
    <path d="M8 15.5h32v6H8z" fill="#fffdf8" opacity=".92"/>
    <path d="M9.5 17.5h29" stroke="#c9c0b2" stroke-width=".8"/>
    <path d="M3.6 20.3a2.4 2.4 0 0 1 2.4-2.6h36a2.4 2.4 0 0 1 2.4 2.6l-1.5 17.3a2.6 2.6 0 0 1-2.6 2.4H7.7a2.6 2.6 0 0 1-2.6-2.4Z" fill="url(#${front})" stroke="${edge}" stroke-width="1"/>
    <path d="M6.2 19.3h35.6" stroke="#fff" stroke-width="1" opacity=".55"/>`;
}

const ICONS = {
  folder: () => {
    const f = id('f');
    const b = id('b');
    return svg(
      '0 0 48 48',
      `<defs>${lin(b, [[0, '#c47a33'], [1, '#9c5620']])}${lin(f, [[0, '#f8c983'], [0.5, '#eba455'], [1, '#d7853a']])}</defs>${folderBody(f, b, '#8a4a16')}`,
    );
  },

  home: () => {
    const f = id('f');
    const b = id('b');
    return svg(
      '0 0 48 48',
      `<defs>${lin(b, [[0, '#c47a33'], [1, '#9c5620']])}${lin(f, [[0, '#f8c983'], [0.5, '#eba455'], [1, '#d7853a']])}</defs>${folderBody(f, b, '#8a4a16')}
      <path d="M24 22.5l-8 6.6h2.3v7.4h4.2v-4.6h3v4.6h4.2v-7.4H32Z" fill="#7a3f12" opacity=".78"/>`,
    );
  },

  computer: () => {
    const c = id('c');
    const s = id('s');
    const k = id('k');
    return svg(
      '0 0 48 48',
      `<defs>${lin(c, [[0, '#f3efe6'], [1, '#c9c1b2']])}${lin(s, [[0, '#7aa6dc'], [1, '#2b5d9c']])}${lin(k, [[0, '#ede8de'], [1, '#bdb4a3']])}</defs>
      <rect x="7" y="5" width="34" height="27" rx="2.5" fill="url(#${c})" stroke="#857b6a"/>
      <rect x="10.5" y="8.5" width="27" height="19" rx="1" fill="url(#${s})" stroke="#4a4438" stroke-width=".8"/>
      <path d="M11 9h26v8C29 14 20 15 11 19Z" fill="#fff" opacity=".18"/>
      <path d="M19 32h10l1.5 4h-13Z" fill="#b3aa98" stroke="#857b6a" stroke-width=".8"/>
      <path d="M6 37.5h36l3 6.5H3Z" fill="url(#${k})" stroke="#857b6a"/>
      <path d="M8 39.3h32M7.2 41.3h33.6" stroke="#9d9483" stroke-width=".9" stroke-dasharray="1.6 1"/>`,
    );
  },

  trash: () => {
    const b = id('b');
    const l = id('l');
    return svg(
      '0 0 48 48',
      `<defs>${lin(b, [[0, '#d9dbd6'], [0.5, '#f6f6f3'], [1, '#a7aaa3']], [0, 0, 1, 0])}${lin(l, [[0, '#f2f2ef'], [1, '#a9aca5']])}</defs>
      <path d="M11 14h26l-2.4 27a2.5 2.5 0 0 1-2.5 2.3H15.9a2.5 2.5 0 0 1-2.5-2.3Z" fill="url(#${b})" stroke="#6f726b"/>
      <path d="M17.5 18v21M24 18v21M30.5 18v21" stroke="#8d908a" stroke-width="1.3" stroke-linecap="round"/>
      <rect x="8.5" y="9.5" width="31" height="5" rx="1.6" fill="url(#${l})" stroke="#6f726b"/>
      <path d="M19.5 9.5v-2a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v2" fill="none" stroke="#6f726b" stroke-width="1.2"/>`,
    );
  },

  terminal: () => {
    const b = id('b');
    const s = id('s');
    return svg(
      '0 0 48 48',
      `<defs>${lin(b, [[0, '#eeece6'], [1, '#b9b4aa']])}${lin(s, [[0, '#3a3d42'], [1, '#121315']])}</defs>
      <rect x="4" y="7" width="40" height="34" rx="3" fill="url(#${b})" stroke="#6d6a63"/>
      <rect x="7" y="10" width="34" height="27" rx="1.4" fill="url(#${s})"/>
      <path d="M11 17l5 3.6-5 3.6" fill="none" stroke="#e8e4da" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M19 25h8" stroke="#e8e4da" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M7.5 10.5h33v9C30 16 18 17 7.5 22Z" fill="#fff" opacity=".07"/>`,
    );
  },

  text: () => {
    const p = id('p');
    return svg(
      '0 0 48 48',
      `<defs>${lin(p, [[0, '#ffffff'], [1, '#e7e3dc']])}</defs>
      <path d="M10 4.5h20l9 9v29.5a1.5 1.5 0 0 1-1.5 1.5h-27A1.5 1.5 0 0 1 9 43V6a1.5 1.5 0 0 1 1-1.5Z" fill="url(#${p})" stroke="#8b867c"/>
      <path d="M30 4.5V12a1.5 1.5 0 0 0 1.5 1.5H39" fill="#ece8e0" stroke="#8b867c"/>
      <path d="M14 18h20M14 22h20M14 26h17M14 30h20M14 34h12" stroke="#9e998f" stroke-width="1.3" stroke-linecap="round"/>`,
    );
  },

  globe: () => {
    const g = id('g');
    return svg(
      '0 0 24 24',
      `<defs><radialGradient id="${g}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#9cc8f2"/><stop offset=".6" stop-color="#3f7fc4"/><stop offset="1" stop-color="#204f8a"/></radialGradient></defs>
      <circle cx="12" cy="12" r="9.5" fill="url(#${g})" stroke="#1d3f6b"/>
      <path d="M6 8.5c2 .4 3.4-.6 4.6.6s-.2 2.4 1.3 3.2 2.6-.5 3.2 1.1-1.4 3.2-.4 4.6M15.5 4.4c-.6 1.4.4 2.2 1.6 2.4s2.4 1.2 2.6 2.6" fill="none" stroke="#7fc36a" stroke-width="2" stroke-linecap="round" opacity=".9"/>
      <path d="M5 9a8 8 0 0 1 9-5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".45" stroke-linecap="round"/>`,
    );
  },

  mail: () => {
    const e = id('e');
    return svg(
      '0 0 24 24',
      `<defs>${lin(e, [[0, '#ffffff'], [1, '#d9d4cb']])}</defs>
      <rect x="2.5" y="5.5" width="19" height="13.5" rx="1.5" fill="url(#${e})" stroke="#857d70"/>
      <path d="M3 6.5l9 6.6 9-6.6" fill="none" stroke="#857d70" stroke-width="1.1"/>
      <path d="M3 18.5l6.6-6M21 18.5l-6.6-6" stroke="#a69e90" stroke-width=".9"/>`,
    );
  },

  help: () =>
    svg(
      '0 0 24 24',
      `<circle cx="12" cy="12" r="9.5" fill="#f6f3ee" stroke="#8b4f22"/>
      <circle cx="12" cy="12" r="4.2" fill="#fff" stroke="#8b4f22"/>
      <path d="M5.2 5.2l3.9 3.9M18.8 5.2l-3.9 3.9M5.2 18.8l3.9-3.9M18.8 18.8l-3.9-3.9" stroke="#e16a2a" stroke-width="3.6"/>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="#8b4f22"/>`,
    ),

  network: () =>
    svg(
      '0 0 20 20',
      `<rect x="1.5" y="3" width="10" height="7.5" rx="1" fill="#dcdad4" stroke="#55524b"/>
      <rect x="3" y="4.5" width="7" height="4.5" fill="#3f6fa8"/>
      <rect x="8.5" y="9" width="10" height="7.5" rx="1" fill="#dcdad4" stroke="#55524b"/>
      <rect x="10" y="10.5" width="7" height="4.5" fill="#3f6fa8"/>
      <path d="M5 12.5v4h3" fill="none" stroke="#55524b"/>`,
    ),

  volume: () =>
    svg(
      '0 0 20 20',
      `<path d="M3 7.5h3.2L10.5 4v12L6.2 12.5H3Z" fill="#4b4943" stroke="#2e2c28" stroke-width=".8" stroke-linejoin="round"/>
      <path d="M13 7.2a4 4 0 0 1 0 5.6M15.2 5a7 7 0 0 1 0 10" fill="none" stroke="#4b4943" stroke-width="1.5" stroke-linecap="round"/>`,
    ),

  power: () => {
    const r = id('r');
    return svg(
      '0 0 20 20',
      `<defs><radialGradient id="${r}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ff8a6a"/><stop offset="1" stop-color="#c0261b"/></radialGradient></defs>
      <circle cx="10" cy="10" r="8.2" fill="url(#${r})" stroke="#7d1810"/>
      <path d="M10 5v5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M7 6.8a4.6 4.6 0 1 0 6 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
    );
  },

  showDesktop: () =>
    svg(
      '0 0 20 20',
      `<rect x="2" y="3.5" width="16" height="11" rx="1" fill="#6f9fd8" stroke="#3d5f8c"/>
      <path d="M2.5 11.5l4.5-3 3 2 3.5-3 4 3.5v3h-15Z" fill="#9ccf7a"/>
      <path d="M7 17h6" stroke="#55524b" stroke-width="1.6" stroke-linecap="round"/>`,
    ),

};

// Petites icônes de menu (16 px) : formes simples, couleurs Tango.
const MINI = {
  accessories: '<rect x="3" y="1.5" width="10" height="13" rx="1.5" fill="#d8d4cc" stroke="#6b665d"/><rect x="4.5" y="3" width="7" height="3" fill="#a7c49a"/><path d="M5 8.5h1.5M7.3 8.5h1.5M9.6 8.5h1.5M5 11h1.5M7.3 11h1.5M9.6 11h1.5" stroke="#55524b" stroke-width="1.4"/>',
  office: '<path d="M3 1.5h7l3 3v10H3Z" fill="#fff" stroke="#6b665d"/><path d="M5 6.5h6M5 8.5h6M5 10.5h4" stroke="#3f6fa8"/>',
  graphics: '<path d="M8 1.8a6.2 6.2 0 1 0 0 12.4c1.2 0 1.3-1.3.6-2s-.3-2 1-2h2.2a2.4 2.4 0 0 0 2.4-2.4A6 6 0 0 0 8 1.8Z" fill="#f2e4c8" stroke="#8a6d3b"/><circle cx="5" cy="6" r="1.2" fill="#cc3b2e"/><circle cx="8" cy="4.4" r="1.2" fill="#3f8a3a"/><circle cx="11" cy="6" r="1.2" fill="#3f6fa8"/>',
  internet: '<circle cx="8" cy="8" r="6.3" fill="#5a8fd0" stroke="#24508a"/><path d="M4 6c1.4.4 2.2-.4 3 .5s-.1 1.6.9 2.2 1.7-.3 2.1.8-.9 2.1-.3 3" fill="none" stroke="#7fc36a" stroke-width="1.4"/>',
  games: '<rect x="2" y="3" width="8.5" height="11" rx="1" fill="#fff" stroke="#6b665d" transform="rotate(-8 6 8)"/><rect x="6" y="2.5" width="8.5" height="11" rx="1" fill="#fff" stroke="#6b665d" transform="rotate(8 10 8)"/><path d="M10.4 6.4c.7-.9 2-.4 1.6.7l-1.6 1.8-1.6-1.8c-.4-1.1.9-1.6 1.6-.7Z" fill="#cc3b2e"/>',
  sound: '<path d="M6 3.5l7-1.5v8.5" fill="none" stroke="#55524b" stroke-width="1.4"/><ellipse cx="4.6" cy="12" rx="2.4" ry="1.8" fill="#55524b"/><ellipse cx="11.6" cy="10.6" rx="2.4" ry="1.8" fill="#55524b"/><path d="M6 3.5V12" stroke="#55524b" stroke-width="1.4"/>',
  add: '<path d="M2 5l6-3 6 3v6.5l-6 3-6-3Z" fill="#d9a35e" stroke="#7d5323" stroke-linejoin="round"/><path d="M2 5l6 3 6-3M8 8v6.5" fill="none" stroke="#7d5323"/>',
  home: '<path d="M8 2L1.5 7.5h2V14h4v-4h1v4h4V7.5h2Z" fill="#e9a04f" stroke="#8a4a16" stroke-linejoin="round"/>',
  desktop: '<rect x="1.5" y="2.5" width="13" height="9" rx="1" fill="#6f9fd8" stroke="#3d5f8c"/><path d="M2 9l3.5-2.4 2.4 1.6 2.8-2.4 3.3 2.8V11H2Z" fill="#9ccf7a"/><path d="M5.5 14h5" stroke="#55524b" stroke-width="1.4"/>',
  computer: '<rect x="2" y="1.5" width="12" height="9" rx="1" fill="#e6e1d6" stroke="#6b665d"/><rect x="3.5" y="3" width="9" height="6" fill="#3f6fa8"/><path d="M1.5 12.5h13l1 2h-15Z" fill="#d8d2c5" stroke="#6b665d" stroke-linejoin="round"/>',
  network: '<circle cx="8" cy="8" r="6.3" fill="#5a8fd0" stroke="#24508a"/><path d="M1.8 8h12.4M8 1.8c-2.6 3.4-2.6 9 0 12.4M8 1.8c2.6 3.4 2.6 9 0 12.4" fill="none" stroke="#d6e6f7" stroke-width=".9"/>',
  server: '<rect x="2" y="2" width="12" height="5" rx="1" fill="#d8d4cc" stroke="#6b665d"/><rect x="2" y="9" width="12" height="5" rx="1" fill="#d8d4cc" stroke="#6b665d"/><circle cx="11.5" cy="4.5" r="1" fill="#4e9a06"/><circle cx="11.5" cy="11.5" r="1" fill="#4e9a06"/>',
  search: '<circle cx="6.5" cy="6.5" r="4.3" fill="#e9f1fb" stroke="#55524b" stroke-width="1.5"/><path d="M9.8 9.8l4.4 4.4" stroke="#8a4a16" stroke-width="2.4" stroke-linecap="round"/>',
  recent: '<circle cx="8" cy="8" r="6.3" fill="#fff" stroke="#6b665d"/><path d="M8 4.2V8l2.6 1.7" fill="none" stroke="#55524b" stroke-width="1.4" stroke-linecap="round"/>',
  prefs: '<path d="M3 3v10M8 3v10M13 3v10" stroke="#6b665d" stroke-width="1.2"/><rect x="1.5" y="8.5" width="3" height="2.4" rx=".6" fill="#e9a04f" stroke="#8a4a16"/><rect x="6.5" y="4" width="3" height="2.4" rx=".6" fill="#e9a04f" stroke="#8a4a16"/><rect x="11.5" y="10" width="3" height="2.4" rx=".6" fill="#e9a04f" stroke="#8a4a16"/>',
  admin: '<circle cx="5.5" cy="10.5" r="3.4" fill="#f2c94c" stroke="#8a6d1b"/><circle cx="5.5" cy="10.5" r="1.1" fill="#8a6d1b"/><path d="M8 8l6-6M11.5 4.5l1.6 1.6M10 6l1.2 1.2" stroke="#8a6d1b" stroke-width="1.6" stroke-linecap="round"/>',
  help: '<circle cx="8" cy="8" r="6.4" fill="#fff" stroke="#8b4f22"/><circle cx="8" cy="8" r="2.6" fill="#fff" stroke="#8b4f22"/><path d="M3.5 3.5l2.6 2.6M12.5 3.5l-2.6 2.6M3.5 12.5l2.6-2.6M12.5 12.5l-2.6-2.6" stroke="#e16a2a" stroke-width="2.4"/>',
  about: '<circle cx="8" cy="8" r="6.4" fill="#3f6fa8" stroke="#24508a"/><path d="M8 7v4.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="4.6" r="1.1" fill="#fff"/>',
  logout: '<circle cx="8" cy="8" r="6.4" fill="#d9382a" stroke="#7d1810"/><path d="M8 4v4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M5.6 5.6a3.6 3.6 0 1 0 4.8 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>',
  terminal: '<rect x="1.5" y="2.5" width="13" height="11" rx="1.4" fill="#2e3033" stroke="#6b665d"/><path d="M4 6l2.4 1.8L4 9.6M7.6 10.2h3.6" fill="none" stroke="#e8e4da" stroke-width="1.3" stroke-linecap="round"/>',
  calc: '<rect x="3" y="1.5" width="10" height="13" rx="1.5" fill="#d8d4cc" stroke="#6b665d"/><rect x="4.5" y="3" width="7" height="3" fill="#a7c49a"/><path d="M5 8.5h1.5M7.3 8.5h1.5M9.6 8.5h1.5M5 11h1.5M7.3 11h1.5M9.6 11h1.5" stroke="#55524b" stroke-width="1.4"/>',
  editor: '<path d="M3 1.5h7l3 3v10H3Z" fill="#fff" stroke="#6b665d"/><path d="M5 6.5h6M5 8.5h6M5 10.5h4" stroke="#9e998f"/><path d="M9 13l4.5-4.5 1.2 1.2L10.2 14.2 8.6 14.6Z" fill="#e9a04f" stroke="#8a4a16" stroke-width=".7"/>',
  screenshot: '<rect x="1.5" y="3.5" width="13" height="9.5" rx="1.5" fill="#55524b"/><circle cx="8" cy="8.3" r="3" fill="#9cc8f2" stroke="#e8e4da"/><rect x="5" y="2" width="4" height="2" fill="#55524b"/>',
  text: '<path d="M3 1.5h7l3 3v10H3Z" fill="#fff" stroke="#6b665d"/><path d="M5 6.5h6M5 8.5h6M5 10.5h4" stroke="#9e998f"/>',
};

export function icon(name, size = 48, cls = '') {
  const make = ICONS[name];
  if (make) {
    const markup = make();
    return markup.replace('<svg ', `<svg width="${size}" height="${size}" class="ub-ico ${cls}" `).replace(' class=""', '');
  }
  if (MINI[name]) return mini(name, size, cls);
  return '';
}

export function mini(name, size = 16, cls = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" class="ub-ico ${cls}" aria-hidden="true" focusable="false">${MINI[name] ?? ''}</svg>`;
}

// ——— Le manchot du coin de l'écran (un manchot empereur, pas Tux) ———

export function penguin() {
  const body = id('body');
  const belly = id('belly');
  const patch = id('patch');
  const scarf = id('scarf');
  return svg(
    '0 0 84 100',
    `<defs>
      ${lin(body, [[0, '#4a5568'], [0.55, '#2a3140'], [1, '#161b24']], [0.2, 0, 0.8, 1])}
      <radialGradient id="${belly}" cx=".42" cy=".36" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#f3eee4"/><stop offset="1" stop-color="#d4cbbb"/></radialGradient>
      ${lin(patch, [[0, '#ffe08e'], [1, '#f39a2e']])}
      ${lin(scarf, [[0, '#f0773a'], [1, '#c94f1d']])}
    </defs>
    <ellipse class="ub-peng-shadow" cx="42" cy="95" rx="24" ry="3.6" fill="#000" opacity=".28"/>
    <g class="ub-peng-body">
      <path d="M42 5C25 5 18 21 18.5 38 19 55 11 68 15 81c3.5 10 50 10 54 0 4-13-4-26-3.5-43C66 21 59 5 42 5Z" fill="url(#${body})"/>
      <path class="ub-peng-wing ub-peng-wing-l" d="M19 45c-8 7-10 19-6.5 26 2.4-7.5 5.4-14.5 9-20Z" fill="#1d2330"/>
      <path class="ub-peng-wing ub-peng-wing-r" d="M65 45c8 7 10 19 6.5 26-2.4-7.5-5.4-14.5-9-20Z" fill="#1d2330"/>
      <path d="M42 31c-12.5 0-17 15.5-16 30 .9 13.5 6 24 16 24s15.1-10.5 16-24c1-14.5-3.5-30-16-30Z" fill="url(#${belly})"/>
      <path d="M26.5 27c-4.5 5-3.4 12 1.8 15.4 1.8-5.2 2.2-10 .2-15.4Z" fill="url(#${patch})"/>
      <path d="M57.5 27c4.5 5 3.4 12-1.8 15.4-1.8-5.2-2.2-10-.2-15.4Z" fill="url(#${patch})"/>
      <g class="ub-peng-eyes">
        <ellipse cx="34.5" cy="21.5" rx="3" ry="3.4" fill="#0b0e13"/>
        <ellipse cx="49.5" cy="21.5" rx="3" ry="3.4" fill="#0b0e13"/>
        <circle cx="35.6" cy="20.2" r="1.1" fill="#fff"/>
        <circle cx="50.6" cy="20.2" r="1.1" fill="#fff"/>
      </g>
      <path d="M37.5 26.5c2.6-1.8 6.4-1.8 9 0L42 33.5Z" fill="#20252e"/>
      <path d="M38.8 27.4c2-.9 4.4-.9 6.4 0" stroke="#f39a2e" stroke-width="1.3" stroke-linecap="round" fill="none"/>
      <path d="M24.5 36.5c10 5.2 25 5.2 35 0l1.2 5c-11 5.6-26.4 5.6-37.4 0Z" fill="url(#${scarf})"/>
      <path d="M50 42.5l5.5 13.2-5.6 1.6-3.2-14Z" fill="url(#${scarf})"/>
      <path d="M52.6 55.2l.8 2.6M50.7 55.7l.8 2.6" stroke="#9e3a12" stroke-width="1"/>
      <path d="M31 86c-5 1.6-7.4 4.4-3.2 5.6h10.4c2.3-1.2 1-4.6-1.4-5.6Z" fill="#1d2330"/>
      <path d="M53 86c5 1.6 7.4 4.4 3.2 5.6H45.8c-2.3-1.2-1-4.6 1.4-5.6Z" fill="#1d2330"/>
    </g>`,
    'ub-peng-svg',
  );
}
