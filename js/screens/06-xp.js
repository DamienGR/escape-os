// Écran 6 — Windows XP (étape éclair) : ouvrir sa session sur l'écran d'accueil,
// puis réveiller un contact « Absent » de la messagerie en lui envoyant un Wizz.

import { createDesktop } from '../ui/windows.js';
import { ARROW, HAND, HOURGLASS, svgCursor } from '../ui/pixel.js';
import { DEFS, avatar, icon, wallpaper } from './xp/art.js';
import { TASKBAR_H, createShell } from './xp/shell.js';
import { createMessenger } from './xp/messenger.js';

// Résolutions de l'époque : on garde la plus fine qui reste lisible sur l'écran
// du joueur (1024 × 768 sur ordinateur, 800 × 600 sur un petit portable,
// 512 × 384 sur téléphone), comme on choisissait sa résolution en 2001.
const RESOLUTIONS = [1024, 800, 640, 512, 448];
const READABLE = 0.66;

let WALLPAPER = null;

const wordmark = (edition = '') => `
  <div class="xp-wordmark">
    <span class="xp-wm-name">Windows<sup>xp</sup></span>
    ${edition ? `<span class="xp-wm-ed">${edition}</span>` : ''}
  </div>`;

const USERS = [
  { id: 'voyageur', name: 'Voyageur', pic: 'duck' },
  { id: 'invite', name: 'Invité', pic: 'knight' },
];

