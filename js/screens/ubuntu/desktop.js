// Bureau GNOME 2 « dans l'esprit » d'Ubuntu 6.06 : panneaux du haut et du bas,
// menus Applications · Raccourcis · Système, liste des fenêtres, espaces de
// travail, horloge et calendrier, icônes, pense-bête et manchot.

import { createDesktop } from '../../ui/windows.js';
import { createMenus } from './menu.js';
import { emblem, icon, mini, penguin, wallpaperUrl } from './art.js';
import { JOURNAL } from '../unix/journal.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const PENGUIN_LINES = [
  'Salut ! Je ne suis pas Tux : je suis son cousin du pôle Sud.',
  'Ici, les logiciels s’installent depuis des dépôts. Pratique, non ?',
  'Un mot de passe, ça ne se note pas sur un post-it… normalement.',
  'Psst : quand une commande manque, le terminal est très bavard.',
  'Moi, je préfère la banquise de 1974. Il y faisait plus frais.',
];

// Icônes des boîtes de dialogue, façon Tango.
export const DIALOG_ICONS = {
  info: `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><defs><radialGradient id="ub-di-i" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#8fb6e8"/><stop offset="1" stop-color="#2d5f9e"/></radialGradient></defs><circle cx="24" cy="24" r="20" fill="url(#ub-di-i)" stroke="#20457a" stroke-width="1.5"/><path d="M24 21v13" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="14" r="3" fill="#fff"/></svg>`,
  warning: `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><defs><linearGradient id="ub-di-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#f0b51c"/></linearGradient></defs><path d="M24 5L44 41H4Z" fill="url(#ub-di-w)" stroke="#8f6a00" stroke-width="1.6" stroke-linejoin="round"/><path d="M24 17v12" stroke="#2e2b25" stroke-width="4.4" stroke-linecap="round"/><circle cx="24" cy="35" r="2.6" fill="#2e2b25"/></svg>`,
  question: `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><defs><radialGradient id="ub-di-q" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#8fb6e8"/><stop offset="1" stop-color="#2d5f9e"/></radialGradient></defs><circle cx="24" cy="24" r="20" fill="url(#ub-di-q)" stroke="#20457a" stroke-width="1.5"/><path d="M18 18.5a6.2 6.2 0 1 1 9 5.6c-2.2 1.2-3 2.4-3 4.9" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/><circle cx="24" cy="35.5" r="2.7" fill="#fff"/></svg>`,
  lock: `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><defs><linearGradient id="ub-di-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d27a"/><stop offset="1" stop-color="#c98f1d"/></linearGradient></defs><path d="M15 21v-6a9 9 0 0 1 18 0v6" fill="none" stroke="#7d7a73" stroke-width="4"/><rect x="10" y="21" width="28" height="22" rx="3" fill="url(#ub-di-l)" stroke="#8a5d0b" stroke-width="1.5"/><circle cx="24" cy="30" r="3" fill="#6b4a08"/><path d="M24 31v6" stroke="#6b4a08" stroke-width="2.6" stroke-linecap="round"/></svg>`,
};

