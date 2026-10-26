'use strict';
/* =====================================================================
   effects.js — Pós-processamento "filme antigo".
   Ordem de aplicação a cada frame:
     1) ILUMINAÇÃO: uma camada escura cobre a cena e "furos" de luz
        (gradientes radiais) são abertos em volta do jogador, tiros,
        chefe e lua usando destination-out.
     2) FILTRO SÉPIA: multiply com um tom quente de papel envelhecido.
     3) Vinheta, granulado, riscos de película e cintilação do projetor.
   ===================================================================== */

class VintageFX {
  constructor() {
    this.W = CONFIG.W;
    this.H = CONFIG.H;

    this.light = document.createElement('canvas');
    this.light.width = this.W; this.light.height = this.H;
    this.lctx = this.light.getContext('2d');

    // textura de ruído pré-gerada (granulado de filme)
    const n = document.createElement('canvas');
    n.width = n.height = 160;
    const nc = n.getContext('2d');
    const img = nc.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 70;
    }
    nc.putImageData(img, 0, 0);
    this.noise = n;
    this.noiseOff = { x: 0, y: 0 };
    this.noiseT = 0;

    // vinheta pré-renderizada
    const v = document.createElement('canvas');
    v.width = this.W; v.height = this.H;
    const vc = v.getContext('2d');
    const vg = vc.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.35, this.W / 2, this.H / 2, this.W * 0.72);
    vg.addColorStop(0, 'rgba(20,10,0,0)');
    vg.addColorStop(1, 'rgba(20,10,0,0.7)');
    vc.fillStyle = vg; vc.fillRect(0, 0, this.W, this.H);
    this.vignette = v;
  }

  /* lights: [{x, y, r, i}] -> posição, raio e intensidade (0..1) de cada fonte de luz */
  draw(ctx, lights, t) {
    const W = this.W, H = this.H, lc = this.lctx;

    // 1) iluminação
    lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, W, H);
    lc.fillStyle = 'rgba(18,10,2,0.45)';
    lc.fillRect(0, 0, W, H);
    lc.globalCompositeOperation = 'destination-out';
    for (const L of lights) {
      const g = lc.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
      g.addColorStop(0, `rgba(0,0,0,${L.i})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g;
      lc.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    }
    ctx.drawImage(this.light, 0, 0);

    // 2) filtro sépia
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(240,214,164)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // 3) vinheta
    ctx.drawImage(this.vignette, 0, 0);

    // granulado (muda de posição ~20x por segundo)
    this.noiseT -= 1 / 60;
    if (this.noiseT <= 0) { this.noiseT = 0.05; this.noiseOff.x = Math.random() * 160; this.noiseOff.y = Math.random() * 160; }
    ctx.globalAlpha = 0.5;
    ctx.translate(-this.noiseOff.x, -this.noiseOff.y);
    ctx.fillStyle = ctx.createPattern(this.noise, 'repeat');
    ctx.fillRect(0, 0, W + 160, H + 160);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;

    // riscos verticais de película e poeirinhas
    ctx.strokeStyle = 'rgba(255,245,220,0.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      if (Math.random() < 0.35) {
        const x = Math.random() * W, y = Math.random() * H * 0.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * 3, y + 40 + Math.random() * 260); ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(20,10,0,0.45)';
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.3) { ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 0, TAU); ctx.fill(); }
    }

    // cintilação do projetor
    ctx.fillStyle = `rgba(0,0,0,${0.015 + Math.random() * 0.035})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
