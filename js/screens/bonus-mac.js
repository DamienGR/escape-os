// Salle annexe — Macintosh (1984), accessible par la commande cachée ANNEXE sous DOS.
// Bizarrerie célèbre : pour éjecter la disquette, on la glisse… dans la poubelle.

import { pixelArt, svgCursor } from '../ui/pixel.js';
import { drag } from '../ui/gestures.js';

const BW = { K: '#000', W: '#fff' };
const icon = (draw) => pixelArt(32, draw, { palette: BW });

const ICONS = {
  disk: icon((p) => {
    p.rect(4, 3, 24, 26, 'K');
    p.rect(5, 4, 22, 24, 'W');
    p.rect(9, 4, 14, 9, 'K');
    p.rect(10, 4, 12, 8, 'W');
    p.rect(17, 5, 3, 6, 'K');
    p.rect(8, 16, 16, 12, 'K');
    p.rect(9, 17, 14, 11, 'W');
    p.hline(10, 19, 12, 'K');
    p.hline(10, 22, 12, 'K');
    p.hline(10, 25, 9, 'K');
    p.px(5, 4, 'K');
  }),
  trash: icon((p) => {
    p.rect(13, 2, 6, 3, 'K');
    p.rect(14, 3, 4, 1, 'W');
    p.rect(6, 5, 20, 3, 'K');
    p.rect(7, 6, 18, 1, 'W');
    p.rect(8, 8, 16, 21, 'K');
    p.rect(9, 9, 14, 19, 'W');
    for (const x of [12, 16, 20]) p.vline(x, 10, 16, 'K');
  }),
  folder: icon((p) => {
    p.rect(3, 8, 11, 3, 'K');
    p.rect(4, 9, 9, 2, 'W');
    p.rect(3, 10, 26, 18, 'K');
    p.rect(4, 11, 24, 16, 'W');
    p.hline(4, 13, 24, 'K');
  }),
  doc: icon((p) => {
    p.rect(7, 3, 18, 26, 'K');
    p.rect(8, 4, 16, 24, 'W');
    p.rect(19, 3, 6, 6, 'W');
    p.line(19, 3, 24, 8, 'K');
    p.vline(19, 3, 6, 'K');
    p.hline(19, 8, 6, 'K');
    for (let y = 12; y < 26; y += 3) p.hline(10, y, 12, 'K');
  }),
  paint: icon((p) => {
    p.rect(5, 6, 22, 20, 'K');
    p.rect(6, 7, 20, 18, 'W');
    p.line(9, 21, 20, 10, 'K');
    p.line(10, 21, 21, 10, 'K');
    p.rect(21, 7, 3, 3, 'K');
    p.rect(8, 21, 3, 2, 'K');
  }),
  write: icon((p) => {
    p.rect(5, 6, 22, 20, 'K');
    p.rect(6, 7, 20, 18, 'W');
    p.text(9, 10, 'ABC', 'K');
    for (let y = 17; y < 24; y += 3) p.hline(9, y, 14, 'K');
  }),
  happy: pixelArt(40, (p) => {
    p.rect(6, 2, 28, 34, 'K');
    p.rect(7, 3, 26, 32, 'W');
    p.rect(11, 3, 18, 12, 'K');
    p.rect(12, 3, 16, 11, 'W');
    p.rect(22, 5, 4, 7, 'K');
    p.rect(14, 20, 2, 3, 'K');
    p.rect(24, 20, 2, 3, 'K');
    p.map(13, 26, ['K............K', '.KK........KK.', '...KKKKKKKK...']);
  }, { palette: BW }),
};

const ARROW = pixelArt([11, 17], (p) =>
  p.map(0, 0, [
    'W..........',
    'WW.........',
    'WKW........',
    'WKKW.......',
    'WKKKW......',
    'WKKKKW.....',
    'WKKKKKW....',
    'WKKKKKKW...',
    'WKKKKKKKW..',
    'WKKKKKKKKW.',
    'WKKKKKWWWWW',
    'WKKWKKW....',
    'WKW.WKKW...',
    'WW..WKKW...',
    'W....WKKW..',
    '.....WKKW..',
    '......WW...',
  ]),
  { palette: BW },
);

