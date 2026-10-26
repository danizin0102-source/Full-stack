'use strict';
/* =====================================================================
   input.js — Teclado. Guarda as teclas seguradas (down) e as teclas
   recém-pressionadas no frame atual (hit), usadas para ações únicas
   como pausar ou usar o especial.
   ===================================================================== */

const KEYS = {
  left:    ['KeyA', 'ArrowLeft'],
  right:   ['KeyD', 'ArrowRight'],
  up:      ['KeyW', 'ArrowUp'],
  down:    ['KeyS', 'ArrowDown'],
  fire:    ['Space', 'KeyZ', 'KeyJ'],
  special: ['KeyX', 'KeyK'],
  pause:   ['KeyP', 'Escape'],
  mute:    ['KeyM'],
  confirm: ['Enter']
};

const BLOCKED_CODES = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

class Input {
  constructor() {
    this.down = new Set();
    this.hit = new Set();

    window.addEventListener('keydown', e => {
      // só bloqueia rolagem da página quando a aba do jogo está aberta
      if (document.body.dataset.page === 'jogo' && BLOCKED_CODES.includes(e.code)) e.preventDefault();
      if (!this.down.has(e.code)) this.hit.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', e => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  }

  isDown(codes) { return codes.some(c => this.down.has(c)); }
  pressed(codes) { return codes.some(c => this.hit.has(c)); }
  endFrame() { this.hit.clear(); }
}
