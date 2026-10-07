// Solitaire jouable (bonus de Windows 3.1) : on glisse les cartes à la souris ou
// au doigt, double-clic pour envoyer une carte aux fondations, et la cascade de
// cartes rebondissantes en cas de victoire.

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];
const W = 50;
const H = 68;
const GAP = 9;
const TOP = 8;
const ROW2 = 92;

const red = (card) => card.suit === 1 || card.suit === 2;
const colX = (i) => GAP + i * (W + GAP);

export function createSolitaire(container, { audio, onWin } = {}) {
  container.innerHTML = `
    <div class="sol">
      <div class="sol-felt">
        <div class="sol-slot sol-stock-slot" data-pile="stock"></div>
        <div class="sol-slot" data-pile="waste" style="left:${colX(1)}px"></div>
        ${[0, 1, 2, 3].map((f) => `<div class="sol-slot sol-found" data-pile="f${f}" style="left:${colX(3 + f)}px"></div>`).join('')}
        ${[0, 1, 2, 3, 4, 5, 6].map((t) => `<div class="sol-slot sol-tab" data-pile="t${t}" style="left:${colX(t)}px;top:${ROW2}px"></div>`).join('')}
        <canvas class="sol-cascade" hidden></canvas>
      </div>
      <div class="sol-status"><span class="sol-score">Points : 0</span><span class="sol-time">Temps : 0</span></div>
    </div>`;

  const felt = container.querySelector('.sol-felt');
  const scoreEl = container.querySelector('.sol-score');
  const timeEl = container.querySelector('.sol-time');
  const canvas = container.querySelector('.sol-cascade');
  let piles = {};
  let cards = [];
  let score = 0;
  let seconds = 0;
  let timer = 0;
  let won = false;
  let cascade = 0;

  // ——— Donne ———

  function deal() {
    stopCascade();
    clearInterval(timer);
    won = false;
    score = 0;
    seconds = 0;
    felt.querySelectorAll('.sol-card').forEach((el) => el.remove());
    cards = [];
    for (let s = 0; s < 4; s++) {
      for (let r = 0; r < 13; r++) {
        const el = document.createElement('div');
        const card = { suit: s, rank: r, up: false, el };
        el.className = `sol-card${red(card) ? ' is-red' : ''}`;
        el.innerHTML = `<span class="sol-corner">${RANKS[r]}<br>${SUITS[s]}</span><span class="sol-pip">${r > 9 ? RANKS[r] : SUITS[s]}</span><span class="sol-corner sol-corner-b">${RANKS[r]}<br>${SUITS[s]}</span>`;
        el.card = card;
        felt.append(el);
        cards.push(card);
      }
    }
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    piles = { stock: [], waste: [], f0: [], f1: [], f2: [], f3: [] };
    let k = 0;
    for (let t = 0; t < 7; t++) {
      piles[`t${t}`] = [];
      for (let n = 0; n <= t; n++) {
        const card = cards[k++];
        card.up = n === t;
        piles[`t${t}`].push(card);
      }
    }
    piles.stock = cards.slice(k);
    timer = setInterval(() => {
      seconds += 1;
      timeEl.textContent = `Temps : ${seconds}`;
    }, 1000);
    render(true);
  }

  // ——— Rendu ———

  function layoutPile(name) {
    const pile = piles[name];
    if (name === 'stock' || name === 'waste' || name.startsWith('f')) {
      const x = name === 'stock' ? colX(0) : name === 'waste' ? colX(1) : colX(3 + Number(name[1]));
      return pile.map((card, i) => ({ card, x: x + (name === 'stock' ? 0 : Math.min(i, 2) * 0), y: TOP, z: i }));
    }
    const i = Number(name[1]);
    const maxH = felt.clientHeight - ROW2 - H - 6;
    const ups = pile.filter((c) => c.up).length;
    const downs = pile.length - ups;
    let upStep = 15;
    if (downs * 6 + (ups - 1) * upStep > maxH) upStep = Math.max(7, (maxH - downs * 6) / Math.max(1, ups - 1));
    let y = ROW2;
    return pile.map((card, n) => {
      const pos = { card, x: colX(i), y, z: n };
      y += card.up ? upStep : 6;
      return pos;
    });
  }

  function render(instant = false) {
    for (const name of Object.keys(piles)) {
      for (const { card, x, y, z } of layoutPile(name)) {
        const el = card.el;
        el.classList.toggle('is-down', !card.up);
        el.style.transition = instant ? 'none' : '';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.zIndex = String(10 + z);
        el.dataset.pile = name;
      }
    }
    scoreEl.textContent = `Points : ${score}`;
  }

  // ——— Règles ———

  const top = (name) => piles[name].at(-1);
  const canFound = (card, name) => {
    const t = top(name);
    return t ? t.suit === card.suit && t.rank === card.rank - 1 : card.rank === 0;
  };
  const canTab = (card, name) => {
    const t = top(name);
    return t ? t.up && red(t) !== red(card) && t.rank === card.rank + 1 : card.rank === 12;
  };

  function move(from, index, to) {
    const moving = piles[from].splice(index);
    piles[to].push(...moving);
    if (to.startsWith('f')) score += 10;
    if (from === 'waste' && to.startsWith('t')) score += 5;
    if (from.startsWith('f') && to.startsWith('t')) score = Math.max(0, score - 15);
    const last = top(from);
    if (from.startsWith('t') && last && !last.up) {
      last.up = true;
      score += 5;
    }
    audio?.click();
    render();
    checkWin();
  }

  function autoFound(card) {
    const from = card.el.dataset.pile;
    if (top(from) !== card) return false;
    for (const f of ['f0', 'f1', 'f2', 'f3']) {
      if (canFound(card, f)) {
        move(from, piles[from].length - 1, f);
        return true;
      }
    }
    return false;
  }

  function drawStock() {
    if (piles.stock.length) {
      const card = piles.stock.pop();
      card.up = true;
      piles.waste.push(card);
    } else {
      piles.stock = piles.waste.reverse();
      piles.stock.forEach((card) => {
        card.up = false;
      });
      piles.waste = [];
      score = Math.max(0, score - 20);
    }
    audio?.tap();
    render();
  }

  // ——— Glisser-déposer ———

  const scaleOf = () => {
    const rect = felt.getBoundingClientRect();
    return rect.width / felt.offsetWidth || 1;
  };

  felt.addEventListener('pointerdown', (event) => {
    if (won) return;
    const el = event.target.closest('.sol-card');
    const slot = event.target.closest('.sol-stock-slot');
    if (!el) {
      if (slot) drawStock();
      return;
    }
    const card = el.card;
    const from = el.dataset.pile;
    if (from === 'stock') {
      drawStock();
      return;
    }
    if (!card.up) {
      if (top(from) === card) {
        card.up = true;
        score += 5;
        audio?.tap();
        render();
      }
      return;
    }
    const index = piles[from].indexOf(card);
    if (!from.startsWith('t') && index !== piles[from].length - 1) return;
    const stack = piles[from].slice(index);
    const s = scaleOf();
    const start = { x: event.clientX, y: event.clientY };
    const origins = stack.map((c) => ({ c, x: parseFloat(c.el.style.left), y: parseFloat(c.el.style.top) }));
    let moved = false;
    el.setPointerCapture(event.pointerId);
    const onMove = (ev) => {
      const dx = (ev.clientX - start.x) / s;
      const dy = (ev.clientY - start.y) / s;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      origins.forEach(({ c, x, y }, n) => {
        c.el.style.transition = 'none';
        c.el.style.left = `${x + dx}px`;
        c.el.style.top = `${y + dy}px`;
        c.el.style.zIndex = String(500 + n);
      });
    };
    const onUp = (ev) => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      if (!moved) {
        render();
        return;
      }
      const dx = (ev.clientX - start.x) / s;
      const dy = (ev.clientY - start.y) / s;
      const cx = origins[0].x + dx + W / 2;
      const cy = origins[0].y + dy + H / 2;
      const target = Object.keys(piles).find((name) => {
        if (name === from || name === 'stock' || name === 'waste') return false;
        const list = layoutPile(name);
        const x = name.startsWith('f') ? colX(3 + Number(name[1])) : colX(Number(name[1]));
        const y0 = name.startsWith('f') ? TOP : ROW2;
        const y1 = (list.at(-1)?.y ?? y0) + H;
        return cx > x - 8 && cx < x + W + 8 && cy > y0 - 10 && cy < y1 + 14;
      });
      if (target && ((target.startsWith('f') && stack.length === 1 && canFound(card, target)) || (target.startsWith('t') && canTab(card, target)))) {
        move(from, index, target);
      } else {
        render();
      }
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  });

  felt.addEventListener('dblclick', (event) => {
    const el = event.target.closest('.sol-card');
    if (el && el.card.up && !won) autoFound(el.card);
  });

  // ——— Victoire : la cascade de cartes ———

  function checkWin() {
    if (['f0', 'f1', 'f2', 'f3'].every((f) => piles[f].length === 13)) {
      won = true;
      clearInterval(timer);
      audio?.success();
      onWin?.();
      startCascade();
    }
  }

  function drawCard(ctx, card, x, y) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, y + 0.5, W - 1, H - 1, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = red(card) ? '#e00000' : '#000';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(RANKS[card.rank], x + 4, y + 13);
    ctx.fillText(SUITS[card.suit], x + 4, y + 25);
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.rank > 9 ? RANKS[card.rank] : SUITS[card.suit], x + W / 2, y + H / 2 + 9);
    ctx.textAlign = 'left';
  }

  function startCascade() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    canvas.hidden = false;
    canvas.width = felt.clientWidth;
    canvas.height = felt.clientHeight;
    const ctx = canvas.getContext('2d');
    const queue = [];
    for (let r = 12; r >= 0; r--) for (let f = 0; f < 4; f++) queue.push({ card: piles[`f${f}`][r], f });
    let current = null;
    const step = () => {
      if (!current) {
        const next = queue.shift();
        if (!next) return;
        current = {
          card: next.card,
          x: colX(3 + next.f),
          y: TOP,
          vx: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 4),
          vy: -Math.random() * 4,
        };
        next.card.el.style.visibility = 'hidden';
      }
      current.vy += 0.6;
      current.x += current.vx;
      current.y += current.vy;
      if (current.y + H > canvas.height) {
        current.y = canvas.height - H;
        current.vy *= -0.75;
      }
      drawCard(ctx, current.card, current.x, current.y);
      if (current.x < -W || current.x > canvas.width) current = null;
      cascade = requestAnimationFrame(step);
    };
    cascade = requestAnimationFrame(step);
    canvas.addEventListener('pointerdown', () => deal(), { once: true });
  }

  function stopCascade() {
    cancelAnimationFrame(cascade);
    canvas.hidden = true;
    cards.forEach((card) => {
      card.el.style.visibility = '';
    });
  }

  deal();
  return {
    deal,
    destroy() {
      clearInterval(timer);
      cancelAnimationFrame(cascade);
    },
  };
}
