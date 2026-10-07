// Interface du voyageur, identique à toutes les époques : frise des 10 époques,
// année courante, chrono, carnet, indices, son. Style 2026, une seule couleur d'accent.

import { ERAS } from '../data/eras.js';
import { FACTS } from '../data/facts.js';
import { state, formatTime } from './state.js';
import { audio } from './audio.js';

const ICONS = {
  notebook:
    '<path d="M6 3.5h11.5v17H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z"/><path d="M8.5 8h6M8.5 11.5h4"/><path d="M4.5 17.5h13"/>',
  hint: '<path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5.9 1.1.9 1.9v.1h5v-.1c0-.8.3-1.4.9-1.9A5.8 5.8 0 0 0 12 3.5Z"/>',
  soundOn:
    '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  soundOff: '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4H4Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  menu: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  arrow: '<path d="M5 12h13.5"/><path d="m13 6.5 5.5 5.5-5.5 5.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  print: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8.5" rx="2"/><path d="M7 14h10v6.5H7z"/>',
};

export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const LOGO = `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
  <rect x="2" y="3" width="28" height="26" rx="7" fill="currentColor" opacity=".16"/>
  <rect x="4.5" y="4.5" width="23" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="16" y="17.6" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor" font-family="Inter, system-ui, sans-serif">esc</text>
</svg>`;

