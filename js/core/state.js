// État unique du jeu : écran courant, carnet, chrono, indices et erreurs par écran.
// Sauvegardé dans localStorage à chaque changement.

const KEY = 'escape-os:v1';
const listeners = new Set();

function fresh() {
  return {
    v: 1,
    screen: 0, // écran courant
    reached: 0, // époque la plus lointaine atteinte
    started: false,
    finished: false,
    visit: false, // le mode visite a servi : partie non classée
    elapsed: 0, // temps de jeu actif, en ms
    notes: [], // { key, label, text, era, at }
    stats: {}, // { [eraId]: { hints, errors, time, done } }
    sound: true,
  };
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data && data.v === 1) return { ...fresh(), ...data };
  } catch {
    // stockage indisponible ou corrompu : on repart de zéro
  }
  return fresh();
}

export const state = load();

let saveTimer = 0;
export function save(now = false) {
  clearTimeout(saveTimer);
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // navigation privée stricte : le jeu reste jouable sans sauvegarde
    }
  };
  if (now) write();
  else saveTimer = setTimeout(write, 250);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(type, detail) {
  for (const fn of listeners) fn(type, detail);
}

export function eraStats(id) {
  state.stats[id] ??= { hints: 0, errors: 0, time: 0, done: false };
  return state.stats[id];
}

export function hasNote(key) {
  return state.notes.some((note) => note.key === key);
}

// Ajoute une note au carnet ; renvoie false si elle y était déjà.
export function addNote({ key, label, text, era }) {
  key ??= text;
  if (hasNote(key)) return false;
  state.notes.push({ key, label, text, era, at: Date.now() });
  save();
  emit('note', state.notes.at(-1));
  return true;
}

export function totals() {
  let hints = 0;
  let errors = 0;
  for (const s of Object.values(state.stats)) {
    hints += s.hints;
    errors += s.errors;
  }
  return { hints, errors, time: state.elapsed };
}

export function resetState() {
  const { sound } = state;
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, fresh(), { sound });
  save(true);
  emit('reset');
}

export function hasProgress() {
  return state.started && (state.screen > 0 || state.notes.length > 0 || state.elapsed > 5000);
}

export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