const LISEZMOI = `Bienvenue sur Macintosh !

Pour éjecter une disquette, faites-la glisser jusqu’à la Poubelle.

Non, elle ne sera pas effacée. Oui, c’est surprenant. Tout le monde se pose la question la première fois.`;

const MENUS = {
  '✱': ['À propos du Finder…', '—', 'Calculette', 'Album', 'Bloc-notes'],
  Fichier: ['Ouvrir', 'Dupliquer', 'Lire les informations', '—', 'Fermer', 'Imprimer'],
  Édition: ['Annuler', '—', 'Couper', 'Copier', 'Coller', 'Effacer'],
  Présentation: ['par Icône', 'par Nom', 'par Date', 'par Taille'],
  Spécial: ['Nettoyer', 'Vider la Poubelle', 'Effacer le disque'],
};

export default {
  id: 'mac',
  era: 'Macintosh',
  year: 1984,

  decor(props) {
    // La fente cache la disquette : elle n'apparaît qu'en sortant, vers le bas
    const slot = document.createElement('div');
    slot.className = 'mac-floppy-wrap';
    slot.innerHTML = '<div class="mac-floppy"><i class="mac-floppy-shutter"></i><i class="mac-floppy-label">Système</i></div>';
    props.bezel.append(slot);
  },

  mount(root, ctx) {
    const { audio } = ctx;
    root.classList.add('mac84');
    root.style.setProperty('--cursor', svgCursor(ARROW, 1, 1, 'default'));
    let ejected = false;
    let openMenu = null;
    let z = 10;

    async function boot() {
      root.innerHTML = '<div class="mac-boot"></div>';
      const skip = { skippable: true };
      audio.beep(880, 0.35);
      await ctx.wait(500, skip);
      root.querySelector('.mac-boot').innerHTML = `<div class="mac-happy">${ICONS.happy}</div>`;
      audio.floppy();
      await ctx.wait(1300, skip);
      root.querySelector('.mac-boot').innerHTML = '<div class="mac-welcome">Bienvenue sur Macintosh.</div>';
      await ctx.wait(1300, skip);
      buildDesktop();
    }

    // ——— Bureau ———

    function buildDesktop() {
      root.innerHTML = `
        <div class="mac-desk">
          <nav class="mac-menubar" aria-label="Barre des menus">
            ${Object.keys(MENUS)
              .map((name) => `<button type="button" class="mac-menu${name === '✱' ? ' mac-emblem' : ''}" data-menu="${name}">${name}</button>`)
              .join('')}
          </nav>
          <button type="button" class="mac-icon mac-disk" style="left:440px;top:30px" aria-label="Disquette : glisser sur la Poubelle (ou touche Suppr)">
            ${ICONS.disk}<span>Disquette</span>
          </button>
          <button type="button" class="mac-icon mac-trash" style="left:440px;top:280px" aria-label="Poubelle">
            ${ICONS.trash}<span>Poubelle</span>
          </button>
        </div>`;
      const desk = root.querySelector('.mac-desk');
      const disk = desk.querySelector('.mac-disk');
      const trash = desk.querySelector('.mac-trash');

      openDiskWindow();

      // Menus déroulants : on presse le titre, la liste descend
      desk.querySelector('.mac-menubar').addEventListener('pointerdown', (event) => {
        const btn = event.target.closest('[data-menu]');
        if (!btn) return;
        event.preventDefault();
        toggleMenu(btn);
      });
      desk.addEventListener('pointerdown', (event) => {
        if (!event.target.closest('.mac-menubar, .mac-dropdown')) closeMenu();
        if (event.target === desk) desk.querySelectorAll('.mac-icon.selected').forEach((el) => el.classList.remove('selected'));
      });

      const select = (el) => {
        desk.querySelectorAll('.mac-icon.selected').forEach((other) => other.classList.remove('selected'));
        el.classList.add('selected');
      };

      // Glisser la disquette : un contour pointillé suit le pointeur
      let ghost = null;
      let origin = null;
      const overTrash = (x, y) => x > 428 && x < 500 && y > 270 && y < 334;
      drag(disk, {
        signal: ctx.signal,
        onStart: () => {
          select(disk);
          origin = { x: parseFloat(disk.style.left), y: parseFloat(disk.style.top) };
          ghost = document.createElement('div');
          ghost.className = 'mac-ghost';
          ghost.style.left = `${origin.x}px`;
          ghost.style.top = `${origin.y}px`;
          desk.append(ghost);
        },
        onMove: ({ dx, dy }) => {
          const x = origin.x + dx;
          const y = origin.y + dy;
          ghost.style.left = `${x}px`;
          ghost.style.top = `${y}px`;
          trash.classList.toggle('hot', overTrash(x + 36, y + 20));
        },
        onEnd: ({ dx, dy }) => {
          ghost?.remove();
          ghost = null;
          trash.classList.remove('hot');
          const x = Math.max(0, Math.min(440, origin.x + dx));
          const y = Math.max(22, Math.min(290, origin.y + dy));
          if (overTrash(origin.x + dx + 36, origin.y + dy + 20)) eject(disk, trash);
          else {
            disk.style.left = `${x}px`;
            disk.style.top = `${y}px`;
            ctx.progress();
          }
        },
        onTap: () => select(disk),
      });
      disk.addEventListener('dblclick', () => openDiskWindow());
      disk.addEventListener('keydown', (event) => {
        if (event.key === 'Delete' || event.key === 'Backspace') eject(disk, trash);
        if (event.key === 'Enter') openDiskWindow();
      });
      trash.addEventListener('pointerdown', () => select(trash));
      trash.addEventListener('dblclick', () => openTrash());
      trash.addEventListener('keydown', (event) => event.key === 'Enter' && openTrash());
    }

    // ——— Fenêtres du Finder ———

    function windowEl({ id, title, x, y, w, h, body, info }) {
      const desk = root.querySelector('.mac-desk');
      desk.querySelector(`[data-win="${id}"]`)?.remove();
      desk.querySelectorAll('.mac-win.active').forEach((win) => win.classList.remove('active'));
      const win = document.createElement('section');
      win.className = 'mac-win active';
      win.dataset.win = id;
      win.setAttribute('role', 'dialog');
      win.setAttribute('aria-label', title);
      win.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${(z += 1)}`;
      win.innerHTML = `
        <header class="mac-title"><button type="button" class="mac-close" aria-label="Fermer"></button><span>${title}</span></header>
        ${info ? `<div class="mac-info">${info}</div>` : ''}
        <div class="mac-body">${body}</div>`;
      desk.append(win);
      win.querySelector('.mac-close').addEventListener('click', () => win.remove());
      win.addEventListener('pointerdown', () => {
        desk.querySelectorAll('.mac-win.active').forEach((other) => other.classList.remove('active'));
        win.classList.add('active');
        win.style.zIndex = String((z += 1));
      });
      // La barre de titre rayée sert de poignée
      const bar = win.querySelector('.mac-title');
      let start = null;
      drag(win, {
        handle: bar,
        signal: ctx.signal,
        onStart: () => {
          start = { x: parseFloat(win.style.left), y: parseFloat(win.style.top) };
        },
        onMove: ({ dx, dy }) => {
          win.style.left = `${Math.max(-w + 40, Math.min(472, start.x + dx))}px`;
          win.style.top = `${Math.max(20, Math.min(320, start.y + dy))}px`;
        },
      });
      return win;
    }

    function openDiskWindow() {
      if (ejected) return;
      const win = windowEl({
        id: 'disk',
        title: 'Disquette',
        x: 32,
        y: 46,
        w: 330,
        h: 196,
        info: '<span>4 éléments</span><span>212 K dans le disque</span><span>188 K disponibles</span>',
        body: `<div class="mac-files">
          <button type="button" class="mac-file" data-file="systeme">${ICONS.folder}<span>Dossier Système</span></button>
          <button type="button" class="mac-file" data-file="lisezmoi">${ICONS.doc}<span>Lisez-moi</span></button>
          <button type="button" class="mac-file" data-file="dessin">${ICONS.paint}<span>Dessin</span></button>
          <button type="button" class="mac-file" data-file="texte">${ICONS.write}<span>Texte</span></button>
        </div>`,
      });
      win.querySelectorAll('.mac-file').forEach((file) => {
        file.addEventListener('pointerdown', () => {
          win.querySelectorAll('.mac-file.selected').forEach((other) => other.classList.remove('selected'));
          file.classList.add('selected');
        });
        const open = () => {
          const name = file.dataset.file;
          if (name === 'lisezmoi') {
            ctx.progress();
            windowEl({
              id: 'lisezmoi',
              title: 'Lisez-moi',
              x: 120,
              y: 90,
              w: 300,
              h: 170,
              body: `<div class="mac-text">${LISEZMOI.replace(/\n/g, '<br>')}</div>`,
            });
          } else {
            alertBox(name === 'systeme' ? 'Le Dossier Système est indispensable : on n’y touche pas !' : 'Ce logiciel n’a pas assez de mémoire pour s’ouvrir (128 K, c’est peu).');
          }
        };
        file.addEventListener('dblclick', open);
        file.addEventListener('keydown', (event) => event.key === 'Enter' && open());
      });
    }

    function openTrash() {
      windowEl({
        id: 'trash',
        title: 'Poubelle',
        x: 180,
        y: 120,
        w: 240,
        h: 130,
        info: '<span>0 élément</span>',
        body: '<div class="mac-files"></div>',
      });
    }

    function alertBox(text) {
      const desk = root.querySelector('.mac-desk');
      const box = document.createElement('div');
      box.className = 'mac-alert';
      box.setAttribute('role', 'alertdialog');
      box.innerHTML = `<p>${text}</p><button type="button">OK</button>`;
      desk.append(box);
      audio.beep(660, 0.12);
      const ok = box.querySelector('button');
      ok.addEventListener('click', () => box.remove());
      ok.focus({ preventScroll: true });
    }

    function toggleMenu(btn) {
      const name = btn.dataset.menu;
      if (openMenu?.dataset.for === name) return closeMenu();
      closeMenu();
      const desk = root.querySelector('.mac-desk');
      const menu = document.createElement('div');
      menu.className = 'mac-dropdown';
      menu.dataset.for = name;
      menu.style.left = `${btn.offsetLeft}px`;
      menu.innerHTML = MENUS[name]
        .map((item) => (item === '—' ? '<hr>' : `<button type="button" ${item === 'Nettoyer' ? '' : 'disabled'}>${item}</button>`))
        .join('');
      desk.append(menu);
      btn.classList.add('open');
      openMenu = menu;
      menu.addEventListener('click', (event) => {
        if (event.target.closest('button:not(:disabled)')) {
          closeMenu();
          alertBox('Le bureau est déjà bien rangé. Il ne manque que la disquette à récupérer…');
        }
      });
    }

    function closeMenu() {
      openMenu?.remove();
      root.querySelectorAll('.mac-menu.open').forEach((btn) => btn.classList.remove('open'));
      openMenu = null;
    }

    // ——— L'éjection ———

    async function eject(disk, trash) {
      if (ejected) return;
      ejected = true;
      disk.remove();
      root.querySelector('[data-win="disk"]')?.remove();
      trash.classList.add('hot');
      audio.click();
      await ctx.wait(220);
      trash.classList.remove('hot');
      // Le moteur tourne, puis la disquette sort de la fente
      audio.tone({ freq: 70, type: 'square', attack: 0.02, hold: 0.45, release: 0.08, vol: 0.05, filter: { freq: 500 } });
      audio.noise({ at: 0.5, type: 'lowpass', freq: 420, release: 0.12, vol: 0.2 });
      await ctx.wait(500);
      ctx.props.bezel.querySelector('.mac-floppy')?.classList.add('out');
      ctx.note('Disquette → Poubelle', { key: 'mac-eject', label: 'Éjecter (Macintosh, 1984)' });
      await ctx.wait(1400);
      ctx.complete();
    }

    boot().catch(() => {});

    return () => {};
  },
};
