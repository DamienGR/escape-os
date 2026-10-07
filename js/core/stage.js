// Scène et cadre matériel. L'écran de chaque époque garde sa résolution logique
// (640 × 480, 1024 × 768…) et il est mis à l'échelle en CSS ; autour, le cadre
// (télétype, moniteur, écran plat, téléphone) se métamorphose pendant le saut.

// Épaisseurs du cadre [haut, droite, bas, gauche] et place sous le cadre (pied,
// clavier), en fraction de la largeur de l'écran.
const DEVICES = {
  room: { bezel: [0, 0, 0, 0], below: 0, maxScale: 1.6 },
  teletype: { bezel: [0.07, 0.07, 0.05, 0.07], below: 0.24, maxScale: 1.7 },
  crt: { bezel: [0.075, 0.085, 0.13, 0.085], below: 0.07, maxScale: 1.9 },
  flat: { bezel: [0.04, 0.04, 0.065, 0.04], below: 0.13, maxScale: 1.4 },
  phone: { bezel: [0.4, 0.11, 0.42, 0.11], below: 0, maxScale: 1.5 },
  // Macintosh compact : écran noir et blanc 512 × 342 à l'échelle entière, pixels nets
  mac: { bezel: [0.13, 0.16, 0.5, 0.16], below: 0.03, maxScale: 2, integerScale: true },
  none: { full: true },
};

// Cadre simplifié sur téléphone en portrait.
const COMPACT_BEZEL = {
  teletype: [0.045, 0.04, 0.035, 0.04],
  crt: [0.05, 0.05, 0.09, 0.05],
  flat: [0.025, 0.025, 0.045, 0.025],
  phone: [0.3, 0.07, 0.32, 0.07],
  mac: [0.1, 0.1, 0.36, 0.1],
};

const KEY_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ':', '-'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '↵'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '|'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' '],
];

let els = null;
let current = null;
let geometry = null;
const resizeListeners = new Set();
const hardwareListeners = new Map();

export function initStage(root) {
  root.innerHTML = `
    <div class="scene" id="scene" data-device="none">
      <div class="desk" aria-hidden="true"></div>
      <div class="dev-stand" aria-hidden="true"><i class="stand-neck"></i><i class="stand-foot"></i></div>
      <div class="dev-keys" aria-hidden="true">
        ${KEY_ROWS.map((row) => `<div class="key-row">${row
          .map((k) => `<span class="key${k === ' ' ? ' key-space' : ''}" data-key="${k}">${k === ' ' ? '' : k}</span>`)
          .join('')}</div>`).join('')}
      </div>
      <div class="dev-body" aria-hidden="true">
        <i class="deco deco-badge"></i>
        <i class="deco deco-led"></i>
        <i class="deco deco-knobs"><b></b><b></b></i>
        <i class="deco deco-speaker"></i>
        <i class="deco deco-vents"></i>
        <i class="deco deco-roll"></i>
        <i class="deco deco-slot"></i>
      </div>
      <button class="dev-home" type="button" aria-label="Bouton principal du téléphone"></button>
      <div class="glass" id="glass">
        <div class="screen-wrap"><div class="screen" id="screen"></div></div>
        <div class="glass-fx" aria-hidden="true"></div>
        <div class="glass-power" aria-hidden="true"></div>
      </div>
      <div class="props props-bezel" id="props-bezel"></div>
      <div class="props props-side" id="props-side"></div>
    </div>`;

  const q = (sel) => root.querySelector(sel);
  els = {
    root,
    scene: q('.scene'),
    desk: q('.desk'),
    stand: q('.dev-stand'),
    keys: q('.dev-keys'),
    body: q('.dev-body'),
    home: q('.dev-home'),
    glass: q('.glass'),
    wrap: q('.screen-wrap'),
    screen: q('.screen'),
    bezelProps: q('.props-bezel'),
    sideProps: q('.props-side'),
  };

  els.home.addEventListener('click', () => emitHardware('home'));
  new ResizeObserver(() => layout()).observe(root);
  // Le HUD glisse en place à son apparition : on remesure une fois posé.
  document.getElementById('hud')?.addEventListener('animationend', (event) => {
    if (event.target.id === 'hud') layout();
  });
  window.addEventListener('orientationchange', () => setTimeout(layout, 120));

  // Le clavier du télétype s'enfonce sous les doigts du joueur.
  window.addEventListener('keydown', (event) => {
    if (current?.device !== 'teletype') return;
    let key = event.key.length === 1 ? event.key.toLowerCase() : event.key === 'Enter' ? '↵' : null;
    if (key === null) return;
    const el = els.keys.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (!el) return;
    el.classList.remove('pressed');
    void el.offsetWidth;
    el.classList.add('pressed');
  });

  return els;
}

