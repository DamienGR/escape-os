// Le rouleau du télétype : le papier monte d'une ligne à chaque saut de ligne,
// la tête d'impression suit la colonne courante, et le journal de 500 lignes
// file à toute vitesse avant de s'entasser, froissé, dans la fenêtre.

const FONT_SIZE = 18;
const ADVANCE = 0.5996; // chasse de Courier Prime, en em
export const CHAR_W = FONT_SIZE * ADVANCE;

const el = (tag, cls, html = '') => {
  const node = document.createElement(tag);
  node.className = cls;
  if (html) node.innerHTML = html;
  return node;
};

// Bord déchiré : polygone irrégulier, différent à chaque partie.
function tornEdge(depth = 9) {
  const points = [];
  let x = 0;
  while (x < 100) {
    points.push(`${x.toFixed(2)}% ${(1 + Math.random() * depth).toFixed(1)}px`);
    x += 0.6 + Math.random() * 1.6;
  }
  points.push(`100% ${(1 + Math.random() * depth).toFixed(1)}px`, '100% 100%', '0 100%');
  return `polygon(${points.join(',')})`;
}

// Pli froissé : bords haut et bas légèrement irréguliers.
function crumple() {
  const top = [];
  const bottom = [];
  for (let x = 0; x <= 100; x += 4 + Math.random() * 6) {
    top.push(`${x.toFixed(1)}% ${(Math.random() * 3).toFixed(1)}px`);
    bottom.unshift(`${x.toFixed(1)}% calc(100% - ${(Math.random() * 3).toFixed(1)}px)`);
  }
  return `polygon(${[...top, '100% 1px', '100% calc(100% - 1px)', ...bottom].join(',')})`;
}