let els = {};
let handlers = {};
let hints = null;
let locked = false;
let currentIndex = 0;
let toastTimer = 0;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function initHud(options) {
  handlers = options;
  const hud = document.getElementById('hud');
  hud.innerHTML = `
    <div class="hud-bar">
      <div class="hud-brand">${LOGO}<span>Escape OS</span></div>
      <div class="hud-era" aria-live="polite">
        <span class="hud-year">1965</span>
        <span class="hud-system">Cartes perforées</span>
      </div>
      <nav class="tl" aria-label="Frise des époques">
        <div class="tl-track"><i class="tl-fill"></i></div>
        <ol>
          ${ERAS.map(
            (era, i) => `<li><button class="tl-node" type="button" data-index="${i}"
              aria-label="${escapeHtml(`${era.label} · ${era.system}`)}">
              <span class="tl-dot"></span>
              <span class="tl-tip"><b>${escapeHtml(era.label)}</b>${escapeHtml(era.system)}</span>
            </button></li>`,
          ).join('')}
        </ol>
      </nav>
      <div class="hud-actions">
        <span class="hud-chrono" title="Temps de jeu"><span class="sr-only">Temps de jeu : </span><span class="chrono-value">0:00</span></span>
        <button class="hud-btn" type="button" data-action="notebook" aria-label="Carnet du voyageur" aria-expanded="false">
          ${icon('notebook')}<span class="badge" hidden>0</span>
        </button>
        <button class="hud-btn" type="button" data-action="hint" aria-label="Indice" aria-expanded="false">${icon('hint')}</button>
        <button class="hud-btn" type="button" data-action="sound" aria-label="Couper le son" aria-pressed="true">
          ${icon('soundOn', 'when-on')}${icon('soundOff', 'when-off')}
        </button>
        <button class="hud-btn" type="button" data-action="menu" aria-label="Menu" aria-expanded="false">${icon('menu')}</button>
      </div>
    </div>`;

  const overlays = document.getElementById('overlays');
  overlays.insertAdjacentHTML(
    'beforeend',
    `
    <aside class="drawer" id="notebook" aria-labelledby="nb-title" hidden>
      <header class="drawer-head">
        <h2 id="nb-title">Carnet du voyageur</h2>
        <button class="icon-btn" type="button" data-close aria-label="Fermer le carnet">${icon('close')}</button>
      </header>
      <p class="drawer-intro">Chaque indice trouvé s’y note tout seul : commande, mot de passe, numéro…</p>
      <ol class="nb-list"></ol>
      <p class="nb-empty">Rien pour l’instant. Ouvre l’œil !</p>
    </aside>
    <section class="popover hint-pop" id="hint-pop" role="dialog" aria-labelledby="hint-title" hidden>
      <header class="pop-head"><h2 id="hint-title">Indices</h2><span class="hint-count"></span></header>
      <ol class="hint-list"></ol>
      <button class="btn btn-small btn-primary hint-more" type="button"></button>
      <p class="hint-done" hidden>Tous les indices sont affichés.</p>
    </section>
    <section class="popover menu-pop" id="menu-pop" role="menu" aria-label="Menu" hidden>
      <button type="button" role="menuitem" data-menu="visit">Mode visite <small>aller à une époque</small></button>
      <button type="button" role="menuitem" data-menu="facts">Fiches « Le saviez-vous ? » <small>mode classe</small></button>
      <button type="button" role="menuitem" data-menu="fullscreen">Plein écran</button>
      <button type="button" role="menuitem" data-menu="credits">Crédits</button>
      <hr>
      <button type="button" role="menuitem" data-menu="title">Écran titre</button>
      <button type="button" role="menuitem" data-menu="restart" class="danger">Recommencer la partie</button>
    </section>
    <div class="toasts" aria-live="polite"></div>`,
  );

  els = {
    hud,
    year: hud.querySelector('.hud-year'),
    system: hud.querySelector('.hud-system'),
    nodes: [...hud.querySelectorAll('.tl-node')],
    fill: hud.querySelector('.tl-fill'),
    chrono: hud.querySelector('.chrono-value'),
    badge: hud.querySelector('.badge'),
    btn: Object.fromEntries([...hud.querySelectorAll('[data-action]')].map((b) => [b.dataset.action, b])),
    notebook: document.getElementById('notebook'),
    nbList: document.querySelector('.nb-list'),
    nbEmpty: document.querySelector('.nb-empty'),
    hintPop: document.getElementById('hint-pop'),
    menuPop: document.getElementById('menu-pop'),
    toasts: document.querySelector('.toasts'),
  };

  hud.addEventListener('click', (event) => {
    const node = event.target.closest('.tl-node');
    if (node) {
      if (!locked) handlers.onNavigate?.(Number(node.dataset.index));
      return;
    }
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    audio.click();
    const action = btn.dataset.action;
    if (action === 'notebook') togglePanel('notebook');
    if (action === 'hint') toggleHints();
    if (action === 'sound') handlers.onSound?.();
    if (action === 'menu') togglePanel('menu');
  });

  els.notebook.querySelector('[data-close]').addEventListener('click', () => closePanels());
  els.hintPop.querySelector('.hint-more').addEventListener('click', () => {
    audio.click();
    hints?.reveal();
  });
  els.menuPop.addEventListener('click', (event) => {
    const item = event.target.closest('[data-menu]');
    if (!item) return;
    audio.click();
    closePanels();
    handlers.onMenu?.(item.dataset.menu);
  });

  // Fermeture au clic extérieur et à Échap
  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.popover, .drawer, #hud, .modal')) return;
    closePanels();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePanels();
  });

  refreshNotebook();
  setSound(state.sound);
}

export function setVisible(visible) {
  els.hud.hidden = !visible;
  document.body.classList.toggle('hud-off', !visible);
}

export function lock(value) {
  locked = value;
  els.hud.classList.toggle('locked', value);
  els.btn.hint.disabled = value;
}

export function setEra(era, index) {
  currentIndex = index;
  els.year.textContent = era.label === String(era.year) ? era.year : era.label;
  els.system.textContent = era.system;
  els.btn.hint.classList.remove('suggest');
  updateTimeline();
}

export function updateTimeline() {
  const reached = Math.max(state.reached, currentIndex);
  els.nodes.forEach((node, i) => {
    const era = ERAS[i];
    const done = state.stats[era.id]?.done;
    node.classList.toggle('is-current', i === currentIndex);
    node.classList.toggle('is-done', Boolean(done) && i !== currentIndex);
    node.classList.toggle('is-locked', i > reached);
    if (i === currentIndex) node.setAttribute('aria-current', 'step');
    else node.removeAttribute('aria-current');
  });
  els.fill.style.transform = `scaleX(${currentIndex / (ERAS.length - 1)})`;
}

export function setChrono(ms) {
  if (els.chrono) els.chrono.textContent = formatTime(ms);
}

