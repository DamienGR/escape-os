// Écrans système des Windows 95 et 98, en plein écran : démarrage, logo au ciel
// nuageux (recréation originale, sans drapeau), « Veuillez patienter », message
// orange de fin, ScanDisk après une extinction sauvage, écrans bleus.
// Le « tube » permet d'éteindre et de rallumer l'image façon cathodique.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ——— Tube : écran du jeu, couche plein écran, faisceau ———

export function createTube(root) {
  root.innerHTML = `
    <div class="w9x-tube">
      <div class="w9x-host"></div>
      <div class="w9x-layer" hidden></div>
    </div>
    <div class="w9x-beam" aria-hidden="true"></div>`;
  const tube = root.querySelector('.w9x-tube');
  const host = root.querySelector('.w9x-host');
  const layer = root.querySelector('.w9x-layer');
  const beam = root.querySelector('.w9x-beam');

  const anim = (el, cls) => {
    el.classList.remove('anim-off', 'anim-on');
    void el.offsetWidth;
    el.classList.add(cls);
  };

  // Chaque contenu de la couche a son signal : changer d'écran retire ses écouteurs.
  let layerAbort = new AbortController();
  const renew = () => {
    layerAbort.abort();
    layerAbort = new AbortController();
  };

  return {
    tube,
    host,
    layer,
    get layerSignal() {
      return layerAbort.signal;
    },
    show(html, cls = '') {
      renew();
      layer.className = `w9x-layer ${cls}`;
      layer.innerHTML = html;
      layer.hidden = false;
      return layer;
    },
    hide() {
      renew();
      layer.hidden = true;
      layer.className = 'w9x-layer';
      layer.innerHTML = '';
    },
    get off() {
      return tube.classList.contains('is-off');
    },
    // Extinction : l'image se réduit à une ligne, puis à un point.
    async powerOff(ctx, { sound = true } = {}) {
      if (sound) ctx.audio.crtOff();
      anim(tube, 'anim-off');
      anim(beam, 'anim-off');
      await ctx.wait(reduced() ? 60 : 640);
      tube.classList.add('is-off');
      tube.classList.remove('anim-off');
      beam.classList.remove('anim-off');
    },
    async powerOn(ctx, { sound = true } = {}) {
      if (sound) ctx.audio.crtOn();
      tube.classList.remove('is-off');
      anim(tube, 'anim-on');
      anim(beam, 'anim-on');
      await ctx.wait(reduced() ? 60 : 720);
      tube.classList.remove('anim-on');
      beam.classList.remove('anim-on');
    },
    blackout(on) {
      tube.classList.toggle('is-off', on);
    },
  };
}

// ——— Texte de démarrage et test du BIOS ———

export const bootHtml = (text) => `<div class="w9x-text"><p>${esc(text)}<span class="w9x-caret">_</span></p></div>`;

export async function bios(view, ctx, { variant = '95' } = {}) {
  const is98 = variant === '98';
  const el = view.show(
    `<div class="w9x-text w9x-bios">
      <p class="w9x-bios-logo">TEMPO BIOS ${is98 ? 'v6.00PG' : 'v4.51PG'}<br><small>Copyright (C) 1984-${is98 ? '98' : '95'}, Tempo Systèmes</small></p>
      <p>${is98 ? 'Processeur à 266 MHz' : 'Processeur Pentium(R) à 75 MHz'}</p>
      <p>Test mémoire : <span class="w9x-bios-mem">0</span> Ko</p>
      <p class="w9x-bios-drives" hidden>Détection des lecteurs IDE… Disque C: ${is98 ? '4,3 Go' : '540 Mo'}, CD-ROM D:</p>
    </div>`,
    'is-text',
  );
  const mem = el.querySelector('.w9x-bios-mem');
  const total = is98 ? 32768 : 8192;
  const skip = { skippable: true };
  for (let k = 0; k <= total; k += total / 16) {
    mem.textContent = String(k);
    await ctx.wait(28, skip);
  }
  mem.textContent = `${total} OK`;
  ctx.audio.beep(1050, 0.07);
  el.querySelector('.w9x-bios-drives').hidden = false;
  await ctx.wait(700, skip);
}

// ——— Ciel nuageux (logo, attente d'arrêt) ———

const clouds = (variant) =>
  `<div class="w9x-clouds w9x-clouds-${variant}" aria-hidden="true">${Array.from(
    { length: 7 },
    (_, i) => `<i class="w9x-cloud k${i + 1}"><b></b></i>`,
  ).join('')}</div>`;

export const logoHtml = (version) => `
  <div class="w9x-logo">
    <span class="w9x-logo-word">Windows</span><span class="w9x-logo-ver">${esc(version)}</span>
  </div>`;

