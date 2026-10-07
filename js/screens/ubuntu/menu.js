// Menus déroulants façon GNOME 2 : barres de menus (panneau, fenêtres), sous-menus
// au survol ou au toucher, navigation au clavier (flèches, Entrée, Échap).
// Un élément : { label, icon, run, sub, disabled, accel, checked } ou { sep: true }.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createMenus(layer, { scaleOf = () => 1, onActivate, signal } = {}) {
  const stack = []; // menus ouverts : [{ el, items, parentItem }]
  let bar = null; // { entries, active }
  let hoverTimer = 0;

  const local = (rect) => {
    const host = layer.getBoundingClientRect();
    const s = scaleOf() || 1;
    return {
      left: (rect.left - host.left) / s,
      top: (rect.top - host.top) / s,
      right: (rect.right - host.left) / s,
      bottom: (rect.bottom - host.top) / s,
    };
  };

  function render(items) {
    const menu = document.createElement('div');
    menu.className = 'ub-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = items
      .map((item, i) => {
        if (item.sep) return '<hr class="ub-msep">';
        const flags = [item.sub ? 'has-sub' : '', item.checked != null ? 'is-check' : ''].join(' ');
        return `<button type="button" class="ub-mi ${flags}" role="menuitem" data-i="${i}" ${item.disabled ? 'disabled' : ''} ${
          item.sub ? 'aria-haspopup="true"' : ''
        }>
          <span class="ub-mi-ico">${item.checked ? '<span class="ub-mi-tick">✓</span>' : item.icon ?? ''}</span>
          <span class="ub-mi-label">${esc(item.label)}</span>
          ${item.accel ? `<span class="ub-mi-accel">${esc(item.accel)}</span>` : ''}
          ${item.sub ? '<span class="ub-mi-arrow" aria-hidden="true"></span>' : ''}
        </button>`;
      })
      .join('');
    return menu;
  }

  function place(menu, anchorRect, mode) {
    layer.append(menu);
    const w = menu.offsetWidth;
    const h = menu.offsetHeight;
    const maxW = layer.clientWidth;
    const maxH = layer.clientHeight;
    let left;
    let top;
    if (mode === 'right') {
      left = anchorRect.right - 2;
      top = anchorRect.top - 4;
      if (left + w > maxW) left = anchorRect.left - w + 2;
    } else if (mode === 'above') {
      left = anchorRect.left;
      top = anchorRect.top - h;
    } else {
      left = anchorRect.left;
      top = anchorRect.bottom;
    }
    left = Math.max(0, Math.min(maxW - w, left));
    top = Math.max(0, Math.min(maxH - h, top));
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
  }

  function closeFrom(level) {
    while (stack.length > level) {
      const entry = stack.pop();
      entry.el.remove();
      entry.parentButton?.classList.remove('is-open');
    }
  }

  function closeAll() {
    clearTimeout(hoverTimer);
    closeFrom(0);
    if (bar?.active) {
      bar.active.el.classList.remove('is-open');
      bar.active.el.setAttribute('aria-expanded', 'false');
    }
    if (bar) bar.active = null;
    bar = null;
  }

  // Après un choix, le focus quitte le menu : la saisie retourne au terminal.
  function release() {
    const active = document.activeElement;
    if (active?.closest?.('.ub-menu, .ub-pm')) active.blur();
  }

  function activate(item) {
    if (item.disabled || item.sub) return;
    closeAll();
    release();
    onActivate?.(item);
    item.run?.();
  }

  function openSub(level, button, item, focusFirst = false) {
    closeFrom(level + 1);
    button.classList.add('is-open');
    const menu = render(item.sub);
    place(menu, local(button.getBoundingClientRect()), 'right');
    stack.push({ el: menu, items: item.sub, parentButton: button });
    wire(menu, item.sub, level + 1);
    if (focusFirst) menu.querySelector('.ub-mi:not(:disabled)')?.focus({ preventScroll: true });
  }

  function wire(menu, items, level) {
    menu.addEventListener('click', (event) => {
      const button = event.target.closest('.ub-mi');
      if (!button) return;
      const item = items[Number(button.dataset.i)];
      if (item.sub) openSub(level, button, item, event.detail === 0);
      else activate(item);
    });
    menu.addEventListener('pointerover', (event) => {
      if (event.pointerType === 'touch') return;
      const button = event.target.closest('.ub-mi');
      if (!button || button.disabled) return;
      button.focus({ preventScroll: true });
      const item = items[Number(button.dataset.i)];
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (item.sub) {
          if (!button.classList.contains('is-open')) openSub(level, button, item);
        } else {
          closeFrom(level + 1);
        }
      }, 110);
    });
    menu.addEventListener('keydown', (event) => {
      const buttons = [...menu.querySelectorAll('.ub-mi:not(:disabled)')];
      const index = buttons.indexOf(document.activeElement);
      const item = items[Number(document.activeElement?.dataset?.i)];
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        buttons[(index + step + buttons.length) % buttons.length]?.focus({ preventScroll: true });
      } else if (event.key === 'ArrowRight' && item?.sub) {
        event.preventDefault();
        openSub(level, document.activeElement, item, true);
      } else if (event.key === 'ArrowLeft' && level > 0) {
        event.preventDefault();
        const parent = stack[level].parentButton;
        closeFrom(level);
        parent?.focus({ preventScroll: true });
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        switchBar(event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        const opener = bar?.active?.el;
        closeAll();
        opener?.focus({ preventScroll: true });
      }
    });
  }

  // Ouvre un menu sous (ou au-dessus de) l'élément d'ancrage.
  function open(anchor, items, { mode = 'below', focusFirst = false } = {}) {
    closeFrom(0);
    const menu = render(items);
    place(menu, local(anchor.getBoundingClientRect()), mode);
    stack.push({ el: menu, items, parentButton: null });
    wire(menu, items, 0);
    if (focusFirst) menu.querySelector('.ub-mi:not(:disabled)')?.focus({ preventScroll: true });
    return menu;
  }

  // ——— Barres de menus : un clic ouvre, le survol bascule de l'un à l'autre ———

  function openEntry(group, entry, focusFirst = false) {
    if (bar?.active) {
      bar.active.el.classList.remove('is-open');
      bar.active.el.setAttribute('aria-expanded', 'false');
    }
    bar = group;
    group.active = entry;
    entry.el.classList.add('is-open');
    entry.el.setAttribute('aria-expanded', 'true');
    open(entry.el, typeof entry.items === 'function' ? entry.items() : entry.items, { mode: entry.mode, focusFirst });
  }

  function switchBar(step) {
    if (!bar?.active) return;
    const list = bar.entries;
    const next = list[(list.indexOf(bar.active) + step + list.length) % list.length];
    openEntry(bar, next, true);
    next.el.focus({ preventScroll: true });
  }

  function bindBar(entries) {
    const group = { entries, active: null };
    for (const entry of entries) {
      entry.el.setAttribute('aria-haspopup', 'true');
      entry.el.setAttribute('aria-expanded', 'false');
      entry.el.addEventListener('click', (event) => {
        if (bar === group && group.active === entry) {
          closeAll();
          if (event.detail) release();
        } else {
          openEntry(group, entry, event.detail === 0);
        }
      });
      entry.el.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'touch' && bar === group && group.active && group.active !== entry) openEntry(group, entry);
      });
      entry.el.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          openEntry(group, entry, true);
        }
      });
    }
    return group;
  }

  // Clic ailleurs ou Échap : tout se referme.
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (!stack.length) return;
      if (event.target.closest?.('.ub-menu')) return;
      if (bar?.entries.some((entry) => entry.el.contains(event.target))) return;
      closeAll();
      release();
    },
    { capture: true, signal },
  );
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && stack.length) closeAll();
    },
    { signal },
  );

  return {
    open,
    bindBar,
    closeAll,
    get isOpen() {
      return stack.length > 0;
    },
  };
}
