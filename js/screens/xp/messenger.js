// Messagerie instantanée « dans l'esprit » des années 2000 : liste de contacts,
// conversation qui clignote dans la barre des tâches, notifications qui glissent
// au-dessus de l'horloge, émoticônes animées, réponse automatique… et le Wizz,
// seul moyen de réveiller un contact « Absent ».

import { onDoubleActivate } from '../../ui/windows.js';
import { SMILEYS, avatar, emotify, esc, icon, smiley, status as statusIcon, tool } from './art.js';
import { TASKBAR_H } from './shell.js';

const ME = 'Voyageur';

const NICK = {
  away: '~*~ Kev1n ~*~ ¤ absent ¤ jte rep + tard ;)',
  online: '~*~ Kev1n ~*~ ¤ réveillé ¤ ♫ Kyo - Le chemin',
};

const AUTO = '[Réponse automatique] chui pa là, jte rep + tard ;)';

const HISTORY = [
  'yo le voyageur du temps (H)',
  'ta trouvé la sortie de 2001 ? :P',
  'bon jvais faire 1 ptite sieste |-)',
  'jte donne la sortie quand tu me réveilles lol',
];

// Réveil : [délai de frappe en ms, message]
const WAKE = [
  [1100, "WAAAH !! tu m'as fé tomber de ma chaise avec ton wizz xD"],
  [1700, "ok ok promis c promis : la sortie c'est 2006 !! ya 1 manchot ki t'attend là-bas ;)"],
  [1000, 'et ressors ton mot de passe de 1974, il va servir... @+ (H)'],
];

const OTHERS = [
  {
    nick: '♥ Mél@nie ♥ vive les vacances !!!',
    status: 'online',
    text: 'Mél@nie est en ligne… mais c’est Kev1n qui connaît la sortie.',
  },
  {
    nick: '[DJ] Thomas ♫ Tragédie - Hey Oh',
    status: 'busy',
    text: 'Thomas est Occupé : il prépare sa compil pour samedi.',
  },
];

const OFFLINE = ['Maman', 'Juju ^^', 'Seb [CS] le boss', 'Mme Martin (techno)'];

const LABEL = { online: 'En ligne', away: 'Absent', busy: 'Occupé', offline: 'Hors ligne' };

const COLORS = ['#000000', '#0047ab', '#d81b2a', '#1d8a2b', '#8e24aa', '#ef6c00', '#d81b78', '#00838f'];

// Boutons de la barre d'outils : réponse quand le contact dort
const TOOLS = [
  ['invite', 'Inviter', 'Mél@nie est en ligne, mais elle ne connaît pas la sortie.'],
  ['sendfile', 'Envoyer des fichiers', 'Le transfert attend que ~*~ Kev1n ~*~ l’accepte… mais il est Absent.'],
  ['webcam', 'Webcam', 'Invitation webcam envoyée. Pas de réponse : ~*~ Kev1n ~*~ est Absent.'],
  ['audio', 'Audio', 'Conversation audio impossible : ~*~ Kev1n ~*~ est Absent.'],
  ['activities', 'Activités', 'Aucune activité possible tant que ~*~ Kev1n ~*~ ne répond pas.'],
  ['games', 'Jeux', 'Partie de dames proposée… ~*~ Kev1n ~*~ ne répond pas.'],
];

