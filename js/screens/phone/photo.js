// La seule photo de la pellicule : une route de campagne, des collines, et au
// loin un panneau dont le texte est illisible sans zoomer. Tout est vectoriel :
// le texte reste net à fort grossissement.

import { lg, rg, ids, seeded } from './art.js';

// Panneau, en pixels logiques de la photo (320 × 480)
export const SIGN = { x: 152, y: 245, w: 26, h: 17 };

const VP = { x: 130, y: 226 };
const r2 = (n) => Math.round(n * 100) / 100;

// Point au sol : X en demi-largeurs de route (−1 et 1 = bords), s = profondeur (1 en bas, 0 à l'horizon)
const P = (X, s) => [r2(VP.x + s * (-25 + 145 * X)), r2(VP.y + 254 * s)];
const poly = (pts) => pts.map(([x, y]) => `${x},${y}`).join(' ');
const strip = (X0, X1, s0, s1) => poly([P(X0, s0), P(X1, s0), P(X1, s1), P(X0, s1)]);

function cloud(x, y, k, id) {
  const c = (dx, dy, r) => `<circle cx="${r2(x + dx * k)}" cy="${r2(y + dy * k)}" r="${r2(r * k)}"/>`;
  return `<g fill="url(#${id('cl')})">${c(-16, 2, 9)}${c(-6, -5, 12)}${c(8, -7, 10)}${c(18, 0, 8)}
    <ellipse cx="${r2(x)}" cy="${r2(y + 5 * k)}" rx="${r2(28 * k)}" ry="${r2(6 * k)}"/></g>`;
}

function poplar(X, z, id, rnd) {
  const s = 1 / z;
  const [x, y] = P(X, s);
  const h = 430 * s;
  const w = h * (0.2 + rnd() * 0.04);
  const lean = (rnd() - 0.5) * w * 0.3;
  return `<g>
    <ellipse cx="${r2(x + w * 0.2)}" cy="${r2(y)}" rx="${r2(w * 0.9)}" ry="${r2(w * 0.16)}" fill="#1f3d14" opacity=".35"/>
    <rect x="${r2(x - w * 0.05)}" y="${r2(y - h * 0.16)}" width="${r2(w * 0.1)}" height="${r2(h * 0.16)}" fill="#4a3a2a"/>
    <path d="M${r2(x)} ${r2(y - h * 0.1)} C${r2(x - w * 0.62)} ${r2(y - h * 0.24)} ${r2(x - w * 0.5 + lean)} ${r2(y - h * 0.8)} ${r2(x + lean)} ${r2(y - h)} C${r2(x + w * 0.5 + lean)} ${r2(y - h * 0.8)} ${r2(x + w * 0.62)} ${r2(y - h * 0.24)} ${r2(x)} ${r2(y - h * 0.1)}Z" fill="url(#${id('tree')})"/>
    <path d="M${r2(x + w * 0.05)} ${r2(y - h * 0.14)} C${r2(x + w * 0.5)} ${r2(y - h * 0.28)} ${r2(x + w * 0.36 + lean)} ${r2(y - h * 0.78)} ${r2(x + lean)} ${r2(y - h * 0.98)} C${r2(x + w * 0.2 + lean)} ${r2(y - h * 0.7)} ${r2(x + w * 0.26)} ${r2(y - h * 0.3)} ${r2(x + w * 0.05)} ${r2(y - h * 0.14)}Z" fill="#9dd06a" opacity=".28"/>
  </g>`;
}

function post(X, z) {
  const s = 1 / z;
  const [x, y] = P(X, s);
  const h = 44 * s;
  const w = Math.max(0.5, 6 * s);
  return `<rect x="${r2(x - w / 2)}" y="${r2(y - h)}" width="${r2(w)}" height="${r2(h)}" fill="#f4f4f0"/>
    <rect x="${r2(x - w / 2)}" y="${r2(y - h * 0.82)}" width="${r2(w)}" height="${r2(h * 0.16)}" fill="#202226"/>
    <rect x="${r2(x - w / 4)}" y="${r2(y - h * 0.78)}" width="${r2(w / 2)}" height="${r2(h * 0.08)}" fill="#ff7a3c"/>`;
}

