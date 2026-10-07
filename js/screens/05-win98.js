// Écran 5 — Windows 98 (étape éclair) : se connecter à Internet par le modem,
// puis taper dans le navigateur l'adresse imprimée sur la pochette du CD
// d'abonnement posé à côté du moniteur. Le modem crisse, la page arrive ligne
// par ligne… et gare à qui décroche le téléphone pendant la connexion.

import { createShell, fr } from './win9x/shell.js';
import { createApps } from './win9x/apps.js';
import { createMachine } from './win9x/machine.js';
import { createBrowser } from './win9x/browser.js';
import { createTower, createMonitorLed } from './win9x/tower.js';
import { createCd, createPhone, zoomCd, CD_URL } from './win9x/props98.js';
import { ICON16, ICON32 } from './win9x/icons.js';
import { ICONS } from '../ui/icons.js';

const PHONE_NUMBER = '08\u00a060\u00a019\u00a098\u00a098';
const bytes = (n) => n.toLocaleString('fr-FR').replace(/\s/g, '\u00a0');
const IDLE_PICKUP_MS = 40_000;

const README = `Lisezmoi.txt — Windows 98

Bienvenue dans Windows 98 !

Le navigateur Web fait désormais partie de Windows : le bureau,
les dossiers et Internet se parcourent de la même façon.

Pour aller sur Internet :
1. Double-cliquez sur « Connexion à Internet » ;
2. Patientez pendant que le modem compose le numéro ;
3. Tapez l’adresse du site dans la zone Adresse du navigateur.

Attention : tant que vous êtes connecté, la ligne téléphonique
est occupée.`;

const SHOPPING = `Liste de courses

- un modem 56K (le 33,6K, c’est fini !)
- une rallonge de câble téléphonique
- des CD vierges ? Un graveur, c’est encore trop cher
- un scanner USB (attention aux démonstrations publiques…)`;

const JOURNAL = `Journal du voyageur

1995 : j’ai appuyé sur « Démarrer »… pour arrêter.
1998 : un CD d’abonnement m’attendait dans la boîte aux lettres.
         50 heures gratuites ! Reste à brancher le modem.`;

const BSOD_98 = [
  'Une exception fatale 0E s’est produite à 0028:C0FFEE98 dans VxD',
  'MALADRESSE(03) + 00000003. L’application en cours va être arrêtée.',
  '',
  '*  Appuyez sur une touche pour revenir à l’application en cours.',
  '*  Appuyez sur CTRL+ALT+SUPPR pour redémarrer votre ordinateur.',
  '   Vous perdrez toute information non enregistrée dans les',
  '   applications.',
];

const BSOD_USB = [
  'Une exception fatale 0E s’est produite à 0028:C0021998 dans VxD',
  'USBHUB(01) + 00000420. L’application en cours va être arrêtée.',
  '',
  '*  Appuyez sur une touche pour revenir à l’application en cours.',
  '*  Appuyez sur CTRL+ALT+SUPPR pour redémarrer votre ordinateur.',
  '   Vous perdrez toute information non enregistrée dans les',
  '   applications.',
  '',
  'Périphérique en cause : Scanner USB (pilote de démonstration).',
];

const decorOf = new WeakMap();

