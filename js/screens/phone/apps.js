// Les autres applications : de petits écrans d'époque, sans rôle dans
// l'énigme, sauf Messages qui oriente vers la pellicule.

import { ICONS, GLYPHS, clockFace, ids, lg, rg } from './art.js';
import { h, nav, createStack, play, fadeIn } from './kit.js';

export const SMS_THREAD = [
  'Salut, c’est toi… en 2026 !',
  'Le bug temporel t’a déposé en 2007, hein ?',
  'Le chemin du retour est dans tes photos. Regarde bien chaque détail.',
];

const back = (page, stack, kit) => {
  page.querySelector('[data-back]')?.addEventListener('click', () => {
    kit.audio.tap();
    stack.pop();
  });
};

// ——— Messages ———

function messages(host, kit, { direct = false } = {}) {
  kit.markRead();
  host.innerHTML = '<div class="ph-stack"></div>';
  const stack = createStack(host.firstElementChild);
  const list = h(`<section class="ph-page ph-sms-list">
    ${nav({ title: 'Messages' })}
    <ul class="ph-table ph-table-plain">
      <li><button type="button" class="ph-row ph-sms-row">
        <span class="ph-sms-from">Moi (2026)</span><span class="ph-sms-time">9:38</span>
        <span class="ph-sms-preview">${SMS_THREAD.at(-1)}</span>
        <span class="ph-chev">${GLYPHS.chevron}</span>
      </button></li>
    </ul>
  </section>`);
  const thread = h(`<section class="ph-page ph-sms-thread">
    ${nav({ title: 'Moi (2026)', back: 'Messages' })}
    <div class="ph-sms-body">
      <p class="ph-sms-date">mardi 9 janvier 2007 9:38</p>
      ${SMS_THREAD.map((text) => `<p class="ph-bubble">${text}</p>`).join('')}
    </div>
    <div class="ph-sms-compose" aria-hidden="true"><span class="ph-sms-field"></span><span class="ph-sms-send">Envoyer</span></div>
  </section>`);
  stack.push(list, { animate: false });
  if (direct) stack.push(thread, { animate: false });
  list.querySelector('.ph-sms-row').addEventListener('click', () => {
    kit.audio.tap();
    stack.push(thread);
  });
  back(thread, stack, kit);
}

// ——— Calendrier : janvier 2007, le 1er tombe un lundi ———

const EVENTS = {
  1: [['journée', 'Jour de l’an']],
  9: [
    ['9:00', 'Présentation d’un téléphone sans clavier'],
    ['18:30', 'Dîner : raconter la présentation'],
  ],
  17: [['14:00', 'Synchroniser le téléphone']],
};

function calendar(host, kit) {
  const cells = [];
  for (let i = 0; i < 35; i++) {
    const day = i < 31 ? i + 1 : i - 30;
    const other = i >= 31;
    cells.push(
      `<button type="button" class="ph-cal-day${other ? ' is-other' : ''}${!other && day === 9 ? ' is-today is-selected' : ''}${!other && EVENTS[day] ? ' has-event' : ''}" data-day="${other ? '' : day}"${other ? ' tabindex="-1"' : ''}>${day}</button>`,
    );
  }
  host.innerHTML = `<section class="ph-page ph-cal">
    ${nav({ title: 'Calendrier', right: '<span class="ph-nav-btn" aria-hidden="true">Aujourd’hui</span>' })}
    <div class="ph-cal-head"><span aria-hidden="true">◀</span><b>janvier 2007</b><span aria-hidden="true">▶</span></div>
    <div class="ph-cal-dow" aria-hidden="true">${['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map((d) => `<span>${d}</span>`).join('')}</div>
    <div class="ph-cal-grid">${cells.join('')}</div>
    <ul class="ph-cal-events" aria-live="polite"></ul>
  </section>`;
  const events = host.querySelector('.ph-cal-events');
  const show = (day) => {
    const list = EVENTS[day] ?? [];
    events.innerHTML = list.length
      ? list.map(([t, label]) => `<li><span>${t}</span>${label}</li>`).join('')
      : '<li class="is-empty">Aucun événement</li>';
  };
  host.querySelector('.ph-cal-grid').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-day]');
    if (!btn?.dataset.day) return;
    kit.audio.tap();
    host.querySelectorAll('.is-selected').forEach((el) => el.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    show(Number(btn.dataset.day));
  });
  show(9);
}

// ——— Notes ———

