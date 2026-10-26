'use strict';
/* =====================================================================
   entities.js — Tudo que existe dentro da fase:
   Bullet (projéteis), Particle/PopText (efeitos), Player, Frog e Fish
   (capangas) e Boss (Tralalero Tralala, com 3 fases de ataque).
   Todas as entidades têm update(dt) e draw(ctx); a colisão é feita no
   Game com círculos (campos x, y, r).
   ===================================================================== */

/* ------------------------------ Projéteis ------------------------------ */
class Bullet {
  constructor(x, y, vx, vy, o = {}) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.friendly = !!o.friendly;
    this.kind = o.kind || (this.friendly ? 'shot' : 'orb');
    this.r = o.r || (this.friendly ? 7 : 8);
    this.damage = o.damage || 1;
    this.dead = false;
    this.t = 0;
    this.ang = Math.atan2(vy, vx);
  }

  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt; this.t += dt;
    if (this.x < -80 || this.x > CONFIG.W + 80 || this.y < -80 || this.y > CONFIG.H + 80) this.dead = true;
  }

  draw(ctx) {
    const P = CONFIG.PAL;
    ctx.save();
    ctx.translate(this.x, this.y);
    switch (this.kind) {
      case 'shot':                                   // tiro do jogador: gota de tinta clara
        ctx.rotate(this.ang);
        ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, 0, 0, TAU); inkShape(ctx, P.cream, 2.5);
        ctx.beginPath(); ctx.ellipse(-3, -1.5, 5, 2, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
        break;
      case 'note':                                   // nota musical do sapo
        ctx.rotate(Math.sin(this.t * 8) * 0.25);
        ctx.beginPath(); ctx.arc(0, 0, this.r + 5, 0, TAU); ctx.fillStyle = 'rgba(243,227,187,0.92)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(4, -13); ctx.quadraticCurveTo(14, -10, 11, -2);
        ctx.lineWidth = 2.8; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-2, 5, 6.5, 4.8, -0.4, 0, TAU); inkShape(ctx, P.red, 2.5);
        break;
      case 'bubble':                                 // bolha do peixe
        ctx.beginPath(); ctx.arc(0, 0, this.r + 2, 0, TAU); ctx.fillStyle = 'rgba(243,227,187,0.92)'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, this.r * 0.5, 0, TAU); ctx.fillStyle = P.red; ctx.fill();
        ctx.beginPath(); ctx.arc(-3, -4, 2.2, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
        break;
      default:                                       // 'orb': projétil do chefe
        ctx.rotate(this.t * 5);
        starPath(ctx, 0, 0, this.r + 5, this.r - 1, 6);
        inkShape(ctx, P.cream, 2.5);
        ctx.beginPath(); ctx.arc(0, 0, this.r * 0.6, 0, TAU); inkShape(ctx, P.red, 2);
    }
    ctx.restore();
  }
}

/* ------------------------------ Partículas ------------------------------ */
class Particle {
  constructor(x, y, vx, vy, life, size, kind = 'poof', o = {}) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.max = life; this.size = size; this.kind = kind;
    this.grow = o.grow || 0; this.gravity = o.gravity || 0;
    this.rot = rand(0, TAU); this.spin = o.spin || rand(-6, 6);
    this.dead = false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.x += this.vx * dt; this.y += this.vy * dt; this.vy += this.gravity * dt;
    this.size = Math.max(0.5, this.size + this.grow * dt);
    this.rot += this.spin * dt;
  }

  draw(ctx) {
    const P = CONFIG.PAL, a = clamp(this.life / this.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = this.kind === 'smoke' ? a * 0.55 : Math.min(1, a * 1.6);
    ctx.translate(this.x, this.y);
    if (this.kind === 'star') {
      ctx.rotate(this.rot);
      starPath(ctx, 0, 0, this.size, this.size * 0.45, 5);
      inkShape(ctx, P.cream, 2.5);
    } else if (this.kind === 'smoke') {
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, TAU); ctx.fillStyle = P.sand; ctx.fill();
    } else if (this.kind === 'ink') {
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
    } else {                                           // 'poof': nuvenzinha de desenho animado
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, TAU); inkShape(ctx, P.cream, 3);
    }
    ctx.restore();
  }
}

