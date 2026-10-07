// L'unité centrale posée à côté du moniteur, dessinée en CSS : lecteur de
// CD-ROM à tiroir, disquette 3½, voyants, afficheur de fréquence, bouton
// Turbo, Reset et le gros bouton d'alimentation. Variante « 95 » (mini-tour
// beige) et « 98 » (moyen-tour ATX, bouton rond).

import { pixelArt } from '../../ui/pixel.js';

// Afficheur sept segments : les MHz du processeur, rouge sur noir
const SEGMENTS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', ' ': '' };

export const sevenSeg = (text) =>
  pixelArt([text.length * 9 - 1, 13], (p) => {
    [...text].forEach((ch, i) => {
      const on = SEGMENTS[ch] ?? '';
      const x = i * 9;
      const seg = (s, sx, sy, w, h) => p.rect(x + sx, sy, w, h, on.includes(s) ? '#ff3a26' : '#3a0b08');
      seg('a', 1, 0, 6, 1);
      seg('b', 7, 1, 1, 5);
      seg('c', 7, 7, 1, 5);
      seg('d', 1, 12, 6, 1);
      seg('e', 0, 7, 1, 5);
      seg('f', 0, 1, 1, 5);
      seg('g', 1, 6, 6, 1);
    });
  });

export function createTower(host, { variant = '95', audio, signal, onPower, onReset } = {}) {
  const is98 = variant === '98';
  const el = document.createElement('div');
  el.className = `w9x-tower w9x-tower-${variant} is-on`;
  el.innerHTML = `
    <div class="tw-case">
      <div class="tw-top" aria-hidden="true"></div>
      <div class="tw-side" aria-hidden="true"></div>
      <div class="tw-front">
        <div class="tw-bay tw-cd">
          <div class="tw-tray" aria-hidden="true"><i></i></div>
          <span class="tw-cd-door" aria-hidden="true"></span>
          <span class="tw-label">${is98 ? 'CD-ROM 32x' : 'CD-ROM 4x'}</span>
          <i class="tw-led tw-cd-led" aria-hidden="true"></i>
          <button type="button" class="tw-eject" aria-label="Ouvrir ou fermer le tiroir du CD-ROM"></button>
        </div>
        <div class="tw-bay tw-blank" aria-hidden="true"></div>
        <div class="tw-floppy">
          <i class="tw-slot" aria-hidden="true"></i>
          <i class="tw-led tw-fd-led" aria-hidden="true"></i>
          <button type="button" class="tw-fd-eject" aria-label="Éjecter la disquette"></button>
        </div>
        <div class="tw-panel">
          ${is98 ? '' : `<span class="tw-mhz" aria-label="Fréquence du processeur">${sevenSeg('75')}</span>`}
          <span class="tw-leds" aria-hidden="true">
            <i class="tw-led tw-power-led"></i><small>${is98 ? '⏻' : 'POWER'}</small>
            <i class="tw-led tw-hdd-led"></i><small>${is98 ? '▤' : 'HDD'}</small>
            ${is98 ? '' : '<i class="tw-led tw-turbo-led"></i><small>TURBO</small>'}
          </span>
          ${is98 ? '' : '<span class="tw-lock" aria-hidden="true"></span>'}
        </div>
        <div class="tw-buttons">
          ${is98 ? '' : '<button type="button" class="tw-turbo" aria-label="Bouton Turbo" aria-pressed="true"></button>'}
          <button type="button" class="tw-power" aria-label="Bouton d’alimentation de l’ordinateur"><span>${is98 ? '' : 'POWER'}</span></button>
          <button type="button" class="tw-reset" aria-label="Bouton Reset : redémarre l’ordinateur"></button>
        </div>
        <div class="tw-grille" aria-hidden="true"></div>
        <div class="tw-badge" aria-hidden="true">${is98 ? 'TEMPO <b>98</b>' : 'TEMPO <b>586</b>'}</div>
        <div class="tw-sticker" aria-hidden="true">${is98 ? '<b>266</b> MHz<br>56K' : 'MULTI<br>MÉDIA'}</div>
      </div>
    </div>
    <div class="tw-shadow" aria-hidden="true"></div>`;
  host.append(el);

  const q = (sel) => el.querySelector(sel);
  const power = q('.tw-power');
  let diskTimer = 0;
  let turbo = true;

  const press = (btn) => {
    btn.classList.remove('is-pressed');
    void btn.offsetWidth;
    btn.classList.add('is-pressed');
    setTimeout(() => btn.classList.remove('is-pressed'), 180);
  };

  const thunk = () => {
    audio?.noise({ type: 'lowpass', freq: 600, release: 0.05, vol: 0.18 });
    audio?.tone({ freq: 95, type: 'triangle', release: 0.06, vol: 0.08 });
  };

  power.addEventListener(
    'click',
    () => {
      press(power);
      thunk();
      onPower?.();
    },
    { signal },
  );

  q('.tw-reset').addEventListener(
    'click',
    () => {
      press(q('.tw-reset'));
      audio?.click();
      onReset?.();
    },
    { signal },
  );

  q('.tw-eject').addEventListener(
    'click',
    () => {
      press(q('.tw-eject'));
      api.tray(!el.classList.contains('is-tray'));
    },
    { signal },
  );

  q('.tw-fd-eject').addEventListener(
    'click',
    () => {
      press(q('.tw-fd-eject'));
      audio?.click();
      api.floppy(0.3);
    },
    { signal },
  );

  q('.tw-turbo')?.addEventListener(
    'click',
    (event) => {
      turbo = !turbo;
      const btn = event.currentTarget;
      btn.setAttribute('aria-pressed', String(turbo));
      el.classList.toggle('is-slow', !turbo);
      audio?.click();
      api.refreshMhz();
    },
    { signal },
  );

  const api = {
    el,
    power,
    get on() {
      return el.classList.contains('is-on');
    },
    setOn(on) {
      el.classList.toggle('is-on', on);
      if (!on) {
        clearTimeout(diskTimer);
        el.classList.remove('is-disk', 'is-floppy');
      }
      api.refreshMhz();
    },
    refreshMhz() {
      const mhz = q('.tw-mhz');
      if (mhz) mhz.innerHTML = sevenSeg(api.on ? (turbo ? '75' : '33') : '  ');
    },
    // Le voyant du disque dur clignote pendant un accès.
    disk(seconds = 1) {
      if (!api.on) return;
      el.classList.add('is-disk');
      clearTimeout(diskTimer);
      diskTimer = setTimeout(() => el.classList.remove('is-disk'), seconds * 1000);
    },
    floppy(seconds = 1) {
      if (!api.on) return;
      el.classList.add('is-floppy');
      setTimeout(() => el.classList.remove('is-floppy'), seconds * 1000);
    },
    tray(open) {
      if (open === el.classList.contains('is-tray')) return;
      if (!api.on) {
        audio?.click();
        return;
      }
      audio?.noise({ type: 'bandpass', freq: 420, q: 2, attack: 0.05, hold: 0.45, release: 0.1, vol: 0.06 });
      audio?.tone({ freq: 70, type: 'sawtooth', attack: 0.05, hold: 0.4, release: 0.1, vol: 0.02, filter: { freq: 400 } });
      el.classList.toggle('is-tray', open);
    },
    // Le bouton d'alimentation attire l'œil quand on l'attend.
    nudge(on) {
      el.classList.toggle('is-nudge', on);
    },
    destroy() {
      clearTimeout(diskTimer);
      el.remove();
    },
  };
  api.refreshMhz();
  return api;
}

// Voyant du moniteur : passe à l'orange (veille) quand l'unité centrale est éteinte.
export function createMonitorLed(host) {
  const led = document.createElement('i');
  led.className = 'w9x-monled';
  led.setAttribute('aria-hidden', 'true');
  host.append(led);
  return {
    standby(on) {
      led.classList.toggle('is-standby', on);
    },
    destroy: () => led.remove(),
  };
}
