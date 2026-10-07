// Démarrage : écran titre, paramètres ?screen= et ?debug, chrono, menu.

import { ERAS } from './data/eras.js';
import { SOLUTIONS } from './data/facts.js';
import { state, save, eraStats, hasProgress, resetState } from './core/state.js';
import { audio } from './core/audio.js';
import * as stage from './core/stage.js';
import * as hud from './core/hud.js';
import * as router from './core/router.js';

const params = new URLSearchParams(location.search);
const LAST = ERAS.length - 1;
const clampIndex = (n) => Math.min(LAST, Math.max(0, Number.isFinite(n) ? Math.trunc(n) : 0));
const label = (era) => (era.label === String(era.year) ? String(era.year) : era.label);

// Un écran démonté peut laisser une attente en suspens : ce n'est pas une erreur.
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError') event.preventDefault();
});

// L'audio se débloque au premier geste.
const unlockAudio = () => audio.unlock();
window.addEventListener('pointerdown', unlockAudio, true);
window.addEventListener('keydown', unlockAudio, true);

audio.setEnabled(state.sound);
stage.initStage(document.getElementById('stage'));
hud.initHud({ onNavigate: navigate, onSound: toggleSound, onMenu: menu });
hud.setVisible(false);

// Avant la partie, le cadre attend en 2026, écran éteint.
stage.setEra(ERAS[LAST]);
stage.setOff(true);

// ——— Chrono : temps de jeu actif ———

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const delta = Math.min(now - last, 2000);
  last = now;
  const active = router.activeEra();
  if (!active || active.index === LAST || document.hidden || router.isBusy()) return;
  state.elapsed += delta;
  eraStats(active.era.id).time += delta;
  hud.setChrono(state.elapsed);
  save();
}, 1000);

document.addEventListener('visibilitychange', () => document.hidden && save(true));
window.addEventListener('pagehide', () => save(true));

// ——— Écran titre ———

const title = document.getElementById('title');

function refreshTitle() {
  const progress = hasProgress() && !state.finished;
  const era = ERAS[state.screen] ?? ERAS[0];
  title.querySelector('[data-title="continue"]').hidden = !progress;
  title.querySelector('[data-title="continue"] span').textContent = label(era);
  title.querySelector('[data-title="new"]').hidden = !progress && !state.finished;
  title.querySelector('.power-label').textContent = progress ? `Appuyer pour reprendre en ${label(era)}` : 'Appuyer pour allumer';
}

function showTitle() {
  router.stopActive();
  stage.setEra(ERAS[LAST]);
  stage.setOff(true);
  hud.setVisible(false);
  hud.closePanels();
  refreshTitle();
  title.hidden = false;
  requestAnimationFrame(() => title.classList.remove('leaving'));
  title.querySelector('#power').focus({ preventScroll: true });
}

function hideTitle() {
  title.classList.add('leaving');
  setTimeout(() => {
    title.hidden = true;
  }, 600);
}

async function startGame({ fresh = false } = {}) {
  if (router.isBusy()) return;
  audio.unlock();
  if (fresh) resetState();
  const resume = !fresh && hasProgress() && !state.finished;
  if (!resume && !fresh) resetState();
  state.started = true;
  save();
  hud.refreshNotebook();
  hud.setChrono(state.elapsed);
  hideTitle();
  hud.setVisible(true);
  stage.layout();
  if (resume) await router.goTo(state.screen, { mode: 'direct' });
  else await router.goTo(0, { mode: 'intro' });
}

title.querySelector('#power').addEventListener('click', () => {
  title.classList.add('powering');
  startGame();
});
title.addEventListener('click', (event) => {
  const action = event.target.closest('[data-title]')?.dataset.title;
  if (!action) return;
  audio.unlock();
  audio.click();
  if (action === 'continue') startGame();
  if (action === 'new') startGame({ fresh: true });
  if (action === 'visit') {
    hud.showVisitPicker(-1, (index) => visit(index, { fromTitle: true }));
  }
  if (action === 'credits') hud.showCredits();
});

