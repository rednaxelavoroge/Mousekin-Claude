/* «Собери пазл»: текущая сцена книги разрезана на 6 кусков (живой снимок сцены). Собрал — картинка оживает.
   Куски раскладываются сеткой без перекрытий: лоток всегда помещается на экран. */
(function () {
  'use strict';
  var TXT = { RU: ['Собери картинку', 'Получилось!'], EN: ['Put the picture together', 'You did it!'], DE: ['Setze das Bild zusammen', 'Geschafft!'] };
  window.MousekinGames.register('puzzle', function (ctx) {
    var T = TXT[ctx.lang] || TXT.RU, st = ctx.stage, sc = ctx.scene, box = sc.box, timers = [], dead = false;
    if (!box) { setTimeout(function () { ctx.finish({}); }, 0); return {}; }
    st.classList.add('gm-dim'); st.style.transition = 'background .9s';
    var COLS = 3, ROWS = 2, TOP = 96, PAD = 10, sz = ctx.size(), W = sz.w, H = sz.h, total = COLS * ROWS;
    var ar = sc.bw / sc.bh, bw = 0, bh = 0, pw = 0, ph = 0, cols = 1, trayRows = 1, f, need;
    for (f = 1; f > 0.3; f -= 0.02) {
      bw = Math.min(W * 0.92, ar * H * 0.55) * f; bh = bw / ar; pw = bw / COLS; ph = bh / ROWS;
      cols = Math.max(1, Math.floor((W - 12) / (pw + PAD)));
      trayRows = Math.ceil(total / cols);
      need = TOP + bh + 16 + trayRows * (ph + PAD) + 10;
      if (need <= H) break;
    }
    var bx = (W - bw) / 2, by = TOP, k = bw / sc.bw, locked = 0, slots = [], pieces = [];
    ctx.hud(T[0]);
    function snapshot() {
      var c = box.cloneNode(true);
      [].forEach.call(c.querySelectorAll('.hint,.shade'), function (n) { n.remove(); });
      c.style.cssText = 'position:absolute;left:0;top:0;width:' + sc.bw + 'px;height:' + sc.bh + 'px;transform:none;opacity:1;pointer-events:none';
      return c;
    }
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var s = ctx.el('div', 'gm-slot');
      s.style.cssText = 'left:' + (bx + c * pw) + 'px;top:' + (by + r * ph) + 'px;width:' + pw + 'px;height:' + ph + 'px';
      st.appendChild(s); slots.push(s);
      var p = ctx.el('div', 'gm-piece'), inn = ctx.el('div', 'in');
      inn.style.cssText = 'left:' + (-c * pw / k) + 'px;top:' + (-r * ph / k) + 'px;width:' + sc.bw + 'px;height:' + sc.bh + 'px;transform:scale(' + k + ')';
      inn.appendChild(snapshot()); p.appendChild(inn);
      p.style.width = pw + 'px'; p.style.height = ph + 'px';
      p._tx = bx + c * pw; p._ty = by + r * ph; pieces.push(p);
    }
    var trayTop = by + bh + 16, rowW = cols * (pw + PAD) - PAD;
    pieces.sort(function () { return Math.random() - 0.5; }).forEach(function (p, i) {
      var row = Math.floor(i / cols), col = i % cols, inRow = Math.min(cols, total - row * cols);
      var left = (W - (inRow * (pw + PAD) - PAD)) / 2 + col * (pw + PAD);
      p.style.left = left + 'px'; p.style.top = (trayTop + row * (ph + PAD)) + 'px';
      st.appendChild(p); drag(p);
    });
    function drag(p) {
      var off = null;
      p.addEventListener('pointerdown', function (e) {
        if (p._lock) return; var r = st.getBoundingClientRect();
        off = { x: e.clientX - r.left - p.offsetLeft, y: e.clientY - r.top - p.offsetTop };
        p.setPointerCapture(e.pointerId); p.style.zIndex = 6; e.preventDefault();
      });
      p.addEventListener('pointermove', function (e) {
        if (!off) return; var r = st.getBoundingClientRect();
        p.style.left = Math.max(0, Math.min(W - pw, e.clientX - r.left - off.x)) + 'px';
        p.style.top = Math.max(0, Math.min(H - ph, e.clientY - r.top - off.y)) + 'px';
      });
      function up() {
        if (!off) return; off = null; p.style.zIndex = 5;
        var thr = Math.min(pw, ph) * 0.4;
        if (Math.abs(p.offsetLeft - p._tx) < thr && Math.abs(p.offsetTop - p._ty) < thr) {
          p.style.left = p._tx + 'px'; p.style.top = p._ty + 'px'; p._lock = true; p.classList.add('lock'); ctx.sfx.snap();
          if (++locked === total) done();
        }
      }
      p.addEventListener('pointerup', up); p.addEventListener('pointercancel', up);
    }
    function done() {
      ctx.sfx.ok(); ctx.hud(T[1]);
      slots.forEach(function (s) { s.style.display = 'none'; });
      timers.push(setTimeout(function () { st.classList.remove('gm-dim'); pieces.forEach(function (p) { p.classList.add('gm-fade'); }); }, 700));
      var bgUrl = sc.data && sc.data.bg ? new URL(sc.data.bg, ctx.assets).href : '';
      timers.push(setTimeout(function () {
        if (dead) return;
        ctx.finish(bgUrl ? { print: { label: { RU: 'Распечатать картинку', EN: 'Print the picture', DE: 'Bild drucken' }, html: '<div style="text-align:center"><img src="' + bgUrl + '" style="width:170mm;height:auto"></div>' } } : { puzzle: true });
      }, 3400));
    }
    return { destroy: function () { dead = true; timers.forEach(clearTimeout); } };
  });
})();
