/* «Чат с персонажами»: 4 героя, готовые вопросы, ответы печатаются по буквам.
   Не больше трёх реплик героя; последняя заканчивается вопросом о реальности. Отвечать ребёнок будет вслух — родителю. */
(function () {
  'use strict';
  function P(ru, en) { return { RU: ru, EN: en }; }
  var CHARS = {
    mouse: { img: 'mouse_avatar.webp', name: P('Мышонок', 'Mouse'),
      greet: P('Привет! Я Мышонок. Еду на Времясипеде и смотрю, как тикают разные часы.', "Hi! I'm the Mouse. I ride my Timecycle and watch how all kinds of clocks tick."),
      real: P('А что ты сегодня видел на улице?', 'And what did you see outside today?'),
      qa: [
        { q: P('Что такое Времясипед?', 'What is a Timecycle?'), a: P('Это транспорт, который сам говорит: «садись на меня». Вместо звонка у него будильник!', 'A ride that says «hop on» all by itself. It has an alarm clock instead of a bell!') },
        { q: P('Тебе было страшно?', 'Were you scared?'), a: P('Сначала я удивился, потом стало любопытно. Любопытство — лучшее лекарство от страха.', 'First I was surprised, then curious. Curiosity is the best cure for fear.') },
        { q: P('Что ты думаешь про Улитку?', 'What do you think of the Snail?'), a: P('У неё шквал бумаг и цокающие каблуки. Она так старается, чтобы всё было идеально!', 'Storms of papers and clicking heels. She tries so hard to make everything perfect!') },
        { q: P('Что ты понял про время?', 'What did you learn about time?'), a: P('Что время у каждого своё. И жизни нужно, чтобы оно у каждого было настроено.', "That everybody's time is different. And life needs everyone's time to be tuned.") }] },
    snail: { img: 'snail_avatar.webp', name: P('Улитка', 'Snail'),
      greet: P('Я Профессионал Перфектности. Время у меня только перфектное. Говорите быстро!', 'I am a Professional of Perfection. My time is only perfect. Speak quickly!'),
      real: P('А ты бы хотел, чтобы всё было идеально? Почему?', 'Would you like everything to be perfect? Why?'),
      qa: [
        { q: P('Почему ты пьёшь кофе от Алентино?', "Why do you drink Alentino's coffee?"), a: P('Обычный кофе нецивилизован. У Алентино он перфектный.', "Ordinary coffee is uncivilised. Alentino's is perfect.") },
        { q: P('Тебе удобно на каблуках?', 'Are heels comfortable?'), a: P('Удобства — для любителей, а я Профессионал!', 'Comfort is for amateurs, and I am a Professional!') },
        { q: P('Что ты думаешь про Мышонка?', 'What do you think of the Mouse?'), a: P('Фыр! У него нецивилизованное время. Но стучится он вежливо — это засчитывается.', 'Hmph! His time is uncivilised. But he knocks politely, and that counts.') },
        { q: P('Что значит «вычистить слизь из времени»?', 'What does «cleaning the slime from your Time» mean?'), a: P('Убрать из часов всё лишнее: паузы, зевки, мечты. Остаётся чистый перфектный тик.', 'Removing everything extra: pauses, yawns, daydreams. Only a clean, perfect tick remains.') }] },
    archivist: { img: 'archivist_avatar.webp', name: P('Йозеф-архивариус', 'Archivist Josef'),
      greet: P('О, гость! Присаживайтесь. Я расскажу вам про Пыль Времён… а кстати, был один случай… так, о чём это я?', 'Oh, a guest! Sit down. Let me tell you about the Dust of Time… and by the way, there was this one time… now, what was I saying?'),
      real: P('А что ты помнишь из прошлого лета?', 'And what do you remember from last summer?'),
      qa: [
        { q: P('Что такое Пыль Времён?', 'What is the Dust of Time?'), a: P('То, что остаётся от часов, которые давно ходили. Приложите ухо — она шепчет. Кстати, у меня был случай…', 'What remains of clocks that ran long ago. Put your ear close and it whispers. By the way, once I had a case…') },
        { q: P('Кто был твой прошлый гость?', 'Who was your last guest?'), a: P('Ах, тот, что ждал возможности попрощаться четыре года! Я как раз рассказывал ему про каталог…', 'Ah, the one who waited four years to say goodbye! I was just telling him about the catalogue…') },
        { q: P('Что ты думаешь про Кота Мартина?', 'What about Cat Martin?'), a: P('Мартин? Дремлет, как всегда. Но если проснулся — слушайте внимательно.', 'Martin? Dozing, as always. But when he wakes up, listen closely.') },
        { q: P('Можно мне уже идти?', 'May I go now?'), a: P('Конечно-конечно! Только дослушайте… Шучу, идите. Хотя… ещё одна история!', "Of course, of course! Just hear this… I'm joking, go. Although… one more story!") }] },
    cat: { img: 'cat_avatar.webp', name: P('Кот Мартин', 'Cat Martin'),
      greet: P('Мурр… Я Мартин. Я не сплю. Я отдыхаю глазами.', "Purr… I'm Martin. I'm not sleeping. I'm resting my eyes."),
      real: P('А где ты любишь спать днём?', 'And where do you like to nap during the day?'),
      qa: [
        { q: P('Почему ты советуешь уйти по-английски?', 'Why do you advise leaving quietly?'), a: P('Мурр. Тихий уход — лучшее прощание. Прошлый гость этого не понял.', 'Purr. A quiet exit is the best goodbye. The last guest never understood.') },
        { q: P('Что ты думаешь про Архивариуса?', 'What about the Archivist?'), a: P('Мурр… *зевок* … Ему полезно высказаться.', "Purr… *yawn* … It's good for him to talk it out.") },
        { q: P('Тебе нравится пыль?', 'Do you like dust?'), a: P('Пыль — мягкая шубка для часов. Мурр.', 'Dust is a soft fur coat for clocks. Purr.') },
        { q: P('Что ты делаешь, когда не спишь?', 'What do you do when you are awake?'), a: P('Мурр. Придумываю, где бы поспать.', 'Purr. I think about where to sleep next.') }] }
  };
  window.MousekinGames.register('chat', function (ctx) {
    var L = ctx.lang === 'RU' ? 'RU' : 'EN', st = ctx.stage, base = new URL('../time_transport_game/assets/characters/', ctx.assets).href;
    var timers = [], dead = false, sel = null, replies = 0, typing = false, asked = {};
    st.classList.add('gm-dim');
    var panel = ctx.el('div', 'gm-panel'); st.appendChild(panel);
    panel.appendChild(ctx.el('h2', '', ctx.lang === 'RU' ? 'С кем поговорить?' : 'Who do you want to talk to?'));
    var row = ctx.el('div', 'gm-chars'), log = ctx.el('div', 'gm-log'), qs = ctx.el('div', 'gm-qs');
    panel.appendChild(row); panel.appendChild(log); panel.appendChild(qs);
    var btns = {};
    Object.keys(CHARS).forEach(function (id) {
      var b = ctx.el('button'), im = ctx.el('img'); im.src = base + CHARS[id].img; im.alt = CHARS[id].name[L]; b.title = CHARS[id].name[L]; b.appendChild(im);
      b.addEventListener('click', function () { if (!typing) choose(id); }); row.appendChild(b); btns[id] = b;
    });
    function bubble(text, me) { var d = ctx.el('div', 'gm-b' + (me ? ' me' : ''), text); log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
    function type(text, done) {
      typing = true; var d = bubble('', false), i = 0;
      (function step() { if (dead) return; d.textContent = text.slice(0, ++i); log.scrollTop = log.scrollHeight; if (i < text.length) timers.push(setTimeout(step, 24)); else { typing = false; done && done(); } })();
    }
    function choose(id) {
      sel = id; replies = 1; asked = {}; log.innerHTML = ''; qs.innerHTML = '';
      Object.keys(btns).forEach(function (k) { btns[k].classList.toggle('sel', k === id); });
      type(CHARS[id].greet[L], showQs);
    }
    function showQs() {
      qs.innerHTML = '';
      CHARS[sel].qa.forEach(function (x, i) {
        if (asked[i]) return; var b = ctx.el('button', '', x.q[L]);
        b.addEventListener('click', function () { if (typing) return; asked[i] = 1; qs.innerHTML = ''; bubble(x.q[L], true); replies++; ask(x); }); qs.appendChild(b);
      });
    }
    function ask(x) {
      var last = replies >= 3, txt = x.a[L] + (last ? ' ' + CHARS[sel].real[L] : '');
      type(txt, function () {
        if (!last) return showQs();
        timers.push(setTimeout(function () { if (!dead) ctx.finish({ chat: sel }); }, 2600));
      });
    }
    return { destroy: function () { dead = true; timers.forEach(clearTimeout); } };
  });
})();