export const splashHtml = (variant) => `
  <div class="w9x-sky w9x-sky-${variant}" role="img" aria-label="Démarrage de Windows ${variant}">
    ${clouds(variant)}
    ${logoHtml(variant)}
    <p class="w9x-splash-note">Recréation pédagogique · aucun logo d’origine</p>
    <div class="w9x-splash-bar" aria-hidden="true"></div>
  </div>`;

export const waitHtml = (variant) => `
  <div class="w9x-sky w9x-sky-${variant} is-wait">
    ${clouds(variant)}
    ${logoHtml(variant)}
    <p class="w9x-wait-text">Veuillez patienter pendant l’arrêt de votre ordinateur.</p>
  </div>`;

export const safeHtml = () => `
  <div class="w9x-safe" role="status">
    <p>Vous pouvez maintenant éteindre<br>votre ordinateur en toute sécurité.</p>
  </div>`;

// ——— ScanDisk, après une extinction sauvage ———

const SCAN_STEPS = [
  'Structure des dossiers',
  'Tables d’allocation des fichiers',
  'Système de fichiers',
  'Noms de fichiers longs',
  'Surface du disque',
];

export async function scandisk(view, ctx, { drive = 'C' } = {}) {
  const el = view.show(
    `<div class="w9x-scan" role="status" aria-live="polite">
      <div class="w9x-scan-head"><span>ScanDisk</span></div>
      <div class="w9x-scan-body">
        <p class="w9x-scan-warn">Windows n’a pas été arrêté correctement. Un ou plusieurs de
vos disques peuvent contenir des erreurs.</p>
        <p>Pour ne plus voir ce message, arrêtez toujours votre ordinateur
en choisissant <b>Arrêter</b> dans le menu <b>Démarrer</b>.</p>
        <p>ScanDisk vérifie maintenant le lecteur ${drive} :</p>
        <ul class="w9x-scan-steps">${SCAN_STEPS.map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
        <div class="w9x-scan-meter"><span class="w9x-scan-fill"></span></div>
        <p class="w9x-scan-pct">0 % effectué</p>
      </div>
      <div class="w9x-scan-foot"><span>&lt; Pause &gt;</span><span>&lt; Plus d’infos &gt;</span><span>&lt; Quitter &gt;</span></div>
    </div>`,
    'is-scan',
  );
  const steps = [...el.querySelectorAll('.w9x-scan-steps li')];
  const fill = el.querySelector('.w9x-scan-fill');
  const pct = el.querySelector('.w9x-scan-pct');
  const skip = { skippable: true };
  await ctx.wait(1400, skip);
  for (let i = 0; i < steps.length; i++) {
    steps[i].classList.add('is-now');
    ctx.audio.hdd(0.4);
    const from = (i / steps.length) * 100;
    for (let k = 1; k <= 5; k++) {
      const value = Math.round(from + (k / 5) * (100 / steps.length));
      fill.style.width = `${value}%`;
      pct.textContent = `${value} % effectué`;
      await ctx.wait(70, skip);
    }
    steps[i].classList.remove('is-now');
    steps[i].classList.add('is-done');
  }
  pct.textContent = 'ScanDisk n’a trouvé aucune erreur sur ce lecteur. Ouf !';
  await ctx.wait(1300, skip);
}

// ——— Écran bleu ———

export function bsodHtml({ title = 'Windows', lines = [], prompt = 'Appuyez sur une touche pour continuer' }) {
  return `
    <div class="w9x-bsod" role="alert">
      <p class="w9x-bsod-title"><span>${esc(title)}</span></p>
      ${lines.map((line) => (line ? `<p>${esc(line)}</p>` : '<br>')).join('')}
      <p class="w9x-bsod-prompt">${esc(prompt)} <span class="w9x-caret">_</span></p>
    </div>`;
}

// Affiche un écran bleu et attend une touche, un clic ou un tap. Renvoie true,
// ou false si un autre écran l'a remplacé entre-temps (extinction…).
export function bsod(view, ctx, spec) {
  view.show(bsodHtml(spec), 'is-bsod');
  const signal = view.layerSignal;
  return new Promise((resolve) => {
    let armed = false;
    const done = (event) => {
      if (!armed) return;
      if (event.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      view.hide();
      resolve(true);
    };
    signal.addEventListener('abort', () => resolve(false), { once: true });
    // Laisse retomber le geste qui a provoqué l'écran bleu.
    setTimeout(() => {
      armed = true;
    }, 600);
    window.addEventListener('keydown', done, { signal, capture: true });
    view.layer.addEventListener('pointerdown', done, { signal });
  });
}
