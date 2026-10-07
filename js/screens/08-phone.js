// Écran 8 — 2007 : le smartphone tactile. Glisser pour déverrouiller, pincer
// la seule photo de la pellicule pour lire un numéro minuscule, puis l'appeler.

import { slider, scaleOf } from '../ui/gestures.js';
import { ICONS, GLYPHS, emblem, wallpaper } from './phone/art.js';
import { h, play, calm, EASE, EASE_IN, fadeIn, fadeOut } from './phone/kit.js';
import { photosApp } from './phone/photos.js';
import { phoneApp } from './phone/dialer.js';
import { MINI_APPS } from './phone/apps.js';

const GRID = [
  ['messages', 'Messages'],
  ['calendar', 'Calendrier'],
  ['photos', 'Photos'],
  ['camera', 'Appareil photo'],
  ['videos', 'Vidéos'],
  ['stocks', 'Bourse'],
  ['maps', 'Plans'],
  ['weather', 'Météo'],
  ['clock', 'Horloge'],
  ['calc', 'Calculette'],
  ['notes', 'Notes'],
  ['settings', 'Réglages'],
  ['contacts', 'Contacts'],
  ['store', 'Boutique'],
  ['apps', 'Applis'],
  ['games', 'Jeux'],
];
const DOCK = [
  ['phone', 'Téléphone'],
  ['mail', 'Mail'],
  ['browser', 'Navigateur'],
  ['music', 'Musique'],
];
const LABELS = Object.fromEntries([...GRID, ...DOCK]);

// Applications sans écran : un message d'époque suffit.
const ALERTS = {
  camera: ['Appareil photo', '2 mégapixels, sans flash ni vidéo : c’était ça, la photo au téléphone en 2007.'],
  videos: ['Vidéos', 'Aucune vidéo. Synchronisez votre téléphone avec votre ordinateur pour en ajouter.'],
  stocks: ['Bourse', 'Cours indisponibles : le réseau EDGE est bien lent. La 3G n’arrivera qu’avec le modèle suivant, en 2008.'],
  maps: ['Plans', 'Position introuvable : ce téléphone n’a pas de puce GPS. Elle n’arrivera qu’en 2008.'],
  contacts: ['Contacts', 'Aucun contact. Le répertoire se remplit en synchronisant le téléphone avec un ordinateur.'],
  store: ['Boutique', 'La boutique de musique sans fil n’ouvrira qu’à l’automne 2007.'],
  apps: ['Applis', 'Le magasin d’applications n’ouvrira qu’en juillet 2008. En attendant, ce téléphone n’a que ses applications d’origine !'],
  games: ['Jeux', 'Aucun jeu installé : il faudra attendre le magasin d’applications, en 2008.'],
  mail: ['Mail', 'Relève du courrier par le réseau EDGE… Un peu de patience : nous sommes en 2007 !'],
};

// Ton de la barre d'état selon l'écran
const TONES = { photos: 'clear', phone: 'black', clock: 'black', calc: 'black', weather: 'black', music: 'black' };

const START = 9 * 60 + 42; // 9:42, le matin de la présentation
const SMS = { from: 'Moi (2026)', text: 'Le chemin du retour est dans tes photos.' };

const iconButton = ([id, label], { dock = false } = {}) => `
  <button type="button" class="ph-icon" data-app="${id}" aria-label="${label}">
    <span class="ph-art-wrap">
      <span class="ph-art">${ICONS[id]()}</span>
      ${id === 'messages' ? '<span class="ph-badge" hidden>1</span>' : ''}
    </span>
    ${dock ? `<span class="ph-art ph-reflect" aria-hidden="true">${ICONS[id]()}</span>` : ''}
    <span class="ph-label">${label}</span>
  </button>`;

