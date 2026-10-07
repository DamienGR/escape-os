// Écran 6 — l'art de Windows XP, entièrement redessiné « dans l'esprit » Luna :
// dégradés partagés, icônes vectorielles brillantes, avatars des comptes,
// émoticônes animées et fond d'écran original (colline et ciel, pas de photo).

// ——— Dégradés partagés (un seul <defs> pour tout l'écran) ———

const stops = (list) =>
  list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a == null ? '' : ` stop-opacity="${a}"`}/>`).join('');
const lin = (id, list, x2 = 0, y2 = 1) => `<linearGradient id="xp-${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
const rad = (id, list, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="xp-${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`;

export const DEFS = `<svg class="xp-defs" aria-hidden="true" focusable="false" width="0" height="0"><defs>
  ${lin('beige', [[0, '#fdfbf3'], [1, '#d2cab3']])}
  ${lin('screen', [[0, '#8cc2ff'], [0.55, '#3f82ea'], [1, '#1c4db5']])}
  ${lin('hill', [[0, '#a9de62'], [1, '#3a8f22']])}
  ${lin('paper', [[0, '#ffffff'], [1, '#dde3eb']])}
  ${lin('folder-back', [[0, '#f9da80'], [1, '#d9a032']])}
  ${lin('folder-front', [[0, '#fff3bf'], [0.45, '#ffdb6e'], [1, '#efb23a']])}
  ${lin('bubble-blue', [[0, '#a6d6ff'], [1, '#2b6fdc']])}
  ${lin('bubble-green', [[0, '#cff79a'], [1, '#3ba52b']])}
  ${lin('bin', [[0, '#b7cbc6'], [0.3, '#f7fbfa'], [0.62, '#d7e4e0'], [1, '#8fa8a3']], 1, 0)}
  ${rad('globe', [[0, '#c4e9ff'], [0.45, '#3f95ec'], [1, '#113c96']], 0.38, 0.32, 0.7)}
  ${lin('land', [[0, '#97e061'], [1, '#2c8a25']])}
  ${lin('orange', [[0, '#ffd590'], [0.5, '#ff9b30'], [1, '#e0640c']])}
  ${lin('red', [[0, '#ffa486'], [0.5, '#f05332'], [1, '#c02a12']])}
  ${lin('green', [[0, '#c0f185'], [0.5, '#56ba3c'], [1, '#2a8922']])}
  ${lin('blue', [[0, '#aed3ff'], [0.5, '#4b8df0'], [1, '#1f55c9']])}
  ${lin('gold', [[0, '#fff6b4'], [1, '#efb000']])}
  ${lin('gloss', [[0, '#fff', 0.9], [1, '#fff', 0]])}
  ${lin('metal', [[0, '#ffffff'], [1, '#b4bbc5']])}
  ${lin('dark', [[0, '#6a7080'], [1, '#14161c']])}
  ${lin('disc', [[0, '#f4f7fb'], [0.35, '#c9d3e0'], [0.5, '#fbe9ff'], [0.65, '#cfe9f5'], [1, '#aab6c6']], 1, 1)}
  ${rad('smiley', [[0, '#fffce6'], [0.42, '#ffe44f'], [1, '#f19f00']], 0.38, 0.3, 0.75)}
  ${rad('angry', [[0, '#ffd9c9'], [0.45, '#ff7a52'], [1, '#d22e18']], 0.38, 0.3, 0.75)}
  ${rad('heart', [[0, '#ffc0c9'], [0.45, '#f2384f'], [1, '#b30c23']], 0.35, 0.3, 0.75)}
  ${rad('st-online', [[0, '#d8ffb0'], [0.5, '#5cc83a'], [1, '#2a8a1c']], 0.4, 0.3, 0.7)}
  ${rad('st-away', [[0, '#ffe7b0'], [0.5, '#ffa62b'], [1, '#d96a00']], 0.4, 0.3, 0.7)}
  ${rad('st-busy', [[0, '#ffc2b0'], [0.5, '#f0472b'], [1, '#b82210']], 0.4, 0.3, 0.7)}
  ${rad('st-off', [[0, '#ffffff'], [0.5, '#d5dae0'], [1, '#9aa2ad']], 0.4, 0.3, 0.7)}
  ${lin('av-water', [[0, '#e3f5ff'], [0.55, '#8fd0f8'], [1, '#3d98de']])}
  ${rad('av-duck', [[0, '#fff8b8'], [0.5, '#ffd92e'], [1, '#f0a000']], 0.4, 0.3, 0.75)}
  ${lin('av-beak', [[0, '#ffbb55'], [1, '#ee6400']])}
  ${lin('av-night', [[0, '#b38dff'], [0.55, '#6a35d0'], [1, '#2c1478']])}
  ${rad('av-spot', [[0, '#fff', 0.5], [1, '#fff', 0]])}
  ${lin('av-wood', [[0, '#b0703f'], [1, '#5a3117']], 1, 0)}
  ${lin('av-felt', [[0, '#c6efb9'], [0.5, '#5fbf72'], [1, '#22804a']])}
  ${lin('av-knight', [[0, '#6b7180'], [0.55, '#24272f'], [1, '#08090c']], 1, 0.35)}
  <radialGradient id="xp-av-burst" gradientUnits="userSpaceOnUse" cx="24" cy="33" r="14">${stops([
    [0, '#ffe08a'],
    [0.35, '#ffa12e'],
    [0.72, '#cf3d0e'],
    [1, '#5a1505'],
  ])}</radialGradient>
  <clipPath id="xp-orb-clip"><circle cx="24" cy="24" r="19"/></clipPath>
</defs></svg>`;

// ——— Icônes (repère 48 × 48, affichées de 16 à 48 px) ———

const folder = (inner = '') => `
  <path d="M4 11.5a2 2 0 0 1 2-2h11l3 3.5h20a2 2 0 0 1 2 2V40a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="url(#xp-folder-back)" stroke="#b07a1e"/>
  ${inner}
  <path d="M3.6 19.5h40.6a1.5 1.5 0 0 1 1.5 1.8l-3.2 19a2 2 0 0 1-2 1.7H6.7a2 2 0 0 1-2-1.7L2.1 21.3a1.5 1.5 0 0 1 1.5-1.8z" fill="url(#xp-folder-front)" stroke="#c08a26"/>
  <path d="M4.6 21h38.6" stroke="#fff" stroke-opacity=".85"/>`;

const sheet = (rot, extra) => `<g transform="rotate(${rot} 24 18)">
  <rect x="12.5" y="5.5" width="23" height="27" fill="url(#xp-paper)" stroke="#8d97a6"/>${extra}</g>`;

const doc = (inner) => `
  <path d="M10.5 3.5h18l9 9v32h-27z" fill="url(#xp-paper)" stroke="#7b879a" stroke-linejoin="round"/>
  <path d="M28.5 3.5v9h9" fill="#e9edf2" stroke="#7b879a" stroke-linejoin="round"/>${inner}`;

const SHINE = '<ellipse cx="24" cy="14" rx="13" ry="7" fill="url(#xp-gloss)" opacity=".7"/>';

const ICONS = {
  computer: `
    <rect x="29.5" y="9.5" width="15" height="33" rx="2" fill="url(#xp-beige)" stroke="#7d7764"/>
    <rect x="32" y="13.5" width="10" height="2.6" rx=".6" fill="#ece7d8" stroke="#8d8672" stroke-width=".7"/>
    <rect x="32" y="18.5" width="10" height="2.6" rx=".6" fill="#ece7d8" stroke="#8d8672" stroke-width=".7"/>
    <circle cx="37" cy="37" r="1.3" fill="#3fd23a"/>
    <rect x="3.5" y="7.5" width="31" height="26" rx="3" fill="url(#xp-beige)" stroke="#7d7764"/>
    <rect x="6.5" y="10.5" width="25" height="19" rx="1" fill="url(#xp-screen)" stroke="#5a5546" stroke-width=".8"/>
    <path d="M7 25.5c5-3.8 10-4.3 15-2.4s6.5 1 9-.6V29H7z" fill="url(#xp-hill)"/>
    <path d="M7 11h24L7 23.5z" fill="#fff" opacity=".22"/>
    <path d="M14.5 33.5h9l2 4.5h-13z" fill="url(#xp-beige)" stroke="#7d7764" stroke-linejoin="round"/>
    <rect x="8.5" y="38" width="21" height="4" rx="2" fill="url(#xp-beige)" stroke="#7d7764"/>`,

  documents: folder(
    sheet(-6, '<path d="M16 11h16M16 14.5h16M16 18h11" stroke="#9fb0c8" stroke-width="1.2"/>'),
  ),

  pictures: folder(`<g transform="rotate(5 26 16)">
    <rect x="12.5" y="4.5" width="25" height="20" fill="#fff" stroke="#8d97a6"/>
    <rect x="14.5" y="6.5" width="21" height="16" fill="url(#xp-screen)"/>
    <path d="M14.5 19c4-3 8.5-3.4 12.5-1.4s5.5 1 8.5-.8v5.7h-21z" fill="url(#xp-hill)"/>
    <circle cx="31" cy="10.5" r="2" fill="#fff6c4"/></g>`),

  music: folder(
    sheet(-4, '<path d="M27 9.5v11.2a2.6 2.6 0 1 1-1.6-2.4V12.6l-6 1.5v8.1a2.6 2.6 0 1 1-1.6-2.4v-8.6z" fill="#2d5bb5"/>'),
  ),

  folder: folder(),

  messenger: `
    <path d="M19 4.5h21a6 6 0 0 1 6 6v11a6 6 0 0 1-6 6h-1.5l1.8 6.5-8.3-6.5H19a6 6 0 0 1-6-6v-11a6 6 0 0 1 6-6z" fill="url(#xp-bubble-blue)" stroke="#1d4f9e"/>
    <path d="M8 17.5h20a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H16.5L8 45.5l1.8-6H8a6 6 0 0 1-6-6v-10a6 6 0 0 1 6-6z" fill="url(#xp-bubble-green)" stroke="#277417"/>
    <ellipse cx="30" cy="9" rx="11" ry="3" fill="url(#xp-gloss)"/>
    <ellipse cx="18" cy="22" rx="11" ry="3" fill="url(#xp-gloss)"/>
    <circle cx="11" cy="29" r="2.2" fill="#fff"/><circle cx="18" cy="29" r="2.2" fill="#fff"/><circle cx="25" cy="29" r="2.2" fill="#fff"/>`,

  bin: `
    <path d="M10.5 13h27l-3 29.2a2.4 2.4 0 0 1-2.4 2.1H15.9a2.4 2.4 0 0 1-2.4-2.1z" fill="url(#xp-bin)" stroke="#5f7773"/>
    <path d="M17 17.5l1.2 23M24 17.5v23.5M31 17.5l-1.2 23" stroke="#fff" stroke-opacity=".95" stroke-width="1.7"/>
    <path d="M18.4 17.5l1.2 23M25.4 17.5v23.5M32.4 17.5l-1.2 23" stroke="#6f8a85" stroke-opacity=".5"/>
    <path d="M15.5 12.5c1-3.4 3.4-4.6 5.4-3.4l2.6-2.4 3 2.6c2-1.4 5-.6 6 3.2z" fill="#fff" stroke="#9aa8b4" stroke-linejoin="round"/>
    <ellipse cx="24" cy="13" rx="14.5" ry="4" fill="none" stroke="#5f7773"/>
    <path d="M9.5 13a14.5 4 0 0 0 29 0" fill="#e8f0ee" stroke="#5f7773"/>
    <path d="M12.2 13.6a12 2.4 0 0 0 23.6 0" fill="none" stroke="#7f9893" stroke-width="1.2"/>`,

  globe: `
    <circle cx="24" cy="24" r="18.5" fill="url(#xp-globe)" stroke="#0f3d8f"/>
    <path d="M12.5 14c4-2.4 8.4-.6 9.4 2.6s-2 5 .8 8-1.4 7.6-4.4 7.2-2.6-4.2-5.6-5.2-4-4.4-2.8-7.2 1.2-4.6 2.6-5.4z" fill="url(#xp-land)"/>
    <path d="M29 8.2c4.4 1 8.4 4.4 10.4 8.6-2 1-5.2-.2-6.2 1.8s1 4.2-1.2 6.2-4.4-.2-5-3.4 1.2-4-.2-6.2-.8-5.6 2.2-7z" fill="url(#xp-land)"/>
    <path d="M30 33.5c3.2-1.2 6.4 0 7.4 2-2 3-5.4 5-8.4 5.2 0-2.2-1-5.2 1-7.2z" fill="url(#xp-land)"/>
    <ellipse cx="19" cy="14.5" rx="11" ry="6.4" fill="url(#xp-gloss)" opacity=".75"/>`,

  media: `
    <circle cx="24" cy="24" r="19" fill="url(#xp-orange)" stroke="#b5510a"/>
    <path d="M19 14.5v19l15-9.5z" fill="#fff" stroke="#c45a0c" stroke-linejoin="round"/>
    ${SHINE}`,

  mail: `
    <rect x="4.5" y="11.5" width="39" height="26" rx="2.5" fill="url(#xp-paper)" stroke="#7b879a"/>
    <path d="M5.5 13l18.5 14.5L42.5 13" fill="none" stroke="#7b879a" stroke-width="1.4"/>
    <path d="M5.5 36.5l14-10.5M42.5 36.5l-14-10.5" stroke="#a9b3c2"/>
    <rect x="33.5" y="14.5" width="6.5" height="7.5" fill="#e04a2b" stroke="#fff"/>`,

  paint: `
    <path d="M24 6C12.4 6 4 13.4 4 22.6c0 8.8 7.6 15.4 17.4 15.4 3 0 3.6-2 2.4-3.8-1.6-2.4.2-5 3-5h4.6C39 29.2 44 25.4 44 19.4 44 11.8 35.4 6 24 6z" fill="url(#xp-beige)" stroke="#8a7d5c"/>
    <circle cx="13" cy="20" r="3.4" fill="#e8382b"/><circle cx="20" cy="13" r="3.4" fill="#f5b800"/>
    <circle cx="29.5" cy="12.5" r="3.4" fill="#2fa83a"/><circle cx="36.5" cy="19" r="3.4" fill="#2a6ee8"/>
    <path d="M30 46l13-18 2.4 1.8-12 18.4z" fill="#a8743e" stroke="#5d3a17" stroke-linejoin="round"/>`,

  control: `
    <rect x="3.5" y="6.5" width="34" height="26" rx="3" fill="url(#xp-beige)" stroke="#7d7764"/>
    <rect x="6.5" y="9.5" width="28" height="19" rx="1" fill="url(#xp-screen)"/>
    <path d="M10 14.5h12M10 19.5h18M10 24.5h8" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
    <circle cx="35" cy="35" r="7.5" fill="none" stroke="#5e6f86" stroke-width="5" stroke-dasharray="3.1 2.8"/>
    <circle cx="35" cy="35" r="6.2" fill="url(#xp-metal)" stroke="#5e6f86"/>
    <circle cx="35" cy="35" r="2.3" fill="#fff" stroke="#5e6f86"/>`,

  help: `
    <circle cx="24" cy="24" r="19" fill="url(#xp-blue)" stroke="#173f9a"/>
    <path d="M18 18.5a6 6 0 1 1 8.7 5.3c-1.8 1-2.7 2-2.7 4v1.2" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/>
    <circle cx="24" cy="35" r="2.7" fill="#fff"/>
    ${SHINE}`,

  search: `
    <path d="M29.5 30.5l11 11" stroke="#4d3a24" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M29.5 30.5l11 11" stroke="#a5713e" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="20" cy="20" r="13" fill="#d8ecff" fill-opacity=".9" stroke="#5a6779" stroke-width="3.5"/>
    <path d="M12.4 17.2a8.6 8.6 0 0 1 7.6-5.6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,

  run: `
    <rect x="4.5" y="8.5" width="33" height="28" rx="2" fill="#fff" stroke="#3c5f9c"/>
    <path d="M4.5 10.5a2 2 0 0 1 2-2h29a2 2 0 0 1 2 2v4h-33z" fill="url(#xp-blue)" stroke="#3c5f9c"/>
    <path d="M9 21h17M9 25.5h12" stroke="#b7c3d6" stroke-width="2"/>
    <path d="M23 30.5h11v-5l9.5 8-9.5 8v-5H23z" fill="url(#xp-green)" stroke="#2a7a1c" stroke-linejoin="round"/>`,

  logoff: `
    <rect x="4.5" y="4.5" width="39" height="39" rx="7" fill="url(#xp-orange)" stroke="#b5510a"/>
    <path d="M22 13h-7.5v22H22" fill="none" stroke="#fff" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M20.5 24H34M29 18.2l5.8 5.8-5.8 5.8" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="7" y="7" width="34" height="15" rx="5" fill="url(#xp-gloss)" opacity=".55"/>`,

  power: `
    <rect x="4.5" y="4.5" width="39" height="39" rx="7" fill="url(#xp-red)" stroke="#9e2410"/>
    <path d="M16.6 16.6a10.6 10.6 0 1 0 14.8 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <path d="M24 11.5v12.5" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <rect x="7" y="7" width="34" height="15" rx="5" fill="url(#xp-gloss)" opacity=".5"/>`,

  // Bouton « démarrer » : un petit hublot sur la colline (aucun drapeau)
  orb: `
    <g clip-path="url(#xp-orb-clip)">
      <rect width="48" height="48" fill="url(#xp-screen)"/>
      <circle cx="33" cy="14" r="4.5" fill="#fff8c8"/>
      <path d="M2 31c8-7 17-8.6 26-5s13 2.2 18-1.4V48H2z" fill="url(#xp-hill)"/>
      <path d="M2 38c10-5 20-5 30-1.6s10 1 14-.4V48H2z" fill="#2f8a1f" opacity=".55"/>
      <ellipse cx="22" cy="12" rx="15" ry="8" fill="url(#xp-gloss)" opacity=".8"/>
    </g>
    <circle cx="24" cy="24" r="19.5" fill="none" stroke="#fff" stroke-width="3.4"/>
    <circle cx="24" cy="24" r="21.4" fill="none" stroke="#1f6a1a" stroke-opacity=".55" stroke-width="1"/>`,

  invite: `
    <path d="M5.5 41.5c0-9 6.2-15 14.5-15s14.5 6 14.5 15z" fill="url(#xp-blue)" stroke="#1f4fae"/>
    <circle cx="20" cy="15.5" r="8.6" fill="url(#xp-blue)" stroke="#1f4fae"/>
    <ellipse cx="18" cy="11.5" rx="5" ry="3" fill="url(#xp-gloss)" opacity=".8"/>
    <circle cx="36" cy="34" r="9" fill="url(#xp-green)" stroke="#2a7a1c"/>
    <path d="M36 29v10M31 34h10" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`,

  sendfile: `${doc('<path d="M15 19h15M15 24h15M15 29h9" stroke="#a9b6c8" stroke-width="1.8"/>')}
    <path d="M24 34.5h10v-5l9 7.5-9 7.5v-5H24z" fill="url(#xp-green)" stroke="#2a7a1c" stroke-linejoin="round"/>`,

  webcam: `
    <path d="M17 37.5h14l3.4 6.5H13.6z" fill="url(#xp-metal)" stroke="#6b7480" stroke-linejoin="round"/>
    <circle cx="24" cy="21" r="16" fill="url(#xp-metal)" stroke="#6b7480"/>
    <circle cx="24" cy="21" r="9.4" fill="#1a1f2b" stroke="#3a6fd8" stroke-width="2.6"/>
    <circle cx="24" cy="21" r="4.2" fill="#3d4a66"/>
    <circle cx="21.4" cy="18.4" r="2.1" fill="#fff" opacity=".85"/>
    <circle cx="35.5" cy="11.5" r="1.9" fill="#4fc3ff"/>`,

  audio: `
    <path d="M9 29v-5a15 15 0 0 1 30 0v5" fill="none" stroke="#56627a" stroke-width="4" stroke-linecap="round"/>
    <rect x="4.5" y="24.5" width="10" height="15" rx="4.5" fill="url(#xp-blue)" stroke="#1f4fae"/>
    <rect x="33.5" y="24.5" width="10" height="15" rx="4.5" fill="url(#xp-blue)" stroke="#1f4fae"/>
    <path d="M10 39c0 4.6 5 6 10.6 6" fill="none" stroke="#56627a" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="20" y="42" width="7.5" height="5" rx="2.5" fill="#56627a"/>`,

  activities: `
    <path d="M7.5 14.5h10a4.6 4.6 0 1 1 7.4 0h9.6v9.6a4.6 4.6 0 1 1 0 7.4v10H7.5z" fill="url(#xp-orange)" stroke="#b5510a" stroke-linejoin="round"/>
    <path d="M10 17h22" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`,

  games: `
    <g transform="rotate(-12 16 26)">
      <rect x="5.5" y="15.5" width="21" height="21" rx="4" fill="url(#xp-paper)" stroke="#6b7480"/>
      <circle cx="11" cy="21" r="2" fill="#1f2a44"/><circle cx="16" cy="26" r="2" fill="#1f2a44"/><circle cx="21" cy="31" r="2" fill="#1f2a44"/>
    </g>
    <g transform="rotate(10 32 21)">
      <rect x="21.5" y="10.5" width="21" height="21" rx="4" fill="url(#xp-red)" stroke="#9e2410"/>
      <circle cx="27" cy="16" r="2" fill="#fff"/><circle cx="37" cy="16" r="2" fill="#fff"/>
      <circle cx="27" cy="26" r="2" fill="#fff"/><circle cx="37" cy="26" r="2" fill="#fff"/>
    </g>`,

  hdd: `
    <path d="M5.5 22.5l5-9h27l5 9z" fill="#e9ecf0" stroke="#6b7480" stroke-linejoin="round"/>
    <rect x="5.5" y="22.5" width="37" height="12" rx="2" fill="url(#xp-metal)" stroke="#6b7480"/>
    <circle cx="36.5" cy="28.5" r="1.8" fill="#3fd23a"/>
    <path d="M10 28.5h15" stroke="#8b94a1" stroke-width="2" stroke-linecap="round"/>`,

  floppy: `
    <path d="M8.5 6.5h27l4 4v31h-31z" fill="url(#xp-dark)" stroke="#0d0f14" stroke-linejoin="round"/>
    <rect x="15.5" y="6.5" width="17" height="11" fill="url(#xp-metal)" stroke="#59606b"/>
    <rect x="26" y="8.5" width="3.5" height="7" fill="#59606b"/>
    <rect x="12.5" y="24.5" width="23" height="17" rx="1" fill="#f5f6f8" stroke="#9aa2ad"/>
    <path d="M15.5 29h17M15.5 33h12" stroke="#7aa6e6" stroke-width="1.4"/>`,

  cd: `
    <circle cx="24" cy="24" r="19" fill="url(#xp-disc)" stroke="#7d8896"/>
    <circle cx="24" cy="24" r="6.5" fill="#fff" stroke="#9aa2ad"/>
    <circle cx="24" cy="24" r="2.6" fill="#dfe6ee" stroke="#9aa2ad"/>
    <path d="M24 8a16 16 0 0 1 14.6 9.5" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>`,

  textfile: doc('<path d="M15 17h17M15 21.5h17M15 26h17M15 30.5h11" stroke="#a9b6c8" stroke-width="1.6"/>'),

  wordfile: doc(`<path d="M15 17h17M15 21.5h17M15 26h12" stroke="#a9b6c8" stroke-width="1.6"/>
    <rect x="14.5" y="30.5" width="19" height="10" rx="2" fill="url(#xp-blue)" stroke="#1f4fae"/>
    <path d="M17.5 33l1.6 5 1.8-4.2 1.8 4.2 1.6-5M27 33.5h4M27 36.5h4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linejoin="round"/>`),

  mp3file: doc(`<circle cx="24" cy="27" r="9" fill="url(#xp-orange)" stroke="#b5510a"/>
    <path d="M26.5 21.5v8a2.2 2.2 0 1 1-1.4-2v-6.4z" fill="#fff"/>`),

  imagefile: doc(`<rect x="15.5" y="18.5" width="17" height="14" fill="url(#xp-screen)" stroke="#5a6779"/>
    <path d="M15.5 29c3.4-2.6 7-2.8 10.4-1.2s4.6.8 6.6-.6v5.3h-17z" fill="url(#xp-hill)"/>`),

  network: `
    <rect x="3.5" y="5.5" width="22" height="17" rx="2" fill="url(#xp-beige)" stroke="#7d7764"/>
    <rect x="6" y="8" width="17" height="11" fill="url(#xp-screen)"/>
    <rect x="22.5" y="20.5" width="22" height="17" rx="2" fill="url(#xp-beige)" stroke="#7d7764"/>
    <rect x="25" y="23" width="17" height="11" fill="url(#xp-screen)"/>
    <path d="M14 23v10h8M33 38v6" stroke="#3a6fd8" stroke-width="2.4" fill="none"/>`,

  volume: `
    <path d="M7 18h8l10-8.5v29L15 30H7z" fill="url(#xp-metal)" stroke="#5b6472" stroke-linejoin="round"/>
    <path d="M31 17a9 9 0 0 1 0 14M35.5 12.5a15 15 0 0 1 0 23" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,

  info: `
    <circle cx="24" cy="24" r="19" fill="url(#xp-blue)" stroke="#173f9a"/>
    <circle cx="24" cy="14.5" r="3" fill="#fff"/>
    <path d="M24 21.5v14" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    ${SHINE}`,

  warning: `
    <path d="M24 4.5L44.5 41h-41z" fill="url(#xp-gold)" stroke="#a87800" stroke-linejoin="round"/>
    <path d="M24 17v12" stroke="#2b2100" stroke-width="4.4" stroke-linecap="round"/>
    <circle cx="24" cy="35" r="2.6" fill="#2b2100"/>`,

  showdesk: `
    <rect x="4.5" y="9.5" width="39" height="29" rx="2" fill="url(#xp-screen)" stroke="#1f4fae"/>
    <path d="M5 31c9-6 18-7 27-3.4s9 1.6 11 .4v9.5H5z" fill="url(#xp-hill)"/>
    <rect x="9" y="14" width="13" height="9" rx="1" fill="#fff" stroke="#1f4fae"/>
    <path d="M9 15a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1.6H9z" fill="#2f6ee0"/>`,

  pencil: `
    <path d="M8 40l3-10 22-22 7 7-22 22z" fill="url(#xp-gold)" stroke="#8a6a12" stroke-linejoin="round"/>
    <path d="M8 40l3-10 7 7z" fill="#f4d7ae" stroke="#8a6a12" stroke-linejoin="round"/>
    <path d="M8 40l1.2-4 2.8 2.8z" fill="#3a2e1a"/>
    <path d="M30 11l7 7" stroke="#e8574b" stroke-width="4"/>`,

  // Navigation de l'Explorateur : grosses flèches vertes
  back: `
    <circle cx="24" cy="24" r="19.5" fill="url(#xp-green)" stroke="#2a7a1c"/>
    <path d="M27 13.5L16.5 24 27 34.5M17.5 24H34" fill="none" stroke="#fff" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${SHINE}`,

  forward: `
    <circle cx="24" cy="24" r="19.5" fill="url(#xp-green)" stroke="#2a7a1c"/>
    <path d="M21 13.5L31.5 24 21 34.5M30.5 24H14" fill="none" stroke="#fff" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${SHINE}`,

  up: folder(`<path d="M24 4.5l9 9h-5.5v8h-7v-8H15z" fill="url(#xp-green)" stroke="#2a7a1c" stroke-linejoin="round"/>`),

  go: `
    <rect x="4.5" y="4.5" width="39" height="39" rx="6" fill="url(#xp-green)" stroke="#2a7a1c"/>
    <path d="M12 24h20M25 15l9 9-9 9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="7" y="7" width="34" height="14" rx="5" fill="url(#xp-gloss)" opacity=".5"/>`,

  folders: `
    <rect x="4.5" y="6.5" width="20" height="16" rx="2" fill="url(#xp-folder-front)" stroke="#c08a26"/>
    <path d="M14.5 22.5v9h8M14.5 31.5v8h8" fill="none" stroke="#6b7480" stroke-width="2"/>
    <rect x="22.5" y="26.5" width="21" height="10" rx="2" fill="url(#xp-folder-front)" stroke="#c08a26"/>
    <rect x="22.5" y="36" width="21" height="9" rx="2" fill="url(#xp-folder-front)" stroke="#c08a26"/>`,

  views: `
    <rect x="5.5" y="6.5" width="15" height="15" rx="2" fill="url(#xp-blue)" stroke="#1f4fae"/>
    <rect x="27.5" y="6.5" width="15" height="15" rx="2" fill="url(#xp-blue)" stroke="#1f4fae"/>
    <rect x="5.5" y="27.5" width="15" height="15" rx="2" fill="url(#xp-blue)" stroke="#1f4fae"/>
    <rect x="27.5" y="27.5" width="15" height="15" rx="2" fill="url(#xp-blue)" stroke="#1f4fae"/>`,

  key: `
    <circle cx="16" cy="18" r="10.5" fill="url(#xp-gold)" stroke="#a87800"/>
    <circle cx="13.5" cy="15.5" r="3.4" fill="#fff" stroke="#a87800"/>
    <path d="M23 25l16 16M32 34l4-4M36 38l4-4" fill="none" stroke="#a87800" stroke-width="5" stroke-linecap="round"/>
    <path d="M23 25l16 16M32 34l4-4M36 38l4-4" fill="none" stroke="#ffd34a" stroke-width="2.6" stroke-linecap="round"/>`,
};

// Petits glyphes de la barre de mise en forme (repère 24 × 24 ; les émoticônes,
// clins d'œil et Wizz réutilisent les visages, voir tool())
const TOOLS = {
  font: `<text x="11" y="17" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="17" fill="#1d3f8f">A</text>
    <rect x="3" y="19" width="16" height="3" rx="1" fill="#e8262f"/>`,
  background:`<rect x="2.5" y="4.5" width="19" height="15" rx="1.5" fill="#fff" stroke="#5a6779"/>
    <rect x="4.5" y="6.5" width="15" height="11" fill="url(#xp-screen)"/>
    <path d="M4.5 15c3-2.2 6-2.4 9-1.1s4 .6 6-.6v4.2h-15z" fill="url(#xp-hill)"/>`,
  voice: `<rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="url(#xp-metal)" stroke="#5b6472"/>
    <path d="M5.5 10.5a6.5 6.5 0 0 0 13 0M12 17v4M8.5 21.5h7" fill="none" stroke="#5b6472" stroke-width="1.6" stroke-linecap="round"/>`,
};

// ——— Émoticônes animées (repère 20 × 20, toutes originales) ———

const FACE = (fill = 'smiley', stroke = '#a96300') =>
  `<circle cx="10" cy="10" r="8.6" fill="url(#xp-${fill})" stroke="${stroke}"/><ellipse cx="7.6" cy="5.4" rx="3.6" ry="1.9" fill="#fff" opacity=".6"/>`;
const EYES = (ry = 1.6, rx = 1.05) =>
  `<g class="xp-a-blink"><ellipse cx="7.2" cy="8" rx="${rx}" ry="${ry}" fill="#3d2406"/><ellipse cx="12.8" cy="8" rx="${rx}" ry="${ry}" fill="#3d2406"/></g>`;
const SMILE = '<path d="M5.7 11.4c2.3 3 6.3 3 8.6 0" fill="none" stroke="#6b3605" stroke-width="1.3" stroke-linecap="round"/>';
const BIG_MOUTH = `<path d="M4.8 10.9h10.4c0 3.3-2.5 5.5-5.2 5.5s-5.2-2.2-5.2-5.5z" fill="#7a2c00"/>
  <path d="M5.4 11.2h9.2c-.1.7-.3 1.3-.6 1.8H6c-.3-.5-.5-1.1-.6-1.8z" fill="#fff"/>
  <path d="M7.4 15.4c1.6.9 3.6.9 5.2 0-.8-.7-1.6-1-2.6-1s-1.8.3-2.6 1z" fill="#ff7c84"/>`;

export const SMILEYS = {
  smile: { label: 'Sourire', code: ':)', svg: FACE() + EYES() + SMILE },
  grin: {
    label: 'Rire',
    code: ':D',
    svg: `<g class="xp-a-bounce">${FACE()}<path d="M5.6 8.7c.7-1.7 2.6-1.7 3.2 0M11.2 8.7c.7-1.7 2.6-1.7 3.2 0" fill="none" stroke="#3d2406" stroke-width="1.25" stroke-linecap="round"/>${BIG_MOUTH}</g>`,
  },
  wink: {
    label: 'Clin d’œil',
    code: ';)',
    svg: `<g class="xp-a-tilt">${FACE()}<path d="M5.6 8.3c.9.9 2.4.9 3.3 0" fill="none" stroke="#3d2406" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="12.8" cy="8" rx="1.05" ry="1.6" fill="#3d2406"/>
      <path d="M6.2 12.2c2.2 2 5.6 1.8 7.8-.8" fill="none" stroke="#6b3605" stroke-width="1.3" stroke-linecap="round"/></g>`,
  },
  tongue: {
    label: 'Tire la langue',
    code: ':P',
    svg: `${FACE()}${EYES()}<path d="M6 11.6c2.6 1 5.4 1 8 0" fill="none" stroke="#6b3605" stroke-width="1.3" stroke-linecap="round"/>
      <path class="xp-a-wag" d="M8.3 12.2h3.6v2.3a1.8 1.8 0 0 1-3.6 0z" fill="#ff6d7f" stroke="#b8323f" stroke-width=".6"/>`,
  },
  cool: {
    label: 'Trop cool',
    code: '(H)',
    svg: `${FACE()}${SMILE}<path d="M3.4 6.9h13.2v1.2c0 2.2-1.5 3.4-3.3 3.4-1.7 0-2.7-1-3-2.5h-.6c-.3 1.5-1.3 2.5-3 2.5-1.8 0-3.3-1.2-3.3-3.4z" fill="#16181e"/>
      <path class="xp-a-glint" d="M5 7.6h1.5L4.9 10.8H3.4z" fill="#fff" opacity=".85"/>`,
  },
  laugh: {
    label: 'Mort de rire',
    code: 'xD',
    svg: `<g class="xp-a-shake">${FACE()}<path d="M5.2 6.5l2.9 1.7-2.9 1.7M14.8 6.5l-2.9 1.7 2.9 1.7" fill="none" stroke="#3d2406" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>${BIG_MOUTH}
      <path class="xp-a-tear" d="M3.4 9.6c.5.9.9 1.4.9 1.9a.9.9 0 0 1-1.8 0c0-.5.4-1 .9-1.9zM16.6 9.6c.5.9.9 1.4.9 1.9a.9.9 0 0 1-1.8 0c0-.5.4-1 .9-1.9z" fill="#5fb4ff"/></g>`,
  },
  sad: {
    label: 'Triste',
    code: ':(',
    svg: `${FACE()}${EYES()}<path d="M6.2 14.4c2.2-2.4 5.4-2.4 7.6 0" fill="none" stroke="#6b3605" stroke-width="1.3" stroke-linecap="round"/>
      <path class="xp-a-drop" d="M13.7 9.8c.6 1 1 1.6 1 2.1a1 1 0 0 1-2 0c0-.5.4-1.1 1-2.1z" fill="#5fb4ff"/>`,
  },
  surprised: {
    label: 'Surpris',
    code: ':O',
    svg: `${FACE()}${EYES(1.9, 1.3)}<ellipse class="xp-a-pulse" cx="10" cy="13.4" rx="1.9" ry="2.3" fill="#7a2c00"/>`,
  },
  heart: {
    label: 'Cœur',
    code: '(L)',
    svg: `<g class="xp-a-beat"><path d="M10 17.6S2.4 12.8 2.4 7.4A4.1 4.1 0 0 1 10 5.2a4.1 4.1 0 0 1 7.6 2.2c0 5.4-7.6 10.2-7.6 10.2z" fill="url(#xp-heart)" stroke="#8c0b1d"/>
      <ellipse cx="6.3" cy="7" rx="2" ry="1.2" fill="#fff" opacity=".65" transform="rotate(-30 6.3 7)"/></g>`,
  },
  angry: {
    label: 'En colère',
    code: ':@',
    svg: `<g class="xp-a-shake">${FACE('angry', '#9a2010')}<path d="M4.8 6l3.6 1.5M15.2 6l-3.6 1.5" stroke="#3d1206" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="7.2" cy="9" rx="1" ry="1.3" fill="#3d1206"/><ellipse cx="12.8" cy="9" rx="1" ry="1.3" fill="#3d1206"/>
      <path d="M6.4 14.4c2.2-1.8 5-1.8 7.2 0" fill="none" stroke="#5a1406" stroke-width="1.3" stroke-linecap="round"/></g>`,
  },
  blush: {
    label: 'Gêné',
    code: ':$',
    svg: `${FACE()}<ellipse cx="7.2" cy="8.6" rx="1" ry="1.3" fill="#3d2406"/><ellipse cx="12.8" cy="8.6" rx="1" ry="1.3" fill="#3d2406"/>
      <path d="M7.6 13c1.6.9 3.2.9 4.8 0" fill="none" stroke="#6b3605" stroke-width="1.2" stroke-linecap="round"/>
      <g class="xp-a-blush"><ellipse cx="4.9" cy="11.4" rx="1.9" ry="1.1" fill="#ff5f7e" opacity=".75"/><ellipse cx="15.1" cy="11.4" rx="1.9" ry="1.1" fill="#ff5f7e" opacity=".75"/></g>`,
  },
  sleepy: {
    label: 'Endormi',
    code: '|-)',
    svg: `${FACE()}<path d="M5.4 8.6c.8.7 2.4.7 3.2 0M11.4 8.6c.8.7 2.4.7 3.2 0" fill="none" stroke="#3d2406" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="10" cy="13.4" rx="1.4" ry="1.1" fill="#7a2c00"/>
      <text class="xp-a-z" x="14.6" y="5.4" font-size="5.5" font-weight="700" font-family="Tahoma, Verdana, sans-serif" fill="#2b5fd0">z</text>`,
  },
};

// Codes d'époque reconnus dans les messages (et les pseudos, comme à l'époque)
const CODES = {
  ':)': 'smile',
  ':-)': 'smile',
  ':D': 'grin',
  ':-D': 'grin',
  ':d': 'grin',
  ';)': 'wink',
  ';-)': 'wink',
  ':P': 'tongue',
  ':p': 'tongue',
  ':-P': 'tongue',
  ':-p': 'tongue',
  '(H)': 'cool',
  '(h)': 'cool',
  xD: 'laugh',
  XD: 'laugh',
  ':(': 'sad',
  ':-(': 'sad',
  ':O': 'surprised',
  ':o': 'surprised',
  ':-O': 'surprised',
  '(L)': 'heart',
  '(l)': 'heart',
  '&lt;3': 'heart',
  ':@': 'angry',
  ':$': 'blush',
  '|-)': 'sleepy',
  '(zz)': 'sleepy',
};

const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CODE_RE = new RegExp(
  `(^|\\s)(${Object.keys(CODES)
    .sort((a, b) => b.length - a.length)
    .map(reEscape)
    .join('|')})(?=$|[\\s.,!?])`,
  'g',
);

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function smiley(kind, size = 19) {
  const s = SMILEYS[kind];
  return `<svg class="xp-emo xp-emo-${kind}" viewBox="0 0 20 20" width="${size}" height="${size}" role="img" aria-label="${esc(s.code)}">${s.svg}</svg>`;
}

// Texte brut → HTML échappé, émoticônes remplacées par leur dessin animé
export function emotify(text, size = 19) {
  return esc(text).replace(CODE_RE, (_, before, code) => `${before}${smiley(CODES[code], size)}`);
}

// ——— Avatars des comptes (repère 48 × 48) ———

const AVATARS = {
  // Voyageur : un canard en caoutchouc
  duck: `
    <rect width="48" height="48" fill="url(#xp-av-water)"/>
    <ellipse cx="30" cy="8" rx="22" ry="9" fill="#fff" opacity=".35"/>
    <path d="M0 33.5c4-1.6 8-1.6 12 0s8 1.6 12 0 8-1.6 12 0 8 1.6 12 0V48H0z" fill="#2f8fd6" opacity=".45"/>
    <ellipse cx="24" cy="37.6" rx="15" ry="2.6" fill="#1f6fb2" opacity=".35"/>
    <path d="M10 30.5c0-5.4 4.6-8.6 10.2-8.2 3.1.2 4.7 1.6 6.9 1.6 3.6 0 5.6-3.4 9.3-3.6 2.2-.1 3.3 1.5 2.6 3.6-.9 2.8-1.7 6.6-5 9.3-3 2.4-7.3 3.6-12.3 3.6-6.7 0-11.7-2.5-11.7-6.3z" fill="url(#xp-av-duck)" stroke="#c98500" stroke-width=".8"/>
    <path d="M19.5 28.2c2.8-2.2 7.6-2.4 10.6-.5-1.4 2.9-5.8 4.3-9.8 3.4" fill="#f5b400" stroke="#c98500" stroke-width=".7" stroke-linejoin="round"/>
    <ellipse cx="25" cy="25.4" rx="4.5" ry="1.3" fill="#fff" opacity=".45"/>
    <circle cx="16" cy="17" r="7.6" fill="url(#xp-av-duck)" stroke="#c98500" stroke-width=".8"/>
    <path d="M9.2 16.6c-2.4-.3-4.6.3-5.8 1.5 1.5 1.4 4.3 1.9 6.7 1.2" fill="url(#xp-av-beak)" stroke="#b44f00" stroke-width=".6" stroke-linejoin="round"/>
    <path d="M3.8 18.3c1.7.6 3.8.7 6 .2" stroke="#b44f00" stroke-width=".6" fill="none"/>
    <circle cx="13.7" cy="15.1" r="1.8" fill="#161616"/>
    <circle cx="13.1" cy="14.5" r=".65" fill="#fff"/>
    <ellipse cx="18.2" cy="19.6" rx="1.9" ry="1.1" fill="#ff8f2e" opacity=".4"/>
    <ellipse cx="18.2" cy="12.4" rx="3.4" ry="1.7" fill="#fff" opacity=".65"/>
    <path d="M4 41.5c2.4-.9 4.8-.9 7.2 0M30 43.5c2.4-.9 4.8-.9 7.2 0M16 46c2.4-.9 4.8-.9 7.2 0" stroke="#fff" stroke-opacity=".75" stroke-linecap="round" fill="none"/>`,

  // Kev1n : une guitare sous les projecteurs
  guitar: `
    <rect width="48" height="48" fill="url(#xp-av-night)"/>
    <circle cx="30" cy="15" r="22" fill="url(#xp-av-spot)"/>
    <path d="M7.5 9.5v6.6a1.8 1.8 0 1 1-1-1.6V8.7l5.2-1.3v6.9a1.8 1.8 0 1 1-1-1.6V8.7z" fill="#fff" opacity=".55"/>
    <circle cx="40" cy="38" r="1" fill="#fff" opacity=".7"/><circle cx="35" cy="44" r=".7" fill="#fff" opacity=".6"/>
    <circle cx="6" cy="30" r=".8" fill="#fff" opacity=".6"/>
    <g transform="translate(-1 2) rotate(38 24 27)">
      <rect x="22.2" y="-7" width="3.6" height="21" fill="url(#xp-av-wood)"/>
      <path d="M21 -13.5h6l.7 7.2h-7.4z" fill="#3a1e0c"/>
      <circle cx="20.2" cy="-11.6" r=".9" fill="#ececec"/><circle cx="20.2" cy="-8.4" r=".9" fill="#ececec"/>
      <circle cx="27.8" cy="-11.6" r=".9" fill="#ececec"/><circle cx="27.8" cy="-8.4" r=".9" fill="#ececec"/>
      <path d="M22.2 -2.5h3.6M22.2 1.5h3.6M22.2 5h3.6M22.2 8.3h3.6" stroke="#ead9ab" stroke-width=".5"/>
      <path d="M24 10.5c4.8 0 7.5 3.5 7.5 8 0 3.5-2.1 5.1-2.1 7.7 0 1.8 5.1 3.3 5.1 8.8 0 6-5 9.5-10.5 9.5s-10.5-3.5-10.5-9.5c0-5.5 5.1-7 5.1-8.8 0-2.6-2.1-4.2-2.1-7.7 0-4.5 2.7-8 7.5-8z" fill="url(#xp-av-burst)" stroke="#3b0e03" stroke-width=".9"/>
      <circle cx="24" cy="24" r="3.4" fill="#2a0b02" stroke="#ffe3a0" stroke-width=".8"/>
      <rect x="20" y="35.5" width="8" height="1.9" rx=".6" fill="#2a0b02"/>
      <path d="M23 -6.5v42.6M24 -6.5v42.6M25 -6.5v42.6" stroke="#fbf6ea" stroke-width=".3"/>
      <ellipse cx="19.6" cy="31" rx="2.6" ry="5.6" fill="#fff" opacity=".25" transform="rotate(-18 19.6 31)"/>
    </g>`,

  // Invité : un cavalier d'échecs
  knight: `
    <rect width="48" height="48" fill="url(#xp-av-felt)"/>
    <circle cx="16" cy="12" r="20" fill="url(#xp-av-spot)"/>
    <path d="M0 40h8v8H0zM16 40h8v8h-8zM32 40h8v8h-8z" fill="#155a32" opacity=".35"/>
    <ellipse cx="24" cy="43.4" rx="14" ry="2.2" fill="#0b3b20" opacity=".45"/>
    <path d="M12.5 43.5h23a1.5 1.5 0 0 0 1.5-1.5v-.8a3.2 3.2 0 0 0-3.2-3.2H14.2a3.2 3.2 0 0 0-3.2 3.2v.8a1.5 1.5 0 0 0 1.5 1.5z" fill="url(#xp-av-knight)"/>
    <rect x="15" y="35" width="18" height="3.4" rx="1.5" fill="url(#xp-av-knight)"/>
    <path d="M17.2 35c0-4.4 2.7-6.6 4-9.4-2.3.7-5.3 1.6-7.4 1.1-1.9-.5-2.6-2.4-1.5-4 1.6-2.1 4.4-4.5 5.8-7.4 1-2.1 2.2-4.6 4.3-5.6l-.5-2.7 3.3 2.2C31.4 9.4 35.2 15 35.2 23c0 4.9-1.9 8.4-2.9 12z" fill="url(#xp-av-knight)"/>
    <circle cx="22.4" cy="15.4" r="1.15" fill="#d7deea"/>
    <circle cx="13.9" cy="24.3" r=".6" fill="#8d95a8"/>
    <path d="M28.5 11.5c2.6 2 4.4 5.4 4.8 9.6M30.6 27c.9-2.2 1.3-4.4 1.1-6.8" stroke="#8d95a8" stroke-width=".8" fill="none" stroke-linecap="round"/>
    <path d="M18.4 14.4c1.2-2.4 2.4-4.4 4.2-5.2M13.6 23.2c1.6-1.6 3.2-3 4.6-4.6" stroke="#fff" stroke-opacity=".5" stroke-width="1" fill="none" stroke-linecap="round"/>
    <path d="M15.8 36.2h16" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/>`,
};

// ——— Fabriques ———

export const icon = (name, size = 32, cls = '') =>
  `<svg class="xp-ic ${cls}" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

export function tool(name, size = 20) {
  if (name === 'emoticons') {
    return `<svg class="xp-ic" viewBox="0 0 26 20" width="${(size * 26) / 20}" height="${size}" aria-hidden="true" focusable="false">${SMILEYS.smile.svg}<path d="M21 9h4l-2 2.6z" fill="#3c4c66"/></svg>`;
  }
  if (name === 'winks') {
    return `<svg class="xp-ic" viewBox="0 0 22 20" width="${(size * 22) / 20}" height="${size}" aria-hidden="true" focusable="false">${SMILEYS.wink.svg}<path d="M18.5 1l.9 2.2 2.3.4-1.8 1.4.5 2.3-1.9-1.2-2 1.2.6-2.3-1.8-1.4 2.3-.4z" fill="#ffd21f" stroke="#c48a00" stroke-width=".5"/></svg>`;
  }
  if (name === 'wizz') {
    return `<svg class="xp-ic xp-wizz-ic" viewBox="0 0 26 20" width="${(size * 26) / 20}" height="${size}" aria-hidden="true" focusable="false">
      <g transform="translate(3 0)"><g class="xp-wizz-face">${FACE()}${EYES(1.9, 1.3)}<ellipse cx="10" cy="13.6" rx="1.8" ry="2.1" fill="#7a2c00"/></g></g>
      <path d="M2.2 5.5l1.4 1.8-1.4 1.8 1.4 1.8-1.4 1.8 1.4 1.8M23.8 5.5l-1.4 1.8 1.4 1.8-1.4 1.8 1.4 1.8-1.4 1.8" fill="none" stroke="#e4572e" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  return `<svg class="xp-ic" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false">${TOOLS[name]}</svg>`;
}

export const avatar = (name, size = 48) =>
  `<svg class="xp-av" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" focusable="false">${AVATARS[name]}</svg>`;

// Pastille d'état de la messagerie (repère 16 × 16)
export function status(kind, size = 14) {
  const fill = { online: 'st-online', away: 'st-away', busy: 'st-busy', offline: 'st-off' }[kind];
  const stroke = { online: '#2b7f1e', away: '#b05a00', busy: '#9a1d0c', offline: '#858c96' }[kind];
  const mark = {
    online: '',
    away: '<path d="M8 4.6V8l2.2 1.3" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    busy: '<path d="M5 8h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
    offline: '',
  }[kind];
  return `<svg class="xp-st xp-st-${kind}" viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="6.4" fill="url(#xp-${fill})" stroke="${stroke}"/>${mark}
    <ellipse cx="8" cy="5.2" rx="3.6" ry="1.9" fill="#fff" opacity=".55"/></svg>`;
}

// ——— Fond d'écran original : ciel, nuages et collines (aucune photo) ———

export function wallpaper() {
  const front = 'M-20 732C150 668 320 606 512 570c120-22 228-24 318-10 78 12 140 32 214 54V788H-20z';
  // Un cumulus : une base, des bourgeons, un dessous ombré et un reflet
  const cloud = (x, y, w, puffs, o = 1) => `<g opacity="${o}">
<g filter="url(#puff)" fill="#fff"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.17}"/>${puffs
    .map(([dx, dy, r]) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r}"/>`)
    .join('')}</g>
<ellipse cx="${x}" cy="${y + w * 0.08}" rx="${w * 0.9}" ry="${w * 0.07}" fill="#a9c2e6" opacity=".55" filter="url(#puff)"/>
<circle cx="${x + puffs[1][0] - 6}" cy="${y + puffs[1][1] - 8}" r="${puffs[1][2] * 0.5}" fill="#fff" filter="url(#puff)"/></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1650c4"/><stop offset=".28" stop-color="#2f74de"/><stop offset=".52" stop-color="#62a3ec"/><stop offset=".7" stop-color="#b3d8f7"/><stop offset=".76" stop-color="#d9ecfb"/></linearGradient>
<radialGradient id="glow" cx="840" cy="70" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffbe8" stop-opacity=".7"/><stop offset=".25" stop-color="#fff6d6" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="sun" cx="840" cy="70" r="46" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#fffbe6" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc8a4"/><stop offset="1" stop-color="#5d9a62"/></linearGradient>
<linearGradient id="mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa83c"/><stop offset="1" stop-color="#2b7222"/></linearGradient>
<linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6dc4e"/><stop offset=".3" stop-color="#72be36"/><stop offset=".7" stop-color="#3f9426"/><stop offset="1" stop-color="#2a731b"/></linearGradient>
<radialGradient id="lit" cx="690" cy="540" r="460" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#efffa6" stop-opacity=".6"/><stop offset=".55" stop-color="#d8f58a" stop-opacity=".12"/><stop offset="1" stop-color="#d8f58a" stop-opacity="0"/></radialGradient>
<linearGradient id="rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4ffb8" stop-opacity="0"/><stop offset=".55" stop-color="#f4ffb8" stop-opacity=".9"/><stop offset=".9" stop-color="#f4ffb8" stop-opacity=".2"/></linearGradient>
<filter id="puff" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="streak" x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="haze" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8 .045" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 .12  0 0 0 0 .32  0 0 0 0 .05  0 0 0 1.6 -.85"/></filter>
<clipPath id="fc"><path d="${front}"/></clipPath>
</defs>
<rect width="1024" height="768" fill="url(#sky)"/>
<rect width="1024" height="768" fill="url(#glow)"/>
<circle cx="840" cy="70" r="46" fill="url(#sun)"/>
<g filter="url(#streak)" fill="#fff" opacity=".42">
<ellipse cx="420" cy="58" rx="210" ry="4.5" transform="rotate(-5 420 58)"/><ellipse cx="880" cy="214" rx="130" ry="3.5" transform="rotate(4 880 214)"/>
<ellipse cx="70" cy="250" rx="110" ry="3.5" transform="rotate(-3 70 250)"/><ellipse cx="560" cy="250" rx="90" ry="3" transform="rotate(2 560 250)"/>
</g>
${cloud(212, 170, 118, [[-60, -8, 28], [-18, -26, 42], [32, -30, 38], [72, -12, 28], [-90, 0, 18]])}
${cloud(646, 114, 138, [[-66, -6, 26], [-22, -24, 38], [28, -28, 36], [70, -12, 26], [104, -2, 16]], 0.95)}
${cloud(892, 312, 70, [[-30, -4, 13], [-6, -13, 19], [20, -11, 16], [42, -2, 10]], 0.75)}
${cloud(440, 302, 84, [[-34, -3, 11], [-8, -10, 16], [18, -9, 14], [44, -1, 9]], 0.6)}
<g filter="url(#streak)" fill="#fff" opacity=".5"><ellipse cx="110" cy="392" rx="170" ry="9"/><ellipse cx="700" cy="400" rx="120" ry="7"/></g>
<path d="M-30 556C130 520 290 506 430 526s250 34 380 20 190-30 244-28V788H-30z" fill="url(#far)" filter="url(#haze)"/>
<path d="M-20 600C90 562 210 552 320 572c90 16 150 44 210 76V788H-20z" fill="url(#mid)"/>
<path d="${front}" fill="url(#front)"/>
<path d="${front}" fill="url(#lit)"/>
<rect width="1024" height="768" filter="url(#grain)" clip-path="url(#fc)" opacity=".55"/>
<path d="M300 640C370 612 440 588 512 572c120-24 228-26 318-12" fill="none" stroke="url(#rim)" stroke-width="3" filter="url(#haze)"/>
</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
