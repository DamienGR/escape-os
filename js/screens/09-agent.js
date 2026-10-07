// Écran 9 — 2026, l'agent IA : plus d'épreuve, c'est l'écran de réussite.
// Un agent simulé félicite le joueur, retrace les neuf gestes du voyage et
// affiche son bilan. Ses messages s'écrivent caractère par caractère, clin
// d'œil au télétype de 1974 ; le champ libre reconnaît quelques mots-clés.

import { ERAS } from '../data/eras.js';
import { state, formatTime } from '../core/state.js';
import { svg } from './agent/icons.js';
import { burst } from './agent/confetti.js';
import {
  fr,
  segments,
  match,
  titleFor,
  opening,
  shareText,
  scoreReply,
  CHIPS,
  QUESTIONS,
  RESTART,
  FACTS,
  SHARE,
  MAC,
  FALLBACKS,
} from './agent/script.js';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const abortError = () => new DOMException('Écran démonté', 'AbortError');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const orb = (cls = '') => `<span class="ag-orb ${cls}"><i></i><i></i><i></i></span>`;

// 372 000 ms → « 6 min 12 s »
function duration(ms) {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h} h ${String(m).padStart(2, '0')}`;
  if (m) return s ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

// L'horloge du récit : la mise à jour a déraillé à 9 h 41 (voir core/jump.js).
function clock() {
  const minutes = 9 * 60 + 41 + Math.floor(state.elapsed / 60000);
  const hh = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  return `${hh}:${String(minutes % 60).padStart(2, '0')}`;
}

function srOnly(text) {
  const el = document.createElement('span');
  el.className = 'sr-only';
  el.textContent = text;
  return el;
}

const STATUS = { idle: 'En ligne', thinking: 'Réfléchit…', typing: 'Écrit…' };

// Le parcours principal : neuf époques, puis le présent. Une éventuelle salle
// bonus n'entre ni dans la frise des gestes ni dans le bilan.
const PATH = ['cards', 'unix', 'dos', 'win31', 'win95', 'win98', 'xp', 'ubuntu', 'phone', 'agent'];
const ROUTE = PATH.map((id) => ERAS.find((era) => era.id === id)).filter(Boolean);

const TEMPLATE = `
  <div class="ag-ambient" aria-hidden="true"></div>
  <div class="ag-scroll">
    <div class="ag-thread">
      <header class="ag-hero">
        <div class="ag-presence" aria-hidden="true">${orb('ag-orb-lg')}</div>
        <h2 class="ag-name">Agent</h2>
        <p class="ag-status" aria-hidden="true"><i class="ag-status-dot"></i><span class="ag-status-text">En ligne</span></p>
      </header>
      <p class="ag-day"><span></span></p>
      <div class="ag-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation avec l’agent"></div>
    </div>
  </div>
  <div class="ag-dock">
    <button class="ag-jump" type="button" aria-label="Revenir au dernier message" hidden>${svg('down')}</button>
    <div class="ag-chips" role="group" aria-label="Réponses suggérées"></div>
    <form class="ag-composer" autocomplete="off">
      <label class="ag-field">
        <span class="sr-only">Écris à l’agent</span>
        <input class="ag-input" type="text" name="message" maxlength="240" placeholder="Écris à l’agent…"
          enterkeyhint="send" autocomplete="off" autocapitalize="sentences">
      </label>
      <button class="ag-send" type="submit" aria-label="Envoyer" disabled>${svg('send')}</button>
    </form>
    <p class="ag-note">Agent simulé : réponses écrites à l’avance<span class="ag-note-more">, rien ne quitte ton navigateur</span>.</p>
  </div>
  <canvas class="ag-confetti" aria-hidden="true" hidden></canvas>`;

export default {
  id: 'agent',
  era: 'Agent IA',
  year: 2026,

  mount(root, ctx) {
    const { audio, signal } = ctx;
    const calm = reducedMotion();

    const app = document.createElement('div');
    app.className = 'ag';
    app.dataset.state = 'idle';
    app.innerHTML = TEMPLATE;
    root.append(app);

    const $ = (sel) => app.querySelector(sel);
    const scroller = $('.ag-scroll');
    const log = $('.ag-log');
    const chips = $('.ag-chips');
    const form = $('.ag-composer');
    const input = $('.ag-input');
    const send = $('.ag-send');
    const jump = $('.ag-jump');
    const statusText = $('.ag-status-text');
    $('.ag-day span').textContent = `7 octobre 2026 · ${clock()}`;

    // ——— Bilan, figé à l'arrivée : les indices demandés ici ne comptent pas ———

    const per = ROUTE.filter((era) => era.id !== 'agent').map((era) => ({
      era,
      hints: 0,
      errors: 0,
      time: 0,
      done: false,
      ...state.stats[era.id],
    }));
    const hints = per.reduce((n, s) => n + s.hints, 0);
    const errors = per.reduce((n, s) => n + s.errors, 0);
    // Arrivé ici sans avoir fini une seule époque (lien direct) : non classé non plus.
    const visit = Boolean(state.visit) || !per.some((s) => s.done);
    const title = titleFor({ hints, visit });
    const score = { time: state.elapsed, duration: duration(state.elapsed), hints, errors, visit, title: title.name };
    const annex = Boolean(state.stats.mac?.done);

    // ——— File de la conversation ———
    // Une réponse à la fois. Un nouveau message du joueur accélère celle en
    // cours (fast) ; un clic dans le fil termine seulement la phrase en cours.

    const skips = new Set();
    let fast = false;
    let pending = 0;
    let chain = Promise.resolve();
    let turn = null; // { kind, el, body, first }
    let question = 0;
    let fallback = 0;
    let leaving = false;
    let pinned = true;
    let gliding = 0;

    const skip = () => [...skips].forEach((fn) => fn());
    const hurry = () => {
      fast = true;
      skip();
    };

    function enqueue(job) {
      pending += 1;
      if (pending > 1) hurry();
      chain = chain
        .then(async () => {
          fast = pending > 1;
          try {
            await job();
          } finally {
            pending -= 1;
            if (!signal.aborted) setStatus('idle');
          }
        })
        .catch((error) => {
          if (error?.name !== 'AbortError') console.error(error);
        });
    }

    function pause(ms) {
      if (signal.aborted) return Promise.reject(abortError());
      if (fast || ms <= 0) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const done = () => {
          skips.delete(done);
          resolve();
        };
        skips.add(done);
        ctx.wait(ms).then(done, (error) => {
          skips.delete(done);
          reject(error);
        });
      });
    }

    function setStatus(value) {
      app.dataset.state = value;
      statusText.textContent = STATUS[value];
    }

    // ——— Défilement : le fil suit le dernier message, sauf si l'on remonte ———

    const atBottom = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 56;

    function follow(force = false) {
      if (force) pinned = true;
      if (!pinned) {
        jump.hidden = false;
        return;
      }
      scroller.scrollTop = scroller.scrollHeight;
    }

    ctx.on(
      scroller,
      'scroll',
      () => {
        if (gliding) return;
        pinned = atBottom();
        jump.hidden = pinned;
      },
      { passive: true },
    );
    ctx.on(jump, 'click', () => {
      pinned = true;
      jump.hidden = true;
      ctx.clear(gliding);
      gliding = ctx.timeout(() => (gliding = 0), 700);
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: calm ? 'auto' : 'smooth' });
    });
    const resizer = new ResizeObserver(() => follow());
    resizer.observe(scroller);

    // Plus de cadre : l'écran touche le HUD. Si la scène l'a mesuré pendant son
    // animation d'entrée (arrivée directe, mode visite), on rattrape l'écart ici.
    const hud = document.getElementById('hud');
    function clearHud() {
      const box = root.getBoundingClientRect();
      const bar = hud && !hud.hidden ? hud.getBoundingClientRect() : null;
      let top = 0;
      let bottom = 0;
      if (bar?.height) {
        if (bar.top < box.top + box.height / 2) top = Math.max(0, Math.round(bar.bottom - box.top));
        else bottom = Math.max(0, Math.round(box.bottom - bar.top));
      }
      app.style.setProperty('--ag-top', `${top}px`);
      app.style.setProperty('--ag-bottom', `${bottom}px`);
    }
    if (hud) ctx.on(hud, 'animationend', clearHud);
    ctx.timeout(clearHud, 700);
    ctx.onResize(() => {
      clearHud();
      follow();
    });

    // ——— Tours de parole ———

    function agentBody() {
      if (turn?.kind === 'agent') return turn.body;
      log.querySelector('.ag-turn.is-live')?.classList.remove('is-live');
      const el = document.createElement('article');
      el.className = 'ag-turn ag-turn-agent is-live';
      el.innerHTML = `<span class="ag-avatar" aria-hidden="true">${orb('ag-orb-sm')}</span><div class="ag-turn-body"></div>`;
      log.append(el);
      turn = { kind: 'agent', el, body: el.querySelector('.ag-turn-body'), first: true };
      follow();
      return turn.body;
    }

    function userSays(text) {
      // La conversation avance : les choix restés en suspens se referment.
      log.querySelectorAll('.ag-actions.is-choice button').forEach((btn) => (btn.disabled = true));
      const el = document.createElement('article');
      el.className = 'ag-turn ag-turn-user';
      const bubble = document.createElement('p');
      bubble.className = 'ag-bubble';
      bubble.append(srOnly(fr('Toi : ')), text);
      el.append(bubble);
      log.append(el);
      turn = { kind: 'user', el };
      audio.tap();
      follow(true);
    }

    async function think(ms = 520 + Math.random() * 480, until = null) {
      const body = agentBody();
      setStatus('thinking');
      if (fast && !until) return;
      const el = document.createElement('div');
      el.className = 'ag-thinking';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<span>L’agent réfléchit</span><span class="ag-dots"><i></i><i></i><i></i></span>';
      body.append(el);
      follow();
      try {
        await Promise.all([pause(ms), until]);
      } finally {
        el.remove();
      }
    }

    // Écrit les segments caractère par caractère. Le texte restant est déjà
    // posé, invisible : les lignes ne sautent pas pendant la frappe.
    function type(host, segs) {
      if (signal.aborted) return Promise.reject(abortError());
      const parts = segs.map((seg) => {
        const wrap = seg.kind === 'text' ? null : host.appendChild(document.createElement(seg.kind));
        const shown = document.createTextNode('');
        const ghost = document.createElement('span');
        ghost.className = 'ag-ghost';
        ghost.textContent = seg.text;
        (wrap ?? host).append(shown, ghost);
        return { text: seg.text, wrap, shown, ghost, count: 0 };
      });
      const total = parts.reduce((n, p) => n + p.text.length, 0);
      const caret = document.createElement('span');
      caret.className = 'ag-caret';
      const finish = () => {
        for (const p of parts) {
          p.shown.data = p.text;
          p.ghost.remove();
          p.wrap?.classList.add('is-on');
        }
        caret.remove();
      };
      if (fast || !total) {
        finish();
        follow();
        return Promise.resolve();
      }

      // Cadence de frappe : plus rapide pour les longs paragraphes, pause après la ponctuation.
      const cps = clamp(total / 2.2, 64, 110);
      const times = [];
      let t = 0;
      for (const p of parts) {
        for (let i = 0; i < p.text.length; i++) {
          t += (1000 / cps) * (0.55 + Math.random() * 0.9);
          times.push(t);
          const ch = p.text[i];
          if ('.!?…'.includes(ch)) t += 140;
          else if (',;:'.includes(ch)) t += 55;
        }
      }

      const render = (count) => {
        let left = count;
        let current = null;
        for (const p of parts) {
          const n = Math.min(left, p.text.length);
          left -= n;
          if (n !== p.count) {
            p.count = n;
            p.shown.data = p.text.slice(0, n);
            p.ghost.textContent = p.text.slice(n);
            // Une pastille de code n'apparaît qu'une fois la frappe arrivée jusqu'à elle
            p.wrap?.classList.toggle('is-on', n > 0);
          }
          if (!current && n < p.text.length) current = p;
        }
        if (current && caret.nextSibling !== current.ghost) current.ghost.before(caret);
      };

      return new Promise((resolve, reject) => {
        const start = performance.now();
        let shown = 0;
        let raf = 0;
        let done = false;
        const end = (error) => {
          if (done) return;
          done = true;
          cancelAnimationFrame(raf);
          skips.delete(rush);
          signal.removeEventListener('abort', onAbort);
          if (error) return reject(error);
          finish();
          follow();
          resolve();
        };
        const rush = () => end();
        const onAbort = () => end(abortError());
        skips.add(rush);
        signal.addEventListener('abort', onAbort, { once: true });
        const frame = (now) => {
          if (fast) return end();
          let count = shown;
          while (count < total && times[count] <= now - start) count += 1;
          if (count !== shown) {
            shown = count;
            render(count);
          }
          if (shown >= total) return end();
          raf = requestAnimationFrame(frame);
        };
        render(0);
        follow();
        raf = requestAnimationFrame(frame);
      });
    }

    async function write(block) {
      const body = agentBody();
      const el = document.createElement('p');
      el.className = block.type === 'h' ? 'ag-h' : 'ag-p';
      const segs = segments(block.text);
      const plain = segs.map((seg) => seg.text).join('');
      // Le lecteur d'écran reçoit le message entier, pas chaque caractère.
      el.append(srOnly(turn.first ? `${fr('L’agent : ')}${plain}` : plain));
      turn.first = false;
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      el.append(visual);
      body.append(el);
      setStatus('typing');
      if (!fast) audio.tap();
      await type(visual, segs);
    }

    async function reveal(el, settle = 400) {
      const body = agentBody();
      el.classList.add('ag-enter');
      body.append(el);
      if (!fast) audio.tap();
      follow();
      await pause(settle);
    }

    async function say(script) {
      for (const item of script) {
        if (signal.aborted) throw abortError();
        const block = typeof item === 'string' ? { type: 'p', text: item } : item;
        if (block.type === 'think') await think(block.ms);
        else if (block.type === 'p' || block.type === 'h') {
          await write(block);
          await pause(block.type === 'h' ? 140 : 280);
        } else if (block.type === 'frieze') await reveal(frieze(), 950);
        else if (block.type === 'stats') {
          const el = stats();
          await reveal(el, 0);
          if (!visit && !fast) audio.note();
          countUp(el);
          await pause(850);
        } else if (block.type === 'actions') await reveal(actions(block), 150);
        else if (block.type === 'quote') await reveal(quote(block), 150);
      }
      setStatus('idle');
    }

    // ——— Cartes : la frise des gestes et le bilan ———

    function frieze() {
      const el = document.createElement('section');
      el.className = 'ag-card ag-frieze';
      el.setAttribute('aria-label', 'Le voyage en neuf gestes');
      el.innerHTML = `
        <header class="ag-card-head">
          <p class="ag-card-title">Le voyage en 9 gestes</p>
          <p class="ag-card-meta">de 1965 à 2026</p>
        </header>
        <ol class="ag-steps" style="--n:${ROUTE.length}">
          ${ROUTE.map(
            (era, i) => `<li class="ag-step${era.id === 'agent' ? ' is-now' : ''}" style="--i:${i}">
              <span class="ag-step-node">${svg(era.id)}</span>
              <span class="ag-step-label">
                <span class="ag-step-year">${era.year}</span><span class="sr-only"> : </span>
                <span class="ag-step-gesture">${era.gesture}</span><span class="sr-only">, </span>
                <span class="ag-step-system">${era.system}</span>
              </span>
            </li>`,
          ).join('')}
        </ol>`;
      return el;
    }

    function stats() {
      const el = document.createElement('section');
      el.className = `ag-card ag-score${visit ? ' is-unranked' : ''}`;
      el.setAttribute('aria-label', 'Ton bilan');
      const kpi = (label, value, spoken, key) =>
        `<div class="ag-kpi"><dt>${label}</dt><dd><span class="sr-only">${spoken}</span><span aria-hidden="true" data-count="${key}">${value}</span></dd></div>`;
      el.innerHTML = `
        <header class="ag-score-head">
          <span class="ag-emblem" aria-hidden="true">${svg(title.icon)}</span>
          <div class="ag-score-title">
            <p class="ag-kicker">Ton titre</p>
            <p class="ag-title-name">${title.name}</p>
            <p class="ag-title-text">${fr(title.text)}</p>
          </div>
          ${
            visit || annex
              ? `<div class="ag-badges">
                  ${visit ? '<span class="ag-badge">Partie non classée</span>' : ''}
                  ${annex ? '<span class="ag-badge is-bonus">Salle annexe découverte</span>' : ''}
                </div>`
              : ''
          }
        </header>
        <dl class="ag-kpis">
          ${kpi('Temps total', formatTime(score.time), score.duration, 'time')}
          ${kpi('Indices', hints, hints, 'hints')}
          ${kpi('Erreurs', errors, errors, 'errors')}
        </dl>
        ${chart()}`;

      // Barres du graphique : une seule tabulation, puis les flèches.
      const bars = [...el.querySelectorAll('.ag-bar')];
      if (bars.length) {
        ctx.on(el.querySelector('.ag-bars'), 'keydown', (event) => {
          const i = bars.indexOf(document.activeElement);
          const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: bars.length - 1 }[event.key];
          if (i < 0 || next === undefined) return;
          event.preventDefault();
          const target = bars[clamp(next, 0, bars.length - 1)];
          bars.forEach((bar) => (bar.tabIndex = bar === target ? 0 : -1));
          target.focus();
        });
      }
      return el;
    }

    // Temps passé à chaque époque : la plus longue escale ressort.
    function chart() {
      const max = Math.max(...per.map((s) => s.time));
      if (max < 1000) return '';
      const top = per.find((s) => s.time === max);
      const detail = (s) => `${plural(s.hints, 'indice')} · ${plural(s.errors, 'erreur')}`;
      return `<figure class="ag-chart">
          <figcaption class="ag-chart-head">
            <span>Temps par époque</span>
            <span>Plus longue escale : <b>${top.era.year}</b> · ${duration(top.time)}</span>
          </figcaption>
          <div class="ag-bars" role="group" aria-label="Temps passé à chaque époque" style="--n:${per.length}">
            ${per
              .map(
                (s, i) => `<button type="button" class="ag-bar${s === top ? ' is-max' : ''}" style="--h:${(s.time / max).toFixed(3)};--i:${i}"
                  tabindex="${s === top ? 0 : -1}" aria-label="${s.era.year}, ${s.era.system} : ${duration(s.time)}, ${detail(s)}">
                  <i></i>
                  <span class="ag-tip" aria-hidden="true"><b>${duration(s.time)}</b><span>${s.era.year} · ${s.era.system}</span><span>${detail(s)}</span></span>
                </button>`,
              )
              .join('')}
          </div>
          <div class="ag-axis" aria-hidden="true" style="--n:${per.length}">
            ${per.map((s) => `<span><span class="ag-y-long">${s.era.year}</span><span class="ag-y-short">’${String(s.era.year).slice(2)}</span></span>`).join('')}
          </div>
        </figure>`;
    }

    // Les chiffres du bilan défilent jusqu'à leur valeur.
    function countUp(el) {
      const targets = {
        time: [score.time, (v) => formatTime(v)],
        hints: [hints, (v) => String(Math.round(v))],
        errors: [errors, (v) => String(Math.round(v))],
      };
      for (const node of el.querySelectorAll('[data-count]')) {
        const [to, format] = targets[node.dataset.count];
        if (fast || calm || !to) {
          node.textContent = format(to);
          continue;
        }
        const start = performance.now();
        const step = (now) => {
          if (signal.aborted) return;
          const p = Math.min(1, (now - start) / 1100);
          node.textContent = format(to * (1 - (1 - p) ** 3));
          if (p < 1) requestAnimationFrame(step);
        };
        node.textContent = format(0);
        requestAnimationFrame(step);
      }
    }

    function actions(block) {
      const row = document.createElement('div');
      row.className = `ag-actions${block.choice ? ' is-choice' : ''}`;
      for (const item of block.items) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `ag-action${item.primary ? ' is-primary' : ''}`;
        btn.innerHTML = `${item.icon ? svg(item.icon) : ''}<span></span>`;
        btn.lastElementChild.textContent = fr(item.label);
        ctx.on(btn, 'click', () => {
          if (leaving) return;
          audio.click();
          ctx.progress();
          if (block.choice) {
            row.querySelectorAll('button').forEach((b) => (b.disabled = true));
            btn.classList.add('is-chosen');
            if (!ctx.touch) input.focus({ preventScroll: true });
          }
          item.run();
        });
        row.append(btn);
      }
      return row;
    }

    function quote({ text, url }) {
      const el = document.createElement('figure');
      el.className = 'ag-quote';
      el.innerHTML = '<blockquote></blockquote><figcaption></figcaption>';
      el.firstElementChild.textContent = text;
      el.lastElementChild.textContent = url;
      return el;
    }

    // ——— Réponses ———

    function converse(text, answer, { until = null, before = null } = {}) {
      enqueue(async () => {
        userSays(text);
        before?.();
        await think(undefined, until);
        await answer();
      });
    }

    const restartFlow = () =>
      say([
        RESTART.ask,
        {
          type: 'actions',
          choice: true,
          items: [
            { label: RESTART.yes, icon: 'replay', primary: true, run: () => converse(RESTART.yes, leave) },
            { label: RESTART.no, run: () => converse(RESTART.no, () => say([RESTART.stay])) },
          ],
        },
      ]);

    async function leave() {
      leaving = true;
      app.classList.add('is-leaving');
      form.inert = true;
      chips.inert = true;
      await say([RESTART.go]);
      await ctx.wait(1000);
      window.dispatchEvent(new CustomEvent('escape-os:restart'));
    }

    const openFacts = () => window.dispatchEvent(new CustomEvent('escape-os:facts'));

    async function factsFlow() {
      await say([FACTS.reply]);
      if (!fast) openFacts();
      await say([{ type: 'actions', items: [{ label: FACTS.again, icon: 'sheet', run: openFacts }] }]);
    }

    // Partage : appelé dans le geste du joueur, sinon le navigateur refuse.
    function shareScore() {
      const text = shareText(score);
      const url = `${location.origin}${location.pathname}`;
      const data = { title: 'Escape OS', text, url };
      try {
        if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
          return navigator.share(data).then(
            () => ({ status: 'shared', text, url }),
            (error) => (error?.name === 'AbortError' ? { status: 'cancelled', text, url } : copy(text, url)),
          );
        }
      } catch {
        // partage indisponible : on copie
      }
      return copy(text, url);
    }

    async function copy(text, url) {
      const full = `${text}\n${url}`;
      let ok = false;
      try {
        await navigator.clipboard.writeText(full);
        ok = true;
      } catch {
        ok = legacyCopy(full);
      }
      if (ok) ctx.toast('Score copié');
      return { status: ok ? 'copied' : 'failed', text, url };
    }

    function legacyCopy(text) {
      const previous = document.activeElement;
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
      document.body.append(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
      previous?.focus?.({ preventScroll: true });
      return ok;
    }

    function shareAnswer(result) {
      if (result.status === 'shared') return say([SHARE.shared]);
      if (result.status === 'cancelled') return say([SHARE.cancelled]);
      return say([SHARE[result.status], { type: 'quote', text: result.text, url: result.url }]);
    }

    function wizz() {
      audio.wizz();
      if (calm) return;
      app.classList.remove('is-wizz');
      void app.offsetWidth;
      app.classList.add('is-wizz');
      ctx.timeout(() => app.classList.remove('is-wizz'), 700);
    }

    function ask() {
      const { label, reply } = QUESTIONS[question];
      question = (question + 1) % QUESTIONS.length;
      const chip = chips.querySelector('[data-chip="ask"] span');
      if (chip) chip.textContent = fr(QUESTIONS[question].label);
      converse(fr(label), () => say(reply));
    }

    function respond(text, rule) {
      switch (rule?.id) {
        case 'restart':
          return converse(text, restartFlow);
        case 'facts':
          return converse(text, factsFlow);
        case 'share': {
          const outcome = shareScore();
          return converse(text, async () => shareAnswer(await outcome), { until: outcome });
        }
        case 'future':
          return converse(text, () => say(QUESTIONS[0].reply));
        case 'text':
          return converse(text, () => say(QUESTIONS[1].reply));
        case 'who':
          return converse(text, () => say(QUESTIONS[2].reply));
        case 'score':
          return converse(text, () => say(scoreReply(score)));
        case 'mac':
          return converse(text, () => say([annex ? MAC.found : MAC.hidden]));
        case 'wizz':
          return converse(text, () => say(rule.reply), { before: wizz });
        default:
          if (rule?.reply) return converse(text, () => say(rule.reply));
          return converse(text, () => say(FALLBACKS[fallback++ % FALLBACKS.length]));
      }
    }

    // ——— Suggestions et champ libre ———

    function showChips() {
      if (chips.childElementCount) return;
      chips.innerHTML = CHIPS.map(
        (chip, i) => `<button type="button" class="ag-chip" data-chip="${chip.id}" style="--i:${i}">
          ${svg(chip.icon)}<span>${fr(chip.label ?? QUESTIONS[question].label)}</span>
        </button>`,
      ).join('');
    }

    ctx.on(chips, 'click', (event) => {
      const chip = event.target.closest('[data-chip]');
      if (!chip || leaving) return;
      audio.click();
      ctx.progress();
      const label = chip.textContent.trim();
      const id = chip.dataset.chip;
      if (id === 'restart') converse(label, restartFlow);
      else if (id === 'facts') converse(label, factsFlow);
      else if (id === 'share') {
        const outcome = shareScore();
        converse(label, async () => shareAnswer(await outcome), { until: outcome });
      } else if (id === 'ask') ask();
    });

    const syncSend = () => {
      send.disabled = !input.value.trim();
    };
    ctx.on(input, 'input', syncSend);
    ctx.on(form, 'submit', (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text || leaving) return;
      input.value = '';
      syncSend();
      ctx.progress();
      respond(text, match(text));
    });

    // Taper n'importe où écrit dans le champ, comme dans une vraie messagerie.
    ctx.on(window, 'keydown', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      if (leaving || document.querySelector('.modal-backdrop')) return;
      const active = document.activeElement;
      if (active === input) return;
      if (active && active !== document.body) {
        if (active.closest('input, textarea, select, [contenteditable], .popover, .drawer')) return;
        if (event.key === ' ' && active.closest('button')) return;
      }
      input.focus({ preventScroll: true });
    });

    // Un clic dans le fil termine la phrase en cours.
    ctx.on(scroller, 'pointerdown', () => skip());

    // Écran de réussite : pas de relance d'indice au bout d'une minute.
    ctx.interval(() => ctx.progress(), 30_000);

    // ——— Arrivée ———

    function arrive() {
      app.classList.add('is-here');
      audio.chime('agent');
      if (calm) return;
      const canvas = $('.ag-confetti');
      const box = app.getBoundingClientRect();
      const from = $('.ag-presence').getBoundingClientRect();
      canvas.hidden = false;
      burst(canvas, {
        x: from.left + from.width / 2 - box.left,
        y: from.top + from.height / 2 - box.top,
        signal,
      }).then(() => (canvas.hidden = true));
    }

    enqueue(async () => {
      await pause(420);
      arrive();
      await say(opening({ visit }));
      showChips();
      const active = document.activeElement;
      if (!ctx.touch && (!active || active === document.body)) input.focus({ preventScroll: true });
    });

    return () => {
      skips.clear();
      resizer.disconnect();
    };
  },
};
