/* «Повтори за мышонком»: цепочка из слов книги «осенило, окраснило, ожелтило, озеленило, окоричневило».
   Каждый уровень на шаг длиннее. Ошибка — просто показываем ещё раз. */
(function () {
  'use strict';
  var COLORS = ['#9ad4f0', '#e0453a', '#f4c92a', '#4fae52', '#a9714b'];
  var LABEL = {
    RU: ['осенило', 'окраснило', 'ожелтило', 'озеленило', 'окоричневило'],
    EN: ['it dawned', 'went red', 'went yellow', 'went green', 'went brown'],
    DE: ['es dämmerte', 'rot', 'gelb', 'grün', 'braun']
  };
  var TXT = {
    RU: ['Смотри…', 'Теперь ты!', 'Ещё разок — смотри'], EN: ['Watch…', 'Your turn!', 'Once more — watch'], DE: ['Schau…', 'Du bist dran!', 'Noch einmal – schau']
  };
  var LEVELS = 4;
  window.MousekinGames.register('repeat', function (ctx) {
    var st = ctx.stage, sz = ctx.size(), W = sz.w, H = sz.h, T = TXT[ctx.lang] || TXT.RU, L = LABEL[ctx.lang] || LABEL.RU;
    var timers = [], dead = false, seq = [], level = 0, pos = 0, accept = false;
    st.classList.add('gm-dim');
    var fh = Math.max(90, Math.min(210, H * 0.3)), face = ctx.el('img', 'gm-face');
    face.src = ctx.assets + 'img/Szene_10__MouseFace.webp'; face.alt = ''; face.style.cssText = 'top:' + (Math.max(64, H * 0.1)) + 'px;height:' + fh + 'px'; st.appendChild(face);
    var row = ctx.el('div', 'gm-pads'); row.style.top = (Math.max(64, H * 0.1) + fh + 24) + 'px';
    var pads = COLORS.map(function (c, i) {
      var b = ctx.el('button', 'gm-pad', L[i]); b.style.background = c;
      b.addEventListener('click', function () { press(i); }); row.appendChild(b); return b;
    });
    st.appendChild(row);
    function light(i, ms) { pads[i].classList.add('lit'); ctx.sfx.note(i, 0.4); timers.push(setTimeout(function () { pads[i].classList.remove('lit'); }, ms || 420)); }
    function show(msg) {
      accept = false; ctx.hud(msg); pos = 0;
      seq.forEach(function (n, i) { timers.push(setTimeout(function () { if (!dead) light(n); }, 900 + i * 750)); });
      timers.push(setTimeout(function () { if (dead) return; accept = true; ctx.hud(T[1]); }, 900 + seq.length * 750));
    }
    function press(i) {
      if (!accept || dead) return; light(i, 250);
      if (i !== seq[pos]) { accept = false; ctx.sfx.oops(); timers.push(setTimeout(function () { show(T[2]); }, 900)); return; }
      if (++pos < seq.length) return;
      accept = false; level++;
      if (level >= LEVELS) { timers.push(setTimeout(function () { ctx.sfx.ok(); }, 500)); timers.push(setTimeout(function () { if (!dead) ctx.finish({ levels: level }); }, 1500)); return; }
      seq.push(Math.floor(Math.random() * COLORS.length)); timers.push(setTimeout(function () { show(T[0]); }, 900));
    }
    seq = [Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)];
    show(T[0]);
    return { destroy: function () { dead = true; timers.forEach(clearTimeout); } };
  });
})();
