// Coquille XP : barre des tâches Luna (bouton « démarrer », lancement rapide,
// boutons de fenêtres qui clignotent, zone de notification et horloge), menu
// Démarrer, bulles d'information et fenêtres de l'Explorateur.

import { avatar, esc, icon } from './art.js';

export const TASKBAR_H = 30;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ——— Contenu du menu Démarrer ———

const LEFT = [
  { id: 'web', icon: 'globe', label: 'Internet', sub: 'Navigateur Web', pinned: true },
  { id: 'mail', icon: 'mail', label: 'Courrier électronique', sub: 'Boîte de réception', pinned: true },
  '-',
  { id: 'im', icon: 'messenger', label: 'Messagerie' },
  { id: 'media', icon: 'media', label: 'Lecteur multimédia' },
  { id: 'paint', icon: 'paint', label: 'Paint' },
  { id: 'games', icon: 'games', label: 'Jeux' },
];

const RIGHT = [
  { id: 'documents', icon: 'documents', label: 'Mes documents', strong: true },
  { id: 'pictures', icon: 'pictures', label: 'Mes images', strong: true },
  { id: 'music', icon: 'music', label: 'Ma musique', strong: true },
  { id: 'computer', icon: 'computer', label: 'Poste de travail', strong: true },
  '-',
  { id: 'control', icon: 'control', label: 'Panneau de configuration' },
  '-',
  { id: 'help', icon: 'help', label: 'Aide et support' },
  { id: 'search', icon: 'search', label: 'Rechercher' },
  { id: 'run', icon: 'run', label: 'Exécuter…' },
];

// Réponses des programmes qui ne mènent nulle part (clins d'œil aux autres époques)
const QUIPS = {
  web: ['Internet', 'Pas le temps de surfer : quelqu’un vous attend sur la messagerie !'],
  mail: ['Courrier électronique', 'Aucun nouveau message. Les vrais bavards sont sur la messagerie instantanée.'],
  media: ['Lecteur multimédia', 'Aucune piste : Kev1n a encore emprunté le CD.'],
  paint: ['Paint', 'Paint est occupé : il dessine une colline verte.'],
  games: ['Jeux', 'Démineur et Solitaire ? Déjà vus en 1992 !'],
  control: ['Panneau de configuration', 'Les réglages sont verrouillés pendant le voyage temporel.'],
  help: ['Aide et support', 'Un contact ne répond pas ? Il faut trouver un moyen d’attirer son attention…'],
  search: ['Rechercher', 'Le petit chien de la recherche est parti en balade. Revenez plus tard !'],
  run: ['Exécuter', 'Taper WIN ? Ça, c’était en 1992 : ici, tout se fait à la souris.'],
  logoff: ['Fermer la session', 'Pas avant d’avoir trouvé la sortie de cette époque !'],
  power: ['Arrêter l’ordinateur', 'En 1995, éteindre suffisait pour partir. Cette fois, la sortie est ailleurs…'],
};

// ——— Fenêtres de l'Explorateur ———

