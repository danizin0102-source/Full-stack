'use strict';
/* =====================================================================
   background.js — Cenário com parallax em 3 camadas de profundidade:
     1) FUNDO (lento):  céu noturno, lua sorridente gigante, nuvens-fumaça
     2) MEIO  (médio):  árvores velhas com rostos e cipós retorcidos
     3) FRENTE (rápido): vitórias-régias, libélulas de cartola e névoa
   As camadas "de tile" são desenhadas UMA vez em canvas offscreen e depois
   apenas deslocadas (e repetidas) a cada frame: é bem mais rápido.
   ===================================================================== */

class Background {
  constructor() {
    this.W = CONFIG.W;
    this.H = CONFIG.H;
    this.TW = 1920;                       // largura do tile (2x a tela) para repetir sem emendas
    this.t = 0;
    this.scroll = { mid: 0, front: 0 };
    this.jit = { x: 0, y: 0 };            // "tremidinha" de desenho animado (line boil)
    this.boilT = 0;
    this.moon = { x: 700, y: 170 };

    this.sky = this.makeSky();
    this.mid = this.makeMid();
    this.front = this.makeFront();

    const rng = mulberry32(77);
    this.clouds = Array.from({ length: 7 }, () => ({
      x: rng() * 1300, y: 40 + rng() * 210, s: 0.7 + rng() * 0.9, v: 12 + rng() * 20, seed: rng()
    }));
    this.flies = Array.from({ length: 5 }, () => ({
      x: rng() * 1500, y: 80 + rng() * 300, v: 380 + rng() * 160, ph: rng() * 6, s: 0.8 + rng() * 0.5
    }));
    this.fog = Array.from({ length: 6 }, () => ({
      x: rng() * 1600, y: this.H * 0.45 + rng() * this.H * 0.5, w: 320 + rng() * 300, h: 50 + rng() * 40, v: 230 + rng() * 120
    }));
  }

  /* ------------------------- pré-renderização ------------------------- */

  newCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  makeSky() {
    const P = CONFIG.PAL, rng = mulberry32(3);
    const c = this.newCanvas(this.W, this.H), g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, P.night1);
    grad.addColorStop(0.55, P.night2);
    grad.addColorStop(1, P.horizon);
    g.fillStyle = grad;
    g.fillRect(0, 0, this.W, this.H);

