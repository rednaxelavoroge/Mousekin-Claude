/* «Чат с персонажами»: 4 героя Города Часов, диалог с озвучкой уникальным тембром.
   Вопросы можно выбирать кнопками или писать в поле ввода.
   Заканчивается вопросом о реальности — ответ вслух родителям! */
(function () {
  'use strict';

  function P(ru, en, de) { return { RU: ru, EN: en, DE: de }; }

  var CHARS = {
    mouse: {
      img: 'mouse_avatar.webp',
      name: P('Мышонок', 'Mouse', 'Maus'),
      pitch: { min: 1400, max: 1800, type: 'sine' },
      greet: P(
        'Привет! Я Мышонок. Еду на Времясипеде и смотрю, как тикают разные часы.',
        "Hi! I'm the Mouse. I ride my Timecycle and watch how all kinds of clocks tick.",
        'Hallo! Ich bin die kleine Maus. Ich fahre auf dem Zeitrad und schaue, wie die Uhren ticken.'
      ),
      real: P(
        'А что ты сегодня видел на улице?',
        'And what did you see outside today?',
        'Und was hast du heute draußen gesehen?'
      ),
      qa: [
        {
          q: P('Что такое Времясипед?', 'What is a Timecycle?', 'Was ist ein Zeitrad?'),
          a: P('Это транспорт, который сам говорит: «садись на меня». Вместо звонка у него будильник!', 'A ride that says «hop on» all by itself. It has an alarm clock instead of a bell!', 'Ein Gefährt, das von selbst sagt: «Setz dich auf mich!». Statt einer Klingel hat es einen Wecker!')
        },
        {
          q: P('Тебе было страшно?', 'Were you scared?', 'Hattest du Angst?'),
          a: P('Сначала я удивился, потом стало любопытно. Любопытство — лучшее лекарство от страха.', 'First I was surprised, then curious. Curiosity is the best cure for fear.', 'Zuerst war ich überrascht, dann neugierig. Neugier ist die beste Medizin gegen Angst.')
        },
        {
          q: P('Что ты думаешь про Улитку?', 'What do you think of the Snail?', 'Was denkst du über die Schnecke?'),
          a: P('У неё шквал бумаг и цокающие каблуки. Она так старается, чтобы всё было идеально!', 'Storms of papers and clicking heels. She tries so hard to make everything perfect!', 'Bei ihr fliegen die Papiere und klackern die Absätze. Sie gibt sich so viel Mühe, dass alles perfekt ist!')
        },
        {
          q: P('Что ты понял про время?', 'What did you learn about time?', 'Was hast du über die Zeit verstanden?'),
          a: P('Что время у каждого своё. И жизни нужно, чтобы оно у каждого было настроено.', "That everybody's time is different. And life needs everyone's time to be tuned.", 'Dass jeder seine eigene Zeit hat. Und das Leben braucht es, dass sie bei jedem richtig eingestellt ist.')
        }
      ],
      custom: P(
        'Любопытный вопрос! В Городе Часов на всё есть своя стрелочка.',
        'Curious question! In Clocktown, everything has its own clock hand.',
        'Eine neugierige Frage! In der Uhrenstadt gibt es für alles einen Zeiger.'
      )
    },
    snail: {
      img: 'snail_avatar.webp',
      name: P('Улитка', 'Snail', 'Schnecke'),
      pitch: { min: 850, max: 1100, type: 'triangle' },
      greet: P(
        'Я Профессионал Перфектности. Время у меня только перфектное. Говорите быстро!',
        'I am a Professional of Perfection. My time is only perfect. Speak quickly!',
        'Ich bin die Perfektions-Expertin. Meine Zeit ist ausschließlich perfekt. Sprechen Sie zügig!'
      ),
      real: P(
        'А ты бы хотел, чтобы всё было идеально? Почему?',
        'Would you like everything to be perfect? Why?',
        'Möchtest du auch, dass alles perfekt ist? Warum?'
      ),
      qa: [
        {
          q: P('Почему ты пьёшь кофе от Алентино?', "Why do you drink Alentino's coffee?", "Warum trinkst du Alentinos Kaffee?"),
          a: P('Обычный кофе нецивилизован. У Алентино он перфектный.', "Ordinary coffee is uncivilised. Alentino's is perfect.", 'Gewöhnlicher Kaffee ist unzivilisiert. Bei Alentino ist er perfekt.')
        },
        {
          q: P('Тебе удобно на каблуках?', 'Are heels comfortable?', 'Ist es auf Absätzen bequem?'),
          a: P('Удобства — для любителей, а я Профессионал!', 'Comfort is for amateurs, and I am a Professional!', 'Bequemlichkeit ist für Amateure, ich bin eine Expertin!')
        },
        {
          q: P('Что ты думаешь про Мышонка?', 'What do you think of the Mouse?', 'Was hältst du von der Maus?'),
          a: P('Фыр! У него нецивилизованное время. Но стучится он вежливо — это засчитывается.', 'Hmph! His time is uncivilised. But he knocks politely, and that counts.', 'Pah! Seine Zeit ist unzivilisiert. Aber er klopft höflich an – das zählt.')
        },
        {
          q: P('Что значит «вычистить слизь из времени»?', 'What does «cleaning the slime from your Time» mean?', 'Was bedeutet «den Schleim aus der Zeit putzen»?'),
          a: P('Убрать из часов всё лишнее: паузы, зевки, мечты. Остаётся чистый перфектный тик.', 'Removing everything extra: pauses, yawns, daydreams. Only a clean, perfect tick remains.', 'Alles Überflüssige entfernen: Pausen, Gähnen, Träumereien. Nur das reine, perfekte Ticken bleibt.')
        }
      ],
      custom: P(
        'Хм! Это должно быть занесено в реестр перфектных дел.',
        'Hmm! This must be recorded in the register of perfect matters.',
        'Hm! Das muss in das Register der perfekten Angelegenheiten eingetragen werden.'
      )
    },
    archivist: {
      img: 'archivist_avatar.webp',
      name: P('Йозеф-архивариус', 'Archivist Josef', 'Archivar Josef'),
      pitch: { min: 260, max: 340, type: 'triangle' },
      greet: P(
        'О, гость! Присаживайтесь. Я расскажу вам про Пыль Времён… а кстати, был один случай… так, о чём это я?',
        'Oh, a guest! Sit down. Let me tell you about the Dust of Time… and by the way, there was this one time… now, what was I saying?',
        'Oh, ein Gast! Setzen Sie sich. Ich erzähle Ihnen vom Zeitstaub … übrigens gab es da mal einen Fall … worüber sprach ich gleich?'
      ),
      real: P(
        'А что ты помнишь из прошлого лета?',
        'And what do you remember from last summer?',
        'Woran erinnerst du dich aus dem letzten Sommer?'
      ),
      qa: [
        {
          q: P('Что такое Пыль Времён?', 'What is the Dust of Time?', 'Was ist der Zeitstaub?'),
          a: P('То, что остаётся от часов, которые давно ходили. Приложите ухо — она шепчет. Кстати, у меня был случай…', 'What remains of clocks that ran long ago. Put your ear close and it whispers. By the way, once I had a case…', 'Das, was von alten Uhren übrigbleibt. Halten Sie Ihr Ohr daran – er flüstert!')
        },
        {
          q: P('Кто был твой прошлый гость?', 'Who was your last guest?', 'Wer war dein letzter Gast?'),
          a: P('Ах, тот, что ждал возможности попрощаться четыре года! Я как раз рассказывал ему про каталог…', 'Ah, the one who waited four years to say goodbye! I was just telling him about the catalogue…', 'Ach, derjenige, der vier Jahre wartete, um sich zu verabschieden! Ich erzählte ihm gerade vom Katalog …')
        },
        {
          q: P('Что ты думаешь про Кота Мартина?', 'What about Cat Martin?', 'Was denkst du über Kater Martin?'),
          a: P('Мартин? Дремлет, как всегда. Но если проснулся — слушайте внимательно.', 'Martin? Dozing, as always. But when he wakes up, listen closely.', 'Martin? Er döst wie immer. Aber wenn er aufwacht – hören Sie genau zu.')
        },
        {
          q: P('Можно мне уже идти?', 'May I go now?', 'Darf ich schon gehen?'),
          a: P('Конечно-конечно! Только дослушайте… Шучу, идите. Хотя… ещё одна история!', "Of course, of course! Just hear this… I'm joking, go. Although… one more story!", 'Natürlich, natürlich! Nur noch diesen Satz … Spaß, gehen Sie nur. Wobei … eine Geschichte noch!')
        }
      ],
      custom: P(
        'О, об этом записано на тридцать второй полке каталога воспоминаний!',
        'Oh, that is written down on the thirty-second shelf of the memory catalogue!',
        'Oh, darüber steht etwas im zweiunddreißigsten Regal des Erinnerungskatalogs!'
      )
    },
    cat: {
      img: 'cat_avatar.webp',
      name: P('Кот Мартин', 'Cat Martin', 'Kater Martin'),
      pitch: { min: 140, max: 190, type: 'sine' },
      greet: P(
        'Мурр… Я Мартин. Я не сплю. Я отдыхаю глазами.',
        "Purr… I'm Martin. I'm not sleeping. I'm resting my eyes.",
        'Schnurr … Ich bin Martin. Ich schlafe nicht. Ich ruhe nur meine Augen aus.'
      ),
      real: P(
        'А где ты любишь спать днём?',
        'And where do you like to nap during the day?',
        'Und wo machst du tagsüber am liebsten ein Schläfchen?'
      ),
      qa: [
        {
          q: P('Почему ты советуешь уйти по-английски?', 'Why do you advise leaving quietly?', 'Warum rätst du, auf englische Art zu gehen?'),
          a: P('Мурр. Тихий уход — лучшее прощание. Прошлый гость этого не понял.', 'Purr. A quiet exit is the best goodbye. The last guest never understood.', 'Schnurr. Ein leiser Abschied ist der beste Abschied. Der letzte Gast hat das nicht kapiert.')
        },
        {
          q: P('Что ты думаешь про Архивариуса?', 'What about the Archivist?', 'Was denkst du über den Archivar?'),
          a: P('Мурр… *зевок* … Ему полезно высказаться.', "Purr… *yawn* … It's good for him to talk it out.", 'Schnurr … *gähn* … Es tut ihm gut, sich auszusprechen.')
        },
        {
          q: P('Тебе нравится пыль?', 'Do you like dust?', 'Magst du Staub?'),
          a: P('Пыль — мягкая шубка для часов. Мурр.', 'Dust is a soft fur coat for clocks. Purr.', 'Staub ist ein weiches Fellkleid für die Uhren. Schnurr.')
        },
        {
          q: P('Что ты делаешь, когда не спишь?', 'What do you do when you are awake?', 'Was machst du, wenn du nicht schläfst?'),
          a: P('Мурр. Придумываю, где бы поспать.', 'Purr. I think about where to sleep next.', 'Schnurr. Ich überlege mir, wo ich als Nächstes schlafen könnte.')
        }
      ],
      custom: P(
        'Мурр… Главное — не спешить со стрелками. Поспи лучше.',
        'Purr… The main thing is not to rush the clock hands. Better take a nap.',
        'Schnurr … Die Hauptsache ist, die Zeiger nicht zu hetzen. Schlaf lieber ein wenig.'
      )
    }
  };

  var UI_STRINGS = {
    RU: {
      title: 'С кем поговорить?',
      askPlaceholder: 'Напиши свой вопрос…',
      askBtn: 'Спросить',
      finishBtn: 'Мы ответили вслух — завершить разговор ✨'
    },
    EN: {
      title: 'Who do you want to talk to?',
      askPlaceholder: 'Type your question…',
      askBtn: 'Ask',
      finishBtn: 'We answered out loud — end conversation ✨'
    },
    DE: {
      title: 'Mit wem möchtest du sprechen?',
      askPlaceholder: 'Schreibe deine Frage …',
      askBtn: 'Fragen',
      finishBtn: 'Wir haben laut geantwortet – Gespräch beenden ✨'
    }
  };

  window.MousekinGames.register('chat', function (ctx) {
    var L = ctx.lang === 'DE' ? 'DE' : (ctx.lang === 'EN' ? 'EN' : 'RU');
    var UI = UI_STRINGS[L] || UI_STRINGS.RU;
    var st = ctx.stage;
    var base = new URL('../time_transport_game/assets/characters/', ctx.assets).href;
    var timers = [], dead = false, sel = null, replies = 0, typing = false, asked = {};

    st.classList.add('gm-dim');

    var panel = ctx.el('div', 'gm-panel');
    st.appendChild(panel);

    panel.appendChild(ctx.el('h2', '', UI.title));

    var charRow = ctx.el('div', 'gm-chars');
    var log = ctx.el('div', 'gm-log');
    var qs = ctx.el('div', 'gm-qs');

    // Поле ввода своего вопроса
    var inputRow = ctx.el('div', 'gm-input-row');
    var customInput = ctx.el('input', 'gm-input');
    customInput.type = 'text';
    customInput.placeholder = UI.askPlaceholder;

    var askBtn = ctx.el('button', 'gm-ask-btn', UI.askBtn);
    inputRow.appendChild(customInput);
    inputRow.appendChild(askBtn);

    panel.appendChild(charRow);
    panel.appendChild(log);
    panel.appendChild(qs);
    panel.appendChild(inputRow);

    var charItems = {};

    Object.keys(CHARS).forEach(function (id) {
      var charDef = CHARS[id];
      var charName = charDef.name[L] || charDef.name.RU;

      var item = ctx.el('div', 'gm-char-item');
      var b = ctx.el('button');
      var im = ctx.el('img');
      im.src = base + charDef.img;
      im.alt = charName;
      b.appendChild(im);
      b.title = charName;

      var label = ctx.el('span', 'gm-char-name', charName);
      item.appendChild(b);
      item.appendChild(label);

      item.addEventListener('click', function () {
        if (!typing) choose(id);
      });

      charRow.appendChild(item);
      charItems[id] = item;
    });

    function playVoiceNote(charDef) {
      if (!ctx.sfx) return;
      var p = charDef.pitch;
      var freq = p.min + Math.random() * (p.max - p.min);
      ctx.sfx.tone(freq, freq * (0.95 + Math.random() * 0.1), 0.04, 0.12, p.type);
    }

    function bubble(text, me) {
      var d = ctx.el('div', 'gm-b' + (me ? ' me' : ''), text);
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
      return d;
    }

    function type(text, done) {
      typing = true;
      var charDef = CHARS[sel];
      var d = bubble('', false);
      var i = 0;

      function step() {
        if (dead) return;
        d.textContent = text.slice(0, ++i);
        log.scrollTop = log.scrollHeight;
        if (i % 3 === 0) {
          playVoiceNote(charDef);
        }
        if (i < text.length) {
          timers.push(setTimeout(step, 24));
        } else {
          typing = false;
          done && done();
        }
      }
      step();
    }

    function choose(id) {
      sel = id;
      replies = 1;
      asked = {};
      log.innerHTML = '';
      qs.innerHTML = '';
      Object.keys(charItems).forEach(function (k) {
        charItems[k].classList.toggle('sel', k === id);
      });
      type(CHARS[id].greet[L] || CHARS[id].greet.RU, showQs);
    }

    function showQs() {
      qs.innerHTML = '';
      if (replies >= 3) {
        showFinishOption();
        return;
      }

      var charDef = CHARS[sel];
      charDef.qa.forEach(function (x, i) {
        if (asked[i]) return;
        var qText = x.q[L] || x.q.RU;
        var b = ctx.el('button', '', qText);
        b.addEventListener('click', function () {
          if (typing) return;
          asked[i] = 1;
          qs.innerHTML = '';
          bubble(qText, true);
          replies++;
          ask(x);
        });
        qs.appendChild(b);
      });
    }

    function ask(x) {
      var isLast = replies >= 3;
      var answerText = (x.a[L] || x.a.RU);
      if (isLast) {
        answerText += ' ' + (CHARS[sel].real[L] || CHARS[sel].real.RU);
      }
      type(answerText, function () {
        if (!isLast) {
          showQs();
        } else {
          showFinishOption();
        }
      });
    }

    function showFinishOption() {
      qs.innerHTML = '';
      inputRow.style.display = 'none';

      var finishBtn = ctx.el('button', 'gm-big', UI.finishBtn);
      finishBtn.style.marginTop = '14px';
      finishBtn.addEventListener('click', function () {
        if (!dead) ctx.finish({ chat: sel });
      });
      qs.appendChild(finishBtn);
    }

    function handleCustomQuestion() {
      var query = customInput.value.trim();
      if (!query || typing || !sel) return;
      customInput.value = '';
      bubble(query, true);
      replies++;
      qs.innerHTML = '';

      var isLast = replies >= 3;
      var charDef = CHARS[sel];
      var customAns = charDef.custom[L] || charDef.custom.RU;
      if (isLast) {
        customAns += ' ' + (charDef.real[L] || charDef.real.RU);
      }

      type(customAns, function () {
        if (!isLast) {
          showQs();
        } else {
          showFinishOption();
        }
      });
    }

    askBtn.addEventListener('click', handleCustomQuestion);
    customInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleCustomQuestion();
    });

    // По умолчанию выбираем Мышонка
    choose('mouse');

    return {
      destroy: function () {
        dead = true;
        timers.forEach(clearTimeout);
      }
    };
  });
})();
