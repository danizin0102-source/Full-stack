'use strict';
/* =====================================================================
   nav.js — Navegação entre as 3 páginas (abas) dentro do mesmo HTML.
   Usa o hash da URL (#home, #devs, #jogo): só a seção ativa fica visível
   e o menu marca o item atual. Dispara o evento "pagechange" para o jogo
   pausar sozinho quando o jogador sai da aba.
   ===================================================================== */

(function () {
  const PAGES = ['home', 'devs', 'jogo'];

  function show() {
    let id = (location.hash || '#home').slice(1);
    if (!PAGES.includes(id)) id = 'home';

    document.querySelectorAll('.page').forEach(s => s.classList.toggle('active', s.id === id));
    document.querySelectorAll('#menu a').forEach(a => {
      const on = a.dataset.page === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    document.body.dataset.page = id;
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('pagechange', { detail: id }));
  }

  window.addEventListener('hashchange', show);
  document.addEventListener('DOMContentLoaded', show);
})();
