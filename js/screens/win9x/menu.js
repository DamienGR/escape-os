// Menus en cascade des Windows 95 et 98 : menu Démarrer, sous-menus, menus
// contextuels. Souris : survol avec le petit délai d'ouverture de l'époque, et
// on peut appuyer sur Démarrer, glisser jusqu'à l'entrée puis relâcher.
// Tactile : pas de survol, les sous-menus s'ouvrent au tap. Clavier : flèches,
// Entrée, Échap et lettres soulignées.
//
// Entrée de menu : { label: '&Programmes', icon, sub: [...] | () => [...],
//   run, disabled, checked, bold } ; '-' pour un séparateur.

import { pixelArt } from '../../ui/pixel.js';

const ARROW = pixelArt([4, 7], (p) => {
  for (let i = 0; i < 4; i++) p.vline(i, i, 7 - i * 2, 'currentColor');
});

const CHECK = pixelArt([7, 7], (p) =>
  p.map(0, 0, ['......c', '.....cc', 'c...ccc', 'cc.ccc.', 'ccccc..', '.ccc...', '..c....'], { c: 'currentColor' }),
);

const HOVER_DELAY = 320;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// '&Programmes' → 'P' souligné ; '&&' reste une esperluette
export function accelHtml(label) {
  const parts = String(label).split('&&');
  return parts
    .map((part) => esc(part).replace(/&amp;(.)/, '<u>$1</u>'))
    .join('&amp;');
}

const accelOf = (label) => {
  const m = /&([^&])/.exec(String(label).replace(/&&/g, ''));
  return (m ? m[1] : String(label).replace(/&/g, '')[0] ?? '').toLowerCase();
};

