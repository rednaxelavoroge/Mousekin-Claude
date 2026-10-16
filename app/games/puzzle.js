/* «Собери пазл»: полные иллюстрации глав сказки разрезаны на 6 частей.
   Собрал — картинка соединяется воедино. Доступна кнопка печати. */
(function () {
  'use strict';

  var TXT = {
    RU: ['Собери картинку', 'Получилось!'],
    EN: ['Put the picture together', 'You did it!'],
    DE: ['Setze das Bild zusammen', 'Geschafft!']
  };

  window.MousekinGames.register('puzzle', function (ctx) {
    var L = ctx.lang || 'RU';
    var T = TXT[L] || TXT.RU;
    var st = ctx.stage;
    var timers = [];
    var dead = false;

    st.classList.add('gm-dim');
    st.style.transition = 'background .9s';

    // Выбор иллюстрации по номеру сцены (idx = page - 1)
    var thumbPath = 'thumbs/chapter0006.webp';
    if (ctx.idx === 5) {
      thumbPath = 'thumbs/chapter0007.webp';
    } else if (ctx.idx === 10 || ctx.idx === 11) {
      thumbPath = 'thumbs/chapter0011.webp';
    } else if (ctx.idx === 14) {
      thumbPath = 'thumbs/chapter0014.webp';
    }
    var imgUrl = ctx.assets + thumbPath;

    var COLS = 3, ROWS = 2, TOP = 96, PAD = 10;
    var sz = ctx.size();
    var W = sz.w, H = sz.h, total = COLS * ROWS;
    var ar = 16 / 10; // Стандартное соотношение сторон иллюстраций
    var bw = 0, bh = 0, pw = 0, ph = 0, cols = 1, trayRows = 1, f, need;

    for (f = 1; f > 0.3; f -= 0.02) {
      bw = Math.min(W * 0.92, ar * H * 0.52) * f;
      bh = bw / ar;
      pw = bw / COLS;
      ph = bh / ROWS;
      cols = Math.max(1, Math.floor((W - 12) / (pw + PAD)));
      trayRows = Math.ceil(total / cols);
      need = TOP + bh + 16 + trayRows * (ph + PAD) + 10;
      if (need <= H) break;
    }

    var bx = (W - bw) / 2, by = TOP;
    var locked = 0, slots = [], pieces = [];

    ctx.hud(T[0]);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        // Слот на игровом поле
        var s = ctx.el('div', 'gm-slot');
        s.style.cssText = 'left:' + (bx + c * pw) + 'px;top:' + (by + r * ph) + 'px;width:' + pw + 'px;height:' + ph + 'px';
        st.appendChild(s);
        slots.push(s);

        // Кусочек пазла с точным смещением иллюстрации
        var p = ctx.el('div', 'gm-piece');
        p.style.cssText = 'position:absolute;overflow:hidden;width:' + pw + 'px;height:' + ph + 'px;border-radius:6px;box-shadow:0 3px 10px rgba(0,0,0,.5);cursor:grab;touch-action:none;z-index:5;';

        var pieceImg = ctx.el('img');
        pieceImg.src = imgUrl;
        pieceImg.alt = '';
        pieceImg.draggable = false;
        pieceImg.style.cssText = 'position:absolute;left:' + (-c * pw) + 'px;top:' + (-r * ph) + 'px;width:' + bw + 'px;height:' + bh + 'px;pointer-events:none;';
        p.appendChild(pieceImg);

        p._tx = bx + c * pw;
        p._ty = by + r * ph;
        pieces.push(p);
      }
    }

    // Раскладка кусочков в нижнем лотке в перемешанном порядке
    var trayTop = by + bh + 16;
    pieces.sort(function () { return Math.random() - 0.5; }).forEach(function (p, i) {
      var row = Math.floor(i / cols);
      var col = i % cols;
      var inRow = Math.min(cols, total - row * cols);
      var left = (W - (inRow * (pw + PAD) - PAD)) / 2 + col * (pw + PAD);
      p.style.left = left + 'px';
      p.style.top = (trayTop + row * (ph + PAD)) + 'px';
      st.appendChild(p);
      drag(p);
    });

    function drag(p) {
      var off = null;
      p.addEventListener('pointerdown', function (e) {
        if (p._lock) return;
        var rect = st.getBoundingClientRect();
        off = { x: e.clientX - rect.left - p.offsetLeft, y: e.clientY - rect.top - p.offsetTop };
        p.setPointerCapture(e.pointerId);
        p.style.zIndex = 6;
        e.preventDefault();
      });

      p.addEventListener('pointermove', function (e) {
        if (!off) return;
        var rect = st.getBoundingClientRect();
        p.style.left = Math.max(0, Math.min(W - pw, e.clientX - rect.left - off.x)) + 'px';
        p.style.top = Math.max(0, Math.min(H - ph, e.clientY - rect.top - off.y)) + 'px';
      });

      function up() {
        if (!off) return;
        off = null;
        p.style.zIndex = 5;
        var thr = Math.min(pw, ph) * 0.45;
        if (Math.abs(p.offsetLeft - p._tx) < thr && Math.abs(p.offsetTop - p._ty) < thr) {
          p.style.left = p._tx + 'px';
          p.style.top = p._ty + 'px';
          p._lock = true;
          p.classList.add('lock');
          p.style.boxShadow = 'none';
          p.style.cursor = 'default';
          p.style.borderRadius = '0';
          ctx.sfx.snap();
          if (++locked === total) done();
        }
      }
      p.addEventListener('pointerup', up);
      p.addEventListener('pointercancel', up);
    }

    function done() {
      ctx.sfx.ok();
      ctx.hud(T[1]);
      slots.forEach(function (s) { s.style.display = 'none'; });
      timers.push(setTimeout(function () {
        st.classList.remove('gm-dim');
      }, 700));

      timers.push(setTimeout(function () {
        if (dead) return;
        ctx.finish({
          print: {
            label: {
              RU: 'Распечатать картинку',
              EN: 'Print the picture',
              DE: 'Bild drucken'
            },
            html: '<div style="text-align:center"><img src="' + imgUrl + '" style="width:170mm;height:auto"></div>'
          }
        });
      }, 2500));
    }

    return {
      destroy: function () {
        dead = true;
        timers.forEach(clearTimeout);
      }
    };
  });
})();
