'use strict';
/* =====================================================================
   sprites.js — Carrega as imagens (PNG) dos personagens. Se a imagem
   não existir ou falhar, usa a função de "fallback" que desenha o
   personagem diretamente no canvas, com estética de desenho antigo.
   ===================================================================== */

class SpriteImage {
  constructor(cfg, fallback) {
    this.h = cfg.height;
    this.flip = !!cfg.flip;
    this.fallback = fallback;
    this.ok = false;
    this.img = null;
    if (cfg.src) {
      this.img = new Image();
      this.img.onload = () => { this.ok = this.img.naturalWidth > 0; };
      this.img.onerror = () => { this.ok = false; };
      this.img.src = cfg.src;
    }
  }

  // Desenha centralizado em (x, y). Opções: rot (radianos), flash (brilho ao levar dano), t (tempo p/ animar)
  draw(ctx, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flash) ctx.filter = 'brightness(2.2) contrast(0.9)';
    if (this.ok) {
      if (this.flip) ctx.scale(-1, 1);
      const w = this.h * this.img.naturalWidth / this.img.naturalHeight;
      ctx.drawImage(this.img, -w / 2, -this.h / 2, w, this.h);
    } else {
      this.fallback(ctx, this.h, o);
    }
    ctx.restore();
  }
}

/* ---------- Fallbacks desenhados em canvas (rubber-hose / anos 30) ---------- */

// Bombardino Crocodilo: crocodilo-bombardeiro, olhando para a direita
function drawCrocodilePlane(ctx, h) {
  const P = CONFIG.PAL, u = h / 100, t = performance.now() / 1000;
  ctx.scale(u, u);

  // cauda e leme
  ctx.beginPath();
  ctx.moveTo(-60, -4); ctx.lineTo(-98, -36); ctx.lineTo(-92, -2); ctx.lineTo(-102, 22); ctx.lineTo(-58, 8); ctx.closePath();
  inkShape(ctx, P.tan);

  // asa
  ctx.beginPath();
  ctx.moveTo(-30, 8); ctx.quadraticCurveTo(-52, 36, -72, 54); ctx.lineTo(-38, 52); ctx.quadraticCurveTo(-6, 34, 8, 12); ctx.closePath();
  inkShape(ctx, P.tan);

  // fuselagem
  ctx.beginPath(); ctx.ellipse(-12, 2, 58, 25, 0, 0, TAU); inkShape(ctx, P.sand);
  ctx.beginPath(); ctx.moveTo(-50, 6); ctx.quadraticCurveTo(-12, 22, 28, 8); ctx.lineWidth = 2; ctx.strokeStyle = P.brown; ctx.stroke();

  // bomba pendurada
  ctx.beginPath(); ctx.ellipse(-12, 34, 17, 8, 0, 0, TAU); inkShape(ctx, P.dark);
  ctx.beginPath(); ctx.moveTo(-26, 30); ctx.lineTo(-30, 24); ctx.lineTo(-30, 38); ctx.closePath(); inkShape(ctx, P.dark, 2);

  // cabeça e focinho de crocodilo
  ctx.beginPath(); ctx.ellipse(40, -6, 26, 22, 0, 0, TAU); inkShape(ctx, P.brown);
  ctx.beginPath();
  ctx.moveTo(40, -12); ctx.quadraticCurveTo(80, -16, 94, -4); ctx.quadraticCurveTo(96, 10, 80, 13); ctx.lineTo(40, 15); ctx.closePath();
  inkShape(ctx, P.brown);

  // dentes
  for (let i = 0; i < 5; i++) {
    const x = 52 + i * 8;
    ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x + 4, 4); ctx.lineTo(x + 8, 12); ctx.closePath(); inkShape(ctx, P.cream, 1.5);
  }

  // olho + gorro de aviador
  ctx.beginPath(); ctx.arc(40, -18, 9, 0, TAU); inkShape(ctx, P.cream, 2.5);
  ctx.beginPath(); ctx.arc(43, -18, 4, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(34, -22, 18, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); inkShape(ctx, P.dark);
  ctx.beginPath(); ctx.arc(40, -26, 7, 0, TAU); inkShape(ctx, P.sand, 2.5);

  // hélice girando
  ctx.save();
  ctx.translate(98, -2);
  ctx.scale(1, Math.sin(t * 40));
  ctx.beginPath(); ctx.ellipse(0, 0, 4, 26, 0, 0, TAU); inkShape(ctx, P.ink, 2);
  ctx.restore();
}

