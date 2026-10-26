'use strict';
/* =====================================================================
   utils.js — Funções matemáticas e de desenho reutilizadas no projeto.
   ===================================================================== */

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const circleHit = (a, b) => dist(a, b) < a.r + b.r;   // colisão círculo × círculo
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// Easing "passa um pouco e volta": dá aquele efeito elástico de desenho animado
const easeOutBack = t => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Gerador pseudo-aleatório com semente: o cenário sai sempre igual
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Preenche e contorna o caminho atual com a "tinta nanquim" dos anos 30
function inkShape(ctx, fill, lw = 3) {
  ctx.lineWidth = lw;
  ctx.strokeStyle = CONFIG.PAL.ink;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.stroke();
}

function starPath(ctx, x, y, r1, r2, points = 5, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = rot + (i * Math.PI) / points - Math.PI / 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// Texto com contorno grosso (estilo letreiro de cinema antigo)
function outlinedText(ctx, text, x, y, o = {}) {
  const size = o.size || 32;
  ctx.save();
  ctx.font = `${size}px ${o.font || FONT_TITLE}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = o.lw || Math.max(4, size / 6);
  ctx.strokeStyle = o.stroke || CONFIG.PAL.ink;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = o.fill || CONFIG.PAL.cream;
  ctx.fillText(text, x, y);
  ctx.restore();
}
