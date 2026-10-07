// Écran 7 — Ubuntu (2006) : bureau GNOME 2 aux tons chauds, un terminal ouvert.
// Il faut installer le paquet « sortie » en administrateur (sudo), avec le mot
// trouvé en 1974 (multics) pour mot de passe, puis lancer sortie.

import { createTerminal } from '../ui/terminal.js';
import { createBash } from './ubuntu/bash.js';
import { buildDesktop } from './ubuntu/desktop.js';
import { emblem, mini } from './ubuntu/art.js';

const CHIPS = [[], ['sortie'], ['sortie', 'sudo apt install sortie'], ['sudo apt install sortie', 'sortie']];

const BOOT_STEPS = [
  'Chargement du noyau Linux 2.6.15…',
  'Vérification des systèmes de fichiers…',
  'Configuration du réseau…',
  'Démarrage des services système…',
  'Lancement du bureau GNOME…',
];

export default {
  id: 'ubuntu',
  era: 'Ubuntu',
  year: 2006,

  decor(props) {
    const note = document.createElement('div');
    note.className = 'ub-postit';
    note.innerHTML = '<span>Ne JAMAIS noter son mot de passe sur un post-it.</span><small>(Le carnet, c’est mieux.)</small>';
    props.bezel.append(note);
  },

  mount(root, ctx) {
    const { audio } = ctx;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = new Set();
    let term = null;
    let termWin = null;
    let fontSize = 14;
    let autoMax = false;
    let chipsLevel = ctx.hints.level;
    let asking = false;
    let launching = false;

    root.classList.add('ub', 'is-booting');
    root.innerHTML = `
      <div class="ub-world">
        <div class="ub-cube">
          <div class="ub-face ub-face-main"></div>
          <div class="ub-face ub-face-next" aria-hidden="true">
            <div class="ub-next-glow"></div>
            <div class="ub-next-phone"><i></i></div>
            <p class="ub-next-year">2007</p>
          </div>
        </div>
      </div>
      <div class="ub-boot" aria-label="Démarrage d’Ubuntu">
        <div class="ub-boot-center">
          ${emblem('ub-boot-emblem')}
          <p class="ub-boot-name">Ubuntu <span>6.06 LTS</span></p>
          <div class="ub-boot-bar"><i></i></div>
          <p class="ub-boot-status" aria-live="polite"></p>
        </div>
      </div>`;

    const face = root.querySelector('.ub-face-main');
    const shell = buildDesktop(face, ctx, { terminal: () => openTerminal() });
    const { desk } = shell;

    const firstTime = (key) => {
      if (seen.has(key)) return false;
      seen.add(key);
      ctx.progress();
      return true;
    };

    // ——— Pastilles tactiles ———

    const setChips = () => term?.setChips(asking ? [] : CHIPS[chipsLevel] ?? CHIPS.at(-1));
    ctx.hints.onReveal((level) => {
      chipsLevel = level;
      setChips();
    });

    // ——— Le shell ———

    // Si la fenêtre est fermée en pleine commande, la suite s'écrit dans le vide.
    const io = {
      print: (text) => (term ? term.print(text) : Promise.resolve()),
      html: (html) => (term ? term.printHTML(html) : Promise.resolve()),
      lastRow: () => term?.out.lastElementChild ?? document.createElement('div'),
      insertBefore: (ref, text) => {
        if (!term) return;
        ref.before(term.row(text));
        stickBottom();
      },
      clear: () => term?.clear(),
      wait: (ms) => ctx.wait(ms),
      cols: () => columns(),
    };

    const bash = createBash(io, {
      error: () => ctx.error(),
      suggest: () => {
        firstTime('suggest');
        ctx.note('sudo apt install sortie', { key: 'ubuntu-sudo', label: 'Installer la sortie' });
      },
      denied: () => firstTime('denied'),
      authenticated: () => firstTime('sudo'),
      installed: () => {
        firstTime('installed');
        audio.success();
      },
      launch: () => launch(),
      bonus: () => {
        firstTime('bonus');
        ctx.note('multics', { key: 'multics', label: 'Mot à retenir (1974)' });
      },
      exit: () => {
        setTimeout(() => termWin?.close(), 60);
        return null;
      },
      cwd: () => {
        termWin?.setTitle(`voyageur@ubuntu: ${bash.label()}`);
        shell.renderTasks();
      },
      askPassword: (question) => askPassword(question),
      history: () => term?.history ?? [],
      openApp: (name, arg) => {
        if (name === 'gedit') shell.openText(arg || 'journal', []);
        else if (name === 'nautilus') shell.openFolder('~');
        else shell.dialog({ title: 'Navigateur Web', text: 'Firefox ne trouve pas le serveur.\nLe Web de 2006 attendra : la sortie est dans le Terminal.', kind: 'warning' });
        return null;
      },
    });

    // ——— Mot de passe sans écho, et aide au bout de 5 s ———

    let help = null;
    let helpTimer = 0;

    function placeHelp() {
      if (!help || !term) return;
      const body = termWin.body;
      const s = shell.scale();
      const b = body.getBoundingClientRect();
      const line = term.el.querySelector('.term-line').getBoundingClientRect();
      const prompt = term.el.querySelector('.term-prompt').getBoundingClientRect();
      const height = help.offsetHeight;
      const below = (line.bottom - b.top) / s + 10;
      const above = (line.top - b.top) / s - height - 10;
      const fitsBelow = below + height < body.clientHeight - 4;
      help.classList.toggle('is-above', !fitsBelow);
      help.style.top = `${Math.max(4, fitsBelow ? below : above)}px`;
      const left = (prompt.right - b.left) / s - 34;
      help.style.left = `${Math.max(8, Math.min(body.clientWidth - help.offsetWidth - 22, left))}px`;
    }

    function showHelp() {
      if (!asking || !termWin) return;
      const typed = term.input.value.length;
      if (!help) {
        help = document.createElement('div');
        help.className = 'ub-notify';
        help.setAttribute('role', 'status');
        termWin.body.append(help);
      }
      help.innerHTML = `<b>Rien ne s’affiche ? C’est normal.</b>
        <span>Par sécurité, sudo ne montre pas le mot de passe, pas même des étoiles.${
          typed ? ` Vous avez déjà tapé ${typed} caractère${typed > 1 ? 's' : ''}.` : ''
        } Tapez-le à l’aveugle, puis appuyez sur Entrée.</span>`;
      help.hidden = false;
      placeHelp();
      audio.tone({ freq: 660, release: 0.18, vol: 0.04 });
      audio.tone({ freq: 990, at: 0.08, release: 0.22, vol: 0.03 });
    }

    function hideHelp() {
      clearTimeout(helpTimer);
      if (help) help.hidden = true;
    }

    async function askPassword(question) {
      if (!term) return null;
      asking = true;
      setChips();
      const arm = () => {
        clearTimeout(helpTimer);
        helpTimer = setTimeout(showHelp, 5000);
      };
      const onInput = () => {
        if (help && !help.hidden) showHelp();
        arm();
      };
      term.input.addEventListener('input', onInput);
      arm();
      const value = await term.ask(question, { echo: false });
      term?.input.removeEventListener('input', onInput);
      hideHelp();
      asking = false;
      setChips();
      return value;
    }

    // ——— Le terminal GNOME ———

    const charWidth = () => fontSize * 0.602;
    function columns() {
      const width = term?.el.querySelector('.term-scroll')?.clientWidth ?? 640;
      return Math.max(20, Math.floor(width / charWidth()));
    }
    function stickBottom() {
      const scroll = term?.el.querySelector('.term-scroll');
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
      updateScrollbar();
    }

    function updateScrollbar() {
      if (!termWin) return;
      const scroll = term?.el.querySelector('.term-scroll');
      const thumb = termWin.body.querySelector('.ub-sb-thumb');
      if (!scroll || !thumb) return;
      const ratio = Math.min(1, scroll.clientHeight / Math.max(1, scroll.scrollHeight));
      const track = termWin.body.querySelector('.ub-sb-track').clientHeight;
      const h = Math.max(24, track * ratio);
      thumb.style.height = `${h}px`;
      thumb.style.transform = `translateY(${Math.round(track - h)}px)`;
    }

    function setFont(size) {
      fontSize = Math.max(10, Math.min(34, size));
      termWin?.el.style.setProperty('--ut-fs', `${fontSize}px`);
      requestAnimationFrame(stickBottom);
    }

    // Le texte vise environ 11 px à l'écran : sur un petit écran, il grossit,
    // la fenêtre s'agrandit, puis occupe tout le bureau (téléphone).
    const GEOMETRY = { normal: { x: 122, y: 50, w: 664, h: 468 }, large: { x: 112, y: 20, w: 690, h: 566 } };

    function fit() {
      if (!termWin || termWin.closed) return;
      const scale = ctx.scale || 1;
      const ideal = Math.round(Math.min(30, Math.max(14, 11.2 / scale)));
      setFont(ideal);
      const tier = ideal >= 20 ? 'max' : ideal >= 16 ? 'large' : 'normal';
      if (tier === 'max') {
        if (!termWin.maximized) {
          termWin.toggleMax();
          autoMax = true;
        }
      } else {
        if (autoMax && termWin.maximized) {
          termWin.toggleMax();
          autoMax = false;
        }
        if (!termWin.maximized && !termWin.userMoved) {
          const g = GEOMETRY[tier];
          termWin.move(g.x, g.y);
          termWin.resize(g.w, g.h);
        }
      }
      root.classList.toggle('ub-large', tier === 'max');
    }

    const TERMINAL_MENUS = () => [
      {
        el: termWin.el.querySelectorAll('.wm-menu-item')[0],
        items: [
          { label: 'Ouvrir un onglet', accel: 'Maj+Ctrl+T', disabled: true },
          { label: 'Ouvrir un terminal', accel: 'Maj+Ctrl+N', icon: mini('terminal'), run: () => openTerminal() },
          { sep: true },
          { label: 'Fermer l’onglet', accel: 'Maj+Ctrl+W', run: () => termWin.close() },
          { label: 'Fermer la fenêtre', accel: 'Maj+Ctrl+Q', run: () => termWin.close() },
        ],
      },
      {
        el: termWin.el.querySelectorAll('.wm-menu-item')[1],
        items: [
          { label: 'Copier', accel: 'Maj+Ctrl+C', disabled: true },
          { label: 'Coller', accel: 'Maj+Ctrl+V', disabled: true },
          { sep: true },
          { label: 'Profils…', run: () => shell.dialog({ title: 'Profils', text: 'Profil « Par défaut » : texte noir sur fond blanc, police Monospace 10. Parfait.' }) },
          { label: 'Raccourcis clavier…', run: () => shell.dialog({ title: 'Raccourcis clavier', text: 'Flèches haut et bas : rappeler une commande.\nTab : compléter un nom.\nCtrl+C : abandonner.' }) },
        ],
      },
      {
        el: termWin.el.querySelectorAll('.wm-menu-item')[2],
        items: [
          { label: 'Afficher la barre de menus', checked: true, disabled: true },
          { label: 'Plein écran', accel: 'F11', run: () => termWin.toggleMax() },
          { sep: true },
          { label: 'Zoom avant', accel: 'Ctrl++', run: () => setFont(fontSize + 2) },
          { label: 'Zoom arrière', accel: 'Ctrl+-', run: () => setFont(fontSize - 2) },
          { label: 'Taille normale', accel: 'Ctrl+0', run: () => fit() },
        ],
      },
      {
        el: termWin.el.querySelectorAll('.wm-menu-item')[3],
        items: [
          { label: 'Changer de profil', disabled: true },
          { label: 'Définir le titre…', disabled: true },
          { sep: true },
          { label: 'Réinitialiser', run: () => term.focus() },
          { label: 'Réinitialiser et effacer', run: () => term.clear() },
        ],
      },
      {
        el: termWin.el.querySelectorAll('.wm-menu-item')[4],
        items: [
          { label: 'Onglet précédent', accel: 'Ctrl+Page préc.', disabled: true },
          { label: 'Onglet suivant', accel: 'Ctrl+Page suiv.', disabled: true },
        ],
      },
      {
        el: termWin.el.querySelectorAll('.wm-menu-item')[5],
        items: [
          { label: 'Sommaire', accel: 'F1', icon: mini('help'), run: () => shell.openHelp() },
          { label: 'À propos', icon: mini('about'), run: () => shell.dialog({ title: 'À propos du Terminal GNOME', text: 'Terminal GNOME 2.14.2\nUn émulateur de terminal pour le bureau GNOME.\nIl émule… un télétype de 1974, en mieux.' }) },
        ],
      },
    ];

    function openTerminal() {
      if (termWin && !termWin.closed) {
        termWin.restore();
        if (!ctx.touch) term.focus();
        return termWin;
      }
      termWin = desk.open({
        id: 'terminal',
        title: `voyageur@ubuntu: ${bash.label()}`,
        ...GEOMETRY.normal,
        icon: mini('terminal', 16),
        menu: ['Fichier', 'Édition', 'Affichage', 'Terminal', 'Onglets', 'Aide'],
        className: 'ub-termwin',
        body: `<div class="ub-term"></div>
          <div class="ub-scrollbar" aria-hidden="true"><i class="ub-sb-btn ub-sb-up"></i><i class="ub-sb-track"><b class="ub-sb-thumb"></b></i><i class="ub-sb-btn ub-sb-down"></i></div>`,
      });
      const win = termWin;
      termWin.el.querySelectorAll('.wm-menu-item').forEach((item) => {
        item.tabIndex = 0;
        item.setAttribute('role', 'menuitem');
      });
      shell.menus.bindBar(TERMINAL_MENUS());

      term = createTerminal(termWin.body.querySelector('.ub-term'), {
        prompt: () => bash.prompt(),
        cursor: 'block',
        label: 'Terminal GNOME',
        className: 'ub-tty',
        maxRows: 700,
        onKey: () => audio.key(),
        onKeyDown: (event) => keys(event),
        onLine: (raw) => bash.run(raw),
      });
      const mine = term;
      new MutationObserver(() => requestAnimationFrame(updateScrollbar)).observe(term.out, { childList: true });
      termWin.on('focus', () => !ctx.touch && mine.focus());
      termWin.on('maximize', () => requestAnimationFrame(stickBottom));
      termWin.on('move', () => (win.userMoved = true));
      termWin.on('close', () => {
        mine.destroy();
        if (term === mine) {
          term = null;
          asking = false;
        }
        if (termWin === win) termWin = null;
      });
      fit();
      setChips();
      if (!ctx.touch) setTimeout(() => mine.focus(), 60);
      return termWin;
    }

    // Tab complète, Ctrl+L efface, Ctrl+plus et Ctrl+moins zooment.
    function keys(event) {
      if (!term) return;
      // Ctrl+C pendant le mot de passe : le terminal partagé abandonne la question.
      if (asking) return;
      if (event.key === 'Tab') {
        const result = bash.complete(term.input.value);
        if (result?.value) {
          term.input.value = result.value;
          term.render();
        } else if (result?.list) {
          term.print(result.list.join('  '));
        } else {
          audio.beep(880, 0.04);
        }
      } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        term.clear();
      } else if (event.ctrlKey && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        setFont(fontSize + 2);
      } else if (event.ctrlKey && event.key === '-') {
        event.preventDefault();
        setFont(fontSize - 2);
      }
    }

    // ——— Le saut : compiz avant l'heure, le bureau tourne comme un cube ———

    async function launch() {
      if (launching) return null;
      launching = true;
      await io.print('sortie 1.0 — saut temporel vers 2007');
      await ctx.wait(400);
      await io.print('Destination : 2007. Là-bas, plus de clavier : tout se fera du bout des doigts.');
      await ctx.wait(500);
      await io.print('');
      const row = io.lastRow();
      for (let pct = 0; pct <= 100; pct += 5) {
        const fill = Math.round(pct / 5);
        row.textContent = `Ouverture de la faille [${'='.repeat(fill)}${fill < 20 ? '>' : ''}${' '.repeat(Math.max(0, 19 - fill))}] ${pct} %`;
        await ctx.wait(45);
      }
      await io.print('Bon voyage, voyageur !');
      await ctx.wait(500);
      root.classList.add(reduced ? 'is-fading' : 'is-cubing');
      audio.whoosh?.(1.2);
      await ctx.wait(reduced ? 700 : 1900);
      ctx.complete();
      await new Promise((resolve) => ctx.signal.addEventListener('abort', resolve, { once: true }));
      return null;
    }

    // ——— Démarrage : écran d'attente, puis le bureau ———

    async function boot() {
      const bootEl = root.querySelector('.ub-boot');
      const bar = bootEl.querySelector('.ub-boot-bar i');
      const status = bootEl.querySelector('.ub-boot-status');
      // Un clic ou une touche écourte tout le démarrage.
      let fast = false;
      const skipper = new AbortController();
      const hurry = () => (fast = true);
      root.addEventListener('pointerdown', hurry, { signal: skipper.signal });
      window.addEventListener('keydown', hurry, { signal: skipper.signal });
      ctx.signal.addEventListener('abort', () => skipper.abort());
      const step = (ms) => ctx.wait(fast ? 0 : ms, { skippable: true });
      await step(reduced ? 100 : 300);
      bootEl.classList.add('is-on');
      for (let i = 0; i < BOOT_STEPS.length; i++) {
        status.textContent = BOOT_STEPS[i];
        bar.style.transform = `scaleX(${(i + 1) / BOOT_STEPS.length})`;
        await step(reduced ? 120 : 560);
      }
      skipper.abort();
      bootEl.classList.add('is-leaving');
      root.classList.remove('is-booting');
      root.classList.add('is-arriving');
      audio.chime('ubuntu');
      await ctx.wait(reduced ? 50 : 450);
      openTerminal();
      await ctx.wait(700);
      bootEl.remove();
      root.classList.remove('is-arriving');
    }

    ctx.onResize(() => {
      fit();
      if (help && !help.hidden) placeHelp();
    });

    boot().catch(() => {});

    return () => {
      clearTimeout(helpTimer);
      term?.destroy();
      shell.destroy();
    };
  },
};
