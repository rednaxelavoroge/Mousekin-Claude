/* «Найди предмет»: предметы берутся из живой сцены книги. Вверху — что искать. Нашёл — подсветка и счётчик. */
(function () {
  'use strict';
  var TXT = { RU: ['Найди:', 'Все нашлись!'], EN: ['Find:', 'All found!'], DE: ['Finde:', 'Alle gefunden!'] };
  window.MousekinGames.register('finditem', function (ctx) {
    var T = TXT[ctx.lang] || TXT.RU, st = ctx.stage, sc = ctx.scene, box = sc.box, timers = [], dead = false, found = 0;
    if (!box) { setTimeout(function () { ctx.finish({}); }, 0); return {}; }
    var sr = st.getBoundingClientRect(), cands = [], seen = {};
    [].forEach.call(box.querySelectorAll('.o img'), function (im) {
      if (!im.complete || im.naturalWidth < 24) return;
      var op = parseFloat(getComputedStyle(im.parentNode).opacity); if (op < 0.9) return;
      var r = im.getBoundingClientRect(), w = r.width, h = r.height, cx = r.left - sr.left, cy = r.top - sr.top;
      if (w < sc.bw * 0.035 || h < sc.bw * 0.035 || w > sc.bw * 0.2 || h > sc.bw * 0.2) return;
      if (cx < sc.bx || cy < sc.by || cx + w > sc.bx + sc.bw || cy + h > sc.by + sc.bh) return;
      var key = im.getAttribute('src'); if (seen[key]) return; seen[key] = 1;
      cands.push({ src: im.src, x: cx, y: cy, w: w, h: h });
    });
    cands.sort(function () { return Math.random() - 0.5; });
    var targets = [];
    cands.forEach(function (c) {
      if (targets.length >= 4) return;
      var near = targets.some(function (t) { return Math.hypot(t.x - c.x, t.y - c.y) < sc.bw * 0.09; });
      if (!near) targets.push(c);
    });
    if (targets.length < 3) { setTimeout(function () { ctx.finish({}); }, 0); return {}; }

    var hud = ctx.hud(''); hud.classList.add('tray'); hud.appendChild(ctx.el('span', '', T[0]));
    targets.forEach(function (t) {
      var th = ctx.el('img'); th.src = t.src; th.alt = ''; hud.appendChild(th); t.th = th;
      var pad = Math.max(0, 52 - Math.min(t.w, t.h)), hb = ctx.el('button', 'gm-hit');
      hb.style.cssText = 'left:' + (t.x - pad / 2) + 'px;top:' + (t.y - pad / 2) + 'px;width:' + (t.w + pad) + 'px;height:' + (t.h + pad) + 'px';
      hb.addEventListener('click', function () { hit(t, hb); }); st.appendChild(hb);
    });
    function hit(t, hb) {
      if (t.got || dead) return; t.got = true; found++; hb.remove(); t.th.classList.remove('hint'); t.th.classList.add('got');
      var cx = t.x + t.w / 2, cy = t.y + t.h / 2, d = Math.max(t.w, t.h) + 24;
      var ring = ctx.el('div', 'gm-ring'); ring.style.cssText = 'left:' + (cx - d / 2) + 'px;top:' + (cy - d / 2) + 'px;width:' + d + 'px;height:' + d + 'px';
      var pop = ctx.el('img', 'gm-pop'); pop.src = t.src; pop.style.cssText = 'left:' + t.x + 'px;top:' + t.y + 'px;width:' + t.w + 'px;height:' + t.h + 'px';
      st.appendChild(ring); st.appendChild(pop); setTimeout(function () { ring.remove(); pop.remove(); }, 800);
      ctx.sfx.note(found - 1, 0.3); last = Date.now();
      if (found >= targets.length) { ctx.sfx.ok(); timers.push(setTimeout(function () { if (!dead) ctx.finish({ found: found }); }, 1000)); }
    }
    var last = Date.now();
    var hint = setInterval(function () {
      if (dead || Date.now() - last < 15000) return;
      var t = targets.filter(function (x) { return !x.got; })[0]; if (!t) return;
      t.th.classList.add('hint'); var d = Math.max(t.w, t.h) + 30, ring = ctx.el('div', 'gm-ring');
      ring.style.cssText = 'left:' + (t.x + t.w / 2 - d / 2) + 'px;top:' + (t.y + t.h / 2 - d / 2) + 'px;width:' + d + 'px;height:' + d + 'px;border-color:#fff';
      st.appendChild(ring); setTimeout(function () { ring.remove(); }, 800); last = Date.now() - 9000;
    }, 1500);
    return { destroy: function () { dead = true; clearInterval(hint); timers.forEach(clearTimeout); } };
  });
})();