export function createMessenger({ ui, desk, shell, ctx, view }) {
  const { audio } = ctx;
  let state = 'away';
  let chat = null;
  let list = null;
  let sent = 0;
  let waking = false;
  let lastWizz = 0;
  let color = COLORS[0];
  let hinted = false;
  let typingNow = false;
  let lastTime = '23:41';
  const log = [
    ...HISTORY.map((text) => ({ type: 'msg', from: 'kev', nick: NICK.away, text })),
    { type: 'info', text: `${NICK.away} a le statut Absent et risque de ne pas vous répondre.` },
  ];

  const nick = () => (state === 'away' ? NICK.away : NICK.online);
  const live = (win) => win && !win.closed;
  const small = () => view.w < 800;

  // ——— Notifications au-dessus de l'horloge ———

  const toasts = document.createElement('div');
  toasts.className = 'xp-toasts';
  ui.append(toasts);

  function toast({ pic = 'guitar', html, onOpen }) {
    const el = document.createElement('div');
    el.className = 'xp-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <div class="xp-toast-head">${icon('messenger', 14)}<span>Messagerie</span>
        <button type="button" class="xp-toast-x" aria-label="Fermer la notification"></button></div>
      <button type="button" class="xp-toast-body"><span class="xp-dp xp-dp-toast">${avatar(pic, 36)}</span><span class="xp-toast-text">${html}</span></button>`;
    toasts.prepend(el);
    void el.offsetWidth;
    el.classList.add('is-in');
    const close = () => {
      if (!el.isConnected || el.classList.contains('is-out')) return;
      el.classList.remove('is-in');
      el.classList.add('is-out');
      ctx.timeout(() => el.remove(), 450);
    };
    el.querySelector('.xp-toast-x').addEventListener('click', close);
    el.querySelector('.xp-toast-body').addEventListener('click', () => {
      audio.click();
      close();
      onOpen?.();
    });
    ctx.timeout(close, 7000);
    while (toasts.children.length > 3) toasts.lastElementChild.remove();
    return close;
  }

  // ——— Historique de la conversation ———

  function entryHtml(entry, prev) {
    if (entry.type === 'msg') {
      const cont = prev?.type === 'msg' && prev.from === entry.from && prev.nick === entry.nick;
      const who = entry.from === 'me' ? ME : entry.nick;
      return `<div class="xp-msg xp-msg-${entry.from}${cont ? ' is-cont' : ''}">
        ${cont ? '' : `<p class="xp-msg-head">${emotify(who, 15)} dit :</p>`}
        <p class="xp-msg-text"${entry.color ? ` style="color:${entry.color}"` : ''}>${emotify(entry.text)}</p></div>`;
    }
    if (entry.type === 'wizz') {
      return `<p class="xp-msg-sys xp-msg-wizz">${tool('wizz', 15)}<b>${entry.from === 'me' ? 'Vous avez envoyé un Wizz !' : `${emotify(entry.nick, 14)} vous a envoyé un Wizz !`}</b></p>`;
    }
    return `<p class="xp-msg-sys">${icon(entry.kind ?? 'info', 14)}<span>${emotify(entry.text, 14)}</span></p>`;
  }

  const historyEl = () => (live(chat) ? chat.body.querySelector('.xp-im-history') : null);

  function push(entry) {
    const prev = log.at(-1);
    log.push(entry);
    const history = historyEl();
    if (history) {
      history.insertAdjacentHTML('beforeend', entryHtml(entry, prev));
      history.scrollTop = history.scrollHeight;
    }
    if (entry.type === 'msg' && entry.from === 'kev') {
      lastTime = shell.time();
      if (!typingNow) setStatusBar();
      if (!live(chat) || chat.minimized || !chat.el.classList.contains('is-active')) {
        audio.ding();
        if (live(chat)) shell.flash(chat, true);
      } else {
        audio.tap();
      }
    }
  }

  function setStatusBar(html) {
    const bar = live(chat) ? chat.el.querySelector('.wm-status') : null;
    if (bar) bar.innerHTML = html ?? `Dernier message reçu le 14/05/2005 à ${lastTime}.`;
  }

  function typing(on) {
    typingNow = on;
    setStatusBar(
      on ? `${icon('pencil', 13)}<span>${emotify(nick(), 13)} est en train d’écrire un message…</span>` : undefined,
    );
    chat?.el.classList.toggle('is-typing', on);
  }

  // ——— Fenêtre de conversation ———

  function chatHtml() {
    const away = state === 'away';
    return `<div class="xp-im xp-chat">
      <div class="xp-im-tools" role="toolbar" aria-label="Actions">${TOOLS.map(
        ([ic, label], i) =>
          `<button type="button" class="xp-im-tool" data-tool="${i}" title="${esc(label)}">${icon(ic, 26)}<span>${esc(label)}</span></button>`,
      ).join('')}</div>
      <div class="xp-im-to"><span class="xp-im-to-label">À :</span>${statusIcon(away ? 'away' : 'online', 13)}
        <span class="xp-im-to-nick">${emotify(nick(), 14)}</span><span class="xp-im-to-st">(${LABEL[away ? 'away' : 'online']})</span></div>
      <div class="xp-im-main">
        <div class="xp-im-left">
          <div class="xp-im-history" role="log" aria-live="polite" aria-label="Conversation" tabindex="0">${log
            .map((entry, i) => entryHtml(entry, log[i - 1]))
            .join('')}</div>
          <div class="xp-im-format" role="toolbar" aria-label="Mise en forme">
            <button type="button" class="xp-im-fmt" data-fmt="font" title="Changer la couleur du texte" aria-label="Couleur du texte">${tool('font', 18)}</button>
            <button type="button" class="xp-im-fmt" data-fmt="emo" title="Émoticônes" aria-label="Émoticônes">${tool('emoticons', 18)}</button>
            <button type="button" class="xp-im-fmt" data-fmt="winks" title="Clins d’œil" aria-label="Clins d’œil">${tool('winks', 18)}</button>
            <button type="button" class="xp-im-fmt xp-wizz-btn" data-fmt="wizz" title="Envoyer un Wizz">${tool('wizz', 18)}<span>Wizz</span></button>
            <i class="xp-im-fmt-sep"></i>
            <button type="button" class="xp-im-fmt" data-fmt="background" title="Arrière-plans" aria-label="Arrière-plans">${tool('background', 18)}</button>
            <button type="button" class="xp-im-fmt" data-fmt="voice" title="Message vocal" aria-label="Message vocal">${tool('voice', 18)}</button>
          </div>
          <div class="xp-im-compose">
            <div class="xp-im-input"><textarea rows="3" aria-label="Votre message" spellcheck="false" autocomplete="off" enterkeyhint="send"></textarea></div>
            <button type="button" class="xp-im-send">Envoyer</button>
          </div>
        </div>
        <aside class="xp-im-pics" aria-hidden="true">
          <span class="xp-dp xp-dp-them${away ? ' is-away' : ''}">${avatar('guitar', 96)}<span class="xp-zzz"><i>z</i><i>z</i><i>Z</i></span></span>
          <span class="xp-dp xp-dp-me">${avatar('duck', 96)}</span>
        </aside>
      </div>
    </div>`;
  }

  function openChat({ minimized = false } = {}) {
    if (live(chat)) {
      if (!minimized) chat.restore();
      return chat;
    }
    const w = Math.min(600, view.w - 16);
    const h = Math.min(520, view.h - TASKBAR_H - 16);
    chat = desk.open({
      id: 'chat',
      title: `${nick()} - Conversation`,
      icon: icon('messenger', 16),
      x: Math.max(8, Math.round((view.w - w) / 2) - (view.w >= 1000 ? 126 : 0)),
      y: Math.max(8, Math.round((view.h - TASKBAR_H - h) / 2) - (view.w >= 1000 ? 70 : 0)),
      w,
      h,
      maximized: small(),
      menu: ['&Fichier', '&Édition', '&Actions', '&Outils', '&?'],
      status: '',
      className: 'xp-im-win xp-chat-win',
      inactive: minimized,
      body: chatHtml(),
    });
    chat.autoMax = small();
    setStatusBar();
    if (minimized) chat.minimize();
    bindChat(chat);
    // Les menus déclenchent les mêmes boutons que les barres d'outils
    const useTool = (i) => () => chat.body.querySelector(`[data-tool="${i}"]`)?.click();
    const useFmt = (name) => () => chat.body.querySelector(`[data-fmt="${name}"]`)?.click();
    shell.menus(chat, [
      [
        { label: 'Envoyer un fichier ou une photo…', run: useTool(1) },
        '-',
        { label: 'Fermer', run: () => chat?.close() },
      ],
      [
        { label: 'Annuler', disabled: true },
        '-',
        { label: 'Couper', disabled: true },
        { label: 'Copier', disabled: true },
        { label: 'Coller', disabled: true },
      ],
      [
        { label: 'Inviter un contact à cette conversation…', run: useTool(0) },
        { label: 'Envoyer un Wizz', run: useFmt('wizz') },
        '-',
        { label: 'Démarrer une conversation vidéo', run: useTool(2) },
        { label: 'Démarrer une conversation audio', run: useTool(3) },
      ],
      [
        { label: 'Émoticônes…', run: useFmt('emo') },
        { label: 'Couleur du texte…', run: useFmt('font') },
      ],
      [
        {
          label: 'À propos de la Messagerie',
          run: () =>
            shell.balloon(chat.titlebar, {
              title: 'Messagerie 7.0',
              text: 'Recréation pédagogique « dans l’esprit » des messageries instantanées des années 2000.',
            }),
        },
      ],
    ]);
    chat.on('restore', () => shell.flash(chat, false));
    chat.on('focus', () => {
      shell.flash(chat, false);
      afterOpen();
    });
    chat.on('close', () => {
      closePops();
      chat = null;
    });
    if (!minimized) afterOpen();
    return chat;
  }

  let opened = false;
  let closeNews = null;
  function afterOpen() {
    closeNews?.();
    const history = historyEl();
    if (history) history.scrollTop = history.scrollHeight;
    if (!opened) {
      opened = true;
      ctx.progress();
    }
    // Comme à l'époque, la fenêtre activée donne la main à la zone de saisie
    // (sauf au tactile : inutile d'ouvrir le clavier virtuel d'office)
    if (ctx.touch || waking) return;
    setTimeout(() => {
      if (!live(chat) || chat.minimized || chat.el.contains(document.activeElement)) return;
      chat.body.querySelector('textarea')?.focus({ preventScroll: true });
    }, 30);
  }

  function bindChat(win) {
    const textarea = win.body.querySelector('textarea');
    textarea.style.color = color;
    textarea.disabled = waking;
    win.body.querySelector('.xp-im-send').disabled = waking;
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    });
    win.body.querySelector('.xp-im-send').addEventListener('click', () => {
      audio.click();
      send();
    });
    win.body.querySelector('.xp-im-tools').addEventListener('click', (event) => {
      const btn = event.target.closest('[data-tool]');
      if (!btn) return;
      audio.click();
      const [id, label, text] = TOOLS[Number(btn.dataset.tool)];
      push({ type: 'info', text: state === 'away' ? text : `${label} : ~*~ Kev1n ~*~ préfère discuter !` });
      // La webcam posée sur l'écran s'allume le temps de l'invitation
      if (id === 'webcam') {
        const cam = ctx.props.bezel.querySelector('.xp-webcam');
        cam?.classList.add('is-on');
        ctx.timeout(() => cam?.classList.remove('is-on'), 4000);
      }
    });
    win.body.querySelector('.xp-im-format').addEventListener('click', (event) => {
      const btn = event.target.closest('[data-fmt]');
      if (!btn) return;
      const fmt = btn.dataset.fmt;
      if (fmt === 'wizz') {
        wizz().catch(() => {});
        return;
      }
      audio.click();
      if (fmt === 'font') togglePop('font', btn);
      else if (fmt === 'emo') togglePop('emo', btn);
      else {
        closePops();
        const what = { winks: 'votre clin d’œil', background: 'votre arrière-plan', voice: 'votre message vocal' }[fmt];
        push({
          type: 'info',
          text:
            state === 'away' ? `${NICK.away} est Absent : il ne verra pas ${what}.` : 'Plus tard : la sortie d’abord !',
        });
      }
    });
    if (ctx.hints.level >= 2) win.el.classList.add('xp-hint-wizz');
  }

  // ——— Petites palettes : couleur du texte et émoticônes ———

  let pop = null;
  function closePops() {
    pop?.remove();
    pop = null;
  }

  function togglePop(kind, anchor) {
    if (pop?.dataset.kind === kind) {
      closePops();
      return;
    }
    closePops();
    pop = document.createElement('div');
    pop.className = `xp-im-pop xp-im-pop-${kind}`;
    pop.dataset.kind = kind;
    pop.innerHTML =
      kind === 'font'
        ? `<p>Couleur du texte</p><div class="xp-im-swatches">${COLORS.map(
            (c) =>
              `<button type="button" style="--c:${c}" data-color="${c}" aria-label="Couleur ${c}"${c === color ? ' aria-pressed="true"' : ''}></button>`,
          ).join('')}</div>`
        : `<div class="xp-im-emos">${Object.entries(SMILEYS)
            .map(
              ([k, s]) =>
                `<button type="button" data-emo="${k}" title="${esc(`${s.label}  ${s.code}`)}">${smiley(k, 22)}</button>`,
            )
            .join('')}</div>`;
    const left = chat.body.querySelector('.xp-im-left');
    left.append(pop);
    pop.style.left = `${Math.max(0, anchor.offsetLeft - 4)}px`;
    pop.addEventListener('click', (event) => {
      const textarea = chat.body.querySelector('textarea');
      const swatch = event.target.closest('[data-color]');
      const emo = event.target.closest('[data-emo]');
      if (swatch) {
        color = swatch.dataset.color;
        textarea.style.color = color;
      } else if (emo) {
        const code = SMILEYS[emo.dataset.emo].code;
        const { selectionStart: a, selectionEnd: b, value } = textarea;
        const before = value.slice(0, a);
        const insert = `${before && !/\s$/.test(before) ? ' ' : ''}${code} `;
        textarea.value = before + insert + value.slice(b);
        textarea.selectionStart = textarea.selectionEnd = a + insert.length;
      } else return;
      audio.click();
      closePops();
      if (!ctx.touch) textarea.focus({ preventScroll: true });
    });
  }

  ctx.on(ui, 'pointerdown', (event) => {
    if (pop && !pop.contains(event.target) && !event.target.closest('[data-fmt="font"], [data-fmt="emo"]')) closePops();
  });
  ctx.on(window, 'keydown', (event) => event.key === 'Escape' && closePops());

  // ——— Écrire : le contact reste absent ———

  function send() {
    if (!live(chat) || waking) return;
    const textarea = chat.body.querySelector('textarea');
    const text = textarea.value.replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!text) return;
    textarea.value = '';
    closePops();
    push({ type: 'msg', from: 'me', nick: ME, text, color: color === COLORS[0] ? null : color });
    sent += 1;
    // Deux essais pour comprendre, ensuite chaque message compte comme une erreur
    if (sent > 2) ctx.error();
    if (state !== 'away') return;
    ctx.timeout(() => {
      if (state === 'away' && !waking) push({ type: 'msg', from: 'kev', nick: NICK.away, text: AUTO });
    }, 900);
    if (sent === 4 && !hinted) {
      hinted = true;
      ctx.timeout(() => {
        if (state === 'away' && !waking)
          push({
            type: 'info',
            kind: 'help',
            text: 'Astuce : un contact ne lit pas vos messages ? Attirez son attention… sa fenêtre pourrait même trembler.',
          });
      }, 2000);
    }
  }

  // ——— Le Wizz ———

  async function wizz() {
    if (!live(chat)) return;
    const now = performance.now();
    if (now - lastWizz < 2500) {
      push({ type: 'info', kind: 'warning', text: 'Vous ne pouvez pas envoyer de Wizz aussi souvent.' });
      return;
    }
    lastWizz = now;
    closePops();
    shake(chat);
    audio.wizz();
    push({ type: 'wizz', from: 'me' });
    ctx.progress();
    if (state !== 'away' || waking) return;
    waking = true;
    chat.el.classList.remove('xp-hint-wizz');
    lock(true);
    await ctx.wait(1300);
    wake();
    await ctx.wait(700);
    for (const [delay, text] of WAKE) {
      typing(true);
      await ctx.wait(delay);
      typing(false);
      push({ type: 'msg', from: 'kev', nick: NICK.online, text });
      await ctx.wait(550);
    }
    ctx.note('Wizz', { key: 'xp-wizz', label: 'Réveille un contact absent' });
    await ctx.wait(1400);
    ctx.complete();
  }

  function shake(win) {
    if (!live(win) || win.minimized) return;
    win.el.classList.remove('xp-wizzing');
    void win.el.offsetWidth;
    win.el.classList.add('xp-wizzing');
    ctx.timeout(() => win.el.classList.remove('xp-wizzing'), 900);
  }

  function lock(on) {
    if (!live(chat)) return;
    chat.body.querySelector('textarea').disabled = on;
    chat.body.querySelector('.xp-im-send').disabled = on;
  }

  // Le contact se réveille : statut, pseudo, cadre de l'image, notification
  function wake() {
    state = 'online';
    audio.online();
    if (live(chat)) {
      chat.setTitle(`${nick()} - Conversation`);
      shell.update(chat);
      const to = chat.body.querySelector('.xp-im-to');
      to.querySelector('.xp-st').outerHTML = statusIcon('online', 13);
      to.querySelector('.xp-im-to-nick').innerHTML = emotify(nick(), 14);
      to.querySelector('.xp-im-to-st').textContent = `(${LABEL.online})`;
      chat.body.querySelector('.xp-dp-them').classList.remove('is-away');
    }
    renderKev();
    toast({ html: `<b>${emotify(NICK.online, 14)}</b> vient de se connecter.`, onOpen: () => openChat() });
  }

  // ——— Liste de contacts ———

  function contactHtml(c, i) {
    return `<li><button type="button" class="xp-contact" data-contact="${i}">${statusIcon(c.status, 14)}
      <span class="xp-contact-nick">${emotify(c.nick, 14)}</span>${c.status !== 'online' && c.status !== 'offline' ? `<span class="xp-contact-st">(${LABEL[c.status]})</span>` : ''}</button></li>`;
  }

  function kevHtml() {
    return contactHtml({ nick: nick(), status: state === 'away' ? 'away' : 'online' }, 'kev').replace(
      '<li>',
      '<li class="xp-contact-kev">',
    );
  }

  function listHtml() {
    return `<div class="xp-im xp-list">
      <header class="xp-list-me">
        <span class="xp-dp xp-dp-mini">${avatar('duck', 38)}</span>
        <div class="xp-list-who">
          <p class="xp-list-name"><b>${ME}</b> <span>(En ligne)</span><i class="xp-caret" aria-hidden="true"></i></p>
          <p class="xp-list-pm">&lt;Tapez un message perso&gt;</p>
        </div>
      </header>
      <div class="xp-list-bar">${icon('mail', 16)}<span>(0)</span><i class="xp-list-bar-sep"></i>${icon('globe', 16)}<span>Mon espace</span></div>
      <div class="xp-list-body" aria-label="Contacts">
        <p class="xp-list-group"><i class="xp-caret" aria-hidden="true"></i>En ligne (3)</p>
        <ul class="xp-list-ul">${kevHtml()}${OTHERS.map(contactHtml).join('')}</ul>
        <p class="xp-list-group"><i class="xp-caret" aria-hidden="true"></i>Hors ligne (${OFFLINE.length})</p>
        <ul class="xp-list-ul">${OFFLINE.map((n, i) => contactHtml({ nick: n, status: 'offline' }, `off-${i}`)).join('')}</ul>
      </div>
      <div class="xp-list-foot">
        <button type="button" class="xp-list-add">${icon('invite', 16)}<span>Ajouter un contact</span></button>
        <div class="xp-list-ad" aria-hidden="true"><b>Sonneries hi-fi !</b><span>Envoie SAUT au 2006*</span><small>*0,34 €/SMS</small></div>
      </div>
    </div>`;
  }

  function renderKev() {
    if (!live(list)) return;
    list.body.querySelector('.xp-contact-kev').outerHTML = kevHtml();
    bindContact(list.body.querySelector('[data-contact="kev"]'));
  }

  function bindContact(btn) {
    btn.addEventListener('pointerdown', () => {
      list.body.querySelectorAll('.xp-contact.is-selected').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
    onDoubleActivate(
      btn,
      () => {
        const id = btn.dataset.contact;
        audio.click();
        if (id === 'kev') openChat();
        else if (id.startsWith('off'))
          shell.balloon(btn, {
            title: 'Contact hors ligne',
            text: 'Ce contact est Hors ligne : il ne recevra pas votre message.',
          });
        else shell.balloon(btn, { title: OTHERS[Number(id)].nick, text: OTHERS[Number(id)].text });
      },
      { signal: ctx.signal },
    );
  }

  function openContacts({ quiet = false } = {}) {
    if (live(list)) {
      list.restore();
      return list;
    }
    const w = Math.min(250, view.w - 16);
    const h = Math.min(476, view.h - TASKBAR_H - 30);
    list = desk.open({
      id: 'contacts',
      title: 'Messagerie',
      icon: icon('messenger', 16),
      x: view.w - w - 14,
      y: Math.max(6, Math.min(26, view.h - TASKBAR_H - h - 6)),
      w,
      h,
      controls: { max: false },
      menu: ['&Fichier', '&Contacts', '&Actions', '&Outils', '&?'],
      className: 'xp-im-win xp-list-win',
      inactive: quiet,
      body: listHtml(),
    });
    list.body.querySelectorAll('.xp-contact').forEach(bindContact);
    shell.menus(list, [
      [{ label: 'Se déconnecter', disabled: true }, '-', { label: 'Fermer', run: () => list?.close() }],
      [{ label: 'Ajouter un contact…', run: () => list.body.querySelector('.xp-list-add').click() }],
      [{ label: 'Envoyer un message instantané…', run: () => openChat() }],
      [{ label: 'Options…', disabled: true }],
      [
        {
          label: 'À propos de la Messagerie',
          run: () =>
            shell.balloon(list.titlebar, {
              title: 'Messagerie 7.0',
              text: 'Recréation pédagogique « dans l’esprit » des messageries instantanées des années 2000.',
            }),
        },
      ],
    ]);
    list.body.querySelector('.xp-list-add').addEventListener('click', (event) => {
      audio.click();
      shell.balloon(event.currentTarget, {
        title: 'Ajouter un contact',
        text: 'Votre liste est déjà bien remplie. Et puis, c’est Kev1n qui a la sortie !',
      });
    });
    list.on('close', () => {
      list = null;
    });
    return list;
  }

  // ——— Démarrage : la messagerie se connecte, Kev1n a laissé un message ———

  function start() {
    if (!small()) openContacts({ quiet: true });
    openChat({ minimized: true });
    shell.flash(chat, true);
    audio.ding();
    closeNews = toast({
      html: `<b>${emotify(NICK.away, 14)}</b> dit :<br><span class="xp-toast-msg">${emotify(HISTORY.at(-1), 14)}</span>`,
      onOpen: () => openChat(),
    });
    // Tant qu'on ne l'a pas ouverte, la conversation se rappelle à nous
    ctx.interval(() => {
      if (live(chat) && chat.minimized && shell.buttonFor(chat)?.classList.contains('is-flash'))
        shell.flash(chat, true);
    }, 16000);
  }

  // Indices : le bouton Wizz s'illumine, la fenêtre se rappelle à nous
  function onHint(level) {
    if (waking) return;
    if (level >= 2 && live(chat)) chat.el.classList.add('xp-hint-wizz');
    if (!live(chat) || chat.minimized) {
      openChat({ minimized: true });
      shell.flash(chat, true);
    }
  }

  function relayout() {
    closePops();
    for (const win of [chat, list]) {
      if (!live(win)) continue;
      if (win === chat && small() !== Boolean(win.maximized) && (small() || win.autoMax)) {
        win.toggleMax();
        win.autoMax = small();
      }
    }
  }

  function destroy() {
    closePops();
    toasts.remove();
  }

  return { start, openChat, openContacts, onHint, relayout, destroy, chat: () => chat };
}
