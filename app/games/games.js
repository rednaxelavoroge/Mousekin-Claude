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

  /* ---------- карточки для печати и просмотра ---------- */
  var CARDS_INFO = {
    1: {
      RU: { title: 'Пробуждение и смена времён', q: 'Бывает, что время тянется, а бывает, что летит. Когда у тебя так было?', t: 'Закрой глаза и скажи «стоп», когда, по-твоему, прошла минута. Проверь по часам.' },
      EN: { title: 'Awakening and the Changing of Times', q: 'Does time sometimes drag, and sometimes fly? When did that happen to you?', t: 'Close your eyes and say "stop" when you think a minute has passed. Check against a clock.' },
      DE: { title: 'Erwachen und der Zeitenwechsel', q: 'Zieht sich Zeit manchmal hin und verfliegt ein andermal im Nu? Wann war das bei dir so?', t: 'Schließe die Augen und sage „Stopp“, wenn deiner Meinung nach eine Minute vergangen ist. Prüfe es mit der Uhr.' }
    },
    2: {
      RU: { title: 'Мир Бегущего Времени', q: 'Почему у всех часы разные?', t: 'Посчитай, сколько разных часов есть у вас дома. Нарисуй два самых непохожих.' },
      EN: { title: 'The World of Running Time', q: 'Why does everyone have a different clock?', t: 'Count how many different clocks you have at home. Draw the two most different ones.' },
      DE: { title: 'Die Welt der Laufenden Zeit', q: 'Warum hat jeder eine andere Uhr?', t: 'Zähle, wie viele verschiedene Uhren es bei euch zu Hause gibt. Zeichne die zwei unterschiedlichsten.' }
    },
    3: {
      RU: { title: 'Времясипед', q: 'Если бы твой транспорт умел говорить, что бы он сказал?', t: 'Построй свой транспорт из кубиков, стульев или коробок. Покажи маме.' },
      EN: { title: 'The Timecycle', q: 'If your vehicle could talk, what would it say?', t: 'Build your own vehicle from blocks, chairs or boxes. Show Mum.' },
      DE: { title: 'Das Zeitrad', q: 'Wenn dein Fahrzeug sprechen könnte, was würde es sagen?', t: 'Baue dein eigenes Fahrzeug aus Bausteinen, Stühlen oder Kisten. Zeige es Mama.' }
    },
    4: {
      RU: { title: 'Улитка и Перфектность', q: 'Что в тебе не идеально, но тебе нравится?', t: 'Нарисуй что-нибудь намеренно кривое и подпиши: «Мой перфектный».' },
      EN: { title: 'The Snail and Perfectness', q: 'What about you isn\'t perfect, but you love it anyway?', t: 'Draw something intentionally crooked and write: "My perfect imperfection".' },
      DE: { title: 'Die Schnecke und die Perfektion', q: 'Was an dir ist nicht perfekt, aber du magst es trotzdem?', t: 'Zeichne etwas absichtlich Krummes und schreibe darunter: „Mein Perfektes“.' }
    },
    5: {
      RU: { title: 'Йозеф-архивариус и Пыль Времён', q: 'Что ты помнишь из прошлого лета?', t: 'Попроси кого-нибудь из семьи рассказать историю из их детства.' },
      EN: { title: 'Josef the Archivist and the Dust of Times', q: 'What do you remember from last summer?', t: 'Ask someone in your family to tell a story from their childhood.' },
      DE: { title: 'Josef der Archivar und der Staub der Zeiten', q: 'Woran erinnerst du dich aus dem letzten Sommer?', t: 'Bitte jemanden aus deiner Familie, eine Geschichte aus seiner Kindheit zu erzählen.' }
    },
    6: {
      RU: { title: 'Кот Мартин', q: 'Где ты любишь спать днём?', t: 'Сегодня уйди из разговора «по-английски»: тихо, без лишних слов. Потом расскажи, как это было.' },
      EN: { title: 'Martin the Cat', q: 'Where do you like to nap during the day?', t: 'Today, slip away from a conversation like a cat: quietly, without extra words. Then tell how it felt.' },
      DE: { title: 'Kater Martin', q: 'Wo machst du tagsüber am liebsten ein Nickerchen?', t: 'Verlasse heute ein Gespräch auf leisen Pfoten: still, ohne überflüssige Worte. Erzähle danach, wie es war.' }
    },
    7: {
      RU: { title: 'Часы по дороге', q: 'На какие часы из книги ты похож?', t: 'Найди дома часы или что-то круглое, похожее на твой характер. Объясни маме почему.' },
      EN: { title: 'Clocks Along the Way', q: 'Which clock from the book are you most like?', t: 'Find a clock or round object at home that matches your personality. Explain to Mum why.' },
      DE: { title: 'Uhren am Wegesrand', q: 'Welcher Uhr aus dem Buch ähnelst du am meisten?', t: 'Finde zu Hause eine Uhr oder einen runden Gegenstand, der zu deinem Charakter passt. Erkläre Mama warum.' }
    },
    8: {
      RU: { title: 'Озарение Мышонка', q: 'Что бы ты хотел завести против течения?', t: 'Выбери одно дело, которое всегда откладываешь, и сделай его сегодня первым.' },
      EN: { title: 'The Mouse\'s Epiphany', q: 'What would you like to wind against the stream?', t: 'Pick one task you always put off, and do it first today.' },
      DE: { title: 'Der Geistesblitz der kleinen Maus', q: 'Was würdest du gerne gegen den Strom aufziehen?', t: 'Wähle eine Sache, die du immer aufschiebst, und erledige sie heute als Erstes.' }
    },
    9: {
      RU: { title: 'Главное открытие', q: 'Кто настраивает твоё время?', t: 'Сделай свои часы руками: из бумаги, картона или коробки. Повесь в детской.' },
      EN: { title: 'The Grand Discovery', q: 'Who sets your time?', t: 'Craft your own clock with your hands: from paper, cardboard or a box. Hang it in your room.' },
      DE: { title: 'Die große Entdeckung', q: 'Wer stellt deine Zeit ein?', t: 'Bastle deine eigene Uhr mit deinen Händen: aus Papier, Pappe oder einem Karton. Hänge sie in deinem Zimmer auf.' }
    },
    10: {
      RU: { title: 'Возвращение домой', q: 'Что в тебе изменилось, пока ты читал книгу?', t: 'Нарисуй себя «до» и «после» книги. Покажи маме и попроси угадать, где какой рисунок.' },
      EN: { title: 'Returning Home', q: 'What changed in you while reading the book?', t: 'Draw yourself "before" and "after" the book. Show Mum and ask her to guess which is which.' },
      DE: { title: 'Heimkehr', q: 'Was hat sich in dir verändert, während du das Buch gelesen hast?', t: 'Zeichne dich „vor“ und „nach“ dem Buch. Zeige es Mama und bitte sie zu erraten, welches Bild welches ist.' }
    },
    11: {
      RU: { title: 'Город часов моей семьи', q: 'Кто в твоём городе часов самый важный?', t: 'Нарисуй часы для одного человека из семьи и дай им имя и историю.' },
      EN: { title: 'My Family\'s Clock City', q: 'Who is the most important in your clock city?', t: 'Draw a clock for one person in your family and give it a name and a story.' },
      DE: { title: 'Die Uhrenstadt meiner Familie', q: 'Wer ist in deiner Uhrenstadt der Wichtigste?', t: 'Zeichne eine Uhr für eine Person aus deiner Familie und gib ihr einen Namen und eine Geschichte.' }
    }
  };

  function printCard(n, L, item) {
    var qLabel = L === 'RU' ? 'Вопрос' : (L === 'DE' ? 'Frage' : 'Question');
    var tLabel = L === 'RU' ? 'Дело' : (L === 'DE' ? 'Aufgabe' : 'Action');
    var drawLabel = L === 'RU' ? 'Место для твоего рисунка на карточке' : (L === 'DE' ? 'Platz für deine Zeichnung' : 'Place for your drawing');
    var html = '<div style="max-width:130mm;margin:20mm auto;padding:10mm;border:2px dashed #ee6a3c;border-radius:6mm;font-family:system-ui,-apple-system,sans-serif;color:#2a2320;background:#fff;text-align:left;box-sizing:border-box;">' +
      '<div style="font-weight:800;color:#ee6a3c;font-size:15pt;margin-bottom:3mm;">№ ' + n + '</div>' +
      '<h2 style="margin:0 0 5mm;font-size:18pt;line-height:1.2;color:#1e1b4b;">' + item.title + '</h2>' +
      (item.q ? '<p style="margin:0 0 4mm;font-size:12pt;line-height:1.45;"><b>' + qLabel + ':</b> ' + item.q + '</p>' : '') +
      (item.t ? '<p style="margin:0 0 5mm;font-size:12pt;line-height:1.45;"><b>' + tLabel + ':</b> ' + item.t + '</p>' : '') +
      '<div style="height:70mm;border:1.5px dashed #ccc;border-radius:4mm;display:flex;align-items:center;justify-content:center;color:#999;font-size:11pt;margin-top:6mm;">' + drawLabel + '</div>' +
      '</div>';
    printHTML(html);
  }

  function showCardModal(n, L) {
    if (!ov) return;
    var info = CARDS_INFO[n] || {};
    var item = info[L] || info.RU || { title: 'Карточка № ' + n, q: '', t: '' };
    var qLabel = L === 'RU' ? 'Вопрос' : (L === 'DE' ? 'Frage' : 'Question');
    var tLabel = L === 'RU' ? 'Дело' : (L === 'DE' ? 'Aufgabe' : 'Action');
    var drawLabel = L === 'RU' ? 'Место для твоего рисунка на карточке' : (L === 'DE' ? 'Platz für deine Zeichnung' : 'Place for your drawing');
    var printLabel = L === 'RU' ? '🖨️ Распечатать эту карточку' : (L === 'DE' ? '🖨️ Diese Karte drucken' : '🖨️ Print this card');
    var allCardsLabel = L === 'RU' ? '📄 Все 11 карточек для печати' : (L === 'DE' ? '📄 Alle 11 Karten drucken' : '📄 All 11 printable cards');
    var closeLabel = L === 'RU' ? '✕ Закрыть карточку' : (L === 'DE' ? '✕ Karte schließen' : '✕ Close card');

    var modalOv = el('div', 'gm-card-modal-ov');
    modalOv.addEventListener('click', function (e) {
      if (e.target === modalOv) modalOv.remove();
    });

    var box = el('div', 'gm-card-preview');
    box.appendChild(el('div', 'cp-num', '№ ' + n));
    box.appendChild(el('h3', '', item.title));

    if (item.q) {
      var pQ = el('p', '');
      var bQ = el('b', '', qLabel + ': ');
      pQ.appendChild(bQ);
      pQ.appendChild(document.createTextNode(item.q));
      box.appendChild(pQ);
    }

    if (item.t) {
      var pT = el('p', '');
      var bT = el('b', '', tLabel + ': ');
      pT.appendChild(bT);
      pT.appendChild(document.createTextNode(item.t));
      box.appendChild(pT);
    }

    box.appendChild(el('div', 'cp-draw', drawLabel));

    var btns = el('div', 'cp-btns');

    var bPrint = el('button', 'cp-btn-print', printLabel);
    bPrint.type = 'button';
    bPrint.addEventListener('click', function () {
      printCard(n, L, item);
    });
    btns.appendChild(bPrint);

    var bAll = el('button', 'cp-btn-all', allCardsLabel);
    bAll.type = 'button';
    bAll.addEventListener('click', function () {
      window.open(new URL('cards.html#card-' + n, BASE).href, '_blank');
    });
    btns.appendChild(bAll);

    var bClose = el('button', 'cp-btn-close', closeLabel);
    bClose.type = 'button';
    bClose.addEventListener('click', function () {
      modalOv.remove();
    });
    btns.appendChild(bClose);

    box.appendChild(btns);
    modalOv.appendChild(box);
    ov.appendChild(modalOv);
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
    document.body.classList.add('in-game');
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
          stage: stage, idx: idx, lang: lang(), t: tr, base: BASE, assets: ASSETS, scene: geom(), sfx: sfx, el: el, print: printHTML, size: function () { return { w: stage.clientWidth, h: stage.clientHeight }; },
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

    // Скрываем HUD и крестик закрытия игры, чтобы не конфликтовали с финальной карточкой
    if (cur.stage) {
      var lingeringHud = cur.stage.querySelector('.gm-hud');
      if (lingeringHud) lingeringHud.style.display = 'none';
    }
    var closeBtn = ov.querySelector('.gm-x');
    if (closeBtn) closeBtn.style.display = 'none';

    var L = lang();
    var ui = CFG.ui, fin = el('div', 'gm-fin'), card = el('div', 'gm-card');
    var img = el('img'); img.src = ASSETS + 'img/Szene_10__MouseFace.webp'; img.alt = ''; card.appendChild(img);
    card.appendChild(el('p', 'says', tr(ui.mouseSays)));
    card.appendChild(el('p', 'task', tr(g.task)));

    var n = g.cards && g.cards[String(idx)];
    if (n) {
      var cardBtn = el('button', 'num card-btn');
      cardBtn.type = 'button';
      var cardTxt = L === 'RU' ? 'Получить карточку № ' : (L === 'DE' ? 'Karte ansehen № ' : 'Get card № ');
      cardBtn.textContent = '📄 ' + cardTxt + n;
      cardBtn.title = L === 'RU' ? 'Открыть и распечатать карточку № ' + n : (L === 'DE' ? 'Karte № ' + n + ' ansehen und drucken' : 'View and print card № ' + n);
      cardBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showCardModal(n, L);
      });
      card.appendChild(cardBtn);
    }

    if (result && result.print) {
      var pb = el('button', 'alt', tr(result.print.label) || tr(ui.print));
      pb.type = 'button';
      pb.addEventListener('click', function (e) {
        e.stopPropagation();
        printHTML(result.print.html);
      });
      card.appendChild(pb);
    }
    card.appendChild(el('p', 'tired', tr(ui.tired)));
    var b = el('button', 'gm-close-btn', tr(ui.close));
    b.type = 'button';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      closeGame('done');
    });
    card.appendChild(b); fin.appendChild(card); ov.appendChild(fin);
  }

  function closeGame(reason) {
    if (!ov) return;
    document.body.classList.remove('in-game');
    var g = cur && cur.g;
    var ifr = ov.querySelector('iframe');
    if (ifr) { try { ifr.src = 'about:blank'; ifr.remove(); } catch (err) {} }
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
    if (d.type === 'TIME_TRANSPORT_ASSEMBLED') {
      rememberVehicle(d.vehicleId, idx);
      cur.assembledVehicle = d;
    } else if (d.type === 'TIME_TRANSPORT_FINISHED') {
      var ifr = ov.querySelector('iframe');
      if (ifr) { try { ifr.src = 'about:blank'; ifr.remove(); } catch (err) {} }
      finish(g, idx, cur.assembledVehicle || d);
    } else if ((g.doneMessages || []).indexOf(d.type) >= 0) {
      rememberVehicle(d.vehicleId, idx);
      var ifr2 = ov.querySelector('iframe');
      if (ifr2) { try { ifr2.src = 'about:blank'; ifr2.remove(); } catch (err) {} }
      finish(g, idx, d);
    } else if ((g.closeMessages || []).indexOf(d.type) >= 0) {
      if (cur.assembledVehicle) {
        var ifr3 = ov.querySelector('iframe');
        if (ifr3) { try { ifr3.src = 'about:blank'; ifr3.remove(); } catch (err) {} }
        finish(g, idx, cur.assembledVehicle);
      } else {
        closeGame('game');
      }
    }
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
