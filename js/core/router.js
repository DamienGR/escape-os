// Routeur : charge chaque écran à la demande (import() + CSS de l'époque),
// le monte dans le cadre avec son contexte, et enchaîne fiche puis saut.

import { ERAS } from '../data/eras.js';
import { state, save, eraStats, addNote, hasNote } from './state.js';
import { audio } from './audio.js';
import * as stage from './stage.js';
import * as hud from './hud.js';
import { createHints } from './hints.js';
import { timeJump, intro } from './jump.js';

const params = new URLSearchParams(location.search);
export const DEBUG = params.has('debug');

const cssCache = new Map();
const modCache = new Map();
const listeners = new Set();

let active = null;
let busy = false;

export const isBusy = () => busy;
export const activeEra = () => active;
export const onChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const notify = () => listeners.forEach((fn) => fn(active));

function loadCss(href) {
  if (!cssCache.has(href)) {
    cssCache.set(
      href,
      new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.append(link);
      }),
    );
  }
  return cssCache.get(href);
}

// Polices d'époque préchargées avec le module, pendant le saut
const FONTS = {
  cards: ['16px "Courier Prime"', 'bold 16px "Courier Prime"'],
  unix: ['16px "Courier Prime"', 'bold 16px "Courier Prime"'],
  dos: ['16px "IBM VGA"'],
  win31: ['16px "IBM VGA"'],
};

export function load(era) {
  for (const font of FONTS[era.id] ?? []) document.fonts?.load(font).catch(() => {});
  if (!modCache.has(era.id)) {
    const promise = Promise.all([import(`../screens/${era.file}`), loadCss(`css/eras/${era.id}.css`)]).then(
      ([mod]) => mod.default,
    );
    promise.catch(() => modCache.delete(era.id));
    modCache.set(era.id, promise);
  }
  return modCache.get(era.id);
}

function preloadNext(index) {
  const next = ERAS[index + 1];
  if (!next) return;
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1200));
  idle(() => load(next).catch(() => {}));
}

const abortError = () => new DOMException('Écran démonté', 'AbortError');
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

// ——— Contexte fourni à chaque écran ———

function createContext(era, index) {
  const abort = new AbortController();
  const { signal } = abort;
  const timers = new Set();
  const skippable = new Set();
  const els = stage.stageEls();

  const engine = createHints(era, {
    onSuggest: () => hud.suggestHint(),
    onChange: () => hud.renderHints(),
    touch: isTouch,
  });

  // Un clic ou une touche accélère les séquences de démarrage.
  const skip = () => skippable.forEach((fn) => fn());
  els.root.addEventListener('pointerdown', skip, { signal });
  window.addEventListener('keydown', skip, { signal });

  const ctx = {
    era,
    index,
    debug: DEBUG,
    signal,
    audio,
    root: els.screen,
    props: { side: els.sideProps, bezel: els.bezelProps },
    get touch() {
      return isTouch();
    },
    get geometry() {
      return stage.currentGeometry();
    },
    get scale() {
      return stage.currentGeometry()?.scale ?? 1;
    },
    hints: {
      get level() {
        return engine.level;
      },
      reveal: () => engine.reveal(),
      onReveal: (fn) => {
        const off = engine.onReveal(fn);
        signal.addEventListener('abort', off);
        return off;
      },
    },
    complete: () => complete(index),
    progress: () => engine.progress(),
    error: () => engine.error(),
    note(text, { key, label } = {}) {
      const added = addNote({ key, label, text, era: era.id });
      if (added) {
        audio.note();
        hud.refreshNotebook(state.notes.at(-1));
        hud.toast(`Noté dans le carnet : ${label ? `${label} — ` : ''}${text}`, { icon: 'notebook' });
      }
      return added;
    },
    hasNote,
    toast: (text, opts) => hud.toast(text, opts),
    // Attente annulée au démontage ; skippable : un clic l'écourte.
    wait(ms, { skippable: canSkip = false } = {}) {
      return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(abortError());
        const done = () => {
          clearTimeout(timer);
          timers.delete(timer);
          skippable.delete(done);
          signal.removeEventListener('abort', onAbort);
          resolve();
        };
        const onAbort = () => {
          clearTimeout(timer);
          skippable.delete(done);
          reject(abortError());
        };
        const timer = setTimeout(done, ms);
        timers.add(timer);
        if (canSkip) skippable.add(done);
        signal.addEventListener('abort', onAbort, { once: true });
      });
    },
    timeout(fn, ms) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!signal.aborted) fn();
      }, ms);
      timers.add(timer);
      return timer;
    },
    interval(fn, ms) {
      const timer = setInterval(() => !signal.aborted && fn(), ms);
      signal.addEventListener('abort', () => clearInterval(timer));
      return timer;
    },
    clear(timer) {
      clearTimeout(timer);
      clearInterval(timer);
      timers.delete(timer);
    },
    on(target, type, fn, options = {}) {
      target.addEventListener(type, fn, { ...options, signal });
    },
    onResize(fn) {
      const off = stage.onResize(fn);
      signal.addEventListener('abort', off);
      return off;
    },
    onHardware(name, fn) {
      const off = stage.onHardware(name, fn);
      signal.addEventListener('abort', off);
      return off;
    },
  };

  const dispose = () => {
    abort.abort();
    engine.stop();
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  };

  return { ctx, engine, dispose };
}

