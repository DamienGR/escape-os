// Démineur jouable (bonus de Windows 3.1) : clic pour découvrir, clic droit ou
// appui long pour planter un drapeau. La première case est toujours sûre.

import { pixelArt } from '../../ui/pixel.js';

const SIZE = 9;
const MINES = 10;
const COLORS = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];

// Afficheur à sept segments, rouge sur noir
const SEGMENTS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
const digit = (d) =>
  pixelArt([11, 21], (p) => {
    const on = SEGMENTS[d] ?? '';
    const seg = (s, x, y, w, h) => p.rect(x, y, w, h, on.includes(s) ? '#ff0000' : '#400000');
    seg('a', 2, 0, 7, 2);
    seg('b', 9, 2, 2, 7);
    seg('c', 9, 12, 2, 7);
    seg('d', 2, 19, 7, 2);
    seg('e', 0, 12, 2, 7);
    seg('f', 0, 2, 2, 7);
    seg('g', 2, 10, 7, 1);
  });

const face = (mood) =>
  pixelArt(17, (p) => {
    p.disc(8, 8, 7.5, 'K');
    p.disc(8, 8, 6.6, 'y');
    if (mood === 'dead') {
      p.map(4, 4, ['K.K...K.K', '.K.....K.', 'K.K...K.K']);
      p.hline(5, 11, 7, 'K');
      p.px(4, 12, 'K');
      p.px(12, 12, 'K');
    } else if (mood === 'cool') {
      p.rect(3, 5, 11, 1, 'K');
      p.rect(3, 6, 4, 2, 'K');
      p.rect(10, 6, 4, 2, 'K');
      p.map(5, 11, ['K.....K', '.KKKKK.']);
    } else {
      p.rect(5, 5, 2, 2, 'K');
      p.rect(10, 5, 2, 2, 'K');
      if (mood === 'oh') p.disc(8, 11.5, 1.6, 'K');
      else p.map(5, 10, ['K.....K', '.KKKKK.']);
    }
  });

const MINE = pixelArt(13, (p) => {
  p.line(6, 0, 6, 12, 'K');
  p.line(0, 6, 12, 6, 'K');
  p.line(2, 2, 10, 10, 'K');
  p.line(10, 2, 2, 10, 'K');
  p.disc(6, 6, 4, 'K');
  p.rect(4, 4, 2, 2, 'W');
});

const FLAG = pixelArt(12, (p) => {
  p.rect(5, 1, 2, 5, 'r');
  p.rect(3, 2, 2, 3, 'r');
  p.rect(6, 6, 1, 3, 'K');
  p.rect(4, 8, 5, 1, 'K');
  p.rect(2, 9, 9, 2, 'K');
});

