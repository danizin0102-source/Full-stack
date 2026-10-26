'use strict';
/* =====================================================================
   audio.js — Efeitos sonoros e música gerados em tempo real com a
   Web Audio API (osciladores + ruído). Nenhum arquivo de áudio externo
   é usado, então não há direitos autorais de terceiros envolvidos.
   ===================================================================== */

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);   // nota MIDI -> frequência (Hz)

class AudioFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.timer = null;
    this.step = 0;
    this.next = 0;
    this.stepDur = 0.2;

    // Música: ragtime em Lá menor, 4 compassos x 8 colcheias
    this.bass = [45, 50, 52, 45];                        // raiz de cada compasso
    this.chords = [[57, 60, 64], [57, 62, 65], [56, 59, 62, 64], [57, 60, 64]];
    this.melody = [
      69, 0, 72, 0, 76, 0, 72, 69,
      74, 0, 77, 0, 74, 0, 72, 70,
      71, 0, 74, 0, 76, 75, 76, 0,
      69, 72, 69, 0, 64, 0, 0, 0
    ];
  }

  // Navegadores só liberam áudio após um gesto do usuário (clique no botão Jogar)
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }

  tone(freq, dur, type = 'square', vol = 0.2, slideTo = null, at = null) {
    if (!this.ctx) return;
    const t = at == null ? this.ctx.currentTime : at;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.3, cutoff = 1800) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'shoot':   this.tone(620, 0.06, 'square', 0.04, 300); break;
      case 'tick':    this.tone(200, 0.04, 'triangle', 0.05); break;
      case 'trumpet': this.tone(330, 0.18, 'sawtooth', 0.07, 300); break;
      case 'splash':  this.tone(500, 0.12, 'sine', 0.08, 900); break;
      case 'kill':    this.noise(0.25, 0.25, 1500); this.tone(300, 0.2, 'square', 0.08, 80); break;
      case 'hurt':    this.noise(0.3, 0.35, 900); this.tone(260, 0.4, 'sawtooth', 0.15, 60); break;
      case 'special': this.tone(120, 1.2, 'sawtooth', 0.2, 900); this.noise(1.0, 0.25, 700); break;
      case 'tele':    this.tone(180, 0.5, 'square', 0.1, 140); break;
      case 'dash':    this.noise(0.6, 0.35, 600); this.tone(90, 0.6, 'sawtooth', 0.2, 40); break;
      case 'roar':    this.tone(80, 0.9, 'sawtooth', 0.25, 50); this.noise(0.8, 0.3, 500); break;
      case 'bossDie': this.noise(1.6, 0.4, 900); this.tone(200, 1.6, 'sawtooth', 0.2, 30); break;
      case 'ko':
        [0, 4, 7, 12].forEach((s, i) => this.tone(mtof(60 + s), 0.5, 'square', 0.12, null, this.ctx.currentTime + i * 0.12));
        break;
      case 'bell':    this.tone(880, 0.3, 'sine', 0.12); this.tone(1320, 0.4, 'sine', 0.08); break;
    }
  }

  startMusic(fast = false) {
    this.init();
    if (!this.ctx) return;
    this.stopMusic();
    this.stepDur = fast ? 0.15 : 0.2;
    this.step = 0;
    this.next = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 60);
  }

  stopMusic() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  schedule() {
    if (!this.ctx) return;
    while (this.next < this.ctx.currentTime + 0.25) {
      this.playStep(this.step, this.next);
      this.next += this.stepDur;
      this.step = (this.step + 1) % 32;
    }
  }

  playStep(s, at) {
    const bar = s >> 3, i = s & 7;
    const d = this.stepDur;
    // "oom-pah": baixo nos tempos fortes, acorde nos contratempos
    if (i % 2 === 0) {
      const root = this.bass[bar] + (i === 2 || i === 6 ? 7 : 0);
      this.tone(mtof(root), d * 1.6, 'triangle', 0.22, null, at);
    } else {
      for (const n of this.chords[bar]) this.tone(mtof(n), d * 0.7, 'square', 0.035, null, at);
    }
    const m = this.melody[s];
    if (m) this.tone(mtof(m), d * 1.2, 'sawtooth', 0.05, null, at);
  }
}
