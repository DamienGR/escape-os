// Le navigateur Web de 1998 (chrome original, sans logo d'époque) : barre
// d'outils Précédente / Suivante / Arrêter / Actualiser / Démarrage, zone
// Adresse, barre d'état avec progression, globe qui tourne pendant le
// chargement. Les pages arrivent ligne par ligne, les images en dernier,
// comme à 56 000 bit/s.

import { MSG_ICONS } from '../../ui/windows.js';
import { ICON16, TOOL20, GLOBE_SPRITE } from './icons.js';
import { fr } from './shell.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const SOLUTION = 'saut-temporel.98';
const BLANK = 'about:blank';
const APP = 'Navigateur Web';

// « www.Saut-Temporel.98/ », « http://saut-temporel.98 »… tout mène au même site.
export function normalizeUrl(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  if (/^about:[a-z]*$/i.test(text)) return { key: text.toLowerCase(), url: text.toLowerCase(), host: '', path: '' };
  // « about:blankwww.… » : on a tapé derrière la page vide, on l'oublie.
  const rest = text
    .replace(/^about:blank/i, '')
    .replace(/^[a-z][a-z0-9+.-]*:\/*/i, '')
    .replace(/(\w)\s+(?=\w)/g, '$1-')
    .replace(/\s+/g, '');
  const [hostRaw = '', ...parts] = rest.split('/');
  const host = hostRaw.toLowerCase().replace(/\.+$/, '');
  const path = parts.join('/').toLowerCase();
  const key = host.replace(/^www\./, '');
  return { key, host, path, url: `http://${host}/${parts.join('/')}` };
}

const isSolution = (target) => target.key === SOLUTION && (target.path === '' || /^index\.html?$/.test(target.path));

// Sites qui n'existent pas encore (ou plus) en 1998
const ANACHRONISMS = [
  [/(^|\.)google\./, 'Google ? Ce moteur de recherche ouvrira ses portes en septembre 1998… encore un peu de patience !'],
  [/(^|\.)wikipedia\./, 'Wikipédia ne naîtra qu’en janvier 2001. En 1998, on cherche dans l’encyclopédie sur CD-ROM !'],
  [/(^|\.)youtube\./, 'YouTube ? Il faudra attendre 2005… et une connexion bien plus rapide que 56 000 bit/s.'],
  [/(^|\.)facebook\./, 'Facebook n’existera qu’en 2004. En 1998, on se retrouve plutôt sur les forums et les chats.'],
  [/(^|\.)(twitter|x)\.com$/, 'Twitter ne gazouillera qu’en 2006.'],
  [/(^|\.)instagram\./, 'Instagram ? En 1998, les photos passent par le labo… puis par le scanner.'],
  [/(^|\.)tiktok\./, 'TikTok ? Pas avant 2016. Ici, la vidéo met dix minutes à se télécharger !'],
  [/(^|\.)netflix\./, 'Netflix existe déjà… et loue des DVD par la poste !'],
  [/(^|\.)amazon\./, 'Amazon existe déjà : il vend surtout des livres, livrés par la poste.'],
  [/(chatgpt|openai|anthropic|claude)/, 'Un assistant qui répond à tout ? Rendez-vous en 2026, tout au bout du voyage !'],
];

// ——— Pages ———

const blankPage = () => '<div class="w98-blank"></div>';

const errorPage = ({ title, lead, tips, code }) => `
  <div class="w98-err">
    <div class="w98-err-head">${MSG_ICONS.info}<h1>${esc(title)}</h1></div>
    <p>${lead}</p>
    <hr>
    <p>Essayez de la manière suivante :</p>
    <ul>${tips.map((tip) => `<li>${tip}</li>`).join('')}</ul>
    <p class="w98-err-code">${code}<br>${APP}</p>
  </div>`;

const offlinePage = () =>
  errorPage({
    title: 'Impossible d’afficher la page',
    lead: 'La page que vous recherchez n’est pas disponible : votre ordinateur n’est <b>pas connecté à Internet</b>.',
    tips: [
      'Double-cliquez sur l’icône <b>Connexion à Internet</b> du bureau pour composer le numéro de votre fournisseur d’accès.',
      'Une fois connecté, cliquez sur le bouton <b>Actualiser</b>.',
    ],
    code: 'Erreur réseau : aucune connexion',
  });

const notFoundPage = (target, note) =>
  errorPage({
    title: 'Page introuvable',
    lead: `Impossible de trouver la page <b>${esc(target.url)}</b> : le serveur n’existe pas, ou l’adresse est mal orthographiée.${
      note ? `<span class="w98-err-note">${esc(note)}</span>` : ''
    }`,
    tips: [
      'Vérifiez l’orthographe de l’adresse : un seul caractère de travers, et le Web ne vous comprend plus.',
      'Cliquez sur le bouton <b>Précédente</b> pour revenir à la page précédente.',
    ],
    code: 'Erreur HTTP 404 : fichier introuvable',
  });

// La page perso de 1998, chargée bloc par bloc
const solutionPage = () => `
  <div class="st98">
    <div class="st98-block" data-step="text">
      <h1 class="st98-title"><span class="st98-star">✶</span> Saut Temporel Online <span class="st98-star">✶</span></h1>
      <p class="st98-sub">La page perso des voyageurs du temps · depuis 1998</p>
    </div>
    <div class="st98-block st98-marquee" data-step="text"><span>+++ Bienvenue, voyageur ! +++ Le portail vers l’an 2001 est ouvert +++ Ne décrochez pas le téléphone pendant la connexion !!! +++ Meilleure résolution : 800 × 600 +++</span></div>
    <div class="st98-block st98-row" data-step="text">
      <div class="st98-img st98-construction" data-img="travaux.gif" data-alt="[Page en construction]"><i></i><b>EN CONSTRUCTION</b><i></i></div>
      <div class="st98-text">
        <p><b>Bravo !</b> Tu as réussi : te voilà connecté à Internet, à 56 000 bits par seconde.</p>
        <p>Ici, on va de lien en lien… et on attend que les images arrivent.</p>
      </div>
    </div>
    <p class="st98-block st98-center st98-gobox" data-step="text"><a href="#" class="st98-go" data-act="go">&gt;&gt;&gt; Entrer dans l’an 2001 &lt;&lt;&lt;</a> <span class="st98-img st98-new" data-img="nouveau.gif" data-alt="[nouveau]">NOUVEAU !</span></p>
    <hr class="st98-block st98-hr" data-step="text">
    <p class="st98-block st98-center st98-counter" data-step="text">Vous êtes le <span class="st98-img st98-digits" data-img="compteur.gif" data-alt="[compteur]">${'000042'
      .split('')
      .map((d) => `<i>${d}</i>`)
      .join('')}</span><sup>e</sup> visiteur</p>
    <div class="st98-block st98-guestbook" data-step="text">
      <h2>Mon livre d’or</h2>
      <ul>
        <li><b>Kevin</b>, 14/06/98 : Trop bien ton site !!! Tu peux mettre encore plus de GIF animés ?</li>
        <li><b>Sandrine</b>, 18/06/98 : 3 minutes pour charger la page, mais ça valait le coup :-)</li>
        <li><b>Doc</b>, 21/06/98 : Pense à couper le modem avant que quelqu’un décroche le téléphone…</li>
      </ul>
      <p><a href="#" data-act="sign">Signer le livre d’or</a></p>
    </div>
    <p class="st98-block st98-center st98-ring" data-step="text">[ <a href="#" data-act="ring">&lt;&lt; Préc</a> | <a href="#" data-act="ring">Webring des voyageurs du temps</a> | <a href="#" data-act="ring">Suiv &gt;&gt;</a> ]</p>
    <p class="st98-block st98-center st98-badges" data-step="text">
      <span class="st98-img st98-badge" data-img="800x600.gif" data-alt="[800×600]">Meilleur en<br><b>800 × 600</b></span>
      <span class="st98-img st98-badge b2" data-img="blocnotes.gif" data-alt="[Bloc-notes]">Fait avec le<br><b>Bloc-notes</b></span>
      <span class="st98-img st98-badge b3" data-img="nav4.gif" data-alt="[navigateur]">Navigateur<br><b>4.0 conseillé</b></span>
    </p>
    <p class="st98-block st98-foot" data-step="text">Dernière mise à jour : 25/06/1998 · <a href="#" data-act="mail">Écrivez-moi !</a> <span class="st98-mail" aria-hidden="true">✉</span></p>
  </div>`;

export function createBrowser(shell, ctx, opts = {}) {
  const { audio } = ctx;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let win = null;
  let pages = [];
  let index = -1;
  let token = 0;
  let loading = false;
  let current = null;
  let els = {};

  function open(url = BLANK) {
    if (win && !win.closed) {
      win.restore();
      if (url !== BLANK) navigate(url);
      return win;
    }
    shell.busy(700, 'working');
    win = shell.desk.open({
      id: 'browser',
      title: `${BLANK} - ${APP}`,
      icon: ICON16.browser,
      x: 24,
      y: 16,
      w: 580,
      h: 410,
      maximized: true,
      menu: ['&Fichier', '&Edition', '&Affichage', '&Aller à', 'Fa&voris', '&?'],
      className: 'w98-browser',
      body: `
        <div class="w98-coolbar">
          <div class="w98-toolbar" role="toolbar" aria-label="Navigation">
            ${tool('back', 'Précédente', TOOL20.back)}
            ${tool('forward', 'Suivante', TOOL20.forward)}
            ${tool('stop', 'Arrêter', TOOL20.stop)}
            ${tool('refresh', 'Actualiser', TOOL20.refresh)}
            ${tool('home', 'Démarrage', TOOL20.home)}
            <i class="w98-sep" aria-hidden="true"></i>
            ${tool('search', 'Rechercher', TOOL20.search)}
            ${tool('favorites', 'Favoris', TOOL20.favorites)}
            ${tool('history', 'Historique', TOOL20.history)}
            <i class="w98-sep" aria-hidden="true"></i>
            ${tool('print', 'Imprimer', TOOL20.print)}
          </div>
          <span class="w98-throbber" aria-hidden="true"><i style="background-image:url(&quot;data:image/svg+xml,${encodeURIComponent(GLOBE_SPRITE)}&quot;)"></i></span>
        </div>
        <form class="w98-addressbar" novalidate>
          <label for="w98-address">A<u>d</u>resse</label>
          <span class="w98-address win9x-field">
            <span class="w98-address-icon" aria-hidden="true">${ICON16.doc}</span>
            <input id="w98-address" name="address" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="go" inputmode="url" aria-label="Adresse de la page Web">
            <i aria-hidden="true"></i>
          </span>
          <button type="submit" class="w98-go">OK</button>
          <span class="w98-links">Liens »</span>
        </form>
        <div class="w98-view"><div class="w98-page">${blankPage()}</div></div>
        <div class="w98-statusbar">
          <span class="w98-status-text">Terminé</span>
          <span class="w98-status-progress"><i></i></span>
          <span class="w98-status-zone">${ICON16.globe}<span>Internet</span></span>
        </div>`,
    });
    const q = (sel) => win.body.querySelector(sel);
    els = {
      input: q('input'),
      form: q('.w98-addressbar'),
      page: q('.w98-page'),
      view: q('.w98-view'),
      status: q('.w98-status-text'),
      bar: q('.w98-status-progress'),
      fill: q('.w98-status-progress i'),
      throbber: q('.w98-throbber'),
      icon: q('.w98-address-icon'),
    };
    pages = [];
    index = -1;
    current = normalizeUrl(BLANK);
    els.input.value = BLANK;
    updateButtons();

    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      navigate(els.input.value);
    });
    // Un clic dans la zone Adresse sélectionne tout, comme à l'époque.
    let selectOnUp = false;
    els.input.addEventListener('focus', () => {
      if (els.input.value === BLANK) els.input.value = '';
      els.input.select();
      selectOnUp = true;
    });
    els.input.addEventListener('mouseup', (event) => {
      if (!selectOnUp) return;
      selectOnUp = false;
      if (els.input.selectionStart === els.input.selectionEnd) {
        event.preventDefault();
        els.input.select();
      }
    });
    els.input.addEventListener('blur', () => {
      selectOnUp = false;
      if (!els.input.value.trim()) els.input.value = current?.key === BLANK ? BLANK : current?.url ?? BLANK;
    });
    els.input.addEventListener('input', () => opts.onTyping?.());
    els.input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        els.input.value = current?.url ?? BLANK;
        els.input.select();
      }
    });
    q('.w98-toolbar').addEventListener('click', (event) => {
      const cmd = event.target.closest('[data-cmd]')?.dataset.cmd;
      if (!cmd || event.target.closest('[disabled]')) return;
      audio.click();
      command(cmd, event.target.closest('[data-cmd]'));
    });
    els.page.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      event.preventDefault();
      pageAction(link.dataset.act);
    });
    win.on('close', () => {
      token += 1;
      loading = false;
      opts.onClose?.();
    });
    if (url !== BLANK) navigate(url);
    else if (!ctx.touch) setTimeout(() => els.input?.focus({ preventScroll: true }), 120);
    return win;
  }

  const tool = (cmd, label, svg) =>
    `<button type="button" class="w98-tool" data-cmd="${cmd}" aria-label="${label}">${svg}<span>${label}</span></button>`;

  function updateButtons() {
    if (!win || win.closed) return;
    const set = (cmd, on) => {
      const btn = win.body.querySelector(`[data-cmd="${cmd}"]`);
      if (btn) btn.disabled = !on;
    };
    set('back', index > 0);
    set('forward', index < pages.length - 1);
    set('stop', loading);
  }

  function setTitle(title) {
    win?.setTitle(`${title} - ${APP}`);
  }

  function status(text, pct = null) {
    if (!win || win.closed) return;
    els.status.textContent = fr(text);
    if (pct === null) {
      els.bar.classList.remove('is-on');
    } else {
      els.bar.classList.add('is-on');
      els.fill.style.width = `${Math.min(100, pct)}%`;
    }
  }

  function setLoading(on) {
    loading = on;
    els.throbber?.classList.toggle('is-loading', on);
    updateButtons();
  }

  function show(html, title, cls = '') {
    els.page.className = `w98-page ${cls}`;
    els.page.innerHTML = fr(html);
    els.view.scrollTop = 0;
    setTitle(title);
  }

  // ——— Navigation ———

  function navigate(raw, { push = true } = {}) {
    if (!win || win.closed) return open(raw);
    const target = normalizeUrl(raw);
    if (!target) return;
    if (push) {
      pages = pages.slice(0, index + 1);
      pages.push(raw);
      index = pages.length - 1;
    }
    els.input.value = target.key.startsWith('about:') ? target.key : target.url;
    els.input.blur();
    current = target;
    load(target);
  }

  async function load(target) {
    const my = ++token;
    const stale = () => my !== token || !win || win.closed;
    opts.onNavigate?.(target);
    if (target.key === BLANK) {
      setLoading(false);
      show(blankPage(), BLANK);
      status('Terminé');
      return;
    }
    setLoading(true);
    shell.busy(900, 'working');
    status(`Recherche de l’hôte ${target.host}…`, 4);
    await ctx.wait(650);
    if (stale()) return;
    if (!opts.online?.()) {
      fail('offline', target);
      return;
    }
    status(`Hôte ${target.host} trouvé ; attente de la réponse…`, 12);
    await ctx.wait(550);
    if (stale()) return;
    if (!opts.online?.()) return fail('offline', target);
    if (isSolution(target)) return loadSolution(my);
    const note = ANACHRONISMS.find(([re]) => re.test(target.key))?.[1];
    status(`Ouverture de la page ${target.url}…`, 40);
    await ctx.wait(500);
    if (stale()) return;
    fail('notfound', target, note);
  }

  function fail(kind, target, note) {
    setLoading(false);
    if (kind === 'offline') {
      show(offlinePage(), 'Impossible d’afficher la page', 'is-error');
      status('Impossible d’afficher la page');
    } else {
      show(notFoundPage(target, note), 'Page introuvable', 'is-error');
      status('Page introuvable');
    }
    els.icon.innerHTML = ICON16.doc;
    audio.winError();
    opts.onError?.(kind, target, Boolean(note));
  }

  // La page perso : texte d'abord, ligne par ligne, puis les images
  async function loadSolution(my) {
    const stale = () => my !== token || !win || win.closed;
    const calm = reduced();
    status('Ouverture de la page http://www.saut-temporel.98/…', 20);
    show(solutionPage(), 'http://www.saut-temporel.98/', 'is-site is-loading');
    opts.onSolutionStart?.();
    const blocks = [...els.page.querySelectorAll('.st98-block')];
    const images = [...els.page.querySelectorAll('.st98-img')];
    images.forEach((img) => img.classList.add('is-pending'));
    for (let i = 0; i < blocks.length; i++) {
      await ctx.wait(calm ? 60 : 260 + (blocks[i].textContent.length > 80 ? 260 : 0));
      if (stale()) return;
      blocks[i].classList.add('is-in');
      status(`Ouverture de la page http://www.saut-temporel.98/…`, 20 + (i / blocks.length) * 45);
      if (i === 0) setTitle('Saut Temporel Online — Bienvenue !');
    }
    // Le fond étoilé arrive, puis les images une à une
    const files = ['fond.gif', ...images.map((img) => img.dataset.img)];
    for (let i = 0; i < files.length; i++) {
      status(`(${files.length - i} élément(s) restant(s)) Téléchargement de l’image http://www.saut-temporel.98/${files[i]}…`, 65 + (i / files.length) * 35);
      await ctx.wait(calm ? 60 : 420);
      if (stale()) return;
      if (i === 0) els.page.querySelector('.st98').classList.add('has-bg');
      else images[i - 1].classList.replace('is-pending', 'is-loaded');
      opts.tower?.disk(0.2);
    }
    els.page.classList.remove('is-loading');
    setLoading(false);
    status('Terminé');
    els.icon.innerHTML = ICON16.globe;
    opts.onSolutionLoaded?.();
  }

  function stop() {
    if (!loading) return;
    token += 1;
    setLoading(false);
    status('Opération annulée.');
    els.page.classList.remove('is-loading');
    els.page.querySelectorAll('.st98-block:not(.is-in)').forEach((b) => b.classList.add('is-in'));
  }

  // La ligne est coupée en plein chargement
  function connectionLost() {
    if (!win || win.closed || !loading) return;
    token += 1;
    fail('offline', current);
  }

  function command(cmd, btn) {
    if (cmd === 'back' && index > 0) {
      index -= 1;
      navigate(pages[index], { push: false });
    } else if (cmd === 'forward' && index < pages.length - 1) {
      index += 1;
      navigate(pages[index], { push: false });
    } else if (cmd === 'stop') stop();
    else if (cmd === 'refresh') {
      if (current) load(current);
    } else if (cmd === 'home') navigate(BLANK);
    else if (cmd === 'search') {
      shell.alert({ title: 'Rechercher', text: 'Un moteur de recherche ? Le plus célèbre ouvrira en septembre 1998.\n\nEn attendant, l’adresse exacte reste le meilleur chemin.', icon: 'info' });
    } else if (cmd === 'favorites') {
      const rect = btn.getBoundingClientRect();
      const host = shell.el.getBoundingClientRect();
      const s = host.width / shell.el.offsetWidth || 1;
      shell.menus.open(
        [
          { label: '&Ajouter aux favoris…', run: () => shell.alert({ title: 'Ajouter aux favoris', text: 'Cette page est vide : rien à ajouter pour l’instant !', icon: 'info' }) },
          { label: '&Organiser les favoris…', run: () => shell.alert({ title: 'Organiser les favoris', text: 'Vos favoris sont vides… mais le Web est immense.', icon: 'info' }) },
          '-',
          { label: 'Chaînes', icon: ICON16.folder, sub: [] },
          { label: 'Liens', icon: ICON16.folder, sub: [] },
          { label: 'Média', icon: ICON16.folder, sub: [] },
        ],
        { x: (rect.left - host.left) / s, y: (rect.bottom - host.top) / s, align: 'top' },
      );
    } else if (cmd === 'history') {
      shell.alert({ title: 'Historique', text: 'L’historique est vide : votre voyage sur le Web commence à peine !', icon: 'info' });
    } else if (cmd === 'print') {
      shell.alert({ title: 'Imprimer', text: 'Aucune imprimante n’est installée.', icon: 'warning' });
    }
  }

  function pageAction(act) {
    if (act === 'go') opts.onEnter?.();
    else if (act === 'sign') shell.alert({ title: 'Livre d’or', text: 'Le livre d’or est plein !\nRevenez en 2001 pour y laisser un message.', icon: 'info' });
    else if (act === 'ring') shell.alert({ title: 'Webring', text: 'Le site suivant du Webring est « en construction ».\nComme tous les autres.', icon: 'info' });
    else if (act === 'mail') shell.alert({ title: 'Nouveau message', text: 'Votre logiciel de messagerie n’est pas configuré.\n(Mais l’intention est là !)', icon: 'info' });
  }

  // Le bureau disparaît (extinction) : plus aucun chargement ne doit aboutir.
  function destroy() {
    token += 1;
    loading = false;
    win = null;
  }

  return {
    open,
    navigate,
    stop,
    connectionLost,
    destroy,
    get win() {
      return win;
    },
    get isOpen() {
      return Boolean(win && !win.closed);
    },
    get loading() {
      return loading;
    },
    focusAddress() {
      if (!win || win.closed) return;
      els.input.focus({ preventScroll: true });
    },
  };
}
