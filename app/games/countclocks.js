/* «Посчитай часы»: часы из книги (и твои собственные, если уже созданы). 3 коротких вопроса, без проигрыша. */
(function () {
  'use strict';
  var TXT = { RU: 'Сколько часов?', EN: 'How many clocks?', DE: 'Wie viele Uhren?' };
  var NAMES = ['Szene_06__MillClock', 'Szene_06__NightClock', 'Szene_06__SunnyClock', 'Szene_09__PerfectClock', 'Szene_12__DustyClock', 'Szene_08__walkingclock', 'Szene_11__Alarm'];
  function shuffle(a) { return a.slice().sort(function () { return Math.random() - 0.5; }); }
  window.MousekinGames.register('countclocks', function (ctx) {
    var st = ctx.stage, sz = ctx.size(), W = sz.w, H = sz.h, timers = [], dead = false, round = 0;
    st.classList.add('gm-dim');
    var pool = shuffle(NAMES).slice(0, 3).map(function (n) { return ctx.assets + 'img/' + n + '.webp'; });
    try {
      var mine = JSON.parse(localStorage.getItem('mousekin_myclock_v1') || 'null');
      if (mine && mine.svg) pool[Math.floor(Math.random() * 3)] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mine.svg);
    } catch (e) {}
    var counts = [2 + Math.floor(Math.random() * 2), 3 + Math.floor(Math.random() * 2), 4 + Math.floor(Math.random() * 2)];
    var imgH = Math.max(64, Math.min(130, H * 0.17));
    function next() {
      if (dead) return;
      [].forEach.call(st.querySelectorAll('.gm-items,.gm-opts'), function (n) { n.remove(); });
      if (round >= 3) { ctx.sfx.ok(); return ctx.finish({ rounds: 3 }); }
      ctx.hud(TXT[ctx.lang] || TXT.RU);
      var k = counts[round], src = pool[round];
      var items = ctx.el('div', 'gm-items'); items.style.top = (H * 0.2) + 'px';
      for (var i = 0; i < k; i++) { var im = ctx.el('img'); im.src = src; im.alt = ''; im.style.height = imgH + 'px'; im.style.maxWidth = (W * 0.8 / Math.min(k, 3)) + 'px'; items.appendChild(im); }
      st.appendChild(items);
      var vals = [k - 1, k, k + 1].filter(function (v) { return v >= 1; }); if (vals.length < 3) vals.push(k + 2);
      var opts = ctx.el('div', 'gm-opts'); opts.style.bottom = Math.max(20, H * 0.1) + 'px';
      shuffle(vals).forEach(function (v) {
        var b = ctx.el('button', '', String(v));
        b.addEventListener('click', function () {
          if (dead || b.disabled) return;
          if (v === k) {
            ctx.sfx.ok(); items.classList.add('yay'); [].forEach.call(opts.children, function (x) { x.disabled = true; });
            round++; timers.push(setTimeout(next, 1700));
          } else { ctx.sfx.oops(); b.classList.add('no'); b.disabled = true; }
        });
        opts.appendChild(b);
      });
      st.appendChild(opts);
    }
    next();
    return { destroy: function () { dead = true; timers.forEach(clearTimeout); } };
  });
})();