const PLACES = {
  computer: {
    title: 'Poste de travail',
    icon: 'computer',
    tasks: [
      ['Tâches système', [['control', 'Afficher les informations système'], ['run', 'Ajouter ou supprimer des programmes'], ['control', 'Modifier un paramètre']]],
      ['Autres emplacements', [['network', 'Favoris réseau'], ['documents', 'Mes documents'], ['control', 'Panneau de configuration']]],
    ],
    groups: [
      ['Fichiers enregistrés sur cet ordinateur', [['folder', 'Documents partagés', 'Dossier de fichiers'], ['folder', 'Documents de Voyageur', 'Dossier de fichiers']]],
      ['Disques durs', [['hdd', 'Disque local (C:)', 'Disque local', 'Encore lui ! Le C: du disque dur, hérité de 1981.']]],
      [
        'Périphériques utilisant des supports amovibles',
        [
          ['floppy', 'Disquette 3½ (A:)', 'Disquette 3½ pouces', 'Le lecteur A: est vide. Les disquettes, c’était en 1981 !'],
          ['cd', 'Lecteur CD (D:)', 'Lecteur CD', 'Insérez un disque dans le lecteur D:.'],
        ],
      ],
    ],
  },
  documents: {
    title: 'Mes documents',
    icon: 'documents',
    tasks: [
      ['Gestion des fichiers et dossiers', [['folder', 'Créer un nouveau dossier'], ['network', 'Publier ce dossier sur le Web'], ['folders', 'Partager ce dossier']]],
      ['Autres emplacements', [['computer', 'Poste de travail'], ['network', 'Favoris réseau']]],
    ],
    groups: [
      ['', [
        ['music', 'Ma musique', 'Dossier de fichiers', 'music'],
        ['pictures', 'Mes images', 'Dossier de fichiers', 'pictures'],
        ['wordfile', 'exposé_dinosaures.doc', 'Document · 48 Ko', 'Un exposé de CM2. Rien à voir avec la sortie.'],
        ['textfile', 'liste_de_noël.txt', 'Document texte · 1 Ko', '« Un baladeur MP3 de 256 Mo, une webcam, un modem ADSL… »'],
      ]],
    ],
  },
  pictures: {
    title: 'Mes images',
    icon: 'pictures',
    tasks: [['Tâches d’images', [['imagefile', 'Afficher sous forme de diaporama'], ['run', 'Commander des tirages en ligne']]]],
    groups: [['', [
      ['imagefile', 'vacances_2004.jpg', 'Image JPEG · 640 × 480', 'Une colline verte sous un ciel bleu. Original, non ?'],
      ['imagefile', 'webcam_kev1n.jpg', 'Image JPEG · 320 × 240', 'Kev1n qui dort devant sa webcam. Ça promet…'],
    ]]],
  },
  music: {
    title: 'Ma musique',
    icon: 'music',
    tasks: [['Tâches de musique', [['media', 'Lire tout'], ['globe', 'Acheter de la musique en ligne']]]],
    groups: [['', [
      ['mp3file', 'tube_de_l_été.mp3', 'Fichier MP3 · 3,4 Mo', 'Téléchargé à 5 Ko/s, toute une nuit.'],
      ['mp3file', 'générique_dessin_animé.mp3', 'Fichier MP3 · 2,1 Mo', 'Un classique des mercredis après-midi.'],
    ]]],
  },
  bin: {
    title: 'Corbeille',
    icon: 'bin',
    tasks: [['Tâches de la Corbeille', [['bin', 'Vider la Corbeille'], ['back', 'Restaurer tous les éléments']]], ['Autres emplacements', [['documents', 'Mes documents'], ['computer', 'Poste de travail']]]],
    groups: [['', [
      ['textfile', 'sortie_1998.txt', 'Supprimé · 1 Ko', 'Ancienne sortie : www.saut-temporel.98. Périmée !'],
      ['wordfile', 'devoir_maths_FINAL_v3.doc', 'Supprimé · 24 Ko', 'Version 3, vraiment finale. Enfin presque.'],
      ['mp3file', 'sonnerie_grenouille.mp3', 'Supprimé · 96 Ko', 'Une sonnerie de portable très (trop) célèbre en 2005.'],
    ]]],
  },
};