// ——— Navigation par la frise et le menu ———

async function visit(index, { fromTitle = false } = {}) {
  if (index > state.reached) state.visit = true;
  if (fromTitle) {
    if (!hasProgress()) resetState();
    state.visit = state.visit || index > 0;
    state.started = true;
    save();
    hud.refreshNotebook();
    hideTitle();
    hud.setVisible(true);
    stage.layout();
    await router.goTo(index, { mode: 'direct' });
    return;
  }
  save();
  await router.goTo(index);
}

async function navigate(index) {
  const active = router.activeEra();
  if (!active || index === active.index || router.isBusy()) return;
  const era = ERAS[index];
  const known = index <= state.reached;
  const ok = await hud.confirmDialog(
    known
      ? {
          title: `Retourner en ${label(era)} ?`,
          text: `Tu reprendras l’époque « ${era.system} » depuis son début.`,
          ok: 'Y aller',
        }
      : {
          title: 'Mode visite',
          text: `Sauter directement en ${label(era)} (${era.system}) ? Ta partie continuera, mais elle ne sera pas classée.`,
          ok: 'Sauter',
        },
  );
  if (ok) visit(index);
}

function toggleSound() {
  state.sound = !state.sound;
  audio.setEnabled(state.sound);
  hud.setSound(state.sound);
  save();
}

async function menu(action) {
  const active = router.activeEra();
  if (action === 'visit') hud.showVisitPicker(active?.index ?? -1, (index) => visit(index));
  if (action === 'facts') hud.showFactsSheet();
  if (action === 'credits') hud.showCredits();
  if (action === 'fullscreen') {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
  if (action === 'title') showTitle();
  if (action === 'restart') {
    const ok = await hud.confirmDialog({
      title: 'Recommencer la partie ?',
      text: 'Le carnet, le chrono et les statistiques repartent de zéro.',
      ok: 'Recommencer',
      danger: true,
    });
    if (ok) {
      router.stopActive();
      startGame({ fresh: true });
    }
  }
}

// Raccourcis exposés aux écrans (bouton « Rejouer » de l'écran final).
window.addEventListener('escape-os:restart', () => {
  router.stopActive();
  startGame({ fresh: true });
});
window.addEventListener('escape-os:facts', () => hud.showFactsSheet());

// ——— Mode ?debug : solution affichée et raccourcis ———

if (router.DEBUG) {
  const panel = document.createElement('aside');
  panel.className = 'debug-panel';
  panel.innerHTML = `
    <div class="dbg-head"><b>DEBUG</b><span class="dbg-era"></span></div>
    <code class="dbg-sol"></code>
    <div class="dbg-actions">
      <button type="button" data-dbg="prev" aria-label="Écran précédent">◀</button>
      <button type="button" data-dbg="win">Valider l’écran</button>
      <button type="button" data-dbg="next" aria-label="Écran suivant">▶</button>
    </div>`;
  document.body.append(panel);
  router.onChange((active) => {
    if (!active) return;
    panel.querySelector('.dbg-era').textContent = `${active.index} · ${active.era.id}`;
    panel.querySelector('.dbg-sol').textContent = SOLUTIONS[active.era.id] ?? '';
  });
  panel.addEventListener('click', (event) => {
    const action = event.target.closest('[data-dbg]')?.dataset.dbg;
    const active = router.activeEra();
    if (!action || !active) return;
    if (action === 'win') router.completeActive();
    if (action === 'prev') router.goTo(clampIndex(active.index - 1), { mode: 'direct' });
    if (action === 'next') router.goTo(clampIndex(active.index + 1), { mode: 'direct' });
  });
}

// ——— Lancement ———

if (params.has('screen')) {
  const index = clampIndex(Number(params.get('screen')));
  title.hidden = true;
  state.started = true;
  save();
  hud.setVisible(true);
  hud.refreshNotebook();
  hud.setChrono(state.elapsed);
  stage.layout();
  router.goTo(index, { mode: 'direct' });
} else {
  refreshTitle();
  title.hidden = false;
}