function notes(host, kit) {
  host.innerHTML = '<div class="ph-stack"></div>';
  const stack = createStack(host.firstElementChild);
  const list = h(`<section class="ph-page ph-notes-list">
    ${nav({ title: 'Notes (1)', style: 'tan' })}
    <ul class="ph-notes-rows">
      <li><button type="button" class="ph-row ph-note-row"><span>Penser à rentrer en 2026</span><small>9:40</small><span class="ph-chev">${GLYPHS.chevron}</span></button></li>
    </ul>
  </section>`);
  const page = h(`<section class="ph-page ph-note">
    ${nav({ title: 'Penser à rentrer…', back: 'Notes', style: 'tan' })}
    <div class="ph-paper">
      <p class="ph-paper-date"><span>Aujourd’hui</span><span>9 janv. 9:40</span></p>
      <p class="ph-ink">Penser à rentrer en 2026</p>
      <p class="ph-ink">(et ne pas oublier le chargeur)</p>
    </div>
  </section>`);
  stack.push(list, { animate: false });
  list.querySelector('.ph-note-row').addEventListener('click', () => {
    kit.audio.tap();
    stack.push(page);
  });
  back(page, stack, kit);
}

// ——— Horloge : l'heure du téléphone est celle de San Francisco ———

const CITIES = [
  ['San Francisco', 0],
  ['Paris', 9],
  ['Tokyo', 17],
];

function clock(host, kit) {
  host.innerHTML = `<section class="ph-page ph-clock">
    ${nav({ title: 'Horloges', style: 'black' })}
    <ul class="ph-clock-list"></ul>
  </section>`;
  const list = host.querySelector('.ph-clock-list');
  const render = () => {
    const base = kit.minutes();
    list.innerHTML = CITIES.map(([city, shift]) => {
      const total = base + shift * 60;
      const m = ((total % 1440) + 1440) % 1440;
      const hh = Math.floor(m / 60);
      const night = hh < 7 || hh >= 19;
      const day = total >= 1440 ? 'Demain' : 'Aujourd’hui';
      return `<li class="ph-clock-row">
        <span class="ph-clock-face">${clockFace(hh, m % 60, { night, sec: 0 })}</span>
        <span class="ph-clock-city"><b>${city}</b><small>${day}</small></span>
        <span class="ph-clock-time">${hh}:${String(m % 60).padStart(2, '0')}</span>
      </li>`;
    }).join('');
  };
  render();
  return { tick: render };
}

// ——— Calculette ———

function calc(host, kit) {
  const keys = ['C', '±', '÷', '×', '7', '8', '9', '−', '4', '5', '6', '+', '1', '2', '3', '=', '0', ','];
  host.innerHTML = `<section class="ph-page ph-calc">
    <output class="ph-calc-screen" aria-live="polite">0</output>
    <div class="ph-calc-keys">${keys
      .map((k) => {
        const kind = /[0-9,]/.test(k) ? 'num' : k === '=' ? 'eq' : 'op';
        return `<button type="button" class="ph-calc-key is-${kind}${k === '0' ? ' is-wide' : ''}${k === '=' ? ' is-tall' : ''}" data-k="${k}">${k}</button>`;
      })
      .join('')}</div>
  </section>`;
  const screen = host.querySelector('.ph-calc-screen');
  let acc = null;
  let op = null;
  let entry = '0';
  let fresh = true;
  const show = (text) => {
    screen.textContent = text.replace('.', ',').replace('-', '−');
    screen.classList.toggle('is-long', text.length > 9);
  };
  const compute = (a, b, o) => ({ '+': a + b, '−': a - b, '×': a * b, '÷': b === 0 ? NaN : a / b })[o] ?? b;
  host.querySelector('.ph-calc-keys').addEventListener('click', (event) => {
    const k = event.target.closest('[data-k]')?.dataset.k;
    if (!k) return;
    kit.audio.tap();
    if (/\d/.test(k)) {
      entry = fresh || entry === '0' ? k : entry.length < 9 ? entry + k : entry;
      fresh = false;
    } else if (k === ',') {
      if (fresh) entry = '0';
      if (!entry.includes('.')) entry += '.';
      fresh = false;
    } else if (k === 'C') {
      acc = null;
      op = null;
      entry = '0';
      fresh = true;
    } else if (k === '±') {
      entry = String(-Number(entry));
    } else {
      const value = Number(entry);
      if (op && !fresh) acc = compute(acc, value, op);
      else if (!op) acc = value;
      op = k === '=' ? null : k;
      entry = Number.isFinite(acc) ? String(Number(acc.toPrecision(9))) : 'Erreur';
      if (entry === 'Erreur') acc = null;
      fresh = true;
    }
    show(entry);
  });
}

