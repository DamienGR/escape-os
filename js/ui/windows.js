// Gestionnaire de fenêtres partagé (Windows 3.1 à XP, Ubuntu). Déplacement par la
// barre de titre en Pointer Events (souris et doigt), mise au premier plan,
// réduction, agrandissement, boîtes de message, icônes de bureau, double-clic
// et double tap au tactile.

import { pixelArt } from './pixel.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ——— Glyphes des boutons de fenêtre ———

const tri = (down) =>
  pixelArt([9, 5], (p) => {
    for (let i = 0; i < 5; i++) p.hline(i, down ? i : 4 - i, 9 - i * 2, 'K');
  });

const GLYPHS = {
  win31: {
    min: tri(true),
    max: tri(false),
    restore: pixelArt([9, 11], (p) => {
      for (let i = 0; i < 5; i++) p.hline(i, 4 - i, 9 - i * 2, 'K');
      for (let i = 0; i < 5; i++) p.hline(i, 6 + i, 9 - i * 2, 'K');
    }),
    sys: pixelArt([13, 4], (p) => {
      p.rect(0, 0, 12, 3, 'K');
      p.rect(1, 1, 10, 1, 'W');
      p.hline(1, 3, 12, 'D');
      p.vline(12, 1, 3, 'D');
    }),
  },
  win9x: {
    min: pixelArt([8, 9], (p) => p.rect(1, 7, 6, 2, 'K')),
    max: pixelArt([9, 9], (p) => {
      p.frame(0, 0, 9, 9, 'K');
      p.hline(0, 1, 9, 'K');
    }),
    restore: pixelArt([9, 9], (p) => {
      p.frame(2, 0, 7, 6, 'K');
      p.hline(2, 1, 7, 'K');
      p.rect(0, 3, 7, 6, 'L');
      p.frame(0, 3, 7, 6, 'K');
      p.hline(0, 4, 7, 'K');
    }),
    close: pixelArt([8, 7], (p) => {
      for (let i = 0; i < 7; i++) {
        p.rect(i, i, 2, 1, 'K');
        p.rect(6 - i, i, 2, 1, 'K');
      }
    }),
  },
};

// ——— Icônes des boîtes de message ———

export const MSG_ICONS = {
  info: pixelArt(32, (p) => {
    p.disc(15.5, 15.5, 13, 'K');
    p.disc(15.5, 15.5, 12, 'W');
    p.rect(14, 8, 4, 3, 'b');
    p.rect(14, 13, 4, 11, 'b');
    p.rect(12, 13, 2, 2, 'b');
    p.rect(12, 22, 8, 2, 'b');
  }),
  warning: pixelArt(32, (p) => {
    for (let i = 0; i < 26; i++) p.hline(15 - Math.floor(i / 2), 3 + i, 2 + Math.floor(i / 2) * 2, 'K');
    for (let i = 2; i < 24; i++) p.hline(16 - Math.floor(i / 2), 4 + i, Math.floor(i / 2) * 2 - 1, 'y');
    p.rect(15, 11, 3, 9, 'K');
    p.rect(15, 22, 3, 3, 'K');
  }),
  error: pixelArt(32, (p) => {
    p.disc(15.5, 15.5, 13, 'K');
    p.disc(15.5, 15.5, 12, 'r');
    for (let i = 0; i < 11; i++) {
      p.rect(10 + i, 10 + i, 2, 2, 'W');
      p.rect(20 - i, 10 + i, 2, 2, 'W');
    }
  }),
  question: pixelArt(32, (p) => {
    p.disc(15.5, 14, 12, 'K');
    p.disc(15.5, 14, 11, 'W');
    p.map(10, 24, ['KK', 'KWK', '.KWK', '..KK']);
    p.map(12, 6, ['..KKKKK..', '.KK...KK.', '......KK.', '.....KK..', '....KK...', '....KK...', '.........', '....KK...', '....KK...'], {});
  }),
};

// ——— Double-clic, double tap et Entrée ———

export function onDoubleActivate(el, handler, { signal } = {}) {
  let lastTap = 0;
  let lastX = 0;
  let lastY = 0;
  let lastFire = 0;
  const fire = (event) => {
    const now = performance.now();
    if (now - lastFire < 450) return;
    lastFire = now;
    handler(event);
  };
  el.addEventListener('dblclick', fire, { signal });
  el.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerType !== 'touch') return;
      const now = performance.now();
      if (now - lastTap < 420 && Math.hypot(event.clientX - lastX, event.clientY - lastY) < 30) {
        lastTap = 0;
        fire(event);
      } else {
        lastTap = now;
        lastX = event.clientX;
        lastY = event.clientY;
      }
    },
    { signal },
  );
  el.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        fire(event);
      }
    },
    { signal },
  );
}

