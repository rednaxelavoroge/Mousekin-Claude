/* «Город часов моей семьи»: игра на бумаге на весь период чтения. Экран только объясняет, как играть. */
(function () {
  'use strict';
  var C = {
    RU: { h: 'Город часов моей семьи', p: 'Это игра без экрана на всё время чтения книги.', need: 'Понадобятся: лист ватмана, цветные карандаши, наклейки, старые журналы для вырезания.',
      steps: ['После каждой главы создай одни часы для кого-то: из семьи, друзей или выдуманных героев.', 'Часы можно рисовать, вырезать, лепить.', 'Дай каждым часам имя и историю: «Часы бабушки тикают медленно, потому что бабушка любит пить чай и смотреть в окно».', 'В конце получится поляна часов: вся семья, все друзья и все выдуманные герои.'],
      who: 'Жители города: ты сам, мама, папа, бабушка, дедушка, брат, сестра, настоящий друг, воображаемый друг, герой любимой сказки.', ok: 'Понятно' },
    EN: { h: "My Family's Clock City", p: 'A screen-free game that lasts as long as you read the book.', need: 'You will need: a large sheet of paper, coloured pencils, stickers, old magazines to cut up.',
      steps: ['After each chapter, make one clock for someone: family, friends or imaginary heroes.', 'You can draw, cut out or model the clocks.', 'Give every clock a name and a story: «Grandma\'s clock ticks slowly, because Grandma loves to drink tea and look out of the window».', 'In the end you get a meadow of clocks: the whole family, all friends and all imaginary heroes.'],
      who: 'Citizens: you, Mum, Dad, Grandma, Grandpa, brother, sister, a real friend, an imaginary friend, a hero of a favourite tale.', ok: 'Got it' }
  };
  window.MousekinGames.register('family', function (ctx) {
    var c = C[ctx.lang === 'RU' ? 'RU' : 'EN'], st = ctx.stage;
    st.classList.add('gm-dim');
    var panel = ctx.el('div', 'gm-panel'), info = ctx.el('div', 'gm-info');
    panel.appendChild(ctx.el('h2', '', '🏙️ ' + c.h)); info.appendChild(ctx.el('p', '', c.p)); info.appendChild(ctx.el('p', '', c.need));
    var ul = ctx.el('ul'); c.steps.forEach(function (s) { ul.appendChild(ctx.el('li', '', s)); }); info.appendChild(ul); info.appendChild(ctx.el('p', '', c.who));
    panel.appendChild(info);
    var b = ctx.el('button', 'gm-big', c.ok); b.addEventListener('click', function () { ctx.finish({}); }); panel.appendChild(b);
    st.appendChild(panel);
    return {};
  });
})();
