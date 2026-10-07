// Saut temporel : extinction cathodique, compteur d'années façon odomètre,
// métamorphose du cadre, puis rallumage. Chaque étape se passe d'un clic.

import { audio } from './audio.js';
import * as stage from './stage.js';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Attente interrompue par un clic ou une touche.
function skippableWait(ms, skipper) {
  return new Promise((resolve) => {
    if (skipper.skipped) return resolve();
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      skipper.waiters.delete(done);
      resolve();
    }
    skipper.waiters.add(done);
  });
}

function createSkipper() {
  const skipper = { skipped: false, waiters: new Set() };
  const skip = (event) => {
    if (event.type === 'keydown' && !['Enter', ' ', 'Escape'].includes(event.key)) return;
    skipper.skipped = true;
    document.body.classList.add('jump-fast');
    for (const fn of [...skipper.waiters]) fn();
  };
  window.addEventListener('pointerdown', skip, true);
  window.addEventListener('keydown', skip, true);
  skipper.dispose = () => {
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('keydown', skip, true);
    document.body.classList.remove('jump-fast');
  };
  return skipper;
}

// ——— Odomètre ———

function buildOdometer(from, to) {
  const el = document.createElement('div');
  el.className = 'odometer';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', `Saut temporel vers ${to}`);
  const a = String(from).padStart(4, '0');
  const b = String(to).padStart(4, '0');
  const backwards = to < from;
  const columns = [...b].map((digit, i) => {
    const start = Number(a[i]);
    const end = Number(digit);
    if (a.slice(0, i + 1) === b.slice(0, i + 1)) return [start];
    // Les chiffres de droite font plus de tours : le temps défile.
    const base = backwards ? (start - end + 10) % 10 : (end - start + 10) % 10;
    const steps = base + i * 10;
    const seq = [];
    for (let s = 0; s <= steps; s++) seq.push((start + (backwards ? -s : s) + 100) % 10);
    return seq;
  });
  el.innerHTML = `
    <div class="odo-warp" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="odo-digits" aria-hidden="true">
      ${columns
        .map(
          (seq) => `<span class="odo-col" style="--steps:${seq.length - 1}">
            <span class="odo-strip">${seq.map((d) => `<span>${d}</span>`).join('')}</span>
          </span>`,
        )
        .join('')}
    </div>
    <div class="odo-caption"></div>`;
  return el;
}

export async function odometer(from, to, { caption = '', duration = 1700, skipper } = {}) {
  const el = buildOdometer(from, to);
  el.querySelector('.odo-caption').textContent = caption;
  el.style.setProperty('--odo-ms', `${duration}ms`);
  stage.stageEls().glass.append(el);
  void el.offsetWidth;
  el.classList.add('run');
  const ticker = setInterval(() => audio.tick(), 70);
  await skippableWait(duration + 250, skipper);
  clearInterval(ticker);
  el.classList.add('done');
  return () => {
    el.classList.add('leave');
    setTimeout(() => el.remove(), 400);
  };
}

// ——— Saut complet ———

// prepare : promesse du module de l'époque suivante (import et CSS).
// mount : fonction appelée écran éteint, juste avant le rallumage.
export async function timeJump({ from, to, prepare, unmount, mount }) {
  const skipper = createSkipper();
  const calm = reducedMotion();
  document.body.classList.add('jumping');
  try {
    // 1. Extinction
    audio.crtOff();
    if (calm) {
      document.body.classList.add('jump-fade');
      await skippableWait(350, skipper);
    } else {
      await stage.powerOff(skipper.skipped);
    }
    stage.setOff(true);
    unmount?.();

    // 2. Compteur d'années et métamorphose du cadre
    audio.whoosh(1.8, to.year < from.year);
    const caption = `${to.label === String(to.year) ? to.year : to.label} · ${to.system}`;
    const odo = odometer(from.year, to.year, {
      caption,
      duration: calm ? 300 : 1700,
      skipper,
    });
    await skippableWait(calm ? 0 : 250, skipper);
    stage.setEra(to, { morph: !calm });
    const [hide] = await Promise.all([odo, prepare, skippableWait(calm ? 300 : 1300, skipper)]);

    // 3. Rallumage sur l'époque suivante
    await mount?.();
    hide();
    audio.crtOn();
    if (calm) {
      stage.setOff(false);
      document.body.classList.remove('jump-fade');
    } else {
      await stage.powerOn(skipper.skipped);
    }
  } finally {
    skipper.dispose();
    document.body.classList.remove('jumping', 'jump-fade');
  }
}

// Ouverture de partie : un bug de mise à jour renvoie le joueur en 1965.
export async function intro({ to, prepare, mount }) {
  const skipper = createSkipper();
  const calm = reducedMotion();
  document.body.classList.add('jumping');
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro-card">
      <p class="intro-time">7 octobre 2026 · 09:41</p>
      <p class="intro-title">Mise à jour du système</p>
      <div class="intro-bar"><i></i></div>
      <p class="intro-status">Installation… <span class="intro-pct">0</span> %</p>
    </div>
    <p class="intro-error" aria-live="assertive"></p>`;
  document.getElementById('overlays').append(el);
  try {
    const pct = el.querySelector('.intro-pct');
    const bar = el.querySelector('.intro-bar i');
    const start = performance.now();
    await new Promise((resolve) => {
      const step = () => {
        const p = Math.min(1, (performance.now() - start) / 1800);
        const v = Math.floor(97 * (1 - (1 - p) ** 3));
        pct.textContent = v;
        bar.style.transform = `scaleX(${v / 100})`;
        if (p < 1 && !skipper.skipped) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    el.querySelector('.intro-error').textContent = 'Erreur temporelle 0x1965 : l’horloge système remonte le temps.';
    el.classList.add('glitch');
    audio.beep(220, 0.08);
    audio.noise({ type: 'bandpass', freq: 900, q: 0.6, attack: 0.01, release: 0.6, vol: 0.12 });
    await skippableWait(calm ? 400 : 1500, skipper);
    el.classList.add('leave');
    audio.crtOff();
    audio.whoosh(2, true);
    const odo = odometer(2026, to.year, {
      caption: `${to.label} · ${to.system}`,
      duration: calm ? 300 : 2100,
      skipper,
    });
    await skippableWait(calm ? 0 : 350, skipper);
    el.remove();
    stage.setEra(to, { morph: !calm });
    const [hide] = await Promise.all([odo, prepare, skippableWait(calm ? 300 : 1300, skipper)]);
    await mount?.();
    hide();
    audio.crtOn();
    await stage.powerOn(skipper.skipped || calm);
  } finally {
    el.remove();
    skipper.dispose();
    document.body.classList.remove('jumping');
  }
}
