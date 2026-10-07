// Icônes au trait de l'écran 2026, même grammaire que le HUD : grille de 24,
// trait de 1,8, bouts arrondis. Un pictogramme par geste du voyage.

const PATHS = {
  // Les gestes, un par époque
  cards:
    '<path d="M7.5 5H19a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5V9Z"/><path d="M8 10.5v1.6M11 13.5v1.6M14 10.5v1.6M17 12v1.6"/>',
  unix: '<path d="m4.5 8.5 3.5 3.5-3.5 3.5"/><path d="M12 5v14"/><path d="m15.5 8.5 3.5 3.5-3.5 3.5"/>',
  dos: '<path d="M6 4h10l3.5 3.5v11A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4Z"/><path d="M8.5 4v4.5h6.5V4"/><path d="M8 20v-5.5h8V20"/>',
  win31: '<path d="m10 10 9.5 3.8-4.1 1.5-1.6 4.2Z"/><path d="M6.6 6.6 5 5M10 5.4V3.2M5.4 10H3.2M13.3 6.7l1.5-1.5M6.7 13.3l-1.5 1.5"/>',
  win95: '<path d="M12 3.5V11"/><path d="M7.4 6.4a7.5 7.5 0 1 0 9.2 0"/>',
  win98:
    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5Z"/>',
  xp: '<path d="M8.2 5.5h7.6a2.2 2.2 0 0 1 2.2 2.2v5.6a2.2 2.2 0 0 1-2.2 2.2H12l-3.6 3v-3h-.2A2.2 2.2 0 0 1 6 13.3V7.7a2.2 2.2 0 0 1 2.2-2.2Z"/><path d="M2.8 8.5v4M21.2 8.5v4"/>',
  ubuntu: '<circle cx="8" cy="15.5" r="3.8"/><path d="M10.7 12.8 19 4.5"/><path d="m16 7.5 2.4 2.4M13.8 9.7l1.8 1.8"/>',
  phone: '<path d="m14 10 5.5-5.5"/><path d="M15 4.5h4.5V9"/><path d="m10 14-5.5 5.5"/><path d="M9 19.5H4.5V15"/>',
  agent:
    '<path d="M11 5.5c.8 4.5 2.5 6.2 7 7-4.5.8-6.2 2.5-7 7-.8-4.5-2.5-6.2-7-7 4.5-.8 6.2-2.5 7-7Z"/><path d="M18.5 2.8c.3 1.4.8 2 2.2 2.2-1.4.3-2 .8-2.2 2.2-.3-1.4-.8-2-2.2-2.2 1.4-.3 2-.8 2.2-2.2Z"/>',

  // Interface
  send: '<path d="M12 19V5.5"/><path d="m6.5 11 5.5-5.5 5.5 5.5"/>',
  down: '<path d="M12 5v13.5"/><path d="m6.5 13 5.5 5.5 5.5-5.5"/>',
  replay: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5"/>',
  sheet:
    '<path d="M7 3.5h7l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z"/><path d="M14 3.5V8h4.5"/><path d="M8.5 12.5h7M8.5 16h5"/>',
  share:
    '<path d="M12 3.5v11"/><path d="m8 7.5 4-4 4 4"/><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16"/>',

  // Emblèmes des titres
  guru: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 10.5h4v3h-4z"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
  archaeo: '<path d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z"/><path d="m3.5 12 8.5 4.5 8.5-4.5"/><path d="m3.5 16 8.5 4.5 8.5-4.5"/>',
  tourist: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2-6-2Z"/><path d="M9 4.5v13M15 6.5v13"/>',
  visitor: '<path d="M13.5 3.5 6 13.5h5.5l-1 7 7.5-10h-5.5l1-7Z"/>',
};

export const svg = (name, cls = '') =>
  `<svg class="ag-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] ?? ''}</svg>`;