export function setSound(on) {
  const btn = els.btn?.sound;
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(on));
  btn.setAttribute('aria-label', on ? 'Couper le son' : 'Activer le son');
  btn.classList.toggle('is-off', !on);
}

// ——— Panneaux ———

function setExpanded(name, open) {
  const btn = els.btn[name === 'hint' ? 'hint' : name];
  btn?.setAttribute('aria-expanded', String(open));
}

export function closePanels() {
  for (const [name, el] of [
    ['notebook', els.notebook],
    ['hint', els.hintPop],
    ['menu', els.menuPop],
  ]) {
    if (!el.hidden) {
      el.classList.remove('open');
      el.hidden = true;
      setExpanded(name, false);
    }
  }
}

function togglePanel(name) {
  const el = name === 'notebook' ? els.notebook : name === 'menu' ? els.menuPop : els.hintPop;
  const open = el.hidden;
  closePanels();
  if (!open) return;
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add('open');
  setExpanded(name, true);
  if (name === 'notebook') els.btn.notebook.querySelector('.badge').classList.remove('fresh');
  el.querySelector('button, [tabindex]')?.focus({ preventScroll: true });
}

// ——— Carnet ———

export function refreshNotebook(fresh) {
  if (!els.nbList) return;
  const notes = state.notes;
  els.nbList.innerHTML = notes
    .map((note) => {
      const era = ERAS.find((e) => e.id === note.era);
      return `<li class="nb-item${fresh && note.key === fresh.key ? ' is-fresh' : ''}">
        <span class="nb-era">${escapeHtml(era ? era.label : '')}</span>
        ${note.label ? `<span class="nb-label">${escapeHtml(note.label)}</span>` : ''}
        <span class="nb-text">${escapeHtml(note.text)}</span>
      </li>`;
    })
    .join('');
  els.nbEmpty.hidden = notes.length > 0;
  els.badge.hidden = notes.length === 0;
  els.badge.textContent = notes.length;
  if (fresh) {
    els.badge.classList.remove('fresh');
    void els.badge.offsetWidth;
    els.badge.classList.add('fresh');
  }
}

// ——— Indices ———

export function setHints(engine) {
  hints = engine;
  renderHints();
}

export function renderHints() {
  if (!hints || !els.hintPop) return;
  const revealed = hints.revealed();
  els.hintPop.querySelector('.hint-count').textContent = `${revealed.length} / ${hints.max}`;
  els.hintPop.querySelector('.hint-list').innerHTML = revealed
    .map((text, i) => `<li><span class="hint-level">${i + 1}</span><p>${escapeHtml(text)}</p></li>`)
    .join('');
  const more = els.hintPop.querySelector('.hint-more');
  const done = revealed.length >= hints.max;
  more.hidden = done;
  more.textContent = revealed.length ? `Indice suivant (${revealed.length + 1}/${hints.max})` : 'Afficher un indice';
  els.hintPop.querySelector('.hint-done').hidden = !done;
}

function toggleHints() {
  els.btn.hint.classList.remove('suggest');
  const opening = els.hintPop.hidden;
  if (opening && hints && hints.level === 0) hints.reveal();
  renderHints();
  togglePanel('hint');
}

export function suggestHint() {
  if (locked || !els.btn.hint) return;
  if (!els.hintPop.hidden) return;
  els.btn.hint.classList.add('suggest');
  toast('Besoin d’un coup de pouce ? Un indice t’attend.', { icon: 'hint', action: { label: 'Voir', run: toggleHints } });
}

// ——— Toasts ———

