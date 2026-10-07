// Accessoires de 1998 posés à côté du moniteur : le téléphone fixe (qu'on ne
// peut pas utiliser pendant que le modem occupe la ligne) et le CD d'abonnement
// reçu par la poste, marque imaginaire, avec l'adresse à taper.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const CD_URL = 'www.saut-temporel.98';

// Étoile « 50 heures gratuites ! » : polygone à 28 branches
const BURST = Array.from({ length: 56 }, (_, i) => {
  const a = (i / 56) * Math.PI * 2;
  const r = i % 2 ? 41 : 50;
  return `${(50 + Math.cos(a) * r).toFixed(1)}% ${(50 + Math.sin(a) * r).toFixed(1)}%`;
}).join(',');

// Recto de la pochette, partagé par l'accessoire et sa vue agrandie
export const cdHtml = () => `
  <span class="cd-disc" aria-hidden="true"><i></i></span>
  <span class="cd-sleeve">
    <span class="cd-stars" aria-hidden="true"></span>
    <span class="cd-vortex" aria-hidden="true"></span>
    <span class="cd-brand"><i class="cd-logo" aria-hidden="true"></i><b>Saut Temporel</b><em>Online</em></span>
    <span class="cd-burst" style="clip-path: polygon(${BURST})"><b>50</b> heures<br>gratuites !</span>
    <span class="cd-kit">Kit de connexion Internet</span>
    <span class="cd-url">${esc(CD_URL)}</span>
    <span class="cd-fine">CD-ROM pour PC · Windows 95 et 98 · modem 56K</span>
  </span>`;

export function createCd(host, { onOpen, signal } = {}) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'w98-cd';
  el.setAttribute('aria-label', `CD d’abonnement Saut Temporel Online, reçu par la poste : l’agrandir pour lire l’adresse ${CD_URL}`);
  el.innerHTML = cdHtml();
  host.append(el);
  el.addEventListener('click', () => onOpen?.(), { signal });
  return {
    el,
    nudge(on) {
      el.classList.remove('is-nudge');
      if (!on) return;
      void el.offsetWidth;
      el.classList.add('is-nudge');
    },
    destroy: () => el.remove(),
  };
}

// La pochette en grand, lisible même sur téléphone. Un clic ou Échap la repose.
export function zoomCd({ signal, onClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'w98-cdzoom';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Pochette du CD d’abonnement');
  overlay.innerHTML = `
    <div class="w98-cdzoom-card">
      <div class="w98-cd is-big">${cdHtml()}</div>
      <p class="w98-cdzoom-hint">L’adresse est notée dans ton carnet. Touche pour reposer le CD.</p>
    </div>`;
  (document.getElementById('overlays') ?? document.body).append(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  const off = new AbortController();
  const close = () => {
    off.abort();
    overlay.classList.remove('is-open');
    setTimeout(() => overlay.remove(), 260);
    onClose?.();
  };
  overlay.addEventListener('click', close, { signal: off.signal });
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    },
    { signal: off.signal, capture: true },
  );
  signal?.addEventListener('abort', () => {
    off.abort();
    overlay.remove();
  });
  overlay.tabIndex = -1;
  overlay.focus({ preventScroll: true });
  return { close };
}

// Fil torsadé du combiné : une suite de boucles le long d'une courbe
const coil = (() => {
  const turns = 9;
  let d = 'M 5 4';
  for (let i = 0; i < turns; i++) {
    const y = 4 + i * 5;
    d += ` C 10 ${y + 1}, 10 ${y + 4}, 5 ${y + 5} C 0 ${y + 6}, 0 ${y + 2.5}, 5 ${y + 2.5}`;
  }
  return `<svg class="ph-cord" viewBox="0 0 10 52" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" /></svg>`;
})();

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

export function createPhone(host, { onUse, signal } = {}) {
  const el = document.createElement('div');
  el.className = 'w98-phone';
  el.innerHTML = `
    <button type="button" class="ph-hit" aria-label="Téléphone : décrocher le combiné"></button>
    ${coil}
    <span class="ph-base" aria-hidden="true">
      <span class="ph-keys">${KEYS.map((k) => `<i>${k}</i>`).join('')}</span>
      <span class="ph-led"></span>
      <span class="ph-label">TÉLÉ 98</span>
    </span>
    <span class="ph-handset" aria-hidden="true"><i></i><i></i></span>
    <p class="w98-bubble" role="status" aria-live="polite" hidden></p>`;
  host.append(el);
  const bubble = el.querySelector('.w98-bubble');
  let bubbleTimer = 0;
  el.querySelector('.ph-hit').addEventListener('click', () => onUse?.(), { signal });

  return {
    el,
    lift(on) {
      el.classList.toggle('is-lifted', on);
    },
    // Bulle de bande dessinée au-dessus du téléphone
    say(text, ms = 3200) {
      clearTimeout(bubbleTimer);
      bubble.textContent = text;
      bubble.hidden = false;
      bubble.classList.remove('is-in');
      void bubble.offsetWidth;
      bubble.classList.add('is-in');
      bubbleTimer = setTimeout(() => {
        bubble.hidden = true;
      }, ms);
    },
    ringing(on) {
      el.classList.toggle('is-ringing', on);
    },
    destroy() {
      clearTimeout(bubbleTimer);
      el.remove();
    },
  };
}
