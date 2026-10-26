'use strict';
/* =====================================================================
   main.js — Ponto de entrada: cria o jogo quando a página termina de
   carregar. (A ordem dos <script> no index.html importa: config, utils,
   input, audio, sprites, background, effects, entities, director, game.)
   ===================================================================== */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (canvas) window.game = new Game(canvas);
});