export function createMenus(host, { variant = '95', signal, onClose } = {}) {
  const stack = []; // niveaux ouverts : { el, items, hot, sub }
  let timer = 0;
  let lastActivate = 0;
  let restoreFocus = null;
  let onCloseOnce = null;

  const scale = () => {
    const rect = host.getBoundingClientRect();
    return rect.width / host.offsetWidth || 1;
  };
  const bounds = () => ({ w: host.offsetWidth, h: host.offsetHeight });

  function render(items, { large = false, banner = null, className = '' } = {}) {
    const el = document.createElement('div');
    const iconic = large || items.some((item) => item && item !== '-' && item.icon);
    el.className = `w9x-menu${large ? ' is-large' : ''}${iconic ? ' has-icons' : ' is-plain'}${banner ? ' has-banner' : ''} ${className}`;
    el.setAttribute('role', 'menu');
    el.tabIndex = -1;
    const list = items.length ? items : [{ label: '(Vide)', disabled: true }];
    el.innerHTML = `
      ${banner ? `<div class="w9x-banner" aria-hidden="true"><span>${banner}</span></div>` : ''}
      <div class="w9x-menu-list">${list
        .map((item, i) => {
          if (item === '-' || item?.separator) return '<div class="w9x-mi-sep" role="separator"></div>';
          const sub = Boolean(item.sub);
          const cls = ['w9x-mi', sub && 'has-sub', item.disabled && 'is-disabled', item.bold && 'is-bold'].filter(Boolean).join(' ');
          const icon = item.checked ? CHECK : item.icon ?? '';
          return `<div class="${cls}" role="menuitem" tabindex="-1" data-i="${i}" ${sub ? 'aria-haspopup="menu" aria-expanded="false"' : ''} ${item.disabled ? 'aria-disabled="true"' : ''}>
            <span class="w9x-mi-icon">${icon}</span>
            <span class="w9x-mi-label">${accelHtml(item.label)}</span>
            <span class="w9x-mi-arrow">${sub ? ARROW : ''}</span>
          </div>`;
        })
        .join('')}</div>`;
    return { el, items: list };
  }

  const itemEl = (level, index) => stack[level]?.el.querySelector(`.w9x-mi[data-i="${index}"]`);
  const selectable = (level) =>
    stack[level].items.map((item, i) => (item === '-' || item?.separator ? -1 : i)).filter((i) => i >= 0);

  function place(el, { x, y, align = 'top', side = null }) {
    const { w, h } = bounds();
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;
    let left = x;
    let top = align === 'bottom' ? y - mh : y;
    if (side) {
      // Sous-menu : à droite du parent, ou à gauche s'il déborde
      if (side.right + mw - 3 > w) left = side.left - mw + 3;
      else left = side.right - 3;
    } else if (left + mw > w) {
      left = Math.max(0, x - mw);
    }
    if (top + mh > h) {
      // Sous-menu : on remonte ; menu contextuel : il s'ouvre vers le haut.
      top = side || align === 'bottom' || y - mh < 0 ? h - mh : y - mh;
    }
    if (top < 0) top = 0;
    el.style.left = `${Math.max(0, Math.round(left))}px`;
    el.style.top = `${Math.round(top)}px`;
    return { left, top, right: left + mw };
  }

  function mountLevel(items, opts) {
    const level = stack.length;
    const { el, items: list } = render(items, opts);
    el.dataset.level = String(level);
    el.style.visibility = 'hidden';
    host.append(el);
    const pos = place(el, opts);
    el.style.visibility = '';
    if (variant === '98') {
      el.classList.add(opts.side ? (pos.left < opts.side.left ? 'slide-left' : 'slide-right') : opts.align === 'bottom' ? 'slide-up' : 'slide-down');
    }
    stack.push({ el, items: list, hot: -1, sub: -1, opts });
    wire(el, level);
    return level;
  }

  // ——— Ouverture et fermeture ———

  function open(items, opts = {}) {
    closeAll({ silent: true });
    restoreFocus = opts.restoreFocus ?? document.activeElement;
    onCloseOnce = opts.onClose ?? null;
    mountLevel(typeof items === 'function' ? items() : items, opts);
    if (opts.keyboard) highlight(0, selectable(0)[0], { focus: true });
    else stack[0].el.focus({ preventScroll: true });
    return { close: () => closeAll() };
  }

  function openSub(level, index, { keyboard = false } = {}) {
    clearTimeout(timer);
    const entry = stack[level];
    const item = entry?.items[index];
    if (!item?.sub || item.disabled) return;
    if (entry.sub === index && stack[level + 1]) {
      if (keyboard) highlight(level + 1, selectable(level + 1)[0], { focus: true });
      return;
    }
    closeFrom(level + 1);
    const anchor = itemEl(level, index);
    const parent = entry.el;
    const left = parseFloat(parent.style.left);
    const side = { left, right: left + parent.offsetWidth };
    const y = parseFloat(parent.style.top) + anchor.offsetTop - 3;
    entry.sub = index;
    anchor.setAttribute('aria-expanded', 'true');
    anchor.classList.add('is-open');
    const sub = typeof item.sub === 'function' ? item.sub() : item.sub;
    mountLevel(sub, { x: side.right, y, side, className: item.menuClass ?? '' });
    if (keyboard) highlight(level + 1, selectable(level + 1)[0], { focus: true });
  }

  function closeFrom(level) {
    while (stack.length > level) {
      const entry = stack.pop();
      entry.el.remove();
      const parent = stack.at(-1);
      if (parent && parent.sub >= 0) {
        const anchor = itemEl(stack.length - 1, parent.sub);
        anchor?.setAttribute('aria-expanded', 'false');
        anchor?.classList.remove('is-open');
        parent.sub = -1;
      }
    }
  }

  function closeAll({ silent = false, focus = true } = {}) {
    clearTimeout(timer);
    if (!stack.length) return;
    closeFrom(0);
    const cb = onCloseOnce;
    onCloseOnce = null;
    if (focus && restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
    restoreFocus = null;
    if (!silent) onClose?.();
    cb?.();
  }

  // ——— Surbrillance ———

  function highlight(level, index, { focus = false, hover = false } = {}) {
    const entry = stack[level];
    if (!entry) return;
    entry.el.querySelectorAll('.w9x-mi.is-hot').forEach((el) => el.classList.remove('is-hot'));
    entry.hot = index ?? -1;
    const el = itemEl(level, index);
    if (!el) return;
    el.classList.add('is-hot');
    if (focus) el.focus({ preventScroll: true });
    // Les entrées parentes restent allumées tant que leur sous-menu est ouvert.
    for (let up = level - 1; up >= 0; up--) {
      const parent = stack[up];
      if (parent.sub >= 0 && parent.hot !== parent.sub) {
        parent.el.querySelectorAll('.w9x-mi.is-hot').forEach((mi) => mi.classList.remove('is-hot'));
        parent.hot = parent.sub;
        itemEl(up, parent.sub)?.classList.add('is-hot');
      }
    }
    if (!hover) return;
    clearTimeout(timer);
    const item = entry.items[index];
    if (entry.sub === index) {
      closeFrom(level + 2);
      return;
    }
    timer = setTimeout(() => {
      if (!stack[level]) return;
      closeFrom(level + 1);
      if (item?.sub && !item.disabled) openSub(level, index);
    }, HOVER_DELAY);
  }

  function activate(level, index, { keyboard = false } = {}) {
    const item = stack[level]?.items[index];
    if (!item || item === '-' || item.disabled) return;
    if (item.sub) {
      openSub(level, index, { keyboard });
      return;
    }
    const now = performance.now();
    if (now - lastActivate < 250) return;
    lastActivate = now;
    closeAll({ focus: false });
    item.run?.();
  }

  // ——— Événements d'un niveau ———

  function wire(el, level) {
    const target = (event) => event.target.closest?.('.w9x-mi');
    el.addEventListener('pointerover', (event) => {
      if (event.pointerType === 'touch') return;
      const mi = target(event);
      if (!mi) return;
      highlight(level, Number(mi.dataset.i), { hover: true, focus: true });
    });
    el.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'touch') return;
      const entry = stack[level];
      if (entry && entry.sub < 0) {
        clearTimeout(timer);
        el.querySelectorAll('.w9x-mi.is-hot').forEach((mi) => mi.classList.remove('is-hot'));
        entry.hot = -1;
      }
    });
    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    el.addEventListener('pointerup', (event) => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      const mi = target(event);
      if (!mi) return;
      const index = Number(mi.dataset.i);
      if (stack[level]?.items[index]?.sub) openSub(level, index);
      else activate(level, index);
    });
    el.addEventListener('click', (event) => {
      const mi = target(event);
      if (!mi) return;
      const index = Number(mi.dataset.i);
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') return;
      highlight(level, index);
      activate(level, index, { keyboard: event.detail === 0 });
    });
    el.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  // ——— Clavier ———

  function onKey(event) {
    if (!stack.length) return;
    const level = stack.length - 1;
    const entry = stack[level];
    const order = selectable(level);
    const pos = order.indexOf(entry.hot);
    const move = (step) => {
      const next = order[(pos + step + order.length) % order.length] ?? order[0];
      highlight(level, pos < 0 && step < 0 ? order.at(-1) : pos < 0 ? order[0] : next, { focus: true });
    };
    switch (event.key) {
      case 'ArrowDown':
        move(1);
        break;
      case 'ArrowUp':
        move(-1);
        break;
      case 'Home':
        highlight(level, order[0], { focus: true });
        break;
      case 'End':
        highlight(level, order.at(-1), { focus: true });
        break;
      case 'ArrowRight':
        if (entry.items[entry.hot]?.sub) openSub(level, entry.hot, { keyboard: true });
        break;
      case 'ArrowLeft':
        if (level > 0) {
          closeFrom(level);
          highlight(level - 1, stack[level - 1].hot, { focus: true });
        }
        break;
      case 'Enter':
      case ' ':
        if (entry.hot >= 0) activate(level, entry.hot, { keyboard: true });
        break;
      case 'Escape':
        if (level > 0) {
          closeFrom(level);
          highlight(level - 1, stack[level - 1].hot, { focus: true });
        } else {
          closeAll();
        }
        break;
      case 'Tab':
        break;
      default: {
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
        const key = event.key.toLowerCase();
        const matches = order.filter((i) => accelOf(entry.items[i].label) === key);
        if (!matches.length) return;
        const next = matches.find((i) => i > entry.hot) ?? matches[0];
        highlight(level, next, { focus: true });
        if (matches.length === 1) activate(level, next, { keyboard: true });
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }

  window.addEventListener('keydown', onKey, { signal, capture: true });

  // Un appui hors des menus les referme.
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (!stack.length) return;
      if (event.target.closest?.('.w9x-menu')) return;
      if (event.target.closest?.('[data-menu-owner]')) return;
      closeAll({ focus: false });
    },
    { signal, capture: true },
  );

  return {
    open,
    close: () => closeAll(),
    closeSilently: () => closeAll({ silent: true, focus: false }),
    get isOpen() {
      return stack.length > 0;
    },
    // Coordonnées logiques d'un événement dans l'hôte
    point(event) {
      const rect = host.getBoundingClientRect();
      const s = scale();
      return { x: (event.clientX - rect.left) / s, y: (event.clientY - rect.top) / s };
    },
  };
}
