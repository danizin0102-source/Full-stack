'use strict';
/* =====================================================================
   config.js — Configurações globais do jogo.
   Todos os "números mágicos" ficam aqui para facilitar o balanceamento.
   ===================================================================== */

const TAU = Math.PI * 2;

const FONT_TITLE = '"Rye", "Georgia", serif';
const FONT_BODY = '"Special Elite", "Courier New", monospace';

const CONFIG = {
  W: 960,
  H: 540,
  WATER_Y: 482,                 // altura da linha d'água (limite inferior de voo)

  STAGE_SECONDS: 180,           // Parte 1 (percurso com capangas): 3 minutos
  DEMO_STAGE_SECONDS: 12,       // Modo demonstração: pula quase direto para o chefe

  PLAYER: {
    speed: 340,
    hp: 5,
    fireDelay: 0.11,            // segundos entre tiros
    bulletSpeed: 780,
    energyMax: 100,
    specialCost: 100,
    specialDuration: 1.3,
    invuln: 1.8,
    radius: 14                  // hitbox pequena, como em todo bom shmup
  },

  BOSS: { hp: 380, name: 'TRALALERO TRALALA' },

  /* Sprites externos (opcionais). Se o arquivo não existir, o jogo desenha
     o personagem direto no canvas (fallback). 'flip' espelha a imagem caso
     ela esteja virada para o lado errado. */
  SPRITES: {
    player: { src: 'bombardinocrocodilo.png', height: 84, flip: false }, // deve olhar para a DIREITA
    boss:   { src: 'tralalerotralala.png',    height: 270, flip: false } // deve olhar para a ESQUERDA
  },

  /* Paleta sépia dos anos 30 */
  PAL: {
    ink: '#1b1209',
    cream: '#f3e3bb',
    sand: '#d8bd88',
    tan: '#b08a54',
    brown: '#7b5330',
    dark: '#3b2714',
    night1: '#0f1824',
    night2: '#223245',
    horizon: '#6a5a44',
    red: '#b3402a'
  }
};