    for (let i = 0; i < 90; i++) {
      g.globalAlpha = 0.35 + rng() * 0.65;
      g.fillStyle = P.cream;
      g.beginPath(); g.arc(rng() * this.W, rng() * this.H * 0.7, 0.6 + rng() * 1.6, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 12; i++) {                      // estrelinhas de 4 pontas
      const x = rng() * this.W, y = rng() * this.H * 0.55, r = 4 + rng() * 5;
      g.fillStyle = P.cream;
      g.beginPath();
      g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
      g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r);
      g.fill();
    }
    return c;
  }

  makeMid() {
    const P = CONFIG.PAL, rng = mulberry32(11), TW = this.TW, H = this.H;
    const c = this.newCanvas(TW, H), g = c.getContext('2d');

    // 1) especificação das árvores (para poder desenhá-las 3x e emendar o tile)
    const trees = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      trees.push({
        x: (i + 0.5) * (TW / n) + (rng() - 0.5) * 60,
        w: 54 + rng() * 40,
        top: 70 + rng() * 120,
        lean: (rng() - 0.5) * 70,
        face: rng() < 0.7,
        faceY: 230 + rng() * 80,
        mood: Math.floor(rng() * 3),
        branches: [
          { side: -1, y: 170 + rng() * 90, len: 80 + rng() * 80 },
          { side: 1, y: 200 + rng() * 90, len: 70 + rng() * 90 }
        ]
      });
    }
    // 2) cipós retorcidos que descem do topo
    const vines = [];
    for (let i = 0; i < 14; i++) {
      vines.push({ x: rng() * TW, len: 120 + rng() * 260, sway: (rng() - 0.5) * 90, curl: rng() < 0.5, th: 5 + rng() * 5 });
    }

    // desenha o fundo "fantasma" de silhuetas distantes
    g.fillStyle = 'rgba(20,12,6,0.55)';
    for (let i = 0; i < 28; i++) {
      const x = rng() * TW, w = 18 + rng() * 22;
      g.fillRect(x, 120 + rng() * 120, w, H);
    }

    for (const v of vines) for (const off of [-TW, 0, TW]) this.drawVine(g, v, off);
    for (const t of trees) for (const off of [-TW, 0, TW]) this.drawTree(g, t, off);
    return c;
  }

  drawVine(g, v, off) {
    const P = CONFIG.PAL, x = v.x + off;
    if (x < -150 || x > this.TW + 150) return;
    g.save();
    g.lineCap = 'round';
    const path = () => {
      g.beginPath();
      g.moveTo(x, -10);
      g.bezierCurveTo(x + v.sway, v.len * 0.3, x - v.sway, v.len * 0.65, x + v.sway * 0.4, v.len);
      if (v.curl) g.bezierCurveTo(x + v.sway * 0.4 + 26, v.len + 10, x + v.sway * 0.4 + 26, v.len + 38, x + v.sway * 0.4 + 4, v.len + 34);
    };
    path(); g.lineWidth = v.th + 5; g.strokeStyle = P.ink; g.stroke();
    path(); g.lineWidth = v.th; g.strokeStyle = P.brown; g.stroke();
    // folhinhas
    g.fillStyle = P.dark;
    for (let k = 1; k <= 3; k++) {
      const ly = (v.len * k) / 4;
      g.beginPath(); g.ellipse(x + v.sway * 0.2, ly, 9, 4, 0.6, 0, TAU); g.fill(); g.lineWidth = 2; g.strokeStyle = P.ink; g.stroke();
    }
    g.restore();
  }

  drawTree(g, t, off) {
    const P = CONFIG.PAL, H = this.H, x = t.x + off;
    if (x < -220 || x > this.TW + 220) return;
    g.save();
    g.lineJoin = 'round'; g.lineCap = 'round';

    // galhos (atrás do tronco)
    for (const b of t.branches) {
      const bx = x + b.side * t.w * 0.3 + t.lean * 0.4, by = b.y;
      const ex = bx + b.side * b.len, ey = by - 50 - b.len * 0.2;
      const path = () => { g.beginPath(); g.moveTo(bx, by); g.bezierCurveTo(bx + b.side * b.len * 0.3, by - 40, ex - b.side * 20, ey + 30, ex, ey); };
      path(); g.lineWidth = 20; g.strokeStyle = P.ink; g.stroke();
      path(); g.lineWidth = 13; g.strokeStyle = P.dark; g.stroke();
      // dedinhos de galho
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + b.side * (14 + k * 6), ey - 18 + k * 12);
        g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();
      }
    }

    // tronco retorcido
    const tx = t.lean, tp = () => {
      g.beginPath();
      g.moveTo(x - t.w / 2, H);
      g.bezierCurveTo(x - t.w * 0.2 - 30, H * 0.7, x - t.w * 0.7 + tx, H * 0.45, x - t.w * 0.3 + tx, t.top);
      g.lineTo(x + t.w * 0.3 + tx, t.top);
      g.bezierCurveTo(x + t.w * 0.9 + tx, H * 0.45, x + t.w * 0.1 + 30, H * 0.7, x + t.w / 2, H);
      g.closePath();
    };
    tp(); g.fillStyle = P.dark; g.fill(); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke();
    // veios da madeira
    g.strokeStyle = P.brown; g.lineWidth = 3;
    for (let k = -1; k <= 1; k++) {
      g.beginPath(); g.moveTo(x + k * t.w * 0.22, H); g.bezierCurveTo(x + k * 18 + tx * 0.3, H * 0.7, x + k * 22 + tx * 0.6, H * 0.5, x + k * 10 + tx * 0.9, t.top + 30);
      g.stroke();
    }

    // rosto caricato
    if (t.face) {
      const fx = x + tx * (1 - (t.faceY / H)) * 0.6, fy = t.faceY;
      for (const ex of [-14, 14]) {
        g.beginPath(); g.ellipse(fx + ex, fy, 12, 15, 0, 0, TAU); g.fillStyle = P.cream; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
        // olho "torta" (pie-eye) dos anos 30
        g.fillStyle = P.ink;
        g.beginPath(); g.arc(fx + ex, fy + 2, 6, 0, TAU); g.fill();
        g.fillStyle = P.cream; g.fillRect(fx + ex - 1.5, fy - 2, 7, 3.5);
      }
      g.beginPath(); g.moveTo(fx - 28, fy - 22); g.lineTo(fx - 4, fy - 14); g.moveTo(fx + 28, fy - 22 + t.mood * 3); g.lineTo(fx + 4, fy - 14);
      g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();                             // sobrancelhas grossas
      g.beginPath(); g.moveTo(fx, fy - 2); g.quadraticCurveTo(fx + 14, fy + 12, fx + 2, fy + 18); g.lineWidth = 4; g.stroke(); // nariz
      // boca
      g.beginPath();
      if (t.mood === 0) { g.moveTo(fx - 24, fy + 32); g.quadraticCurveTo(fx, fy + 56, fx + 24, fy + 30); g.closePath(); }
      else if (t.mood === 1) { g.ellipse(fx, fy + 40, 14, 11, 0, 0, TAU); }
      else { g.moveTo(fx - 22, fy + 40); g.quadraticCurveTo(fx, fy + 28, fx + 22, fy + 40); g.quadraticCurveTo(fx, fy + 54, fx - 22, fy + 40); }
      g.fillStyle = P.ink; g.fill(); g.lineWidth = 3; g.stroke();
      g.fillStyle = P.cream;                                                           // dentões
      g.fillRect(fx - 8, fy + 32, 7, 8); g.fillRect(fx + 1, fy + 32, 7, 8);
    }

    // barba de musgo pendurada
    g.strokeStyle = P.brown; g.lineWidth = 4;
    for (let k = 0; k < 6; k++) {
      const mx = x - t.w * 0.4 + k * (t.w * 0.16) + t.lean * 0.5, my = t.top + 20 + (k % 2) * 8;
      g.beginPath(); g.moveTo(mx, my); g.quadraticCurveTo(mx + 6, my + 30, mx - 4, my + 58 + (k % 3) * 14); g.stroke();
    }
    g.restore();
  }

  makeFront() {
    const P = CONFIG.PAL, rng = mulberry32(29), TW = this.TW, H = this.H;
    const c = this.newCanvas(TW, H), g = c.getContext('2d');
    const top = H - 58;

    // juncos com espiga (cattails)
    for (let i = 0; i < 9; i++) {
      const x = 60 + rng() * (TW - 120), hgt = 90 + rng() * 80, lean = (rng() - 0.5) * 30;
      g.beginPath(); g.moveTo(x, top + 14); g.quadraticCurveTo(x + lean * 0.4, top - hgt * 0.5, x + lean, top - hgt);
      g.lineWidth = 7; g.strokeStyle = P.ink; g.lineCap = 'round'; g.stroke();
      g.lineWidth = 3.5; g.strokeStyle = P.brown; g.stroke();
      g.beginPath(); g.ellipse(x + lean, top - hgt - 12, 6, 17, lean * 0.01, 0, TAU); g.fillStyle = P.dark; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
    }

    // água
    const wg = g.createLinearGradient(0, top, 0, H);
    wg.addColorStop(0, '#3a3a2a'); wg.addColorStop(1, '#17110a');
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= TW; x += 8) g.lineTo(x, top + Math.sin((x / TW) * TAU * 20) * 4);
    g.lineTo(TW, H); g.closePath();
    g.fillStyle = wg; g.fill(); g.lineWidth = 4; g.strokeStyle = P.ink; g.stroke();

    // vitórias-régias (com a "fatia" característica)
    for (let i = 0; i < 16; i++) {
      const x = 40 + rng() * (TW - 80), y = top + 14 + rng() * 34, rx = 30 + rng() * 22, ry = 9 + rng() * 5, notch = rng() * TAU;
      g.beginPath(); g.moveTo(x, y); g.ellipse(x, y, rx, ry, 0, notch + 0.25, notch + TAU - 0.25); g.closePath();
      g.fillStyle = P.tan; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
      g.beginPath(); g.ellipse(x - rx * 0.1, y - 2, rx * 0.5, ry * 0.4, 0, 0, TAU); g.fillStyle = 'rgba(243,227,187,0.25)'; g.fill();
      if (rng() < 0.4) {                                                // florzinha
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * TAU;
          g.beginPath(); g.ellipse(x + Math.cos(a) * 7, y - 6 + Math.sin(a) * 4, 6, 3.5, a, 0, TAU); g.fillStyle = P.cream; g.fill(); g.lineWidth = 2; g.strokeStyle = P.ink; g.stroke();
        }
        g.beginPath(); g.arc(x, y - 6, 3, 0, TAU); g.fillStyle = P.red; g.fill();
      }
    }
    return c;
  }

  /* ------------------------------ lógica ------------------------------ */

  update(dt, speed = 1) {
    this.t += dt;
    this.scroll.mid = (this.scroll.mid + 90 * speed * dt) % this.TW;
    this.scroll.front = (this.scroll.front + 300 * speed * dt) % this.TW;

    for (const c of this.clouds) { c.x -= c.v * speed * dt; if (c.x < -260) { c.x = this.W + 260 + Math.random() * 200; c.y = 40 + Math.random() * 210; } }
    for (const f of this.flies) { f.x -= f.v * speed * dt; if (f.x < -60) { f.x = this.W + 80 + Math.random() * 600; f.y = 80 + Math.random() * 320; } }
    for (const f of this.fog) { f.x -= f.v * speed * dt; if (f.x < -f.w) { f.x = this.W + f.w + Math.random() * 300; f.y = this.H * 0.45 + Math.random() * this.H * 0.5; } }

    this.boilT -= dt;                              // animação "em dois" dos desenhos antigos
    if (this.boilT <= 0) { this.boilT = 0.12; this.jit.x = (Math.random() - 0.5) * 3; this.jit.y = (Math.random() - 0.5) * 3; }
  }

  /* ------------------------------ desenho ----------------------------- */

  drawTile(ctx, img, sc, jx, jy) {
    const o = Math.floor(sc);
    ctx.drawImage(img, -o + jx, jy);
    ctx.drawImage(img, this.TW - o + jx, jy);
  }

  // Tudo que fica ATRÁS dos personagens
  drawBack(ctx, focus) {
    ctx.drawImage(this.sky, 0, 0);
    this.drawMoon(ctx, focus);
    this.drawClouds(ctx);
    this.drawTile(ctx, this.mid, this.scroll.mid, this.jit.x, this.jit.y);

    // bruma entre as árvores e a água
    const h = ctx.createLinearGradient(0, this.H * 0.55, 0, this.H);
    h.addColorStop(0, 'rgba(120,100,70,0)');
    h.addColorStop(1, 'rgba(120,100,70,0.35)');
    ctx.fillStyle = h; ctx.fillRect(0, this.H * 0.55, this.W, this.H * 0.45);

    this.drawTile(ctx, this.front, this.scroll.front, 0, 0);
  }

  // Elementos que passam NA FRENTE dos personagens (reforçam a profundidade)
  drawFront(ctx) {
    this.drawFlies(ctx);
    this.drawFog(ctx);
  }

  drawMoon(ctx, focus) {
    const P = CONFIG.PAL, R = 118, span = this.W + 500;
    const mx = ((((700 - this.t * 4) % span) + span) % span) - 250;
    const my = 175 + Math.sin(this.t * 0.6) * 6;
    this.moon.x = mx; this.moon.y = my;

    ctx.save();
    // halo
    const halo = ctx.createRadialGradient(mx, my, R * 0.8, mx, my, R * 2.3);
    halo.addColorStop(0, 'rgba(243,227,187,0.28)'); halo.addColorStop(1, 'rgba(243,227,187,0)');
    ctx.fillStyle = halo; ctx.fillRect(mx - R * 2.4, my - R * 2.4, R * 4.8, R * 4.8);

    // disco
    ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU);
    const mg = ctx.createRadialGradient(mx - 30, my - 30, 10, mx, my, R);
    mg.addColorStop(0, '#f8ecc9'); mg.addColorStop(1, P.sand);
    inkShape(ctx, mg, 5);
    // crateras
    ctx.fillStyle = 'rgba(176,138,84,0.35)';
    for (const [dx, dy, r] of [[-70, 40, 16], [72, -52, 12], [60, 62, 9], [-60, -66, 11]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, TAU); ctx.fill(); }
    // bochechas
    ctx.fillStyle = 'rgba(179,64,42,0.22)';
    for (const dx of [-70, 70]) { ctx.beginPath(); ctx.ellipse(mx + dx, my + 22, 17, 11, 0, 0, TAU); ctx.fill(); }

    // olhos que seguem o jogador
    for (const dx of [-38, 38]) {
      const ex = mx + dx, ey = my - 20;
      ctx.beginPath(); ctx.ellipse(ex, ey, 17, 23, 0, 0, TAU); inkShape(ctx, '#fff7e0', 3.5);
      let ax = 0, ay = 0;
      if (focus) { const d = Math.hypot(focus.x - ex, focus.y - ey) || 1; ax = ((focus.x - ex) / d) * 7; ay = ((focus.y - ey) / d) * 9; }
      ctx.beginPath(); ctx.ellipse(ex + ax, ey + ay, 7, 10, 0, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
      ctx.beginPath(); ctx.arc(ex + ax - 2, ey + ay - 4, 2.2, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
      // pálpebra pesada
      ctx.beginPath(); ctx.moveTo(ex - 18, ey - 4); ctx.quadraticCurveTo(ex, ey - 16, ex + 18, ey - 4); ctx.lineWidth = 5; ctx.strokeStyle = P.ink; ctx.stroke();
    }
    // nariz
    ctx.beginPath(); ctx.moveTo(mx - 4, my - 2); ctx.quadraticCurveTo(mx + 12, my + 12, mx - 2, my + 18); ctx.lineWidth = 4; ctx.strokeStyle = P.ink; ctx.stroke();

    // sorrisão
    ctx.beginPath();
    ctx.moveTo(mx - 62, my + 36);
    ctx.quadraticCurveTo(mx, my + 112, mx + 62, my + 36);
    ctx.quadraticCurveTo(mx, my + 52, mx - 62, my + 36);
    inkShape(ctx, P.ink, 4);
    ctx.save(); ctx.clip();
    ctx.fillStyle = P.cream; ctx.fillRect(mx - 60, my + 34, 120, 14);                       // dentes de cima
    ctx.fillStyle = P.red; ctx.beginPath(); ctx.ellipse(mx, my + 78, 26, 15, 0, 0, TAU); ctx.fill(); // língua
    ctx.restore();
    ctx.restore();
  }

  drawClouds(ctx) {
    const P = CONFIG.PAL;
    for (const c of this.clouds) {
      const blobs = [[0, 0, 30], [32, -14, 38], [72, -4, 32], [104, 8, 24], [-26, 10, 22]];
      // rabo de fumaça de cachimbo
      const tail = [[132, 12, 14], [152, 2, 10], [168, -10, 7]];
      const wob = Math.sin(this.t * 0.8 + c.seed * 6) * 4;
      ctx.save();
      ctx.translate(c.x, c.y + wob); ctx.scale(c.s, c.s);
      ctx.lineJoin = 'round';
      for (const pass of [0, 1]) {
        for (const [bx, by, br] of blobs.concat(tail)) {
          ctx.beginPath(); ctx.arc(bx, by, pass === 0 ? br + 3.5 : br, 0, TAU);
          ctx.fillStyle = pass === 0 ? P.ink : '#a99a7e'; ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  drawFlies(ctx) {
    const P = CONFIG.PAL;
    for (const f of this.flies) {
      const y = f.y + Math.sin(this.t * 3 + f.ph) * 14;
      ctx.save();
      ctx.translate(f.x, y); ctx.scale(f.s, f.s);
      // asas batendo
      const flap = Math.sin(this.t * 45 + f.ph);
      for (const dir of [-1, 1]) {
        ctx.save(); ctx.rotate(dir * (0.5 + flap * 0.3));
        ctx.beginPath(); ctx.ellipse(4, dir * 14, 16, 5, 0, 0, TAU);
        ctx.fillStyle = 'rgba(243,227,187,0.7)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.restore();
      }
      // corpo
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(24, 0); ctx.lineWidth = 8; ctx.strokeStyle = P.ink; ctx.lineCap = 'round'; ctx.stroke();
      ctx.lineWidth = 4.5; ctx.strokeStyle = P.sand; ctx.stroke();
      // cabeça e cartola
      ctx.beginPath(); ctx.arc(-16, 0, 6, 0, TAU); inkShape(ctx, P.tan, 2.5);
      ctx.beginPath(); ctx.arc(-18, -2, 1.8, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
      ctx.fillStyle = P.ink; ctx.fillRect(-23, -18, 10, 12);
      ctx.fillRect(-27, -8, 18, 3.5);
      ctx.restore();
    }
  }

  drawFog(ctx) {
    for (const f of this.fog) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(f.w / f.h, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, f.h);
      g.addColorStop(0, 'rgba(225,208,170,0.20)');
      g.addColorStop(1, 'rgba(225,208,170,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-f.h, -f.h, f.h * 2, f.h * 2);
      ctx.restore();
    }
  }
}