// Tralalero Tralala: tubarão de três pernas com tênis, olhando para a esquerda
function drawShark(ctx, h, o) {
  const P = CONFIG.PAL, u = h / 170, t = (o && o.t) || performance.now() / 1000;
  ctx.scale(u, u);

  // três pernas com tênis (animadas como se estivesse correndo)
  for (let i = 0; i < 3; i++) {
    const x = -40 + i * 38, sw = Math.sin(t * 7 + i * 2) * 8;
    ctx.beginPath(); ctx.moveTo(x, 34); ctx.quadraticCurveTo(x + sw, 60, x + sw * 1.3, 78);
    ctx.lineWidth = 15; ctx.strokeStyle = P.ink; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = P.sand; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + sw * 1.3 - 9, 82, 20, 10, 0, 0, TAU); inkShape(ctx, P.cream, 3);
    ctx.beginPath(); ctx.moveTo(x + sw * 1.3 - 22, 86); ctx.lineTo(x + sw * 1.3 + 4, 86); ctx.lineWidth = 3; ctx.strokeStyle = P.red; ctx.stroke();
  }

  // cauda
  ctx.beginPath(); ctx.moveTo(78, -4); ctx.lineTo(118, -42); ctx.lineTo(104, -2); ctx.lineTo(120, 36); ctx.lineTo(76, 12); ctx.closePath();
  inkShape(ctx, P.tan);

  // barbatana dorsal
  ctx.beginPath(); ctx.moveTo(-22, -34); ctx.quadraticCurveTo(10, -90, 46, -34); ctx.closePath(); inkShape(ctx, P.tan);

  // corpo
  ctx.beginPath(); ctx.ellipse(-4, 0, 92, 44, 0, 0, TAU); inkShape(ctx, P.tan);
  ctx.beginPath(); ctx.ellipse(-12, 14, 74, 24, 0, 0, TAU); ctx.fillStyle = P.cream; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-4, 0, 92, 44, 0, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = P.ink; ctx.stroke();

  // boca com dentes
  ctx.beginPath(); ctx.moveTo(-90, 6); ctx.quadraticCurveTo(-54, 34, -20, 18); ctx.lineWidth = 4; ctx.strokeStyle = P.ink; ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const x = -84 + i * 10, y = 8 + Math.sin(i * 0.5) * 8;
    ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + 5, y + 14); ctx.lineTo(x + 10, y + 5); ctx.closePath(); inkShape(ctx, P.cream, 1.5);
  }

  // olho enorme e bravo
  ctx.beginPath(); ctx.arc(-52, -14, 16, 0, TAU); inkShape(ctx, P.cream, 3);
  ctx.beginPath(); ctx.arc(-57, -13, 7, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-72, -34); ctx.lineTo(-34, -22); ctx.lineWidth = 6; ctx.strokeStyle = P.ink; ctx.stroke();
}

