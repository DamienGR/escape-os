// Confettis discrets sur <canvas> (le seul canvas du jeu) : une gerbe jaillit
// d'un point, voltige en retombant, puis s'efface. Quelques dizaines de
// particules, pas davantage : on fête le retour, sans cotillons.

const COLORS = ['#7c5cff', '#b3a3ff', '#ffb199', '#8fd3ff', '#ffd98a'];

// Renvoie une promesse résolue quand la dernière particule a disparu.
export function burst(canvas, { x, y, count = 56, signal } = {}) {
  const g = canvas.getContext('2d');
  if (!g) return Promise.resolve();
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  const parts = Array.from({ length: count }, () => {
    // Éventail tourné vers le haut, un peu plus large que vertical
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
    const speed = 3.2 + Math.random() * 5.2;
    return {
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.6,
      w: 5 + Math.random() * 4,
      h: 2.4 + Math.random() * 2.2,
      round: Math.random() < 0.28,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.28,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 0.07 + Math.random() * 0.12,
      sway: 0.4 + Math.random() * 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0,
      ttl: 1.9 + Math.random() * 1.3,
    };
  });

  return new Promise((resolve) => {
    let last = performance.now();
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      g.clearRect(0, 0, width, height);
      resolve();
    };
    const frame = (now) => {
      if (signal?.aborted) return stop();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = dt * 60; // pas normalisé à 60 images/s
      const drag = 0.986 ** k;
      g.clearRect(0, 0, width, height);
      let alive = 0;
      for (const p of parts) {
        p.life += dt;
        if (p.life >= p.ttl) continue;
        alive += 1;
        p.vx *= drag;
        p.vy = Math.min(p.vy * drag + 0.15 * k, 3.6);
        p.flip += p.flipSpeed * k;
        p.rot += p.spin * k;
        p.x += (p.vx + Math.sin(p.flip) * p.sway) * k;
        p.y += p.vy * k;
        // Apparition franche, disparition en fondu sur le dernier tiers
        g.globalAlpha = 0.92 * Math.min(1, (p.ttl - p.life) / (p.ttl * 0.36));
        g.fillStyle = p.color;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        if (p.round) {
          g.beginPath();
          g.arc(0, 0, p.h * 0.9, 0, Math.PI * 2);
          g.fill();
        } else {
          // Le papier tourne sur lui-même : sa hauteur apparente oscille
          g.scale(1, Math.max(0.15, Math.abs(Math.cos(p.flip))));
          g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        g.restore();
      }
      if (alive) raf = requestAnimationFrame(frame);
      else stop();
    };
    raf = requestAnimationFrame(frame);
    signal?.addEventListener('abort', stop, { once: true });
  });
}
