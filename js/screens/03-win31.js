// Écran 3 — Windows 3.1 : la fenêtre du Gestionnaire de programmes cache la
// sortie. Il faut la déplacer (ou la réduire), puis double-cliquer sur SAUT.EXE.

import { createDesktop } from '../ui/windows.js';
import { createTerminal } from '../ui/terminal.js';
import { ICONS } from '../ui/icons.js';
import { ARROW, HOURGLASS, svgCursor } from '../ui/pixel.js';
import { createMinesweeper } from './win31/minesweeper.js';
import { createSolitaire } from './win31/solitaire.js';

const README = `Bienvenue dans Windows 3.1 !

Les fenêtres se superposent comme des feuilles posées sur un bureau : la dernière ouverte passe au-dessus des autres.

Pour voir ce qui se cache dessous, déplacez une fenêtre en la tirant par sa barre de titre, ou réduisez-la avec le bouton en forme de flèche vers le bas.

Pour lancer un programme, double-cliquez sur son icône.`;

const NOTEPAD = `Liste de courses
- disquettes 3½ (x10)
- tapis de souris
- ne pas oublier : la sortie est derrière la grande fenêtre !`;

export default {
  id: 'win31',
  era: 'Windows 3.1',
  year: 1992,

  decor(props) {
    const note = document.createElement('div');
    note.className = 'postit postit-win31';
    note.innerHTML = '<span>La sortie est derrière.</span>';
    props.bezel.append(note);
  },

  mount(root, ctx) {
    const { audio } = ctx;
    root.classList.add('w31');
    const arrow = svgCursor(ARROW, 0, 0, 'default');
    const hourglass = svgCursor(HOURGLASS, 6, 11, 'wait');
    root.style.setProperty('--cursor', arrow);
    root.style.setProperty('--cursor-busy', hourglass);

    let desk = null;
    let progman = null;
    let groups = null;
    let saut = null;
    let launching = false;
    let revealed = false;
    let lonelyClicks = 0;
    const apps = new Map();
    const cleanups = [];

    const busy = (on) => root.classList.toggle('is-busy', on);

    // ——— Démarrage ———

    async function boot() {
      root.innerHTML = '<div class="w31-boot"><span class="w31-cursor">_</span></div>';
      busy(true);
      audio.hdd(1.1);
      const skip = { skippable: true };
      await ctx.wait(700, skip);
      root.innerHTML = `
        <div class="w31-splash">
          <div class="w31-splash-inner">
            <p class="w31-splash-small">Microsoft</p>
            <p class="w31-splash-big">Windows</p>
            <p class="w31-splash-version">version 3.1</p>
            <div class="w31-splash-bar"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <p class="w31-splash-copy">Copyright © 1985-1992 Microsoft Corp. · recréation pédagogique</p>
          </div>
        </div>`;
      await ctx.wait(1700, skip);
      buildDesktop();
      audio.chime('win31');
      await ctx.wait(500);
      busy(false);
    }

    // ——— Bureau ———

    function buildDesktop() {
      root.innerHTML = '<div class="w31-desktop"></div>';
      const deskEl = root.querySelector('.w31-desktop');
      desk = createDesktop(deskEl, { theme: 'win31', drag: 'outline' });

      saut = desk.icon({
        label: 'SAUT.EXE',
        svg: ICONS.portal,
        x: 60,
        y: 96,
        className: 'w31-saut',
        onOpen: () => launch(),
      });
      saut.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'touch' || launching) return;
        // Un simple clic sélectionne seulement : il faut un double-clic.
        clearTimeout(saut.lonely);
        saut.lonely = setTimeout(() => {
          lonelyClicks += 1;
          if (lonelyClicks >= 2) ctx.error();
        }, 520);
      });
      saut.addEventListener('dblclick', () => clearTimeout(saut.lonely));

      progman = desk.open({
        id: 'progman',
        title: 'Gestionnaire de programmes',
        x: 10,
        y: 8,
        w: 620,
        h: 424,
        menu: ['&Fichier', '&Options', 'Fe&nêtre', '&?'],
        iconSvg: ICONS.group,
        iconLabel: 'Gestionnaire de programmes',
        className: 'w31-progman',
        onClose: () => {
          confirmQuit();
          return false;
        },
      });
      for (const type of ['move', 'minimize', 'maximize', 'restore']) progman.on(type, checkReveal);
      progman.on('move', () => ctx.progress());

      buildGroups();
      checkReveal();
    }

    function buildGroups() {
      const host = document.createElement('div');
      host.className = 'w31-mdi';
      progman.body.append(host);
      groups = createDesktop(host, { theme: 'win31', drag: 'outline', iconify: true });

      const principal = groups.open({
        id: 'principal',
        title: 'Principal',
        x: 8,
        y: 8,
        w: 352,
        h: 196,
        iconSvg: ICONS.group,
        body: '<div class="w31-items"></div>',
      });
      const items = principal.body.querySelector('.w31-items');
      const add = (parent, label, svg, run) => {
        const icon = groups.icon({ label, svg, x: 0, y: 0, parent, onOpen: run });
        icon.style.position = 'relative';
        icon.style.left = '';
        icon.style.top = '';
        return icon;
      };
      add(items, 'Gestionnaire de fichiers', ICONS.files, () => openFileManager());
      add(items, 'Panneau de configuration', ICONS.control, () => openControlPanel());
      add(items, 'Invite MS-DOS', ICONS.msdos, () => openDosPrompt());
      add(items, 'Lisez-moi', ICONS.readme, () => openText('LISEZMOI.TXT - Bloc-notes', README, 'readme'));

      const group = (title, list) => {
        const win = groups.open({
          id: title,
          title,
          x: 380,
          y: 20,
          w: 214,
          h: 150,
          iconSvg: ICONS.group,
          body: '<div class="w31-items"></div>',
          inactive: true,
        });
        list.forEach(([label, svg, run]) => add(win.body.querySelector('.w31-items'), label, svg, run));
        win.minimize();
        return win;
      };
      group('Accessoires', [
        ['Bloc-notes', ICONS.notepad, () => openText('(Sans titre) - Bloc-notes', NOTEPAD, 'notepad')],
        ['Horloge', ICONS.clock, () => openClock()],
        ['Calculatrice', ICONS.calc, () => openCalculator()],
      ]);
      group('Jeux', [
        ['Solitaire', ICONS.cards, () => openSolitaire()],
        ['Démineur', ICONS.mine, () => openMinesweeper()],
      ]);
      group('Démarrage', []);
      principal.focus();
    }

    // La sortie apparaît-elle ? Tant qu'elle est cachée, elle n'est pas atteignable,
    // même au clavier : il faut d'abord déplacer la fenêtre (flèches sur la barre de titre).
    function checkReveal() {
      if (!saut || !progman) return;
      const cx = 96;
      const cy = 118;
      const covered =
        !progman.minimized &&
        cx > progman.x &&
        cx < progman.x + progman.w &&
        cy > progman.y &&
        cy < progman.y + progman.el.offsetHeight;
      saut.inert = covered;
      if (!covered && !revealed) {
        revealed = true;
        ctx.progress();
      }
    }

    async function confirmQuit() {
      const answer = await desk.alert({
        title: 'Gestionnaire de programmes',
        text: 'Cette opération va mettre fin à votre session Windows.',
        icon: 'warning',
        buttons: ['OK', 'Annuler'],
      });
      if (answer === 'OK') {
        busy(true);
        root.innerHTML = '<div class="w31-boot"><span>C:\\WINDOWS&gt;</span><span class="w31-cursor">_</span></div>';
        await ctx.wait(1400);
        boot().catch(() => {});
      }
    }

    // ——— Lancer SAUT.EXE ———

    async function launch() {
      if (launching) return;
      launching = true;
      clearTimeout(saut.lonely);
      busy(true);
      audio.hdd(0.8);
      ctx.note('SAUT.EXE', { key: 'win31-saut', label: 'Lancé d’un double-clic' });
      await ctx.wait(700);
      const win = desk.open({
        title: 'SAUT.EXE',
        w: 300,
        h: 'auto',
        center: true,
        controls: { min: false, max: false },
        body: `<div class="w31-progress">
          <p>Calcul de la trajectoire temporelle…</p>
          <div class="w31-bar"><i></i><span>0 %</span></div>
          <p class="w31-dest">Destination : 1995</p>
        </div>`,
      });
      const bar = win.body.querySelector('.w31-bar i');
      const pct = win.body.querySelector('.w31-bar span');
      for (let p = 0; p <= 100; p += 4) {
        bar.style.width = `${p}%`;
        pct.textContent = `${p} %`;
        await ctx.wait(45);
      }
      await ctx.wait(400);
      ctx.complete();
    }

    // ——— Accessoires ———

    function single(key, create) {
      const existing = apps.get(key);
      if (existing && !existing.closed) {
        existing.restore();
        return existing;
      }
      busy(true);
      const win = create();
      apps.set(key, win);
      setTimeout(() => busy(false), 250);
      return win;
    }

    function openText(title, text, key) {
      single(key, () => {
        const win = desk.open({
          title,
          x: 90 + Math.random() * 60,
          y: 60 + Math.random() * 40,
          w: 360,
          h: 240,
          menu: ['&Fichier', '&Edition', '&Recherche', '&?'],
          iconSvg: ICONS.notepad,
          body: '<textarea class="w31-textarea" spellcheck="false"></textarea>',
        });
        win.body.querySelector('textarea').value = text;
        return win;
      });
    }

    function openClock() {
      single('clock', () => {
        const win = desk.open({
          title: 'Horloge - 12/03/92',
          x: 420,
          y: 40,
          w: 170,
          h: 190,
          iconSvg: ICONS.clock,
          body: `<svg class="w31-clock" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="#fff" stroke="#000" stroke-width="2"/>
              ${Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return `<rect x="${48 + Math.cos(a) * 40}" y="${48 + Math.sin(a) * 40}" width="4" height="4" fill="${i % 3 ? '#008080' : '#000080'}"/>`;
              }).join('')}
              <line class="h" x1="50" y1="50" x2="50" y2="26" stroke="#000" stroke-width="5"/>
              <line class="m" x1="50" y1="50" x2="50" y2="14" stroke="#000" stroke-width="3"/>
              <line class="s" x1="50" y1="56" x2="50" y2="12" stroke="#808080" stroke-width="1.5"/>
            </svg>`,
        });
        const svg = win.body.querySelector('svg');
        const tick = () => {
          const now = new Date();
          const s = now.getSeconds();
          const m = now.getMinutes() + s / 60;
          const h = (now.getHours() % 12) + m / 60;
          svg.querySelector('.h').setAttribute('transform', `rotate(${h * 30} 50 50)`);
          svg.querySelector('.m').setAttribute('transform', `rotate(${m * 6} 50 50)`);
          svg.querySelector('.s').setAttribute('transform', `rotate(${s * 6} 50 50)`);
        };
        tick();
        const timer = ctx.interval(tick, 1000);
        win.on('close', () => ctx.clear(timer));
        return win;
      });
    }

    function openCalculator() {
      single('calc', () => {
        const keys = ['C', '±', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', ''];
        const win = desk.open({
          title: 'Calculatrice',
          x: 200,
          y: 110,
          w: 196,
          h: 236,
          controls: { max: false },
          iconSvg: ICONS.calc,
          menu: ['&Edition', '&Affichage', '&?'],
          body: `<div class="w31-calc"><output>0.</output><div class="w31-calc-keys">${keys
            .map((k) => (k ? `<button type="button" data-k="${k}">${k}</button>` : '<span></span>'))
            .join('')}</div></div>`,
        });
        const out = win.body.querySelector('output');
        let acc = null;
        let op = null;
        let entry = '0';
        let fresh = true;
        const render = () => {
          out.textContent = entry.includes('.') ? entry : `${entry}.`;
        };
        const compute = (a, b, o) => ({ '+': a + b, '-': a - b, '*': a * b, '/': b === 0 ? NaN : a / b })[o] ?? b;
        win.body.querySelector('.w31-calc-keys').addEventListener('click', (event) => {
          const k = event.target.closest('button')?.dataset.k;
          if (!k) return;
          audio.click();
          if (/\d/.test(k)) {
            entry = fresh || entry === '0' ? k : entry + k;
            fresh = false;
          } else if (k === '.') {
            if (fresh) entry = '0';
            if (!entry.includes('.')) entry += '.';
            fresh = false;
          } else if (k === 'C') {
            acc = null;
            op = null;
            entry = '0';
            fresh = true;
          } else if (k === '±') {
            entry = String(-Number(entry));
          } else if (k === '%') {
            entry = String(Number(entry) / 100);
          } else {
            const value = Number(entry);
            if (op && !fresh) acc = compute(acc, value, op);
            else if (!op) acc = value;
            op = k === '=' ? null : k;
            entry = Number.isFinite(acc) ? String(Number(acc.toPrecision(12))) : 'Erreur';
            fresh = true;
          }
          render();
        });
        render();
        return win;
      });
    }

    function openMinesweeper() {
      single('mines', () => {
        const win = desk.open({
          title: 'Démineur',
          x: 230,
          y: 60,
          w: 178,
          h: 258,
          controls: { max: false },
          iconSvg: ICONS.mine,
          menu: ['&Partie', '&?'],
          body: '<div class="w31-mines-host"></div>',
        });
        const game = createMinesweeper(win.body.querySelector('.w31-mines-host'), { audio, signal: ctx.signal });
        win.on('close', () => game.destroy());
        return win;
      });
    }

    function openSolitaire() {
      single('solitaire', () => {
        const win = desk.open({
          title: 'Solitaire',
          x: 80,
          y: 30,
          w: 438,
          h: 410,
          controls: { max: false },
          iconSvg: ICONS.cards,
          menu: ['&Partie', '&?'],
          body: '<div class="w31-sol-host"></div>',
        });
        const game = createSolitaire(win.body.querySelector('.w31-sol-host'), { audio });
        win.on('close', () => game.destroy());
        return win;
      });
    }

    function openFileManager() {
      single('files', () => {
        const files = [
          ['SYSTEM', true],
          ['PROGMAN.EXE'],
          ['SAUT.EXE'],
          ['WIN.COM'],
          ['WIN.INI'],
          ['LISEZMOI.TXT'],
        ];
        const win = desk.open({
          title: 'Gestionnaire de fichiers',
          x: 40,
          y: 30,
          w: 440,
          h: 300,
          iconSvg: ICONS.files,
          menu: ['&Fichier', '&Disque', '&Arborescence', '&Affichage', '&?'],
          body: `<div class="w31-fm">
            <div class="w31-fm-drives"><span>▭ a</span><span>▭ b</span><span class="on">▭ c</span><span class="w31-fm-label">C: [DISQUE_DUR]</span></div>
            <div class="w31-fm-panes">
              <ul class="w31-fm-tree"><li>📁 c:\\</li><li class="i">📁 dos</li><li class="i">📁 jeux</li><li class="i on">📂 windows</li></ul>
              <ul class="w31-fm-list">${files
                .map(([name, dir]) => `<li><button type="button" data-file="${name}">${dir ? '📁' : name.endsWith('.TXT') || name.endsWith('.INI') ? '📄' : '▣'} ${name.toLowerCase()}</button></li>`)
                .join('')}</ul>
            </div>
            <div class="w31-fm-status">C: 85 600 Ko libres, 120 000 Ko au total · Total 6 fichier(s)</div>
          </div>`,
        });
        win.body.querySelectorAll('[data-file]').forEach((btn) => {
          btn.addEventListener('pointerdown', () => {
            win.body.querySelectorAll('[data-file].on').forEach((b) => b.classList.remove('on'));
            btn.classList.add('on');
          });
          const run = () => {
            const name = btn.dataset.file;
            if (name === 'SAUT.EXE') launch();
            else if (name === 'LISEZMOI.TXT') openText('LISEZMOI.TXT - Bloc-notes', README, 'readme');
            else if (name === 'WIN.COM') desk.alert({ title: 'Gestionnaire de fichiers', text: 'Windows est déjà lancé !', icon: 'info' });
            else if (name === 'PROGMAN.EXE') progman.restore();
          };
          btn.addEventListener('dblclick', run);
          btn.addEventListener('keydown', (event) => event.key === 'Enter' && run());
        });
        return win;
      });
    }

    function openControlPanel() {
      single('control', () => {
        const items = ['Couleurs', 'Polices', 'Ports', 'Souris', 'Bureau', 'Clavier', 'Imprimantes', 'Date/Heure', 'Son'];
        const win = desk.open({
          title: 'Panneau de configuration',
          x: 120,
          y: 70,
          w: 380,
          h: 220,
          iconSvg: ICONS.control,
          menu: ['&Paramètres', '&?'],
          body: '<div class="w31-items w31-cp"></div>',
        });
        const host = win.body.querySelector('.w31-cp');
        items.forEach((label) => {
          const icon = desk.icon({
            label,
            svg: label === 'Souris' ? ICONS.control : label === 'Date/Heure' ? ICONS.clock : ICONS.group,
            x: 0,
            y: 0,
            parent: host,
            onOpen: () =>
              desk.alert({
                title: label,
                icon: 'info',
                text:
                  label === 'Souris'
                    ? 'Vitesse du double-clic : moyenne.\nUn double-clic, ce sont deux clics rapides au même endroit.'
                    : `Le réglage « ${label} » est verrouillé : le voyage temporel ne tolère aucune modification.`,
              }),
          });
          icon.style.position = 'relative';
          icon.style.left = '';
          icon.style.top = '';
        });
        return win;
      });
    }

    function openDosPrompt() {
      single('dos', () => {
        const win = desk.open({
          title: 'Invite MS-DOS',
          x: 70,
          y: 50,
          w: 420,
          h: 260,
          iconSvg: ICONS.msdos,
          className: 'w31-dosbox',
          body: '<div class="w31-dos dos"></div>',
        });
        const term = createTerminal(win.body.querySelector('.w31-dos'), {
          prompt: 'C:\\WINDOWS>',
          caseSensitive: false,
          cursor: 'underline',
          label: 'Invite MS-DOS',
          onKey: () => audio.key(),
          commands: {
            exit: () => {
              setTimeout(() => win.close(), 80);
              return null;
            },
            win: () => 'Windows est déjà lancé. Tapez EXIT pour y revenir.',
            ver: () => '\nMS-DOS version 6.22\n',
            cls: (args, t) => {
              t.clear();
              return null;
            },
            dir: () => ' Répertoire de C:\\WINDOWS\n\nSYSTEM       <REP>\nWIN      COM\nPROGMAN  EXE\nSAUT     EXE\n',
            saut: () => 'Ce programme nécessite Microsoft Windows.',
            'saut.exe': () => 'Ce programme nécessite Microsoft Windows.',
          },
          unknown: () => 'Commande ou nom de fichier incorrect',
        });
        term.print('Tapez EXIT pour revenir à Windows.\n');
        win.on('close', () => term.destroy());
        win.on('focus', () => term.focus());
        setTimeout(() => term.focus(), 50);
        cleanups.push(() => term.destroy());
        return win;
      });
    }

    boot().catch(() => {});

    return () => {
      cleanups.forEach((fn) => fn());
      desk?.destroy();
      groups?.destroy();
    };
  },
};