// ——— Bureau ———

export function createDesktop(el, options = {}) {
  const opts = {
    theme: 'win31',
    drag: 'live',
    iconify: options.theme === 'win31',
    workArea: null, // () => ({ x, y, w, h }) : zone utile (sans barre des tâches)
    ...options,
  };
  el.classList.add('wm-desktop', `wm-theme-${opts.theme}`);
  if (opts.variant) el.classList.add(`wm-variant-${opts.variant}`);

  const abort = new AbortController();
  const { signal } = abort;
  const windows = [];
  const listeners = new Map();
  const glyphs = GLYPHS[opts.theme] ?? (opts.theme.startsWith('win') ? GLYPHS.win9x : null);
  let z = 20;
  let focused = null;
  let iconSlots = [];

  const emit = (type, payload) => (listeners.get(type) ?? []).forEach((fn) => fn(payload));
  const on = (type, fn) => {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(fn);
  };

  const scaleOf = () => {
    const rect = el.getBoundingClientRect();
    return rect.width / el.offsetWidth || 1;
  };

  const area = () => opts.workArea?.() ?? { x: 0, y: 0, w: el.clientWidth, h: el.clientHeight };

  function clampPos(win, x, y) {
    const a = area();
    const minVisible = 40;
    return [
      Math.round(Math.min(a.x + a.w - minVisible, Math.max(a.x - win.w + minVisible, x))),
      Math.round(Math.min(a.y + a.h - 20, Math.max(a.y, y))),
    ];
  }

  function focusWin(win) {
    if (!win || win.closed) return;
    if (focused && focused !== win) {
      focused.el.classList.remove('is-active');
      focused.emit('blur');
    }
    focused = win;
    win.el.style.zIndex = String((z += 1));
    win.el.classList.add('is-active');
    win.emit('focus');
    emit('focus', win);
  }

  function deselectIcons() {
    el.querySelectorAll('.wm-desk-icon.selected').forEach((icon) => icon.classList.remove('selected'));
  }

  el.addEventListener(
    'pointerdown',
    (event) => {
      if (event.target === el) {
        deselectIcons();
        emit('desktop', event);
      }
    },
    { signal },
  );

  // ——— Fenêtre ———

  function open(spec) {
    const controls = { min: true, max: true, close: opts.theme !== 'win31', ...spec.controls };
    const winEl = document.createElement('section');
    winEl.className = `wm-win ${spec.className ?? ''}`;
    winEl.setAttribute('role', 'dialog');
    winEl.setAttribute('aria-label', spec.title ?? 'Fenêtre');
    winEl.tabIndex = -1;
    if (spec.id) winEl.dataset.id = spec.id;

    const sys = opts.theme === 'win31' && spec.sysmenu !== false;
    winEl.innerHTML = `
      <header class="wm-titlebar" tabindex="0" aria-label="${esc(spec.title ?? '')} : barre de titre, flèches pour déplacer">
        ${sys ? `<button type="button" class="wm-btn wm-sys" aria-label="Menu Système">${glyphs?.sys ?? ''}</button>` : ''}
        ${spec.icon && !sys ? `<span class="wm-icon">${spec.icon}</span>` : ''}
        <span class="wm-title">${esc(spec.title ?? '')}</span>
        <span class="wm-ctrls">
          ${controls.min ? `<button type="button" class="wm-btn wm-min" aria-label="Réduire">${glyphs?.min ?? ''}</button>` : ''}
          ${controls.max ? `<button type="button" class="wm-btn wm-max" aria-label="Agrandir">${glyphs?.max ?? ''}</button>` : ''}
          ${controls.close ? `<button type="button" class="wm-btn wm-close" aria-label="Fermer">${glyphs?.close ?? ''}</button>` : ''}
        </span>
      </header>
      ${spec.menu ? `<nav class="wm-menubar">${spec.menu.map((m) => `<span class="wm-menu-item">${m.replace(/&(.)/, '<u>$1</u>')}</span>`).join('')}</nav>` : ''}
      <div class="wm-body"></div>
      ${spec.status != null ? `<footer class="wm-status">${spec.status}</footer>` : ''}`;

    const body = winEl.querySelector('.wm-body');
    if (typeof spec.body === 'string') body.innerHTML = spec.body;
    else if (spec.body) body.append(spec.body);

    const handlers = new Map();
    const win = {
      el: winEl,
      body,
      titlebar: winEl.querySelector('.wm-titlebar'),
      spec,
      x: 0,
      y: 0,
      w: spec.w ?? 320,
      h: spec.h ?? 200,
      minimized: false,
      maximized: false,
      closed: false,
      prev: null,
      icon: null,
      on(type, fn) {
        if (!handlers.has(type)) handlers.set(type, []);
        handlers.get(type).push(fn);
        return win;
      },
      emit(type, payload) {
        (handlers.get(type) ?? []).forEach((fn) => fn(payload));
      },
      move(x, y) {
        win.x = x;
        win.y = y;
        winEl.style.left = `${x}px`;
        winEl.style.top = `${y}px`;
      },
      resize(w, h) {
        win.w = w;
        win.h = h;
        winEl.style.width = `${w}px`;
        if (h !== 'auto') winEl.style.height = `${h}px`;
      },
      focus: () => focusWin(win),
      setTitle(title) {
        winEl.querySelector('.wm-title').textContent = title;
        winEl.setAttribute('aria-label', title);
      },
      minimize() {
        if (win.minimized) return;
        win.minimized = true;
        winEl.classList.add('is-min');
        if (focused === win) focused = null;
        if (opts.iconify) iconifyWin(win);
        win.emit('minimize');
        emit('minimize', win);
      },
      restore() {
        if (win.minimized) {
          win.minimized = false;
          winEl.classList.remove('is-min');
          if (win.icon) {
            iconSlots = iconSlots.filter((slot) => slot !== win.icon);
            win.icon.remove();
            win.icon = null;
          }
          win.emit('restore');
          emit('restore', win);
        }
        focusWin(win);
      },
      toggleMax() {
        const btn = winEl.querySelector('.wm-max');
        if (win.maximized) {
          win.maximized = false;
          winEl.classList.remove('is-max');
          win.move(win.prev.x, win.prev.y);
          win.resize(win.prev.w, win.prev.h);
          if (btn) {
            btn.innerHTML = glyphs?.max ?? '';
            btn.setAttribute('aria-label', 'Agrandir');
          }
        } else {
          win.prev = { x: win.x, y: win.y, w: win.w, h: win.h };
          win.maximized = true;
          winEl.classList.add('is-max');
          const a = area();
          win.move(a.x, a.y);
          win.resize(a.w, a.h);
          if (btn) {
            btn.innerHTML = glyphs?.restore ?? '';
            btn.setAttribute('aria-label', 'Restaurer');
          }
        }
        win.emit('maximize', win.maximized);
        emit('maximize', win);
      },
      close() {
        if (win.closed) return;
        if (spec.onClose?.() === false) return;
        win.closed = true;
        win.icon?.remove();
        winEl.remove();
        windows.splice(windows.indexOf(win), 1);
        if (focused === win) {
          focused = null;
          const next = windows.filter((w) => !w.minimized).at(-1);
          if (next) focusWin(next);
        }
        win.emit('close');
        emit('close', win);
      },
      shake() {
        winEl.classList.remove('wm-shake');
        void winEl.offsetWidth;
        winEl.classList.add('wm-shake');
      },
      flash() {
        winEl.classList.remove('wm-flash');
        void winEl.offsetWidth;
        winEl.classList.add('wm-flash');
      },
    };

    win.resize(win.w, win.h);
    (spec.parent ?? el).append(winEl);
    windows.push(win);

    if (spec.center || spec.x == null) {
      const a = area();
      const h = spec.h === 'auto' ? winEl.offsetHeight : win.h;
      win.move(Math.round(a.x + (a.w - win.w) / 2), Math.round(a.y + Math.max(0, (a.h - h) / 2)));
    } else {
      win.move(spec.x, spec.y);
    }
    if (spec.maximized) win.toggleMax();

    // Boutons
    winEl.querySelector('.wm-min')?.addEventListener('click', () => win.minimize());
    winEl.querySelector('.wm-max')?.addEventListener('click', () => win.toggleMax());
    winEl.querySelector('.wm-close')?.addEventListener('click', () => win.close());
    const sysBtn = winEl.querySelector('.wm-sys');
    if (sysBtn) {
      sysBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleSysMenu(win, sysBtn);
      });
      sysBtn.addEventListener('dblclick', () => win.close());
    }

    winEl.addEventListener('pointerdown', () => focusWin(win), { signal });
    onDoubleActivate(win.titlebar, (event) => {
      if (event.target.closest('.wm-btn')) return;
      if (controls.max && spec.resizable !== false) win.toggleMax();
    });

    makeDraggable(win);
    if (!spec.inactive) focusWin(win);
    emit('open', win);
    return win;
  }

  // ——— Menu Système (Windows 3.1) ———

  function toggleSysMenu(win, anchor) {
    const existing = el.querySelector('.wm-sysmenu');
    existing?.remove();
    if (existing?.dataset.for === win.el.dataset.uid) return;
    const menu = document.createElement('div');
    menu.className = 'wm-sysmenu';
    win.el.dataset.uid ||= Math.random().toString(36).slice(2);
    menu.dataset.for = win.el.dataset.uid;
    const items = [
      ['Restaurer', () => (win.maximized ? win.toggleMax() : win.restore()), win.maximized],
      ['Déplacer', () => win.titlebar.focus(), true],
      ['Réduire', () => win.minimize(), win.spec.controls?.min !== false],
      ['Agrandir', () => win.toggleMax(), !win.maximized && win.spec.controls?.max !== false],
      ['—'],
      ['Fermer     Alt+F4', () => win.close(), win.spec.closable !== false],
    ];
    menu.innerHTML = items
      .map(([label, , enabled], i) =>
        label === '—' ? '<hr>' : `<button type="button" data-i="${i}" ${enabled ? '' : 'disabled'}>${esc(label)}</button>`,
      )
      .join('');
    const rect = anchor.getBoundingClientRect();
    const host = el.getBoundingClientRect();
    const s = scaleOf();
    menu.style.left = `${(rect.left - host.left) / s}px`;
    menu.style.top = `${(rect.bottom - host.top) / s}px`;
    el.append(menu);
    menu.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-i]');
      if (!btn) return;
      menu.remove();
      items[Number(btn.dataset.i)][1]();
    });
    const close = (event) => {
      if (!menu.contains(event.target)) {
        menu.remove();
        window.removeEventListener('pointerdown', close, true);
      }
    };
    setTimeout(() => window.addEventListener('pointerdown', close, true), 0);
  }

  // ——— Réduction en icône (Windows 3.1) ———

  function iconifyWin(win) {
    const slotW = 76;
    const used = new Set(iconSlots.map((icon) => Number(icon.dataset.slot)));
    let slot = 0;
    while (used.has(slot)) slot += 1;
    const a = area();
    const perRow = Math.max(1, Math.floor(a.w / slotW));
    const icon = createIcon({
      label: win.spec.iconLabel ?? win.spec.title,
      svg: win.spec.iconSvg ?? win.spec.icon ?? '',
      x: a.x + (slot % perRow) * slotW + 2,
      y: a.y + a.h - 62 - Math.floor(slot / perRow) * 62,
      onOpen: () => win.restore(),
      className: 'wm-minimized',
    });
    icon.dataset.slot = String(slot);
    win.icon = icon;
    iconSlots.push(icon);
  }

  // ——— Déplacement ———

  function makeDraggable(win) {
    const bar = win.titlebar;
    bar.style.touchAction = 'none';
    bar.addEventListener(
      'pointerdown',
      (event) => {
        if (event.button !== 0 || event.target.closest('.wm-btn') || win.maximized || win.spec.movable === false) return;
        event.preventDefault();
        focusWin(win);
        const scale = scaleOf();
        const start = { x: event.clientX, y: event.clientY, wx: win.x, wy: win.y };
        let moved = false;
        let outline = null;
        let target = [win.x, win.y];
        try {
          bar.setPointerCapture(event.pointerId);
        } catch {
          // pointeur déjà relâché
        }
        const move = (ev) => {
          const dx = (ev.clientX - start.x) / scale;
          const dy = (ev.clientY - start.y) / scale;
          if (!moved && Math.hypot(dx, dy) < 3) return;
          if (!moved) {
            moved = true;
            win.el.classList.add('is-dragging');
            if (opts.drag === 'outline') {
              outline = document.createElement('div');
              outline.className = 'wm-outline';
              outline.style.width = `${win.w}px`;
              outline.style.height = `${win.el.offsetHeight}px`;
              win.el.parentElement.append(outline);
            }
            emit('dragstart', win);
          }
          target = clampPos(win, start.wx + dx, start.wy + dy);
          if (outline) {
            outline.style.left = `${target[0]}px`;
            outline.style.top = `${target[1]}px`;
          } else {
            win.move(...target);
            emit('drag', win);
          }
        };
        const up = () => {
          bar.removeEventListener('pointermove', move);
          bar.removeEventListener('pointerup', up);
          bar.removeEventListener('pointercancel', up);
          win.el.classList.remove('is-dragging');
          if (!moved) return;
          outline?.remove();
          win.move(...target);
          win.emit('move');
          emit('move', win);
        };
        bar.addEventListener('pointermove', move);
        bar.addEventListener('pointerup', up);
        bar.addEventListener('pointercancel', up);
      },
      { signal },
    );

    // Alternative clavier : flèches sur la barre de titre
    bar.addEventListener(
      'keydown',
      (event) => {
        const steps = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
        const step = steps[event.key];
        if (!step || win.maximized) return;
        event.preventDefault();
        win.move(...clampPos(win, win.x + step[0], win.y + step[1]));
        win.emit('move');
        emit('move', win);
      },
      { signal },
    );
  }

  // ——— Icônes de bureau ———

  function createIcon({ label, svg, x, y, onOpen, className = '', parent = el, title }) {
    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = `wm-desk-icon ${className}`;
    icon.style.left = `${x}px`;
    icon.style.top = `${y}px`;
    if (title) icon.title = title;
    icon.innerHTML = `<span class="wm-desk-img">${svg}</span><span class="wm-desk-label">${esc(label)}</span>`;
    icon.addEventListener(
      'pointerdown',
      () => {
        parent.querySelectorAll('.wm-desk-icon.selected').forEach((other) => other.classList.remove('selected'));
        icon.classList.add('selected');
      },
      { signal },
    );
    icon.addEventListener('focus', () => icon.classList.add('selected'), { signal });
    if (onOpen) onDoubleActivate(icon, () => onOpen(icon), { signal });
    parent.append(icon);
    return icon;
  }

  // ——— Boîte de message modale ———

  function alert({ title = 'Information', text = '', icon = 'info', buttons = ['OK'], width = 300, className = '' }) {
    return new Promise((resolve) => {
      const blocker = document.createElement('div');
      blocker.className = 'wm-blocker';
      el.append(blocker);
      const body = `
        <div class="wm-msg">
          ${icon ? `<span class="wm-msg-icon">${MSG_ICONS[icon] ?? icon}</span>` : ''}
          <p class="wm-msg-text">${esc(text).replace(/\n/g, '<br>')}</p>
        </div>
        <div class="wm-msg-buttons">${buttons.map((b, i) => `<button type="button" class="wm-push${i === 0 ? ' is-default' : ''}" data-i="${i}">${esc(b)}</button>`).join('')}</div>`;
      const win = open({
        title,
        w: width,
        h: 'auto',
        body,
        center: true,
        className: `wm-dialog ${className}`,
        controls: { min: false, max: false, close: opts.theme !== 'win31' },
        sysmenu: opts.theme === 'win31',
      });
      win.el.style.zIndex = String((z += 10));
      blocker.style.zIndex = String(z - 1);
      blocker.addEventListener('pointerdown', () => {
        win.flash();
        opts.onBlocked?.();
      });
      const done = (value) => {
        blocker.remove();
        win.close();
        resolve(value);
      };
      win.on('close', () => {
        blocker.remove();
        resolve(null);
      });
      win.body.querySelectorAll('.wm-push').forEach((btn) => btn.addEventListener('click', () => done(buttons[Number(btn.dataset.i)])));
      setTimeout(() => win.body.querySelector('.wm-push')?.focus({ preventScroll: true }), 30);
    });
  }

  function destroy() {
    abort.abort();
    windows.slice().forEach((win) => win.el.remove());
    windows.length = 0;
  }

  return {
    el,
    open,
    alert,
    icon: createIcon,
    on,
    focus: focusWin,
    deselectIcons,
    get windows() {
      return windows;
    },
    get focused() {
      return focused;
    },
    scale: scaleOf,
    destroy,
  };
}