/* Textinhos tipo "POW!" que sobem e somem */
class PopText {
  constructor(x, y, text) { this.x = x; this.y = y; this.text = text; this.t = 0; this.dead = false; this.rot = rand(-0.25, 0.25); }
  update(dt) { this.t += dt; this.y -= 30 * dt; if (this.t > 0.7) this.dead = true; }
  draw(ctx) {
    const s = this.t < 0.18 ? easeOutBack(this.t / 0.18) : 1;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot); ctx.scale(s, s);
    ctx.globalAlpha = clamp((0.7 - this.t) * 4, 0, 1);
    outlinedText(ctx, this.text, 0, 0, { size: 26, lw: 6, fill: CONFIG.PAL.cream });
    ctx.restore();
  }
}

/* ------------------------------ Jogador ------------------------------ */
class Player {
  constructor() { this.reset(); }

  reset() {
    this.x = 150; this.y = CONFIG.H / 2;
    this.vx = 0; this.vy = 0;
    this.r = CONFIG.PLAYER.radius;
    this.hp = CONFIG.PLAYER.hp;
    this.energy = 0;
    this.invuln = 0; this.cool = 0;
    this.alive = true;
    this.smokeT = 0; this.tilt = 0; this.t = 0;
  }

  update(dt, game) {
    const C = CONFIG.PLAYER, inp = game.input;
    this.t += dt;

    // movimento com aceleração suave (interpolação exponencial)
    let dx = (inp.isDown(KEYS.right) ? 1 : 0) - (inp.isDown(KEYS.left) ? 1 : 0);
    let dy = (inp.isDown(KEYS.down) ? 1 : 0) - (inp.isDown(KEYS.up) ? 1 : 0);
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }          // diagonal não pode ser mais rápida
    const k = 1 - Math.exp(-11 * dt);
    this.vx = lerp(this.vx, dx * C.speed, k);
    this.vy = lerp(this.vy, dy * C.speed, k);
    this.x = clamp(this.x + this.vx * dt, 60, CONFIG.W - 60);
    this.y = clamp(this.y + this.vy * dt, 50, CONFIG.WATER_Y - 10);
    this.tilt = lerp(this.tilt, (this.vy / C.speed) * 0.28, k);

    this.cool -= dt; this.invuln -= dt;
    if (inp.isDown(KEYS.fire) && this.cool <= 0) { this.shoot(game); this.cool = C.fireDelay; }
    if (inp.pressed(KEYS.special)) game.tryStartSpecial();

