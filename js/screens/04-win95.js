// Écran 4 — Windows 95 : pour quitter l'époque, il faut éteindre l'ordinateur.
// Démarrer › Arrêter › Oui, puis le bouton d'alimentation de l'unité centrale
// posée à côté du moniteur : l'action sort littéralement de l'interface.
// Le paradoxe resté célèbre : on clique sur « Démarrer »… pour arrêter.

import { createShell } from './win9x/shell.js';
import { createApps } from './win9x/apps.js';
import { createMachine } from './win9x/machine.js';
import { waitHtml, safeHtml } from './win9x/system.js';
import { createTower, createMonitorLed } from './win9x/tower.js';
import { ICON16, ICON32 } from './win9x/icons.js';
import { ICONS } from '../ui/icons.js';
import { createTerminal } from '../ui/terminal.js';

const README = `LISEZMOI.TXT — Windows 95

Bienvenue dans Windows 95 !

Windows démarre désormais tout seul, sans passer par l’invite C:\\>.
Tout commence par le bouton Démarrer, en bas à gauche de l’écran.

IMPORTANT : n’éteignez jamais l’ordinateur directement. Windows doit
d’abord ranger ses fichiers. Passez toujours par la commande
Arrêter du menu Démarrer, puis attendez le message qui vous autorise
à appuyer sur le bouton de l’unité centrale.`;

const SHOPPING = `Liste de courses

- disquettes 3½ (boîte de 10)
- tapis de souris
- Windows 95 : 13 disquettes… ou le CD-ROM !
- une barrette de 8 Mo de mémoire (si les sous suivent)`;

const JOURNAL = `Journal du voyageur

1965 : des cartes perforées, sans écran.
1974 : un télétype qui imprime tout sur papier.
1981 : DOS, A:, C:, WIN.
1992 : des fenêtres à pousser du bout de la souris.
1995 : me voici devant un bouton « Démarrer »…
         Mais comment éteint-on cette machine ?`;

const TIPS = [
  'Pour quitter cette époque, éteignez l’ordinateur.',
  'Pour ouvrir un programme, cliquez sur le bouton Démarrer, puis pointez sur Programmes.',
  'Cliquez avec le bouton droit sur le bureau : un menu contextuel apparaît. Une nouveauté de Windows 95 !',
  'La barre des tâches affiche un bouton pour chaque fenêtre ouverte : un clic suffit pour passer de l’une à l’autre.',
  'Les noms de fichiers peuvent désormais compter jusqu’à 255 caractères. Adieu NOMFICHI.TXT !',
  'N’éteignez jamais l’ordinateur sans prévenir Windows : il a des fichiers à ranger avant.',
];

const SHUTDOWN_OPTIONS = [
  ['off', 'Arrêter l’ordinateur ?', 'Prépare l’ordinateur pour que vous puissiez l’éteindre sans risque de perdre des données.'],
  ['restart', 'Redémarrer l’ordinateur ?', 'Ferme Windows, puis redémarre l’ordinateur.'],
  ['dos', 'Redémarrer l’ordinateur en mode MS-DOS ?', 'Ferme Windows et redémarre l’ordinateur sous MS-DOS. Pratique pour les vieux jeux !'],
  ['logoff', 'Fermer toutes les applications et ouvrir une session sous un autre nom ?', 'Ferme tous les programmes, puis vous permet d’ouvrir une session sous un autre nom d’utilisateur.'],
];

const BSOD_LINES = [
  'Une exception fatale 0E s’est produite à 0028:C0FFEE95 dans VxD',
  'MALADRESSE(03) + 00000003. L’application en cours va être arrêtée.',
  '',
  '*  Appuyez sur une touche pour revenir à l’application en cours.',
  '*  Appuyez sur CTRL+ALT+SUPPR pour redémarrer votre ordinateur.',
  '   Vous perdrez toute information non enregistrée dans les',
  '   applications.',
  '',
  'Cause probable : trois fausses manœuvres d’affilée.',
];

const decorOf = new WeakMap();

