/* «Раскрась мышонка»: настоящая картинка Мышонка из книги, сначала чёрно-белая.
   Ребёнок выбирает цвет метаморфозы и закрашивает.
   Цвет ложится строго внутри силуэта.
   Финал: Мышонок оживает и благодарит, доступен печатный шаблон. */
(function () {
  'use strict';

  var TXT = {
    RU: ['Раскрась ушки, хвостик и шубку Мышонка', 'Спасибо!', 'Раскрась Мышонка карандашами', 'Распечатать контур'],
    EN: ["Colour the Mouse's ears, tail, and coat", 'Thank you!', 'Colour the Mouse with pencils', 'Print the outline'],
    DE: ['Male die Ohren, den Schwanz und das Fell der Maus an', 'Danke!', 'Male die Maus mit Stiften an', 'Umriss drucken']
  };

  var PAL = [
    { c: '#3aa6d8', RU: 'Осенило (синий)', EN: 'Dawned (blue)', DE: 'Dämmerte (blau)' },
    { c: '#e0453a', RU: 'Окраснило (красный)', EN: 'Went red (red)', DE: 'Rot (rot)' },
    { c: '#f4c92a', RU: 'Ожелтило (жёлтый)', EN: 'Went yellow (yellow)', DE: 'Gelb (gelb)' },
    { c: '#4fae52', RU: 'Озеленило (зелёный)', EN: 'Went green (green)', DE: 'Grün (grün)' },
    { c: '#a9714b', RU: 'Окоричневило (коричневый)', EN: 'Went brown (brown)', DE: 'Braun (braun)' },
    { c: '#f08a2c', RU: 'Оранжевый', EN: 'Orange', DE: 'Orange' },
    { c: '#7a5bd0', RU: 'Фиолетовый', EN: 'Violet', DE: 'Violett' },
    { c: '#e86aa8', RU: 'Розовый', EN: 'Pink', DE: 'Rosa' }
  ];

  var AR = 876 / 1100, CW = 700, CH = Math.round(CW / AR), BRUSH = 60, DONE_AT = 0.45;

  function loadImg(src) {
    return new Promise(function (res, rej) {
      var i = new Image();
      i.onload = function () { res(i); };
      i.onerror = rej;
      i.src = src;
    });
  }

  window.MousekinGames.register('colormouse', function (ctx) {
    var L = ctx.lang || 'RU';
    var T = TXT[L] || TXT.RU;
    var st = ctx.stage, sz = ctx.size(), W = sz.w, H = sz.h;
    var color = PAL[0].c;
    var timers = [], dead = false, finished = false, drawing = false, last = null, maskReady = false;

    st.style.background = '#efe3cf';
    ctx.hud(T[0]);

    var top = 100, bottom = 96, availH = Math.max(120, H - top - bottom), availW = W - 24;
    var pw = Math.min(availW, availH * AR), ph = pw / AR, px = (W - pw) / 2, py = top + (availH - ph) / 2;

    var box = ctx.el('div', 'gm-paint');
    box.style.cssText = 'left:' + px + 'px;top:' + py + 'px;width:' + pw + 'px;height:' + ph + 'px';

    var base = ctx.el('img', 'gm-paint-base');
    base.alt = '';
    base.draggable = false;
    base.src = ctx.base + 'img/mouse_gray.webp';

    var cv = document.createElement('canvas');
    cv.className = 'gm-paint-cv';
    cv.width = CW;
    cv.height = CH;

    box.appendChild(base);
    box.appendChild(cv);
    st.appendChild(box);

    var g = cv.getContext('2d');

    // Маска силуэта: альфа-канал цветной картинки Мышонка
    var mask = document.createElement('canvas');
    mask.width = CW;
    mask.height = CH;
    var mg = mask.getContext('2d');

    loadImg(ctx.base + 'img/mouse_color.webp').then(function (im) {
      mg.drawImage(im, 0, 0, CW, CH);
      maskReady = true;
    }).catch(function () {});

    // Маленькие копии для проверки процента покрытия
    var SW = 120, SH = Math.round(SW / AR);
    var sm = document.createElement('canvas'); sm.width = SW; sm.height = SH;
    var sg = sm.getContext('2d', { willReadFrequently: true });
    var pm = document.createElement('canvas'); pm.width = SW; pm.height = SH;
    var pg = pm.getContext('2d', { willReadFrequently: true });
    var maskData = null;

    function coverage() {
      if (!maskReady) return 0;
      if (!maskData) {
        sg.clearRect(0, 0, SW, SH);
        sg.drawImage(mask, 0, 0, SW, SH);
        maskData = sg.getImageData(0, 0, SW, SH).data;
      }
      pg.clearRect(0, 0, SW, SH);
      pg.drawImage(cv, 0, 0, SW, SH);
      var pd = pg.getImageData(0, 0, SW, SH).data, inside = 0, painted = 0;
      for (var i = 3; i < maskData.length; i += 4) {
        if (maskData[i] > 128) {
          inside++;
          if (pd[i] > 60) painted++;
        }
      }
      return inside ? painted / inside : 0;
    }

    function clipToSilhouette() {
      if (!maskReady) return;
      g.save();
      g.globalCompositeOperation = 'destination-in';
      g.drawImage(mask, 0, 0);
      g.restore();
    }

    function pos(e) {
      var r = cv.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * CW / r.width,
        y: (e.clientY - r.top) * CH / r.height
      };
    }

    function dot(p) {
      g.save();
      g.globalAlpha = 0.9;
      g.fillStyle = color;
      g.beginPath();
      g.arc(p.x, p.y, BRUSH / 2, 0, 6.2832);
      g.fill();
      g.restore();
      clipToSilhouette();
    }

    cv.addEventListener('pointerdown', function (e) {
      if (finished) return;
      drawing = true;
      last = pos(e);
      cv.setPointerCapture(e.pointerId);
      e.preventDefault();
      dot(last);
    });

    cv.addEventListener('pointermove', function (e) {
      if (!drawing || finished) return;
      var p = pos(e);
      g.save();
      g.globalAlpha = 0.9;
      g.strokeStyle = color;
      g.lineWidth = BRUSH;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(last.x, last.y);
      g.lineTo(p.x, p.y);
      g.stroke();
      g.restore();
      last = p;
      clipToSilhouette();
    });

    function up() {
      if (!drawing) return;
      drawing = false;
      clipToSilhouette();
      check();
    }

    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    function check() {
      if (!finished && coverage() >= DONE_AT) finishPicture();
    }

    function finishPicture() {
      finished = true;
      ctx.hud(T[1]);
      ctx.sfx.ok();
      pal.style.display = 'none';
      box.classList.add('bye');
      timers.push(setTimeout(function () { ctx.sfx.squeak(); }, 700));
      timers.push(setTimeout(function () {
        if (dead) return;
        ctx.finish({
          print: {
            label: T[3],
            html: '<div style="text-align:center;font-family:sans-serif"><h2>' + T[2] + '</h2><img src="' + ctx.base + 'img/mouse_gray.webp" style="width:170mm;height:auto"></div>'
          }
        });
      }, 2600));
    }

    var pal = ctx.el('div', 'gm-palette');
    pal.style.bottom = '16px';

    PAL.forEach(function (item, i) {
      var itemTitle = item[L] || item.RU;
      var b = ctx.el('button', i === 0 ? 'sel' : '');
      b.style.background = item.c;
      b.setAttribute('aria-label', itemTitle);
      b.title = itemTitle;
      b.addEventListener('click', function () {
        color = item.c;
        [].forEach.call(pal.children, function (x) { x.classList.remove('sel'); });
        b.classList.add('sel');
        ctx.sfx.note(i, 0.15);
      });
      pal.appendChild(b);
    });
    st.appendChild(pal);

    return {
      destroy: function () {
        dead = true;
        timers.forEach(clearTimeout);
      }
    };
  });
})();
