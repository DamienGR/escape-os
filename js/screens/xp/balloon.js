// Bulles d'information jaunes de XP, avec leur petite queue pointée vers
// l'élément qui parle. Une seule bulle à la fois ; un clic ailleurs la ferme.

import { esc, icon } from './art.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function createBalloons({ ui, view, ctx }) {
  let current = null;

  // Rectangle d'un élément dans le repère logique de l'écran XP
  function local(el) {
    const r = el.getBoundingClientRect();
    const u = ui.getBoundingClientRect();
    const s = u.width / ui.offsetWidth || 1;
    return { x: (r.left - u.left) / s, y: (r.top - u.top) / s, w: r.width / s, h: r.height / s };
  }

  function close() {
    current?.remove();
    current = null;
  }

  // place : 'auto' (au-dessus si la place le permet), 'above' ou 'below'
  function show(anchor, { title = '', text = '', kind = 'info', timeout = 6500, place = 'auto' } = {}) {
    close();
    const el = document.createElement('div');
    el.className = 'xp-balloon';
    el.setAttribute('role', 'status');
    el.innerHTML = `<button type="button" class="xp-balloon-x" aria-label="Fermer la bulle"></button>
      ${title ? `<p class="xp-balloon-title">${icon(kind, 16)}<b>${esc(title)}</b></p>` : ''}
      <p class="xp-balloon-text">${esc(text)}</p>`;
    ui.append(el);
    const a = local(anchor);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const above = place === 'above' || (place === 'auto' && a.y - h - 14 > 2);
    const x = clamp(a.x + a.w / 2 - 28, 4, view.w - w - 4);
    el.style.left = `${x}px`;
    el.style.top = `${above ? a.y - h - 12 : a.y + a.h + 12}px`;
    el.style.setProperty('--tail', `${clamp(a.x + a.w / 2 - x, 14, w - 26)}px`);
    el.classList.add(above ? 'is-above' : 'is-below');
    el.querySelector('.xp-balloon-x').addEventListener('click', close);
    current = el;
    const timer = ctx.timeout(() => current === el && close(), timeout);
    el.addEventListener('pointerenter', () => ctx.clear(timer), { once: true });
    return el;
  }

  ctx.on(ui, 'pointerdown', (event) => current && !current.contains(event.target) && close(), { capture: true });

  return { show, close, local };
}
