// Coquille des Windows 95 et 98 : bureau bleu-vert et ses icônes (qu'on peut
// déplacer, aligner, réorganiser), barre des tâches avec Démarrer, boutons des
// fenêtres ouvertes, barre de lancement rapide (98), zone de notification et
// horloge, menus contextuels (clic droit ou appui long), boîtes de dialogue.
// Les fenêtres viennent du gestionnaire partagé (ui/windows.js, thème win9x).

import { createDesktop, MSG_ICONS } from '../../ui/windows.js';
import { ARROW, HOURGLASS, HAND, pixelArt, svgCursor } from '../../ui/pixel.js';
import { ICONS } from '../../ui/icons.js';
import { createMenus, accelHtml } from './menu.js';
import { START_LOGO, ICON16, APPSTARTING } from './icons.js';

export const SCREEN_W = 640;
export const SCREEN_H = 480;
export const TASKBAR_H = 28;
const GRID = { x0: 4, y0: 4, w: 75, h: 70 };

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const IBEAM = pixelArt([9, 16], (p) =>
  p.map(0, 0, [
    'KKKK.KKKK',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    '....K....',
    'KKKK.KKKK',
  ]),
);

// Boutons radio et cases à cocher de l'époque, en pixel art
const radio = (checked) =>
  pixelArt(12, (p) => {
    const c = 5.5;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const d = Math.hypot(x - c, y - c);
        const topLeft = x - c + (y - c) < 0;
        if (d > 6.1) continue;
        if (d > 5.1) p.px(x, y, topLeft ? 'D' : 'W');
        else if (d > 4.1) p.px(x, y, topLeft ? 'K' : '#dfdfdf');
        else p.px(x, y, 'W');
      }
    }
    if (checked) p.map(4, 4, ['.KK.', 'KKKK', 'KKKK', '.KK.']);
  });

const checkbox = (checked, disabled = false) =>
  pixelArt(13, (p) => {
    p.rect(0, 0, 13, 13, 'W');
    p.hline(0, 0, 12, 'D');
    p.vline(0, 0, 12, 'D');
    p.rect(1, 1, 11, 11, '#dfdfdf');
    p.hline(1, 1, 10, 'K');
    p.vline(1, 1, 10, 'K');
    p.rect(2, 2, 9, 9, disabled ? 'L' : 'W');
    if (checked) p.map(3, 3, ['......K', '.....KK', 'K...KKK', 'KK.KKK.', 'KKKKK..', '.KKK...', '..K....'], { K: disabled ? 'D' : 'K' });
  });

const url = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const CONTROLS = {
  radio: url(radio(false)),
  'radio-on': url(radio(true)),
  check: url(checkbox(false)),
  'check-on': url(checkbox(true)),
  'check-dis': url(checkbox(false, true)),
  'check-on-dis': url(checkbox(true, true)),
};

export const CURSORS = {
  arrow: svgCursor(ARROW, 0, 0, 'default'),
  busy: svgCursor(HOURGLASS, 6, 11, 'wait'),
  working: svgCursor(APPSTARTING, 0, 0, 'progress'),
  hand: svgCursor(HAND, 5, 0, 'pointer'),
  text: svgCursor(IBEAM, 4, 8, 'text'),
};

// Les mois et jours de l'époque, pour l'infobulle de l'horloge
const pad = (n) => String(n).padStart(2, '0');

