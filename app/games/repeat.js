/* «Повтори за мышонком»: метаморфоза цветов из Главы 19 сказки.
   «Осенило, окраснило, ожелтило, озеленило, окоричневило».
   Мышонок меняет цвет и позу при каждом звуке. */
(function () {
  'use strict';

  var COLORS = ['#3aa6d8', '#e0453a', '#f4c92a', '#4fae52', '#a9714b'];

  var MOUSE_FIGURES = [
    { file: 'img/Szene_19__ColourBLUE.webp', transform: 'translateY(-18px)' },
    { file: 'img/Szene_19__ColourRED.webp', transform: 'rotate(-12deg)' },
    { file: 'img/Szene_19__ColourYELLOW.webp', transform: 'scale(1.18)' },
    { file: 'img/Szene_19__ColourGreen.webp', transform: 'rotate(12deg)' },
    { file: 'img/Szene_19__ColourBROWN.webp', transform: 'translateY(-14px) scale(1.08)' }
  ];

  var LABEL = {
    RU: ['осенило', 'окраснило', 'ожелтило', 'озеленило', 'окоричневило'],
    EN: ['it dawned', 'went red', 'went yellow', 'went green', 'went brown'],
    DE: ['dämmerte', 'rot', 'gelb', 'grün', 'braun']
  };

  var TXT = {
    RU: ['Смотри…', 'Теперь ты!', 'Ещё разок — смотри'],
    EN: ['Watch…', 'Your turn!', 'Once more — watch'],
    DE: ['Schau…', 'Du bist dran!', 'Noch einmal – schau']
  };

  var LEVELS = 4;

  window.MousekinGames.register('repeat', function (ctx) {
    var st = ctx.stage;
    var sz = ctx.size();
    var W = sz.w;
    var H = sz.h;
    var L = ctx.lang || 'RU';
    var T = TXT[L] || TXT.RU;
    var LABELS = LABEL[L] || LABEL.RU;

    var timers = [];
    var dead = false;
    var seq = [];
    var level = 0;
    var pos = 0;
    var accept = false;

    st.classList.add('gm-dim');

    var fh = Math.max(90, Math.min(210, H * 0.28));
    var face = ctx.el('img', 'gm-face');
    face.src = ctx.assets + 'img/Szene_10__MouseFace.webp';
    face.alt = 'Мышонок';
    face.style.cssText = 'top:' + (Math.max(64, H * 0.1)) + 'px;height:' + fh + 'px;transition:transform .2s ease;';
    st.appendChild(face);

    var row = ctx.el('div', 'gm-pads');
    row.style.top = (Math.max(64, H * 0.1) + fh + 24) + 'px';

    var pads = COLORS.map(function (c, i) {
      var b = ctx.el('button', 'gm-pad', LABELS[i]);
      b.style.background = c;
      b.addEventListener('click', function () { press(i); });
      row.appendChild(b);
      return b;
    });
    st.appendChild(row);

    function setMousePose(i) {
      if (i >= 0 && i < MOUSE_FIGURES.length) {
        face.src = ctx.assets + MOUSE_FIGURES[i].file;
        face.style.transform = 'translateX(-50%) ' + MOUSE_FIGURES[i].transform;
      } else {
        face.src = ctx.assets + 'img/Szene_10__MouseFace.webp';
        face.style.transform = 'translateX(-50%)';
      }
    }

    function light(i, ms) {
      pads[i].classList.add('lit');
      setMousePose(i);
      ctx.sfx.note(i, 0.4);
      timers.push(setTimeout(function () {
        pads[i].classList.remove('lit');
        setMousePose(-1);
      }, ms || 450));
    }

    function show(msg) {
      accept = false;
      ctx.hud(msg);
      pos = 0;
      setMousePose(-1);

      seq.forEach(function (n, i) {
        timers.push(setTimeout(function () {
          if (!dead) light(n);
        }, 900 + i * 750));
      });

      timers.push(setTimeout(function () {
        if (dead) return;
        accept = true;
        ctx.hud(T[1]);
      }, 900 + seq.length * 750));
    }

    function press(i) {
      if (!accept || dead) return;
      light(i, 280);

      if (i !== seq[pos]) {
        accept = false;
        ctx.sfx.oops();
        timers.push(setTimeout(function () {
          show(T[2]);
        }, 900));
        return;
      }

      if (++pos < seq.length) return;

      accept = false;
      level++;
      if (level >= LEVELS) {
        timers.push(setTimeout(function () { ctx.sfx.ok(); }, 500));
        timers.push(setTimeout(function () {
          if (!dead) ctx.finish({ levels: level });
        }, 1500));
        return;
      }

      seq.push(Math.floor(Math.random() * COLORS.length));
      timers.push(setTimeout(function () { show(T[0]); }, 900));
    }

    seq = [Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)];
    show(T[0]);

    return {
      destroy: function () {
        dead = true;
        timers.forEach(clearTimeout);
      }
    };
  });
})();