// ——— Montage ———

function clearScreen() {
  const els = stage.stageEls();
  els.screen.innerHTML = '';
  els.screen.className = 'screen';
  els.screen.removeAttribute('style');
  els.sideProps.innerHTML = '';
  els.bezelProps.innerHTML = '';
  stage.layout();
}

function unmount() {
  if (!active) return;
  try {
    active.cleanup?.();
  } catch (error) {
    console.error(error);
  }
  active.dispose();
  active = null;
  clearScreen();
}

function mount(index, mod) {
  const era = ERAS[index];
  const els = stage.stageEls();
  unmount();
  clearScreen();
  els.screen.classList.add(`screen-${era.id}`);
  const { ctx, engine, dispose } = createContext(era, index);
  state.screen = index;
  state.reached = Math.max(state.reached, index);
  if (index === ERAS.length - 1) state.finished = true;
  save();
  hud.setEra(era, index);
  hud.setHints(engine);
  let cleanup;
  try {
    mod.decor?.(ctx.props, ctx);
    els.sideProps.classList.remove('enter');
    void els.sideProps.offsetWidth;
    els.sideProps.classList.add('enter');
    cleanup = mod.mount(els.screen, ctx);
  } catch (error) {
    console.error(error);
    els.screen.innerHTML = `<div class="screen-error">Oups : cet écran n’a pas pu démarrer.<br><small>${String(
      error.message,
    )}</small></div>`;
  }
  active = { index, era, ctx, engine, dispose, cleanup };
  preloadNext(index);
  notify();
}

// ——— Navigation ———

// mode : 'jump' (saut complet), 'intro' (ouverture de partie), 'direct' (sans animation)
export async function goTo(index, { mode = 'jump' } = {}) {
  if (busy || !ERAS[index]) return;
  busy = true;
  hud.lock(true);
  hud.closePanels();
  const to = ERAS[index];
  const from = active?.era ?? to;
  const prepare = load(to);
  try {
    if (mode === 'intro') {
      unmount();
      await intro({ to, prepare, mount: async () => mount(index, await prepare) });
    } else if (mode === 'jump' && active) {
      await timeJump({ from, to, prepare, unmount, mount: async () => mount(index, await prepare) });
    } else {
      unmount();
      stage.setOff(true);
      stage.setEra(to);
      const mod = await prepare;
      mount(index, mod);
      audio.crtOn();
      await stage.powerOn();
    }
  } catch (error) {
    console.error(error);
    hud.toast('Impossible de charger cette époque. Vérifie ta connexion puis réessaie.');
  } finally {
    busy = false;
    hud.lock(false);
    hud.updateTimeline();
    notify();
  }
}

async function complete(index) {
  if (busy || active?.index !== index) return;
  const era = ERAS[index];
  const next = ERAS[index + 1];
  eraStats(era.id).done = true;
  save();
  active.engine.stop();
  hud.updateTimeline();
  if (!next) return;
  busy = true;
  hud.lock(true);
  hud.closePanels();
  try {
    await hud.showFact(era, next);
  } finally {
    busy = false;
  }
  await goTo(index + 1);
}

export function completeActive() {
  if (active) complete(active.index);
}

export function stopActive() {
  unmount();
}