export function createShell(mountEl, ctx, options = {}) {
  const { audio } = ctx;
  const o = {
    variant: '95',
    banner: '',
    start: () => [],
    icons: [],
    quick: [],
    date: '',
    desktopMenu: null,
    ...options,
  };
  const abort = new AbortController();
  const { signal } = abort;
  const on = (target, type, fn, opts = {}) => target.addEventListener(type, fn, { ...opts, signal });
  const is98 = o.variant === '98';

  const el = document.createElement('div');
  el.className = `w9x w9x-${o.variant}`;
  for (const [name, value] of Object.entries(CURSORS)) el.style.setProperty(`--cur-${name}`, value);
  for (const [name, value] of Object.entries(CONTROLS)) el.style.setProperty(`--${name}`, value);
  el.innerHTML = `
    <div class="w9x-desktop"></div>
    <div class="w9x-taskbar" role="toolbar" aria-label="Barre des tâches">
      <button type="button" class="w9x-start" data-menu-owner aria-haspopup="menu" aria-expanded="false" aria-label="Démarrer">
        ${START_LOGO}<span>Démarrer</span>
      </button>
      ${is98 ? `<div class="w9x-quick" role="group" aria-label="Lancement rapide"><i class="w9x-grip"></i><span class="w9x-quick-btns"></span><i class="w9x-grip"></i></div>` : ''}
      <div class="w9x-tasks"></div>
      <div class="w9x-tray"><span class="w9x-tray-icons"></span><span class="w9x-clock" tabindex="0"></span></div>
    </div>
    <div class="w9x-sys"></div>`;
  mountEl.append(el);

  const deskEl = el.querySelector('.w9x-desktop');
  const sysEl = el.querySelector('.w9x-sys');
  const taskbar = el.querySelector('.w9x-taskbar');
  const startBtn = el.querySelector('.w9x-start');
  const tasksEl = el.querySelector('.w9x-tasks');
  const trayIcons = el.querySelector('.w9x-tray-icons');
  const clock = el.querySelector('.w9x-clock');

  const workArea = () => ({ x: 0, y: 0, w: SCREEN_W, h: SCREEN_H - TASKBAR_H });
  const desk = createDesktop(deskEl, { theme: 'win9x', variant: is98 ? '98' : undefined, drag: 'outline', workArea });
  const sys = createDesktop(sysEl, { theme: 'win9x', variant: is98 ? '98' : undefined, drag: 'outline' });

  const menus = createMenus(el, {
    variant: o.variant,
    signal,
    onClose: () => setStartPressed(false),
  });

  // ——— Curseurs ———

  let busyTimer = 0;
  function busy(ms = 600, kind = 'busy') {
    el.classList.remove('is-busy', 'is-working');
    el.classList.add(kind === 'busy' ? 'is-busy' : 'is-working');
    clearTimeout(busyTimer);
    busyTimer = setTimeout(() => el.classList.remove('is-busy', 'is-working'), ms);
  }

  // ——— Menu Démarrer ———

  function setStartPressed(pressed) {
    startBtn.classList.toggle('is-pressed', pressed);
    startBtn.setAttribute('aria-expanded', String(pressed));
  }

  function openStart({ keyboard = false } = {}) {
    if (menus.isOpen) {
      menus.close();
      return;
    }
    setStartPressed(true);
    startBtn.focus({ preventScroll: true });
    menus.open(o.start(), {
      x: 2,
      y: SCREEN_H - TASKBAR_H + 3,
      align: 'bottom',
      large: !o.smallIcons?.(),
      banner: o.banner,
      className: 'w9x-startmenu',
      keyboard,
      restoreFocus: startBtn,
    });
    o.onStart?.();
  }

  on(startBtn, 'pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    event.preventDefault();
    openStart();
  });
  on(startBtn, 'click', (event) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') return;
    openStart({ keyboard: event.detail === 0 });
  });
  on(startBtn, 'keydown', (event) => {
    if (event.key === 'ArrowUp' && !menus.isOpen) {
      event.preventDefault();
      openStart({ keyboard: true });
    }
  });
  // Ctrl+Échap ouvre le menu Démarrer, comme à l'époque.
  on(window, 'keydown', (event) => {
    if (event.key === 'Escape' && event.ctrlKey && el.isConnected && !el.hidden) {
      event.preventDefault();
      openStart({ keyboard: true });
    }
  });

  // ——— Boutons de la barre des tâches ———

  const onTaskbar = (win) => win.spec.taskbar !== false && !win.el.classList.contains('wm-dialog');

  function syncTasks() {
    const wins = desk.windows.filter(onTaskbar);
    const focused = desk.focused;
    tasksEl.innerHTML = '';
    for (const win of wins) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `w9x-task${win === focused && !win.minimized ? ' is-active' : ''}`;
      const title = win.el.querySelector('.wm-title')?.textContent ?? win.spec.title;
      btn.innerHTML = `<span class="w9x-task-icon">${win.spec.icon ?? ''}</span><span class="w9x-task-label">${esc(title)}</span>`;
      btn.title = title;
      btn.addEventListener('click', () => {
        audio.click();
        if (win === desk.focused && !win.minimized) win.minimize();
        else win.restore();
      });
      btn.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const pt = menus.point(event);
        contextMenu(windowMenu(win), pt.x, pt.y);
      });
      win.taskBtn = btn;
      tasksEl.append(btn);
    }
  }

  // Animation de réduction : un rectangle file vers le bouton de la tâche.
  function zoomRect(from, to) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !from || !to) return;
    const rect = document.createElement('div');
    rect.className = 'w9x-zoomrect';
    el.append(rect);
    rect.animate(
      [
        { left: `${from.x}px`, top: `${from.y}px`, width: `${from.w}px`, height: `${from.h}px` },
        { left: `${to.x}px`, top: `${to.y}px`, width: `${to.w}px`, height: `${to.h}px` },
      ],
      { duration: 180, easing: 'linear' },
    ).onfinish = () => rect.remove();
  }

  const taskRect = (win) => {
    const btn = win.taskBtn;
    if (!btn) return { x: 80, y: SCREEN_H - 24, w: 120, h: 20 };
    return { x: btn.offsetLeft, y: SCREEN_H - TASKBAR_H + 4, w: btn.offsetWidth, h: 18 };
  };
  const winRect = (win) => ({ x: win.x, y: win.y, w: win.el.offsetWidth || win.w, h: 18 });

  desk.on('open', (win) => {
    // Réduction animée et retour du focus à la fenêtre suivante
    const minimize = win.minimize;
    win.minimize = () => {
      if (win.minimized) return;
      const from = winRect(win);
      minimize();
      zoomRect(from, taskRect(win));
      const next = desk.windows.filter((w) => !w.minimized && w !== win).at(-1);
      if (next) next.focus();
      syncTasks();
    };
    const restore = win.restore;
    win.restore = () => {
      const was = win.minimized;
      restore();
      if (was) zoomRect(taskRect(win), winRect(win));
      syncTasks();
    };
    const setTitle = win.setTitle;
    win.setTitle = (title) => {
      setTitle(title);
      syncTasks();
    };
    win.titlebar.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const pt = menus.point(event);
      contextMenu(windowMenu(win), pt.x, pt.y);
    });
    syncTasks();
  });
  for (const type of ['close', 'focus', 'minimize', 'restore']) desk.on(type, () => syncTasks());

  function windowMenu(win) {
    return [
      { label: '&Restaurer', disabled: !win.minimized && !win.maximized, run: () => (win.maximized ? win.toggleMax() : win.restore()) },
      { label: '&Déplacer', disabled: win.maximized, run: () => win.titlebar.focus() },
      { label: '&Réduire', disabled: win.minimized || win.spec.controls?.min === false, run: () => win.minimize() },
      { label: '&Agrandir', disabled: win.maximized || win.spec.controls?.max === false, run: () => win.toggleMax() },
      '-',
      { label: '&Fermer', bold: true, run: () => win.close() },
    ];
  }

  function cascade() {
    desk.windows.filter((w) => !w.minimized && onTaskbar(w)).forEach((win, i) => {
      if (win.maximized) win.toggleMax();
      win.move(10 + i * 22, 10 + i * 22);
      win.focus();
    });
  }

  function minimizeAll() {
    desk.windows.filter((w) => !w.minimized && onTaskbar(w)).forEach((win) => win.minimize());
  }

  // ——— Lancement rapide (98) ———

  if (is98) {
    const host = el.querySelector('.w9x-quick-btns');
    for (const item of o.quick) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'w9x-quick-btn';
      btn.innerHTML = item.icon;
      btn.setAttribute('aria-label', item.label);
      btn.addEventListener('click', () => {
        audio.click();
        item.run();
      });
      tooltip(btn, item.label);
      host.append(btn);
    }
  }

  // ——— Zone de notification et horloge ———

  const trayItems = new Map();
  const tray = {
    add(id, { html, label, className = '', onOpen }) {
      tray.remove(id);
      const item = document.createElement('span');
      item.className = `w9x-tray-icon ${className}`;
      item.innerHTML = html;
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', label);
      if (onOpen) {
        item.addEventListener('dblclick', onOpen);
        let last = 0;
        item.addEventListener('pointerup', (event) => {
          if (event.pointerType !== 'touch') return;
          const now = performance.now();
          if (now - last < 450) onOpen();
          last = now;
        });
        item.addEventListener('keydown', (event) => event.key === 'Enter' && onOpen());
      }
      tooltip(item, label);
      trayIcons.append(item);
      trayItems.set(id, item);
      return item;
    },
    remove(id) {
      trayItems.get(id)?.remove();
      trayItems.delete(id);
    },
    get: (id) => trayItems.get(id),
  };
  tray.add('volume', { html: ICON16.speaker, label: 'Volume' });

  const tick = () => {
    const now = new Date();
    clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };
  tick();
  const clockTimer = ctx.interval(tick, 5000);
  tooltip(clock, () => o.date);

  // ——— Infobulles jaunes ———

  let tipEl = null;
  let tipTimer = 0;
  function tooltip(target, text) {
    target.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => showTip(target, typeof text === 'function' ? text() : text), 600);
    });
    for (const type of ['pointerleave', 'pointerdown']) {
      target.addEventListener(type, () => {
        clearTimeout(tipTimer);
        tipEl?.remove();
        tipEl = null;
      });
    }
  }

  function showTip(target, text) {
    if (!text || !target.isConnected) return;
    tipEl?.remove();
    tipEl = document.createElement('div');
    tipEl.className = 'w9x-tip';
    tipEl.textContent = text;
    el.append(tipEl);
    const host = el.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const s = host.width / el.offsetWidth || 1;
    const x = (r.left - host.left) / s;
    const y = (r.top - host.top) / s;
    const w = tipEl.offsetWidth;
    tipEl.style.left = `${Math.max(2, Math.min(SCREEN_W - w - 2, x + r.width / s / 2 - w / 2))}px`;
    tipEl.style.top = `${Math.max(2, y - tipEl.offsetHeight - 4)}px`;
  }

  // ——— Icônes du bureau ———

  const icons = [];

  function addIcon(spec) {
    const btn = desk.icon({
      label: spec.label,
      svg: spec.svg,
      x: spec.x ?? GRID.x0,
      y: spec.y ?? GRID.y0,
      className: `w9x-icon ${spec.className ?? ''}`,
      onOpen: () => {
        if (btn.dragged) return;
        audio.click();
        busy(500, 'working');
        spec.open?.(btn);
      },
    });
    const entry = { ...spec, el: btn, x: spec.x ?? GRID.x0, y: spec.y ?? GRID.y0 };
    icons.push(entry);
    draggable(entry);
    btn.addEventListener('keydown', (event) => {
      const i = icons.indexOf(entry);
      const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
      if (step) {
        event.preventDefault();
        icons[(i + step + icons.length) % icons.length]?.el.focus();
      }
    });
    return entry;
  }

  function placeIcon(entry, x, y) {
    entry.x = x;
    entry.y = y;
    entry.el.style.left = `${x}px`;
    entry.el.style.top = `${y}px`;
  }

  // Déplacer une icône : son fantôme suit le pointeur.
  function draggable(entry) {
    const btn = entry.el;
    btn.style.touchAction = 'none';
    btn.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const s = desk.scale();
      const start = { x: event.clientX, y: event.clientY, ix: entry.x, iy: entry.y };
      let ghost = null;
      btn.dragged = false;
      const move = (ev) => {
        const dx = (ev.clientX - start.x) / s;
        const dy = (ev.clientY - start.y) / s;
        if (!ghost && Math.hypot(dx, dy) < 5) return;
        if (!ghost) {
          ghost = btn.cloneNode(true);
          ghost.classList.add('w9x-ghost');
          ghost.removeAttribute('tabindex');
          deskEl.append(ghost);
          btn.dragged = true;
          cancelLongPress();
        }
        ghost.style.left = `${start.ix + dx}px`;
        ghost.style.top = `${start.iy + dy}px`;
      };
      const up = (ev) => {
        btn.removeEventListener('pointermove', move);
        btn.removeEventListener('pointerup', up);
        btn.removeEventListener('pointercancel', up);
        if (!ghost) return;
        ghost.remove();
        const dx = (ev.clientX - start.x) / s;
        const dy = (ev.clientY - start.y) / s;
        const x = Math.round(Math.min(SCREEN_W - 60, Math.max(-10, start.ix + dx)));
        const y = Math.round(Math.min(SCREEN_H - TASKBAR_H - 50, Math.max(0, start.iy + dy)));
        placeIcon(entry, x, y);
        if (autoArrange) arrange('name');
        setTimeout(() => {
          btn.dragged = false;
        }, 50);
      };
      try {
        btn.setPointerCapture(event.pointerId);
      } catch {
        // pointeur déjà relâché
      }
      btn.addEventListener('pointermove', move);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
    });
  }

  const cell = (i) => {
    const rows = Math.floor((SCREEN_H - TASKBAR_H - GRID.y0) / GRID.h);
    return { x: GRID.x0 + Math.floor(i / rows) * GRID.w, y: GRID.y0 + (i % rows) * GRID.h };
  };

  function animateIcons(apply) {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    icons.forEach((entry) => entry.el.classList.toggle('is-gliding', !calm));
    apply();
    setTimeout(() => icons.forEach((entry) => entry.el.classList.remove('is-gliding')), 260);
  }

  let autoArrange = false;
  function arrange(by = 'name') {
    const key = {
      name: (e) => e.label.toLowerCase(),
      type: (e) => `${e.type ?? 'z'}${e.label.toLowerCase()}`,
      size: (e) => String(e.size ?? 0).padStart(9, '0'),
      date: (e) => e.date ?? '',
    }[by];
    const sorted = [...icons].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    animateIcons(() => sorted.forEach((entry, i) => placeIcon(entry, cell(i).x, cell(i).y)));
  }

  function align() {
    const taken = new Set();
    animateIcons(() => {
      for (const entry of icons) {
        let col = Math.max(0, Math.round((entry.x - GRID.x0) / GRID.w));
        let row = Math.max(0, Math.round((entry.y - GRID.y0) / GRID.h));
        while (taken.has(`${col},${row}`)) row += 1;
        taken.add(`${col},${row}`);
        placeIcon(entry, GRID.x0 + col * GRID.w, GRID.y0 + row * GRID.h);
      }
    });
  }

  function refresh() {
    deskEl.classList.add('is-refreshing');
    setTimeout(() => deskEl.classList.remove('is-refreshing'), 140);
  }

  let newCount = 0;
  function createNew(kind, at) {
    newCount += 1;
    const specs = {
      folder: { label: 'Nouveau dossier', svg: ICONS.folder, type: 'dossier' },
      text: { label: 'Nouveau Document texte.txt', svg: ICONS.readme, type: 'texte' },
      shortcut: { label: 'Nouveau raccourci', svg: ICONS.exe, type: 'raccourci' },
      bitmap: { label: 'Nouvelle Image bitmap.bmp', svg: ICONS.control, type: 'image' },
    };
    const spec = specs[kind];
    const label = newCount > 1 && kind === 'folder' ? `${spec.label} (${newCount})` : spec.label;
    const entry = addIcon({
      ...spec,
      label,
      x: Math.round(Math.min(SCREEN_W - 75, Math.max(0, at.x - 36))),
      y: Math.round(Math.min(SCREEN_H - TASKBAR_H - 60, Math.max(0, at.y - 16))),
      open: () => o.openNew?.(kind, label),
    });
    entry.el.focus();
    if (autoArrange) arrange('name');
  }

  function desktopMenu(at) {
    const custom = o.desktopMenu?.(at);
    if (custom) return custom;
    return [
      {
        label: '&Réorganiser les icônes',
        sub: [
          { label: 'par &nom', run: () => arrange('name') },
          { label: 'par &type', run: () => arrange('type') },
          { label: 'par ta&ille', run: () => arrange('size') },
          { label: 'par &date', run: () => arrange('date') },
          '-',
          {
            label: '&Réorganisation automatique',
            checked: autoArrange,
            run: () => {
              autoArrange = !autoArrange;
              if (autoArrange) arrange('name');
            },
          },
        ],
      },
      { label: 'Ali&gner les icônes', run: align },
      '-',
      { label: 'Ac&tualiser', run: refresh },
      '-',
      { label: '&Coller', disabled: true },
      { label: 'Coller le &raccourci', disabled: true },
      '-',
      {
        label: '&Nouveau',
        sub: [
          { label: '&Dossier', icon: ICON16.folder, run: () => createNew('folder', at) },
          { label: '&Raccourci', icon: ICON16.run, run: () => createNew('shortcut', at) },
          '-',
          { label: 'Document texte', icon: ICON16.doc, run: () => createNew('text', at) },
          { label: 'Image bitmap', icon: ICON16.paint, run: () => createNew('bitmap', at) },
        ],
      },
      '-',
      { label: '&Propriétés', bold: false, run: () => o.onDesktopProperties?.() },
    ];
  }

  function iconMenu(entry) {
    return [
      { label: '&Ouvrir', bold: true, run: () => entry.open?.(entry.el) },
      ...(entry.menu?.() ?? []),
      '-',
      { label: '&Propriétés', run: () => (o.onIconProperties ? o.onIconProperties(entry) : alert({ title: `Propriétés de ${entry.label}`, text: `${entry.label}\n\nType : ${entry.type ?? 'élément du bureau'}\nEmplacement : Bureau`, icon: 'info' })) },
    ];
  }

  function taskbarMenu() {
    return [
      { label: '&Cascade', run: cascade },
      { label: 'Mosaïque &horizontale', run: () => tile('h') },
      { label: 'Mosaïque &verticale', run: () => tile('v') },
      '-',
      { label: '&Réduire toutes les fenêtres', run: minimizeAll },
      '-',
      { label: '&Propriétés', run: () => o.onTaskbarProperties?.() },
    ];
  }

  function tile(dir) {
    const wins = desk.windows.filter((w) => !w.minimized && onTaskbar(w));
    if (!wins.length) return;
    const a = workArea();
    wins.forEach((win, i) => {
      if (win.maximized) win.toggleMax();
      if (dir === 'h') {
        const h = Math.floor(a.h / wins.length);
        win.move(0, i * h);
        win.resize(a.w, h);
      } else {
        const w = Math.floor(a.w / wins.length);
        win.move(i * w, 0);
        win.resize(w, a.h);
      }
    });
  }

  function contextMenu(items, x, y) {
    menus.open(items, { x, y, align: 'top', className: 'w9x-context' });
  }

  function contextAt(event, target) {
    const pt = menus.point(event);
    const iconBtn = target.closest?.('.wm-desk-icon');
    if (iconBtn && deskEl.contains(iconBtn)) {
      const entry = icons.find((e) => e.el === iconBtn);
      deskEl.querySelectorAll('.wm-desk-icon.selected').forEach((b) => b.classList.remove('selected'));
      iconBtn.classList.add('selected');
      if (entry) contextMenu(iconMenu(entry), pt.x, pt.y);
      return true;
    }
    if (target === deskEl) {
      deskEl.querySelectorAll('.wm-desk-icon.selected').forEach((b) => b.classList.remove('selected'));
      contextMenu(desktopMenu(pt), pt.x, pt.y);
      return true;
    }
    if (target === taskbar || target === tasksEl) {
      contextMenu(taskbarMenu(), pt.x, pt.y);
      return true;
    }
    return false;
  }

  let lastLongPress = 0;
  on(el, 'contextmenu', (event) => {
    event.preventDefault();
    if (performance.now() - lastLongPress < 900) return;
    if (contextAt(event, event.target)) o.onContext?.();
  });

  // Appui long au tactile (iOS ne déclenche pas « contextmenu »)
  let pressTimer = 0;
  const cancelLongPress = () => clearTimeout(pressTimer);
  on(el, 'pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    const target = event.target;
    const start = { x: event.clientX, y: event.clientY };
    cancelLongPress();
    pressTimer = setTimeout(() => {
      lastLongPress = performance.now();
      if (contextAt(event, target)) o.onContext?.();
    }, 560);
    const stop = (ev) => {
      if (ev.type === 'pointermove' && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 10) return;
      cancelLongPress();
      el.removeEventListener('pointermove', stop);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
    };
    el.addEventListener('pointermove', stop);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  });

  // Maj+F10 ou touche Menu : menu contextuel au clavier
  on(el, 'keydown', (event) => {
    if (!(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return;
    const focusedIcon = document.activeElement?.closest?.('.wm-desk-icon');
    const entry = icons.find((e) => e.el === focusedIcon);
    event.preventDefault();
    if (entry) menus.open(iconMenu(entry), { x: entry.x + 30, y: entry.y + 30, keyboard: true, className: 'w9x-context' });
    else menus.open(desktopMenu({ x: 200, y: 160 }), { x: 200, y: 160, keyboard: true, className: 'w9x-context' });
  });

  // ——— Boîtes de dialogue ———

  // Boîte de message classique, avec le son de l'époque.
  function alert(spec) {
    const icon = spec.icon ?? 'info';
    if (spec.sound !== false) icon === 'error' ? audio.winError() : audio.ding();
    return desk.alert({ ...spec, icon, className: `w9x-msgbox ${spec.className ?? ''}` });
  }

  // Dialogue sur mesure : { title, icon (16 px, barre de titre), body (HTML),
  // buttons, defaultButton, cancelButton, width, layer: 'desk' | 'sys', dither }
  function dialog(spec) {
    const target = spec.layer === 'sys' ? sys : desk;
    const buttons = spec.buttons ?? ['OK'];
    const defIndex = spec.defaultButton ?? 0;
    const cancelIndex = spec.cancelButton ?? buttons.length - 1;
    let resolveFn;
    const result = new Promise((resolve) => {
      resolveFn = resolve;
    });
    const blocker = document.createElement('div');
    blocker.className = spec.dither ? 'w9x-dither' : 'wm-blocker';
    if (spec.modal !== false) target.el.append(blocker);
    const win = target.open({
      title: spec.title,
      icon: spec.icon,
      w: spec.width ?? 320,
      h: spec.height ?? 'auto',
      center: spec.x == null,
      x: spec.x,
      y: spec.y,
      taskbar: spec.taskbar ?? false,
      className: `wm-dialog w9x-dialog ${spec.className ?? ''}`,
      controls: { min: false, max: false, close: spec.closable !== false, ...(spec.help ? {} : {}) },
      body: `<form class="w9x-dlg" novalidate>${spec.body ?? ''}${
        buttons.length
          ? `<div class="w9x-dlg-buttons">${buttons
              .map((b, i) => `<button type="button" class="wm-push${i === defIndex ? ' is-default' : ''}" data-i="${i}">${accelHtml(b)}</button>`)
              .join('')}</div>`
          : ''
      }</form>`,
    });
    if (spec.help) {
      const help = document.createElement('button');
      help.type = 'button';
      help.className = 'wm-btn wm-help';
      help.setAttribute('aria-label', 'Aide');
      help.innerHTML = '<b>?</b>';
      help.addEventListener('click', () => spec.onHelp?.(win));
      win.el.querySelector('.wm-ctrls')?.prepend(help);
    }
    const z = Number(win.el.style.zIndex) || 30;
    win.el.style.zIndex = String(z + 1);
    blocker.style.zIndex = String(z);
    blocker.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      win.flash();
      audio.ding();
    });
    const form = win.body.querySelector('form');
    let finished = false;
    const finish = (value) => {
      if (finished) return;
      finished = true;
      blocker.remove();
      if (!win.closed) {
        win.spec.onClose = null;
        win.close();
      }
      resolveFn({ button: value, form, win });
    };
    win.spec.onClose = () => {
      if (!finished) {
        finished = true;
        blocker.remove();
        resolveFn({ button: null, form, win });
      }
      return true;
    };
    win.body.querySelectorAll('.w9x-dlg-buttons .wm-push').forEach((btn) =>
      btn.addEventListener('click', () => {
        const value = buttons[Number(btn.dataset.i)].replace(/&/g, '');
        if (spec.onButton?.(value, form, win) === false) return;
        finish(value);
      }),
    );
    form.addEventListener('submit', (event) => event.preventDefault());
    win.el.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (spec.closable !== false) finish(buttons[cancelIndex]?.replace(/&/g, '') ?? null);
      } else if (event.key === 'Enter' && event.target.closest('input:not([type=radio]):not([type=checkbox]), select')) {
        event.preventDefault();
        win.body.querySelector(`.w9x-dlg-buttons .wm-push[data-i="${defIndex}"]`)?.click();
      }
    });
    spec.onReady?.(win, form);
    setTimeout(() => {
      if (win.closed) return;
      const first = win.body.querySelector('[autofocus]') ?? win.body.querySelector('.wm-push.is-default');
      first?.focus({ preventScroll: true });
      if (first?.select) first.select();
    }, 40);
    return { win, result, close: (value = null) => finish(value) };
  }

  // ——— Divers ———

  function closeAllWindows() {
    menus.closeSilently();
    desk.windows.slice().forEach((win) => {
      win.spec.onClose = null;
      win.close();
    });
    sys.windows.slice().forEach((win) => {
      win.spec.onClose = null;
      win.close();
    });
    el.querySelectorAll('.wm-blocker, .w9x-dither').forEach((b) => b.remove());
  }

  function destroy() {
    abort.abort();
    menus.closeSilently();
    clearTimeout(busyTimer);
    clearTimeout(tipTimer);
    cancelLongPress();
    ctx.clear(clockTimer);
    desk.destroy();
    sys.destroy();
    el.remove();
  }

  for (const spec of o.icons) addIcon(spec);

  return {
    el,
    desk,
    sys,
    menus,
    taskbar,
    startBtn,
    tray,
    icons,
    addIcon,
    openStart,
    contextMenu,
    alert,
    dialog,
    busy,
    syncTasks,
    arrange,
    align,
    closeAllWindows,
    minimizeAll,
    msgIcon: (name) => MSG_ICONS[name],
    destroy,
  };
}
