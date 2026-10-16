/* «Посчитай часы»: канонические часы Города Часов (и собственные созданные).
   Вверху вопрос с названием часов, внизу кнопки с вариантами. Без проигрыша. */
(function () {
  'use strict';

  var CANONICAL_CLOCKS = [
    {
      file: 'img/clocks/clock_scooter.webp',
      name: { RU: 'Часы на пне с кукушкой', EN: 'Stump Cuckoo Clock', DE: 'Kuckucksuhr auf dem Baumstumpf' }
    },
    {
      file: 'img/clocks/clock_bike.webp',
      name: { RU: 'Напольные дедушкины часы', EN: 'Grandfather Clock', DE: 'Standuhr des Großvaters' }
    },
    {
      file: 'img/clocks/clock_moped.webp',
      name: { RU: 'Сферические часы в кольцах', EN: 'Spherical Clock in Rings', DE: 'Sphärische Uhr in Ringen' }
    },
    {
      file: 'img/Szene_18__pROTEST.webp',
      name: { RU: 'Протестные часы', EN: 'Protest Clocks', DE: 'Protestuhren' }
    },
    {
      file: 'img/Szene_18__InLove.webp',
      name: { RU: 'Влюблённые часы', EN: 'In-Love Clocks', DE: 'Verliebten Uhren' }
    },
    {
      file: 'img/Szene_18__cheese.webp',
      name: { RU: 'Сырные часы', EN: 'Cheese Clocks', DE: 'Käseuhren' }
    },
    {
      file: 'img/Szene_12__DustyClock.webp',
      name: { RU: 'Пыльные часы', EN: 'Dusty Clocks', DE: 'Staubigen Uhren' }
    }
  ];

  var PROMPT = {
    RU: function (name) { return 'Посчитай ' + name + ' — сколько их на экране?'; },
    EN: function (name) { return 'Count the ' + name + ' — how many on screen?'; },
    DE: function (name) { return 'Zähle die ' + name + ' — wie viele sind auf dem Bildschirm?'; }
  };

  function shuffle(a) {
    return a.slice().sort(function () { return Math.random() - 0.5; });
  }

  window.MousekinGames.register('countclocks', function (ctx) {
    var L = ctx.lang || 'RU';
    var formatPrompt = PROMPT[L] || PROMPT.RU;
    var st = ctx.stage;
    var sz = ctx.size();
    var W = sz.w;
    var H = sz.h;
    var timers = [];
    var dead = false;
    var round = 0;

    st.classList.add('gm-dim');

    // Фоновая авторская панорама Города Часов
    var bgPano = ctx.el('div', 'gm-pano-backdrop');
    bgPano.style.cssText = 'position:absolute;inset:0;background:url(' + ctx.assets + 'img/clocktown_pano.webp) center bottom / cover no-repeat;opacity:0.38;pointer-events:none;z-index:0;';
    st.appendChild(bgPano);

    // Формируем пул часов: 4 канонических + если есть созданные игроком
    var pool = CANONICAL_CLOCKS.map(function (c) {
      return {
        src: ctx.assets + c.file,
        name: c.name[L] || c.name.RU
      };
    });

    try {
      var mine = JSON.parse(localStorage.getItem('mousekin_myclock_v1') || 'null');
      if (mine && mine.svg) {
        pool.push({
          src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mine.svg),
          name: L === 'RU' ? 'Твои часы' : (L === 'DE' ? 'Deine Uhren' : 'Your Clocks')
        });
      }
    } catch (e) {}

    // Выбираем 3 раунда из доступных часов
    var selectedClocks = shuffle(pool).slice(0, 3);
    var counts = [
      2 + Math.floor(Math.random() * 2), // 2 или 3
      3 + Math.floor(Math.random() * 2), // 3 или 4
      4 + Math.floor(Math.random() * 2)  // 4 или 5
    ];
    var imgH = Math.max(64, Math.min(130, H * 0.18));

    function next() {
      if (dead) return;
      [].forEach.call(st.querySelectorAll('.gm-items,.gm-opts'), function (n) { n.remove(); });

      if (round >= selectedClocks.length) {
        ctx.sfx.ok();
        return ctx.finish({ rounds: selectedClocks.length });
      }

      var current = selectedClocks[round];
      var k = counts[round];
      ctx.hud(formatPrompt(current.name));

      var items = ctx.el('div', 'gm-items');
      items.style.top = (H * 0.2) + 'px';

      for (var i = 0; i < k; i++) {
        var im = ctx.el('img');
        im.src = current.src;
        im.alt = current.name;
        im.style.height = imgH + 'px';
        im.style.maxWidth = (W * 0.85 / Math.min(k, 4)) + 'px';
        items.appendChild(im);
      }
      st.appendChild(items);

      var vals = [k - 1, k, k + 1].filter(function (v) { return v >= 1; });
      if (vals.length < 3) vals.push(k + 2);

      var opts = ctx.el('div', 'gm-opts');
      opts.style.bottom = Math.max(20, H * 0.1) + 'px';

      shuffle(vals).forEach(function (v) {
        var b = ctx.el('button', '', String(v));
        b.addEventListener('click', function () {
          if (dead || b.disabled) return;
          if (v === k) {
            ctx.sfx.ok();
            items.classList.add('yay');
            [].forEach.call(opts.children, function (x) { x.disabled = true; });
            round++;
            timers.push(setTimeout(next, 1700));
          } else {
            ctx.sfx.oops();
            b.classList.add('no');
            b.disabled = true;
          }
        });
        opts.appendChild(b);
      });
      st.appendChild(opts);
    }

    next();

    return {
      destroy: function () {
        dead = true;
        timers.forEach(clearTimeout);
      }
    };
  });
})();
