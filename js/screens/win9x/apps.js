// Les accessoires des Windows 95 et 98, ouverts depuis le menu Démarrer ou le
// bureau : Bloc-notes, Aide, Exécuter, Poste de travail, Corbeille, Invite
// MS-DOS, Démineur, Calculatrice, Paint, Défragmenteur, Rechercher, Panneau de
// configuration, propriétés de l'affichage et de la barre des tâches.

import { ICONS } from '../../ui/icons.js';
import { pixelArt } from '../../ui/pixel.js';
import { createTerminal } from '../../ui/terminal.js';
import { createMinesweeper } from '../win31/minesweeper.js';
import { ICON16, ICON32 } from './icons.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const BOOK = pixelArt(16, (p) => {
  p.rect(2, 2, 11, 12, 'K');
  p.rect(3, 3, 9, 10, 'M');
  p.rect(3, 3, 2, 10, 'm');
  p.rect(4, 13, 10, 2, 'W');
  p.hline(4, 15, 10, 'K');
  p.vline(13, 3, 12, 'K');
});

const BOOK_OPEN = pixelArt(16, (p) => {
  p.map(0, 3, [
    '.KKKKKK..KKKKKK.',
    'KWWWWWWKKWWWWWWK',
    'KWDDDDWKKWDDDDWK',
    'KWWWWWWKKWWWWWWK',
    'KWDDDDWKKWDDDDWK',
    'KWWWWWWKKWWWWWWK',
    'KWDDDWWKKWDDDDWK',
    'KWWWWWWKKWWWWWWK',
    'KMMMMMMKKMMMMMMK',
    '.KKKKKKKKKKKKKK.',
  ]);
});

const TOPIC = pixelArt(16, (p) => {
  p.rect(3, 1, 10, 14, 'K');
  p.rect(4, 2, 8, 12, 'W');
  p.map(6, 4, ['.KK.', 'K..K', '...K', '..K.', '....', '..K.']);
});

const PALETTE = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];

// ——— Rubriques d'aide ———

const HELP_95 = [
  {
    book: 'Introduction à Windows',
    topics: [
      ['Bienvenue', 'Windows démarre directement en mode graphique : plus besoin de taper WIN.\n\nLe bouton Démarrer, en bas à gauche, donne accès à tous vos programmes. La barre des tâches affiche un bouton pour chaque fenêtre ouverte.'],
      ['Nouveautés de cette version', '• Le menu Démarrer et la barre des tâches.\n• Les noms de fichiers longs (jusqu’à 255 caractères).\n• Le clic droit, qui ouvre un menu contextuel.\n• Le Plug and Play : le matériel est détecté tout seul… en principe.'],
    ],
  },
  {
    book: 'Comment…',
    topics: [
      ['Démarrer un programme', '1  Cliquez sur le bouton Démarrer.\n2  Pointez sur Programmes, puis sur le dossier qui contient le programme.\n3  Cliquez sur le programme.'],
      ['Arrêter l’ordinateur', '1  Cliquez sur le bouton Démarrer, puis sur Arrêter.\n2  Cliquez sur « Arrêter l’ordinateur ? », puis sur Oui.\n3  Attendez le message qui indique que vous pouvez éteindre l’ordinateur en toute sécurité, puis appuyez sur son bouton d’alimentation.'],
      ['Passer d’une fenêtre à l’autre', 'Cliquez sur le bouton de la fenêtre dans la barre des tâches.'],
      ['Utiliser le bouton droit de la souris', 'Cliquez avec le bouton droit sur le bureau, une icône ou la barre des tâches : un menu des commandes disponibles apparaît.'],
    ],
  },
  {
    book: 'Conseils et astuces',
    topics: [
      ['Raccourcis clavier', 'Ctrl+Échap ouvre le menu Démarrer.\nMaj+F10 ouvre le menu contextuel de l’élément sélectionné.\nLes flèches parcourent les menus ; Entrée valide, Échap referme.'],
      ['Éteindre proprement', 'N’éteignez jamais l’ordinateur directement : Windows doit d’abord enregistrer ses fichiers. Sinon, ScanDisk vérifiera vos disques au prochain démarrage.'],
    ],
  },
  {
    book: 'Résolution des problèmes',
    topics: [['Un écran bleu est apparu', 'Pas de panique : appuyez sur une touche pour revenir à Windows. Les écrans bleus font partie du charme de l’époque.']],
  },
];

const HELP_98 = [
  HELP_95[0],
  {
    book: 'Internet',
    topics: [
      ['Se connecter à Internet', '1  Double-cliquez sur l’icône « Connexion à Internet » du bureau.\n2  Vérifiez le nom d’utilisateur et le numéro de téléphone de votre fournisseur d’accès.\n3  Cliquez sur Se connecter, et patientez pendant que le modem compose le numéro.'],
      ['Ouvrir une page Web', '1  Une fois connecté, ouvrez le navigateur.\n2  Tapez l’adresse de la page dans la zone Adresse, par exemple www.exemple.98.\n3  Appuyez sur Entrée.'],
      ['Pourquoi le téléphone sonne occupé ?', 'Le modem utilise la ligne téléphonique : tant que vous êtes connecté, personne ne peut appeler… ni décrocher sans couper la connexion.'],
    ],
  },
  HELP_95[1],
  HELP_95[3],
];

// ——— Fichiers du disque C:, pour l'exploration et la recherche ———

const DRIVE_C = [
  ['Mes documents', 'dossier', ICONS.folder],
  ['Program Files', 'dossier', ICONS.folder],
  ['Windows', 'dossier', ICONS.folder],
  ['Autoexec.bat', '1 Ko', ICONS.exe],
  ['Command.com', '92 Ko', ICONS.exe],
  ['Config.sys', '1 Ko', ICONS.readme],
  ['Lisezmoi.txt', '2 Ko', ICONS.readme],
];

