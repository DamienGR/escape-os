// Gestes partagés (cartes perforées, smartphone) en Pointer Events : l'API Drag and
// Drop HTML5 est inutilisable au tactile. Glisser, réordonner avec animation FLIP,
// glissière contrainte, pincement (deux doigts, Ctrl + molette, boutons +/−).
// Les écrans sont mis à l'échelle en CSS : les distances écran sont divisées par
// l'échelle pour revenir en pixels logiques.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Échelle CSS d'un élément (rapport taille affichée / taille logique)
export function scaleOf(el) {
  const rect = el.getBoundingClientRect();
  return el.offsetWidth ? rect.width / el.offsetWidth : 1;
}

// Coordonnées d'un événement dans le repère logique d'un élément
export function localPoint(el, event) {
  const rect = el.getBoundingClientRect();
  const s = scaleOf(el);
  return { x: (event.clientX - rect.left) / s, y: (event.clientY - rect.top) / s };
}

// ——— FLIP : First, Last, Invert, Play ———

export function flip(elements, mutate, { duration = 280, easing = 'cubic-bezier(.2,.7,.2,1)' } = {}) {
  const list = [...elements];
  const first = new Map(list.map((el) => [el, el.getBoundingClientRect()]));
  mutate();
  if (reduced()) return;
  for (const el of list) {
    if (!el.isConnected) continue;
    const a = first.get(el);
    const b = el.getBoundingClientRect();
    const s = scaleOf(el.offsetParent ?? el) || 1;
    const dx = (a.left - b.left) / s;
    const dy = (a.top - b.top) / s;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    el.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration, easing });
  }
}

// ——— Glisser ———
// onStart(info), onMove({ dx, dy, x, y, event }), onEnd({ dx, dy, event }), onTap(event)

export function drag(el, { handle = el, threshold = 4, onStart, onMove, onEnd, onTap, signal } = {}) {
  handle.style.touchAction = 'none';
  handle.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      const s = scaleOf(el.offsetParent ?? el) || 1;
      const start = { x: event.clientX, y: event.clientY };
      let dragging = false;
      let last = { dx: 0, dy: 0 };
      try {
        handle.setPointerCapture(event.pointerId);
      } catch {
        // pointeur déjà relâché
      }
      const move = (ev) => {
        const dx = (ev.clientX - start.x) / s;
        const dy = (ev.clientY - start.y) / s;
        if (!dragging) {
          if (Math.hypot(dx, dy) < threshold) return;
          dragging = true;
          onStart?.({ event });
        }
        last = { dx, dy };
        onMove?.({ dx, dy, event: ev });
      };
      const up = (ev) => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        if (dragging) onEnd?.({ ...last, event: ev, cancelled: ev.type === 'pointercancel' });
        else if (ev.type === 'pointerup') onTap?.(ev);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    },
    { signal },
  );
}

// ——— Liste réordonnable ———
// Les éléments enfants de `list` se réordonnent au glisser (axe vertical ou
// horizontal), et au clavier : Espace pour saisir, flèches pour déplacer,
// Espace pour poser, Échap pour annuler.

