/* «Найди мышонка»: 5 раундов пряток за каноническими часами Города Часов.
   Мышонок выглядывает из-за часов. Нашёл — мышиный писк и переход на следующий уровень. */
(function () {
  'use strict';

  var CLOCKS = [
    {
      file: 'img/Szene_18__pROTEST.webp',
      name: { RU: 'Протестными часами', EN: 'Protest Clock', DE: 'Protestuhr' }
    },
    {
      file: 'img/Szene_18__indecisive.webp',
      name: { RU: 'Нерешительными часами', EN: 'Indecisive Clock', DE: 'Unentschlossenen Uhr' }
    },
    {
      file: 'img/Szene_18__InLove.webp',
      name: { RU: 'Влюблёнными часами', EN: 'In-Love Clock', DE: 'Verliebten Uhr' }
    },
    {
      file: 'img/Szene_18__lost.webp',
      name: { RU: 'Потерянными часами', EN: 'Lost Clock', DE: 'Verlorenen Uhr' }
    },
    {
      file: 'img/Szene_18__cheese.webp',
      name: { RU: 'Сырными часами', EN: 'Cheese Clock', DE: 'Käseuhr' }
    }
  ];

  var TEXT = {
    RU: function (r, total, name) { return 'Уровень ' + r + '/' + total + ': Мышонок спрятался за ' + name + '!'; },
    EN: function (r, total, name) { return 'Round ' + r + '/' + total + ': Mouse is hiding behind the ' + name + '!'; },
    DE: function (r, total, name) { return 'Runde ' + r + '/' + total + ': Die Maus versteckt sich hinter der ' + name + '!'; }
  };

  window.MousekinGames.register('findmouse', function (ctx) {
    var L = ctx.lang || 'RU';
    var formatHud = TEXT[L] || TEXT.RU;
    var sc = ctx.scene;
    var st = ctx.stage;
    var round = 0;
    var timer = 0;
    var dead = false;
    var TOTAL = CLOCKS.length;

    var bw = sc.bw || st.clientWidth || 800;
    var bh = sc.bh || st.clientHeight || 600;
    var bx = sc.bx || 0;
    var by = sc.by || 0;

    var container = ctx.el('div', 'gm-findmouse-round');
    container.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    st.appendChild(container);

    function nextRound() {
      if (dead) return;
      container.innerHTML = '';
      if (round >= TOTAL) {
        ctx.sfx.ok();
        timer = setTimeout(function () {
          if (!dead) ctx.finish({ found: TOTAL });
        }, 900);
        return;
      }

      var clk = CLOCKS[round];
      var clkName = clk.name[L] || clk.name.RU;
      ctx.hud(formatHud(round + 1, TOTAL, clkName));

      // Размеры часов на сцене
      var clockH = Math.max(90, Math.min(220, bh * 0.32));
      var clockW = clockH; // пропорционально

      // Позиция часов в разных местах сцены в каждом раунде
      var positions = [
        { x: 0.25, y: 0.35 },
        { x: 0.65, y: 0.32 },
        { x: 0.45, y: 0.50 },
        { x: 0.22, y: 0.62 },
        { x: 0.68, y: 0.58 }
      ];
      var pos = positions[round % positions.length];
      var cx = bx + pos.x * (bw - clockW);
      var cy = by + pos.y * (bh - clockH);

      // Контейнер текущих часов и выглядывающего мышонка
      var wrap = ctx.el('div', 'gm-clock-shelter');
      wrap.style.cssText = 'position:absolute;left:' + cx + 'px;top:' + cy + 'px;width:' + clockW + 'px;height:' + clockH + 'px;pointer-events:none;';

      // Мышонок, выглядывающий сбоку или сверху из-за часов
      var mouseBtn = ctx.el('button', 'gm-mouse');
      var mouseImg = ctx.el('img');
      mouseImg.src = ctx.assets + 'img/Szene_10__MouseFace.webp';
      mouseImg.alt = 'Мышонок';
      mouseBtn.appendChild(mouseImg);

      var mouseH = clockH * 0.55;
      var mouseW = mouseH * (474 / 512);
      mouseBtn.style.width = mouseW + 'px';
      mouseBtn.style.height = mouseH + 'px';
      mouseBtn.style.pointerEvents = 'auto';
      mouseBtn.style.zIndex = '1';

      // Смещение мышонка относительно часов (слева, справа или сверху)
      var side = round % 2 === 0 ? 'right' : 'left';
      if (side === 'right') {
        mouseBtn.style.right = (-mouseW * 0.45) + 'px';
        mouseBtn.style.top = (clockH * 0.2) + 'px';
      } else {
        mouseBtn.style.left = (-mouseW * 0.45) + 'px';
        mouseBtn.style.top = (clockH * 0.2) + 'px';
      }

      // Часы (на переднем плане перед мышонком)
      var clockImg = ctx.el('img');
      clockImg.src = ctx.assets + clk.file;
      clockImg.alt = clkName;
      clockImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:2;pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));';

      wrap.appendChild(mouseBtn);
      wrap.appendChild(clockImg);
      container.appendChild(wrap);

      // Анимация выглядывания
      timer = setTimeout(function () {
        if (dead) return;
        mouseBtn.classList.add('show');
      }, 350);

      mouseBtn.addEventListener('click', function () {
        if (dead || mouseBtn.classList.contains('hit')) return;
        clearTimeout(timer);
        ctx.sfx.squeak();
        mouseBtn.classList.remove('show');
        mouseBtn.classList.add('hit');

        // Золотые частицы вокруг мышонка
        var rect = mouseBtn.getBoundingClientRect();
        var ring = ctx.el('div', 'gm-ring');
        ring.style.cssText = 'left:' + rect.left + 'px;top:' + rect.top + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;';
        st.appendChild(ring);
        setTimeout(function () { ring.remove(); }, 700);

        round++;
        timer = setTimeout(nextRound, 800);
      });
    }

    nextRound();

    return {
      destroy: function () {
        dead = true;
        clearTimeout(timer);
      }
    };
  });
})();
