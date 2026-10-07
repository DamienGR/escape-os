// Briques communes du téléphone : animations (transform et opacité seulement),
// barres de navigation façon 2007, pile de pages qui glissent.

export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const EASE = 'cubic-bezier(.25,.8,.25,1)';
export const EASE_IN = 'cubic-bezier(.55,0,.75,.4)';

export function h(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// Animation Web Animations. Mouvement réduit : `calm` remplace les images clés
// (un simple fondu), sinon seule l'opacité est conservée.
export function play(el, frames, { duration = 360, easing = EASE, delay = 0, fill = 'both', calm: soft } = {}) {
  if (!el?.isConnected) return Promise.resolve({ cancel() {} });
  let list = frames;
  if (calm()) {
    list = soft ?? frames.map((f) => ({ opacity: f.opacity ?? 1 }));
    duration = Math.min(duration, 240);
    easing = 'ease';
  }
  const anim = el.animate(list, { duration, easing, delay, fill });
  return anim.finished.then(
    () => anim,
    () => anim,
  );
}

export const fadeIn = [{ opacity: 0 }, { opacity: 1 }];
export const fadeOut = [{ opacity: 1 }, { opacity: 0 }];

// Barre de navigation : bleue (par défaut), noire, translucide (Photos), cuir (Notes)
export function nav({ title = '', back = '', style = 'blue', right = '' } = {}) {
  return `<header class="ph-nav ph-nav-${style}">
    ${back ? `<span class="ph-back-wrap"><button type="button" class="ph-back" data-back>${back}</button></span>` : ''}
    <h2 class="ph-nav-title">${title}</h2>
    ${right}
  </header>`;
}

// Pile de pages : la nouvelle arrive par la droite, l'ancienne part à gauche.
export function createStack(host) {
  const pages = [];
  let moving = false;
  const slide = (el, from, to, soft) =>
    play(el, [{ transform: `translateX(${from})` }, { transform: `translateX(${to})` }], { duration: 400, calm: soft });
  return {
    get top() {
      return pages.at(-1);
    },
    get depth() {
      return pages.length;
    },
    async push(page, { animate = true } = {}) {
      if (moving) return;
      const prev = pages.at(-1);
      pages.push(page);
      page.hidden = false;
      host.append(page);
      if (!prev) return;
      if (!animate) {
        prev.hidden = true;
        return;
      }
      moving = true;
      const [a, b] = await Promise.all([slide(page, '100%', '0', fadeIn), slide(prev, '0', '-100%', fadeOut)]);
      prev.hidden = true;
      a.cancel();
      b.cancel();
      moving = false;
    },
    async pop() {
      if (moving || pages.length < 2) return;
      moving = true;
      const page = pages.pop();
      const prev = pages.at(-1);
      prev.hidden = false;
      const [a, b] = await Promise.all([slide(page, '0', '100%', fadeOut), slide(prev, '-100%', '0', fadeIn)]);
      page.remove();
      a.cancel();
      b.cancel();
      moving = false;
    },
  };
}
