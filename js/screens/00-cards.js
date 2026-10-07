// Écran 0 — Années 1960 : le paquet renversé. Huit cartes perforées gisent au
// sol ; il faut reconstituer le paquet dans le bac, dans l'ordre des numéros de
// séquence (colonnes 73 à 80), puis appuyer sur LECTURE. Aucun écran : la seule
// réponse de la machine est un listing papier.

import { drag, localPoint } from '../ui/gestures.js';
import { eraStats, save } from '../core/state.js';
import { CARD_W, CARD_H, BAND, PROGRAM, seqOf, cardDefs, cardSvg, feltPath, listing, slip } from './cards/hollerith.js';
import { LAYOUTS, SIZES, HOPPER, SLOT, roomDefs, roomMarkup, readerFront } from './cards/room.js';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const EASE = 'cubic-bezier(.2,.7,.2,1)';
const LAND = 'cubic-bezier(.25,1.25,.45,1)';
const BUBBLE = 'Les programmeurs traçaient ce trait diagonal justement pour ça.';

export default {
  id: 'cards',
  era: 'Cartes perforées',
  year: 1965,

  mount(root, ctx) {
    const { audio } = ctx;
    root.classList.add('cr');
    root.innerHTML = `${roomDefs()}${cardDefs('pc')}
      <div class="cr-room">
        ${roomMarkup()}
        <div class="cr-cards" role="group" aria-label="Cartes perforées"></div>
        ${readerFront()}
        <div class="cr-bubble" hidden><p>${BUBBLE}</p></div>
      </div>
      <p class="sr-only" aria-live="polite" data-live></p>
      <p class="sr-only" id="cr-help-floor">Entrée ou Espace : ranger la carte dans le bac.</p>
      <p class="sr-only" id="cr-help-tray">Espace : saisir ou poser la carte. Flèches : la déplacer dans le paquet. Échap : annuler. Suppr : la reposer par terre.</p>
      <p class="sr-only" id="cr-read-help">Lit le paquet posé dans le bac. Le résultat sort sur l’imprimante.</p>`;

    const $ = (sel) => root.querySelector(sel);
    const room = $('.cr-room');
    const layer = $('.cr-cards');
    const trayEl = $('.cr-tray');
    const deskEl = $('.cr-desk');
    const readBtn = $('.cr-read');
    const live = $('[data-live]');
    const countEl = $('.cr-count');
    const bubble = $('.cr-bubble');
    const paperLines = $('.cr-paper-lines');
    const stackEl = $('.cr-stack');
    const parts = Object.fromEntries([...root.querySelectorAll('[data-part]')].map((el) => [el.dataset.part, el]));

    // ——— Les cartes ———

    const cards = PROGRAM.map((line, rank) => {
      const el = document.createElement('div');
      el.className = 'pc';
      el.tabIndex = 0;
      el.dataset.seq = seqOf(rank);
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Carte ${seqOf(rank)} : ${line.trim().replace(/\s+/g, ' ')}`);
      el.innerHTML = `<div class="pc-body">${cardSvg(rank, 'pc')}</div>`;
      layer.append(el);
      return { rank, el, zone: 'floor', slot: -1, jitter: [0, 0, 0], u: 0, v: 0, rot: 0, z: rank, pose: null };
    });
    const cardOf = (el) => cards.find((card) => card.el === el);

    let L = null;
    let CW = 0;
    let CH = 0;
    let D = 0;
    let FS = 1;
    let tray = [];
    let phase = 'intro';
    let dragging = null;
    let grabbed = null;
    let syncing = false;
    let wasSorted = false;
    let sortedAt = 0;
    let job = 42;
    let camera = false;
    let raf = 0;
    let stopPrinter = () => {};
    let stopAmbience = null;
    const announce = (text) => {
      live.textContent = '';
      requestAnimationFrame(() => (live.textContent = text));
    };

    // ——— Poses : centre, rotation, échelle, dans le repère de la salle ———

    const poseCss = (p) => `translate(${(p.x - CW / 2).toFixed(2)}px, ${(p.y - CH / 2).toFixed(2)}px) rotate(${p.r.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;

    function visualPose(card) {
      const m = new DOMMatrixReadOnly(getComputedStyle(card.el).transform);
      return { x: m.e + CW / 2, y: m.f + CH / 2, r: (Math.atan2(m.b, m.a) * 180) / Math.PI, s: Math.hypot(m.a, m.b) };
    }

    const trayOrigin = () => ({ x: L.tray.x + L.tray.pad, y: L.tray.y + L.tray.pad });
    const trayPose = (i) => ({ x: trayOrigin().x + CW / 2, y: trayOrigin().y + i * D + CH / 2, r: 0, s: 1 });
    const floorPose = (card) => {
      const f = L.floor;
      return { x: f.x0 + card.u * (f.x1 - f.x0), y: f.y0 + card.v * (f.y1 - f.y0), r: card.rot, s: FS };
    };
    const hopperPose = (i) => {
      const p = L.parts.reader;
      const s = p.s ?? 1;
      return { x: p.x + HOPPER.x * s, y: p.y + (HOPPER.y - i * 0.45) * s, r: 0, s: (HOPPER.w * s) / CW };
    };
    const same = (a, b) => a && b && Math.abs(a.x - b.x) < 0.05 && Math.abs(a.y - b.y) < 0.05 && Math.abs(a.r - b.r) < 0.05 && Math.abs(a.s - b.s) < 0.001;

    // Trajectoire en cloche : la carte se soulève, puis se pose.
    function frames(from, to, lift) {
      if (!lift) return [{ transform: poseCss(from) }, { transform: poseCss(to) }];
      const out = [];
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const bump = Math.sin(Math.PI * t);
        out.push({
          offset: t,
          transform: poseCss({
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t - lift * bump,
            r: from.r + (to.r - from.r) * t,
            s: from.s + (to.s - from.s) * t + 0.08 * Math.max(from.s, to.s) * bump,
          }),
        });
      }
      return out;
    }

    function place(card, pose, { animate = true, duration = 320, easing = EASE, delay = 0, lift = 0, from } = {}) {
      const { el } = card;
      const start = from ?? (card.pose ? visualPose(card) : null);
      const moving = !same(card.pose, pose) || el.getAnimations().length > 0;
      card.pose = pose;
      for (const anim of el.getAnimations()) anim.cancel();
      el.style.transform = poseCss(pose);
      if (!animate || !start || !moving || reduced()) return null;
      const anim = el.animate(frames(start, pose, lift), { duration, easing, delay, fill: 'backwards' });
      // Une carte en vol ne doit pas intercepter les clics destinés aux autres
      if (lift) {
        el.classList.add('is-flying');
        const land = () => el.classList.remove('is-flying');
        anim.addEventListener('finish', land);
        anim.addEventListener('cancel', land);
      }
      return anim;
    }

    function layoutCards({ animate = true, duration = 300, gap = -1, except = null } = {}) {
      tray.forEach((card, i) => {
        if (card === except) return;
        card.el.style.zIndex = 40 + i;
        place(card, trayPose(i + (gap >= 0 && i >= gap ? 1 : 0)), { animate, duration });
      });
      for (const card of cards) {
        if (card.zone !== 'floor' || card === except) continue;
        card.el.style.zIndex = 20 + card.z;
        place(card, floorPose(card), { animate, duration });
      }
    }

    // Ordre du DOM = ordre de tabulation : le sol de gauche à droite, puis le bac.
    function syncDom() {
      const active = document.activeElement;
      const floor = cards
        .filter((card) => card.zone === 'floor')
        .sort((a, b) => Math.round(a.v * 2) - Math.round(b.v * 2) || a.u - b.u);
      const order = [...floor, ...tray, ...cards.filter((card) => card.zone !== 'floor' && !tray.includes(card))];
      syncing = true;
      order.forEach((card, i) => {
        if (layer.children[i] !== card.el) layer.insertBefore(card.el, layer.children[i] ?? null);
      });
      syncing = false;
      if (active && layer.contains(active) && document.activeElement !== active) active.focus({ preventScroll: true });
      for (const card of cards) {
        card.el.dataset.zone = card.zone;
        card.el.setAttribute('aria-describedby', card.zone === 'tray' ? 'cr-help-tray' : 'cr-help-floor');
      }
    }

    function raiseOnFloor(card) {
      const floor = cards.filter((c) => c.zone === 'floor' && c !== card).sort((a, b) => a.z - b.z);
      floor.forEach((c, i) => (c.z = i));
      card.z = floor.length;
    }

    // ——— Mise en page : paysage ou portrait ———

    function applyLayout(force = false) {
      const next = ctx.geometry?.portrait ? LAYOUTS.portrait : LAYOUTS.landscape;
      if (next === L && !force) return;
      L = next;
      root.dataset.layout = L.key;
      room.style.width = `${L.w}px`;
      room.style.height = `${L.h}px`;
      room.style.setProperty('--floor-y', `${L.floorY}px`);
      for (const [name, el] of Object.entries(parts)) {
        const p = L.parts[name === 'readerFront' ? 'reader' : name];
        el.classList.toggle('is-off', !p || Boolean(L.hide?.includes(name)));
        if (!p) continue;
        const [w, h] = SIZES[name];
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.setProperty('--s', p.s ?? 1);
        el.style.setProperty('--r', `${p.r ?? 0}deg`);
      }
      const band = L.band ?? BAND;
      CW = L.card.tray;
      CH = (CW * CARD_H) / CARD_W;
      D = (band * CW) / CARD_W;
      FS = L.card.floor / CW;
      // Le trait de feutre suit la hauteur des bandes de la mise en page
      for (const card of cards) {
        for (const path of card.el.querySelectorAll('.pc-felt')) path.setAttribute('d', feltPath(card.rank, band));
      }
      const { x, y, pad } = L.tray;
      Object.assign(trayEl.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${CW + pad * 2}px`,
        height: `${CH + 7 * D + pad * 2}px`,
      });
      trayEl.style.setProperty('--cw', `${CW}px`);
      trayEl.style.setProperty('--ch', `${CH}px`);
      trayEl.style.setProperty('--pad', `${pad}px`);
      trayEl.style.setProperty('--d', `${D}px`);
      Object.assign(deskEl.style, { left: `${L.desk.x}px`, top: `${L.desk.y}px`, width: `${L.desk.w}px`, height: `${L.desk.h}px` });
      bubble.style.left = `${L.bubble.x}px`;
      bubble.style.top = `${L.bubble.y}px`;
      for (const card of cards) {
        card.el.style.width = `${CW}px`;
        card.el.style.height = `${CH}px`;
      }
      if (dragging) endDrag(dragging.card, null, true);
      for (const card of cards) {
        if (card.zone === 'reader') place(card, hopperPose(card.rank), { animate: false });
        if (card.zone === 'floor' && card.slot >= 0) fromSlot(card);
      }
      layoutCards({ animate: false });
      if (camera) aim(false);
    }

    // ——— Éparpillement au sol ———
    // Chaque carte tombée occupe une place (slot) de la mise en page, avec un
    // léger désordre ; une carte reposée à la main garde sa position (slot -1).

    function fromSlot(card) {
      const [u, v, r] = L.slots[card.slot];
      card.u = u + card.jitter[0];
      card.v = v + card.jitter[1];
      card.rot = r + card.jitter[2];
    }

    function scatter(list) {
      const order = L.slots.map((_, i) => i).sort(() => Math.random() - 0.5);
      list.forEach((card, k) => {
        card.slot = order[k % order.length];
        const [ju, jv, jr] = L.jitter;
        card.jitter = [rand(-ju, ju), rand(-jv, jv), rand(-jr, jr)];
        card.z = L.slots[card.slot][3];
        fromSlot(card);
      });
    }

    // Place libre pour une carte reposée par terre au clavier
    function freeSpot(card) {
      const taken = new Set(cards.filter((c) => c.zone === 'floor' && c !== card).map((c) => c.slot));
      let slot = L.slots.findIndex((_, i) => !taken.has(i));
      if (slot < 0) slot = Math.floor(Math.random() * L.slots.length);
      card.slot = slot;
      card.jitter = [rand(-0.03, 0.03), rand(-0.04, 0.04), rand(-6, 6)];
      fromSlot(card);
    }

    // ——— Sons de papier ———

    const sfx = {
      pick: () => audio.noise({ type: 'highpass', freq: 2600, release: 0.05, vol: 0.06 }),
      tray: () => {
        audio.noise({ type: 'bandpass', freq: 1500, q: 0.8, release: 0.05, vol: 0.09 });
        audio.noise({ type: 'lowpass', freq: 260, release: 0.07, vol: 0.08 });
      },
      floor: () => audio.noise({ type: 'lowpass', freq: 900, release: 0.09, vol: 0.07 }),
      flutter: (n = 8, spread = 0.5) => {
        for (let i = 0; i < n; i++) {
          audio.noise({ at: Math.random() * spread, type: 'bandpass', freq: 1800 + Math.random() * 1600, q: 1.2, release: 0.04, vol: 0.05 });
        }
        audio.noise({ at: spread * 0.8, type: 'lowpass', freq: 500, release: 0.12, vol: 0.06 });
      },
      relay: () => audio.tone({ freq: 95, type: 'square', release: 0.05, vol: 0.05, filter: { freq: 500 } }),
      buzz: () => {
        audio.tone({ freq: 118, type: 'sawtooth', attack: 0.01, hold: 0.42, release: 0.06, vol: 0.07, filter: { freq: 1100 } });
        audio.tone({ freq: 236, type: 'square', attack: 0.01, hold: 0.42, release: 0.06, vol: 0.02, filter: { freq: 900 } });
      },
      squared: () => {
        audio.noise({ type: 'lowpass', freq: 420, release: 0.05, vol: 0.09 });
        audio.noise({ at: 0.09, type: 'lowpass', freq: 420, release: 0.05, vol: 0.08 });
        audio.melody([['E6', 0.16, 0.25], ['A6', 0.23, 0.45]], { vol: 0.03 });
      },
      pencil: () => {
        for (let t = 0; t < 0.6; t += 0.05) {
          audio.noise({ at: t, type: 'bandpass', freq: 3200 + Math.random() * 1500, q: 2, release: 0.04, vol: 0.025 });
        }
      },
    };

    // ——— Voyants ———

    const lamp = (name, on, blink = false) => {
      for (const el of root.querySelectorAll(`.cr-reader .cr-lens-${name}`)) {
        el.classList.toggle('on', on);
        el.classList.toggle('blink', on && blink);
      }
    };
    const printerLamp = (on) => root.querySelector('.cr-printer .cr-lens-print')?.classList.toggle('on', on);

    // ——— État du paquet ———

    const isSorted = () => tray.length === 8 && tray.every((card, i) => card.rank === i);

    function checkDeck() {
      countEl.textContent = `${tray.length}/8`;
      trayEl.classList.toggle('is-empty', tray.length === 0);
      const full = tray.length === 8;
      lamp('ready', full);
      readBtn.classList.toggle('is-ready', full);
      const sorted = isSorted();
      if (sorted && !wasSorted) onSorted();
      if (!sorted) trayEl.classList.remove('is-sorted');
      wasSorted = sorted;
    }

    function onSorted() {
      sortedAt = performance.now();
      ctx.progress();
      trayEl.classList.add('is-sorted');
      sfx.squared();
      if (!reduced()) {
        tray.forEach((card, i) => {
          card.el.querySelector('.pc-body').animate(
            [{ transform: 'none' }, { transform: 'translateY(-5px)' }, { transform: 'none' }],
            { duration: 320, delay: 180 + i * 28, easing: 'ease-out' },
          );
        });
      }
      announce('Le paquet est complet et dans l’ordre : le trait de feutre est droit. Appuie sur LECTURE.');
    }

    function entered(card) {
      ctx.progress();
      lamp('error', false);
      hideBubble();
      announce(`Carte ${seqOf(card.rank)} rangée dans le bac, position ${tray.indexOf(card) + 1} sur ${tray.length}.`);
    }

    // ——— Gestes : glisser, toucher ———

    function trayRect() {
      const r = trayEl;
      return { x: r.offsetLeft, y: r.offsetTop, w: r.offsetWidth, h: r.offsetHeight };
    }

    function overTray(st) {
      const t = trayRect();
      const m = 28;
      const inside = (x, y) => x > t.x - m && x < t.x + t.w + m && y > t.y - m && y < t.y + t.h + m;
      return inside(st.pointer.x, st.pointer.y) || inside(st.pose.x, st.pose.y);
    }

    function startDrag(card, event) {
      if (phase !== 'play' || dragging || !['floor', 'tray'].includes(card.zone)) return;
      if (grabbed) dropGrab(false);
      const p = localPoint(room, event);
      const pose = visualPose(card);
      for (const anim of card.el.getAnimations()) anim.cancel();
      const rad = (-pose.r * Math.PI) / 180;
      const dx = p.x - pose.x;
      const dy = p.y - pose.y;
      const from = card.zone;
      const index = tray.indexOf(card);
      if (from === 'tray') tray.splice(index, 1);
      dragging = {
        card,
        from,
        index,
        gx: (dx * Math.cos(rad) - dy * Math.sin(rad)) / pose.s,
        gy: (dx * Math.sin(rad) + dy * Math.cos(rad)) / pose.s,
        pointer: p,
        pose: { ...pose },
        tilt: 0,
        swing: 0,
        last: { x: p.x, t: performance.now() },
        gap: from === 'tray' ? index : -1,
        over: from === 'tray',
      };
      card.zone = 'drag';
      card.el.style.zIndex = 70;
      card.el.classList.add('is-dragging');
      root.classList.add('is-dragging');
      trayEl.classList.toggle('is-target', dragging.over);
      hideBubble();
      sfx.pick();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(dragFrame);
    }

    function dragFrame() {
      const st = dragging;
      if (!st) return;
      const calm = reduced();
      const k = calm ? 1 : 0.28;
      st.swing *= 0.86;
      st.tilt += (st.swing - st.tilt) * 0.2;
      st.pose.s += (1.04 - st.pose.s) * k;
      st.pose.r += (st.tilt - st.pose.r) * k;
      const rad = (st.pose.r * Math.PI) / 180;
      const gx = st.gx * st.pose.s;
      const gy = st.gy * st.pose.s;
      st.pose.x = st.pointer.x - (gx * Math.cos(rad) - gy * Math.sin(rad));
      st.pose.y = st.pointer.y - (gx * Math.sin(rad) + gy * Math.cos(rad));
      st.card.pose = { ...st.pose };
      st.card.el.style.transform = poseCss(st.pose);
      raf = requestAnimationFrame(dragFrame);
    }

    function moveDrag(card, event) {
      const st = dragging;
      if (st?.card !== card) return;
      const p = localPoint(room, event);
      const now = performance.now();
      const vx = (p.x - st.last.x) / Math.max(8, now - st.last.t);
      st.swing = clamp(st.swing + vx * 2.2, -9, 9);
      st.last = { x: p.x, t: now };
      st.pointer = p;
      const over = overTray(st);
      let gap = -1;
      if (over) {
        const top = st.pose.y - (CH * st.pose.s) / 2;
        gap = clamp(Math.round((top - trayOrigin().y) / D), 0, tray.length);
      }
      if (over !== st.over) trayEl.classList.toggle('is-target', over);
      st.over = over;
      if (gap !== st.gap) {
        st.gap = gap;
        layoutCards({ gap, except: card, duration: 200 });
      }
    }

    function endDrag(card, event, cancelled = false) {
      const st = dragging;
      if (st?.card !== card) return;
      cancelAnimationFrame(raf);
      dragging = null;
      card.el.classList.remove('is-dragging');
      root.classList.remove('is-dragging');
      trayEl.classList.remove('is-target');
      const intoTray = cancelled ? st.from === 'tray' : overTray(st);
      if (intoTray) {
        const at = cancelled ? st.index : st.gap >= 0 ? st.gap : tray.length;
        tray.splice(clamp(at, 0, tray.length), 0, card);
        card.zone = 'tray';
      } else {
        card.zone = 'floor';
        if (!cancelled) {
          const f = L.drop;
          const box = L.floor;
          const x = clamp(st.pose.x, f.x0, f.x1);
          const y = clamp(st.pose.y, f.y0, f.y1);
          card.slot = -1;
          card.u = (x - box.x0) / (box.x1 - box.x0);
          card.v = (y - box.y0) / (box.y1 - box.y0);
          card.rot = clamp(st.pose.r + rand(-14, 14), -30, 30);
        }
        raiseOnFloor(card);
      }
      syncDom();
      card.el.style.zIndex = card.zone === 'tray' ? 40 + tray.indexOf(card) : 20 + card.z;
      place(card, card.zone === 'tray' ? trayPose(tray.indexOf(card)) : floorPose(card), { duration: 300, easing: LAND, from: st.pose });
      layoutCards({ duration: 260, except: card });
      if (cancelled) return;
      if (card.zone === 'tray') {
        sfx.tray();
        if (st.from === 'tray') {
          announce(`Carte ${seqOf(card.rank)} posée en position ${tray.indexOf(card) + 1} sur ${tray.length}.`);
        } else entered(card);
      } else {
        sfx.floor();
        if (st.from === 'tray') announce(`Carte ${seqOf(card.rank)} reposée par terre.`);
      }
      checkDeck();
    }

    function pushToTray(card) {
      tray.push(card);
      card.zone = 'tray';
      syncDom();
      card.el.style.zIndex = 40 + tray.length - 1;
      place(card, trayPose(tray.length - 1), { duration: 560, lift: 70, easing: 'cubic-bezier(.3,.6,.25,1)' });
      sfx.pick();
      ctx.timeout(sfx.tray, reduced() ? 0 : 470);
      entered(card);
      checkDeck();
    }

    function toFloor(card) {
      tray.splice(tray.indexOf(card), 1);
      card.zone = 'floor';
      freeSpot(card);
      raiseOnFloor(card);
      syncDom();
      card.el.style.zIndex = 20 + card.z;
      place(card, floorPose(card), { duration: 520, lift: 50 });
      layoutCards({ except: card });
      sfx.floor();
      announce(`Carte ${seqOf(card.rank)} reposée par terre.`);
      checkDeck();
    }

    function nudge(card) {
      if (reduced()) return;
      card.el.querySelector('.pc-body').animate(
        [{ transform: 'none' }, { transform: 'translateX(-4px) rotate(-.6deg)' }, { transform: 'translateX(3px) rotate(.4deg)' }, { transform: 'none' }],
        { duration: 280, easing: 'ease-out' },
      );
    }

    function tap(card) {
      if (phase !== 'play' || dragging) return;
      if (card.zone === 'floor') pushToTray(card);
      else if (card.zone === 'tray') {
        const stats = eraStats(ctx.era.id);
        if (isSorted() && !stats.spilled && performance.now() - sortedAt > 450) spill(stats);
        else nudge(card);
      }
    }

    const threshold = Math.max(4, 7 / (ctx.scale || 1));
    for (const card of cards) {
      drag(card.el, {
        threshold,
        signal: ctx.signal,
        onStart: ({ event }) => startDrag(card, event),
        onMove: ({ event }) => moveDrag(card, event),
        onEnd: ({ event, cancelled }) => endDrag(card, event, cancelled),
        onTap: () => tap(card),
      });
    }

    // ——— Clavier : Entrée range une carte, Espace la saisit dans le bac ———

    function dropGrab(cancel) {
      const { card, origin } = grabbed;
      grabbed = null;
      card.el.classList.remove('is-grabbed');
      if (cancel && tray.includes(card)) {
        tray.splice(tray.indexOf(card), 1);
        tray.splice(origin, 0, card);
        syncDom();
        layoutCards({ duration: 240 });
        card.el.focus({ preventScroll: true });
        announce(`Déplacement annulé : carte remise en position ${origin + 1}.`);
      }
      checkDeck();
    }

    ctx.on(layer, 'keydown', (event) => {
      const card = cardOf(event.target.closest?.('.pc'));
      if (!card || phase !== 'play' || dragging) return;
      const { key } = event;
      if (card.zone === 'floor') {
        if (key !== 'Enter' && key !== ' ') return;
        event.preventDefault();
        const floor = [...layer.children].filter((el) => cardOf(el).zone === 'floor');
        const next = floor[floor.indexOf(card.el) + 1] ?? floor[floor.indexOf(card.el) - 1];
        pushToTray(card);
        (next ?? card.el).focus({ preventScroll: true });
        return;
      }
      if (card.zone !== 'tray') return;
      const index = tray.indexOf(card);
      if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        if (grabbed?.card === card) {
          dropGrab(false);
          announce(`Carte posée en position ${index + 1} sur ${tray.length}.`);
          if (isSorted()) announce('Le paquet est complet et dans l’ordre : le trait de feutre est droit. Appuie sur LECTURE.');
        } else {
          if (grabbed) dropGrab(false);
          grabbed = { card, origin: index };
          card.el.classList.add('is-grabbed');
          sfx.pick();
          announce(`Carte ${seqOf(card.rank)} saisie, position ${index + 1} sur ${tray.length}. Flèches pour la déplacer, Espace pour la poser, Échap pour annuler.`);
        }
        return;
      }
      if (key === 'Escape' && grabbed?.card === card) {
        event.preventDefault();
        dropGrab(true);
        return;
      }
      if ((key === 'Delete' || key === 'Backspace') && !grabbed) {
        event.preventDefault();
        const next = tray[index + 1] ?? tray[index - 1];
        toFloor(card);
        (next?.el ?? card.el).focus({ preventScroll: true });
        return;
      }
      const prev = key === 'ArrowUp' || key === 'ArrowLeft';
      const next = key === 'ArrowDown' || key === 'ArrowRight';
      if (!prev && !next) return;
      event.preventDefault();
      if (grabbed?.card !== card) {
        tray[index + (prev ? -1 : 1)]?.el.focus({ preventScroll: true });
        return;
      }
      const target = index + (prev ? -1 : 1);
      if (target < 0 || target >= tray.length) return;
      tray.splice(index, 1);
      tray.splice(target, 0, card);
      syncDom();
      layoutCards({ duration: 220 });
      card.el.focus({ preventScroll: true });
      audio.tick();
      announce(`Position ${target + 1} sur ${tray.length}.`);
    });

    ctx.on(layer, 'focusout', (event) => {
      if (syncing || !grabbed || event.target !== grabbed.card.el) return;
      dropGrab(false);
    });

    // ——— Bonus : le paquet trié retombe ———

    function spill(stats) {
      stats.spilled = true;
      save();
      const fallen = tray.slice();
      tray = [];
      scatter(fallen);
      fallen.forEach((card) => {
        card.zone = 'floor';
      });
      syncDom();
      fallen.forEach((card, i) => {
        card.el.style.zIndex = 20 + card.z;
        place(card, floorPose(card), { duration: 720, delay: i * 45, lift: 110, easing: LAND });
      });
      sfx.flutter(14, 0.7);
      wasSorted = false;
      checkDeck();
      showBubble();
      announce(`Patatras : le paquet est retombé par terre. ${BUBBLE}`);
    }

    let bubbleTimer = 0;
    function showBubble() {
      bubble.hidden = false;
      bubble.classList.remove('out');
      ctx.clear(bubbleTimer);
      bubbleTimer = ctx.timeout(hideBubble, 9000);
    }
    function hideBubble() {
      if (bubble.hidden || bubble.classList.contains('out')) return;
      bubble.classList.add('out');
      ctx.timeout(() => {
        bubble.hidden = true;
        bubble.classList.remove('out');
      }, 300);
    }

    // ——— LECTURE ———

    async function read() {
      if (phase !== 'play' || dragging) return;
      if (grabbed) dropGrab(false);
      phase = 'busy';
      root.classList.add('is-busy');
      readBtn.classList.add('is-pressed');
      audio.click();
      sfx.relay();
      ctx.timeout(() => readBtn.classList.remove('is-pressed'), 200);
      hideBubble();
      hideSlip();
      job += 1;
      try {
        if (tray.length < 8) {
          await ctx.wait(350);
          audio.beep(440, 0.1);
          await ctx.wait(160);
          audio.beep(440, 0.1);
          await printSlip(slip(job, { kind: tray.length ? 'incomplete' : 'empty', count: tray.length }));
          ctx.error();
          announce(
            tray.length
              ? `Lecture refusée : paquet incomplet, ${tray.length} carte${tray.length > 1 ? 's' : ''} sur 8.`
              : 'Lecture refusée : le bac est vide.',
          );
          return;
        }
        const deck = tray.slice();
        const breakAt = deck.findIndex((card, i) => i > 0 && card.rank < deck[i - 1].rank);
        await loadHopper(deck);
        await feed(deck, breakAt < 0 ? deck.length : breakAt + 1);
        if (breakAt >= 0) {
          await jam(deck, breakAt);
          return;
        }
        await run();
      } finally {
        if (phase === 'busy') {
          phase = 'play';
          root.classList.remove('is-busy');
        }
      }
    }

    async function loadHopper(deck) {
      const top = trayPose(0);
      deck.forEach((card, i) => place(card, { ...top, y: top.y + i * 0.9 }, { duration: 240 }));
      await ctx.wait(reduced() ? 60 : 280);
      tray = [];
      deck.forEach((card, i) => {
        card.zone = 'reader';
        card.el.style.zIndex = 40 + i;
        place(card, hopperPose(i), { duration: 640, delay: (deck.length - 1 - i) * 22, lift: 46, easing: 'cubic-bezier(.45,.05,.25,1)' });
      });
      checkDeck();
      sfx.flutter(4, 0.4);
      await ctx.wait(reduced() ? 80 : 820);
      sfx.tray();
    }

    async function feed(deck, count) {
      lamp('run', true);
      root.classList.add('is-feeding');
      audio.cardFeed(count);
      const s = L.parts.reader.s ?? 1;
      for (let i = 0; i < count; i++) {
        const card = deck[i];
        const from = card.pose;
        const to = { ...from, y: from.y + 18 * s };
        for (const anim of card.el.getAnimations()) anim.cancel();
        card.pose = to;
        card.el.style.transform = poseCss(to);
        card.el.style.opacity = '0';
        if (!reduced()) {
          card.el.animate([{ transform: poseCss(from), opacity: 1 }, { transform: poseCss(to), opacity: 0 }], {
            duration: 110,
            easing: 'ease-in',
          });
        }
        stack(i + 1);
        await ctx.wait(56);
      }
      root.classList.remove('is-feeding');
      lamp('run', false);
    }

    function stack(n) {
      const h = Math.min(n, 8) * 1.3;
      stackEl.setAttribute('y', String(44 - h));
      stackEl.setAttribute('height', String(h));
    }

    async function jam(deck, breakAt) {
      sfx.buzz();
      audio.fail();
      lamp('error', true, true);
      parts.reader.classList.add('is-jammed');
      ctx.timeout(() => parts.reader.classList.remove('is-jammed'), 500);
      announce(`Bourrage : erreur de séquence, carte ${seqOf(deck[breakAt].rank)} après ${seqOf(deck[breakAt - 1].rank)}.`);
      await ctx.wait(650);
      await printSlip(slip(job, { kind: 'sequence', before: deck[breakAt - 1].rank, after: deck[breakAt].rank }));
      lamp('error', true);
      // L'opérateur rend le paquet, dans le même ordre.
      deck.forEach((card, i) => {
        for (const anim of card.el.getAnimations()) anim.cancel();
        card.el.style.opacity = '';
        place(card, hopperPose(i), { animate: false });
      });
      stack(0);
      tray = deck.slice();
      deck.forEach((card) => (card.zone = 'tray'));
      syncDom();
      deck.forEach((card, i) => {
        card.el.style.zIndex = 40 + i;
        place(card, trayPose(i), { duration: 620, delay: i * 30, lift: 40 });
      });
      sfx.flutter(5, 0.4);
      await ctx.wait(reduced() ? 50 : 700);
      wasSorted = false;
      checkDeck();
      ctx.error();
    }

    // ——— Imprimante ———

    let slipFly = null;
    function hideSlip() {
      parts.slip.hidden = true;
    }

    async function printSlip(lines) {
      printerLamp(true);
      root.classList.add('is-printing');
      stopPrinter();
      stopPrinter = audio.printer(lines.length, 7);
      await ctx.wait(reduced() ? 100 : lines.length * 140 + 120);
      root.classList.remove('is-printing');
      printerLamp(false);
      const el = parts.slip;
      el.querySelector('.cr-slip-text').textContent = lines.join('\n');
      el.hidden = false;
      const p = L.parts.printer;
      const q = L.parts.slip;
      const ps = p.s ?? 1;
      const qs = q.s ?? 1;
      const [w] = SIZES.slip;
      const dx = p.x + SLOT.x * ps - (q.x + (w * qs) / 2);
      const dy = p.y + SLOT.y * ps - q.y;
      slipFly?.cancel();
      if (!reduced()) {
        slipFly = el.animate(
          [
            { translate: `${dx}px ${dy}px`, scale: '0.25', rotate: '-12deg', opacity: 0 },
            { translate: `${dx}px ${dy - 40}px`, scale: '0.45', rotate: '-6deg', opacity: 1, offset: 0.3 },
            { translate: '0 0', scale: '1', rotate: '0deg', opacity: 1 },
          ],
          { duration: 700, easing: 'cubic-bezier(.3,.7,.3,1.1)' },
        );
      }
      ctx.timeout(() => audio.tap(), reduced() ? 0 : 680);
      await ctx.wait(reduced() ? 50 : 720);
    }

    // Recadrage sur l'imprimante pour lire le listing
    function aimTransform() {
      const p = L.parts.printer;
      const s = p.s ?? 1;
      const x = p.x + SLOT.x * s;
      const y = p.y + SLOT.y * s;
      const width = L.camera.width * s;
      const z = L.w / width;
      const height = L.h / z;
      return `translate(${(-(x - width / 2) * z).toFixed(2)}px, ${(-(y - height * L.camera.slot) * z).toFixed(2)}px) scale(${z.toFixed(4)})`;
    }

    function aim(animate) {
      const to = aimTransform();
      if (animate && !reduced()) {
        room.animate([{ transform: 'none' }, { transform: to }], { duration: 1400, easing: 'cubic-bezier(.65,0,.25,1)' });
      }
      room.style.transform = to;
    }

    async function run() {
      root.classList.add('is-running');
      lamp('ready', false);
      announce('Le paquet est lu. L’imprimante sort le listing.');
      await ctx.wait(reduced() ? 100 : 500);
      camera = true;
      aim(true);
      await ctx.wait(reduced() ? 100 : 1450);
      const out = listing(job);
      const strip = root.querySelector('.cr-paper-strip');
      // Saut de page : le papier file jusqu'en haut de la feuille
      strip.classList.add('is-ejecting');
      audio.noise({ type: 'bandpass', freq: 700, to: 2600, q: 1.1, attack: 0.03, release: 0.42, vol: 0.09 });
      await ctx.wait(reduced() ? 50 : 520);
      strip.classList.replace('is-ejecting', 'is-fed');
      const print = async (lines, rate) => {
        printerLamp(true);
        root.classList.add('is-printing');
        stopPrinter();
        stopPrinter = audio.printer(lines.length, rate);
        for (const line of lines) {
          const el = document.createElement('div');
          el.className = 'cr-line';
          el.textContent = line || ' ';
          paperLines.append(el);
          strip.style.setProperty('--n', paperLines.children.length);
          await ctx.wait(reduced() ? 30 : 1000 / rate);
        }
        root.classList.remove('is-printing');
        printerLamp(false);
      };
      await print(out.compile, 7);
      await ctx.wait(reduced() ? 200 : 1100);
      await print([out.result], 4);
      const result = paperLines.lastElementChild;
      result.classList.add('cr-line-result');
      await print(['', ''], 7);
      await ctx.wait(reduced() ? 100 : 350);
      circle(result);
      sfx.pencil();
      root.classList.remove('is-running');
      announce(`Dernière ligne du listing : ${out.result}.`);
      await ctx.wait(reduced() ? 100 : 700);
      ctx.note('Terminal disponible — salle 2 — 1974', { key: 'cards-listing', label: 'Listing' });
      phase = 'done';
      await ctx.wait(2200, { skippable: true });
      ctx.complete();
    }

    // Le trait de crayon rouge de l'opérateur autour de la dernière ligne :
    // une boucle tracée à main levée, qui dépasse un peu son point de départ.
    function circle(line) {
      const svg = root.querySelector('.cr-pencil');
      const text = line.textContent.trimEnd().length * 12.9 * 0.5996;
      const w = text + 56;
      const h = line.offsetHeight + 12;
      Object.assign(svg.style, { width: `${w}px`, height: `${h}px`, left: `${line.offsetLeft - 28}px`, top: `${line.offsetTop - 6}px` });
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const cx = w / 2;
      const cy = h / 2;
      const pts = [];
      const a0 = -2.2;
      const span = Math.PI * 2 + 0.75;
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        const a = a0 + span * t;
        const wobble = 1 + 0.035 * Math.sin(t * 9) - 0.06 * t;
        pts.push([cx + Math.cos(a) * (w / 2 - 3) * wobble, cy + Math.sin(a) * (h / 2 - 2) * wobble - 1.5 * t]);
      }
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const [x, y] = pts[i];
        const [nx, ny] = pts[i + 1];
        d += `Q${x.toFixed(1)} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`;
      }
      d += `L${pts.at(-1)[0].toFixed(1)} ${pts.at(-1)[1].toFixed(1)}`;
      svg.querySelector('path').setAttribute('d', d);
      svg.classList.add('on');
    }

    ctx.on(readBtn, 'click', () => {
      read().catch(() => {});
    });

    // ——— Ambiance : bobines, voyants, horloge ———

    const lamps = [...root.querySelectorAll('.cr-lamp')];
    lamps.forEach((el) => el.classList.toggle('on', Math.random() < 0.4));
    if (!reduced()) {
      ctx.interval(() => {
        const busy = root.classList.contains('is-running');
        for (let i = 0; i < (busy ? 14 : 4); i++) lamps[Math.floor(Math.random() * lamps.length)].classList.toggle('on');
      }, 160);
    }

    // L'horloge donne l'heure réelle ; la trotteuse avance sans jamais repartir en arrière.
    let seconds = new Date().getSeconds();
    let sweep = seconds * 6;
    const tick = () => {
      const now = new Date();
      const m = now.getMinutes() + now.getSeconds() / 60;
      const h = (now.getHours() % 12) + m / 60;
      sweep += ((now.getSeconds() - seconds + 60) % 60) * 6;
      seconds = now.getSeconds();
      root.querySelector('.cr-hand-h').style.transform = `rotate(${h * 30}deg)`;
      root.querySelector('.cr-hand-m').style.transform = `rotate(${m * 6}deg)`;
      root.querySelector('.cr-hand-s').style.transform = `rotate(${sweep}deg)`;
    };
    tick();
    ctx.interval(tick, 1000);

    const startAmbience = () => {
      if (stopAmbience || !audio.on) return;
      stopAmbience = audio.ambience();
    };
    startAmbience();
    // Sans geste préalable (?screen=0), l'audio ne démarre qu'au premier clic.
    ctx.on(window, 'pointerdown', () => ctx.timeout(startAmbience, 50));
    ctx.on(window, 'keydown', () => ctx.timeout(startAmbience, 50));

    // ——— Indices : le numéro, puis le trait de feutre ———

    ctx.hints.onReveal((level) => {
      const cls = level === 1 ? 'hint-seq' : 'hint-felt';
      root.classList.remove(cls);
      void root.offsetWidth;
      root.classList.add(cls);
      ctx.timeout(() => root.classList.remove(cls), 4200);
    });

    // ——— Démarrage : les cartes retombent au sol ———

    applyLayout(true);
    ctx.onResize(() => applyLayout());
    scatter(cards);
    syncDom();
    lamp('error', true);
    checkDeck();
    if (reduced()) {
      layoutCards({ animate: false });
      phase = 'play';
    } else {
      cards
        .slice()
        .sort((a, b) => a.z - b.z)
        .forEach((card, i) => {
          card.el.style.zIndex = 20 + card.z;
          const to = floorPose(card);
          card.pose = to;
          card.el.style.transform = poseCss(to);
          card.el.animate(
            [
              { transform: poseCss({ ...to, y: to.y - 150, r: to.r + rand(-40, 40), s: to.s * 1.25 }), opacity: 0 },
              { opacity: 1, offset: 0.35 },
              { transform: poseCss(to), opacity: 1 },
            ],
            { duration: 640, delay: 380 + i * 75, easing: LAND, fill: 'backwards' },
          );
          ctx.timeout(() => sfx.floor(), 380 + i * 75 + 520);
        });
      ctx.timeout(() => {
        phase = 'play';
        parts.note.classList.add('is-calling');
      }, 380 + cards.length * 75 + 500);
    }

    return () => {
      cancelAnimationFrame(raf);
      stopPrinter();
      stopAmbience?.();
    };
  },
};