export function toast(text, { icon: iconName, action, duration = 3600 } = {}) {
  if (!els.toasts) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${iconName ? icon(iconName) : ''}<span>${escapeHtml(text)}</span>`;
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.run();
      el.remove();
    });
    el.append(btn);
  }
  els.toasts.append(el);
  requestAnimationFrame(() => el.classList.add('in'));
  clearTimeout(toastTimer);
  setTimeout(() => {
    el.classList.remove('in');
    el.classList.add('out');
    setTimeout(() => el.remove(), 400);
  }, duration);
  while (els.toasts.children.length > 3) els.toasts.firstElementChild.remove();
}

// ——— Fenêtres modales ———

function modal(html, { className = '', labelledBy, onKey } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = `modal-backdrop ${className}`;
  backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" ${labelledBy ? `aria-labelledby="${labelledBy}"` : ''}>${html}</section>`;
  document.getElementById('overlays').append(backdrop);
  const previous = document.activeElement;
  requestAnimationFrame(() => backdrop.classList.add('open'));
  const close = () => {
    backdrop.classList.remove('open');
    backdrop.classList.add('closing');
    document.removeEventListener('keydown', keyHandler, true);
    setTimeout(() => backdrop.remove(), 320);
    if (previous && previous.focus) previous.focus({ preventScroll: true });
  };
  const keyHandler = (event) => {
    if (event.key === 'Tab') {
      const focusables = [...backdrop.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    onKey?.(event);
    event.stopPropagation();
  };
  document.addEventListener('keydown', keyHandler, true);
  return { el: backdrop, close };
}

export function showFact(era, next) {
  const fact = FACTS[era.id];
  return new Promise((resolve) => {
    const nextYear = next.label === String(next.year) ? next.year : next.label;
    const { el, close } = modal(
      `<div class="fact">
        <header class="fact-head">
          <span class="kicker">${icon('hint')} Le saviez-vous ?</span>
          <span class="chip">${escapeHtml(era.label)} · ${escapeHtml(era.system)}</span>
        </header>
        <h2 id="fact-title">${escapeHtml(fact.title)}</h2>
        <ul class="fact-lines">${fact.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
        <p class="fact-gesture">${icon('check')}<span>Geste appris : <b>${escapeHtml(era.gesture)}</b></span></p>
        <footer class="modal-actions">
          <button class="btn btn-ghost" type="button" data-act="skip">Passer</button>
          <button class="btn btn-primary" type="button" data-act="go">Cap sur ${escapeHtml(nextYear)} ${icon('arrow')}</button>
        </footer>
      </div>`,
      {
        className: 'fact-backdrop',
        labelledBy: 'fact-title',
        onKey: (event) => {
          if (event.key === 'Escape') finish();
        },
      },
    );
    const finish = () => {
      audio.click();
      close();
      resolve();
    };
    el.querySelectorAll('[data-act]').forEach((btn) => btn.addEventListener('click', finish));
    setTimeout(() => el.querySelector('[data-act="go"]').focus({ preventScroll: true }), 60);
    audio.success();
  });
}

export function confirmDialog({ title, text, ok = 'Confirmer', cancel = 'Annuler', danger = false }) {
  return new Promise((resolve) => {
    const { el, close } = modal(
      `<h2 id="confirm-title">${escapeHtml(title)}</h2>
       <p>${escapeHtml(text)}</p>
       <footer class="modal-actions">
         <button class="btn btn-ghost" type="button" data-act="no">${escapeHtml(cancel)}</button>
         <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-act="yes">${escapeHtml(ok)}</button>
       </footer>`,
      {
        className: 'confirm-backdrop',
        labelledBy: 'confirm-title',
        onKey: (event) => {
          if (event.key === 'Escape') done(false);
        },
      },
    );
    const done = (value) => {
      close();
      resolve(value);
    };
    el.querySelector('[data-act="yes"]').addEventListener('click', () => done(true));
    el.querySelector('[data-act="no"]').addEventListener('click', () => done(false));
    el.addEventListener('pointerdown', (event) => {
      if (event.target === el) done(false);
    });
    setTimeout(() => el.querySelector('[data-act="yes"]').focus({ preventScroll: true }), 60);
  });
}

export function showVisitPicker(current, onPick) {
  const { el, close } = modal(
    `<header class="modal-head">
       <h2 id="visit-title">Mode visite</h2>
       <button class="icon-btn" type="button" data-close aria-label="Fermer">${icon('close')}</button>
     </header>
     <p class="modal-intro">Accès direct à chaque époque : idéal pour un visiteur pressé. La partie continue, mais elle ne sera pas classée.</p>
     <ol class="visit-grid">
       ${ERAS.map(
         (era, i) => `<li><button type="button" class="visit-card${i === current ? ' is-current' : ''}" data-index="${i}">
           <span class="visit-year">${escapeHtml(era.label)}</span>
           <span class="visit-system">${escapeHtml(era.system)}</span>
           <span class="visit-gesture">${escapeHtml(era.gesture)}</span>
         </button></li>`,
       ).join('')}
     </ol>`,
    { className: 'visit-backdrop', labelledBy: 'visit-title', onKey: (e) => e.key === 'Escape' && close() },
  );
  el.querySelector('[data-close]').addEventListener('click', close);
  el.addEventListener('pointerdown', (event) => {
    if (event.target === el) close();
  });
  el.querySelectorAll('.visit-card').forEach((card) =>
    card.addEventListener('click', () => {
      audio.click();
      close();
      onPick(Number(card.dataset.index));
    }),
  );
  setTimeout(() => el.querySelector('.visit-card')?.focus({ preventScroll: true }), 60);
}

export function showFactsSheet() {
  const { el, close } = modal(
    `<header class="modal-head">
       <h2 id="sheet-title">Les fiches du voyage</h2>
       <div class="modal-head-actions">
         <button class="btn btn-small btn-ghost" type="button" data-print>${icon('print')} Imprimer</button>
         <button class="icon-btn" type="button" data-close aria-label="Fermer">${icon('close')}</button>
       </div>
     </header>
     <p class="modal-intro">Mode classe : toutes les fiches « Le saviez-vous ? » sur une seule page, prête à imprimer.</p>
     <div class="sheet">
       ${ERAS.map(
         (era) => `<article class="sheet-item">
           <h3><span class="chip">${escapeHtml(era.label)}</span> ${escapeHtml(era.system)} — ${escapeHtml(FACTS[era.id].title)}</h3>
           <ul>${FACTS[era.id].lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
           <p class="sheet-gesture">Geste : ${escapeHtml(era.gesture)}</p>
         </article>`,
       ).join('')}
     </div>`,
    { className: 'sheet-backdrop', labelledBy: 'sheet-title', onKey: (e) => e.key === 'Escape' && close() },
  );
  el.querySelector('[data-close]').addEventListener('click', close);
  el.querySelector('[data-print]').addEventListener('click', () => {
    document.body.classList.add('printing-sheet');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-sheet'), 500);
  });
  el.addEventListener('pointerdown', (event) => {
    if (event.target === el) close();
  });
  return close;
}

export function showCredits() {
  const { el, close } = modal(
    `<header class="modal-head">
       <h2 id="credits-title">Crédits</h2>
       <button class="icon-btn" type="button" data-close aria-label="Fermer">${icon('close')}</button>
     </header>
     <div class="credits">
       <p><b>Escape OS</b>, un mini escape game pédagogique en HTML, CSS et JavaScript natifs : zéro dépendance, aucune étape de build.</p>
       <h3>Polices</h3>
       <ul>
         <li><b>Inter</b>, The Inter Project Authors — SIL Open Font License 1.1.</li>
         <li><b>Courier Prime</b>, The Courier Prime Project Authors — SIL Open Font License 1.1.</li>
         <li><b>Px437 IBM VGA 8x16</b>, VileR, Ultimate Oldschool PC Font Pack (int10h.org) — CC BY-SA 4.0.</li>
       </ul>
       <h3>Sons et images</h3>
       <p>Tous les sons sont synthétisés en direct avec Web Audio ; tous les décors, icônes et fonds d’écran sont des recréations « dans l’esprit ». Aucun logo, fond d’écran ni son d’origine.</p>
       <h3>Marques</h3>
       <p>Les noms de systèmes et de logiciels cités appartiennent à leurs propriétaires respectifs ; ils servent ici à raconter leur histoire.</p>
       <p><a href="making-of.html">Lire le making-of</a></p>
     </div>`,
    { className: 'credits-backdrop', labelledBy: 'credits-title', onKey: (e) => e.key === 'Escape' && close() },
  );
  el.querySelector('[data-close]').addEventListener('click', close);
  el.addEventListener('pointerdown', (event) => {
    if (event.target === el) close();
  });
}