export default {
  id: 'phone',
  era: 'Smartphone',
  year: 2007,

  mount(root, ctx) {
    const { audio } = ctx;
    const state = { phase: 'boot', airplane: false, smsRead: false, smsShown: false, found: false };
    let current = null; // application ouverte : { id, el, iconEl, api }
    let busy = false;
    let alertEl = null;
    let alertDone = null;
    let lockTaps = 0;

    root.innerHTML = `
      <div class="ph" data-phase="boot">
        <div class="ph-layer ph-boot"><div class="ph-emblem">${emblem()}</div></div>
        <div class="ph-layer ph-home" hidden>
          <div class="ph-grid">${GRID.map((app) => iconButton(app)).join('')}</div>
          <div class="ph-dock"><div class="ph-dock-row">${DOCK.map((app) => iconButton(app, { dock: true })).join('')}</div></div>
        </div>
        <div class="ph-apps"></div>
        <div class="ph-layer ph-lock" hidden>
          <div class="ph-wall">${wallpaper()}</div>
          <div class="ph-lock-top">
            <p class="ph-lock-time">9:42</p>
            <p class="ph-lock-date">mardi 9 janvier</p>
          </div>
          <div class="ph-lock-bottom">
            <div class="ph-well">
              <div class="ph-rail">
                <span class="ph-slide-label" aria-hidden="true">glisser pour déverrouiller</span>
                <span class="ph-knob" aria-label="Glisser pour déverrouiller (flèche droite)">${GLYPHS.arrow}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="ph-status" data-tone="lock" hidden>
          <span class="ph-sb-left">
            <span class="ph-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
            <span class="ph-plane" aria-hidden="true">${GLYPHS.plane}</span>
            <span class="ph-carrier">Opérateur</span>
            <b class="ph-edge" aria-hidden="true">E</b>
          </span>
          <span class="ph-sb-mid"><span class="ph-sb-time">9:42</span><span class="ph-sb-lock" aria-hidden="true">${GLYPHS.lock}</span></span>
          <span class="ph-sb-right"><span class="ph-batt" role="img" aria-label="Batterie chargée à 80 %"><i></i></span></span>
        </div>
      </div>`;

    const q = (sel) => root.querySelector(sel);
    const phone = q('.ph');
    const boot = q('.ph-boot');
    const lock = q('.ph-lock');
    const home = q('.ph-home');
    const apps = q('.ph-apps');
    const status = q('.ph-status');
    const rail = q('.ph-rail');
    const knob = q('.ph-knob');
    const slideLabel = q('.ph-slide-label');
    const badge = q('.ph-badge');

    const setPhase = (phase) => {
      state.phase = phase;
      phone.dataset.phase = phase;
    };
    const setTone = (tone) => {
      status.dataset.tone = tone;
    };

    // ——— Horloge fictive : 9:42 au démarrage, puis le temps passe ———

    const started = performance.now();
    const minutes = () => START + Math.floor((performance.now() - started) / 60000);
    const time = (m = minutes()) => `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')}`;
    let shown = '';
    const tick = () => {
      const now = time();
      if (now === shown) return;
      shown = now;
      q('.ph-sb-time').textContent = now;
      q('.ph-lock-time').textContent = now;
      current?.api?.tick?.();
    };
    ctx.interval(tick, 1000);

    // ——— Alerte façon 2007 ———

    function closeAlert(value) {
      if (!alertEl) return;
      const el = alertEl;
      const done = alertDone;
      alertEl = null;
      alertDone = null;
      play(el, fadeOut, { duration: 200 }).then(() => el.remove());
      done?.(value);
    }

    function alert(title, text, { buttons = ['OK'] } = {}) {
      closeAlert(null);
      const el = h(`<div class="ph-alert-veil">
        <div class="ph-alert" role="alertdialog" aria-modal="true" aria-labelledby="ph-alert-title" aria-describedby="ph-alert-text">
          <p class="ph-alert-title" id="ph-alert-title"></p>
          <p class="ph-alert-text" id="ph-alert-text"></p>
          <div class="ph-alert-actions">${buttons.map((b, i) => `<button type="button" class="ph-alert-btn${i === buttons.length - 1 ? ' is-default' : ''}" data-i="${i}"></button>`).join('')}</div>
        </div>
      </div>`);
      el.querySelector('.ph-alert-title').textContent = title;
      el.querySelector('.ph-alert-text').textContent = text;
      el.querySelectorAll('.ph-alert-btn').forEach((btn, i) => {
        btn.textContent = buttons[i];
      });
      phone.append(el);
      alertEl = el;
      play(el, fadeIn, { duration: 220 });
      play(
        el.querySelector('.ph-alert'),
        [
          { transform: 'scale(.62)', opacity: 0 },
          { transform: 'scale(1.06)', opacity: 1, offset: 0.55 },
          { transform: 'scale(.98)', opacity: 1, offset: 0.8 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration: 420, easing: 'ease-out', calm: fadeIn },
      );
      el.querySelector('.is-default').focus({ preventScroll: true });
      return new Promise((resolve) => {
        alertDone = resolve;
        el.addEventListener('click', (event) => {
          const btn = event.target.closest('.ph-alert-btn');
          if (!btn) return;
          audio.tap();
          closeAlert(buttons[Number(btn.dataset.i)]);
        });
      });
    }

    // ——— Démarrage ———

    async function start() {
      const skip = { skippable: true };
      await ctx.wait(450, skip);
      boot.classList.add('is-lit');
      audio.chime('phone');
      await ctx.wait(1900, skip);
      showLock();
    }

    function showLock() {
      setPhase('lock');
      lock.hidden = false;
      status.hidden = false;
      setTone('lock');
      play(boot, fadeOut, { duration: 400 }).then(() => {
        boot.hidden = true;
      });
      play(lock, fadeIn, { duration: 500 });
      play(q('.ph-lock-top'), [{ transform: 'translateY(-24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, delay: 80 });
      play(q('.ph-lock-bottom'), [{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, delay: 80 });
      knob.focus({ preventScroll: true });
    }

    // ——— Glisser pour déverrouiller ———

    slider(rail, knob, {
      signal: ctx.signal,
      onProgress: (p) => {
        slideLabel.style.opacity = String(Math.max(0, 1 - p * 2.6));
        knob.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      },
      onComplete: () => unlock(),
    });

    // Un simple toucher ne fait rien… sauf rebondir la flèche, pour l'exemple.
    function nudgeKnob() {
      if (state.phase !== 'lock') return;
      lockTaps += 1;
      slideLabel.classList.remove('is-quick');
      void slideLabel.offsetWidth;
      slideLabel.classList.add('is-quick');
      if (calm()) return;
      knob.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(22px)', offset: 0.3 },
          { transform: 'translateX(0)', offset: 0.6 },
          { transform: 'translateX(8px)', offset: 0.8 },
          { transform: 'translateX(0)' },
        ],
        { duration: 650, easing: 'ease-out' },
      );
    }
    let downAt = null;
    ctx.on(rail, 'pointerdown', (event) => {
      downAt = { x: event.clientX, y: event.clientY, t: performance.now() };
    });
    ctx.on(rail, 'pointerup', (event) => {
      if (!downAt) return;
      const still = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) < 4 && performance.now() - downAt.t < 500;
      downAt = null;
      if (still) nudgeKnob();
    });

    async function unlock() {
      if (state.phase !== 'lock') return;
      setPhase('unlocking');
      audio.unlock2007();
      ctx.progress();
      home.hidden = false;
      setTone('home');
      const anims = await Promise.all([
        play(q('.ph-lock-top'), [{ transform: 'none' }, { transform: 'translateY(-100%)' }], { duration: 380, easing: EASE_IN, calm: fadeOut }),
        play(q('.ph-lock-bottom'), [{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 380, easing: EASE_IN, calm: fadeOut }),
        play(q('.ph-wall'), fadeOut, { duration: 420, delay: 120, easing: 'ease' }),
        flyIn(140),
      ]);
      lock.hidden = true;
      anims.flat().forEach((a) => a?.cancel?.());
      setPhase('home');
      home.querySelector('.ph-icon')?.focus({ preventScroll: true });
      if (!state.smsShown) receiveSms().catch(() => {});
    }

    // Les icônes arrivent du bord de l'écran, le dock monte.
    function flyIn(delay = 0) {
      const box = phone.getBoundingClientRect();
      const s = scaleOf(phone) || 1;
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height * 0.42;
      const icons = [...home.querySelectorAll('.ph-grid .ph-icon')].map((icon) => {
        const r = icon.getBoundingClientRect();
        const dx = ((r.left + r.width / 2 - cx) / s) * 0.9;
        const dy = ((r.top + r.height / 2 - cy) / s) * 0.9;
        return play(
          icon,
          [
            { transform: `translate(${dx}px, ${dy}px) scale(1.9)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 560, delay, easing: EASE, calm: fadeIn },
        );
      });
      const dock = play(q('.ph-dock'), [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 520, delay, calm: fadeIn });
      return Promise.all([...icons, dock]);
    }

    // ——— SMS de soi-même, depuis 2026 ———

    async function receiveSms() {
      state.smsShown = true;
      await ctx.wait(1400);
      if (state.phase !== 'home' || state.smsRead) return;
      audio.melody(
        [
          ['E6', 0, 0.16],
          ['B6', 0.12, 0.16],
          ['G#6', 0.24, 0.42],
        ],
        { vol: 0.05, type: 'sine' },
      );
      badge.hidden = false;
      play(badge, [{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 380 });
      if (current) return;
      const answer = await alert(SMS.from, SMS.text, { buttons: ['Fermer', 'Lire'] });
      if (answer === 'Lire' && !current && state.phase === 'home') {
        open('messages', home.querySelector('[data-app="messages"]'), { direct: true });
      }
    }

    // ——— Accueil et applications ———

    function bounce(icon) {
      icon.classList.remove('is-bouncing');
      void icon.offsetWidth;
      icon.classList.add('is-bouncing');
    }

    ctx.on(home, 'click', (event) => {
      const icon = event.target.closest('.ph-icon');
      if (!icon || busy || current || state.phase !== 'home') return;
      const id = icon.dataset.app;
      audio.tap();
      if (ALERTS[id]) {
        bounce(icon);
        alert(...ALERTS[id]);
        return;
      }
      open(id, icon);
    });

    // Centre de l'icône dans le repère logique du téléphone
    function originOf(icon) {
      const box = phone.getBoundingClientRect();
      const s = scaleOf(phone) || 1;
      const r = (icon.querySelector('.ph-art') ?? icon).getBoundingClientRect();
      return { x: (r.left + r.width / 2 - box.left) / s, y: (r.top + r.height / 2 - box.top) / s };
    }

    const kit = {
      ctx,
      audio,
      state,
      alert,
      time,
      minutes,
      current: () => current?.id ?? null,
      home: () => close(),
      markRead() {
        state.smsRead = true;
        badge.hidden = true;
      },
      setAirplane(on) {
        state.airplane = on;
        phone.toggleAttribute('data-airplane', on);
        q('.ph-carrier').textContent = on ? '' : 'Opérateur';
      },
    };

    const BUILDERS = { photos: photosApp, phone: phoneApp, ...MINI_APPS };

    async function open(id, icon, opts = {}) {
      const build = BUILDERS[id];
      if (!build || busy || current) return;
      busy = true;
      closeAlert(null);
      const el = h(`<section class="ph-app ph-app-${id}" aria-label="${LABELS[id]}"></section>`);
      apps.append(el);
      current = { id, el, icon, api: null };
      setTone(TONES[id] ?? 'gray');
      current.api = build(el, kit, opts) ?? {};
      if (id === 'photos' && !state.photosSeen) {
        state.photosSeen = true;
        ctx.progress();
      }
      const o = originOf(icon);
      el.style.transformOrigin = `${o.x}px ${o.y}px`;
      home.style.transformOrigin = `${o.x}px ${o.y}px`;
      const [a, b] = await Promise.all([
        play(el, [{ transform: 'scale(.18)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 440 }),
        play(home, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(2.4)', opacity: 0 }], { duration: 440 }),
      ]);
      home.hidden = true;
      a.cancel();
      b.cancel();
      busy = false;
      el.querySelector('button, [tabindex="0"]')?.focus({ preventScroll: true });
    }

    async function close() {
      if (!current || busy) return;
      busy = true;
      const { el, icon, api } = current;
      home.hidden = false;
      setTone('home');
      const o = originOf(icon);
      el.style.transformOrigin = `${o.x}px ${o.y}px`;
      home.style.transformOrigin = `${o.x}px ${o.y}px`;
      el.inert = true;
      const [a, b] = await Promise.all([
        play(el, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.18)', opacity: 0 }], { duration: 400, easing: 'cubic-bezier(.4,0,.2,1)' }),
        play(home, [{ transform: 'scale(2.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 400 }),
      ]);
      api?.dispose?.();
      el.remove();
      a.cancel();
      b.cancel();
      current = null;
      busy = false;
      icon.focus({ preventScroll: true });
    }

    // ——— Bouton principal ———

    ctx.onHardware('home', () => {
      audio.click();
      if (state.phase === 'lock') nudgeKnob();
      if (state.phase !== 'home') return;
      if (alertEl) closeAlert(null);
      if (!current) {
        home.classList.remove('is-nudged');
        void home.offsetWidth;
        home.classList.add('is-nudged');
        return;
      }
      if (current.api?.onHome?.() === false) return;
      close();
    });

    // ——— Indices : l'icône utile se signale ———

    ctx.hints.onReveal((level) => {
      if (state.phase !== 'home') return;
      current?.api?.hint?.(level);
      if (current) return;
      const target = level >= 3 || state.found ? 'phone' : 'photos';
      const icon = home.querySelector(`[data-app="${target}"]`);
      if (icon) bounce(icon);
    });

    start().catch(() => {});

    return () => {
      current?.api?.dispose?.();
    };
  },
};