export default {
  id: 'win95',
  era: 'Windows 95',
  year: 1995,

  decor(props, ctx) {
    const handlers = {};
    const tower = createTower(props.side, {
      variant: '95',
      audio: ctx.audio,
      signal: ctx.signal,
      onPower: () => handlers.power?.(),
      onReset: () => handlers.reset?.(),
    });
    const led = createMonitorLed(props.bezel);
    decorOf.set(ctx, { tower, led, handlers });
  },

  mount(root, ctx) {
    const { audio } = ctx;
    const deco = decorOf.get(ctx);
    const tower = deco?.tower;
    const led = deco?.led;
    root.classList.add('w95');

    let shell = null;
    let apps = null;
    let welcomeAtBoot = true;
    let tipIndex = 0;
    let startedOnce = false;
    let nudgeTimer = 0;
    let dosTerm = null;

    const machine = createMachine(root, ctx, {
      variant: '95',
      tower,
      led,
      bsodLines: BSOD_LINES,
      onBuild: () => buildDesktop(),
      onDestroy: () => {
        destroyShell();
        leaveDos();
      },
      onReady: () => welcomeAtBoot && welcome(),
      onPowerLoss: () => shell?.menus.closeSilently(),
      onBsod: () => shell?.menus.closeSilently(),
    });
    const { view } = machine;

    function destroyShell() {
      shell?.destroy();
      shell = null;
      apps = null;
    }

    // ——— Bureau ———

    function startItems() {
      const small = apps?.smallIcons;
      return [
        { label: '&Programmes', icon: small ? ICON16.folder : ICON32.programs, sub: () => apps.programs() },
        { label: '&Documents', icon: small ? ICON16.doc : ICONS.documents, sub: () => apps.documents() },
        { label: 'Para&mètres', icon: small ? ICON16.control : ICON32.settings, sub: () => apps.settings() },
        { label: '&Rechercher', icon: small ? ICON16.find : ICON32.find, sub: () => apps.findMenu() },
        { label: 'A&ide', icon: small ? ICON16.help : ICON32.help, run: () => apps.help() },
        { label: '&Exécuter…', icon: small ? ICON16.run : ICON32.run, run: () => apps.run() },
        '-',
        { label: '&Arrêter…', icon: small ? ICON16.shutdown : ICON32.shutdown, run: () => shutdownDialog() },
      ];
    }

    function buildDesktop() {
      destroyShell();
      shell = createShell(view.host, ctx, {
        variant: '95',
        banner: '<b>Windows</b>95',
        date: 'jeudi 24 août 1995',
        start: startItems,
        smallIcons: () => apps?.smallIcons,
        onStart: () => {
          if (startedOnce) return;
          startedOnce = true;
          ctx.progress();
        },
        onContext: () => ctx.progress(),
        onDesktopProperties: () => apps.display(),
        onTaskbarProperties: () => apps.taskbarProps(),
        openNew: (kind, label) =>
          kind === 'folder' ? shell.alert({ title: label, text: 'Ce dossier est vide.', icon: 'info' }) : apps.notepad(label.replace(/\.\w+$/, ''), ''),
        icons: [
          { label: 'Poste de travail', svg: ICONS.computer, x: 4, y: 4, type: 'a', open: () => apps.computer() },
          { label: 'Voisinage réseau', svg: ICONS.network, x: 4, y: 74, type: 'b', open: () => apps.network() },
          { label: 'Corbeille', svg: ICONS.trash, x: 4, y: 144, type: 'c', open: () => apps.recycle() },
          { label: 'Boîte de réception', svg: ICON32.inbox, x: 4, y: 214, type: 'd', open: () => inbox() },
          { label: 'Porte-documents', svg: ICON32.briefcase, x: 4, y: 284, type: 'e', open: () => briefcase() },
        ],
      });
      apps = createApps(shell, ctx, {
        variant: '95',
        tower,
        readme: README,
        shopping: SHOPPING,
        journal: JOURNAL,
        date: '24/08/1995',
        onScandisk: () => scandiskWindow(),
        onTaskbarProperties: () => apps.taskbarProps(),
        onRun: (cmd, name) => runEgg(cmd, name),
      });
      return shell;
    }

    function inbox() {
      shell.alert({
        title: 'Boîte de réception',
        text: 'Aucun nouveau message.\n\nLe courrier électronique ? Il faudra un modem… rendez-vous dans la prochaine époque !',
        icon: 'info',
      });
    }

    function briefcase() {
      shell.alert({
        title: 'Porte-documents',
        text: 'Bienvenue dans le Porte-documents !\n\nCopiez-y vos fichiers, emportez-le sur une disquette, et Windows synchronisera les deux ordinateurs à votre retour.',
        icon: 'info',
      });
    }

    function runEgg(cmd, name) {
      if (/rundll(32)?(\.exe)? user(\.exe)?,\s*exitwindows/.test(cmd)) {
        shutdown();
        return true;
      }
      if (name === 'saut') {
        shell.alert({ title: 'SAUT.EXE', text: 'SAUT.EXE a servi en 1992. Cette époque-ci se quitte autrement…', icon: 'info' });
        return true;
      }
      return false;
    }

    function scandiskWindow() {
      shell.alert({
        title: 'ScanDisk - (C:)',
        text: 'ScanDisk a vérifié le lecteur C: et n’a trouvé aucune erreur.\n\nAstuce : en éteignant l’ordinateur sans passer par Arrêter, vous lui donneriez du travail au prochain démarrage.',
        icon: 'info',
      });
      tower?.disk(1.5);
      audio.hdd(1.2);
    }

    // ——— Fenêtre de bienvenue ———

    function welcome() {
      if (!shell) return;
      const existing = shell.desk.windows.find((w) => w.spec.id === 'welcome');
      if (existing) return existing.restore();
      const win = shell.desk.open({
        id: 'welcome',
        title: 'Bienvenue',
        icon: ICON16.welcome,
        w: 440,
        h: 'auto',
        center: true,
        controls: { min: false, max: false },
        className: 'w95-welcome',
        body: `
          <h2 class="w95-welcome-title">Bienvenue dans <b>Windows</b><span>95</span></h2>
          <div class="w95-welcome-main">
            <div class="w95-tip">
              <div class="w95-tip-head">${ICON32.bulb}<p>Le saviez-vous…</p></div>
              <p class="w95-tip-text" aria-live="polite"></p>
            </div>
            <div class="w95-welcome-btns">
              <button type="button" class="wm-push" data-act="tour">Visite <u>g</u>uidée</button>
              <button type="button" class="wm-push" data-act="news"><u>N</u>ouveautés</button>
              <button type="button" class="wm-push" data-act="help"><u>A</u>ide</button>
              <span class="w95-spacer"></span>
              <button type="button" class="wm-push" data-act="next">Astuce <u>s</u>uivante</button>
            </div>
          </div>
          <div class="w95-welcome-foot">
            <label class="w9x-check"><input type="checkbox" ${welcomeAtBoot ? 'checked' : ''}> <span>Afficher cet écran au prochain démarrage de Windows</span></label>
            <button type="button" class="wm-push is-default" data-act="close">Fermer</button>
          </div>`,
      });
      const text = win.body.querySelector('.w95-tip-text');
      const showTip = () => {
        text.textContent = TIPS[tipIndex];
        text.classList.toggle('is-mission', tipIndex === 0);
      };
      showTip();
      win.body.querySelector('input[type=checkbox]').addEventListener('change', (event) => {
        welcomeAtBoot = event.target.checked;
      });
      win.body.addEventListener('click', (event) => {
        const act = event.target.closest('[data-act]')?.dataset.act;
        if (!act) return;
        if (act === 'next') {
          tipIndex = (tipIndex + 1) % TIPS.length;
          showTip();
        } else if (act === 'close') win.close();
        else if (act === 'help') apps.help();
        else if (act === 'news') apps.help('Nouveautés de cette version');
        else if (act === 'tour') tour();
      });
      setTimeout(() => !win.closed && win.body.querySelector('[data-act="close"]').focus({ preventScroll: true }), 50);
      return win;
    }

    // La visite guidée réclame le CD-ROM : le tiroir du lecteur s'ouvre.
    async function tour() {
      tower?.tray(true);
      await shell.alert({
        title: 'Visite guidée',
        text: 'La visite guidée se trouve sur le CD-ROM de Windows 95.\n\nInsérez le disque dans le lecteur D:, puis cliquez sur OK.',
        icon: 'info',
      });
      tower?.tray(false);
      await ctx.wait(700);
      if (machine.state !== 'desktop' || !shell) return;
      shell.alert({ title: 'Visite guidée', text: 'Le lecteur D: est vide.\nLa visite attendra : le voyage, lui, n’attend pas !', icon: 'warning' });
    }

    // ——— Arrêt de Windows ———

    async function shutdownDialog() {
      if (machine.state !== 'desktop' || !shell) return;
      ctx.progress();
      audio.ding();
      const dlg = shell.dialog({
        title: 'Arrêt de Windows',
        layer: 'sys',
        dither: true,
        width: 380,
        buttons: ['&Oui', '&Non', '&Aide'],
        cancelButton: 1,
        className: 'w95-shutdown',
        body: `<div class="w95-shut">
          <span class="w95-shut-icon">${ICON32.shutdown}</span>
          <fieldset>
            <legend>Êtes-vous sûr de vouloir :</legend>
            ${SHUTDOWN_OPTIONS.map(
              ([value, label], i) =>
                `<label class="w9x-radio"><input type="radio" name="how" value="${value}" ${i === 0 ? 'checked' : ''}><span>${label}</span></label>`,
            ).join('')}
          </fieldset>
        </div>`,
        onButton: (button, form, win) => {
          if (button !== 'Aide') return true;
          whatsThis(win, form);
          return false;
        },
      });
      setTimeout(() => dlg.win.body.querySelector('input:checked')?.focus({ preventScroll: true }), 60);
      const { button, form } = await dlg.result;
      if (button !== 'Oui' || machine.state !== 'desktop') return;
      const how = form.elements.how.value;
      if (how === 'off') shutdown();
      else if (how === 'restart') restart();
      else if (how === 'dos') dosMode();
      else logoff();
    }

    // Aide « Qu'est-ce que c'est ? » : l'infobulle jaune de l'époque
    function whatsThis(win, form) {
      win.body.querySelector('.w9x-whatsthis')?.remove();
      const value = form.elements.how.value;
      const option = SHUTDOWN_OPTIONS.find(([v]) => v === value);
      const pop = document.createElement('p');
      pop.className = 'w9x-whatsthis';
      pop.textContent = option[2];
      const label = form.querySelector('input[name="how"]:checked')?.closest('label');
      win.body.querySelector('.w95-shut').append(pop);
      if (label) {
        pop.style.top = `${label.offsetTop + label.offsetHeight + 2}px`;
        pop.style.left = `${label.offsetLeft + 18}px`;
      }
      audio.click();
      const close = () => pop.remove();
      setTimeout(() => win.el.addEventListener('pointerdown', close, { once: true }), 0);
    }

    async function shutdown() {
      const stale = machine.flow();
      machine.state = 'shutting';
      shell?.closeAllWindows();
      shell?.busy(1600);
      tower?.disk(1.6);
      audio.hdd(1.2);
      await ctx.wait(800);
      if (stale()) return;
      destroyShell();
      view.show(waitHtml('95'), 'is-wait');
      audio.chime('shutdown');
      tower?.disk(2.2);
      await ctx.wait(3200);
      if (stale()) return;
      view.show(safeHtml(), 'is-safe');
      machine.state = 'safe';
      ctx.progress();
      ctx.note('Démarrer › Arrêter › Oui', { key: 'win95-shutdown', label: 'Éteindre Windows 95' });
      nudgeTimer = ctx.timeout(() => machine.state === 'safe' && tower?.nudge(true), 7000);
    }

    // Le bon geste : appuyer sur le bouton une fois le message orange affiché.
    async function powerOff() {
      const stale = machine.flow();
      machine.state = 'off';
      ctx.clear(nudgeTimer);
      tower?.nudge(false);
      tower?.setOn(false);
      await view.powerOff(ctx);
      if (stale()) return;
      led?.standby(true);
      await ctx.wait(800);
      if (stale()) return;
      ctx.complete();
    }

    async function restart() {
      const stale = machine.flow();
      machine.state = 'restarting';
      machine.wrong();
      shell?.closeAllWindows();
      await ctx.wait(600);
      if (stale()) return;
      destroyShell();
      view.show(waitHtml('95'), 'is-wait');
      audio.chime('shutdown');
      await ctx.wait(2200);
      if (stale()) return;
      view.blackout(true);
      await ctx.wait(700);
      if (stale()) return;
      view.blackout(false);
      machine.boot({
        post: true,
        after: () =>
          shell.alert({
            title: 'Windows',
            text: 'Windows a bien redémarré… et vous êtes toujours en 1995 !\n\nPour quitter cette époque, il faut éteindre l’ordinateur, pas le redémarrer.',
            icon: 'info',
          }),
      });
    }

    // ——— Mode MS-DOS : retour en 1981 ———

    async function dosMode() {
      const stale = machine.flow();
      machine.state = 'restarting';
      machine.wrong();
      shell?.closeAllWindows();
      await ctx.wait(500);
      if (stale()) return;
      destroyShell();
      view.show(waitHtml('95'), 'is-wait');
      audio.chime('shutdown');
      await ctx.wait(2000);
      if (stale()) return;
      const layer = view.show('<div class="w95-dos"></div>', 'is-dos');
      machine.state = 'dos';
      dosTerm = createTerminal(layer.querySelector('.w95-dos'), {
        prompt: 'C:\\WINDOWS>',
        caseSensitive: false,
        cursor: 'underline',
        label: 'MS-DOS',
        onKey: () => audio.key(),
        commands: {
          exit: () => backToWindows(),
          win: () => backToWindows(),
          ver: () => '\nWindows 95. [Version 4.00.950]\n',
          dir: () => ' Répertoire de C:\\WINDOWS\n\nCOMMAND      <REP>\nSYSTEM       <REP>\nWIN      COM\nEXPLORER EXE\n',
          cls: (args, t) => {
            t.clear();
            return null;
          },
          help: () => 'Tapez EXIT (ou WIN) pour revenir à Windows.',
          ls: () => 'On n’est pas sous Unix ici ! Sous DOS, on tape DIR.',
        },
        unknown: () => 'Commande ou nom de fichier incorrect',
      });
      dosTerm.setChips(['EXIT', 'WIN', 'DIR']);
      dosTerm.print('\nMicrosoft(R) Windows 95\n   (C)Copyright Microsoft Corp 1981-1995.\n\nMode MS-DOS : retour en 1981 ! Pas de menu Démarrer ici.\nTapez EXIT pour revenir à Windows.\n');
      if (!ctx.touch) dosTerm.focus();
    }

    function backToWindows() {
      setTimeout(() => {
        if (machine.state === 'dos') machine.boot();
      }, 120);
      return 'Chargement de Windows…';
    }

    function leaveDos() {
      dosTerm?.destroy();
      dosTerm = null;
    }

    // ——— Changer d'utilisateur ———

    async function logoff() {
      const stale = machine.flow();
      machine.state = 'logon';
      machine.wrong();
      shell?.closeAllWindows();
      await ctx.wait(500);
      if (stale() || !shell) return;
      shell.el.classList.add('is-logon');
      const dlg = shell.dialog({
        title: 'Ouverture de session Windows',
        layer: 'sys',
        width: 380,
        closable: false,
        buttons: ['OK', 'Annuler'],
        className: 'w95-logon',
        body: `<div class="w9x-logon">${ICON32.keys}<div>
          <p>Entrez un nom d’utilisateur et un mot de passe pour ouvrir une session Windows.</p>
          <label class="w9x-field-row"><span><u>N</u>om d’utilisateur :</span><input type="text" name="user" class="win9x-field" value="voyageur" autocomplete="off" autocapitalize="none" spellcheck="false" autofocus></label>
          <label class="w9x-field-row"><span><u>M</u>ot de passe :</span><input type="password" name="pass" class="win9x-field" autocomplete="off"></label>
        </div></div>`,
      });
      const { form } = await dlg.result;
      if (stale() || !shell) return;
      const user = form.elements.user.value.trim() || 'voyageur';
      shell.el.classList.remove('is-logon');
      shell.busy(800, 'working');
      audio.chime('win95');
      machine.state = 'desktop';
      await shell.alert({
        title: 'Bienvenue',
        text: `Bonjour, ${user} !\n\nChanger d’utilisateur ne change pas d’époque : vous êtes toujours en 1995.`,
        icon: 'info',
        sound: false,
      });
      if (stale()) return;
      machine.maybeBsod();
    }

    // ——— Boutons de l'unité centrale ———

    if (deco) {
      deco.handlers.power = () => {
        const { state } = machine;
        if (state === 'safe') return powerOff();
        if (state === 'off' || state === 'unclean') return;
        if (state === 'shutting' || state === 'restarting') {
          ctx.toast('Patience : Windows n’a pas fini de s’arrêter.');
          return;
        }
        if (state === 'dos') return machine.powerCycle();
        machine.unclean();
      };
      deco.handlers.reset = () => {
        const { state } = machine;
        if (state === 'safe') {
          tower.nudge(true);
          return;
        }
        if (['off', 'unclean', 'shutting', 'restarting'].includes(state)) return;
        if (state === 'dos') return machine.powerCycle();
        machine.unclean({ reset: true });
      };
    }

    // ——— Indices : petit coup de projecteur ———

    ctx.hints.onReveal((level) => {
      if (machine.state === 'safe' && level >= 3) tower?.nudge(true);
      if (machine.state === 'desktop' && shell && level <= 2) {
        shell.startBtn.classList.remove('is-flash');
        void shell.startBtn.offsetWidth;
        shell.startBtn.classList.add('is-flash');
      }
    });

    machine.boot().catch(() => {});

    return () => {
      machine.destroy();
      leaveDos();
      destroyShell();
      tower?.nudge(false);
    };
  },
};
