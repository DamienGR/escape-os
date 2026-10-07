// Téléphone : clavier à touches rondes, numéro, appel. Le 2026 ramène au
// présent ; les autres numéros tombent sur le message de l'opérateur.

import { GLYPHS } from './art.js';
import { h, play, fadeIn, fadeOut } from './kit.js';

const KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
];

const ERAS = { 1965: '1965', 1974: '1974', 1981: '1981', 1992: '1992', 1995: '1995', 1998: '1998', 2001: '2001', 2006: '2006' };
const EMERGENCY = ['15', '17', '18', '112', '114', '115', '119', '911', '999'];

const NOT_ASSIGNED = 'Le numéro que vous avez demandé n’est pas attribué.';

// Réponse de l'opérateur selon le numéro composé
function outcome(number) {
  if (number === '2026') return { ok: true };
  if (EMERGENCY.includes(number)) return { text: 'Ceci est une simulation : aucun appel réel n’est passé.', tone: 'none', error: false };
  if (number === '2007') return { text: 'Occupé… vous appelez votre propre époque !', tone: 'busy', error: true };
  if (ERAS[number]) return { text: `Mauvaise direction : ce numéro mène en ${ERAS[number]}. Le présent est plus loin.`, tone: 'sit', error: true };
  return { text: NOT_ASSIGNED, tone: 'sit', error: true };
}