export function createShell({ ui, desk, ctx, view, actions = {} }) {
  const { audio } = ctx;
  const abort = new AbortController();
  const { signal } = abort;
  const buttons = new Map();
  let menu = null;
  let current = null;
  let minutes = 23 * 60 + 47;

  // ——— Barre des tâches ———

  const bar = document.createElement('div');
  bar.className = 'xp-taskbar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Barre des tâches');
  bar.innerHTML = `
    <button type="button" class="xp-start" aria-haspopup="menu" aria-expanded="false">
      <span class="xp-start-orb">${icon('orb', 20)}</span><span class="xp-start-label">démarrer</span>
    </button>
    <div class="xp-quick">
      <button type="button" class="xp-ql" data-ql="desktop" title="Afficher le Bureau" aria-label="Afficher le Bureau">${icon('showdesk', 18)}</button>
      <button type="button" class="xp-ql" data-ql="web" title="Navigateur Web" aria-label="Navigateur Web">${icon('globe', 18)}</button>
      <button type="button" class="xp-ql" data-ql="im" title="Messagerie" aria-label="Messagerie">${icon('messenger', 18)}</button>
    </div>
    <div class="xp-tasks"></div>
    <div class="xp-tray">
      <button type="button" class="xp-tray-ic" data-tray="im" title="Messagerie : En ligne" aria-label="Messagerie : En ligne">${icon('messenger', 16)}</button>
      <span class="xp-tray-ic" title="Volume">${icon('volume', 16)}</span>
      <span class="xp-tray-ic" title="Connexion au réseau local : 100,0 Mbits/s">${icon('network', 16)}</span>
      <time class="xp-clock" title="samedi 14 mai 2005"></time>
    </div>`;
  ui.append(bar);

  const tasks = bar.querySelector('.xp-tasks');
  const startBtn = bar.querySelector('.xp-start');
  const clockEl = bar.querySelector('.xp-clock');

  const time = () => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const tick = () => {
    clockEl.textContent = time();
  };
  tick();
  ctx.interval(() => {
    minutes += 1;
    tick();
  }, 60_000);

  const visible = (win) => !win.closed && !win.minimized && !win.el.hidden;
  const isActive = (win) => visible(win) && win.el.classList.contains('is-active');

  function render() {
    for (const [win, btn] of buttons) {
      const active = isActive(win);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
  }

  function addTask(win) {
    if (buttons.has(win) || win.spec.taskbar === false) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'xp-task';
    btn.innerHTML = `<span class="xp-task-ic">${win.spec.icon ?? ''}</span><span class="xp-task-label"></span>`;
    btn.addEventListener('click', () => {
      audio.click();
      closeMenu();
      if (win.minimized) win.restore();
      else if (isActive(win)) win.minimize();
      else win.focus();
      render();
    });
    buttons.set(win, btn);
    tasks.append(btn);
    update(win);
    render();
  }

  function update(win) {
    const btn = buttons.get(win);
    if (!btn) return;
    const title = win.el.querySelector('.wm-title')?.textContent ?? '';
    btn.querySelector('.xp-task-label').textContent = title;
    btn.title = title;
    btn.setAttribute('aria-label', title);
  }

  function removeTask(win) {
    buttons.get(win)?.remove();
    buttons.delete(win);
  }

  // Bouton orange qui clignote : une fenêtre réclame l'attention
  function flash(win, on = true) {
    const btn = buttons.get(win);
    if (!btn) return;
    btn.classList.toggle('is-flash', on);
    btn.classList.remove('is-blinking');
    if (on) {
      void btn.offsetWidth;
      btn.classList.add('is-blinking');
    }
  }

  const topWindow = () =>
    desk.windows.filter(visible).sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex))[0];

  desk.on('open', (win) => {
    if (!win.el.classList.contains('wm-dialog')) addTask(win);
  });
  desk.on('close', (win) => {
    removeTask(win);
    render();
  });
  desk.on('focus', () => render());
  desk.on('restore', () => render());
  // Comme sous XP, réduire une fenêtre active la suivante
  desk.on('minimize', () => {
    const next = topWindow();
    if (next) desk.focus(next);
    render();
  });
  // Un clic sur le bureau désactive la fenêtre au premier plan
  desk.on('desktop', () => {
    desk.focused?.el.classList.remove('is-active');
    closeMenu();
    render();
  });

  bar.querySelector('.xp-quick').addEventListener('click', (event) => {
    const id = event.target.closest('[data-ql]')?.dataset.ql;
    if (!id) return;
    audio.click();
    closeMenu();
    if (id === 'desktop') {
      const open = desk.windows.filter(visible);
      if (open.length) open.forEach((win) => win.minimize());
      else desk.windows.filter((win) => win.minimized).forEach((win) => win.restore());
    } else if (id === 'im') actions.messenger?.();
    else quip(id, event.target.closest('[data-ql]'));
  });

  bar.querySelector('[data-tray="im"]').addEventListener('click', () => {
    audio.click();
    closeMenu();
    actions.messenger?.();
  });

  startBtn.addEventListener('click', () => {
    audio.click();
    if (menu) closeMenu();
    else openMenu();
  });

  // ——— Menu Démarrer ———

  const item = (entry, side) => {
    if (entry === '-') return '<li class="xp-sm-sep" role="separator"></li>';
    const size = side === 'left' ? 32 : 24;
    return `<li><button type="button" class="xp-sm-item${entry.strong ? ' is-strong' : ''}${entry.pinned ? ' is-pinned' : ''}" role="menuitem" data-sm="${entry.id}">
      ${icon(entry.icon, size)}<span class="xp-sm-text"><span>${esc(entry.label)}</span>${entry.sub ? `<small>${esc(entry.sub)}</small>` : ''}</span></button></li>`;
  };

  function openMenu() {
    if (menu) return;
    menu = document.createElement('div');
    menu.className = 'xp-startmenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Menu Démarrer');
    menu.innerHTML = `
      <header class="xp-sm-head"><span class="xp-sm-pic">${avatar('duck', 42)}</span><b>Voyageur</b></header>
      <div class="xp-sm-body">
        <ul class="xp-sm-left">${LEFT.map((e) => item(e, 'left')).join('')}
          <li class="xp-sm-sep" role="separator"></li>
          <li><button type="button" class="xp-sm-item xp-sm-all" role="menuitem" data-sm="all"><span class="xp-sm-text"><span>Tous les programmes</span></span><i class="xp-sm-arrow" aria-hidden="true"></i></button></li>
        </ul>
        <ul class="xp-sm-right">${RIGHT.map((e) => item(e, 'right')).join('')}</ul>
      </div>
      <footer class="xp-sm-foot">
        <button type="button" class="xp-sm-foot-btn" role="menuitem" data-sm="logoff">${icon('logoff', 22)}<span>Fermer la session</span></button>
        <button type="button" class="xp-sm-foot-btn" role="menuitem" data-sm="power">${icon('power', 22)}<span>Arrêter l’ordinateur</span></button>
      </footer>`;
    ui.append(menu);
    startBtn.classList.add('is-open');
    startBtn.setAttribute('aria-expanded', 'true');

    menu.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-sm]');
      if (!btn) return;
      audio.click();
      const id = btn.dataset.sm;
      closeMenu();
      if (id === 'im') actions.messenger?.();
      else if (PLACES[id]) explore(id);
      else if (id === 'all') balloon(startBtn, { title: 'Tous les programmes', text: 'Accessoires, Jeux, Démarrage… et la Messagerie, toujours en ligne !' });
      else quip(id, startBtn);
    });
    menu.addEventListener('keydown', (event) => {
      const items = [...menu.querySelectorAll('[data-sm]')];
      const i = items.indexOf(document.activeElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = items[(i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
        next.focus();
      } else if (event.key === 'Escape') {
        event.stopPropagation();
        closeMenu();
        startBtn.focus();
      }
    });
    setTimeout(() => menu?.querySelector('[data-sm]')?.focus({ preventScroll: true }), 0);
  }

  function closeMenu() {
    if (!menu) return;
    menu.remove();
    menu = null;
    startBtn.classList.remove('is-open');
    startBtn.setAttribute('aria-expanded', 'false');
  }

  // Fermeture au clic ailleurs
  ui.addEventListener(
    'pointerdown',
    (event) => {
      if (menu && !menu.contains(event.target) && !startBtn.contains(event.target)) closeMenu();
      if (current && !current.contains(event.target) && !event.target.closest('[data-balloon-anchor]')) closeBalloon();
    },
    { signal, capture: true },
  );

  // ——— Bulles d'information ———

  function local(el) {
    const r = el.getBoundingClientRect();
    const u = ui.getBoundingClientRect();
    const s = u.width / ui.offsetWidth || 1;
    return { x: (r.left - u.left) / s, y: (r.top - u.top) / s, w: r.width / s, h: r.height / s };
  }

  function closeBalloon() {
    current?.remove();
    current = null;
  }

  function balloon(anchor, { title = '', text = '', kind = 'info', timeout = 6500 } = {}) {
    closeBalloon();
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
    const above = a.y - h - 14 > 2;
    const x = clamp(a.x + a.w / 2 - 28, 4, view.w - w - 4);
    el.style.left = `${x}px`;
    el.style.top = `${above ? a.y - h - 12 : a.y + a.h + 12}px`;
    el.style.setProperty('--tail', `${clamp(a.x + a.w / 2 - x, 14, w - 26)}px`);
    el.classList.add(above ? 'is-above' : 'is-below');
    el.querySelector('.xp-balloon-x').addEventListener('click', closeBalloon);
    current = el;
    const timer = ctx.timeout(() => current === el && closeBalloon(), timeout);
    el.addEventListener('pointerenter', () => ctx.clear(timer), { once: true });
    return el;
  }

  function quip(id, anchor) {
    const [title, text] = QUIPS[id] ?? ['Information', 'Rien à signaler.'];
    balloon(anchor ?? startBtn, { title, text, kind: id === 'power' || id === 'logoff' ? 'warning' : 'info' });
  }

  // ——— Explorateur ———

  const explorers = new Map();

  function explore(id) {
    const place = PLACES[id];
    const existing = explorers.get(id);
    if (existing && !existing.closed) {
      existing.restore();
      return existing;
    }
    const small = view.w < 800;
    const w = Math.min(560, view.w - 24);
    const h = Math.min(400, view.h - TASKBAR_H - 24);
    const offset = explorers.size * 22;
    const win = desk.open({
      id: `ex-${id}`,
      title: place.title,
      icon: icon(place.icon, 16),
      x: clamp(70 + offset, 0, view.w - w),
      y: clamp(36 + offset, 0, view.h - TASKBAR_H - h),
      w,
      h,
      maximized: small,
      menu: ['&Fichier', '&Edition', '&Affichage', 'F&avoris', '&Outils', '&?'],
      status: `${place.groups.reduce((n, [, list]) => n + list.length, 0)} objet(s)`,
      className: 'xp-ex-win',
      body: `<div class="xp-ex">
        <div class="xp-ex-tools">
          <button type="button" class="xp-ex-tool" disabled>${icon('back', 22)}<span>Précédente</span></button>
          <button type="button" class="xp-ex-tool" disabled aria-label="Suivante">${icon('forward', 22)}</button>
          <button type="button" class="xp-ex-tool" aria-label="Dossier parent">${icon('up', 22)}</button>
          <i class="xp-ex-sep"></i>
          <button type="button" class="xp-ex-tool" data-quip="search">${icon('search', 22)}<span>Rechercher</span></button>
          <button type="button" class="xp-ex-tool">${icon('folders', 22)}<span>Dossiers</span></button>
          <i class="xp-ex-sep"></i>
          <button type="button" class="xp-ex-tool" aria-label="Affichage">${icon('views', 22)}</button>
        </div>
        <div class="xp-ex-address"><span class="xp-ex-label">Adresse</span>
          <span class="xp-ex-field">${icon(place.icon, 16)}<span>${esc(place.title)}</span><i class="xp-ex-drop"></i></span>
          <button type="button" class="xp-ex-go">${icon('go', 18)}<span>OK</span></button></div>
        <div class="xp-ex-main">
          <aside class="xp-ex-side">${place.tasks
            .map(
              ([title, links]) => `<section class="xp-ex-box"><h3>${esc(title)}<i class="xp-ex-chev" aria-hidden="true"></i></h3>
                <ul>${links.map(([ic, label]) => `<li>${icon(ic, 16)}<span>${esc(label)}</span></li>`).join('')}</ul></section>`,
            )
            .join('')}</aside>
          <div class="xp-ex-files">${place.groups
            .map(
              ([title, items]) => `${title ? `<h4>${esc(title)}</h4>` : ''}<ul class="xp-ex-grid">${items
                .map(
                  ([ic, name, detail, note], i) => `<li><button type="button" class="xp-ex-item" data-i="${i}" data-note="${esc(note ?? '')}">
                    ${icon(ic, 48)}<span><b>${esc(name)}</b><small>${esc(detail)}</small></span></button></li>`,
                )
                .join('')}</ul>`,
            )
            .join('')}</div>
        </div>
      </div>`,
    });
    if (small) win.autoMax = true;
    explorers.set(id, win);
    win.on('close', () => explorers.delete(id));
    const status = win.el.querySelector('.wm-status');
    win.body.querySelectorAll('.xp-ex-item').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        win.body.querySelectorAll('.xp-ex-item.is-selected').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        status.textContent = btn.querySelector('small').textContent;
      });
      btn.addEventListener('focus', () => btn.classList.add('is-selected'));
      btn.addEventListener('blur', () => btn.classList.remove('is-selected'));
      const open = () => {
        const note = btn.dataset.note;
        if (PLACES[note]) explore(note);
        else if (note) balloon(btn, { title: btn.querySelector('b').textContent, text: note });
      };
      btn.addEventListener('dblclick', open);
      btn.addEventListener('keydown', (event) => event.key === 'Enter' && open());
      btn.addEventListener('pointerup', (event) => {
        if (event.pointerType !== 'touch') return;
        const now = performance.now();
        if (now - (btn.lastTap ?? 0) < 420) open();
        btn.lastTap = now;
      });
    });
    win.body.querySelector('[data-quip="search"]').addEventListener('click', (event) => quip('search', event.currentTarget));
    return win;
  }

  // ——— Changement de résolution ———

  function relayout() {
    closeMenu();
    closeBalloon();
  }

  function destroy() {
    abort.abort();
    closeMenu();
    closeBalloon();
  }

  return {
    el: bar,
    startButton: startBtn,
    time,
    render,
    update,
    flash,
    buttonFor: (win) => buttons.get(win),
    balloon,
    closeBalloon,
    explore,
    closeMenu,
    relayout,
    destroy,
  };
}
