/* Mousekin · слой мини-игр «игра-мост» + свободные режимы.
   Книга (app.js) не изменена: слой наблюдает за счётчиком страниц и открывает игру ОВЕРЛЕЕМ поверх сцены.
   Выключить всё: "enabled": false в games.json. Выключить одну игру: "enabled": false у неё. */
(function () {
  'use strict';
  var script = document.currentScript;
  var BASE = script && script.src ? new URL('.', script.src).href : new URL('games/', location.href).href;
  var ASSETS = new URL('../', BASE).href;
  var CFG = null, ov = null, cur = null, offerEl = null, offerTimer = 0, played = {}, registry = {};
  var $ = function (id) { return document.getElementById(id); };

  window.MousekinGames = { register: function (id, factory) { registry[id] = factory; }, base: BASE };

  function lang() { return (window.__mp && window.__mp.lang) || 'RU'; }
  function tr(o) { if (!o) return ''; if (typeof o === 'string') return o; return o[lang()] || o.EN || o.RU || ''; }
  function emit(name, detail) { try { window.dispatchEvent(new CustomEvent('mousekin:' + name, { detail: detail })); } catch (e) {} }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function sceneIndex() { var p = $('pageNo'); if (!p || p.hidden) return -1; var n = parseInt(p.textContent, 10); return isNaN(n) ? -1 : n - 1; }
  function geom() {
    var s = window.__mp && window.__mp.scene;
    if (s && s.bw) return { bx: s.bx, by: s.by, bw: s.bw, bh: s.bh, box: s.box, data: s.d };
    var a = $('app'); return { bx: 0, by: 0, bw: a.clientWidth, bh: a.clientHeight, box: null, data: null };
  }
  function pauseBook() { try { window.__mp.Aud.pauseAll(); } catch (e) {} }
  function resumeBook() { try { window.__mp.Aud.resumeAll(); } catch (e) {} }

  /* ---------- звук (синтез, без файлов) ---------- */
  var actx = null, PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  var sfx = {
    on: function () { var b = $('btnSfx'); return !(b && b.classList.contains('muted')); },
    tone: function (f0, f1, dur, vol, type) {
      if (!sfx.on()) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
        o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
      } catch (e) {}
    },
    squeak: function () { sfx.tone(1500, 2400, 0.12, 0.2); setTimeout(function () { sfx.tone(1900, 2800, 0.1, 0.16); }, 130); },
    note: function (i, dur) { var f = PENTA[i % PENTA.length]; sfx.tone(f, f, dur || 0.35, 0.2, 'triangle'); },
    ok: function () { [0, 2, 4, 5].forEach(function (n, k) { setTimeout(function () { sfx.note(n, 0.25); }, k * 110); }); },
    oops: function () { sfx.tone(300, 200, 0.22, 0.14, 'sawtooth'); },
    snap: function () { sfx.tone(700, 900, 0.07, 0.16, 'triangle'); }
  };

  /* ---------- печать вместо экрана ---------- */
  function printHTML(html) {
    var d = el('div', 'gm-print'); d.innerHTML = html; document.body.appendChild(d);
    var clean = function () { d.remove(); window.removeEventListener('afterprint', clean); };
    window.addEventListener('afterprint', clean);
    setTimeout(function () { try { window.print(); } catch (e) {} setTimeout(clean, 4000); }, 50);
  }

  /* ---------- гараж: собранный транспорт и часы на «стене» — видны в следующих сценах ---------- */
  var VEH_FILE = { scooter: 'самокат_full.webp', monowheel: 'моноколесо_full.webp', bike: 'вел_full.webp', moped: 'мопед_full.webp' };
  var GKEY = 'mousekin_garage_v1';
  function readGarage() { try { return JSON.parse(localStorage.getItem(GKEY) || '{}'); } catch (e) { return {}; } }
  function writeGarage(g) { try { localStorage.setItem(GKEY, JSON.stringify(g)); } catch (e) {} }
  function rememberVehicle(id, idx) {
    if (!id || idx < 0) return;
    var g = readGarage(); g.vehicles = g.vehicles || {};
    if (!(id in g.vehicles)) g.vehicles[id] = idx;
    writeGarage(g);
  }
  function renderGarage() {
    var old = $('gmGarage'); if (old) old.remove();
    if (ov) return;
    var idx = sceneIndex(); if (idx < 0) return;
    var g = readGarage(), items = [], mine = null;
    Object.keys(g.vehicles || {}).forEach(function (id) {
      if (VEH_FILE[id] && idx > g.vehicles[id]) items.push(new URL('../../time_transport_game/assets/' + VEH_FILE[id], BASE).href);
    });
    try { mine = JSON.parse(localStorage.getItem('mousekin_myclock_v1') || 'null'); } catch (e) {}
    if (mine && mine.svg) items.push('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mine.svg));
    if (!items.length) return;
    var wrap = el('div', 'gm-garage'); wrap.id = 'gmGarage';
    items.forEach(function (src) { var im = el('img'); im.src = src; im.alt = ''; wrap.appendChild(im); });
    $('app').appendChild(wrap);
  }

  /* ---------- предложение игры после сцены (не навязывается) ---------- */
  function removeOffer() { if (offerEl) { offerEl.remove(); offerEl = null; } }
  function onScene() {
    clearTimeout(offerTimer); removeOffer(); renderGarage();
    if (ov || !CFG) return;
    var idx = sceneIndex(); if (idx < 0) return;
    var g = null, list = CFG.games || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].enabled !== false && list[i].cards && (String(idx) in list[i].cards) && !played[list[i].id + ':' + idx]) { g = list[i]; break; }
    }
    if (!g) return;
    offerTimer = setTimeout(function () {
      if (ov || sceneIndex() !== idx) return;
      var b = el('button', 'gm-offer');
      b.appendChild(el('b', '', g.icon || '🐭')); b.appendChild(el('span', '', tr(g.title)));
      ['pointerdown', 'pointerup', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function (e) { e.stopPropagation(); }); });
      b.addEventListener('click', function (e) { e.stopPropagation(); openGame(g, idx); });
      $('app').appendChild(b); offerEl = b;
      requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('on'); }); });
    }, CFG.offerDelayMs || 2500);
  }

  /* ---------- оверлей ---------- */
  function mountOverlay(cls) {
    removeOffer(); pauseBook();
    var gg = $('gmGarage'); if (gg) gg.remove();
    ov = el('div', 'gm-ov' + (cls ? ' ' + cls : ''));
    ['pointerdown', 'pointerup', 'pointercancel', 'pointermove', 'click', 'wheel'].forEach(function (ev) {
      ov.addEventListener(ev, function (e) { e.stopPropagation(); });
    });
    var stage = el('div', 'gm-stage');
    var x = el('button', 'gm-x', '×'); x.setAttribute('aria-label', tr(CFG.ui.close));
    x.addEventListener('click', function () { closeGame('x'); });
    ov.appendChild(stage); ov.appendChild(x); $('app').appendChild(ov);
    return stage;
  }

  function openGame(g, idx) {
    if (ov) return;
    var stage = mountOverlay(g.type === 'iframe' ? 'iframe' : '');
    cur = { g: g, idx: idx, stage: stage, inst: null, done: false };
    emit('game-open', { id: g.id, scene: idx });
    if (g.type === 'iframe') {
      var f = document.createElement('iframe');
      f.src = new URL(g.src, BASE).href; f.setAttribute('allow', 'autoplay'); f.title = tr(g.title);
      stage.appendChild(f); return;
    }
    var start = function () {
      var make = registry[g.id];
      if (!make) return closeGame('error');
      try {
        cur.inst = make({
          stage: stage, lang: lang(), t: tr, base: BASE, assets: ASSETS, scene: geom(), sfx: sfx, el: el, print: printHTML, size: function () { return { w: stage.clientWidth, h: stage.clientHeight }; },
          hud: function (text) { var h = stage.querySelector('.gm-hud') || stage.appendChild(el('div', 'gm-hud')); h.textContent = text; return h; },
          finish: function (r) { finish(g, idx, r); }
        });
      } catch (e) { console.error('game', g.id, e); closeGame('error'); }
    };
    if (registry[g.id]) return start();
    var s = document.createElement('script'); s.src = BASE + g.script; s.onload = start; s.onerror = function () { closeGame('error'); };
    document.head.appendChild(s);
  }

  /* ---------- финал: задание вне экрана, без «играть снова» ---------- */
  function finish(g, idx, result) {
    if (!ov || !cur || cur.done) return;
    cur.done = true; if (idx >= 0) played[g.id + ':' + idx] = 1;
    emit('game-done', { id: g.id, scene: idx, result: result && !result.print ? result : null });
    var ui = CFG.ui, fin = el('div', 'gm-fin'), card = el('div', 'gm-card');
    var img = el('img'); img.src = ASSETS + 'img/Szene_10__MouseFace.webp'; img.alt = ''; card.appendChild(img);
    card.appendChild(el('p', 'says', tr(ui.mouseSays)));
    card.appendChild(el('p', 'task', tr(g.task)));
    var n = g.cards && g.cards[String(idx)];
    if (n) card.appendChild(el('div', 'num', tr(ui.card) + ' ' + n));
    if (result && result.print) {
      var pb = el('button', 'alt', tr(result.print.label) || tr(ui.print));
      pb.addEventListener('click', function () { printHTML(result.print.html); });
      card.appendChild(pb);
    }
    card.appendChild(el('p', 'tired', tr(ui.tired)));
    var b = el('button', '', tr(ui.close)); b.addEventListener('click', function () { closeGame('done'); });
    card.appendChild(b); fin.appendChild(card); ov.appendChild(fin);
  }

  function closeGame(reason) {
    if (!ov) return;
    var g = cur && cur.g;
    try { if (cur && cur.inst && cur.inst.destroy) cur.inst.destroy(); } catch (e) {}
    ov.remove(); ov = null; cur = null;
    resumeBook();
    emit('game-close', { id: g && g.id, reason: reason });
    onScene();
  }

  /* ---------- свободные режимы: открывает родитель сам ---------- */
  function openMenu() {
    if (ov || !CFG) return;
    var stage = mountOverlay('menu'); cur = { g: { id: 'menu' }, idx: -1, stage: stage, inst: null, done: true };
    var box = el('div', 'gm-menubox'); box.appendChild(el('h2', '', tr(CFG.ui.menuTitle)));
    var grid = el('div', 'gm-tiles');
    (CFG.games || []).filter(function (g) { return g.free && g.enabled !== false; }).forEach(function (g) {
      var t = el('button', 'gm-tile'); t.appendChild(el('b', '', g.icon || '🎲')); t.appendChild(el('span', '', tr(g.title)));
      if (g.sub) t.appendChild(el('i', '', tr(g.sub)));
      t.addEventListener('click', function () {
        if (g.type === 'link') { window.open(new URL(g.href, BASE).href, '_blank'); return; }
        if (g.type === 'info') { showInfo(g); return; }
        closeGame('menu'); openGame(g, -1);
      });
      grid.appendChild(t);
    });
    box.appendChild(grid); stage.appendChild(box);
  }
  /* ---------- раздел для родителей: текст, без игры ---------- */
  function showInfo(g) {
    if (ov) closeGame('menu');
    var stage = mountOverlay('menu'); cur = { g: g, idx: -1, stage: stage, inst: null, done: true };
    var box = el('div', 'gm-menubox'); box.appendChild(el('h2', '', tr(g.title)));
    var list = (g.text && (g.text[lang()] || g.text.EN || g.text.RU)) || [];
    var wrap = el('div', 'gm-info'); wrap.style.margin = '0 auto';
    list.forEach(function (t) { wrap.appendChild(el('p', '', t)); });
    box.appendChild(wrap); stage.appendChild(box);
  }
  function addMenuButton() {
    var bar = $('topbar'); if (!bar || $('btnGames')) return;
    var b = el('button', '', '🎲'); b.id = 'btnGames'; b.title = tr(CFG.ui.menuTitle); b.setAttribute('aria-label', tr(CFG.ui.menuTitle));
    b.style.fontSize = '20px'; b.addEventListener('click', openMenu); bar.insertBefore(b, bar.firstChild);
  }

  window.addEventListener('keydown', function (e) {
    if (!ov) return;
    if (e.key === 'Escape') closeGame('x');
    e.stopImmediatePropagation();
  }, true);

  window.addEventListener('message', function (e) {
    if (!ov || !cur || cur.g.type !== 'iframe' || e.origin !== location.origin) return;
    var d = e.data; if (!d || typeof d.type !== 'string') return;
    var g = cur.g, idx = cur.idx;
    if ((g.doneMessages || []).indexOf(d.type) >= 0) { rememberVehicle(d.vehicleId, idx); setTimeout(function () { finish(g, idx, d); }, 1600); }
    else if ((g.closeMessages || []).indexOf(d.type) >= 0) closeGame('game');
  });

  function init() {
    fetch(BASE + 'games.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (c) {
      if (!c || c.enabled === false) return;
      CFG = c;
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = BASE + 'games.css'; document.head.appendChild(css);
      addMenuButton();
      var p = $('pageNo'); if (!p) return;
      new MutationObserver(onScene).observe(p, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
      onScene();
    }).catch(function (e) { console.warn('games layer off:', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