function emitHardware(name) {
  for (const fn of hardwareListeners.get(name) ?? []) fn();
}

export function onHardware(name, fn) {
  if (!hardwareListeners.has(name)) hardwareListeners.set(name, new Set());
  hardwareListeners.get(name).add(fn);
  return () => hardwareListeners.get(name).delete(fn);
}

export function onResize(fn) {
  resizeListeners.add(fn);
  return () => resizeListeners.delete(fn);
}

export const stageEls = () => els;
export const currentGeometry = () => geometry;

// Change d'époque : cadre, thème et résolution. morph = transitions CSS du cadre.
export function setEra(era, { morph = false } = {}) {
  current = era;
  const { scene } = els;
  scene.classList.toggle('morphing', morph);
  scene.dataset.device = era.device;
  scene.dataset.era = era.id;
  document.body.dataset.era = era.id;
  document.body.dataset.device = era.device;
  layout();
  if (morph) {
    clearTimeout(setEra.timer);
    setEra.timer = setTimeout(() => scene.classList.remove('morphing'), 1400);
  }
}

export function isCompact() {
  return window.innerWidth < 720 && window.innerWidth < window.innerHeight * 1.1;
}

function reservedArea() {
  const hud = document.getElementById('hud');
  const area = { top: 0, bottom: 0 };
  if (!hud || hud.hidden || document.body.classList.contains('hud-off')) return area;
  const rect = hud.getBoundingClientRect();
  if (rect.height === 0) return area;
  if (rect.top < window.innerHeight / 2) area.top = rect.bottom;
  else area.bottom = window.innerHeight - rect.top;
  return area;
}