const SEARCHABLE = [
  'C:\\Lisezmoi.txt',
  'C:\\Autoexec.bat',
  'C:\\Config.sys',
  'C:\\Windows\\Win.com',
  'C:\\Windows\\Explorer.exe',
  'C:\\Windows\\Notepad.exe',
  'C:\\Windows\\Winmine.exe',
  'C:\\Windows\\Calc.exe',
  'C:\\Windows\\Scandskw.exe',
  'C:\\Windows\\Defrag.exe',
  'C:\\Windows\\Nuages.bmp',
  'C:\\Windows\\Arrêter Windows.lnk',
  'C:\\Mes documents\\Liste de courses.txt',
  'C:\\Mes documents\\Voyage dans le temps.doc',
];

export function createApps(shell, ctx, opts = {}) {
  const { audio } = ctx;
  const { desk } = shell;
  const variant = opts.variant ?? '95';
  const is98 = variant === '98';
  const year = is98 ? 1998 : 1995;
  const apps = new Map();
  let cascadeStep = 0;
  let lastRun = '';

  const nextPos = (w, h) => {
    cascadeStep = (cascadeStep + 1) % 6;
    return { x: Math.max(4, Math.min(640 - w - 4, 60 + cascadeStep * 24)), y: Math.max(4, Math.min(452 - h - 4, 24 + cascadeStep * 22)) };
  };

  // Une seule fenêtre par programme : on la ramène au premier plan.
  function single(key, create) {
    const existing = apps.get(key);
    if (existing && !existing.closed) {
      existing.restore();
      return existing;
    }
    shell.busy(450, 'working');
    opts.tower?.disk(0.6);
    const win = create();
    apps.set(key, win);
    return win;
  }

  const open = (spec) => {
    const pos = spec.x == null ? nextPos(spec.w, spec.h === 'auto' ? 200 : spec.h) : {};
    return desk.open({ ...pos, ...spec });
  };

  // ——— Bloc-notes et WordPad ———

  function notepad(name = 'Sans titre', text = '', { wordpad = false } = {}) {
    return single(`notepad:${name}`, () => {
      const win = open({
        title: `${name} - ${wordpad ? 'WordPad' : 'Bloc-notes'}`,
        icon: wordpad ? ICON16.wordpad : ICON16.notepad,
        w: wordpad ? 420 : 380,
        h: wordpad ? 280 : 250,
        menu: wordpad ? ['&Fichier', '&Edition', '&Affichage', '&Insertion', 'F&ormat', '&?'] : ['&Fichier', '&Edition', '&Recherche', '&?'],
        className: wordpad ? 'w9x-wordpad' : 'w9x-notepad',
        body: `${wordpad ? '<div class="w9x-formatbar"><span class="w9x-combo">Times New Roman</span><span class="w9x-combo is-small">12</span><b>G</b><i>I</i><u>S</u></div>' : ''}<textarea class="w9x-textarea" spellcheck="false"></textarea>`,
      });
      win.body.querySelector('textarea').value = text;
      return win;
    });
  }

  // ——— Aide ———

  function help(topicName) {
    const books = is98 ? HELP_98 : HELP_95;
    return single('help', () => {
      const win = open({
        title: 'Rubriques d’aide : Aide de Windows',
        icon: ICON16.help,
        w: 380,
        h: 330,
        controls: { min: false, max: false },
        className: 'w9x-helpwin',
        body: `
          <div class="w9x-tabs" role="tablist"><span class="is-on" role="tab" aria-selected="true">Sommaire</span><span role="tab">Index</span><span role="tab">Rechercher</span></div>
          <div class="w9x-tabpage">
            <p>Cliquez sur une rubrique, puis sur Afficher. Ou cliquez sur un livre pour l’ouvrir.</p>
            <ul class="w9x-tree" role="tree">${books
              .map(
                (b, bi) => `<li class="w9x-book" role="treeitem" aria-expanded="false">
                  <button type="button" class="w9x-node" data-book="${bi}"><span class="w9x-node-icon">${BOOK}</span>${esc(b.book)}</button>
                  <ul role="group">${b.topics
                    .map(([t], ti) => `<li role="treeitem"><button type="button" class="w9x-node" data-topic="${bi}:${ti}"><span class="w9x-node-icon">${TOPIC}</span>${esc(t)}</button></li>`)
                    .join('')}</ul>
                </li>`,
              )
              .join('')}</ul>
          </div>
          <div class="w9x-dlg-buttons"><button type="button" class="wm-push is-default" data-act="show">Afficher</button><button type="button" class="wm-push" data-act="print">Imprimer…</button><button type="button" class="wm-push" data-act="close">Annuler</button></div>`,
      });
      let selected = null;
      const select = (btn) => {
        win.body.querySelectorAll('.w9x-node.is-sel').forEach((b) => b.classList.remove('is-sel'));
        btn.classList.add('is-sel');
        selected = btn;
      };
      const toggleBook = (btn) => {
        const li = btn.closest('.w9x-book');
        const openNow = li.getAttribute('aria-expanded') !== 'true';
        li.setAttribute('aria-expanded', String(openNow));
        btn.querySelector('.w9x-node-icon').innerHTML = openNow ? BOOK_OPEN : BOOK;
      };
      const show = (btn) => {
        if (!btn) return;
        if (btn.dataset.book) return toggleBook(btn);
        const [bi, ti] = btn.dataset.topic.split(':').map(Number);
        const [title, text] = books[bi].topics[ti];
        topic(title, text);
        ctx.progress();
      };
      win.body.querySelectorAll('.w9x-node').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          select(btn);
          if (btn.dataset.book && event.detail < 2) toggleBook(btn);
        });
        btn.addEventListener('dblclick', () => btn.dataset.topic && show(btn));
      });
      win.body.querySelector('[data-act="show"]').addEventListener('click', () => show(selected));
      win.body.querySelector('[data-act="print"]').addEventListener('click', () => shell.alert({ title: 'Imprimer', text: 'Aucune imprimante n’est installée.\n(Et le papier coûte cher en 1995.)', icon: 'warning' }));
      win.body.querySelector('[data-act="close"]').addEventListener('click', () => win.close());
      win.body.querySelectorAll('.w9x-tabs span:not(.is-on)').forEach((tab) =>
        tab.addEventListener('click', () => shell.alert({ title: 'Aide de Windows', text: 'Windows prépare la liste des mots-clés…\n\nRevenez au Sommaire : tout y est !', icon: 'info' })),
      );
      if (topicName) {
        books.forEach((b, bi) =>
          b.topics.forEach(([t], ti) => {
            if (t === topicName) {
              const btn = win.body.querySelector(`[data-topic="${bi}:${ti}"]`);
              toggleBook(win.body.querySelector(`[data-book="${bi}"]`));
              select(btn);
            }
          }),
        );
      }
      return win;
    });
  }

  function topic(title, text) {
    const win = apps.get('topic');
    if (win && !win.closed) win.close();
    const next = open({
      title: 'Aide de Windows',
      icon: ICON16.help,
      w: 300,
      h: 'auto',
      x: 320,
      y: 60,
      controls: { min: false, max: false },
      className: 'w9x-topic',
      body: `<div class="w9x-topic-body"><h3>${esc(title)}</h3>${text
        .split('\n')
        .map((line) => (line ? `<p>${esc(line)}</p>` : '<br>'))
        .join('')}</div>`,
    });
    apps.set('topic', next);
  }

  // ——— Exécuter ———

  async function run() {
    if (apps.get('run') && !apps.get('run').closed) return apps.get('run').restore();
    const dlg = shell.dialog({
      title: 'Exécuter',
      width: 350,
      buttons: ['OK', 'Annuler', '&Parcourir…'],
      cancelButton: 1,
      className: 'w9x-run',
      body: `
        <div class="w9x-run-row">${ICON32.run}<p>Tapez le nom d’un programme, dossier ou document, et Windows l’ouvrira pour vous.</p></div>
        <label class="w9x-field-row"><span><u>O</u>uvrir :</span><span class="w9x-input w9x-combo-field win9x-field"><input type="text" name="cmd" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="go" autofocus value="${esc(lastRun)}"><i aria-hidden="true"></i></span></label>`,
      onButton: (button) => {
        if (button === 'Parcourir…') {
          shell.alert({ title: 'Parcourir', text: 'La boîte « Parcourir » cherche encore ses lunettes.\nTapez plutôt un nom de programme : notepad, calc, winmine…', icon: 'info' });
          return false;
        }
        return true;
      },
    });
    apps.set('run', dlg.win);
    const { button, form } = await dlg.result;
    if (button !== 'OK') return;
    const cmd = form.elements.cmd.value.trim();
    if (!cmd) return;
    lastRun = cmd;
    runCommand(cmd);
  }

  function runCommand(raw) {
    const cmd = raw.toLowerCase().replace(/\s+/g, ' ');
    const name = cmd.split(' ')[0].replace(/\.(exe|com)$/, '');
    if (opts.onRun?.(cmd, name) === true) return;
    const table = {
      notepad: () => notepad(),
      'bloc-notes': () => notepad(),
      calc: () => calc(),
      winmine: () => minesweeper(),
      mspaint: () => paint(),
      pbrush: () => paint(),
      write: () => notepad('Document', '', { wordpad: true }),
      wordpad: () => notepad('Document', '', { wordpad: true }),
      command: () => msdos(),
      cmd: () => msdos(),
      explorer: () => computer(),
      defrag: () => defrag(),
      control: () => control(),
      winhelp: () => help(),
      scandskw: () => opts.onScandisk?.(),
      win: () => shell.alert({ title: 'Windows', text: 'Windows est déjà lancé !\nDepuis 1995, plus besoin de taper WIN : il démarre tout seul.', icon: 'info' }),
      ls: () => shell.alert({ title: 'Exécuter', text: 'ls ? On n’est pas sous Unix ici !', icon: 'info' }),
      shutdown: () => shell.alert({ title: 'Exécuter', text: `La commande « shutdown » n’arrivera qu’avec Windows XP, en 2001.\nEn ${year}, on passe par le menu Démarrer.`, icon: 'info' }),
      sudo: () => shell.alert({ title: 'Exécuter', text: 'sudo ? Sous Windows 9x, tout le monde est administrateur… pour le meilleur et pour le pire.', icon: 'info' }),
    };
    if (table[name]) return table[name]();
    if (/^(https?:|www\.)/.test(cmd)) {
      if (opts.onUrl) return opts.onUrl(raw);
      return shell.alert({ title: 'Exécuter', text: 'Une adresse Web ? Il faudrait d’abord un modem… rendez-vous en 1998 !', icon: 'info' });
    }
    shell.alert({
      title: raw,
      text: `Impossible de trouver le fichier « ${raw} » (ou un de ses composants). Vérifiez que le chemin d’accès et le nom de fichier sont corrects et que toutes les bibliothèques nécessaires sont disponibles.`,
      icon: 'error',
      width: 360,
    });
  }

  // ——— Poste de travail, disques et corbeille ———

  function folderWindow(key, { title, icon, items, w = 360, h = 230, status }) {
    return single(key, () => {
      const win = open({
        title,
        icon,
        w,
        h,
        menu: ['&Fichier', '&Edition', '&Affichage', '&?'],
        status: status ?? `${items.length} objet(s)`,
        className: 'w9x-folder',
        body: '<div class="w9x-folder-items"></div>',
      });
      const host = win.body.querySelector('.w9x-folder-items');
      for (const item of items) {
        const icon = desk.icon({ label: item.label, svg: item.svg, x: 0, y: 0, parent: host, onOpen: () => item.open?.() });
        icon.classList.add('w9x-file');
        icon.style.position = 'relative';
        icon.style.left = '';
        icon.style.top = '';
        if (item.size) icon.title = item.size;
      }
      return win;
    });
  }

  function notReady(drive) {
    if (drive === 'A') {
      audio.floppy();
      opts.tower?.floppy(1);
    }
    ctx.timeout(
      () =>
        shell.alert({
          title: drive === 'A' ? 'Disquette 3½ (A:)' : 'CD-ROM (D:)',
          text: `${drive}:\\ n’est pas accessible.\n\nLe périphérique n’est pas prêt.`,
          icon: 'error',
          buttons: ['Réessayer', 'Annuler'],
        }),
      drive === 'A' ? 700 : 300,
    );
  }

  function computer() {
    return folderWindow('computer', {
      title: 'Poste de travail',
      icon: ICON16.computer,
      w: 380,
      h: 236,
      items: [
        { label: 'Disquette 3½ (A:)', svg: ICON32.floppy, open: () => notReady('A') },
        { label: '(C:)', svg: ICON32.hdd, open: () => driveC() },
        { label: is98 ? 'CD-ROM (D:)' : '(D:)', svg: ICON32.cdrom, open: () => notReady('D') },
        { label: 'Panneau de configuration', svg: ICON32.settings, open: () => control() },
        { label: 'Imprimantes', svg: ICON32.printer, open: () => printers() },
        ...(is98 ? [{ label: 'Accès réseau à distance', svg: ICON32.dialupFolder, open: () => opts.onDialup?.() }] : []),
      ],
    });
  }

  function driveC() {
    return folderWindow('drive-c', {
      title: '(C:)',
      icon: ICON16.folder,
      w: 400,
      h: 240,
      status: `${DRIVE_C.length} objet(s)   ·   Espace libre : ${is98 ? '1,2 Go' : '84,6 Mo'}`,
      items: DRIVE_C.map(([label, size, svg]) => ({
        label,
        size,
        svg,
        open: () => {
          if (label === 'Lisezmoi.txt') notepad('Lisezmoi', opts.readme ?? '');
          else if (label === 'Mes documents') myDocuments();
          else if (size === 'dossier') shell.alert({ title: label, text: `Le dossier « ${label} » est bien rangé… et il le restera : le voyage n’attend pas.`, icon: 'info' });
          else shell.alert({ title: label, text: `${label}\n\nUn fichier système : mieux vaut ne pas y toucher.`, icon: 'warning' });
        },
      })),
    });
  }

  function myDocuments() {
    return folderWindow('mydocs', {
      title: 'Mes documents',
      icon: ICON16.folder,
      items: [
        { label: 'Liste de courses.txt', svg: ICONS.readme, open: () => notepad('Liste de courses', opts.shopping ?? '') },
        { label: 'Voyage dans le temps.doc', svg: ICONS.notepad, open: () => notepad('Voyage dans le temps', opts.journal ?? '', { wordpad: true }) },
      ],
    });
  }

  function printers() {
    return folderWindow('printers', {
      title: 'Imprimantes',
      icon: ICON16.printer,
      items: [{ label: 'Ajout d’imprimante', svg: ICON32.printer, open: () => shell.alert({ title: 'Ajout d’imprimante', text: 'L’Assistant Ajout d’imprimante a besoin des disquettes du pilote.\nInsérez la disquette 1 sur 7…', icon: 'info' }) }],
    });
  }

  function recycle() {
    return folderWindow('recycle', {
      title: 'Corbeille',
      icon: ICON16.trash,
      items: [],
      status: '0 objet(s)',
    });
  }

  function network() {
    return folderWindow('network', {
      title: 'Voisinage réseau',
      icon: ICON16.network,
      items: [{ label: 'Réseau global', svg: ICONS.network, open: () => shell.alert({ title: 'Voisinage réseau', text: 'Impossible de parcourir le réseau.\nLe réseau n’est pas accessible : cet ordinateur est seul au monde.', icon: 'error' }) }],
    });
  }

  // ——— Invite MS-DOS ———

  function msdos() {
    return single('msdos', () => {
      const win = open({
        title: 'Invite MS-DOS',
        icon: ICON16.msdos,
        w: 440,
        h: 270,
        className: 'w9x-dosbox',
        body: '<div class="w9x-dos"></div>',
      });
      const term = createTerminal(win.body.querySelector('.w9x-dos'), {
        prompt: 'C:\\WINDOWS>',
        caseSensitive: false,
        cursor: 'underline',
        label: 'Invite MS-DOS',
        onKey: () => audio.key(),
        commands: {
          exit: () => {
            setTimeout(() => win.close(), 60);
            return null;
          },
          win: () => 'Windows est déjà lancé. Tapez EXIT pour y revenir.',
          ver: () => `\nWindows ${is98 ? '98 [Version 4.10.1998]' : '95. [Version 4.00.950]'}\n`,
          cls: (args, t) => {
            t.clear();
            return null;
          },
          help: () => 'Commandes : DIR, VER, CLS, EXIT. Et pour éteindre ? Le menu Démarrer !',
          dir: () =>
            ' Répertoire de C:\\WINDOWS\n\nCOMMAND      <REP>\nSYSTEM       <REP>\nEXPLORER EXE\nNOTEPAD  EXE\nWIN      COM\nWINMINE  EXE\n',
          ls: () => 'On n’est pas sous Unix ici ! Sous DOS, on tape DIR.',
          shutdown: () => 'Commande inconnue en ' + year + ' : on éteint par le menu Démarrer.',
          ping: (args) =>
            opts.online?.()
              ? `\nEnvoi d’une requête « ping » sur ${args[0] ?? 'localhost'} :\nRéponse : octets=32 temps=187ms TTL=54\nRéponse : octets=32 temps=203ms TTL=54\n`
              : `Hôte inconnu : ${args[0] ?? ''}. Êtes-vous connecté à Internet ?`,
        },
        unknown: () => 'Commande ou nom de fichier incorrect',
      });
      term.print('Microsoft(R) Windows ' + (is98 ? '98' : '95') + '\n   (C)Copyright Microsoft Corp 1981-' + year + '.\n\nTapez EXIT pour revenir à Windows.\n');
      win.on('close', () => term.destroy());
      win.on('focus', () => !ctx.touch && term.focus());
      if (!ctx.touch) setTimeout(() => term.focus(), 60);
      return win;
    });
  }

  // ——— Jeux ———

  function minesweeper() {
    return single('mines', () => {
      const win = open({
        title: 'Démineur',
        icon: ICON16.mine,
        w: 178,
        h: 258,
        controls: { max: false },
        menu: ['&Partie', '&?'],
        className: 'w9x-mines',
        body: '<div class="w9x-mines-host"></div>',
      });
      const game = createMinesweeper(win.body.querySelector('.w9x-mines-host'), { audio, signal: ctx.signal });
      win.on('close', () => game.destroy());
      return win;
    });
  }

  // ——— Calculatrice ———

  function calc() {
    return single('calc', () => {
      const keys = [
        ['MC', 'm'], ['7'], ['8'], ['9'], ['/', 'o'], ['√', 'o'],
        ['MR', 'm'], ['4'], ['5'], ['6'], ['*', 'o'], ['%', 'o'],
        ['MS', 'm'], ['1'], ['2'], ['3'], ['-', 'o'], ['1/x', 'o'],
        ['M+', 'm'], ['0'], ['+/-'], [','], ['+', 'o'], ['=', 'o'],
      ];
      const win = open({
        title: 'Calculatrice',
        icon: ICON16.calc,
        w: 252,
        h: 'auto',
        controls: { max: false },
        menu: ['&Edition', '&Affichage', '&?'],
        className: 'w9x-calc',
        body: `<div class="w9x-calc-body">
          <output class="win9x-field">0,</output>
          <div class="w9x-calc-top"><span class="w9x-calc-mem"></span><button type="button" data-k="back">Retour</button><button type="button" data-k="ce">CE</button><button type="button" data-k="c">C</button></div>
          <div class="w9x-calc-keys">${keys.map(([k, t]) => `<button type="button" data-k="${k}" class="${t === 'm' ? 'is-mem' : t === 'o' ? 'is-op' : ''}">${k}</button>`).join('')}</div>
        </div>`,
      });
      const out = win.body.querySelector('output');
      const memEl = win.body.querySelector('.w9x-calc-mem');
      let acc = null;
      let op = null;
      let entry = '0';
      let fresh = true;
      let memory = 0;
      const fmt = (n) => (Number.isFinite(n) ? String(Number(n.toPrecision(12))).replace('.', ',') : 'Erreur');
      const value = () => Number(entry.replace(',', '.'));
      const render = () => {
        out.textContent = entry.includes(',') ? entry : `${entry},`;
        memEl.textContent = memory ? 'M' : '';
      };
      const compute = (a, b, o) => ({ '+': a + b, '-': a - b, '*': a * b, '/': b === 0 ? NaN : a / b })[o] ?? b;
      win.body.querySelector('.w9x-calc-body').addEventListener('click', (event) => {
        const k = event.target.closest('button')?.dataset.k;
        if (!k) return;
        audio.click();
        if (/^\d$/.test(k)) {
          entry = fresh || entry === '0' ? k : entry + k;
          fresh = false;
        } else if (k === ',') {
          if (fresh) entry = '0';
          if (!entry.includes(',')) entry += ',';
          fresh = false;
        } else if (k === 'c') {
          acc = null;
          op = null;
          entry = '0';
          fresh = true;
        } else if (k === 'ce') {
          entry = '0';
          fresh = true;
        } else if (k === 'back') {
          if (!fresh) entry = entry.length > 1 ? entry.slice(0, -1) : '0';
        } else if (k === '+/-') {
          entry = fmt(-value());
        } else if (k === '√') {
          entry = fmt(Math.sqrt(value()));
          fresh = true;
        } else if (k === '%') {
          entry = fmt(((acc ?? 0) * value()) / 100);
          fresh = true;
        } else if (k === '1/x') {
          entry = fmt(1 / value());
          fresh = true;
        } else if (k === 'MC') memory = 0;
        else if (k === 'MR') {
          entry = fmt(memory);
          fresh = true;
        } else if (k === 'MS') memory = value();
        else if (k === 'M+') memory += value();
        else {
          const v = value();
          if (op && !fresh) acc = compute(acc, v, op);
          else if (!op || acc === null) acc = v;
          op = k === '=' ? null : k;
          entry = fmt(acc);
          fresh = true;
        }
        render();
      });
      render();
      return win;
    });
  }

  // ——— Paint ———

  function paint() {
    return single('paint', () => {
      const win = open({
        title: 'Sans titre - Paint',
        icon: ICON16.paint,
        w: 420,
        h: 330,
        menu: ['&Fichier', '&Edition', '&Affichage', '&Image', '&Options', '&?'],
        className: 'w9x-paint',
        status: 'Pour obtenir de l’aide, cliquez sur Rubriques d’aide dans le menu ?.',
        body: `<div class="w9x-paint-body">
            <div class="w9x-paint-tools"><button type="button" class="is-on" data-tool="pencil" aria-label="Crayon">✎</button><button type="button" data-tool="brush" aria-label="Pinceau">●</button><button type="button" data-tool="eraser" aria-label="Gomme">▭</button><button type="button" data-tool="clear" aria-label="Effacer tout">✕</button></div>
            <div class="w9x-paint-canvas"><canvas width="320" height="200"></canvas></div>
          </div>
          <div class="w9x-paint-palette"><span class="w9x-paint-current"><i></i><b></b></span>${PALETTE.map((c) => `<button type="button" style="background:${c}" data-c="${c}" aria-label="Couleur ${c}"></button>`).join('')}</div>`,
      });
      const canvas = win.body.querySelector('canvas');
      const g = canvas.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, canvas.width, canvas.height);
      let color = '#000000';
      let back = '#ffffff';
      let tool = 'pencil';
      const current = win.body.querySelector('.w9x-paint-current');
      const showColors = () => {
        current.querySelector('i').style.background = color;
        current.querySelector('b').style.background = back;
      };
      showColors();
      win.body.querySelector('.w9x-paint-palette').addEventListener('pointerdown', (event) => {
        const c = event.target.dataset?.c;
        if (!c) return;
        if (event.button === 2) back = c;
        else color = c;
        showColors();
      });
      win.body.querySelector('.w9x-paint-tools').addEventListener('click', (event) => {
        const t = event.target.closest('button')?.dataset.tool;
        if (!t) return;
        if (t === 'clear') {
          g.fillStyle = back;
          g.fillRect(0, 0, canvas.width, canvas.height);
          return;
        }
        tool = t;
        win.body.querySelectorAll('.w9x-paint-tools button').forEach((b) => b.classList.toggle('is-on', b.dataset.tool === t));
      });
      const at = (event) => {
        const rect = canvas.getBoundingClientRect();
        return [Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width), Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)];
      };
      let last = null;
      const dot = (x, y) => {
        const size = tool === 'pencil' ? 1 : tool === 'brush' ? 4 : 10;
        g.fillStyle = tool === 'eraser' ? back : color;
        g.fillRect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size);
      };
      const line = ([x0, y0], [x1, y1]) => {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let i = 0; i <= n; i++) dot(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n));
      };
      canvas.style.touchAction = 'none';
      canvas.addEventListener('pointerdown', (event) => {
        canvas.setPointerCapture(event.pointerId);
        last = at(event);
        dot(...last);
      });
      canvas.addEventListener('pointermove', (event) => {
        if (!last) return;
        const p = at(event);
        line(last, p);
        last = p;
      });
      const end = () => {
        last = null;
      };
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);
      canvas.addEventListener('contextmenu', (event) => event.preventDefault());
      return win;
    });
  }

  // ——— Défragmenteur de disque ———

  function defrag() {
    return single('defrag', () => {
      const COLS = 34;
      const ROWS = 12;
      const win = open({
        title: 'Défragmentation du lecteur C',
        icon: ICON16.defrag,
        w: 420,
        h: 'auto',
        controls: { max: false },
        className: 'w9x-defrag',
        body: `<div class="w9x-defrag-body">
          <div class="w9x-defrag-grid" style="--cols:${COLS}"></div>
          <div class="w9x-defrag-bottom">
            <div><div class="w9x-meter"><i></i></div><p class="w9x-defrag-pct">0 % effectué</p></div>
            <div class="w9x-defrag-btns"><button type="button" class="wm-push" data-act="stop">Arrêter</button><button type="button" class="wm-push" data-act="pause">Pause</button><button type="button" class="wm-push" data-act="legend">Légende</button></div>
          </div>
        </div>`,
      });
      const grid = win.body.querySelector('.w9x-defrag-grid');
      const cells = [];
      for (let i = 0; i < COLS * ROWS; i++) {
        const used = Math.random() < (i < COLS * 4 ? 0.82 : i < COLS * 9 ? 0.45 : 0.18);
        const c = document.createElement('i');
        c.className = used ? 'is-used' : '';
        grid.append(c);
        cells.push(used ? 'used' : 'free');
      }
      const total = cells.filter((c) => c === 'used').length;
      let done = 0;
      let paused = false;
      const bar = win.body.querySelector('.w9x-meter i');
      const pct = win.body.querySelector('.w9x-defrag-pct');
      const set = (i, state) => {
        cells[i] = state;
        grid.children[i].className = state === 'free' ? '' : `is-${state}`;
      };
      // Le premier bloc libre reçoit le dernier bloc utilisé.
      let cursor = 0;
      const step = () => {
        if (paused || win.closed) return;
        while (cursor < cells.length && cells[cursor] === 'done') cursor += 1;
        while (cursor < cells.length && cells[cursor] === 'used') {
          set(cursor, 'done');
          done += 1;
          cursor += 1;
        }
        const last = cells.lastIndexOf('used');
        if (last < cursor || last < 0) {
          for (let i = cursor; i < cells.length; i++) if (cells[i] === 'used') set(i, 'done');
          bar.style.width = '100%';
          pct.textContent = 'Défragmentation terminée.';
          ctx.clear(timer);
          opts.tower?.disk(0.2);
          return;
        }
        set(last, 'read');
        set(cursor, 'write');
        setTimeout(() => {
          if (win.closed) return;
          set(last, 'free');
          set(cursor, 'done');
          done += 1;
          cursor += 1;
          const p = Math.round((done / total) * 100);
          bar.style.width = `${p}%`;
          pct.textContent = `${p} % effectué`;
        }, 70);
        opts.tower?.disk(0.25);
        if (Math.random() < 0.3) audio.hdd(0.08);
      };
      const timer = ctx.interval(step, 110);
      win.on('close', () => ctx.clear(timer));
      win.body.querySelector('[data-act="stop"]').addEventListener('click', () => win.close());
      win.body.querySelector('[data-act="pause"]').addEventListener('click', (event) => {
        paused = !paused;
        event.target.textContent = paused ? 'Reprendre' : 'Pause';
      });
      win.body.querySelector('[data-act="legend"]').addEventListener('click', () =>
        shell.alert({ title: 'Légende', text: 'Bleu : données à leur place.\nVert : lecture.  Rouge : écriture.\nBlanc : espace libre.\n\nRanger les fichiers d’un seul tenant accélérait les vieux disques durs.', icon: 'info' }),
      );
      return win;
    });
  }

  // ——— Rechercher ———

  function find() {
    return single('find', () => {
      const win = open({
        title: 'Rechercher : Tous les fichiers',
        icon: ICON16.find,
        w: 420,
        h: 'auto',
        controls: { max: false },
        menu: ['&Fichier', '&Edition', '&Affichage', '&Options', '&?'],
        className: 'w9x-find',
        body: `<form class="w9x-find-body" novalidate>
          <div class="w9x-tabs"><span class="is-on">Nom &amp; emplacement</span><span>Date de modification</span><span>Avancée</span></div>
          <div class="w9x-find-page">
            <div class="w9x-tabpage">
              <label class="w9x-field-row"><span><u>N</u>ommé :</span><span class="w9x-input win9x-field"><input type="text" name="q" autocomplete="off" spellcheck="false" enterkeyhint="search"></span></label>
              <label class="w9x-field-row"><span><u>R</u>echercher dans :</span><span class="w9x-combo">(C:)</span></label>
            </div>
            <div class="w9x-find-btns"><button type="submit" class="wm-push is-default">Rechercher</button><button type="button" class="wm-push" data-act="new">Nouvelle recherche</button><span class="w9x-find-anim" aria-hidden="true">${ICON32.find}</span></div>
          </div>
          <ul class="w9x-find-results" hidden></ul>
          <p class="w9x-find-status"></p>
        </form>`,
      });
      const form = win.body.querySelector('form');
      const results = win.body.querySelector('.w9x-find-results');
      const status = win.body.querySelector('.w9x-find-status');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const q = form.elements.q.value.trim().toLowerCase();
        win.el.classList.add('is-searching');
        status.textContent = 'Recherche en cours…';
        opts.tower?.disk(1.4);
        audio.hdd(1.2);
        await ctx.wait(1300);
        win.el.classList.remove('is-searching');
        const found = SEARCHABLE.filter((f) => !q || f.toLowerCase().includes(q));
        results.hidden = false;
        results.innerHTML = found
          .map((f) => {
            const i = f.lastIndexOf('\\');
            return `<li><span>${ICON16.doc}${esc(f.slice(i + 1))}</span><span>${esc(f.slice(0, i))}</span></li>`;
          })
          .join('');
        status.textContent = `${found.length} fichier(s) trouvé(s)`;
      });
      win.body.querySelector('[data-act="new"]').addEventListener('click', () => {
        form.reset();
        results.hidden = true;
        status.textContent = '';
      });
      return win;
    });
  }

  // ——— Panneau de configuration ———

  function control() {
    return folderWindow('control', {
      title: 'Panneau de configuration',
      icon: ICON16.control,
      w: 400,
      h: 250,
      items: [
        { label: 'Affichage', svg: ICONS.control, open: () => display() },
        { label: 'Ajout de matériel', svg: ICON32.scanner, open: () => shell.alert({ title: 'Ajout de nouveau matériel', text: 'Windows va rechercher le nouveau matériel.\n\nRésultat : rien de neuf sous le soleil de ' + year + '.', icon: 'info' }) },
        { label: 'Date/Heure', svg: ICONS.clock, open: () => shell.alert({ title: 'Propriétés de Date/Heure', text: `Date du système : ${opts.date ?? year}\n\nModifier la date ? Surtout pas : le voyage temporel s’en charge.`, icon: 'info' }) },
        { label: 'Imprimantes', svg: ICON32.printer, open: () => printers() },
        { label: 'Modems', svg: ICONS.dialup, open: () => shell.alert({ title: 'Propriétés de Modems', text: is98 ? 'Modem standard 56 000 bit/s sur COM2.\nPrêt à composer !' : 'Aucun modem n’est installé.\nInternet ? Patience, ce sera pour la prochaine époque.', icon: 'info' }) },
        { label: 'Souris', svg: ICONS.control, open: () => shell.alert({ title: 'Propriétés de Souris', text: 'Vitesse du double-clic : moyenne.\nBouton droit : il ouvre désormais des menus contextuels. Essayez sur le bureau !', icon: 'info' }) },
        { label: 'Système', svg: ICONS.computer, open: () => system() },
        { label: 'Barre des tâches', svg: ICON32.programs, open: () => taskbarProps() },
      ],
    });
  }

  function system() {
    shell.dialog({
      title: 'Propriétés Système',
      width: 320,
      buttons: ['OK'],
      body: `<div class="w9x-sysinfo">${ICONS.computer}<div>
        <p><b>Système :</b><br>Windows ${is98 ? '98<br>4.10.1998' : '95<br>4.00.950'}</p>
        <p><b>Ordinateur :</b><br>${is98 ? 'Processeur à 266 MHz<br>32,0 Mo de RAM' : 'Pentium à 75 MHz<br>8,0 Mo de RAM'}</p>
        <p><b>Enregistré à :</b><br>Voyageur du temps</p>
      </div></div>`,
    });
  }

  // ——— Affichage : fonds d'écran ———

  const WALLPAPERS = [
    ['(Aucun)', ''],
    ['Briques', 'wp-bricks'],
    ['Carreaux', 'wp-checks'],
    ['Losanges', 'wp-diamonds'],
    ['Nuages', 'wp-clouds'],
    ['Tissage', 'wp-weave'],
  ];
  let wallpaper = '';

  function display() {
    if (apps.get('display') && !apps.get('display').closed) return apps.get('display').restore();
    let choice = wallpaper;
    const dlg = shell.dialog({
      title: 'Propriétés de Affichage',
      width: 340,
      buttons: ['OK', 'Annuler', 'A&ppliquer'],
      cancelButton: 1,
      className: 'w9x-display',
      body: `
        <div class="w9x-tabs"><span class="is-on">Arrière-plan</span><span>Écran de veille</span><span>Apparence</span><span>Paramètres</span></div>
        <div class="w9x-tabpage">
          <div class="w9x-monitor"><div class="w9x-monitor-screen"><i class="w9x-preview"></i></div><span class="w9x-monitor-base"></span></div>
          <div class="w9x-display-lists">
            <div><p><u>P</u>apier peint :</p><ul class="w9x-listbox" role="listbox">${WALLPAPERS.map(([label, cls]) => `<li role="option" data-wp="${cls}" tabindex="-1">${esc(label)}</li>`).join('')}</ul></div>
            <div><p>Affichage :</p><label><input type="radio" name="tile" checked> Mosaïque</label><label><input type="radio" name="tile"> Centré</label></div>
          </div>
        </div>`,
      onReady: (win) => {
        const preview = win.body.querySelector('.w9x-preview');
        const items = [...win.body.querySelectorAll('[data-wp]')];
        const pick = (cls) => {
          choice = cls;
          items.forEach((li) => li.classList.toggle('is-sel', li.dataset.wp === cls));
          preview.className = `w9x-preview ${cls}`;
        };
        items.forEach((li) => li.addEventListener('click', () => pick(li.dataset.wp)));
        pick(wallpaper);
      },
      onButton: (button) => {
        if (button === 'Appliquer') {
          apply(choice);
          return false;
        }
        return true;
      },
    });
    apps.set('display', dlg.win);
    dlg.result.then(({ button }) => button === 'OK' && apply(choice));
    const apply = (cls) => {
      wallpaper = cls;
      const el = shell.desk.el;
      WALLPAPERS.forEach(([, c]) => c && el.classList.remove(c));
      if (cls) el.classList.add(cls);
    };
  }

  // ——— Barre des tâches : petites icônes, horloge ———

  const taskbarPrefs = { small: false, clock: true };
  function taskbarProps() {
    shell.dialog({
      title: 'Propriétés de Barre des tâches',
      width: 330,
      buttons: ['OK', 'Annuler'],
      body: `
        <div class="w9x-tabs"><span class="is-on">Options de la barre des tâches</span><span>Programmes du menu Démarrer</span></div>
        <div class="w9x-tabpage">
          <div class="w9x-tb-preview"><span class="w9x-tb-win"></span><span class="w9x-tb-bar"><b>Démarrer</b><i></i><em>12:00</em></span></div>
          <label class="w9x-check"><input type="checkbox" checked disabled> <span>T<u>o</u>ujours visible</span></label>
          <label class="w9x-check"><input type="checkbox" disabled> <span><u>M</u>asquer automatiquement</span></label>
          <label class="w9x-check"><input type="checkbox" name="small" ${taskbarPrefs.small ? 'checked' : ''}> <span>Afficher de <u>p</u>etites icônes dans le menu Démarrer</span></label>
          <label class="w9x-check"><input type="checkbox" name="clock" ${taskbarPrefs.clock ? 'checked' : ''}> <span>Afficher l’<u>h</u>orloge</span></label>
        </div>`,
    }).result.then(({ button, form }) => {
      if (button !== 'OK') return;
      taskbarPrefs.small = form.elements.small.checked;
      taskbarPrefs.clock = form.elements.clock.checked;
      shell.el.classList.toggle('no-clock', !taskbarPrefs.clock);
    });
  }

  // ——— Multimédia ———

  function cdPlayer() {
    return single('cdplayer', () =>
      open({
        title: 'Lecteur CD',
        icon: ICON16.cdrom,
        w: 260,
        h: 'auto',
        controls: { max: false },
        className: 'w9x-cdplayer',
        body: `<div class="w9x-cd-body"><div class="w9x-cd-lcd">[00] 00:00</div><div class="w9x-cd-btns"><button type="button">▶</button><button type="button">❚❚</button><button type="button">■</button><button type="button">⏏</button></div></div><p class="w9x-cd-status">Insérez un disque compact audio dans le lecteur.</p>`,
      }),
    );
  }

  function volume() {
    return single('volume', () =>
      open({
        title: 'Contrôle du volume',
        icon: ICON16.speaker,
        w: 290,
        h: 'auto',
        controls: { max: false },
        className: 'w9x-volume',
        body: `<div class="w9x-mixer">${['Volume', 'Wave', 'MIDI', 'CD audio'].map((label) => `<div class="w9x-mixer-col"><b>${label}</b><span class="w9x-slider"><i></i></span><label class="w9x-check"><input type="checkbox"> <span>Muet</span></label></div>`).join('')}</div>`,
      }),
    );
  }

  // ——— Menu Démarrer ———

  function programs(extra = []) {
    return [
      {
        label: 'Accessoires',
        icon: ICON16.folder,
        sub: () => [
          {
            label: 'Jeux',
            icon: ICON16.folder,
            sub: [{ label: 'Démineur', icon: ICON16.mine, run: minesweeper }],
          },
          {
            label: 'Multimédia',
            icon: ICON16.folder,
            sub: [
              { label: 'Contrôle du volume', icon: ICON16.speaker, run: volume },
              { label: 'Lecteur CD', icon: ICON16.cdrom, run: cdPlayer },
            ],
          },
          {
            label: 'Outils système',
            icon: ICON16.folder,
            sub: [
              { label: 'Défragmenteur de disque', icon: ICON16.defrag, run: defrag },
              { label: 'ScanDisk', icon: ICON16.scandisk, run: () => opts.onScandisk?.() },
            ],
          },
          { label: 'Bloc-notes', icon: ICON16.notepad, run: () => notepad() },
          { label: 'Calculatrice', icon: ICON16.calc, run: calc },
          { label: 'Paint', icon: ICON16.paint, run: paint },
          { label: 'WordPad', icon: ICON16.wordpad, run: () => notepad('Document', '', { wordpad: true }) },
        ],
      },
      { label: 'Démarrage', icon: ICON16.folder, sub: [] },
      ...extra,
      { label: 'Explorateur Windows', icon: ICON16.explorer, run: computer },
      { label: 'Invite MS-DOS', icon: ICON16.msdos, run: msdos },
    ];
  }

  function documents() {
    return [
      { label: 'Liste de courses.txt', icon: ICON16.doc, run: () => notepad('Liste de courses', opts.shopping ?? '') },
      { label: 'Lisezmoi.txt', icon: ICON16.notepad, run: () => notepad('Lisezmoi', opts.readme ?? '') },
      { label: 'Voyage dans le temps.doc', icon: ICON16.wordpad, run: () => notepad('Voyage dans le temps', opts.journal ?? '', { wordpad: true }) },
    ];
  }

  function settings(extra = []) {
    return [
      { label: '&Panneau de configuration', icon: ICON16.control, run: control },
      { label: '&Imprimantes', icon: ICON16.printer, run: printers },
      { label: '&Barre des tâches…', icon: ICON16.taskbar, run: taskbarProps },
      ...extra,
    ];
  }

  function findMenu(extra = []) {
    return [
      { label: '&Fichiers ou dossiers…', icon: ICON16.find, run: find },
      { label: '&Ordinateur…', icon: ICON16.findpc, run: () => shell.alert({ title: 'Rechercher : Ordinateur', text: 'Recherche sur le réseau…\n\nAucun ordinateur trouvé : celui-ci est seul au monde.', icon: 'info' }) },
      ...extra,
    ];
  }

  return {
    notepad,
    help,
    run,
    runCommand,
    computer,
    recycle,
    network,
    myDocuments,
    msdos,
    minesweeper,
    calc,
    paint,
    defrag,
    find,
    control,
    display,
    taskbarProps,
    get smallIcons() {
      return taskbarPrefs.small;
    },
    programs,
    documents,
    settings,
    findMenu,
    get(key) {
      return apps.get(key);
    },
  };
}