    this.smokeT -= dt;                                      // fumacinha do motor
    if (this.smokeT <= 0) {
      this.smokeT = 0.06;
      game.particles.push(new Particle(this.x - 62, this.y + 4, -80 - rand(0, 40), rand(-15, 15), 0.5, rand(5, 9), 'smoke', { grow: 14 }));
    }
  }

  shoot(game) {
    const C = CONFIG.PLAYER;
    for (const oy of [-9, 9]) game.playerShots.push(new Bullet(this.x + 62, this.y + oy, C.bulletSpeed, rand(-18, 18), { friendly: true }));
    game.audio.play('shoot');
  }

  hurt(game) {
    if (!this.alive || this.invuln > 0) return false;
    this.hp--;
    this.invuln = CONFIG.PLAYER.invuln;
    game.shake = 14; game.flash = 0.25; game.hitsTaken++;
    game.audio.play('hurt');
    game.poof(this.x, this.y, 8, 1.1);
    if (this.hp <= 0) game.onPlayerDeath();
    return true;
  }

  draw(ctx, sprites) {
    if (!this.alive) return;
    if (this.invuln > 0 && Math.floor(this.t * 18) % 2 === 0) ctx.globalAlpha = 0.35;   // piscando
    sprites.player.draw(ctx, this.x, this.y, { rot: this.tilt });
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------ Capangas ------------------------------ */
class Enemy {
  constructor(game, x, y) {
    this.g = game; this.x = x; this.y = y; this.y0 = y;
    this.t = 0; this.flash = 0; this.dead = false; this.score = 100;
  }
  hit(d) { this.hp -= d; this.flash = 0.07; }
}

/* Sapo trompetista: ziguezagueia devagar e dispara notas musicais para a esquerda */
class Frog extends Enemy {
  constructor(game, y, d) {
    super(game, CONFIG.W + 50, y);
    this.r = 24; this.hp = 3; this.maxHp = 3; this.score = 100;
    this.d = d;
    this.cool = rand(0.6, 1.6);
    this.rate = lerp(2.4, 1.4, d);          // fica mais agressivo com a dificuldade
    this.ph = rand(0, 6);
  }

  update(dt) {
    this.t += dt; this.flash -= dt; this.cool -= dt;
    this.x -= 135 * dt;
    this.y = this.y0 + Math.sin(this.t * 2 + this.ph) * 42;
    if (this.cool <= 0 && this.x < CONFIG.W - 40 && this.x > 140) { this.cool = this.rate; this.shoot(); }
    if (this.x < -70) this.dead = true;
  }

  shoot() {
    const g = this.g, p = g.player;
    let vx = -270, vy = 0;
    if (this.d > 0.5 && Math.random() < 0.4 && p.alive) {   // na segunda metade da fase, alguns tiros miram no jogador
      const a = Math.atan2(p.y - this.y, p.x - this.x);
      vx = Math.cos(a) * 250; vy = Math.sin(a) * 250;
    }
    g.enemyShots.push(new Bullet(this.x - 48, this.y - 4, vx, vy, { kind: 'note', r: 8 }));
    g.audio.play('trumpet');
  }

  draw(ctx) { this.g.sprites.frog.draw(ctx, this.x, this.y, { t: this.t, flash: this.flash > 0 }); }
}

/* Peixe-voador: voa em onda mais rápido e cospe bolhas mirando no jogador */
class Fish extends Enemy {
  constructor(game, y, d, ph) {
    super(game, CONFIG.W + 50, y);
    this.r = 20; this.hp = 2; this.maxHp = 2; this.score = 80;
    this.d = d;
    this.cool = rand(0.8, 1.6);
    this.rate = lerp(2.8, 1.8, d);
    this.ph = ph == null ? rand(0, 6) : ph;
  }

  update(dt) {
    this.t += dt; this.flash -= dt; this.cool -= dt;
    this.x -= 215 * dt;
    this.y = this.y0 + Math.sin(this.t * 3.2 + this.ph) * 70;
    if (this.cool <= 0 && this.x < CONFIG.W - 60 && this.x > 220) { this.cool = this.rate; this.shoot(); }
    if (this.x < -60) this.dead = true;
  }

  shoot() {
    const g = this.g, p = g.player;
    const a = p.alive ? Math.atan2(p.y - this.y, p.x - this.x) : Math.PI;
    g.enemyShots.push(new Bullet(this.x - 26, this.y, Math.cos(a) * 240, Math.sin(a) * 240, { kind: 'bubble', r: 8 }));
    g.audio.play('splash');
  }

  draw(ctx) { this.g.sprites.fish.draw(ctx, this.x, this.y, { t: this.t, flash: this.flash > 0 }); }
}

/* ------------------------------ Chefe ------------------------------ */
/* Máquina de estados do Tralalero Tralala:
     enter -> idle -> (fan | burst | spiral | tele -> dash -> gone -> return) -> idle ...
   Fase 1 (100%-66%): leques e rajadas mirados.
   Fase 2 (66%-33%):  + investida (avisada por uma faixa vermelha).
   Fase 3 (33%-0%):   + espiral, investida dupla e leques de 9 tiros.   */
class Boss {
  constructor(game) {
    this.g = game;
    this.x = CONFIG.W + 320; this.y = CONFIG.H / 2 - 20;
    this.homeX = CONFIG.W - 175;
    this.r = 84;
    this.max = CONFIG.BOSS.hp; this.hp = this.max; this.displayHp = 0;
    this.phase = 1; this.state = 'enter';
    this.timer = 0; this.t = 0; this.flash = 0;
    this.vulnerable = false; this.dying = false;
    this.last = ''; this.bursts = 0; this.interval = 0.6; this.chargesLeft = 0;
    this.ang = 0; this.emit = 0;
  }

  get hpRatio() { return this.hp / this.max; }

  hit(d) {
    if (!this.vulnerable || this.dying) return false;
    this.hp = Math.max(0, this.hp - d);
    this.flash = 0.07;
    if (this.hp <= 0) { this.dying = true; this.g.onBossDeath(); return true; }
    const np = this.hpRatio <= 0.33 ? 3 : this.hpRatio <= 0.66 ? 2 : 1;
    if (np > this.phase) {                                   // mudou de fase!
      this.phase = np; this.chargesLeft = 0; this.state = 'return';
      this.g.onBossPhase(np);
    }
    return true;
  }

  toIdle(wait) { this.state = 'idle'; this.timer = wait; }

  hover(dt) {
    const p = this.g.player;
    const ty = clamp(p.y * 0.55 + CONFIG.H * 0.22 + Math.sin(this.t * 1.6) * 70, 120, CONFIG.H - 130);
    this.y += (ty - this.y) * Math.min(1, dt * 1.3);
  }

  choose() {
    const p = this.phase;
    const pool = p === 1 ? ['fan', 'fan', 'burst']
      : p === 2 ? ['fan', 'burst', 'charge', 'charge']
      : ['fan', 'spiral', 'charge', 'spiral', 'burst'];
    let a, tries = 0;
    do { a = pick(pool); } while (a === this.last && tries++ < 6);
    this.last = a;
    switch (a) {
      case 'fan':    this.state = 'fan'; this.bursts = [3, 4, 5][p - 1]; this.interval = [0.7, 0.55, 0.42][p - 1]; this.timer = 0.4; break;
      case 'burst':  this.state = 'burst'; this.bursts = [6, 8, 10][p - 1]; this.interval = 0.17; this.timer = 0.3; break;
      case 'charge': this.chargesLeft = p === 3 ? 2 : 1; this.state = 'tele'; this.timer = 0.9; this.g.audio.play('tele'); break;
      case 'spiral': this.state = 'spiral'; this.timer = 3; this.emit = 0; break;
    }
  }

  mouth() { return { x: this.x - 100, y: this.y + 6 }; }

  fireFan() {
    const g = this.g, p = g.player, m = this.mouth(), ph = this.phase;
    const n = [5, 7, 9][ph - 1], speed = [300, 330, 360][ph - 1], span = 1.15;
    const base = Math.atan2((p.alive ? p.y : CONFIG.H / 2) - m.y, (p.alive ? p.x : 100) - m.x);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * (span / (n - 1));
      g.enemyShots.push(new Bullet(m.x, m.y, Math.cos(a) * speed, Math.sin(a) * speed, { kind: 'orb', r: 8 }));
    }
    g.audio.play('roar');
  }

  fireAimed() {
    const g = this.g, p = g.player, m = this.mouth(), ph = this.phase;
    const a = Math.atan2((p.alive ? p.y : CONFIG.H / 2) - m.y, (p.alive ? p.x : 100) - m.x) + rand(-0.12, 0.12);
    const s = [320, 350, 380][ph - 1];
    g.enemyShots.push(new Bullet(m.x, m.y, Math.cos(a) * s, Math.sin(a) * s, { kind: 'orb', r: 7 }));
    g.audio.play('tick');
  }

  update(dt) {
    this.t += dt; this.flash -= dt;
    this.displayHp = lerp(this.displayHp, this.hp, 1 - Math.exp(-5 * dt));
    if (this.dying) return;
    const p = this.g.player;

    switch (this.state) {
      case 'enter':
        this.x += (this.homeX - this.x) * Math.min(1, dt * 1.6);
        this.y = CONFIG.H / 2 - 20 + Math.sin(this.t * 2) * 30;
        this.vulnerable = this.x < CONFIG.W - 40;
        if (this.t > 3.4) { this.state = 'idle'; this.timer = 1.0; this.vulnerable = true; }
        break;

      case 'idle':
        this.hover(dt);
        this.timer -= dt;
        if (this.timer <= 0) this.choose();
        break;

      case 'fan':
        this.hover(dt);
        this.timer -= dt;
        if (this.timer <= 0) {
          this.fireFan();
          if (--this.bursts <= 0) this.toIdle(1.1); else this.timer = this.interval;
        }
        break;

      case 'burst':
        this.hover(dt);
        this.timer -= dt;
        if (this.timer <= 0) {
          this.fireAimed();
          if (--this.bursts <= 0) this.toIdle(1.2); else this.timer = this.interval;
        }
        break;

      case 'spiral': {
        this.hover(dt * 0.5);
        this.emit -= dt; this.timer -= dt;
        if (this.emit <= 0) {
          this.emit = 0.085; this.ang += 0.43;
          const m = this.mouth();
          for (let k = 0; k < 3; k++) {
            const a = this.ang + (k * TAU) / 3;
            this.g.enemyShots.push(new Bullet(m.x, m.y, Math.cos(a) * 230, Math.sin(a) * 230, { kind: 'orb', r: 7 }));
          }
          if (Math.random() < 0.25) this.g.audio.play('tick');
        }
        if (this.timer <= 0) this.toIdle(1.2);
        break;
      }

      case 'tele':                                         // avisa a investida: persegue o jogador e treme
        if (this.timer > 0.3) this.y += (clamp(p.y, 110, CONFIG.H - 110) - this.y) * Math.min(1, dt * 6);
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'dash'; this.chargesLeft--; this.g.audio.play('dash'); this.g.shake = 10; }
        break;

      case 'dash':
        this.x -= 1150 * dt;
        if (this.x < -300) { this.state = 'gone'; this.timer = 0.6; }
        break;

      case 'gone':
        this.timer -= dt;
        if (this.timer <= 0) { this.x = CONFIG.W + 320; this.state = 'return'; }
        break;

      case 'return':
        this.x += (this.homeX - this.x) * Math.min(1, dt * 2.6);
        this.hover(dt);
        if (Math.abs(this.x - this.homeX) < 6) {
          this.x = this.homeX;
          if (this.chargesLeft > 0) { this.state = 'tele'; this.timer = 0.8; this.g.audio.play('tele'); }
          else this.toIdle(0.9);
        }
        break;
    }
  }

  draw(ctx) {
    ctx.save();
    if (this.state === 'tele') {                          // faixa vermelha de alerta
      const a = 0.18 + 0.14 * Math.sin(this.t * 30);
      ctx.fillStyle = `rgba(179,64,42,${a})`;
      ctx.fillRect(0, this.y - this.r, CONFIG.W, this.r * 2);
      outlinedText(ctx, '!', CONFIG.W - 330, this.y, { size: 70, fill: CONFIG.PAL.red });
    }
    let ox = 0, oy = 0;
    if (this.state === 'tele' || this.dying) { ox = rand(-5, 5); oy = rand(-5, 5); }
    const rot = Math.sin(this.t * 3) * 0.04 + (this.state === 'dash' ? -0.12 : 0);
    const bob = this.state === 'enter' ? 0 : Math.sin(this.t * 4) * 4;
    const flash = this.flash > 0 || (this.dying && Math.floor(this.t * 20) % 2 === 0);
    this.g.sprites.boss.draw(ctx, this.x + ox, this.y + oy + bob, { rot, flash, t: this.t });
    ctx.restore();
  }
}