export function buildDesktop(face, ctx, hooks) {
  const { audio } = ctx;
  const abort = new AbortController();
  const { signal } = abort;
  const timers = [];

  face.innerHTML = `
    <div class="ub-wallpaper" style='background-image: ${wallpaperUrl()}'></div>
    <div class="ub-desk"></div>
    <header class="ub-panel ub-panel-top">
      <nav class="ub-panel-menus" aria-label="Menus du panneau">
        <button type="button" class="ub-pm" data-menu="apps">${emblem('ub-pm-emblem')}<span>Applications</span></button>
        <button type="button" class="ub-pm" data-menu="places"><span>Raccourcis</span></button>
        <button type="button" class="ub-pm" data-menu="system"><span>Système</span></button>
      </nav>
      <span class="ub-handle" aria-hidden="true"></span>
      <div class="ub-launchers">
        <button type="button" class="ub-launch" data-launch="web" title="Navigateur Web" aria-label="Navigateur Web">${icon('globe', 22)}</button>
        <button type="button" class="ub-launch" data-launch="mail" title="Courrier électronique" aria-label="Courrier électronique">${icon('mail', 22)}</button>
        <button type="button" class="ub-launch" data-launch="help" title="Aide" aria-label="Aide">${icon('help', 22)}</button>
        <button type="button" class="ub-launch" data-launch="terminal" title="Terminal" aria-label="Terminal">${mini('terminal', 22)}</button>
      </div>
      <span class="ub-fill"></span>
      <div class="ub-tray" aria-hidden="true">${icon('network', 18)}${icon('volume', 18)}</div>
      <button type="button" class="ub-clock" aria-label="Horloge et calendrier"><span class="ub-clock-text"></span></button>
      <button type="button" class="ub-quit" title="Quitter…" aria-label="Quitter">${icon('power', 18)}</button>
    </header>
    <footer class="ub-panel ub-panel-bottom">
      <button type="button" class="ub-showdesk" title="Afficher le bureau" aria-label="Afficher le bureau">${icon('showDesktop', 18)}</button>
      <span class="ub-handle" aria-hidden="true"></span>
      <div class="ub-tasks" role="toolbar" aria-label="Liste des fenêtres"></div>
      <div class="ub-workspaces" role="group" aria-label="Espaces de travail">
        ${[1, 2, 3, 4].map((i) => `<button type="button" class="ub-ws${i === 1 ? ' is-active' : ''}" data-ws="${i}" aria-label="Espace de travail ${i}"><i></i></button>`).join('')}
      </div>
      <button type="button" class="ub-trash" title="Corbeille" aria-label="Corbeille">${icon('trash', 21)}</button>
    </footer>
    <div class="ub-menus"></div>`;

  const q = (sel) => face.querySelector(sel);
  const deskEl = q('.ub-desk');
  const tasks = q('.ub-tasks');
  const scale = () => {
    const rect = face.getBoundingClientRect();
    return rect.width / face.offsetWidth || 1;
  };

  const desk = createDesktop(deskEl, { theme: 'gnome', drag: 'live' });
  const menus = createMenus(q('.ub-menus'), { scaleOf: scale, signal, onActivate: () => audio.click() });

  // ——— Boîtes de dialogue ———

  function dialog({ title = 'Information', text, kind = 'info', buttons = ['Fermer'], width = 380 }) {
    audio.tone({ freq: 784, release: 0.22, vol: 0.035 });
    audio.tone({ freq: 1175, at: 0.07, release: 0.3, vol: 0.03 });
    return desk.alert({ title, text, icon: DIALOG_ICONS[kind] ?? DIALOG_ICONS.info, buttons, width, className: 'ub-dialog' });
  }

  const busyApp = (name) => () =>
    dialog({ title: name, text: `Impossible de lancer « ${name} » : le saut temporel occupe tout le processeur.\nLa sortie, elle, se trouve dans le Terminal.` });
  const game = (name) => () => dialog({ title: name, text: 'Pas le temps de jouer : 2007 vous attend !', kind: 'warning' });
  const pref = (name) => () => dialog({ title: name, text: 'Le thème Human est parfait comme ça. On ne touche à rien.' });

  // ——— Fenêtres : dossiers, éditeur de texte, aide ———

  const FOLDERS = {
    '~': {
      title: 'voyageur',
      items: [
        ['Bureau', 'folder', () => openFolder('~/Bureau')],
        ['Exemples', 'folder', () => openFolder('~/Exemples')],
        ['journal', 'text', () => openText('journal', JOURNAL)],
      ],
    },
    '~/Bureau': { title: 'Bureau', items: [] },
    '~/Exemples': {
      title: 'Exemples',
      items: [
        ['Bienvenue.odt', 'text', busyApp('OpenOffice.org Writer')],
        ['Musique libre.ogg', 'text', busyApp('Rhythmbox')],
        ['Paysage.jpg', 'text', busyApp('Visionneur d’images')],
      ],
    },
    computer: {
      title: 'Poste de travail',
      items: [
        ['Disquette', 'computer', () => dialog({ title: 'Disquette', text: 'Aucun support dans le lecteur.\nLa disquette, c’était en 1981.', kind: 'warning' })],
        ['Lecteur CD-ROM', 'computer', () => dialog({ title: 'Lecteur CD-ROM', text: 'Aucun disque dans le lecteur.', kind: 'warning' })],
        ['Système de fichiers', 'computer', () => openFolder('~')],
      ],
    },
    trash: { title: 'Corbeille', items: [] },
  };

  const opened = new Map();

  function single(key, make) {
    const existing = opened.get(key);
    if (existing && !existing.closed) {
      existing.restore();
      return existing;
    }
    const win = make();
    opened.set(key, win);
    return win;
  }

  function openFolder(path) {
    const folder = FOLDERS[path] ?? FOLDERS['~'];
    return single(`folder:${path}`, () => {
      const win = desk.open({
        title: folder.title,
        x: 120 + opened.size * 26,
        y: 40 + opened.size * 22,
        w: 440,
        h: 300,
        icon: mini(path === 'trash' ? 'text' : 'home', 16),
        menu: ['Fichier', 'Édition', 'Affichage', 'Raccourcis', 'Aide'],
        className: 'ub-nautilus',
        status: folder.items.length ? `${folder.items.length} éléments, espace libre : 3,4 Go` : 'Dossier vide',
        body: `<div class="ub-files">${
          folder.items.length
            ? folder.items
                .map(
                  ([name, kind], i) =>
                    `<button type="button" class="ub-file" data-i="${i}">${icon(kind, 48)}<span>${esc(name)}</span></button>`,
                )
                .join('')
            : `<p class="ub-empty">${path === 'trash' ? 'La corbeille est vide.' : 'Ce dossier est vide.'}</p>`
        }</div>`,
      });
      win.body.querySelectorAll('.ub-file').forEach((btn) => {
        const [, , run] = folder.items[Number(btn.dataset.i)];
        btn.addEventListener('pointerdown', () => {
          win.body.querySelectorAll('.ub-file.is-selected').forEach((b) => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
        });
        btn.addEventListener('dblclick', run);
        btn.addEventListener('keydown', (event) => event.key === 'Enter' && run());
        let last = 0;
        btn.addEventListener('pointerup', (event) => {
          if (event.pointerType !== 'touch') return;
          const now = performance.now();
          if (now - last < 420) run();
          last = now;
        });
      });
      return win;
    });
  }

  function openText(name, lines) {
    return single(`text:${name}`, () => {
      const win = desk.open({
        title: `${name} (~) - gedit`,
        x: 210,
        y: 60,
        w: 560,
        h: 400,
        icon: mini('editor', 16),
        menu: ['Fichier', 'Édition', 'Affichage', 'Rechercher', 'Outils', 'Documents', 'Aide'],
        className: 'ub-gedit',
        status: 'Lig 1, Col 1        INS',
        body: `<div class="ub-gedit-tabs"><span class="is-active">${mini('text', 14)} ${esc(name)}</span></div><textarea class="ub-gedit-text" readonly spellcheck="false"></textarea>`,
      });
      win.body.querySelector('textarea').value = lines.join('\n');
      return win;
    });
  }

  function openHelp() {
    return single('help', () =>
      desk.open({
        title: 'Aide — Installer des logiciels',
        x: 250,
        y: 50,
        w: 470,
        h: 360,
        icon: mini('help', 16),
        menu: ['Fichier', 'Aller à', 'Aide'],
        className: 'ub-yelp',
        body: `<article class="ub-help">
          <h2>${mini('add', 22)} Installer des logiciels</h2>
          <p>Ubuntu installe ses logiciels depuis des <b>dépôts</b> : de grands catalogues en ligne, vérifiés, où tout s’installe d’une seule commande.</p>
          <p>Dans le Terminal, la commande est <code>apt install</code>, suivie du nom du paquet. Comme elle modifie le système, il faut la lancer en administrateur, avec <code>sudo</code> devant.</p>
          <p><b>sudo</b> vous demande alors <em>votre</em> mot de passe. Pendant la saisie, rien ne s’affiche, pas même des étoiles : c’est voulu, tapez-le puis appuyez sur Entrée.</p>
          <p class="ub-help-note">Ubuntu 6.06 LTS « Dapper Drake » — Linux pour les êtres humains.</p>
        </article>`,
      }),
    );
  }

  function about() {
    return dialog({
      title: 'À propos d’Ubuntu',
      text: 'Ubuntu 6.06 LTS « Dapper Drake »\nLinux pour les êtres humains.\n\nSorti le 1er juin 2006, avec le bureau GNOME 2.14 : un système libre, gratuit, mis à jour depuis ses dépôts.',
    });
  }

  function logout() {
    return dialog({
      title: 'Quitter',
      text: 'Fermer la session ?\nImpossible : vous êtes coincé en 2006 tant que la sortie n’est pas installée.',
      kind: 'question',
      buttons: ['Rester'],
    });
  }

  // ——— Menus du panneau ———

  const APPS = [
    {
      label: 'Accessoires',
      icon: mini('accessories'),
      sub: [
        { label: 'Calculatrice', icon: mini('calc'), run: busyApp('Calculatrice') },
        { label: 'Capture d’écran', icon: mini('screenshot'), run: busyApp('Capture d’écran') },
        { label: 'Éditeur de texte', icon: mini('editor'), run: () => openText('journal', JOURNAL) },
        { label: 'Terminal', icon: mini('terminal'), run: () => hooks.terminal() },
      ],
    },
    { label: 'Bureautique', icon: mini('office'), sub: [{ label: 'Traitement de texte OpenOffice.org', icon: mini('office'), run: busyApp('OpenOffice.org Writer') }, { label: 'Tableur OpenOffice.org', icon: mini('office'), run: busyApp('OpenOffice.org Calc') }] },
    { label: 'Graphisme', icon: mini('graphics'), sub: [{ label: 'Éditeur d’images GIMP', icon: mini('graphics'), run: busyApp('GIMP') }] },
    {
      label: 'Internet',
      icon: mini('internet'),
      sub: [
        { label: 'Navigateur Web Firefox', icon: mini('internet'), run: () => web() },
        { label: 'Messagerie instantanée Gaim', icon: mini('internet'), run: busyApp('Gaim') },
        { label: 'Courrier électronique Evolution', icon: mini('internet'), run: busyApp('Evolution') },
      ],
    },
    { label: 'Jeux', icon: mini('games'), sub: [{ label: 'Mines', icon: mini('games'), run: game('Mines') }, { label: 'Gnometris', icon: mini('games'), run: game('Gnometris') }, { label: 'Mahjongg', icon: mini('games'), run: game('Mahjongg') }] },
    { label: 'Son et vidéo', icon: mini('sound'), sub: [{ label: 'Lecteur de musique Rhythmbox', icon: mini('sound'), run: busyApp('Rhythmbox') }, { label: 'Lecteur de films Totem', icon: mini('sound'), run: busyApp('Totem') }] },
    { sep: true },
    {
      label: 'Ajouter/Enlever…',
      icon: mini('add'),
      run: () => dialog({ title: 'Ajouter/Enlever des applications', text: 'Le catalogue graphique est en maintenance.\nUtilisez le Terminal et apt : c’est plus rapide.', kind: 'warning' }),
    },
  ];

  const PLACES = [
    { label: 'Dossier personnel', icon: mini('home'), run: () => openFolder('~') },
    { label: 'Bureau', icon: mini('desktop'), run: () => openFolder('~/Bureau') },
    { sep: true },
    { label: 'Poste de travail', icon: mini('computer'), run: () => openFolder('computer') },
    { label: 'Réseau', icon: mini('network'), run: () => dialog({ title: 'Réseau', text: 'Aucun réseau dans la machine à remonter le temps.', kind: 'warning' }) },
    { sep: true },
    { label: 'Se connecter à un serveur…', icon: mini('server'), run: () => dialog({ title: 'Se connecter à un serveur', text: 'Aucun serveur de 2006 ne répond : ils sont tous en 2006, eux.', kind: 'warning' }) },
    { label: 'Rechercher des fichiers…', icon: mini('search'), run: () => openFolder('~') },
    { label: 'Documents récents', icon: mini('recent'), sub: [{ label: 'journal', icon: mini('text'), run: () => openText('journal', JOURNAL) }] },
  ];

  const SYSTEM = [
    {
      label: 'Préférences',
      icon: mini('prefs'),
      sub: ['Apparence', 'Économiseur d’écran', 'Clavier', 'Souris', 'Son'].map((label) => ({ label, icon: mini('prefs'), run: pref(label) })),
    },
    {
      label: 'Administration',
      icon: mini('admin'),
      sub: [
        {
          label: 'Gestionnaire de paquets Synaptic',
          icon: mini('add'),
          run: () => dialog({ title: 'Synaptic', text: 'Synaptic demande des droits d’administration.\nDans le Terminal, c’est sudo qui s’en charge.', kind: 'lock' }),
        },
        { label: 'Utilisateurs et groupes', icon: mini('admin'), run: () => dialog({ title: 'Utilisateurs et groupes', text: 'voyageur fait partie du groupe admin : il peut utiliser sudo.', kind: 'lock' }) },
        { label: 'Gestionnaire de mises à jour', icon: mini('add'), run: () => dialog({ title: 'Mises à jour', text: 'Votre système est à jour. Enfin, pour 2006.' }) },
      ],
    },
    { sep: true },
    { label: 'Aide et support', icon: mini('help'), run: () => openHelp() },
    { label: 'À propos de GNOME', icon: mini('about'), run: () => dialog({ title: 'À propos de GNOME', text: 'GNOME 2.14 — le bureau libre.\nUn projet communautaire, comme Ubuntu.' }) },
    { label: 'À propos d’Ubuntu', icon: mini('about'), run: about },
    { sep: true },
    { label: 'Quitter…', icon: mini('logout'), run: logout },
  ];

  const pm = (name) => q(`.ub-pm[data-menu="${name}"]`);
  menus.bindBar([
    { el: pm('apps'), items: APPS },
    { el: pm('places'), items: PLACES },
    { el: pm('system'), items: SYSTEM },
  ]);

  function web() {
    return dialog({ title: 'Navigateur Web', text: 'Firefox ne trouve pas le serveur.\nLe Web de 2006 attendra : la sortie est dans le Terminal.', kind: 'warning' });
  }

  q('.ub-launchers').addEventListener('click', (event) => {
    const name = event.target.closest('[data-launch]')?.dataset.launch;
    if (!name) return;
    audio.click();
    if (name === 'terminal') hooks.terminal();
    if (name === 'web') web();
    if (name === 'mail') busyApp('Evolution')();
    if (name === 'help') openHelp();
  });
  q('.ub-quit').addEventListener('click', () => {
    audio.click();
    logout();
  });

  // ——— Horloge et calendrier ———

  const clockText = q('.ub-clock-text');
  const tick = () => {
    const now = new Date();
    clockText.textContent = `jeu. 1 juin, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  tick();
  timers.push(ctx.interval(tick, 10_000));

  q('.ub-clock').addEventListener('click', () => {
    const existing = face.querySelector('.ub-calendar');
    if (existing) {
      existing.remove();
      return;
    }
    const cal = document.createElement('div');
    cal.className = 'ub-calendar';
    const cells = [];
    for (let i = 0; i < 3; i++) cells.push('<span></span>');
    for (let d = 1; d <= 30; d++) cells.push(`<span class="${d === 1 ? 'is-today' : ''}">${d}</span>`);
    cal.innerHTML = `<header>‹ juin › <b>2006</b></header><div class="ub-cal-grid">${['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
      .map((d) => `<b>${d}</b>`)
      .join('')}${cells.join('')}</div>`;
    face.append(cal);
    const close = (event) => {
      if (cal.contains(event.target) || event.target.closest('.ub-clock')) return;
      cal.remove();
      window.removeEventListener('pointerdown', close, true);
    };
    setTimeout(() => window.addEventListener('pointerdown', close, { capture: true, signal }), 0);
  });

  // ——— Liste des fenêtres ———

  const buttons = new Map();
  const isDialog = (win) => win.el.classList.contains('wm-dialog');

  function renderTasks() {
    for (const [win, btn] of buttons) {
      btn.classList.toggle('is-active', desk.focused === win && !win.minimized);
      btn.classList.toggle('is-min', win.minimized);
      btn.querySelector('.ub-task-label').textContent = win.el.getAttribute('aria-label');
    }
  }

  desk.on('open', (win) => {
    if (isDialog(win)) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ub-task';
    btn.innerHTML = `<span class="ub-task-ico">${win.spec.icon ?? ''}</span><span class="ub-task-label"></span>`;
    btn.addEventListener('click', () => {
      audio.click();
      if (desk.focused === win && !win.minimized) win.minimize();
      else win.restore();
      renderTasks();
    });
    tasks.append(btn);
    buttons.set(win, btn);
    win.on('close', () => {
      btn.remove();
      buttons.delete(win);
      renderTasks();
    });
    renderTasks();
  });
  for (const type of ['focus', 'minimize', 'restore', 'close']) desk.on(type, () => renderTasks());

  // Afficher le bureau : tout réduire, ou tout rétablir.
  let hidden = [];
  q('.ub-showdesk').addEventListener('click', () => {
    audio.click();
    const visible = desk.windows.filter((w) => !w.minimized && !isDialog(w));
    if (visible.length) {
      hidden = visible;
      visible.forEach((w) => w.minimize());
    } else {
      hidden.forEach((w) => !w.closed && w.restore());
      hidden = [];
    }
    renderTasks();
  });

  // Espaces de travail : les fenêtres restent sur le premier.
  q('.ub-workspaces').addEventListener('click', (event) => {
    const ws = event.target.closest('[data-ws]');
    if (!ws) return;
    audio.click();
    face.querySelectorAll('.ub-ws').forEach((b) => b.classList.toggle('is-active', b === ws));
    face.classList.toggle('is-other-ws', ws.dataset.ws !== '1');
  });

  q('.ub-trash').addEventListener('click', () => {
    audio.click();
    openFolder('trash');
  });

  // ——— Icônes, pense-bête et manchot ———

  desk.icon({ label: 'Dossier personnel', svg: icon('home', 48), x: 14, y: 12, onOpen: () => openFolder('~') });
  desk.icon({ label: 'Poste de travail', svg: icon('computer', 48), x: 14, y: 104, onOpen: () => openFolder('computer') });

  const note = document.createElement('div');
  note.className = 'ub-note';
  note.innerHTML = `<header><span>Pense-bête</span><i aria-hidden="true"></i></header>
    <p>Pour rentrer en 2007 :<br>lancer le programme <b>sortie</b> dans le Terminal.</p>`;
  deskEl.append(note);

  const peng = document.createElement('button');
  peng.type = 'button';
  peng.className = 'ub-penguin';
  peng.setAttribute('aria-label', 'Le manchot du bureau');
  peng.innerHTML = `${penguin()}<span class="ub-bubble" role="status" hidden></span>`;
  deskEl.append(peng);
  let line = 0;
  let bubbleTimer = 0;
  peng.addEventListener('click', () => {
    const bubble = peng.querySelector('.ub-bubble');
    bubble.textContent = PENGUIN_LINES[line % PENGUIN_LINES.length];
    line += 1;
    bubble.hidden = false;
    peng.classList.remove('is-hopping');
    void peng.offsetWidth;
    peng.classList.add('is-hopping');
    audio.tone({ freq: 880, to: 1320, glide: 0.08, release: 0.12, vol: 0.05, type: 'triangle' });
    audio.tone({ freq: 1320, to: 990, glide: 0.1, at: 0.1, release: 0.14, vol: 0.04, type: 'triangle' });
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => (bubble.hidden = true), 4200);
  });

  function destroy() {
    abort.abort();
    clearTimeout(bubbleTimer);
    timers.forEach((t) => ctx.clear(t));
    menus.closeAll();
    desk.destroy();
  }

  return { desk, menus, dialog, openFolder, openText, openHelp, scale, deskEl, renderTasks, destroy };
}