// Sapo trompetista, olhando para a esquerda
function drawFrogTrumpeter(ctx, h, o) {
  const P = CONFIG.PAL, u = h / 60, t = (o && o.t) || 0;
  ctx.scale(u, u);
  const bob = Math.sin(t * 6) * 2;
  ctx.translate(0, bob);

  // pernas
  ctx.beginPath(); ctx.ellipse(-10, 24, 10, 6, 0, 0, TAU); inkShape(ctx, P.brown, 2.5);
  ctx.beginPath(); ctx.ellipse(12, 24, 10, 6, 0, 0, TAU); inkShape(ctx, P.brown, 2.5);

  // corpo e cabeça
  ctx.beginPath(); ctx.ellipse(0, 8, 22, 19, 0, 0, TAU); inkShape(ctx, P.tan);
  ctx.beginPath(); ctx.ellipse(0, 12, 14, 11, 0, 0, TAU); ctx.fillStyle = P.sand; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-2, -10, 20, 14, 0, 0, TAU); inkShape(ctx, P.tan);

  // olhos
  for (const ex of [-10, 8]) {
    ctx.beginPath(); ctx.arc(ex, -23, 8, 0, TAU); inkShape(ctx, P.cream, 2.5);
    ctx.beginPath(); ctx.arc(ex - 3, -22, 3.2, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
  }

  // cartola
  ctx.beginPath(); ctx.rect(-12, -46, 18, 15); inkShape(ctx, P.ink, 2);
  ctx.beginPath(); ctx.moveTo(-18, -31); ctx.lineTo(12, -31); ctx.lineWidth = 4; ctx.strokeStyle = P.ink; ctx.stroke();

  // bochechas infladas e trompete
  ctx.beginPath(); ctx.arc(-18, -6, 8, 0, TAU); inkShape(ctx, P.sand, 2.5);
  const bell = 1 + Math.sin(t * 12) * 0.08;
  ctx.beginPath();
  ctx.moveTo(-22, -9); ctx.lineTo(-44, -10); ctx.lineTo(-54 * bell, -19); ctx.lineTo(-54 * bell, 11); ctx.lineTo(-44, 0); ctx.lineTo(-22, -2); ctx.closePath();
  inkShape(ctx, P.cream, 2.5);
}

// Peixe-voador, olhando para a esquerda
function drawFlyingFish(ctx, h, o) {
  const P = CONFIG.PAL, u = h / 44, t = (o && o.t) || 0;
  ctx.scale(u, u);
  const flap = Math.sin(t * 14);

  // asa de trás
  ctx.beginPath(); ctx.moveTo(2, -4); ctx.quadraticCurveTo(14, -34 - flap * 12, 30, -22 - flap * 10); ctx.quadraticCurveTo(22, -8, 10, 0); ctx.closePath();
  inkShape(ctx, P.cream, 2.5);

  // cauda
  ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(42, -14); ctx.lineTo(38, 0); ctx.lineTo(42, 14); ctx.closePath(); inkShape(ctx, P.tan, 2.5);

  // corpo
  ctx.beginPath(); ctx.ellipse(0, 0, 27, 14, 0, 0, TAU); inkShape(ctx, P.sand, 3);
  ctx.beginPath(); ctx.ellipse(-2, 6, 20, 6, 0, 0, TAU); ctx.fillStyle = P.cream; ctx.fill();

  // olho e boca
  ctx.beginPath(); ctx.arc(-14, -3, 5.5, 0, TAU); inkShape(ctx, P.cream, 2);
  ctx.beginPath(); ctx.arc(-15.5, -3, 2.4, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-26, 3); ctx.quadraticCurveTo(-20, 7, -15, 4); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();

  // asa da frente
  ctx.beginPath(); ctx.moveTo(4, 2); ctx.quadraticCurveTo(14, 30 + flap * 10, 30, 22 + flap * 8); ctx.quadraticCurveTo(22, 8, 10, 2); ctx.closePath();
  inkShape(ctx, P.cream, 2.5);
}

function loadSprites() {
  const S = CONFIG.SPRITES;
  return {
    player: new SpriteImage(S.player, drawCrocodilePlane),
    boss: new SpriteImage(S.boss, drawShark),
    frog: new SpriteImage({ height: 58, src: null }, drawFrogTrumpeter),
    fish: new SpriteImage({ height: 44, src: null }, drawFlyingFish)
  };
}