// ——— Réglages : le mode Avion coupe le réseau ———

const SETTINGS = [
  [
    ['plane', 'Mode Avion', 'switch'],
    ['wifi', 'Wi-Fi', 'Non connecté'],
  ],
  [
    ['usage', 'Utilisation'],
    ['sound', 'Sons'],
    ['bright', 'Luminosité'],
    ['wall', 'Fond d’écran'],
  ],
  [
    ['general', 'Général'],
    ['mail', 'Mail'],
    ['phone', 'Téléphone'],
    ['browser', 'Navigateur'],
    ['music', 'Musique'],
    ['photos', 'Photos'],
  ],
];

const SMALL = {
  plane: ['#ff9d2e', '#e2620b', GLYPHS.plane],
  wifi: ['#59a8ff', '#1f63d6', '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 11.5 5.6 8.8a3.4 3.4 0 0 1 4.8 0zM3.4 6.6a6.6 6.6 0 0 1 9.2 0l-1.1 1.2a5 5 0 0 0-7 0zM1 4.2a10 10 0 0 1 14 0l-1.1 1.2a8.4 8.4 0 0 0-11.8 0z" fill="currentColor"/></svg>'],
  usage: ['#9aa3ad', '#5b636d', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 14h12M4 12V8M7 12V4M10 12V6M13 12V9" stroke="currentColor" stroke-width="2" fill="none"/></svg>'],
  sound: ['#ff6b8b', '#d8244b', GLYPHS.speaker],
  bright: ['#5fb0ff', '#1e6fd8', '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="currentColor"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3" stroke="currentColor" stroke-width="1.5"/></svg>'],
  wall: ['#5ed0c4', '#1a8d84', '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5.5" cy="6" r="2.4" fill="currentColor"/><circle cx="10.5" cy="9.5" r="3.3" fill="currentColor" opacity=".8"/></svg>'],
  general: ['#b9c0c8', '#6d757e', '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="2.2 1.6"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>'],
};

function settings(host, kit) {
  const row = ([key, label, extra]) => {
    const art = SMALL[key]
      ? `<span class="ph-mini" style="--a:${SMALL[key][0]};--b:${SMALL[key][1]}">${SMALL[key][2]}</span>`
      : `<span class="ph-mini ph-mini-app">${ICONS[key]()}</span>`;
    if (extra === 'switch') {
      return `<li class="ph-row ph-set-row">${art}<span class="ph-set-label">${label}</span>
        <button type="button" class="ph-switch" role="switch" aria-checked="${kit.state.airplane}" aria-label="${label}"><span class="ph-switch-track"><span>OUI</span><i></i><span>NON</span></span></button></li>`;
    }
    return `<li><button type="button" class="ph-row ph-set-row">${art}<span class="ph-set-label">${label}</span>${extra ? `<small>${extra}</small>` : ''}<span class="ph-chev">${GLYPHS.chevron}</span></button></li>`;
  };
  host.innerHTML = `<section class="ph-page ph-settings">
    ${nav({ title: 'Réglages' })}
    <div class="ph-scroll">${SETTINGS.map((group) => `<ul class="ph-group">${group.map(row).join('')}</ul>`).join('')}
      <p class="ph-set-foot">Version 1.0 · 4 Go</p>
    </div>
  </section>`;
  const sw = host.querySelector('.ph-switch');
  const sync = () => {
    sw.classList.toggle('is-on', kit.state.airplane);
    sw.setAttribute('aria-checked', String(kit.state.airplane));
  };
  sw.addEventListener('click', () => {
    kit.audio.tap();
    kit.setAirplane(!kit.state.airplane);
    sync();
  });
  host.querySelectorAll('button.ph-set-row').forEach((btn) =>
    btn.addEventListener('click', () => {
      kit.audio.tap();
      btn.classList.remove('is-flash');
      void btn.offsetWidth;
      btn.classList.add('is-flash');
    }),
  );
  sync();
}

// ——— Météo ———

const SKY = {
  sun: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="7" fill="#ffd23f"/><g stroke="#ffd23f" stroke-width="2.2" stroke-linecap="round"><path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1"/></g></svg>',
  cloud: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 25h15a5.5 5.5 0 0 0 .4-11A7.5 7.5 0 0 0 10 13.6 5.7 5.7 0 0 0 9 25z" fill="#f2f6fb"/></svg>',
  mixed: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="11" r="6" fill="#ffd23f"/><path d="M11 27h14a5 5 0 0 0 .4-10A7 7 0 0 0 12 16.4 5.3 5.3 0 0 0 11 27z" fill="#f2f6fb"/></svg>',
  rain: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 20h15a5.5 5.5 0 0 0 .4-11A7.5 7.5 0 0 0 10 8.6 5.7 5.7 0 0 0 9 20z" fill="#dfe7f1"/><path d="M11 23l-1.5 4M17 23l-1.5 4M23 23l-1.5 4" stroke="#7cc4ff" stroke-width="2" stroke-linecap="round"/></svg>',
};

function weather(host) {
  const days = [
    ['mercredi', 'rain', 8, 4],
    ['jeudi', 'cloud', 7, 3],
    ['vendredi', 'mixed', 9, 2],
    ['samedi', 'sun', 10, 1],
    ['dimanche', 'mixed', 8, 2],
    ['lundi', 'rain', 6, 3],
  ];
  host.innerHTML = `<section class="ph-page ph-weather">
    <div class="ph-wx-card">
      <div class="ph-wx-now">
        <div><b>Paris</b><small>Max. 9° Min. 3°</small></div>
        <span class="ph-wx-icon">${SKY.mixed}</span>
        <span class="ph-wx-temp">6°</span>
      </div>
      <ul class="ph-wx-days">${days
        .map(([d, s, hi, lo]) => `<li><span>${d}</span><span class="ph-wx-small">${SKY[s]}</span><b>${hi}</b><small>${lo}</small></li>`)
        .join('')}</ul>
      <p class="ph-wx-foot"><span>Mis à jour le 9/1/07 à 9:40</span><span class="ph-wx-info" aria-hidden="true">i</span></p>
    </div>
    <p class="ph-wx-dots" aria-hidden="true"><i class="on"></i><i></i><i></i></p>
  </section>`;
}

// ——— Navigateur : le Web complet… par le réseau EDGE ———

function browser(host, kit) {
  host.innerHTML = `<section class="ph-page ph-web">
    <header class="ph-web-bar">
      <p class="ph-web-title">Chargement…</p>
      <div class="ph-web-row">
        <span class="ph-web-url"><i class="ph-web-progress"></i><span>http://www.chronique.2007/</span></span>
        <span class="ph-web-stop" aria-hidden="true">✕</span>
      </div>
    </header>
    <article class="ph-web-page" hidden>
      <p class="ph-web-mast">La Chronique<small>mardi 9 janvier 2007</small></p>
      <h3>Un téléphone sans clavier ? Les experts restent sceptiques</h3>
      <div class="ph-web-pic" aria-hidden="true">${ICONS.phone()}</div>
      <p>Tout se ferait du bout des doigts : glisser, pincer, toucher. Mais qui voudra taper ses messages sur une vitre ?</p>
      <p class="ph-web-more">Lire la suite ›</p>
    </article>
    <footer class="ph-web-tools" aria-hidden="true">${GLYPHS.back}${GLYPHS.forward}${GLYPHS.add}${GLYPHS.book}${GLYPHS.pages}</footer>
  </section>`;
  const bar = host.querySelector('.ph-web-progress');
  const page = host.querySelector('.ph-web-page');
  const title = host.querySelector('.ph-web-title');
  let p = 0;
  const timer = kit.ctx.interval(() => {
    p = Math.min(1, p + 0.035 + Math.random() * 0.05);
    bar.style.transform = `scaleX(${p})`;
    if (p < 1) return;
    kit.ctx.clear(timer);
    title.textContent = 'La Chronique — Une';
    host.querySelector('.ph-web-stop').textContent = '↻';
    bar.style.opacity = '0';
    page.hidden = false;
    play(page, fadeIn, { duration: 400 });
  }, 180);
  return {
    dispose: () => kit.ctx.clear(timer),
  };
}

// ——— Musique : un morceau original, joué au synthétiseur ———

const SONG = [
  ['C5', 0], ['E5', 0.24], ['G5', 0.48], ['C6', 0.72],
  ['B5', 0.96], ['G5', 1.2], ['E5', 1.44], ['G5', 1.68],
  ['A5', 1.92], ['F5', 2.16], ['D5', 2.4], ['F5', 2.64],
  ['G5', 2.88, 0.6], ['E5', 3.36], ['D5', 3.6], ['C5', 3.84, 0.9],
];
const BASS = [['C3', 0, 0.9], ['G2', 0.96, 0.9], ['F2', 1.92, 0.9], ['G2', 2.88, 0.9], ['C3', 3.84, 1.1]];
const SONG_LENGTH = 4.8;

function cover() {
  const id = ids('cv');
  const rings = Array.from({ length: 9 }, (_, i) => `<circle cx="160" cy="160" r="${26 + i * 17}" fill="none" stroke="#fff" stroke-opacity="${(0.42 - i * 0.04).toFixed(2)}" stroke-width="${(3 - i * 0.25).toFixed(2)}"/>`).join('');
  return `<svg viewBox="0 0 320 320" aria-hidden="true">
    <defs>
      ${lg(id('bg'), [[0, '#2b1a6b'], [0.5, '#7c2a8f'], [1, '#e2457a']], [0, 0, 1, 1])}
      ${rg(id('core'), [[0, '#fff6d6'], [0.4, '#ffb35c', 0.8], [1, '#ff5f8a', 0]])}
    </defs>
    <rect width="320" height="320" fill="url(#${id('bg')})"/>
    ${rings}
    <circle cx="160" cy="160" r="80" fill="url(#${id('core')})"/>
    <path d="M160 160 L160 92 M160 160 L208 182" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <text x="22" y="290" font-size="30" font-weight="700" fill="#fff" fill-opacity=".9">Les Voyageurs</text>
  </svg>`;
}

function music(host, kit) {
  host.innerHTML = `<section class="ph-page ph-music">
    ${nav({ title: '<small>Les Voyageurs</small>Saut temporel<small>2007</small>', style: 'clear' })}
    <div class="ph-cover">${cover()}<div class="ph-cover-reflect" aria-hidden="true"></div></div>
    <div class="ph-player">
      <div class="ph-progress" aria-hidden="true"><span class="ph-time-a">0:00</span><span class="ph-bar"><i></i></span><span class="ph-time-b">−0:05</span></div>
      <div class="ph-transport">
        <button type="button" class="ph-tp" aria-label="Morceau précédent">${GLYPHS.prev}</button>
        <button type="button" class="ph-tp ph-tp-play" aria-label="Lecture">${GLYPHS.play}</button>
        <button type="button" class="ph-tp" aria-label="Morceau suivant">${GLYPHS.next}</button>
      </div>
      <div class="ph-volume" aria-hidden="true"><span>◂</span><span class="ph-vol-track"><i></i></span><span>▸</span></div>
    </div>
  </section>`;
  const btn = host.querySelector('.ph-tp-play');
  const fill = host.querySelector('.ph-bar i');
  const timeA = host.querySelector('.ph-time-a');
  const timeB = host.querySelector('.ph-time-b');
  let bus = null;
  let timer = 0;
  let t0 = 0;

  const stop = () => {
    bus?.stop(0.1);
    bus = null;
    kit.ctx.clear(timer);
    timer = 0;
    btn.innerHTML = GLYPHS.play;
    btn.setAttribute('aria-label', 'Lecture');
    fill.style.transform = 'scaleX(0)';
    timeA.textContent = '0:00';
    timeB.textContent = '−0:05';
  };
  const start = () => {
    bus = kit.audio.bus(1);
    const dest = bus?.node;
    SONG.forEach(([note, at, len = 0.26]) => kit.audio.melody([[note, at, len]], { type: 'triangle', vol: 0.07, dest }));
    SONG.forEach(([note, at, len = 0.2]) => kit.audio.melody([[note, at + 0.012, len]], { type: 'sine', vol: 0.02, dest, detune: 1200 }));
    BASS.forEach(([note, at, len]) => kit.audio.melody([[note, at, len]], { type: 'sine', vol: 0.06, dest }));
    t0 = performance.now();
    btn.innerHTML = GLYPHS.pause;
    btn.setAttribute('aria-label', 'Pause');
    timer = kit.ctx.interval(() => {
      const t = (performance.now() - t0) / 1000;
      fill.style.transform = `scaleX(${Math.min(1, t / SONG_LENGTH)})`;
      timeA.textContent = `0:0${Math.min(5, Math.floor(t))}`;
      timeB.textContent = `−0:0${Math.max(0, Math.ceil(SONG_LENGTH - t))}`;
      if (t >= SONG_LENGTH) stop();
    }, 100);
  };
  btn.addEventListener('click', () => (bus || timer ? stop() : start()));
  host.querySelectorAll('.ph-tp:not(.ph-tp-play)').forEach((b) =>
    b.addEventListener('click', () => {
      kit.audio.tap();
      if (bus) {
        stop();
        start();
      }
    }),
  );
  return { dispose: () => bus?.stop(0.05) };
}

export const MINI_APPS = { messages, calendar, notes, clock, calc, settings, weather, browser, music };