export function photo({ className = 'ph-photo-svg', thumb = false } = {}) {
  const id = ids('ph');
  const rnd = seeded(2007);

  // Lignes de lavande à gauche, blé à droite, parallèles à la route
  const lavender = [];
  for (let X = -2.05; X > -16; X -= 0.42 + (-X - 2) * 0.05) {
    lavender.push(`<polygon points="${strip(X - 0.13, X + 0.13, 0.002, 1.6)}"/>`);
  }
  const wheat = [];
  for (let X = 1.7; X < 18; X += 0.5 + (X - 1.7) * 0.06) {
    wheat.push(`<polygon points="${strip(X - 0.09, X + 0.09, 0.002, 1.6)}"/>`);
  }

  // Pointillés centraux en perspective
  const dashes = [];
  for (let k = 0; k < 26; k++) {
    const z0 = 1.15 + k * 2.4;
    const s0 = 1 / z0;
    const s1 = 1 / (z0 + 0.95);
    dashes.push(`<polygon points="${strip(-0.03, 0.03, s1, s0)}"/>`);
  }

  const trees = [];
  for (const z of [2.6, 3.7, 5, 6.6, 8.6, 11.2, 14.5, 19, 25, 33]) trees.push(poplar(-1.62, z, id, rnd));
  const posts = [];
  for (const z of [1.5, 3.2, 4.9, 6.6, 8.3, 10, 11.7, 13.4, 15.1, 16.8]) posts.push(post(1.18, z));
  for (const z of [1.9, 3.6, 5.3, 7, 8.7, 10.4]) posts.push(post(-1.18, z));

  const birds = [
    [214, 104, 1],
    [226, 98, 0.8],
    [238, 109, 0.7],
  ]
    .map(([x, y, k]) => `<path d="M${x - 3 * k} ${y - 1 * k} q${1.5 * k} ${-1.2 * k} ${3 * k} ${0.6 * k} q${1.5 * k} ${-1.8 * k} ${3 * k} ${-0.6 * k}" fill="none" stroke="#3a4250" stroke-width="${0.5 * k}" stroke-linecap="round"/>`)
    .join('');

  const { x: sx, y: sy, w: sw, h: sh } = SIGN;
  const cx = sx + sw / 2;

  return `<svg class="${className}" viewBox="0 0 320 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      ${lg(id('sky'), [[0, '#2a64b4'], [0.35, '#4f8ed6'], [0.72, '#a8cdea'], [0.93, '#e9eef0'], [1, '#f6e7cb']])}
      ${rg(id('sun'), [[0, '#fffdf0', 1], [0.08, '#fff6c8', 0.95], [0.3, '#ffe9a8', 0.35], [1, '#ffe9a8', 0]])}
      ${lg(id('cl'), [[0, '#ffffff'], [0.7, '#f3f6fa'], [1, '#c9d6e4']])}
      ${lg(id('mt'), [[0, '#88a3c2'], [1, '#bccddc']])}
      ${lg(id('hill'), [[0, '#7da66a'], [1, '#93b58a']])}
      ${lg(id('gnd'), [[0, '#a4bf80'], [0.12, '#79a84e'], [0.5, '#5a9437'], [1, '#3b7522']])}
      ${lg(id('road'), [[0, '#aeb3b8'], [0.08, '#8c9096'], [0.4, '#63676d'], [1, '#3e4146']])}
      ${lg(id('tree'), [[0, '#3f7a2c'], [1, '#1f4d18']], [0, 0, 1, 0])}
      ${lg(id('haze'), [[0, '#e9eef0', 0], [0.5, '#e9eef0', 0.55], [1, '#e9eef0', 0]])}
      ${rg(id('vig'), [[0, '#000', 0], [0.62, '#000', 0], [1, '#000', 0.42]], { r: 0.72 })}
    </defs>

    <rect width="320" height="240" fill="url(#${id('sky')})"/>
    <circle cx="66" cy="64" r="150" fill="url(#${id('sun')})"/>
    <circle cx="66" cy="64" r="11" fill="#fffdf2"/>
    ${cloud(222, 62, 1.3, id)}${cloud(108, 142, 0.9, id)}${cloud(286, 156, 0.75, id)}${cloud(30, 176, 0.6, id)}
    ${birds}

    <path d="M-4 207 Q16 196 36 201 T74 191 T112 198 T150 186 T188 196 T226 184 T264 197 T300 189 T330 199 V240 H-4Z" fill="url(#${id('mt')})"/>
    <path d="M150 186 q8 6 14 4 q-6 -2 -14 -4z M226 184 q7 6 13 4 q-6 -2 -13 -4z M74 191 q6 5 11 3z" fill="#f2f6fa" opacity=".8"/>
    <path d="M-4 219 Q28 208 62 214 T126 211 T188 217 T250 208 T324 215 V240 H-4Z" fill="url(#${id('hill')})"/>
    <rect x="0" y="206" width="320" height="26" fill="url(#${id('haze')})"/>

    <rect y="224" width="320" height="256" fill="url(#${id('gnd')})"/>
    <g fill="#8a6bcf" opacity=".9">${lavender.join('')}</g>
    <g fill="#d6c25e" opacity=".55">${wheat.join('')}</g>

    <g>
      <rect x="171" y="227.6" width="7" height="4" fill="#f1ece0"/>
      <path d="M170.2 227.9 L174.5 225 L178.8 227.9Z" fill="#b8452e"/>
      <rect x="172.3" y="229.3" width="1.3" height="1.4" fill="#5a4a3a"/>
      <rect x="175.5" y="229.3" width="1.3" height="1.2" fill="#7fa4c4"/>
      <circle cx="182" cy="229" r="2.6" fill="#3f6e2c"/><circle cx="185" cy="229.6" r="1.9" fill="#4b7d33"/>
    </g>

    <polygon points="${strip(-1.12, 1.12, 0.002, 1.6)}" fill="#c8bb98"/>
    <polygon points="${strip(-1, 1, 0.002, 1.6)}" fill="url(#${id('road')})"/>
    <g fill="#fdfdf8" opacity=".9">
      <polygon points="${strip(-0.95, -0.91, 0.002, 1.6)}"/>
      <polygon points="${strip(0.91, 0.95, 0.002, 1.6)}"/>
      ${dashes.join('')}
    </g>

    <g>${posts.join('')}</g>

    <g class="ph-sign">
      <ellipse cx="${cx + 1.5}" cy="${sy + sh + 9.6}" rx="10" ry="1.1" fill="#203a14" opacity=".35"/>
      <rect x="${sx + 5.4}" y="${sy + sh - 1}" width="1.3" height="${10.6}" fill="#7d8186"/>
      <rect x="${sx + 19.3}" y="${sy + sh - 1}" width="1.3" height="${10.6}" fill="#7d8186"/>
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="1.4" fill="#0f7046"/>
      <rect x="${sx + 1.05}" y="${sy + 1.05}" width="${sw - 2.1}" height="${sh - 2.1}" rx=".8" fill="none" stroke="#f4f7f2" stroke-width=".65"/>
      <g class="ph-sign-far" fill="#f4f7f2" opacity=".75">
        <rect x="${sx + 4.5}" y="${sy + 3.7}" width="17" height="1.6" rx=".8"/>
        <rect x="${sx + 6.5}" y="${sy + 7.1}" width="13" height="1.6" rx=".8"/>
        <rect x="${sx + 7.5}" y="${sy + 10.6}" width="11" height="3.6" rx="1"/>
      </g>
      ${
        thumb
          ? ''
          : `<g class="ph-sign-near" fill="#f8faf6" font-weight="700" text-anchor="middle">
        <text x="${cx}" y="${sy + 5.6}" font-size="2.7">Pour rentrer,</text>
        <text x="${cx}" y="${sy + 9}" font-size="2.7">appelez le</text>
        <text x="${cx}" y="${sy + 14.8}" font-size="5.4" letter-spacing=".15">2026</text>
      </g>`
      }
    </g>

    <g>${trees.reverse().join('')}</g>

    <g fill="#2f6a1d" opacity=".9">
      <path d="M262 480 q4 -18 9 -26 q-2 12 1 26z M276 480 q2 -14 8 -22 q-3 10 -2 22z M292 480 q-3 -16 -10 -24 q7 6 13 24z M304 480 q3 -20 12 -30 q-6 14 -5 30z"/>
      <path d="M-2 480 q6 -16 14 -22 q-6 10 -4 22z M10 480 q3 -12 9 -18 q-4 8 -3 18z" />
    </g>
    <rect width="320" height="480" fill="url(#${id('vig')})"/>
  </svg>`;
}