export default {
  id: 'win98',
  era: 'Windows 98',
  year: 1998,

  decor(props, ctx) {
    const handlers = {};
    const box = document.createElement('div');
    box.className = 'w98-props';
    props.side.append(box);
    const tower = createTower(box, {
      variant: '98',
      audio: ctx.audio,
      signal: ctx.signal,
      onPower: () => handlers.power?.(),
      onReset: () => handlers.reset?.(),
    });
    const cd = createCd(box, { signal: ctx.signal, onOpen: () => handlers.cd?.() });
    const phone = createPhone(box, { signal: ctx.signal, onUse: () => handlers.phone?.() });
    const led = createMonitorLed(props.bezel);
    decorOf.set(ctx, { tower, cd, phone, led, handlers });
  },

  mount(root, ctx) {
    const { audio } = ctx;
    const deco = decorOf.get(ctx);
    const { tower, cd, phone, led } = deco ?? {};
    root.classList.add('w98');

    let shell = null;
    let apps = null;
    let browser = null;
    let welcomeAtBoot = true;
    let net = 'offline'; // offline | dialing | online
    let modem = null;
    let dialWin = null;
    let idleTimer = 0;
    let doneTimer = 0;
    let connectedAt = 0;
    let solved = false;
    let leaving = false;
    let cdSeen = false;
    let scannerBusy = false;

    const machine = createMachine(root, ctx, {
      variant: '98',
      tower,
      led,
      bsodLines: BSOD_98,
      onBuild: () => buildDesktop(),
      onDestroy: () => destroyShell(),
      onReady: () => welcomeAtBoot && welcome(),
      onPowerLoss: () => {
        shell?.menus.closeSilently();
        hangup({ silent: true });
        // La page n'avait pas fini de s'afficher : tout est à refaire.
        ctx.clear(doneTimer);
        solved = false;
      },
      onBsod: () => shell?.menus.closeSilently(),
    });
    const { view } = machine;

    function destroyShell() {
      ctx.clear(idleTimer);
      browser?.destroy();
      shell?.destroy();
      shell = null;
      apps = null;
      browser = null;
      dialWin = null;
    }

    // ——— Bureau ———

    function startItems() {
      const small = apps?.smallIcons;
      return [
        { label: 'Mise à jour de Windows', icon: small ? ICON16.globe : ICON32.update, run: () => update() },
        '-',
        {
          label: '&Programmes',
          icon: small ? ICON16.folder : ICON32.programs,
          sub: () =>
            apps.programs([
              {
                label: 'Internet',
                icon: ICON16.folder,
                sub: [
                  { label: 'Connexion à Internet', icon: ICON16.dialup, run: () => dial() },
                  { label: 'Navigateur Web', icon: ICON16.browser, run: () => openBrowser() },
                ],
              },
            ]),
        },
        {
          label: 'Fa&voris',
          icon: small ? ICON16.favorites : ICON32.favorites,
          sub: [
            { label: 'Chaînes', icon: ICON16.folder, sub: [] },
            { label: 'Liens', icon: ICON16.folder, sub: [] },
            { label: 'Mes documents', icon: ICON16.folder, run: () => apps.myDocuments() },
          ],
        },
        { label: '&Documents', icon: small ? ICON16.doc : ICONS.documents, sub: () => apps.documents() },
        { label: 'Para&mètres', icon: small ? ICON16.control : ICON32.settings, sub: () => apps.settings() },
        { label: '&Rechercher', icon: small ? ICON16.find : ICON32.find, sub: () => apps.findMenu([{ label: 'Sur &Internet…', icon: ICON16.globe, run: () => openBrowser() }]) },
        { label: 'A&ide', icon: small ? ICON16.help : ICON32.help, run: () => apps.help() },
        { label: '&Exécuter…', icon: small ? ICON16.run : ICON32.run, run: () => apps.run() },
        '-',
        { label: '&Fermer la session voyageur…', icon: small ? ICON16.run : ICON32.logoff, run: () => logoff() },
        { label: '&Arrêter…', icon: small ? ICON16.shutdown : ICON32.shutdown, run: () => shutdownDialog() },
      ];
    }

    function buildDesktop() {
      destroyShell();
      net = 'offline';
      shell = createShell(view.host, ctx, {
        variant: '98',
        banner: '<b>Windows</b>98',
        date: 'jeudi 25 juin 1998',
        start: startItems,
        smallIcons: () => apps?.smallIcons,
        onDesktopProperties: () => apps.display(),
        onTaskbarProperties: () => apps.taskbarProps(),
        openNew: (kind, label) =>
          kind === 'folder' ? shell.alert({ title: label, text: 'Ce dossier est vide.', icon: 'info' }) : apps.notepad(label.replace(/\.\w+$/, ''), ''),
        quick: [
          { label: 'Afficher le Bureau', icon: ICON16.desktop, run: () => shell.minimizeAll() },
          { label: 'Lancer le Navigateur Web', icon: ICON16.browser, run: () => openBrowser() },
          { label: 'Lancer la messagerie', icon: ICON16.mail, run: () => mail() },
        ],
        icons: [
          { label: 'Poste de travail', svg: ICONS.computer, x: 4, y: 4, type: 'a', open: () => apps.computer() },
          { label: 'Mes documents', svg: ICONS.documents, x: 4, y: 74, type: 'b', open: () => apps.myDocuments() },
          { label: 'Navigateur Web', svg: ICONS.globe, x: 4, y: 144, type: 'c', open: () => openBrowser() },
          { label: 'Corbeille', svg: ICONS.trash, x: 4, y: 214, type: 'd', open: () => apps.recycle() },
          { label: 'Connexion à Internet', svg: ICONS.dialup, x: 4, y: 284, type: 'e', open: () => dial() },
          { label: 'Scanner USB', svg: ICON32.scanner, x: 4, y: 354, type: 'f', open: () => scanner() },
        ],
      });
      apps = createApps(shell, ctx, {
        variant: '98',
        tower,
        readme: README,
        shopping: SHOPPING,
        journal: JOURNAL,
        date: '25/06/1998',
        online: () => net === 'online',
        onDialup: () => dial(),
        onScandisk: () => shell.alert({ title: 'ScanDisk - (C:)', text: 'ScanDisk n’a trouvé aucune erreur sur le lecteur C:.', icon: 'info' }),
        onUrl: (raw) => openBrowser(raw),
      });
      browser = createBrowser(shell, ctx, {
        tower,
        online: () => net === 'online',
        onTyping: () => armIdle(),
        onNavigate: () => armIdle(),
        onError: () => ctx.error(),
        onSolutionStart: () => solving(),
        onSolutionLoaded: () => {
          doneTimer = ctx.timeout(() => leave(), 7000);
        },
        onEnter: () => leave(),
      });
      return shell;
    }

    function mail() {
      shell.alert({
        title: 'Messagerie',
        text: net === 'online' ? 'Aucun nouveau message.\nVos amis n’ont pas encore d’adresse électronique !' : 'Connectez-vous d’abord à Internet pour relever votre courrier.',
        icon: 'info',
      });
    }

    function update() {
      shell.alert({
        title: 'Mise à jour de Windows',
        text: net === 'online' ? 'Votre ordinateur est à jour… pour 1998.' : 'La mise à jour de Windows passe par Internet : connectez-vous d’abord.',
        icon: 'info',
      });
    }

    function openBrowser(url) {
      browser?.open(url);
    }

    // ——— Fenêtre de bienvenue ———

    function welcome() {
      if (!shell) return;
      const win = shell.desk.open({
        id: 'welcome',
        title: 'Bienvenue dans Windows 98',
        icon: ICON16.welcome,
        w: 460,
        h: 'auto',
        center: true,
        controls: { min: false, max: false },
        className: 'w98-welcome',
        body: `
          <header class="w98-welcome-head"><span>Bienvenue dans</span> <b>Windows 98</b></header>
          <div class="w98-welcome-main">
            <nav class="w98-welcome-nav">
              <button type="button" data-act="dial">${ICON16.dialup}<span>Se connecter à Internet</span></button>
              <button type="button" data-act="discover">${ICON16.welcome}<span>Découvrir Windows 98</span></button>
              <button type="button" data-act="care">${ICON16.scandisk}<span>Entretenir votre ordinateur</span></button>
            </nav>
            <div class="w98-welcome-text">
              <h3>Le monde entier au bout du fil !</h3>
              <p>Pour quitter 1998, rendez-vous sur le site de votre fournisseur d’accès.</p>
              <p>Votre kit de connexion est arrivé par la poste : tout est écrit sur la <b>pochette du CD</b>.</p>
            </div>
          </div>
          <div class="w95-welcome-foot">
            <label class="w9x-check"><input type="checkbox" ${welcomeAtBoot ? 'checked' : ''}> <span>Afficher cet écran à chaque démarrage de Windows 98</span></label>
            <button type="button" class="wm-push is-default" data-act="close">Fermer</button>
          </div>`,
      });
      win.body.querySelector('input[type=checkbox]').addEventListener('change', (event) => {
        welcomeAtBoot = event.target.checked;
      });
      win.body.addEventListener('click', (event) => {
        const act = event.target.closest('[data-act]')?.dataset.act;
        if (act === 'close') win.close();
        else if (act === 'dial') dial();
        else if (act === 'discover') apps.help();
        else if (act === 'care') apps.defrag();
      });
      setTimeout(() => !win.closed && win.body.querySelector('[data-act="close"]').focus({ preventScroll: true }), 50);
    }

    // ——— Connexion à Internet par le modem ———

    async function dial() {
      if (!shell || solved) return;
      if (net === 'online') return statusWindow();
      if (net === 'dialing') return dialWin?.restore();
      const existing = shell.desk.windows.find((w) => w.spec.id === 'dun');
      if (existing) return existing.restore();
      ctx.progress();
      const dlg = shell.dialog({
        title: 'Connexion à Saut Temporel Online',
        icon: ICON16.dialup,
        width: 360,
        modal: false,
        taskbar: true,
        buttons: ['Se &connecter', '&Propriétés', 'Annuler'],
        cancelButton: 2,
        className: 'w98-dun',
        body: `
          <div class="w98-dun-head">${ICONS.dialup}<b>Saut Temporel Online</b></div>
          <label class="w9x-field-row"><span><u>N</u>om d’utilisateur :</span><span class="w9x-input win9x-field"><input type="text" name="user" value="voyageur" autocomplete="off" autocapitalize="none" spellcheck="false"></span></label>
          <label class="w9x-field-row"><span><u>M</u>ot de passe :</span><span class="w9x-input win9x-field"><input type="password" name="pass" value="saut98" autocomplete="off"></span></label>
          <div class="w9x-field-row"><span></span><label class="w9x-check"><input type="checkbox" checked> <span><u>E</u>nregistrer le mot de passe</span></label></div>
          <label class="w9x-field-row"><span>N° de <u>t</u>éléphone :</span><span class="w9x-input win9x-field"><input type="text" name="tel" value="${PHONE_NUMBER}" inputmode="tel" autocomplete="off"></span></label>
          <div class="w9x-field-row"><span><u>A</u>ppel depuis :</span><span class="w9x-combo">Nouvel emplacement</span></div>`,
        onButton: (button) => {
          if (button !== 'Propriétés') return true;
          shell.alert({ title: 'Saut Temporel Online', text: 'Modem : modem standard 56 000 bit/s sur COM2.\nNuméro : ' + PHONE_NUMBER + '\n\nTout est déjà réglé : il suffit de cliquer sur « Se connecter ».', icon: 'info' });
          return false;
        },
      });
      dlg.win.spec.id = 'dun';
      setTimeout(() => dlg.win.body.querySelector('.wm-push.is-default')?.focus({ preventScroll: true }), 60);
      const { button, form } = await dlg.result;
      if (button !== 'Se connecter' || !shell) return;
      connect(form.elements.tel.value.replace(/\D/g, '') || PHONE_NUMBER.replace(/\D/g, ''));
    }

    async function connect(number) {
      const stale = machine.flow();
      net = 'dialing';
      ctx.progress();
      modem = audio.modem(number.slice(0, 10).padEnd(10, '0'));
      const total = (modem.duration ?? 8.4) * 1000;
      dialWin = shell.desk.open({
        id: 'dialing',
        title: 'Connexion à Saut Temporel Online',
        icon: ICON16.dialup,
        w: 330,
        h: 'auto',
        center: true,
        controls: { min: true, max: false, close: false },
        className: 'w98-dialing',
        body: `<div class="w9x-dlg">
          <div class="w98-dial-anim" aria-hidden="true">${ICONS.computer}<span class="w98-dial-dots"><i></i><i></i><i></i><i></i><i></i></span>${ICONS.network}</div>
          <p class="w98-dial-status" role="status" aria-live="polite">État : Numérotation…</p>
          <div class="w9x-dlg-buttons"><button type="button" class="wm-push is-default" data-act="cancel">Annuler</button></div>
        </div>`,
      });
      const statusEl = dialWin.body.querySelector('.w98-dial-status');
      dialWin.body.querySelector('[data-act="cancel"]').addEventListener('click', () => {
        machine.flow();
        hangup();
      });
      tower?.disk(0.4);
      const steps = [
        [0, `État : Numérotation du ${PHONE_NUMBER}…`],
        [total * 0.6, 'État : Vérification du nom d’utilisateur et du mot de passe…'],
        [total * 0.86, 'État : Ouverture d’une session sur le réseau…'],
      ];
      let elapsed = 0;
      for (const [at, text] of steps) {
        await ctx.wait(at - elapsed);
        elapsed = at;
        if (stale() || net !== 'dialing') return;
        statusEl.textContent = fr(text);
      }
      await ctx.wait(total - elapsed);
      if (stale() || net !== 'dialing') return;
      statusEl.textContent = fr('État : Connecté à 56 000 bit/s');
      dialWin.el.classList.add('is-connected');
      net = 'online';
      connectedAt = Date.now();
      modem = null;
      ctx.progress();
      audio.ding();
      shell.tray.add('modem', {
        html: `<span class="w98-modem">${ICON16.modem}<i></i><i></i></span>`,
        label: 'Connecté à Saut Temporel Online à 56 000 bit/s',
        onOpen: () => statusWindow(),
      });
      await ctx.wait(1300);
      if (stale()) return;
      dialWin?.close();
      dialWin = null;
      // La connexion établie, le navigateur s'ouvre sur une page vide.
      openBrowser();
      armIdle();
    }

    function statusWindow() {
      if (net !== 'online' || !shell) return;
      const existing = shell.desk.windows.find((w) => w.spec.id === 'netstat');
      if (existing) return existing.restore();
      const seconds = Math.round((Date.now() - connectedAt) / 1000);
      const dur = `${String(Math.floor(seconds / 3600)).padStart(3, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      const dlg = shell.dialog({
        title: 'Connecté à Saut Temporel Online',
        icon: ICON16.dialup,
        width: 320,
        modal: false,
        taskbar: true,
        buttons: ['OK', '&Déconnecter'],
        className: 'w98-netstat',
        body: `<div class="w98-netstat-body">${ICONS.dialup}<dl>
          <dt>Connecté à</dt><dd>56 000 bit/s</dd>
          <dt>Durée</dt><dd>${dur}</dd>
          <dt>Octets reçus</dt><dd>${bytes(18_432 + seconds * 611)}</dd>
          <dt>Octets envoyés</dt><dd>${bytes(4_096 + seconds * 97)}</dd>
        </dl></div>`,
      });
      dlg.win.spec.id = 'netstat';
      dlg.result.then(({ button }) => button === 'Déconnecter' && hangup());
    }

    // Raccrocher : la ligne est libérée, le navigateur n'a plus rien à charger
    function hangup({ silent = false } = {}) {
      const wasOnline = net !== 'offline';
      modem?.stop();
      modem = null;
      net = 'offline';
      ctx.clear(idleTimer);
      if (dialWin && !dialWin.closed) dialWin.close();
      dialWin = null;
      shell?.tray.remove('modem');
      shell?.desk.windows.find((w) => w.spec.id === 'netstat')?.close();
      if (wasOnline && !silent) browser?.connectionLost();
    }

    // Personne ne tape l'adresse ? Quelqu'un décroche le téléphone…
    function armIdle() {
      ctx.clear(idleTimer);
      if (net !== 'online' || solved) return;
      idleTimer = ctx.timeout(() => pickup(), IDLE_PICKUP_MS);
    }

    async function pickup({ byPlayer = false } = {}) {
      if (!shell || solved) return;
      const online = net !== 'offline';
      phone?.lift(true);
      audio.noise({ type: 'bandpass', freq: 1800, q: 0.7, attack: 0.01, hold: 0.5, release: 0.3, vol: 0.12 });
      audio.tone({ freq: 2100, to: 900, glide: 0.5, attack: 0.01, hold: 0.3, release: 0.2, vol: 0.04, type: 'square', filter: { freq: 2600 } });
      if (byPlayer) phone?.say(fr(online ? 'Kshhhh… criii… Ah ! C’est le modem…' : 'Tuuut… La ligne est libre.'), 2600);
      else phone?.say(fr('Allô ? Qui est sur la ligne ?'), 3600);
      if (!online) {
        audio.tone({ freq: 440, attack: 0.02, hold: 1.2, release: 0.1, vol: 0.04 });
        await ctx.wait(1800);
        phone?.lift(false);
        return;
      }
      await ctx.wait(900);
      hangup();
      audio.beep(480, 0.25);
      await ctx.wait(500);
      if (!shell) return;
      const dlg = shell.dialog({
        title: 'Connexion à Saut Temporel Online',
        icon: ICON16.dialup,
        width: 330,
        buttons: ['Se &reconnecter', 'Fermer'],
        cancelButton: 1,
        body: `<div class="wm-msg">${shell.msgIcon('warning')}<p class="wm-msg-text">La connexion a été interrompue : quelqu’un a décroché le téléphone !<br><br>Tant que le modem occupe la ligne, impossible de téléphoner en même temps.</p></div>`,
      });
      ctx.timeout(() => phone?.lift(false), 2600);
      const { button } = await dlg.result;
      if (button === 'Se reconnecter') dial();
    }

    // ——— Le CD d'abonnement ———

    function showCd() {
      audio.click();
      cd?.nudge(false);
      const added = ctx.note(CD_URL, { key: 'win98-url', label: 'Adresse sur le CD' });
      if (!cdSeen || added) ctx.progress();
      cdSeen = true;
      zoomCd({ signal: ctx.signal });
    }

    // ——— Le scanner USB d'avril 1998 ———

    async function scanner() {
      if (scannerBusy || machine.state !== 'desktop' || !shell) return;
      scannerBusy = true;
      const win = shell.desk.open({
        title: 'Nouveau matériel détecté',
        icon: ICON16.scanner,
        w: 300,
        h: 'auto',
        center: true,
        controls: { min: false, max: false, close: false },
        className: 'w98-newhw',
        body: `<div class="w9x-dlg"><div class="w98-newhw-row">${ICON32.scanner}<div><p><b>Scanner USB</b></p><p>Windows installe le logiciel de ce périphérique…</p></div></div><div class="w9x-meter"><i></i></div></div>`,
      });
      const bar = win.body.querySelector('.w9x-meter i');
      tower?.disk(1.5);
      for (let p = 0; p <= 72; p += 8) {
        bar.style.width = `${p}%`;
        await ctx.wait(160);
      }
      if (win.closed || !shell) {
        scannerBusy = false;
        return;
      }
      win.close();
      const done = await machine.bsod(BSOD_USB);
      scannerBusy = false;
      if (!done || !shell) return;
      ctx.toast(fr('Clin d’œil historique : en avril 1998, Windows 98 a planté ainsi en pleine démonstration publique, au branchement d’un scanner USB.'), { icon: 'hint', duration: 7000 });
    }

    // ——— Arrêter ? C'était la sortie de 1995 ———

    async function shutdownDialog() {
      if (machine.state !== 'desktop' || !shell) return;
      audio.ding();
      const dlg = shell.dialog({
        title: 'Arrêt de Windows',
        layer: 'sys',
        dither: true,
        width: 340,
        buttons: ['OK', 'Annuler', '&Aide'],
        cancelButton: 1,
        className: 'w95-shutdown',
        body: `<div class="w95-shut">
          <span class="w95-shut-icon">${ICON32.shutdown}</span>
          <fieldset>
            <legend>Que voulez-vous que l’ordinateur fasse ?</legend>
            ${['Mettre en veille', 'Arrêter', 'Redémarrer', 'Redémarrer en mode MS-DOS']
              .map((label, i) => `<label class="w9x-radio"><input type="radio" name="how" value="${i}" ${i === 1 ? 'checked' : ''}><span>${label}</span></label>`)
              .join('')}
          </fieldset>
        </div>`,
        onButton: (button) => {
          if (button !== 'Aide') return true;
          apps.help();
          return false;
        },
      });
      const { button } = await dlg.result;
      if (button !== 'OK' || !shell) return;
      machine.wrong();
      await shell.alert({
        title: 'Arrêt de Windows',
        text: 'Éteindre ? C’était la sortie de 1995 !\n\nEn 1998, l’avenir passe par Internet : connectez-vous, puis rendez-vous à l’adresse de votre fournisseur d’accès.',
        icon: 'warning',
      });
      machine.maybeBsod();
    }

    async function logoff() {
      const { button } = await shell.dialog({
        title: 'Fermer la session Windows',
        width: 300,
        buttons: ['&Oui', '&Non'],
        body: `<div class="wm-msg">${ICON32.keys}<p class="wm-msg-text">Voulez-vous vraiment fermer la session ?</p></div>`,
      }).result;
      if (button !== 'Oui' || !shell) return;
      shell.alert({ title: 'Windows', text: 'Session fermée… et rouverte aussitôt : le voyageur, c’est vous !\nChanger de session ne change pas d’époque.', icon: 'info' });
    }

    // ——— La page est trouvée : cap sur 2001 ———

    function solving() {
      if (solved) return;
      solved = true;
      ctx.clear(idleTimer);
      ctx.progress();
    }

    async function leave() {
      if (leaving) return;
      leaving = true;
      ctx.clear(doneTimer);
      shell?.busy(1500, 'working');
      audio.success();
      await ctx.wait(700);
      ctx.complete();
    }

    // ——— Accessoires autour de l'écran ———

    if (deco) {
      deco.handlers.cd = () => showCd();
      deco.handlers.phone = () => {
        if (machine.state !== 'desktop') return phone?.say('Tuuut…', 1200);
        pickup({ byPlayer: true });
      };
      deco.handlers.power = () => {
        const { state } = machine;
        if (state === 'unclean' || leaving) return;
        machine.unclean();
      };
      deco.handlers.reset = () => {
        if (machine.state === 'unclean' || leaving) return;
        machine.unclean({ reset: true });
      };
    }

    ctx.hints.onReveal((level) => {
      if (level >= 2) cd?.nudge(true);
    });

    machine.boot().catch(() => {});

    return () => {
      machine.destroy();
      modem?.stop();
      destroyShell();
    };
  },
};
