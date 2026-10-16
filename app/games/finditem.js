/* «Найди предмет»: 5 канонических предметов из сказки спрятаны на сцене.
   Вверху лоток с иконками и названиями. Нашёл все 5 — победа! */
(function () {
  'use strict';

  var ITEMS = [
    {
      file: 'img/Szene_11__PerfectCoffee.webp',
      title: { RU: 'Чашечка кофе от Алентино', EN: 'Cup of coffee from Alentino', DE: 'Tasse Kaffee von Alentino' }
    },
    {
      file: 'img/Szene_14__mouseDust.webp',
      title: { RU: 'Горстка Пыли Времён', EN: 'Handful of Dust of Time', DE: 'Handvoll Zeitstaub' }
    },
    {
      file: 'img/Szene_03__pergament.webp',
      title: { RU: 'Пыльная карточка из каталога', EN: 'Dusty catalogue card', DE: 'Staubige Katalogkarte' }
    },
    {
      file: 'img/Szene_08__machinery1.webp',
      title: { RU: 'Шестерёнка', EN: 'Gear wheel', DE: 'Zahnrad' }
    },
    {
      file: 'img/Szene_19__indecisivekey.webp',
      title: { RU: 'Стрелка от Нерешительных часов', EN: 'Hand of the Indecisive Clock', DE: 'Zeiger der Unentschlossenen Uhr' }
    }
  ];

  var TXT = {
    RU: ['Найди:', 'Все предметы найдены!'],
    EN: ['Find:', 'All items found!'],
    DE: ['Finde:', 'Alle Gegenstände gefunden!']
  };

  window.MousekinGames.register('finditem', function (ctx) {
    var L = ctx.lang || 'RU';
    var T = TXT[L] || TXT.RU;
    var st = ctx.stage;
    var sc = ctx.scene;
    var timers = [];
    var dead = false;
    var found = 0;
    var lastAction = Date.now();

    var bw = sc.bw || st.clientWidth || 800;
    var bh = sc.bh || st.clientHeight || 600;
    var bx = sc.bx || 0;
    var by = sc.by || 0;

    var itemSize = Math.max(40, Math.min(84, bw * 0.08));

    // Выбираем 5 хорошо распределённых позиций на сцене (расстояние не менее 14% bw)
    // Предусмотрены 5 секторов для гарантированного размещения без наложений
    var sectors = [
      { x: 0.18, y: 0.28 },
      { x: 0.76, y: 0.25 },
      { x: 0.48, y: 0.52 },
      { x: 0.22, y: 0.74 },
      { x: 0.78, y: 0.72 }
    ];
    // Перемешиваем секторы для разнообразия
    sectors.sort(function () { return Math.random() - 0.5; });

    var targets = ITEMS.map(function (it, i) {
      var sec = sectors[i];
      var jx = (Math.random() - 0.5) * 0.08;
      var jy = (Math.random() - 0.5) * 0.08;
      var rx = Math.max(0.08, Math.min(0.88, sec.x + jx));
      var ry = Math.max(0.18, Math.min(0.84, sec.y + jy));
      var px = bx + rx * (bw - itemSize);
      var py = by + ry * (bh - itemSize);
      return {
        item: it,
        src: ctx.assets + it.file,
        title: it.title[L] || it.title.RU,
        x: px,
        y: py,
        w: itemSize,
        h: itemSize,
        got: false
      };
    });

    var hud = ctx.hud('');
    hud.classList.add('tray');
    var labelSpan = ctx.el('span', '', T[0] + ' (0/' + targets.length + ')');
    hud.appendChild(labelSpan);

    targets.forEach(function (t) {
      var th = ctx.el('img');
      th.src = t.src;
      th.alt = t.title;
      th.title = t.title;
      hud.appendChild(th);
      t.th = th;

      // Элемент предмета на сцене
      var elWrap = ctx.el('div', 'gm-find-obj');
      elWrap.style.cssText = 'position:absolute;left:' + t.x + 'px;top:' + t.y + 'px;width:' + t.w + 'px;height:' + t.h + 'px;z-index:2;cursor:pointer;';

      var im = ctx.el('img');
      im.src = t.src;
      im.alt = t.title;
      im.style.cssText = 'width:100%;height:100%;object-fit:contain;opacity:0.88;transition:transform .2s,opacity .2s;pointer-events:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.45));';
      elWrap.appendChild(im);

      // Кнопка для удобного клика (с запасом 20px)
      var pad = 24;
      var hb = ctx.el('button', 'gm-hit');
      hb.style.cssText = 'position:absolute;left:' + (t.x - pad / 2) + 'px;top:' + (t.y - pad / 2) + 'px;width:' + (t.w + pad) + 'px;height:' + (t.h + pad) + 'px;z-index:3;';
      hb.title = t.title;

      hb.addEventListener('click', function () {
        hit(t, elWrap, hb);
      });

      st.appendChild(elWrap);
      st.appendChild(hb);
      t.elWrap = elWrap;
      t.hb = hb;
    });

    function hit(t, elWrap, hb) {
      if (t.got || dead) return;
      t.got = true;
      found++;
      lastAction = Date.now();

      hb.remove();
      elWrap.style.opacity = '0';
      setTimeout(function () { elWrap.remove(); }, 400);

      t.th.classList.remove('hint');
      t.th.classList.add('got');

      labelSpan.textContent = t.title + ' (' + found + '/' + targets.length + ')';

      var cx = t.x + t.w / 2;
      var cy = t.y + t.h / 2;
      var d = Math.max(t.w, t.h) + 30;

      var ring = ctx.el('div', 'gm-ring');
      ring.style.cssText = 'left:' + (cx - d / 2) + 'px;top:' + (cy - d / 2) + 'px;width:' + d + 'px;height:' + d + 'px;';

      var pop = ctx.el('img', 'gm-pop');
      pop.src = t.src;
      pop.style.cssText = 'left:' + t.x + 'px;top:' + t.y + 'px;width:' + t.w + 'px;height:' + t.h + 'px;';

      st.appendChild(ring);
      st.appendChild(pop);
      setTimeout(function () { ring.remove(); pop.remove(); }, 800);

      ctx.sfx.note(found - 1, 0.3);

      if (found >= targets.length) {
        labelSpan.textContent = T[1] + ' (' + found + '/' + targets.length + ')';
        ctx.sfx.ok();
        timers.push(setTimeout(function () {
          if (!dead) ctx.finish({ found: found });
        }, 1200));
      }
    }

    // Подсказка, если игрок долго не нажимает (через 10 секунд)
    var hintInterval = setInterval(function () {
      if (dead || Date.now() - lastAction < 10000) return;
      var remaining = targets.filter(function (x) { return !x.got; });
      if (!remaining.length) return;
      var t = remaining[0];
      t.th.classList.add('hint');
      var d = Math.max(t.w, t.h) + 36;
      var ring = ctx.el('div', 'gm-ring');
      ring.style.cssText = 'left:' + (t.x + t.w / 2 - d / 2) + 'px;top:' + (t.y + t.h / 2 - d / 2) + 'px;width:' + d + 'px;height:' + d + 'px;border-color:#fff';
      st.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 800);
      lastAction = Date.now() - 5000;
    }, 2000);

    return {
      destroy: function () {
        dead = true;
        clearInterval(hintInterval);
        timers.forEach(clearTimeout);
      }
    };
  });
})();
