/* «Создай свои часы»: 5 вопросов -> часы из заранее нарисованных деталей (форма, цвет, узор, цифры, фигурка на маятнике).
   Ничего не генерируется нейросетью: детали всегда в стиле книги. Часы сохраняются и попадают в «Посчитай часы». */
(function () {
  'use strict';

  var CH = ['mouse', 'snail', 'archivist', 'cat'];

  var Q = [
    {
      k: 'shape',
      q: { RU: 'Какой у тебя характер?', EN: 'What are you like?', DE: 'Wie ist dein Charakter?' },
      o: [
        { v: 'scallop', e: '😄', RU: 'Весёлый', EN: 'Cheerful', DE: 'Fröhlich', tempo: { RU: 'вприпрыжку', EN: 'in little hops', DE: 'hüpfend' }, w: { RU: 'весёлый', EN: 'cheerful', DE: 'fröhlich' } },
        { v: 'square', e: '😌', RU: 'Спокойный', EN: 'Calm', DE: 'Ruhig', tempo: { RU: 'не спеша', EN: 'slowly and calmly', DE: 'ganz in Ruhe' }, w: { RU: 'спокойный', EN: 'calm', DE: 'ruhig' } },
        { v: 'star', e: '🌙', RU: 'Загадочный', EN: 'Mysterious', DE: 'Geheimnisvoll', tempo: { RU: 'шёпотом', EN: 'in a whisper', DE: 'flüsternd' }, w: { RU: 'загадочный', EN: 'mysterious', DE: 'geheimnisvoll' } },
        { v: 'circle', e: '💛', RU: 'Добрый', EN: 'Kind', DE: 'Freundlich', tempo: { RU: 'тепло и мягко', EN: 'warm and soft', DE: 'warm und sanft' }, w: { RU: 'добрый', EN: 'kind', DE: 'freundlich' } }
      ]
    },
    {
      k: 'love',
      q: { RU: 'Что ты любишь больше всего?', EN: 'What do you love most?', DE: 'Was magst du am liebsten?' },
      o: [
        { v: '🌿', e: '🌿', RU: 'Природу', EN: 'Nature', DE: 'Die Natur', w: { RU: 'природу', EN: 'nature', DE: 'die Natur' } },
        { v: '🎵', e: '🎵', RU: 'Музыку', EN: 'Music', DE: 'Musik', w: { RU: 'музыку', EN: 'music', DE: 'Musik' } },
        { v: '⭐', e: '⭐', RU: 'Приключения', EN: 'Adventures', DE: 'Abenteuer', w: { RU: 'приключения', EN: 'adventures', DE: 'Abenteuer' } },
        { v: '🕊️', e: '🕊️', RU: 'Тишину', EN: 'Quiet', DE: 'Die Stille', w: { RU: 'тишину', EN: 'quiet', DE: 'die Stille' } }
      ]
    },
    {
      k: 'color',
      q: { RU: 'Какого цвета твоё настроение?', EN: 'What colour is your mood?', DE: 'Welche Farbe hat deine Stimmung?' },
      c: ['#f4c92a', '#f08a2c', '#e0453a', '#e86aa8', '#7a5bd0', '#3aa6d8', '#4fae52', '#a9714b']
    },
    {
      k: 'tod',
      q: { RU: 'Какое время тебе нравится?', EN: 'Which time of day do you like?', DE: 'Welche Tageszeit magst du?' },
      o: [
        { v: 'all', e: '🌅', RU: 'Утро', EN: 'Morning', DE: 'Morgen', w: { RU: 'утро', EN: 'morning', DE: 'den Morgen' } },
        { v: 'quarters', e: '☀️', RU: 'День', EN: 'Day', DE: 'Tag', w: { RU: 'день', EN: 'daytime', DE: 'den Tag' } },
        { v: 'dots', e: '🌇', RU: 'Вечер', EN: 'Evening', DE: 'Abend', w: { RU: 'вечер', EN: 'evening', DE: 'den Abend' } },
        { v: 'stars', e: '🌙', RU: 'Ночь', EN: 'Night', DE: 'Nacht', w: { RU: 'ночь', EN: 'night', DE: 'die Nacht' } }
      ]
    },
    {
      k: 'friend',
      q: { RU: 'Кто твой друг из книги?', EN: 'Who is your friend from the book?', DE: 'Wer ist dein Freund aus dem Buch?' },
      o: [
        { v: 'mouse', e: '🐭', RU: 'Мышонок', EN: 'the Mouse', DE: 'Die Maus', w: { RU: 'Мышонок', EN: 'the Mouse', DE: 'die kleine Maus' } },
        { v: 'snail', e: '🐌', RU: 'Улитка', EN: 'the Snail', DE: 'Die Schnecke', w: { RU: 'Улитка', EN: 'the Snail', DE: 'die Schnecke' } },
        { v: 'archivist', e: '📚', RU: 'Архивариус', EN: 'the Archivist', DE: 'Der Archivar', w: { RU: 'Архивариус', EN: 'the Archivist', DE: 'der Archivar' } },
        { v: 'cat', e: '🐱', RU: 'Кот Мартин', EN: 'Cat Martin', DE: 'Kater Martin', w: { RU: 'Кот Мартин', EN: 'Cat Martin', DE: 'Kater Martin' } }
      ]
    }
  ];

  var FRIEND_EMOJI = { mouse: '🐭', snail: '🐌', archivist: '📚', cat: '🐱' };
  var EMO = 'font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" text-anchor="middle" dominant-baseline="central"';

  function outer(shape) {
    var pts = [], i, a, r;
    if (shape === 'circle') return '<circle cx="150" cy="146" r="122"/>';
    if (shape === 'square') return '<rect x="38" y="34" width="224" height="224" rx="52"/>';
    if (shape === 'scallop') {
      for (i = 0; i < 120; i++) {
        a = i / 120 * 6.2832;
        r = 118 + 7 * Math.cos(12 * a);
        pts.push((150 + r * Math.sin(a)).toFixed(1) + ',' + (146 - r * Math.cos(a)).toFixed(1));
      }
    } else {
      for (i = 0; i < 16; i++) {
        a = i / 16 * 6.2832;
        r = i % 2 ? 114 : 130;
        pts.push((150 + r * Math.sin(a)).toFixed(1) + ',' + (146 - r * Math.cos(a)).toFixed(1));
      }
    }
    return '<polygon points="' + pts.join(' ') + '"/>';
  }

  function clockSVG(p, friendSrc, blank) {
    var D = '#2a2320';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380"><style>.mh{transform-origin:150px 146px;animation:gs 60s linear infinite}.hh{transform-origin:150px 146px;animation:gs 720s linear infinite}.pd{transform-origin:150px 268px;animation:gw 2.4s ease-in-out infinite alternate}@keyframes gs{to{transform:rotate(360deg)}}@keyframes gw{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}</style>';
    s += '<g class="pd"><line x1="150" y1="262" x2="150" y2="306" stroke="' + D + '" stroke-width="4"/><circle cx="150" cy="338" r="36" fill="#fffaf0" stroke="' + D + '" stroke-width="4"/>';
    s += friendSrc ? '<image href="' + friendSrc + '" x="120" y="308" width="60" height="60" preserveAspectRatio="xMidYMid meet"/>' : '<text x="150" y="340" font-size="40" ' + EMO + '>' + FRIEND_EMOJI[p.friend] + '</text>';
    s += '</g><g fill="' + (blank ? '#fff' : p.color) + '" stroke="' + D + '" stroke-width="6" stroke-linejoin="round">' + outer(p.shape) + '</g>';
    s += '<circle cx="150" cy="146" r="86" fill="#fffaf0" stroke="' + D + '" stroke-width="3"/>';
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * 6.2832;
      s += '<text x="' + (150 + 101 * Math.sin(a)).toFixed(1) + '" y="' + (146 - 101 * Math.cos(a)).toFixed(1) + '" font-size="15" ' + EMO + '>' + p.love + '</text>';
    }
    for (i = 0; i < 12; i++) {
      a = i / 12 * 6.2832;
      var x = (150 + 64 * Math.sin(a)).toFixed(1), y = (146 - 64 * Math.cos(a)).toFixed(1), n = i === 0 ? 12 : i;
      if (p.tod === 'all') s += '<text x="' + x + '" y="' + y + '" font-size="15" font-family="system-ui,sans-serif" font-weight="700" fill="' + D + '" text-anchor="middle" dominant-baseline="central">' + n + '</text>';
      else if (p.tod === 'quarters') { if (i % 3 === 0) s += '<text x="' + x + '" y="' + y + '" font-size="22" font-family="system-ui,sans-serif" font-weight="800" fill="' + D + '" text-anchor="middle" dominant-baseline="central">' + n + '</text>'; }
      else if (p.tod === 'dots') s += '<circle cx="' + x + '" cy="' + y + '" r="' + (i % 3 === 0 ? 5 : 3) + '" fill="' + D + '"/>';
      else s += '<text x="' + x + '" y="' + y + '" font-size="' + (i % 3 === 0 ? 17 : 12) + '" fill="' + D + '" text-anchor="middle" dominant-baseline="central">★</text>';
    }
    s += '<g transform="rotate(100 150 146)"><g class="hh"><line x1="150" y1="146" x2="150" y2="106" stroke="' + D + '" stroke-width="8" stroke-linecap="round"/></g></g>';
    s += '<g transform="rotate(20 150 146)"><g class="mh"><line x1="150" y1="146" x2="150" y2="86" stroke="' + D + '" stroke-width="5" stroke-linecap="round"/></g></g><circle cx="150" cy="146" r="7" fill="' + D + '"/></svg>';
    return s;
  }

  function find(k, v) {
    var q = Q.filter(function (x) { return x.k === k; })[0];
    return (q.o || []).filter(function (o) { return o.v === v; })[0];
  }

  window.MousekinGames.register('createclock', function (ctx) {
    var st = ctx.stage;
    var L = ctx.lang === 'DE' ? 'DE' : (ctx.lang === 'EN' ? 'EN' : 'RU');
    var ans = {}, step = 0, dead = false;
    var chars = new URL('../time_transport_game/assets/characters/', ctx.assets).href;

    st.classList.add('gm-dim');
    var panel = ctx.el('div', 'gm-panel');
    st.appendChild(panel);

    function ask() {
      panel.innerHTML = '';
      var q = Q[step];
      ctx.hud((step + 1) + ' / ' + Q.length);
      var box = ctx.el('div', 'gm-q');
      box.appendChild(ctx.el('h3', '', q.q[L] || q.q.RU));
      var row = ctx.el('div', 'gm-opt');

      if (q.c) {
        q.c.forEach(function (c) {
          var b = ctx.el('button', 'col');
          b.style.background = c;
          b.setAttribute('aria-label', c);
          b.addEventListener('click', function () { pick(c); });
          row.appendChild(b);
        });
      } else {
        q.o.forEach(function (o) {
          var b = ctx.el('button');
          b.appendChild(ctx.el('b', '', o.e));
          b.appendChild(ctx.el('span', '', o[L] || o.RU));
          b.addEventListener('click', function () { pick(o.v); });
          row.appendChild(b);
        });
      }
      box.appendChild(row);
      panel.appendChild(box);
    }

    function pick(v) {
      ctx.sfx.snap();
      ans[Q[step].k] = v;
      step++;
      if (step < Q.length) ask();
      else result();
    }

    function result() {
      if (dead) return;
      var p = ans;
      var ch = find('shape', p.shape);
      var lv = find('love', p.love);
      var td = find('tod', p.tod);
      var fr = find('friend', p.friend);

      var friendSrc = chars + p.friend + '_avatar.webp';

      try {
        localStorage.setItem('mousekin_myclock_v1', JSON.stringify({
          svg: clockSVG(p, friendSrc, false),
          p: p,
          t: Date.now()
        }));
      } catch (e) {}

      panel.innerHTML = '';
      var hudText = L === 'RU' ? 'Твои часы' : (L === 'DE' ? 'Deine Uhr' : 'Your clock');
      ctx.hud(hudText);
      ctx.sfx.ok();

      var w = ctx.el('div', 'gm-clockwrap');
      w.innerHTML = clockSVG(p, friendSrc, false);
      panel.appendChild(w);

      var story = L === 'RU'
        ? 'Это твои часы. Они тикают ' + ch.tempo.RU + ', потому что ты ' + ch.w.RU + '. Вокруг циферблата — ' + p.love + ', потому что ты любишь ' + lv.w.RU + '. Их любимое время — ' + td.w.RU + ', а на маятнике качается ' + fr.w.RU + ': он всегда рядом.'
        : (L === 'DE'
          ? 'Das ist deine Uhr. Sie tickt ' + ch.tempo.DE + ', weil du ' + ch.w.DE + ' bist. Um das Zifferblatt herum ist ' + p.love + ', weil du ' + lv.w.DE + ' liebst. Ihre Lieblingszeit ist ' + td.w.DE + ', und am Pendel schwingt ' + fr.w.DE + ': immer an deiner Seite.'
          : 'This is your clock. It ticks ' + ch.tempo.EN + ', because you are ' + ch.w.EN + '. Around the dial there is ' + p.love + ', because you love ' + lv.w.EN + '. Its favourite time is ' + td.w.EN + ', and ' + fr.w.EN + ' swings on the pendulum: always close by.');

      panel.appendChild(ctx.el('p', 'gm-story', story));

      var b = ctx.el('button', 'gm-big', L === 'RU' ? 'Готово' : (L === 'DE' ? 'Fertig' : 'Done'));
      b.addEventListener('click', function () {
        ctx.finish({
          print: {
            label: {
              RU: 'Распечатать шаблон часов',
              EN: 'Print a clock template',
              DE: 'Uhrenvorlage drucken'
            },
            html: '<div style="text-align:center;font-family:sans-serif"><h1>' +
              (L === 'RU' ? 'Мои часы: раскрась и вырежи' : (L === 'DE' ? 'Meine Uhr: anmalen und ausschneiden' : 'My clock: colour and cut out')) +
              '</h1><div style="max-width:150mm;margin:0 auto">' + clockSVG(p, null, true) + '</div></div>'
          }
        });
      });
      panel.appendChild(b);
    }

    ask();

    return {
      destroy: function () { dead = true; }
    };
  });
})();