export function sortable(list, { axis = 'y', items = () => [...list.children], onChange, onPick, onDrop, announce, signal } = {}) {
  const key = axis === 'y' ? 'dy' : 'dx';
  const sizeOf = (el) => (axis === 'y' ? el.offsetHeight : el.offsetWidth);
  const posOf = (el) => (axis === 'y' ? el.offsetTop : el.offsetLeft);
  let grabbed = null;

  const attach = (item) => {
    if (item.dataset.sortable) return;
    item.dataset.sortable = '1';
    item.tabIndex = 0;
    let startIndex = 0;
    let origin = 0;

    drag(item, {
      signal,
      onStart: () => {
        startIndex = items().indexOf(item);
        origin = posOf(item);
        item.classList.add('is-dragging');
        onPick?.(item);
      },
      onMove: (move) => {
        // Position visuelle voulue : point de départ + déplacement du pointeur
        const visual = origin + move[key];
        const others = items().filter((el) => el !== item);
        const center = visual + sizeOf(item) / 2;
        let index = others.findIndex((el) => center < posOf(el) + sizeOf(el) / 2);
        if (index < 0) index = others.length;
        if (index !== items().indexOf(item)) {
          flip(others, () => list.insertBefore(item, others[index] ?? null), { duration: 200 });
        }
        const offset = visual - posOf(item);
        item.style.translate = axis === 'y' ? `${move.dx * 0.15}px ${offset}px` : `${offset}px ${move.dy * 0.15}px`;
      },
      onEnd: () => {
        const offset = item.style.translate;
        item.style.translate = '';
        item.classList.remove('is-dragging');
        if (!reduced() && offset) item.animate([{ translate: offset }, { translate: '0 0' }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
        const index = items().indexOf(item);
        onDrop?.(item, index);
        if (index !== startIndex) onChange?.(items());
      },
    });

    item.addEventListener(
      'keydown',
      (event) => {
        const all = items();
        const index = all.indexOf(item);
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          if (grabbed === item) {
            grabbed = null;
            item.classList.remove('is-grabbed');
            announce?.(`Posée en position ${index + 1}.`);
            onDrop?.(item, index);
            onChange?.(all);
          } else {
            grabbed?.classList.remove('is-grabbed');
            grabbed = item;
            item.classList.add('is-grabbed');
            announce?.(`Saisie, position ${index + 1} sur ${all.length}. Flèches pour déplacer, Espace pour poser.`);
            onPick?.(item);
          }
          return;
        }
        if (event.key === 'Escape' && grabbed === item) {
          grabbed = null;
          item.classList.remove('is-grabbed');
          return;
        }
        const prev = axis === 'y' ? 'ArrowUp' : 'ArrowLeft';
        const next = axis === 'y' ? 'ArrowDown' : 'ArrowRight';
        if (event.key !== prev && event.key !== next) return;
        event.preventDefault();
        if (grabbed !== item) {
          (event.key === prev ? all[index - 1] : all[index + 1])?.focus();
          return;
        }
        const target = event.key === prev ? index - 1 : index + 1;
        if (target < 0 || target >= all.length) return;
        flip(all, () => list.insertBefore(item, event.key === prev ? all[target] : all[target].nextSibling));
        item.focus();
        announce?.(`Position ${target + 1} sur ${all.length}.`);
      },
      { signal },
    );
  };

  const refresh = () => items().forEach(attach);
  refresh();
  return { refresh };
}

// ——— Glissière (« glisser pour déverrouiller ») ———

export function slider(track, knob, { onProgress, onComplete, threshold = 0.9, signal } = {}) {
  let done = false;
  const max = () => track.clientWidth - knob.offsetWidth;
  const set = (x, animate = false) => {
    knob.style.transition = animate ? 'translate 0.35s cubic-bezier(.2,.9,.2,1.2)' : 'none';
    knob.style.translate = `${x}px 0`;
    onProgress?.(max() ? x / max() : 0);
  };
  const finish = () => {
    done = true;
    set(max(), true);
    onComplete?.();
  };
  drag(knob, {
    signal,
    threshold: 1,
    onMove: ({ dx }) => !done && set(Math.min(max(), Math.max(0, dx))),
    onEnd: ({ dx }) => {
      if (done) return;
      if (dx >= max() * threshold) finish();
      else set(0, true);
    },
  });
  knob.tabIndex = 0;
  knob.setAttribute('role', 'slider');
  knob.setAttribute('aria-valuemin', '0');
  knob.setAttribute('aria-valuemax', '100');
  knob.addEventListener(
    'keydown',
    (event) => {
      if (done) return;
      if (['ArrowRight', 'End', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        finish();
      }
    },
    { signal },
  );
  return {
    reset() {
      done = false;
      set(0, true);
    },
  };
}

// ——— Pincement pour zoomer ———
// viewport : zone qui reçoit les gestes ; target : contenu transformé.
// Deux doigts, pincement du pavé tactile (Ctrl + molette), double tap, boutons via zoomBy.

export function pinchZoom(viewport, target, { min = 1, max = 6, onChange, signal } = {}) {
  let z = 1;
  let tx = 0;
  let ty = 0;
  const pointers = new Map();
  let gesture = null;
  let lastTap = 0;

  viewport.style.touchAction = 'none';
  target.style.transformOrigin = '0 0';

  const size = () => ({ w: viewport.clientWidth, h: viewport.clientHeight });
  const clampPan = () => {
    const { w, h } = size();
    tx = Math.min(0, Math.max(w - w * z, tx));
    ty = Math.min(0, Math.max(h - h * z, ty));
  };
  const apply = (animate = false) => {
    clampPan();
    target.style.transition = animate && !reduced() ? 'transform 0.3s cubic-bezier(.2,.7,.2,1)' : 'none';
    target.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
    onChange?.({ zoom: z, x: tx, y: ty });
  };
  const zoomAt = (next, point, animate = false) => {
    next = Math.min(max, Math.max(min, next));
    const ratio = next / z;
    tx = point.x - (point.x - tx) * ratio;
    ty = point.y - (point.y - ty) * ratio;
    z = next;
    apply(animate);
  };
  const center = () => ({ x: size().w / 2, y: size().h / 2 });

  viewport.addEventListener(
    'pointerdown',
    (event) => {
      try {
        viewport.setPointerCapture(event.pointerId);
      } catch {
        // sans conséquence
      }
      pointers.set(event.pointerId, localPoint(viewport, event));
      const pts = [...pointers.values()];
      if (pts.length === 2) {
        const [a, b] = pts;
        gesture = {
          type: 'pinch',
          d: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          z,
          mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          tx,
          ty,
        };
      } else if (pts.length === 1) {
        gesture = { type: 'pan', start: pts[0], tx, ty };
        const now = performance.now();
        if (now - lastTap < 320) {
          zoomAt(z > 1.5 ? 1 : 3, pts[0], true);
          lastTap = 0;
          gesture = null;
        } else {
          lastTap = now;
        }
      }
    },
    { signal },
  );

  viewport.addEventListener(
    'pointermove',
    (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, localPoint(viewport, event));
      const pts = [...pointers.values()];
      if (gesture?.type === 'pinch' && pts.length >= 2) {
        const [a, b] = pts;
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const next = Math.min(max, Math.max(min, gesture.z * (d / gesture.d)));
        // Le point du contenu sous le milieu initial suit le milieu courant
        const contentX = (gesture.mid.x - gesture.tx) / gesture.z;
        const contentY = (gesture.mid.y - gesture.ty) / gesture.z;
        z = next;
        tx = mid.x - contentX * z;
        ty = mid.y - contentY * z;
        apply();
      } else if (gesture?.type === 'pan' && pts.length === 1 && z > 1) {
        tx = gesture.tx + (pts[0].x - gesture.start.x);
        ty = gesture.ty + (pts[0].y - gesture.start.y);
        apply();
      }
    },
    { signal },
  );

  const release = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size === 1) {
      const [p] = [...pointers.values()];
      gesture = { type: 'pan', start: p, tx, ty };
    } else if (pointers.size === 0) {
      gesture = null;
    }
  };
  viewport.addEventListener('pointerup', release, { signal });
  viewport.addEventListener('pointercancel', release, { signal });

  // Pincement du pavé tactile et Ctrl + molette : wheel avec ctrlKey
  viewport.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const point = localPoint(viewport, event);
      if (event.ctrlKey || event.metaKey) {
        zoomAt(z * Math.exp(-event.deltaY * 0.01), point);
      } else if (z > 1) {
        tx -= event.deltaX;
        ty -= event.deltaY;
        apply();
      }
    },
    { passive: false, signal },
  );

  // Safari : bloquer le zoom natif de la page
  for (const type of ['gesturestart', 'gesturechange']) {
    viewport.addEventListener(type, (event) => event.preventDefault(), { signal });
  }

  viewport.addEventListener(
    'dblclick',
    (event) => {
      zoomAt(z > 1.5 ? 1 : 3, localPoint(viewport, event), true);
    },
    { signal },
  );

  apply();
  return {
    get zoom() {
      return z;
    },
    zoomBy: (factor) => zoomAt(z * factor, center(), true),
    zoomTo: (next, point = center()) => zoomAt(next, point, true),
    reset: () => {
      z = 1;
      tx = 0;
      ty = 0;
      apply(true);
    },
  };
}
