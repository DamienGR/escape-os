// Écran 1 — Unix sur télétype (1974) : le rouleau imprime caractère par caractère.
// Il faut relier deux commandes par un pipe (ou grep seul) pour extraire, d'un
// journal de 500 lignes, la seule qui parle de sortie : « Mot à retenir : multics ».

import { createTerminal } from '../ui/terminal.js';
import { createShell } from './unix/shell.js';
import { EXIT_LINE } from './unix/journal.js';
import { mountPaper, CHAR_W } from './unix/paper.js';

const CHIPS = [
  [],
  ['ls', 'cat lisezmoi'],
  ['cat lisezmoi', 'man grep', 'cat journal'],
  ['cat journal | grep sortie', 'grep sortie journal'],
];

const REMARKS = [
  ['… 500 lignes plus loin, le papier déborde.', 'L’opérateur ramasse le rouleau en soupirant :', '« Personne ne lit 500 lignes. Cherchez ! »'],
  ['… et le papier déborde encore.', 'L’opérateur vous fixe :', '« Je vous ai dit de chercher. »'],
];

// Coupe une ligne trop longue entre deux mots, de préférence après un point.
function wrap(text, cols) {
  const out = [];
  let rest = text;
  while (rest.length > cols) {
    const sentence = rest.lastIndexOf('. ', cols);
    let cut = sentence > cols * 0.5 ? sentence + 1 : rest.lastIndexOf(' ', cols);
    // Pas de coupure avant : ; ! ? » ni juste après «
    while (cut > 0 && (/[:;!?»]/.test(rest[cut + 1] ?? '') || rest[cut - 1] === '«')) cut = rest.lastIndexOf(' ', cut - 1);
    if (cut <= 0) cut = cols;
    out.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  out.push(rest);
  return out;
}

export default {
  id: 'unix',
  era: 'Unix',
  year: 1974,

  decor(props) {
    const label = document.createElement('div');
    label.className = 'ux-dymo';
    label.innerHTML = '<span>SALLE 2</span><span>TTY 3</span>';
    props.bezel.append(label);
  },

  mount(root, ctx) {
    const { audio } = ctx;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shell = createShell();
    const seen = new Set();
    let paper = null;
    let done = false;
    let gags = 0;
    let lastCarriage = 0;
    let booting = true;
    let skipBoot = false;

    const wrapEl = document.createElement('div');
    wrapEl.className = 'ux';
    wrapEl.innerHTML = '<div class="ux-interior" aria-hidden="true"></div>';
    root.append(wrapEl);

    const carriage = () => {
      const now = performance.now();
      if (now - lastCarriage < 170) return;
      lastCarriage = now;
      audio.carriage();
    };

    const term = createTerminal(wrapEl, {
      prompt: '$ ',
      paper: true,
      cursor: 'bar',
      speed: 52,
      label: 'Télétype Unix',
      className: 'ux-term',
      onKey: () => {
        audio.clack();
        paper?.strike();
      },
      onChar: () => {
        audio.clack();
        paper?.strike();
      },
      onNewline: () => carriage(),
      // Retour chariot à chaque Entrée, comme sur la machine.
      onKeyDown: (event) => event.key === 'Enter' && carriage(),
      onLine: (raw) => run(raw),
    });
    paper = mountPaper(term, wrapEl, { reduced });

    const firstTime = (key) => {
      if (seen.has(key)) return false;
      seen.add(key);
      ctx.progress();
      return true;
    };

    // ——— Impression ———

    const lay = (lines) => lines.flatMap((line) => wrap(line, paper.cols));

    // Caractère par caractère, plus vite pour les longues sorties.
    function say(lines, { speed } = {}) {
      const rows = lay(lines);
      const text = rows.join('\n');
      if (rows.length >= 25) return block(rows);
      const rate = speed ?? Math.round(Math.min(420, Math.max(52, text.length / 2.4)));
      return term.print(text, { speed: skipBoot && booting ? 0 : rate });
    }

    // Les longues sorties défilent d'un bloc, dans le vacarme.
    function block(rows) {
      audio.printer(Math.min(60, rows.length), 30);
      paper.setNextFeed({ duration: Math.min(1400, Math.max(320, rows.length * 22)) });
      return term.print(rows.join('\n'), { speed: 0 });
    }

    // ——— Le gag des 500 lignes ———

    function crumpleSound() {
      for (let i = 0; i < 12; i++) {
        audio.noise({
          at: i * 0.04 + Math.random() * 0.02,
          type: i % 3 ? 'highpass' : 'bandpass',
          freq: 1400 + Math.random() * 3200,
          q: 0.8,
          release: 0.02 + Math.random() * 0.05,
          vol: 0.05 + Math.random() * 0.08,
        });
      }
    }

    async function gag(lines) {
      gags += 1;
      firstTime('journal');
      await say(lines.slice(0, 3), { speed: 150 });
      if (!reduced) {
        audio.printer(72, 26);
        const land = paper.flight(lines.slice(3, 66));
        await ctx.wait(2750);
        land();
      }
      paper.setNextFeed({ duration: 680, easing: 'cubic-bezier(.2,.85,.3,1.04)' });
      term.out.append(paper.pile(lines));
      crumpleSound();
      await ctx.wait(reduced ? 150 : 700);
      audio.bell();
      await ctx.wait(reduced ? 100 : 500);
      await say(REMARKS[Math.min(gags, REMARKS.length) - 1], { speed: 58 });
    }

    // ——— La bonne ligne : multics entouré au crayon, puis le saut ———

    function circle(word) {
      const row = [...term.out.children].reverse().find((r) => r.textContent.includes(word));
      if (!row) return;
      const col = row.textContent.indexOf(word);
      const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'ux-circle');
      svg.setAttribute('viewBox', '0 0 100 40');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.left = `${pad + col * CHAR_W - 9}px`;
      svg.style.width = `${word.length * CHAR_W + 18}px`;
      svg.innerHTML =
        '<path pathLength="1" vector-effect="non-scaling-stroke" d="M10 25 C 5 12, 30 4, 58 4 C 84 4, 99 12, 96 23 C 93 34, 62 38, 38 37 C 14 36, 1 29, 6 18 C 10 10, 22 7, 33 6"/>';
      row.append(svg);
      audio.noise({ type: 'bandpass', freq: 3600, q: 1.6, attack: 0.08, hold: 0.5, release: 0.12, vol: 0.045 });
    }

    async function found(lines) {
      done = true;
      ctx.progress();
      await say(lines, { speed: 46 });
      wrapEl.classList.add('ux-done');
      audio.bell();
      await ctx.wait(450);
      circle('multics');
      await ctx.wait(reduced ? 200 : 900);
      ctx.note('multics', { key: 'multics', label: 'Mot à retenir (1974)' });
      await ctx.wait(1700);
      ctx.complete();
      // Plus d'invite : le télétype attend le saut.
      await new Promise((resolve) => ctx.signal.addEventListener('abort', resolve, { once: true }));
      return null;
    }

    // ——— Interpréteur ———

    async function run(raw) {
      const line = raw.trim();
      if (!line || done) return null;
      const result = shell.run(line);
      const events = new Set(result.events);

      if (result.unknown) ctx.error();
      if (events.has('ls')) firstTime('ls');
      if (events.has('cat') && /lisezmoi/i.test(line)) firstTime('readme');
      if (events.has('man-grep') || events.has('man-sh')) firstTime('man');
      if (result.grep) firstTime('grep');

      const lines = [...result.err, ...result.lines];
      if (!lines.length) return null;

      // grep lit tout le journal avant de répondre.
      if (result.grep && result.lines.length) await ctx.wait(380 + Math.random() * 320);

      if (result.found && result.lines.length <= 12) return found(lines);
      if (result.lines.length >= 150) {
        if (result.err.length) await say(result.err);
        await gag(result.lines);
        return null;
      }
      await say(lines);
      if (result.grep && result.lines.some((l) => l.includes(EXIT_LINE))) {
        await say(['(Une ligne parle de sortie… perdue dans le tas. Affinez la recherche.)']);
      }
      return null;
    }

    // ——— Démarrage : le moteur se lance, l'opérateur vous connecte ———

    function motor() {
      audio.tone({ freq: 28, to: 58, glide: 0.7, type: 'sawtooth', attack: 0.25, hold: 0.55, release: 0.6, vol: 0.06, filter: { freq: 260 } });
      audio.noise({ type: 'lowpass', freq: 420, attack: 0.3, hold: 0.5, release: 0.6, vol: 0.05 });
    }

    async function typeInto(row, text, { rate, jitter = 0 }) {
      for (let i = 0; i < text.length; i++) {
        if (skipBoot) {
          row.textContent += text.slice(i);
          return;
        }
        row.textContent += text[i];
        audio.clack();
        paper.strike();
        await ctx.wait(1000 / rate + Math.random() * jitter);
      }
    }

    async function boot() {
      term.setBusy(true);
      // Un clic ou une touche imprime d'un coup le reste de l'en-tête.
      const skipper = new AbortController();
      const skip = () => (skipBoot = true);
      root.addEventListener('pointerdown', skip, { signal: skipper.signal });
      window.addEventListener('keydown', skip, { signal: skipper.signal });
      ctx.signal.addEventListener('abort', () => skipper.abort());
      motor();
      await ctx.wait(reduced ? 200 : 900, { skippable: true });
      await say(['UNIX — SALLE 2 — 1974'], { speed: 64 });
      await term.whenIdle();
      const login = term.row('');
      await typeInto(login, 'connexion : ', { rate: 64 });
      if (!skipBoot) await ctx.wait(420);
      await typeInto(login, 'voyageur', { rate: 9, jitter: 90 });
      carriage();
      if (!skipBoot) await ctx.wait(500);
      await say(['', 'tapez ls'], { speed: 40 });
      skipper.abort();
      booting = false;
      term.setBusy(false);
      if (!ctx.touch) term.focus();
    }

    term.setChips(CHIPS[ctx.hints.level] ?? []);
    ctx.hints.onReveal((level) => term.setChips(CHIPS[level] ?? CHIPS.at(-1)));

    boot().catch(() => {});

    return () => {
      paper.destroy();
      term.destroy();
    };
  },
};