function place(el, x, y, w, h) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${Math.max(0, w)}px`;
  el.style.height = `${Math.max(0, h)}px`;
}

export function layout() {
  if (!els || !current) return;
  const era = current;
  const dev = DEVICES[era.device];
  const W = els.root.clientWidth;
  const H = els.root.clientHeight;
  const compact = isCompact();
  const reserved = reservedArea();
  const pad = compact ? 10 : Math.min(40, Math.max(16, W * 0.025));
  const availX = pad;
  const availY = reserved.top + pad;
  const availW = W - pad * 2;
  const availH = H - reserved.top - reserved.bottom - pad * 2;
  const { scene } = els;

  let lw;
  let lh;
  let sw;
  let sh;
  let gx;
  let gy;

  if (dev.full) {
    sw = availW + pad * 2;
    sh = availH + pad * 2;
    gx = 0;
    gy = reserved.top;
    [lw, lh] = [sw, sh];
    geometry = { compact, full: true, lw, lh, scale: 1 };
    place(els.body, gx, gy, sw, sh);
    place(els.glass, gx, gy, sw, sh);
    place(els.bezelProps, gx, gy, sw, sh);
    place(els.sideProps, gx, gy + sh, sw, 0);
    place(els.stand, gx + sw / 2, gy + sh, 0, 0);
    place(els.keys, gx, gy + sh, sw, 0);
    place(els.home, gx + sw / 2, gy + sh, 0, 0);
    place(els.desk, 0, H, W, 0);
  } else {
    const portrait = availW / availH < 0.9;
    [lw, lh] = portrait && era.portraitRes ? era.portraitRes : era.res;
    const aspect = lw / lh;
    const [bt, br, bb, bl] = (compact && COMPACT_BEZEL[era.device]) || dev.bezel;
    const side = era.props?.side ?? 0;
    const gap = side ? 0.04 : 0;
    const below = dev.below;
    const wF = bl + 1 + br + (compact ? 0 : side + gap);
    const hF = bt + 1 / aspect + bb + below + (compact ? side * 0.62 + gap : 0);
    sw = Math.min(availW / wF, availH / hF, lw * dev.maxScale);
    if (dev.integerScale && sw >= lw) sw = lw * Math.floor(sw / lw);
    sw = Math.floor(sw);
    sh = Math.round(sw / aspect);

    const totalW = sw * wF;
    const totalH = sw * hF;
    // Sur téléphone, le matériel posé sur un bureau remonte : place pour le clavier virtuel.
    const bias = compact && ['crt', 'flat', 'teletype', 'mac'].includes(era.device) ? 0.2 : 0.5;
    const x0 = availX + (availW - totalW) / 2;
    const y0 = availY + (availH - totalH) * bias;
    const dx = x0;
    const dy = y0;
    const dw = sw * (bl + 1 + br);
    const dh = sh + sw * (bt + bb);
    gx = dx + sw * bl;
    gy = dy + sw * bt;

    place(els.body, dx, dy, dw, dh);
    place(els.glass, gx, gy, sw, sh);
    place(els.bezelProps, dx, dy, dw, dh);

    // Pied du moniteur ou clavier du télétype
    const belowH = sw * below;
    if (era.device === 'teletype') {
      place(els.keys, dx - sw * 0.02, dy + dh - sw * 0.01, dw + sw * 0.04, belowH);
      place(els.stand, dx + dw / 2, dy + dh, 0, 0);
    } else {
      const standW = era.device === 'flat' ? dw * 0.36 : era.device === 'mac' ? dw * 0.94 : dw * 0.46;
      place(els.stand, dx + (dw - standW) / 2, dy + dh - sw * 0.01, standW, belowH + sw * 0.01);
      place(els.keys, dx, dy + dh, dw, 0);
    }

    // Accessoires de l'époque : à droite, ou dessous en portrait
    if (side) {
      if (compact) place(els.sideProps, x0, dy + dh + belowH + sw * gap, totalW, sw * side * 0.62);
      else place(els.sideProps, dx + dw + sw * gap, dy, sw * side, dh + belowH);
    } else {
      place(els.sideProps, dx + dw, dy, 0, dh);
    }

    // Bouton principal du téléphone (taille nulle ailleurs : il naît pendant le saut)
    const hd = era.device === 'phone' ? sw * (compact ? 0.15 : 0.19) : 0;
    place(els.home, dx + (dw - hd) / 2, gy + sh + (sw * bb - hd) / 2, hd, hd);

    // Le bureau sous le matériel
    const deskY = dy + dh + belowH * 0.92;
    place(els.desk, 0, deskY, W, Math.max(0, H - deskY));

    geometry = { compact, full: false, lw, lh, scale: sw / lw, portrait };
    // Repères pour placer les détails du boîtier sous l'écran
    scene.style.setProperty('--gb', `${sw * bt + sh}px`);
    scene.style.setProperty('--bb', `${sw * bb}px`);
  }

  scene.style.setProperty('--u', `${sw / 100}px`);
  scene.style.setProperty('--sw', `${sw}px`);
  scene.style.setProperty('--sh', `${sh}px`);
  scene.style.setProperty('--scale', String(sw / lw));
  scene.dataset.compact = String(compact);
  els.screen.style.width = `${lw}px`;
  els.screen.style.height = `${lh}px`;
  els.screen.style.transform = dev.full ? 'none' : `scale(${sw / lw})`;

  for (const fn of resizeListeners) fn(geometry);
}

// ——— Allumage et extinction de l'écran ———

function animate(el, cls, ms) {
  return new Promise((resolve) => {
    el.classList.remove('power-on', 'power-off', 'off');
    void el.offsetWidth;
    el.classList.add(cls);
    const done = () => {
      clearTimeout(timer);
      el.removeEventListener('animationend', onEnd);
      resolve();
    };
    const onEnd = (event) => {
      if (event.target === el || event.target.parentElement === el) done();
    };
    const timer = setTimeout(done, ms + 80);
    el.addEventListener('animationend', onEnd);
  });
}

export async function powerOff(fast = false) {
  els.glass.classList.toggle('fast', fast);
  await animate(els.glass, 'power-off', fast ? 200 : 650);
  els.glass.classList.add('off');
}

export async function powerOn(fast = false) {
  els.glass.classList.toggle('fast', fast);
  await animate(els.glass, 'power-on', fast ? 200 : 750);
  els.glass.classList.remove('power-on', 'off', 'fast');
}

export function setOff(off) {
  els.glass.classList.remove('power-on', 'power-off');
  els.glass.classList.toggle('off', off);
}
