// Photos : une seule image dans la pellicule. Pincer (deux doigts, pavé tactile,
// Ctrl + molette), toucher deux fois ou utiliser les boutons +/− : à partir
// d'environ 3×, le panneau se lit « Pour rentrer, appelez le 2026 ».

import { pinchZoom, localPoint } from '../../ui/gestures.js';
import { GLYPHS } from './art.js';
import { photo, SIGN } from './photo.js';
import { h, nav, createStack } from './kit.js';

const MAX = 8;
const STEP = 1.5;
const READABLE = 2.9; // le double tap de pinchZoom mène à 3×
const BARS = { top: 64, bottom: 44 };

export function photosApp(host, kit) {
  const { ctx, audio, state } = kit;
  let zoomed = false;

  host.innerHTML = '<div class="ph-stack"></div>';
  const stack = createStack(host.firstElementChild);

  const roll = h(`<section class="ph-page ph-roll">
    ${nav({ title: 'Pellicule', style: 'black' })}
    <div class="ph-roll-grid">
      <button type="button" class="ph-thumb" aria-label="Ouvrir la photo">${photo({ className: 'ph-thumb-svg', thumb: true })}</button>
    </div>
    <p class="ph-roll-count">1 photo</p>
  </section>`);

  const viewer = h(`<section class="ph-page ph-viewer">
    <div class="ph-view" tabindex="0" role="img" aria-label="Photo d’une route de campagne. Au loin, un panneau vert, trop petit pour être lu. Plus et moins pour zoomer, flèches pour se déplacer.">
      <div class="ph-view-target">${photo()}</div>
    </div>
    ${nav({ title: '1 sur 1', back: 'Pellicule', style: 'clear' })}
    <footer class="ph-toolbar ph-toolbar-clear">
      <button type="button" class="ph-tool" data-zoom="out" aria-label="Dézoomer">${GLYPHS.zoomOut}</button>
      <span class="ph-tool-sep" aria-hidden="true"></span>
      <button type="button" class="ph-tool" data-zoom="in" aria-label="Zoomer">${GLYPHS.zoomIn}</button>
    </footer>
  </section>`);

  stack.push(roll, { animate: false });
  stack.push(viewer, { animate: false });

  const view = viewer.querySelector('.ph-view');
  const target = viewer.querySelector('.ph-view-target');
  const svg = target.querySelector('svg');
  const sign = svg.querySelector('.ph-sign');
  const btnIn = viewer.querySelector('[data-zoom="in"]');
  const btnOut = viewer.querySelector('[data-zoom="out"]');

  // Le panneau est-il assez grand, et bien dans le cadre ?
  function check({ zoom: z, x, y }) {
    const near = Math.min(1, Math.max(0, (z - 1.9) / 0.9));
    svg.style.setProperty('--near', near.toFixed(3));
    btnIn.disabled = z >= MAX - 0.01;
    btnOut.disabled = z <= 1.01;
    view.classList.toggle('is-zoomed', z > 1.01);
    if (!zoomed && z > 1.25) {
      zoomed = true;
      ctx.progress();
    }
    if (state.found || z < READABLE) return;
    const cx = x + (SIGN.x + SIGN.w / 2) * z;
    const cy = y + (SIGN.y + SIGN.h / 2) * z;
    const w = view.clientWidth;
    const hgt = view.clientHeight;
    if (cx > 12 && cx < w - 12 && cy > BARS.top + 6 && cy < hgt - BARS.bottom - 6) found();
  }

  function found() {
    state.found = true;
    sign.classList.add('is-found');
    ctx.note('2026', { key: 'phone-2026', label: 'Numéro à appeler' });
    ctx.progress();
  }

  const zoom = pinchZoom(view, target, { min: 1, max: MAX, onChange: check, signal: ctx.signal });

  // pinchZoom gère déjà le double tap au pointeur : on neutralise son écoute de
  // dblclick, qui annulerait aussitôt le zoom à la souris.
  ctx.on(viewer, 'dblclick', (event) => event.stopPropagation(), { capture: true });

  // Safari sur Mac : le pincement du pavé tactile arrive en GestureEvent.
  let gestureStart = 1;
  ctx.on(view, 'gesturestart', () => {
    gestureStart = zoom.zoom;
  });
  ctx.on(view, 'gesturechange', (event) => {
    if (event.scale) zoom.zoomTo(gestureStart * event.scale, localPoint(view, event));
  });

  // Ctrl + molette hors de la photo : pas de zoom de la page entière.
  ctx.on(
    viewer,
    'wheel',
    (event) => {
      if ((event.ctrlKey || event.metaKey) && !view.contains(event.target)) event.preventDefault();
    },
    { passive: false },
  );

  const zoomBy = (factor) => {
    audio.tap();
    zoom.zoomBy(factor);
  };
  ctx.on(btnIn, 'click', () => zoomBy(STEP));
  ctx.on(btnOut, 'click', () => zoomBy(1 / STEP));

  // Clavier : + et − pour zoomer, flèches pour se déplacer (molette simulée).
  ctx.on(view, 'keydown', (event) => {
    if (['+', '='].includes(event.key)) zoomBy(STEP);
    else if (['-', '_'].includes(event.key)) zoomBy(1 / STEP);
    else if (event.key === '0') zoom.reset();
    else {
      const d = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }[event.key];
      if (!d) return;
      const rect = view.getBoundingClientRect();
      view.dispatchEvent(
        new WheelEvent('wheel', {
          deltaX: d[0],
          deltaY: d[1],
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
          cancelable: true,
        }),
      );
    }
    event.preventDefault();
  });

  ctx.on(viewer.querySelector('[data-back]'), 'click', () => {
    audio.tap();
    stack.pop();
  });
  ctx.on(roll.querySelector('.ph-thumb'), 'click', () => {
    audio.tap();
    stack.push(viewer);
  });

  return {
    // Indices 1 et 2 : les boutons de zoom se signalent
    hint(level) {
      if (level > 2 || stack.top !== viewer) return;
      for (const btn of [btnIn, btnOut]) {
        btn.classList.remove('is-pulsing');
        void btn.offsetWidth;
        btn.classList.add('is-pulsing');
      }
    },
  };
}
