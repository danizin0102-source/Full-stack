'use strict';
/* =====================================================================
   director.js — "Diretor" da Parte 1 da fase (percurso).
   Controla o tempo da fase, escolhe formações de capangas (ondas) com
   dificuldade crescente e, no fim, chama o chefe.
   ===================================================================== */

class Director {
  constructor(game, stageSeconds) {
    this.g = game;
    this.T = stageSeconds;          // duração do percurso
    this.t = 0;
    this.queue = [];                // spawns agendados: {at, type, y, ph}
    this.nextWave = 2.5;
    this.bossCalled = false;
    this.waitAfter = 0;
    this.last = -1;

    this.top = 90;
    this.bottom = CONFIG.WATER_Y - 60;

    // cada formação é uma função que agenda inimigos na fila
    this.waves = [
      d => this.waveLine(d),
      d => this.waveColumn(d),
      d => this.waveVee(d),
      d => this.waveSnake(d),
      d => this.waveMix(d)
    ];
  }

  get progress() { return clamp(this.t / this.T, 0, 1); }

  q(delay, type, y, ph) { this.queue.push({ at: this.t + delay, type, y, ph }); }

  update(dt) {
    this.t += dt;
    const d = this.progress;

    if (this.t < this.T) {
      if (this.t >= this.nextWave) {
        this.spawnWave(d);
        this.nextWave = this.t + lerp(7.5, 4.6, d) + rand(0, 1.5);
      }
    } else if (!this.bossCalled) {
      // percurso terminou: espera a tela esvaziar (ou 7 s) e chama o chefe
      this.waitAfter += dt;
      if ((this.g.enemies.length === 0 && this.queue.length === 0) || this.waitAfter > 7) {
        this.bossCalled = true;
        this.g.startBoss();
      }
    }

    for (const s of this.queue) {
      if (s.at <= this.t) {
        s.done = true;
        const e = s.type === 'frog' ? new Frog(this.g, s.y, d) : new Fish(this.g, s.y, d, s.ph);
        this.g.enemies.push(e);
      }
    }
    this.queue = this.queue.filter(s => !s.done);
  }

  spawnWave(d) {
    let i;
    do { i = randInt(0, this.waves.length - 1); } while (i === this.last);
    this.last = i;
    this.waves[i](d);
    if (d > 0.6 && Math.random() < 0.3) {                  // fase avançada: às vezes duas ondas juntas
      let j;
      do { j = randInt(0, this.waves.length - 1); } while (j === i);
      this.t += 0; this.waves[j](d);
    }
  }

  /* Linha de sapos entrando um atrás do outro */
  waveLine(d) {
    const n = 3 + Math.round(d * 3), y = rand(this.top + 20, this.bottom - 20);
    for (let i = 0; i < n; i++) this.q(i * 0.75, 'frog', y);
  }

  /* Coluna de peixes entrando juntos, espalhados na vertical */
  waveColumn(d) {
    const n = 3 + Math.round(d * 2);
    for (let i = 0; i < n; i++) this.q(0, 'fish', lerp(this.top, this.bottom, i / (n - 1)), 0);
  }

  /* Formação em "V" de sapos apontando para a esquerda */
  waveVee(d) {
    const cy = rand(this.top + 120, this.bottom - 120);
    for (let i = -2; i <= 2; i++) this.q(Math.abs(i) * 0.5, 'frog', clamp(cy + i * 55, this.top, this.bottom));
  }

  /* Cobra de peixes: todos com a mesma fase da onda senoidal */
  waveSnake(d) {
    const n = 5 + Math.round(d * 3), y = rand(this.top + 80, this.bottom - 80);
    for (let i = 0; i < n; i++) this.q(i * 0.35, 'fish', y, 0);
  }

  /* Mistura: sapos em cima e embaixo, peixes no meio */
  waveMix(d) {
    this.q(0, 'frog', this.top + 20);
    this.q(0.4, 'frog', this.bottom - 20);
    const n = 2 + Math.round(d * 2);
    for (let i = 0; i < n; i++) this.q(1 + i * 0.5, 'fish', rand(this.top + 100, this.bottom - 100));
  }
}