export function mountPaper(term, root, { reduced }) {
  const scroll = term.el.querySelector('.term-scroll');
  const line = term.el.querySelector('.term-line');
  const promptEl = term.el.querySelector('.term-prompt');
  const beforeEl = term.el.querySelector('.term-before');

  // Le papier : bord déchiré, lignes imprimées, ligne de saisie.
  const feed = el('div', 'ux-feed');
  const tear = el('div', 'ux-tear', '<i class="ux-tear-rim"></i><i class="ux-tear-sheet"></i>');
  tear.setAttribute('aria-hidden', 'true');
  const edge = tornEdge();
  tear.querySelectorAll('i').forEach((i) => (i.style.clipPath = edge));
  feed.append(tear, term.out, line);
  scroll.append(feed);

  // Mécanique devant le papier : rail, tête d'impression, ombres.
  const machine = el(
    'div',
    'ux-machine',
    `<i class="ux-shade-top"></i>
     <i class="ux-tearbar"></i>
     <i class="ux-shade-platen"></i>
     <i class="ux-platen-end ux-platen-left"></i>
     <i class="ux-platen-end ux-platen-right"></i>
     <i class="ux-rail"></i>
     <div class="ux-head"><div class="ux-head-body"><i class="ux-ribbon"></i><i class="ux-typebox"></i><i class="ux-carriage"></i></div></div>`,
  );
  machine.setAttribute('aria-hidden', 'true');
  root.append(machine);
  const head = machine.querySelector('.ux-head');
  const headBody = machine.querySelector('.ux-head-body');

  // ——— Avance du papier : chaque ligne nouvelle fait monter le rouleau ———

  let lastHeight = feed.offsetHeight;
  let nextFeed = null;
  let skipFirst = true;
  const ro = new ResizeObserver(() => {
    const height = feed.offsetHeight;
    const delta = height - lastHeight;
    lastHeight = height;
    if (skipFirst) {
      skipFirst = false;
      return;
    }
    if (delta <= 0 || reduced) {
      nextFeed = null;
      return;
    }
    const spec = nextFeed ?? {};
    nextFeed = null;
    const duration = spec.duration ?? Math.min(1500, Math.max(90, 60 + delta * 1.4));
    feed.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], {
      duration,
      easing: spec.easing ?? 'cubic-bezier(.25,.7,.25,1)',
      composite: 'add',
    });
  });
  ro.observe(feed);

  // ——— Tête d'impression ———

  const textLeft = () => {
    const style = getComputedStyle(term.out);
    return feed.offsetLeft + scroll.offsetLeft + parseFloat(style.paddingLeft || '0');
  };
  const cols = () => {
    const style = getComputedStyle(term.out);
    const width = term.out.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return Math.max(20, Math.floor((width + 0.5) / CHAR_W));
  };

  let lastCol = 0;
  let left = 0;
  let columns = 51;
  const measure = () => {
    left = textLeft();
    columns = cols();
  };
  measure();

  function column() {
    if (!line.hidden) return (promptEl.textContent + beforeEl.textContent).length;
    const last = term.out.lastElementChild;
    if (!last || last.classList.contains('ux-pile-row')) return 0;
    return last.textContent.length;
  }

  function placeHead() {
    const raw = column();
    const col = raw > 0 && raw % columns === 0 ? columns : raw % columns;
    const back = col < lastCol - 2;
    head.classList.toggle('is-returning', back);
    head.style.transform = `translateX(${(left + col * CHAR_W + CHAR_W / 2).toFixed(1)}px)`;
    lastCol = col;
  }

  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), placeHead()));
  };
  const mo = new MutationObserver(schedule);
  mo.observe(term.el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  placeHead();

  // Petit coup de marteau à chaque caractère.
  function strike() {
    if (reduced) return;
    headBody.animate([{ translate: '0 0' }, { translate: '0 -2px' }, { translate: '0 0' }], { duration: 70 });
  }

  // ——— Le journal qui file, puis s'entasse ———

  function flight(lines) {
    const layer = el('div', 'ux-flight');
    const strip = el('div', 'ux-flight-strip');
    const text = lines.join('\n');
    strip.append(el('pre', '', ''), el('pre', '', ''));
    strip.querySelectorAll('pre').forEach((pre) => (pre.textContent = text));
    layer.append(strip);
    layer.setAttribute('aria-hidden', 'true');
    root.insertBefore(layer, machine);
    const run = strip.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }], {
      duration: 420,
      iterations: Infinity,
    });
    run.playbackRate = 0.15;
    const start = performance.now();
    let raf = 0;
    const ramp = () => {
      const t = Math.min(1, (performance.now() - start) / 900);
      run.updatePlaybackRate(0.15 + t * t * 0.95);
      if (t < 1) raf = requestAnimationFrame(ramp);
    };
    raf = requestAnimationFrame(ramp);
    head.classList.add('is-frantic');
    root.classList.add('is-printing-fast');
    return () => {
      cancelAnimationFrame(raf);
      head.classList.remove('is-frantic');
      root.classList.remove('is-printing-fast');
      layer.classList.add('is-leaving');
      setTimeout(() => {
        run.cancel();
        layer.remove();
      }, 260);
    };
  }

  // Le papier froissé, en accordéon : une rangée du rouleau, illisible.
  function pile(lines) {
    const row = el('div', 'term-row ux-pile-row');
    row.setAttribute('aria-hidden', 'true');
    const box = el('div', 'ux-pile');
    const folds = 11;
    let top = 0;
    for (let i = 0; i < folds; i++) {
      const up = i % 2 === 0;
      const h = 30 + Math.round(Math.random() * 16);
      const fold = el('div', `ux-fold ${up ? 'is-up' : 'is-down'}`);
      fold.style.cssText = [
        `--top:${top}px`,
        `--h:${h}px`,
        `--r:${((Math.random() - 0.5) * 3.6).toFixed(2)}deg`,
        `--x:${((Math.random() - 0.5) * 16).toFixed(1)}px`,
        `--w:${(100 + Math.random() * 3).toFixed(1)}%`,
        `--sk:${((Math.random() - 0.5) * 7).toFixed(1)}deg`,
        `--d:${i * 45}ms`,
      ].join(';');
      fold.style.clipPath = crumple();
      const start = Math.floor(Math.random() * Math.max(1, lines.length - 8));
      fold.innerHTML = `<pre>${lines
        .slice(start, start + 6)
        .join('\n')
        .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</pre>`;
      box.append(fold);
      top += h - 6;
    }
    box.style.height = `${top + 46}px`;
    row.append(box);
    return row;
  }

  function destroy() {
    ro.disconnect();
    mo.disconnect();
    cancelAnimationFrame(frame);
    machine.remove();
  }

  return {
    feed,
    head,
    strike,
    flight,
    pile,
    measure,
    get cols() {
      return columns;
    },
    setNextFeed(spec) {
      nextFeed = spec;
    },
    destroy,
  };
}
