'use strict';
/* =====================================================================
   game.js — Classe Game: laço principal, estados, colisões, HUD e telas.

   Estados (this.state):  menu -> playing <-> paused -> over | victory
   Sub-estados de 'playing' (this.phaseFlag):
     normal    jogo rolando
     dying     jogador explodiu (espera um pouco e vai para Game Over)
     bossdying chefe derrotado, explosões em câmera lenta
     ko        animação "KNOCKOUT!" antes da tela de vitória
   ===================================================================== */

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CONFIG.W;
    canvas.height = CONFIG.H;
    canvas.tabIndex = 0;

    this.input = new Input();
    this.audio = new AudioFX();
    this.bg = new Background();
    this.fx = new VintageFX();
    this.sprites = loadSprites();

    this.state = 'menu';
    this.demo = false;
    this.t = 0;
    this.last = performance.now();

    this.resetWorld(false);
    this.bindUI();
    requestAnimationFrame(n => this.loop(n));
  }

  /* ----------------------------- inicialização ----------------------------- */

  resetWorld(demo) {
    this.player = new Player();
    this.enemies = [];
    this.playerShots = [];
    this.enemyShots = [];
    this.particles = [];
    this.pops = [];
    this.boss = null;
    this.director = new Director(this, demo ? CONFIG.DEMO_STAGE_SECONDS : CONFIG.STAGE_SECONDS);

    this.score = 0;
    this.hitsTaken = 0;
    this.elapsed = 0;
    this.shake = 0;
    this.flash = 0;
    this.timeScale = 1;
    this.phaseFlag = 'normal';
    this.deathT = 0;
    this.bossDeathT = 0;
    this.koT = 0;
    this.special = { active: false, t: 0, x: 0, y: 0, dur: CONFIG.PLAYER.specialDuration, hit: new Set() };
    this.banner = null;
    this.bannerQueue = [];
  }

  bindUI() {
    const $ = id => document.getElementById(id);
    this.screens = { menu: $('screen-menu'), over: $('screen-gameover'), victory: $('screen-victory'), pause: $('screen-pause') };
    const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

    on('btn-play', () => this.start(false));
    on('btn-demo', () => this.start(true));
    on('btn-retry', () => this.start(this.demo));
    on('btn-again', () => this.start(this.demo));
    on('btn-resume', () => this.togglePause());
    on('btn-menu-1', () => this.goMenu());
    on('btn-menu-2', () => this.goMenu());
    on('btn-menu-3', () => this.goMenu());

    // pausa automática ao sair da aba do jogo ou da janela
    window.addEventListener('pagechange', e => { if (e.detail !== 'jogo') this.autoPause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.autoPause(); });
  }

  showScreen(name) {
    for (const k in this.screens) if (this.screens[k]) this.screens[k].classList.toggle('hidden', k !== name);
  }

  start(demo) {
    this.demo = demo;
    this.audio.init();
    this.resetWorld(demo);
    this.state = 'playing';
    this.showScreen(null);
    this.audio.startMusic(false);
    this.showBanner('PÂNTANO SURREAL', 2.2, 'Sobreviva ao percurso!');
    this.canvas.focus({ preventScroll: true });
  }

  goMenu() {
    this.audio.stopMusic();
    this.resetWorld(false);
    this.state = 'menu';
    this.showScreen('menu');
  }

  autoPause() { if (this.state === 'playing') this.togglePause(); }

  togglePause() {
    if (this.state === 'playing') { this.state = 'paused'; this.showScreen('pause'); this.audio.stopMusic(); }
    else if (this.state === 'paused') {
      this.state = 'playing'; this.showScreen(null);
      this.audio.startMusic(!!this.boss);
      this.canvas.focus({ preventScroll: true });
    }
  }

  /* ------------------------------- laço principal ------------------------------- */

  loop(now) {
    const raw = Math.max(0, Math.min((now - this.last) / 1000, 0.05));
    this.last = now;
    this.t += raw;

    this.globalKeys();
    if (this.state === 'playing') this.updatePlaying(raw);
    else if (this.state === 'menu') this.bg.update(raw, 1);
    else if (this.state === 'over' || this.state === 'victory') this.bg.update(raw * 0.3, 1);

    this.draw();
    this.input.endFrame();
    requestAnimationFrame(n => this.loop(n));
  }

  globalKeys() {
    const onGamePage = document.body.dataset.page === 'jogo';
    if (!onGamePage) return;
    if (this.input.pressed(KEYS.mute)) this.audio.toggleMute();
    if (this.input.pressed(KEYS.pause)) this.togglePause();
    if (this.state === 'menu' && this.input.pressed(KEYS.confirm)) this.start(false);
  }

  /* --------------------------------- lógica --------------------------------- */

  updatePlaying(raw) {
    const dt = raw * this.timeScale;
    this.elapsed += raw;

    if (this.phaseFlag === 'dying') {
      this.deathT += raw;
      if (this.deathT > 1.8) this.finishGameOver();
    } else if (this.phaseFlag === 'bossdying') {
      this.bossDeathT += raw;
      if (Math.random() < raw * 14 && this.boss) {
        this.poof(this.boss.x + rand(-90, 90), this.boss.y + rand(-80, 80), 5, 1.6);
        this.audio.play('kill');
        this.shake = 8;
      }
      if (this.bossDeathT > 2.4) {
        if (this.boss) this.poof(this.boss.x, this.boss.y, 26, 3);
        this.audio.play('bossDie');
        this.boss = null;
        this.phaseFlag = 'ko';
        this.koT = 0;
        this.timeScale = 1;
        this.shake = 20;
        this.audio.play('ko');
      }
    } else if (this.phaseFlag === 'ko') {
      this.koT += raw;
      if (this.koT > 4.2) this.finishVictory();
    }

    this.updateWorld(dt, raw);
  }

  updateWorld(dt, raw) {
    this.bg.update(dt, this.boss ? 1.2 : 1);

    if (this.player.alive) this.player.update(dt, this);
    this.updateSpecial(dt);
    if (!this.boss && this.phaseFlag === 'normal') this.director.update(dt);

    for (const e of this.enemies) e.update(dt);
    if (this.boss) this.boss.update(dt);
    for (const b of this.playerShots) b.update(dt);
    for (const b of this.enemyShots) b.update(dt);

    this.collide();

    for (const p of this.particles) p.update(dt);
    for (const p of this.pops) p.update(dt);

    this.enemies = this.enemies.filter(e => !e.dead);
    this.playerShots = this.playerShots.filter(b => !b.dead);
    this.enemyShots = this.enemyShots.filter(b => !b.dead);
    this.particles = this.particles.filter(p => !p.dead);
    this.pops = this.pops.filter(p => !p.dead);

    this.shake = Math.max(0, this.shake - 45 * dt);
    this.flash = Math.max(0, this.flash - dt);
    this.updateBanner(raw);
  }

  collide() {
    const p = this.player;

    // tiros do jogador x capangas / chefe
    for (const s of this.playerShots) {
      if (s.dead) continue;
      for (const e of this.enemies) {
        if (e.dead || !circleHit(s, e)) continue;
        s.dead = true;
        e.hit(s.damage);
        this.addEnergy(1.5);
        this.audio.play('tick');
        this.particles.push(new Particle(s.x, s.y, rand(-60, 60), rand(-60, 60), 0.3, 9, 'star'));
        if (e.hp <= 0) this.killEnemy(e);
        break;
      }
      if (!s.dead && this.boss && !this.boss.dying && circleHit(s, this.boss)) {
        s.dead = true;
        if (this.boss.hit(s.damage)) {
          this.score += 5;
          this.addEnergy(0.9);
          this.particles.push(new Particle(s.x, s.y, rand(-60, 60), rand(-60, 60), 0.3, 9, 'star'));
        }
      }
    }

    if (!p.alive) return;

    // tiros inimigos x jogador (só somem se realmente causarem dano)
    for (const b of this.enemyShots) {
      if (b.dead) continue;
      if (circleHit(b, p) && p.hurt(this)) b.dead = true;
    }
    // corpo a corpo
    for (const e of this.enemies) if (!e.dead && circleHit(e, p)) p.hurt(this);
    if (this.boss && !this.boss.dying && this.boss.state !== 'gone') {
      const bb = { x: this.boss.x, y: this.boss.y, r: this.boss.r * (this.boss.state === 'dash' ? 1.05 : 0.85) };
      if (circleHit(bb, p)) p.hurt(this);
    }
  }

  killEnemy(e) {
    e.dead = true;
    this.score += e.score;
    this.addEnergy(8);
    this.poof(e.x, e.y, 6, 1);
    if (Math.random() < 0.45) this.pops.push(new PopText(e.x, e.y - 20, pick(['POW!', 'BAM!', 'ZAP!', 'POP!'])));
    this.audio.play('kill');
  }

  addEnergy(v) {
    const C = CONFIG.PLAYER, p = this.player;
    const before = p.energy;
    p.energy = Math.min(C.energyMax, p.energy + v);
    if (before < C.specialCost && p.energy >= C.specialCost) this.audio.play('bell');   // "EX pronto!"
  }

  /* --------------------------- ataque especial --------------------------- */

  tryStartSpecial() {
    const p = this.player;
    if (this.special.active || !p.alive || this.phaseFlag !== 'normal') return;
    if (p.energy < CONFIG.PLAYER.specialCost) return;
    p.energy = 0;
    p.invuln = this.special.dur + 0.4;          // invencível durante a explosão
    this.special.active = true;
    this.special.t = 0;
    this.special.x = p.x; this.special.y = p.y;
    this.special.hit = new Set();
    this.shake = 16;
    this.audio.play('special');
  }

  updateSpecial(dt) {
    const s = this.special;
    if (!s.active) return;
    s.t += dt;
    const R = (s.t / s.dur) * 1250;

    for (const e of this.enemies) {
      if (!e.dead && !s.hit.has(e) && dist(s, e) <= R) {
        s.hit.add(e);
        e.hit(12);
        if (e.hp <= 0) this.killEnemy(e);
      }
    }
    for (const b of this.enemyShots) {            // limpa os tiros inimigos atingidos
      if (!b.dead && dist(s, b) <= R) { b.dead = true; this.particles.push(new Particle(b.x, b.y, 0, 0, 0.3, 8, 'poof', { grow: 20 })); }
    }
    if (this.boss && !s.hit.has(this.boss) && dist(s, this.boss) <= R + this.boss.r) {
      s.hit.add(this.boss);
      this.boss.hit(35);
    }
    for (let k = 0; k < 3; k++) {                 // faíscas na borda da onda
      const a = rand(0, TAU);
      this.particles.push(new Particle(s.x + Math.cos(a) * R, s.y + Math.sin(a) * R, 0, 0, 0.35, rand(8, 14), 'star'));
    }
    if (s.t >= s.dur) s.active = false;
  }

  /* ------------------------------ eventos ------------------------------ */

  startBoss() {
    this.boss = new Boss(this);
    this.audio.startMusic(true);
    this.audio.play('roar');
    this.showBanner('PREPARE-SE!', 1.4);
    this.showBanner('WALLOP!', 1.0, 'Tralalero Tralala surge do pântano');
  }

  onBossPhase(n) {
    this.clearEnemyShots();
    this.shake = 18;
    this.flash = 0.35;
    this.audio.play('roar');
    this.showBanner(`FASE ${n}`, 1.3, n === 2 ? 'Cuidado com a investida!' : 'Ele está furioso!');
  }

  onBossDeath() {
    this.phaseFlag = 'bossdying';
    this.bossDeathT = 0;
    this.timeScale = 0.45;
    this.clearEnemyShots();
    for (const e of this.enemies) { e.dead = true; this.poof(e.x, e.y, 4, 1); }
    this.score += 5000 + this.player.hp * 500;
    this.shake = 20;
    this.audio.stopMusic();
    this.audio.play('bossDie');
  }

  onPlayerDeath() {
    this.player.alive = false;
    this.phaseFlag = 'dying';
    this.deathT = 0;
    this.poof(this.player.x, this.player.y, 22, 2.6);
    this.shake = 22;
    this.audio.stopMusic();
    this.audio.play('bossDie');
  }

  finishGameOver() {
    this.state = 'over';
    const el = document.getElementById('over-score');
    if (el) el.textContent = String(this.score).padStart(6, '0');
    const info = document.getElementById('over-info');
    if (info) info.textContent = this.boss ? `Você chegou ao chefe e tirou ${Math.round((1 - this.boss.hpRatio) * 100)}% da vida dele.` : `Você caiu no percurso, a ${Math.round(this.director.progress * 100)}% do caminho.`;
    this.showScreen('over');
  }

  finishVictory() {
    this.state = 'victory';
    const grade = this.hitsTaken === 0 ? 'S' : this.hitsTaken <= 1 ? 'A' : this.hitsTaken <= 2 ? 'B' : this.hitsTaken <= 3 ? 'C' : 'D';
    const mm = Math.floor(this.elapsed / 60), ss = String(Math.floor(this.elapsed % 60)).padStart(2, '0');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('win-score', String(this.score).padStart(6, '0'));
    set('win-time', `${mm}:${ss}`);
    set('win-hits', String(this.hitsTaken));
    set('win-grade', grade);
    this.showScreen('victory');
  }

  clearEnemyShots() {
    for (const b of this.enemyShots) { b.dead = true; this.particles.push(new Particle(b.x, b.y, 0, 0, 0.35, 8, 'poof', { grow: 25 })); }
  }

  /* Explosão estilo desenho animado: nuvenzinhas + estrelas */
  poof(x, y, n = 6, size = 1) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(40, 190) * size;
      this.particles.push(new Particle(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.35, 0.65), rand(8, 16) * size, 'poof', { grow: -8 * size }));
    }
    for (let i = 0; i < Math.ceil(n / 2); i++) {
      const a = rand(0, TAU), v = rand(80, 240) * size;
      this.particles.push(new Particle(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.4, 0.8), rand(8, 14) * size, 'star'));
    }
  }

  showBanner(text, dur, sub) { this.bannerQueue.push({ text, dur, sub, t: 0 }); }

  updateBanner(raw) {
    if (!this.banner && this.bannerQueue.length) this.banner = this.bannerQueue.shift();
    if (this.banner) { this.banner.t += raw; if (this.banner.t >= this.banner.dur) this.banner = null; }
  }

  /* --------------------------------- desenho --------------------------------- */

  draw() {
    const ctx = this.ctx, sh = this.shake;
    ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);

    ctx.save();
    ctx.translate(rand(-sh, sh) * 0.5, rand(-sh, sh) * 0.5);
    this.bg.drawBack(ctx, this.state === 'menu' ? { x: 200, y: 300 } : this.player);

    if (this.state === 'menu') this.drawMenuScene(ctx);
    else this.drawWorld(ctx);

    this.bg.drawFront(ctx);
    ctx.restore();

    this.fx.draw(ctx, this.buildLights(), this.t);       // iluminação + sépia + granulado

    if (this.state !== 'menu') this.drawHUD(ctx);
    if (this.flash > 0) { ctx.fillStyle = `rgba(243,227,187,${this.flash * 1.2})`; ctx.fillRect(0, 0, CONFIG.W, CONFIG.H); }
  }

  drawMenuScene(ctx) {
    const y = 270 + Math.sin(this.t * 2) * 12;
    this.sprites.boss.draw(ctx, CONFIG.W - 170, y, { t: this.t });
    this.sprites.player.draw(ctx, 200, y + 20, { rot: Math.sin(this.t * 2) * 0.05 });
  }

  drawWorld(ctx) {
    for (const e of this.enemies) e.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    for (const b of this.playerShots) b.draw(ctx);
    for (const b of this.enemyShots) b.draw(ctx);
    this.player.draw(ctx, this.sprites);
    for (const p of this.particles) p.draw(ctx);
    for (const p of this.pops) p.draw(ctx);
    this.drawSpecial(ctx);
  }

  drawSpecial(ctx) {
    const s = this.special;
    if (!s.active) return;
    const P = CONFIG.PAL, R = (s.t / s.dur) * 1250;
    ctx.save();
    ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, TAU);
    ctx.fillStyle = 'rgba(243,227,187,0.16)'; ctx.fill();
    ctx.lineWidth = 16; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.lineWidth = 8; ctx.strokeStyle = P.cream; ctx.stroke();
    ctx.beginPath(); ctx.arc(s.x, s.y, R * 0.8, 0, TAU);
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(243,227,187,0.7)'; ctx.stroke();
    ctx.restore();
  }

  buildLights() {
    const L = [];
    L.push({ x: this.bg.moon.x, y: this.bg.moon.y, r: 340, i: 0.55 });          // luar
    if (this.state === 'menu') { L.push({ x: 200, y: 290, r: 260, i: 0.9 }, { x: CONFIG.W - 170, y: 280, r: 280, i: 0.85 }); return L; }
    const p = this.player;
    if (p.alive) L.push({ x: p.x + 40, y: p.y, r: 220, i: 0.9 });
    for (const b of this.playerShots) L.push({ x: b.x, y: b.y, r: 55, i: 0.7 });
    for (const b of this.enemyShots) L.push({ x: b.x, y: b.y, r: 50, i: 0.75 });
    for (const e of this.enemies) L.push({ x: e.x, y: e.y, r: 90, i: 0.5 });
    if (this.boss) L.push({ x: this.boss.x, y: this.boss.y, r: 280, i: 0.85 });
    if (this.special.active) L.push({ x: this.special.x, y: this.special.y, r: (this.special.t / this.special.dur) * 1250, i: 0.6 });
    return L;
  }

  /* ----------------------------------- HUD ----------------------------------- */

  drawCard(ctx, x, y, w, h, rot, fill) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h);
    inkShape(ctx, fill, 3);
    ctx.restore();
  }

  drawHUD(ctx) {
    const P = CONFIG.PAL, W = CONFIG.W, H = CONFIG.H, p = this.player;

    // pontuação
    outlinedText(ctx, 'PONTOS ' + String(this.score).padStart(6, '0'), W - 24, 30, { size: 20, align: 'right', font: FONT_BODY, lw: 5 });

    // cartão de vida (HP) estilo Cuphead
    const low = p.hp <= 1 && Math.floor(this.t * 6) % 2 === 0;
    this.drawCard(ctx, 22, H - 74, 60, 52, -0.06, low ? P.red : P.cream);
    outlinedText(ctx, 'HP', 52, H - 62, { size: 13, fill: P.ink, stroke: 'rgba(0,0,0,0)', lw: 0, font: FONT_BODY });
    outlinedText(ctx, String(Math.max(0, p.hp)), 52, H - 40, { size: 30, fill: low ? P.cream : P.ink, stroke: low ? P.ink : 'rgba(0,0,0,0)', lw: low ? 5 : 0 });

    // cartões de energia (ataque especial)
    const per = CONFIG.PLAYER.specialCost / 5, ready = p.energy >= CONFIG.PLAYER.specialCost;
    for (let i = 0; i < 5; i++) {
      const x = 98 + i * 30, y = H - 62, w = 24, h = 38;
      const f = clamp((p.energy - i * per) / per, 0, 1);
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2); ctx.rotate(0.03 * (i % 2 ? 1 : -1));
      ctx.fillStyle = 'rgba(27,18,9,0.55)'; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = ready && Math.floor(this.t * 8) % 2 === 0 ? '#fff' : P.cream;
      ctx.fillRect(-w / 2, h / 2 - h * f, w, h * f);
      ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.strokeRect(-w / 2, -h / 2, w, h);
      if (f >= 1) { starPath(ctx, 0, 0, 8, 3.5, 5); ctx.fillStyle = P.red; ctx.fill(); }
      ctx.restore();
    }
    if (ready) outlinedText(ctx, 'APERTE X !', 98 + 75, H - 78, { size: 14, font: FONT_BODY, lw: 4 });

    // progresso do percurso
    if (!this.boss && this.phaseFlag === 'normal') {
      const bw = 260, bx = W / 2 - bw / 2, by = H - 24, pr = this.director.progress;
      outlinedText(ctx, 'PERCURSO', W / 2, by - 12, { size: 12, font: FONT_BODY, lw: 4 });
      ctx.fillStyle = 'rgba(27,18,9,0.6)'; ctx.fillRect(bx, by, bw, 10);
      ctx.fillStyle = P.cream; ctx.fillRect(bx, by, bw * pr, 10);
      ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.strokeRect(bx, by, bw, 10);
      starPath(ctx, bx + bw * pr, by + 5, 9, 4, 5); inkShape(ctx, P.red, 2);
      outlinedText(ctx, 'BOSS', bx + bw + 28, by + 5, { size: 12, font: FONT_BODY, lw: 4 });
    }

    // barra de vida do chefe
    if (this.boss) this.drawBossBar(ctx);

    // banners ("WALLOP!", "FASE 2"...)
    if (this.banner) this.drawBanner(ctx);
    if (this.phaseFlag === 'ko') this.drawKO(ctx);
  }

  drawBossBar(ctx) {
    const P = CONFIG.PAL, W = CONFIG.W, b = this.boss;
    const bw = 520, bx = (W - bw) / 2, by = 38, bh = 20;
    const ratio = clamp(b.displayHp / b.max, 0, 1);

    outlinedText(ctx, CONFIG.BOSS.name, W / 2, 22, { size: 17, lw: 5 });
    ctx.fillStyle = 'rgba(27,18,9,0.7)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = P.red; ctx.fillRect(bx, by, bw * ratio, bh);
    ctx.fillStyle = 'rgba(243,227,187,0.28)'; ctx.fillRect(bx, by, bw * ratio, bh * 0.35);
    ctx.lineWidth = 4; ctx.strokeStyle = P.ink; ctx.strokeRect(bx, by, bw, bh);
    ctx.lineWidth = 3;                                              // marcas das fases (66% e 33%)
    for (const m of [0.33, 0.66]) { ctx.beginPath(); ctx.moveTo(bx + bw * m, by); ctx.lineTo(bx + bw * m, by + bh); ctx.stroke(); }
    outlinedText(ctx, `FASE ${b.phase}`, W / 2, by + bh + 16, { size: 12, font: FONT_BODY, lw: 4 });
  }

  drawBanner(ctx) {
    const b = this.banner, W = CONFIG.W, H = CONFIG.H;
    const k = b.t / b.dur;
    const s = k < 0.2 ? easeOutBack(k / 0.2) : 1;
    const a = k > 0.82 ? clamp((1 - k) / 0.18, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2, H * 0.4);
    ctx.rotate(-0.04 + Math.sin(this.t * 14) * 0.005);
    ctx.scale(s, s);
    outlinedText(ctx, b.text, 6, 7, { size: 78, fill: 'rgba(27,18,9,0.6)', stroke: 'rgba(27,18,9,0.6)', lw: 14 });
    outlinedText(ctx, b.text, 0, 0, { size: 78, lw: 12 });
    if (b.sub) outlinedText(ctx, b.sub, 0, 62, { size: 20, font: FONT_BODY, lw: 5 });
    ctx.restore();
  }

  drawKO(ctx) {
    const W = CONFIG.W, H = CONFIG.H, t = this.koT;
    ctx.save();
    ctx.fillStyle = `rgba(243,227,187,${Math.max(0, 0.75 - t * 0.9)})`;
    ctx.fillRect(0, 0, W, H);

    ctx.translate(W / 2, H / 2);
    ctx.save();                                                       // raios de luz girando
    ctx.rotate(t * 0.35);
    ctx.fillStyle = 'rgba(243,227,187,0.13)';
    for (let i = 0; i < 16; i++) {
      ctx.rotate(TAU / 16);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1100, -40); ctx.lineTo(1100, 40); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    const s = t < 0.35 ? lerp(5, 1, easeOutBack(t / 0.35)) : 1 + Math.sin(t * 6) * 0.018;
    ctx.rotate(-0.06);
    ctx.scale(s, s);
    outlinedText(ctx, 'KNOCKOUT!', 8, 10, { size: 124, fill: CONFIG.PAL.red, stroke: CONFIG.PAL.red, lw: 22 });
    outlinedText(ctx, 'KNOCKOUT!', 0, 0, { size: 124, lw: 18 });
    if (t > 0.8) outlinedText(ctx, 'Tralalero Tralala foi derrotado!', 0, 88, { size: 24, font: FONT_BODY, lw: 6 });
    ctx.restore();
  }
}
