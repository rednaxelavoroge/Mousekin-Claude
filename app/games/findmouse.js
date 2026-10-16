/* «Найди мышонка»: поверх живой сцены книги Мышонок на мгновение выглядывает. Найти 3 раза. Без таймера и проигрыша. */
(function () {
  'use strict';
  var NEED = 3;
  var TEXT = {
    RU: ['Найди Мышонка!', 'Нашёл'], EN: ['Find the Mouse!', 'Found'], DE: ['Finde die Maus!', 'Gefunden']
  };
  window.MousekinGames.register('findmouse', function (ctx) {
    var T = TEXT[ctx.lang] || TEXT.RU, sc = ctx.scene, found = 0, timer = 0, dead = false, last = null;
    var btn = ctx.el('button', 'gm-mouse'), img = ctx.el('img');
    img.src = ctx.assets + 'img/Szene_10__MouseFace.webp'; img.alt = '';
    btn.appendChild(img); ctx.stage.appendChild(btn);
    var h = Math.max(46, sc.bh * 0.13), w = h * 474 / 512;
    btn.style.width = w + 'px'; btn.style.height = h + 'px';
    btn.setAttribute('aria-label', T[0]);
    hud();

    function hud() { ctx.hud(found ? T[1] + ' ' + found + ' / ' + NEED : T[0] + '  0 / ' + NEED); }
    function place() {
      var pad = 10, x, y, tries = 0;
      do {
        x = sc.bx + pad + Math.random() * Math.max(1, sc.bw - w - pad * 2);
        y = sc.by + sc.bh * 0.12 + Math.random() * Math.max(1, sc.bh * 0.8 - h);
        tries++;
      } while (last && tries < 12 && Math.hypot(x - last.x, y - last.y) < sc.bw * 0.3);
      last = { x: x, y: y };
      btn.style.left = x + 'px'; btn.style.top = y + 'px';
    }
    function cycle() {
      if (dead) return;
      btn.classList.remove('show', 'hit'); place();
      timer = setTimeout(function () {
        if (dead) return; btn.classList.add('show');
        timer = setTimeout(function () { btn.classList.remove('show'); timer = setTimeout(cycle, 900); }, 3600);
      }, 700);
    }
    btn.addEventListener('click', function () {
      if (dead || btn.classList.contains('hit')) return;
      clearTimeout(timer); ctx.sfx.squeak();
      btn.classList.remove('show'); btn.classList.add('hit'); found++; hud();
      if (found >= NEED) { timer = setTimeout(function () { if (!dead) ctx.finish({ found: found }); }, 800); }
      else timer = setTimeout(cycle, 900);
    });
    cycle();
    return { destroy: function () { dead = true; clearTimeout(timer); } };
  });
})();