export default {
  id: 'xp',
  era: 'Windows XP',
  year: 2001,

  mount(root, ctx) {
    const { audio } = ctx;
    root.classList.add('xp');
    root.style.setProperty('--cursor', svgCursor(ARROW, 0, 0, 'default'));
    root.style.setProperty('--cursor-hand', svgCursor(HAND, 5, 0, 'pointer'));
    root.style.setProperty('--cursor-busy', svgCursor(HOURGLASS, 6, 11, 'wait'));
    root.innerHTML = `${DEFS}<div class="xp-ui"></div>`;
    const ui = root.querySelector('.xp-ui');
    const view = { w: 0, h: 0 };
    let desk = null;
    let shell = null;
    let im = null;
    let bin = null;
    let phase = 'boot';

    const busy = (on) => root.classList.toggle('is-busy', on);

    // ——— Résolution d'affichage ———

    function fit() {
      const scale = ctx.scale || 1;
      const w = RESOLUTIONS.find((r) => (scale * 1024) / r >= READABLE) ?? RESOLUTIONS.at(-1);
      if (w === view.w) return;
      view.w = w;
      view.h = Math.round(w * 0.75);
      ui.style.width = `${view.w}px`;
      ui.style.height = `${view.h}px`;
      ui.style.transform = w === 1024 ? '' : `scale(${1024 / w})`;
      ui.dataset.res = `${view.w}x${view.h}`;
      root.classList.toggle('xp-small', w < 800);
      root.classList.toggle('xp-tiny', w < 640);
      if (desk) relayout();
    }

    function relayout() {
      shell?.relayout();
      im?.relayout();
      const area = { w: view.w, h: view.h - TASKBAR_H };
      for (const win of desk.windows) {
        if (win.maximized) {
          win.move(0, 0);
          win.resize(area.w, area.h);
          continue;
        }
        const w = Math.min(win.w, area.w);
        const h = win.h === 'auto' ? 'auto' : Math.min(win.h, area.h);
        win.resize(w, h);
        win.move(Math.max(0, Math.min(win.x, area.w - w)), Math.max(0, Math.min(win.y, area.h - 40)));
      }
      if (bin) {
        bin.style.left = `${view.w - 84}px`;
        bin.style.top = `${view.h - TASKBAR_H - 80}px`;
      }
    }

    fit();
    ctx.onResize(fit);

    // ——— Démarrage ———

    async function boot() {
      busy(true);
      ui.innerHTML = `
        <div class="xp-boot">
          <div class="xp-boot-mark">${wordmark('Édition familiale')}</div>
          <div class="xp-boot-bar" role="progressbar" aria-label="Démarrage de Windows"><span class="xp-boot-run"><i></i><i></i><i></i></span></div>
          <p class="xp-boot-copy">Copyright © 1985-2001 · recréation pédagogique</p>
        </div>`;
      audio.hdd(2);
      await ctx.wait(3000, { skippable: true });
      ui.innerHTML = '<div class="xp-black"></div>';
      await ctx.wait(400, { skippable: true });
      welcome();
    }

    // ——— Écran d'accueil ———

    function welcome() {
      phase = 'welcome';
      busy(false);
      ui.innerHTML = `
        <div class="xp-welcome">
          <div class="xp-wl-top"></div>
          <div class="xp-wl-mid">
            <div class="xp-wl-left">
              ${wordmark()}
              <p class="xp-wl-hint">Pour commencer, cliquez sur votre nom d’utilisateur</p>
            </div>
            <i class="xp-wl-sep" aria-hidden="true"></i>
            <ul class="xp-wl-users" aria-label="Comptes d’utilisateurs">
              ${USERS.map(
                (u) => `<li><button type="button" class="xp-user" data-user="${u.id}">
                  <span class="xp-user-pic">${avatar(u.pic, 48)}</span>
                  <span class="xp-user-text"><b>${u.name}</b><small></small></span>
                </button></li>`,
              ).join('')}
            </ul>
          </div>
          <div class="xp-wl-bottom">
            <button type="button" class="xp-wl-off">${icon('power', 26)}<span>Arrêter l’ordinateur</span></button>
            <p class="xp-wl-info">Après avoir ouvert une session, vous pouvez ajouter ou modifier des comptes.<br>Il suffit d’aller dans le Panneau de configuration et de cliquer sur Comptes d’utilisateurs.</p>
          </div>
        </div>`;
      const screen = ui.querySelector('.xp-welcome');
      const tiles = [...screen.querySelectorAll('.xp-user')];
      tiles.forEach((tile, i) => {
        tile.addEventListener('click', () => (tile.dataset.user === 'voyageur' ? login(tile) : guest(tile)));
        tile.addEventListener('keydown', (event) => {
          const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
          if (!step) return;
          event.preventDefault();
          tiles[(i + step + tiles.length) % tiles.length].focus();
        });
      });
      screen.querySelector('.xp-wl-off').addEventListener('click', (event) => {
        audio.click();
        bubble(event.currentTarget, 'Arrêter l’ordinateur ?', 'Pas maintenant : le voyage dans le temps n’est pas terminé !');
      });
      setTimeout(() => phase === 'welcome' && tiles[0].focus({ preventScroll: true }), 60);
    }

    // Bulle d'info de l'écran d'accueil (la coquille n'existe pas encore)
    function bubble(anchor, title, text) {
      ui.querySelector('.xp-balloon')?.remove();
      const el = document.createElement('div');
      el.className = 'xp-balloon is-below xp-balloon-welcome';
      el.setAttribute('role', 'status');
      el.innerHTML = `<p class="xp-balloon-title">${icon('info', 16)}<b>${title}</b></p><p class="xp-balloon-text">${text}</p>`;
      ui.append(el);
      const u = ui.getBoundingClientRect();
      const r = anchor.getBoundingClientRect();
      const s = u.width / ui.offsetWidth || 1;
      const x = Math.min((r.left - u.left) / s + 20, view.w - el.offsetWidth - 8);
      const above = (r.top - u.top) / s > view.h * 0.6;
      el.classList.toggle('is-below', !above);
      el.classList.toggle('is-above', above);
      el.style.left = `${x}px`;
      el.style.top = above ? `${(r.top - u.top) / s - el.offsetHeight - 10}px` : `${(r.bottom - u.top) / s + 8}px`;
      el.style.setProperty('--tail', '24px');
      ctx.timeout(() => el.remove(), 5000);
    }

    function guest(tile) {
      audio.winError();
      tile.classList.remove('is-denied');
      void tile.offsetWidth;
      tile.classList.add('is-denied');
      bubble(tile, 'Compte Invité désactivé', 'Le voyageur temporel, c’est vous ! Cliquez sur « Voyageur ».');
    }

    async function login(tile) {
      if (phase !== 'welcome') return;
      phase = 'login';
      audio.click();
      ctx.progress();
      ui.querySelector('.xp-balloon')?.remove();
      const screen = ui.querySelector('.xp-welcome');
      screen.classList.add('is-busy');
      tile.classList.add('is-selected');
      tile.querySelector('small').textContent = 'Chargement de vos paramètres personnels…';
      busy(true);
      await ctx.wait(1500, { skippable: true });
      ui.innerHTML = `
        <div class="xp-welcome xp-hello">
          <div class="xp-wl-top"></div>
          <div class="xp-wl-mid"><p class="xp-hello-text">bienvenue</p></div>
          <div class="xp-wl-bottom"></div>
        </div>`;
      await ctx.wait(1700, { skippable: true });
      buildDesktop();
    }

    // ——— Bureau ———

    function buildDesktop() {
      phase = 'desktop';
      ui.innerHTML = '<div class="xp-desktop"></div>';
      const deskEl = ui.querySelector('.xp-desktop');
      deskEl.style.backgroundImage = WALLPAPER ??= wallpaper();
      desk = createDesktop(deskEl, {
        theme: 'xp',
        drag: 'live',
        workArea: () => ({ x: 0, y: 0, w: view.w, h: view.h - TASKBAR_H }),
      });
      shell = createShell({ ui, desk, ctx, view, actions: { messenger: () => im?.openContacts() } });
      im = createMessenger({ ui, desk, shell, ctx, view });

      const icons = [
        ['computer', 'Poste de travail', () => shell.explore('computer')],
        ['documents', 'Mes documents', () => shell.explore('documents')],
        ['messenger', 'Messagerie', () => im.openContacts()],
      ];
      icons.forEach(([name, label, open], i) =>
        desk.icon({ label, svg: icon(name, 32), x: 6, y: 8 + i * 76, className: 'xp-icon', onOpen: open }),
      );
      bin = desk.icon({
        label: 'Corbeille',
        svg: icon('bin', 32),
        x: view.w - 84,
        y: view.h - TASKBAR_H - 80,
        className: 'xp-icon',
        onOpen: () => shell.explore('bin'),
      });

      audio.chime('xp');
      busy(false);
      ctx.hints.onReveal((level) => im?.onHint(level));
      ctx.timeout(() => im.start(), 1500);
      ctx.timeout(() => shell.el.querySelector('.xp-task')?.focus({ preventScroll: true }), 1600);
    }

    boot().catch(() => {});

    return () => {
      im?.destroy();
      shell?.destroy();
      desk?.destroy();
    };
  },
};