export function createMinesweeper(container, { audio, signal } = {}) {
  container.innerHTML = `
    <div class="mines">
      <div class="mines-head">
        <span class="mines-count" aria-label="Mines restantes"></span>
        <button type="button" class="mines-face" aria-label="Nouvelle partie"></button>
        <span class="mines-time" aria-label="Temps"></span>
      </div>
      <div class="mines-grid" role="grid" aria-label="Champ de mines"></div>
    </div>`;
  const grid = container.querySelector('.mines-grid');
  const faceBtn = container.querySelector('.mines-face');
  const countEl = container.querySelector('.mines-count');
  const timeEl = container.querySelector('.mines-time');

  let cells = [];
  let started = false;
  let over = false;
  let flags = 0;
  let seconds = 0;
  let timer = 0;

  const show = (el, value) => {
    el.innerHTML = String(Math.max(-99, Math.min(999, value)))
      .padStart(3, '0')
      .split('')
      .map(digit)
      .join('');
  };
  const setFace = (mood) => {
    faceBtn.innerHTML = face(mood);
  };

  function reset() {
    clearInterval(timer);
    started = false;
    over = false;
    flags = 0;
    seconds = 0;
    show(countEl, MINES);
    show(timeEl, 0);
    setFace('smile');
    grid.innerHTML = '';
    cells = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mines-cell';
      btn.setAttribute('aria-label', `Case ${(i % SIZE) + 1}, ${Math.floor(i / SIZE) + 1}`);
      grid.append(btn);
      cells.push({ el: btn, mine: false, open: false, flag: false, n: 0 });
    }
  }

  const around = (i) => {
    const x = i % SIZE;
    const y = Math.floor(i / SIZE);
    const list = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && x + dx >= 0 && x + dx < SIZE && y + dy >= 0 && y + dy < SIZE) list.push((y + dy) * SIZE + x + dx);
      }
    }
    return list;
  };

  function plant(safe) {
    const forbidden = new Set([safe, ...around(safe)]);
    let placed = 0;
    while (placed < MINES) {
      const i = Math.floor(Math.random() * cells.length);
      if (cells[i].mine || forbidden.has(i)) continue;
      cells[i].mine = true;
      placed += 1;
    }
    cells.forEach((cell, i) => {
      cell.n = around(i).filter((j) => cells[j].mine).length;
    });
    started = true;
    timer = setInterval(() => show(timeEl, ++seconds), 1000);
    signal?.addEventListener('abort', () => clearInterval(timer));
  }

  function openCell(i) {
    const cell = cells[i];
    if (cell.open || cell.flag) return;
    cell.open = true;
    cell.el.classList.add('open');
    if (cell.mine) return;
    if (cell.n) {
      cell.el.textContent = cell.n;
      cell.el.style.color = COLORS[cell.n];
    } else {
      around(i).forEach(openCell);
    }
  }

  function lose(i) {
    over = true;
    clearInterval(timer);
    setFace('dead');
    audio?.fail();
    cells.forEach((cell, j) => {
      if (cell.mine && !cell.flag) {
        cell.el.classList.add('open');
        cell.el.innerHTML = MINE;
      }
      if (!cell.mine && cell.flag) cell.el.classList.add('wrong');
      if (j === i) cell.el.classList.add('boom');
    });
  }

  function checkWin() {
    if (cells.every((cell) => cell.mine || cell.open)) {
      over = true;
      clearInterval(timer);
      setFace('cool');
      cells.forEach((cell) => {
        if (cell.mine && !cell.flag) {
          cell.flag = true;
          cell.el.innerHTML = FLAG;
        }
      });
      show(countEl, 0);
      audio?.success();
    }
  }

  function reveal(i) {
    if (over || cells[i].flag) return;
    if (!started) plant(i);
    if (cells[i].mine) {
      cells[i].open = true;
      lose(i);
      return;
    }
    openCell(i);
    audio?.click();
    checkWin();
  }

  function toggleFlag(i) {
    const cell = cells[i];
    if (over || cell.open) return;
    cell.flag = !cell.flag;
    cell.el.innerHTML = cell.flag ? FLAG : '';
    flags += cell.flag ? 1 : -1;
    show(countEl, MINES - flags);
    audio?.tap();
  }

  // Souris : clic gauche, clic droit ; tactile : appui long pour le drapeau
  let pressTimer = 0;
  let longPressed = false;
  grid.addEventListener('pointerdown', (event) => {
    const i = cells.findIndex((cell) => cell.el === event.target.closest('.mines-cell'));
    if (i < 0 || over) return;
    if (event.button === 0) setFace('oh');
    longPressed = false;
    if (event.pointerType !== 'mouse') {
      pressTimer = setTimeout(() => {
        longPressed = true;
        toggleFlag(i);
        setFace('smile');
      }, 420);
    }
  });
  grid.addEventListener('pointerup', (event) => {
    clearTimeout(pressTimer);
    const i = cells.findIndex((cell) => cell.el === event.target.closest('.mines-cell'));
    if (!over) setFace('smile');
    if (i < 0 || longPressed || event.button !== 0) return;
    reveal(i);
  });
  grid.addEventListener('pointerleave', () => {
    clearTimeout(pressTimer);
    if (!over) setFace('smile');
  });
  grid.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const i = cells.findIndex((cell) => cell.el === event.target.closest('.mines-cell'));
    if (i >= 0) toggleFlag(i);
  });
  grid.addEventListener('keydown', (event) => {
    const i = cells.findIndex((cell) => cell.el === event.target);
    if (i < 0) return;
    if (event.key === 'f' || event.key === 'F') toggleFlag(i);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      reveal(i);
    }
  });
  faceBtn.addEventListener('click', () => reset());

  reset();
  return { reset, destroy: () => clearInterval(timer) };
}
