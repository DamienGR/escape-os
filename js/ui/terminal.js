// Terminal partagé (Unix, DOS, Ubuntu). Un vrai <input> invisible capte la saisie
// et ouvre le clavier sur mobile. Options : invite, sensibilité à la casse, vitesse
// de frappe des sorties, mode papier où rien ne s'efface, saisie sans écho.

const coarse = () => window.matchMedia('(pointer: coarse)').matches;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createTerminal(container, options = {}) {
  const opts = {
    prompt: '$ ',
    caseSensitive: true,
    speed: 0, // caractères par seconde, 0 = instantané
    paper: false,
    cursor: 'block',
    label: 'Terminal',
    maxRows: 600,
    commands: {},
    unknown: () => '?',
    ...options,
  };

  const root = document.createElement('div');
  root.className = `term term-cursor-${opts.cursor}${opts.paper ? ' term-paper' : ''} ${opts.className ?? ''}`;
  root.innerHTML = `
    <div class="term-scroll">
      <div class="term-out"></div>
      <div class="term-line"><span class="term-prompt"></span><span class="term-before"></span><span class="term-cursor"> </span><span class="term-after"></span></div>
    </div>
    <input class="term-input" type="text" autocomplete="off" autocapitalize="none" autocorrect="off"
      spellcheck="false" enterkeyhint="enter" aria-label="${opts.label} : saisissez une commande">
    <div class="term-live sr-only" aria-live="polite"></div>`;
  container.append(root);

  const scroll = root.querySelector('.term-scroll');
  const out = root.querySelector('.term-out');
  const line = root.querySelector('.term-line');
  const promptEl = root.querySelector('.term-prompt');
  const beforeEl = root.querySelector('.term-before');
  const cursorEl = root.querySelector('.term-cursor');
  const afterEl = root.querySelector('.term-after');
  const input = root.querySelector('.term-input');
  const live = root.querySelector('.term-live');

  const history = [];
  let historyIndex = 0;
  let busy = false;
  let destroyed = false;
  let asking = null; // { resolve, echo }
  let prompt = opts.prompt;
  let queue = Promise.resolve();
  let chips = [];
  let touchBar = null;
  const abort = new AbortController();
  const { signal } = abort;

  const promptText = () => (typeof prompt === 'function' ? prompt() : prompt);

  // ——— Rendu de la ligne de saisie ———

  function render() {
    if (destroyed) return;
    const value = input.value;
    const echo = !asking || asking.echo !== false;
    const pos = input.selectionStart ?? value.length;
    promptEl.textContent = asking ? asking.prompt : promptText();
    if (echo) {
      beforeEl.textContent = value.slice(0, pos);
      cursorEl.textContent = value[pos] ?? ' ';
      afterEl.textContent = value.slice(pos + 1);
    } else {
      beforeEl.textContent = '';
      cursorEl.textContent = ' ';
      afterEl.textContent = '';
    }
    line.hidden = busy && !asking;
    root.classList.toggle('is-busy', busy && !asking);
    stickToBottom();
  }

  function stickToBottom() {
    scroll.scrollTop = scroll.scrollHeight;
  }

  function announce(text) {
    live.textContent = '';
    live.textContent = String(text).slice(0, 600);
  }

  function trim() {
    while (out.childElementCount > opts.maxRows) out.firstElementChild.remove();
  }

  function row(text = '', cls = '') {
    const el = document.createElement('div');
    el.className = `term-row${cls ? ` ${cls}` : ''}`;
    el.textContent = text;
    out.append(el);
    trim();
    return el;
  }

  // ——— Sorties ———

  // Imprime du texte, caractère par caractère si speed > 0. Renvoie une promesse.
  function print(text = '', { speed = opts.speed, cls = '', announce: say = true } = {}) {
    const lines = String(text).split('\n');
    const job = async () => {
      if (destroyed) return;
      if (say && text) announce(text);
      for (const content of lines) {
        if (destroyed) return;
        const el = row('', cls);
        if (!speed) {
          el.textContent = content;
          opts.onNewline?.();
        } else {
          const delay = 1000 / speed;
          const perStep = Math.max(1, Math.round(16 / delay));
          for (let i = 0; i < content.length; i += perStep) {
            if (destroyed) return;
            const chunk = content.slice(i, i + perStep);
            el.textContent += chunk;
            if (chunk.trim()) opts.onChar?.(chunk);
            stickToBottom();
            await sleep(Math.max(delay * perStep, 4));
          }
          opts.onNewline?.();
          if (content.length) await sleep(Math.min(120, delay * 3));
        }
        stickToBottom();
      }
    };
    queue = queue.then(job, job);
    return queue;
  }

  function printHTML(html, cls = '') {
    const job = async () => {
      if (destroyed) return;
      const el = document.createElement('div');
      el.className = `term-row${cls ? ` ${cls}` : ''}`;
      el.innerHTML = html;
      out.append(el);
      announce(el.textContent);
      trim();
      stickToBottom();
    };
    queue = queue.then(job, job);
    return queue;
  }

  function clear() {
    out.innerHTML = '';
    render();
  }

  // ——— Saisie ———

  function parse(raw) {
    const trimmed = raw.trim();
    const [first = '', ...rest] = trimmed.split(/\s+/);
    const name = opts.caseSensitive ? first : first.toLowerCase();
    return { name, args: rest, raw: trimmed };
  }

  async function execute(raw) {
    if (opts.onLine) return opts.onLine(raw, api);
    const { name, args } = parse(raw);
    if (!name) return null;
    const fn = Object.hasOwn(opts.commands, name) ? opts.commands[name] : null;
    return fn ? fn(args, api, raw) : opts.unknown(name, args, raw, api);
  }

  async function submit() {
    if (destroyed) return;
    const value = input.value;
    if (asking) {
      const { resolve, echo, prompt: p } = asking;
      asking = null;
      input.value = '';
      row(`${p}${echo === false ? '' : value}`, 'term-echo');
      render();
      resolve(value);
      return;
    }
    if (busy) return;
    input.value = '';
    row(`${promptText()}${value}`, 'term-echo');
    if (value.trim()) {
      history.push(value);
      if (history.length > 50) history.shift();
    }
    historyIndex = history.length;
    busy = true;
    render();
    try {
      const result = await execute(value);
      if (result != null && result !== '') {
        await print(Array.isArray(result) ? result.join('\n') : result);
      }
      await queue;
    } catch (error) {
      if (error?.name !== 'AbortError') console.error(error);
    } finally {
      busy = false;
      render();
    }
  }

  // Demande une ligne au joueur (mot de passe sans écho, confirmation…).
  function ask(question, { echo = true } = {}) {
    return new Promise((resolve) => {
      queue.then(() => {
        if (destroyed) return;
        asking = { resolve, echo, prompt: question };
        input.value = '';
        render();
      });
    });
  }

  function recall(step) {
    if (!history.length) return;
    historyIndex = Math.min(history.length, Math.max(0, historyIndex + step));
    input.value = history[historyIndex] ?? '';
    const end = input.value.length;
    input.setSelectionRange(end, end);
    render();
  }

  input.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submit();
      } else if (event.key === 'ArrowUp' && !asking) {
        event.preventDefault();
        recall(-1);
      } else if (event.key === 'ArrowDown' && !asking) {
        event.preventDefault();
        recall(1);
      } else if (event.key === 'Tab') {
        event.preventDefault();
      } else if (event.key.toLowerCase() === 'c' && event.ctrlKey && (!busy || asking)) {
        // Ctrl+C abandonne la ligne, ou la question posée (sans révéler un mot de passe)
        event.preventDefault();
        const typed = asking?.echo === false ? '' : input.value;
        row(`${asking ? asking.prompt : promptText()}${typed}^C`, 'term-echo');
        input.value = '';
        if (asking) {
          const { resolve } = asking;
          asking = null;
          resolve(null);
        }
        render();
      }
      opts.onKeyDown?.(event, api);
    },
    { signal },
  );

  input.addEventListener(
    'input',
    () => {
      if (opts.maxLength && input.value.length > opts.maxLength) input.value = input.value.slice(0, opts.maxLength);
      opts.onKey?.();
      render();
    },
    { signal },
  );

  for (const type of ['keyup', 'select', 'click']) input.addEventListener(type, render, { signal });
  document.addEventListener('selectionchange', () => document.activeElement === input && render(), { signal });
  input.addEventListener('focus', () => root.classList.add('is-focused'), { signal });
  input.addEventListener('blur', () => root.classList.remove('is-focused'), { signal });

  // Un clic n'importe où sur le terminal donne le focus à la saisie.
  root.addEventListener(
    'pointerup',
    () => {
      if (window.getSelection()?.toString()) return;
      focus();
    },
    { signal },
  );

  // Taper au clavier sans avoir cliqué : on redirige vers la saisie.
  window.addEventListener(
    'keydown',
    (event) => {
      if (destroyed || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      if (active === input) return;
      if (active && active !== document.body && active.closest('input, textarea, [contenteditable], .modal, .popover, .drawer, button')) return;
      if (document.querySelector('.modal-backdrop')) return;
      if (event.key.length === 1 || event.key === 'Enter' || event.key === 'Backspace') focus();
    },
    { signal },
  );

  function focus() {
    if (destroyed) return;
    input.focus({ preventScroll: true });
    const end = input.value.length;
    try {
      input.setSelectionRange(end, end);
    } catch {
      // certains claviers virtuels refusent : sans conséquence
    }
    render();
  }

  // ——— Barre tactile : touche Entrée visible et commandes suggérées ———

  function renderTouchBar() {
    if (!coarse()) return;
    if (!touchBar) {
      touchBar = document.createElement('div');
      touchBar.className = 'term-touch';
      touchBar.innerHTML = `<div class="term-chips"></div><button type="button" class="term-enter" aria-label="Entrée">Entrée ↵</button>`;
      touchBar.addEventListener('pointerdown', (event) => event.preventDefault());
      touchBar.querySelector('.term-enter').addEventListener('click', () => {
        submit();
        focus();
      });
      touchBar.querySelector('.term-chips').addEventListener('click', (event) => {
        const chip = event.target.closest('[data-chip]');
        if (!chip) return;
        run(chip.dataset.chip);
      });
      document.getElementById('overlays')?.append(touchBar);
    }
    touchBar.querySelector('.term-chips').innerHTML = chips
      .map((c) => `<button type="button" class="term-chip" data-chip="${c.replace(/"/g, '&quot;')}">${c.replace(/</g, '&lt;')}</button>`)
      .join('');
  }

  function setChips(list) {
    chips = list;
    renderTouchBar();
  }

  // Tape une commande à la place du joueur (pastilles).
  async function run(command) {
    if (busy || destroyed) return;
    input.value = command;
    render();
    await sleep(120);
    submit();
  }

  function setPrompt(value) {
    prompt = value;
    render();
  }

  function setBusy(value) {
    busy = value;
    render();
  }

  function destroy() {
    destroyed = true;
    abort.abort();
    touchBar?.remove();
    root.remove();
  }

  const api = {
    el: root,
    out,
    input,
    print,
    printHTML,
    row,
    clear,
    ask,
    run,
    focus,
    setPrompt,
    setChips,
    setBusy,
    render,
    destroy,
    parse,
    get busy() {
      return busy;
    },
    get history() {
      return history;
    },
    whenIdle: () => queue,
  };

  renderTouchBar();
  render();
  return api;
}