export function phoneApp(host, kit) {
  const { ctx, audio, state } = kit;
  let digits = '';
  let call = null;

  host.innerHTML = `<div class="ph-dial">
    <div class="ph-dial-display"><output class="ph-dial-number" aria-live="polite" aria-label="Numéro composé"></output></div>
    <div class="ph-keys">${KEYS.map(
      ([d, l]) => `<button type="button" class="ph-key" data-key="${d}" aria-label="${d}"><b>${d}</b>${l ? `<small>${l}</small>` : ''}</button>`,
    ).join('')}</div>
    <div class="ph-dial-actions">
      <span></span>
      <button type="button" class="ph-call" aria-label="Appeler">${GLYPHS.call}<span>Appeler</span></button>
      <button type="button" class="ph-del" aria-label="Effacer le dernier chiffre">${GLYPHS.backspace}</button>
    </div>
  </div>`;

  const dial = host.querySelector('.ph-dial');
  const out = host.querySelector('.ph-dial-number');
  const callBtn = host.querySelector('.ph-call');
  const delBtn = host.querySelector('.ph-del');

  const render = () => {
    out.textContent = digits;
    out.classList.toggle('is-long', digits.length > 9);
    delBtn.classList.toggle('is-visible', digits.length > 0);
  };

  const flash = (btn) => {
    btn.classList.remove('is-down');
    void btn.offsetWidth;
    btn.classList.add('is-down');
  };

  function press(key) {
    if (call) return;
    const btn = host.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (btn) flash(btn);
    audio.dtmf(key);
    if (digits.length < 15) digits += key;
    render();
  }

  function erase() {
    if (call || !digits) return;
    audio.tap();
    digits = digits.slice(0, -1);
    render();
  }

  ctx.on(host.querySelector('.ph-keys'), 'click', (event) => {
    const key = event.target.closest('[data-key]')?.dataset.key;
    if (key) press(key);
  });
  ctx.on(delBtn, 'click', erase);
  ctx.on(callBtn, 'click', () => dialNumber());

  // Clavier physique : chiffres, Retour arrière, Entrée
  ctx.on(window, 'keydown', (event) => {
    if (call || kit.current() !== 'phone' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest?.('input, textarea, [contenteditable]')) return;
    if (/^[0-9*#]$/.test(event.key)) {
      event.preventDefault();
      press(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      erase();
    } else if (event.key === 'Enter' && !event.target.closest?.('button')) {
      event.preventDefault();
      dialNumber();
    }
  });

  // ——— Appel ———

  function ring(bus) {
    audio.tone({ freq: 440, attack: 0.02, hold: 1.4, release: 0.05, vol: 0.05, dest: bus?.node });
  }

  function sit(bus) {
    // Les trois notes montantes qui précèdent le message de l'opérateur
    [950, 1400, 1800].forEach((freq, i) =>
      audio.tone({ freq, at: i * 0.34, attack: 0.01, hold: 0.27, release: 0.03, vol: 0.05, dest: bus?.node }),
    );
  }

  function busyTone(bus) {
    for (let i = 0; i < 4; i++) audio.tone({ freq: 425, at: i * 0.5, attack: 0.01, hold: 0.24, release: 0.02, vol: 0.05, dest: bus?.node });
  }

  async function dialNumber() {
    if (call) return;
    if (!digits) {
      flash(callBtn);
      audio.tap();
      return;
    }
    if (state.airplane) {
      audio.tap();
      kit.alert('Mode Avion', 'Désactivez le mode Avion dans Réglages pour passer un appel.');
      return;
    }
    const number = digits;
    const result = outcome(number);
    const screen = h(`<section class="ph-incall" role="dialog" aria-label="Appel du ${number}">
      <div class="ph-incall-top">
        <p class="ph-incall-name">${number}</p>
        <p class="ph-incall-status" role="status">appel…</p>
      </div>
      <div class="ph-incall-grid" aria-hidden="true">
        ${[
          ['mute', 'silence'],
          ['keypad', 'clavier'],
          ['speaker', 'haut-parleur'],
          ['add', 'ajouter'],
          ['hold', 'attente'],
          ['person', 'contacts'],
        ]
          .map(([g, l]) => `<span class="ph-incall-btn">${GLYPHS[g]}<span>${l}</span></span>`)
          .join('')}
      </div>
      <div class="ph-incall-msg" hidden><p></p></div>
      <div class="ph-incall-bottom"><button type="button" class="ph-hangup">${GLYPHS.hangup}<span>Raccrocher</span></button></div>
    </section>`);
    const status = screen.querySelector('.ph-incall-status');
    const msg = screen.querySelector('.ph-incall-msg');
    const bus = audio.bus(1);
    call = { number, live: true, bus, screen, connecting: Boolean(result.ok) };
    const current = call;
    audio.tap();
    host.append(screen);
    screen.querySelector('.ph-hangup').focus({ preventScroll: true });
    ctx.on(screen.querySelector('.ph-hangup'), 'click', () => hangUp());
    await play(screen, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 420, calm: fadeIn }).then((a) =>
      a.cancel(),
    );
    dial.inert = true;

    const alive = () => current.live && !ctx.signal.aborted;
    const say = (text) => {
      msg.hidden = false;
      msg.querySelector('p').textContent = text;
      screen.classList.add('has-msg');
      play(msg, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300 });
    };

    try {
      if (result.ok) {
        ring(bus);
        await ctx.wait(2200);
        if (!alive()) return;
        ring(bus);
        await ctx.wait(1750);
        if (!alive()) return;
        current.connected = true;
        status.textContent = 'connecté · 00:00';
        screen.classList.add('is-connected');
        say('Connexion temporelle établie. Retour vers 2026…');
        audio.success();
        let seconds = 0;
        const timer = ctx.interval(() => {
          seconds += 1;
          status.textContent = `connecté · 00:${String(seconds).padStart(2, '0')}`;
        }, 1000);
        await ctx.wait(1500);
        ctx.clear(timer);
        if (!ctx.signal.aborted) ctx.complete();
        return;
      }
      await ctx.wait(1300);
      if (!alive()) return;
      if (result.tone === 'sit') sit(bus);
      if (result.tone === 'busy') busyTone(bus);
      status.textContent = result.tone === 'busy' ? 'occupé' : 'message de l’opérateur';
      await ctx.wait(result.tone === 'sit' ? 1000 : 300);
      if (!alive()) return;
      say(result.text);
      if (result.error) ctx.error();
      await ctx.wait(3400);
      if (alive()) hangUp();
    } catch {
      // écran démonté pendant l'appel
    }
  }

  async function hangUp() {
    const current = call;
    if (!current?.live || current.connected) return;
    current.live = false;
    current.bus?.stop(0.05);
    audio.tone({ freq: 480, release: 0.12, vol: 0.04 });
    audio.tone({ freq: 480, at: 0.16, release: 0.12, vol: 0.04 });
    current.screen.querySelector('.ph-incall-status').textContent = 'appel terminé';
    current.screen.classList.add('is-ended');
    await new Promise((resolve) => setTimeout(resolve, 650));
    await play(current.screen, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 380, calm: fadeOut });
    current.screen.remove();
    dial.inert = false;
    call = null;
    digits = '';
    render();
  }

  render();

  return {
    // Bouton principal pendant un appel : on raccroche (sauf quand 2026 décroche)
    onHome() {
      if (!call) return true;
      if (call.connecting) return false;
      hangUp();
      return true;
    },
    hint(level) {
      if (level < 3 || call) return;
      flash(callBtn);
    },
    dispose() {
      call?.bus?.stop(0.05);
    },
  };
}
