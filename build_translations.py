import os, re

BASE_URL = 'https://mousekin-story.vercel.app'

def make_absolute_assets(content):
    # Fix relative asset links
    content = re.sub(r'href=([\"\'])css\/', r'href=\1/css/', content)
    content = re.sub(r'src=([\"\'])js\/', r'src=\1/js/', content)
    content = re.sub(r'src=([\"\'])images\/', r'src=\1/images/', content)
    content = re.sub(r'data-original=([\"\'])images\/', r'data-original=\1/images/', content)
    content = re.sub(r'data-content-cover-bg=([\"\'])images\/', r'data-content-cover-bg=\1/images/', content)
    content = re.sub(r'url\(([\"\']?)images\/', r'url(\1/images/', content)
    return content

def apply_replacements(content, rep_list):
    for pat, rep in rep_list:
        content = re.sub(pat, rep, content)
    return content

# 1. Main Page Translations
INDEX_EN = [
    (r'<title>[^<]*<\/title>', '<title>The Little Mouse in Clocktown — Interactive Musical Picture Book</title>'),
    (r'content=\"Там, где заводится время[^\"]*\"', 'content=\"The Little Mouse in Clocktown — Interactive Musical Picture Book\"'),
    (r'<div style=\"font-size:82px;\"[^>]*><strong>Там, где заводится Время<\/strong><\/div>', '<div style=\"font-size:72px;\" data-customstyle=\"yes\"><strong>The Little Mouse in Clocktown</strong></div>'),
    (r'Интерактивное путешествие Мышонка в&nbsp;мир удивительных часов, где он&nbsp;знакомится с&nbsp;его необыкновенными жителями и&nbsp;узнает, где заводится Время',
     'An interactive journey of the Little Mouse into the world of incredible clocks, where he meets extraordinary inhabitants and discovers where Time begins.'),
    (r'Как-то Мышонок открыл глаза и&nbsp;удивился\. Едва он&nbsp;успевал моргнуть, как одно время года сменяло другое\. Тогда-то он&nbsp;и&nbsp;решил отправиться в&nbsp;путь\.\.\.',
     'One day, the Little Mouse opened his eyes and was amazed. Barely had he blinked when one season was replaced by another. That\'s when he decided to embark on a grand journey...'),
    (r'Герои, которых вы&nbsp;еще нигде не&nbsp;встречали', 'Characters you\'ve never met before'),
    (r'Часы, которых Вы&nbsp;еще нигде не&nbsp;видели', 'Clocks you\'ve never seen before'),
    (r'История, которую Вы&nbsp;еще никогда не&nbsp;слышали', 'A story you\'ve never heard before'),
    (r'Русский, английский, немецкий языки', 'English, Russian, and German narration'),
    (r'Текст автора читает популярный российский актёр[^\.]*\.', 'Narrated by professional studio voice actors and theater performers.'),
    (r'Более 20 интерактивных сцен', 'Over 20 interactive animated scenes'),
    (r'Оригинальный саундтрек', 'Original musical soundtrack'),
    (r'Игры, домашний аудиотеатр', 'Interactive games & living audio theatre'),
    (r'Анимация, звуковые эффекты', 'Hand-crafted animations and lively sound effects'),
    (r'Интерактивная притча-путешествие', 'Interactive parable-journey'),
    (r'трэйлер', 'trailer'),
    (r'Мы не тратим деньги на рекламу, но нас рекомендуют друзья !', 'We don\'t spend money on advertising, but friends recommend us!'),
    (r'Погрузитесь в сказку прямо сейчас', 'Dive into the fairy tale right now'),
    (r'Читайте на компьютере в браузере или установите как приложение на рабочий стол смартфона \(iOS и Android\)',
     'Read on desktop browser or install as an app on your smartphone home screen (iOS & Android)'),
    (r'Открыть в браузере', 'Open in Browser'),
    (r'Установить PWA', 'Install PWA'),
    (r'✨ Полная версия · 3 языка озвучки · 100% бесплатно', '✨ Full Version · 3 Narration Languages · 100% Free'),
    (r'Читать онлайн \(PWA\)', 'Read Online (PWA)'),
    (r'Установить на телефон', 'Install on Phone'),
    (r'🎧 Озвучка: RU · EN · DE', '🎧 Narration: EN · RU · DE'),
    (r'✨ 22 интерактивные сцены', '✨ 22 Interactive Scenes'),
    (r'📲 Работает офлайн', '📲 Works Offline'),
    (r'🚫 Без рекламы', '🚫 No Ads'),
    (r'href=\"/app/\?lang=ru\"', 'href=\"/app/?lang=en\"'),
    (r'href=\"/app/\"', 'href=\"/app/?lang=en\"')
]

INDEX_DE = [
    (r'<title>[^<]*<\/title>', '<title>Wo die Zeit entsteht — Die kleine Maus in Uhrenstadt</title>'),
    (r'content=\"Там, где заводится время[^\"]*\"', 'content=\"Wo die Zeit entsteht — Die kleine Maus in Uhrenstadt\"'),
    (r'<div style=\"font-size:82px;\"[^>]*><strong>Там, где заводится Время<\/strong><\/div>', '<div style=\"font-size:72px;\" data-customstyle=\"yes\"><strong>Wo die Zeit entsteht</strong></div>'),
    (r'Интерактивное путешествие Мышонка в&nbsp;мир удивительных часов, где он&nbsp;знакомится с&nbsp;его необыкновенными жителями и&nbsp;узнает, где заводится Время',
     'Eine interaktive Reise der kleinen Maus in die Welt der wundersamen Uhren, wo sie die außergewöhnlichen Bewohner kennenlernt und erfährt, wie die Zeit entsteht.'),
    (r'Как-то Мышонок открыл глаза и&nbsp;удивился\. Едва он&nbsp;успевал моргнуть, как одно время года сменяло другое\. Тогда-то он&nbsp;и&nbsp;решил отправиться в&nbsp;путь\.\.\.',
     'Eines Tages öffnete die kleine Maus ihre Augen und staunte. Kaum hatte sie geblinzelt, wechselte eine Jahreszeit die andere ab. Da beschloss sie, sich auf eine abenteuerliche Reise zu begeben...'),
    (r'Герои, которых вы&nbsp;еще нигде не&nbsp;встречали', 'Helden, die Sie noch nie getroffen haben'),
    (r'Часы, которых Вы&nbsp;еще нигде не&nbsp;видели', 'Uhren, die Sie noch nie gesehen haben'),
    (r'История, которую Вы&nbsp;еще никогда не&nbsp;слышали', 'Eine Geschichte, die Sie noch nie zuvor gehört haben'),
    (r'Русский, английский, немецкий языки', 'Deutsche, englische und russische Vertonung'),
    (r'Текст автора читает популярный российский актёр[^\.]*\.', 'Erzählt von professionellen Theaterschauspielern und Hörbuchsprechern.'),
    (r'Более 20 интерактивных сцен', 'Über 20 interaktive animierte Szenen'),
    (r'Оригинальный саундтрек', 'Originaler Soundtrack und Musik'),
    (r'Игры, домашний аудиотеатр', 'Interaktive Spiele & lebendiges Hörtheater'),
    (r'Анимация, звуковые эффекты', 'Liebevolle Animationen und Klangeffekte'),
    (r'Интерактивная притча-путешествие', 'Interaktives Parabel-Abenteuer'),
    (r'трэйлер', 'Trailer'),
    (r'Мы не тратим деньги на рекламу, но нас рекомендуют друзья !', 'Wir geben kein Geld für Werbung aus, aber Freunde empfehlen uns!'),
    (r'Погрузитесь в сказку прямо сейчас', 'Tauchen Sie jetzt in das Märchen ein'),
    (r'Читайте на компьютере в браузере или установите как приложение на рабочий стол смартфона \(iOS и Android\)',
     'Im Browser am Computer lesen oder als App auf den Startbildschirm des Smartphones installieren (iOS & Android)'),
    (r'Открыть в браузере', 'Im Browser öffnen'),
    (r'Установить PWA', 'PWA installieren'),
    (r'✨ Полная версия · 3 языка озвучки · 100% бесплатно', '✨ Vollversion · 3 Sprachen · 100% kostenlos'),
    (r'Читать онлайн \(PWA\)', 'Online lesen (PWA)'),
    (r'Установить на телефон', 'Auf Smartphone installieren'),
    (r'🎧 Озвучка: RU · EN · DE', '🎧 Vertonung: DE · RU · EN'),
    (r'✨ 22 интерактивные сцены', '✨ 22 interaktive Szenen'),
    (r'📲 Работает офлайн', '📲 Funktioniert offline'),
    (r'🚫 Без рекламы', '🚫 Keine Werbung'),
    (r'href=\"/app/\?lang=ru\"', 'href=\"/app/?lang=de\"'),
    (r'href=\"/app/\"', 'href=\"/app/?lang=de\"')
]

# 2. Heroes Translations
HEROES_EN = [
    (r'<title>[^<]*<\/title>', '<title>Heroes of Clocktown — The Little Mouse Story</title>'),
    (r'content=\"Мышонок и необыкновенные жители[^\"]*\"', 'content=\"The Little Mouse and the extraordinary inhabitants of Clocktown.\"'),
    (r'Мышонок и необыкновенные жители', 'The Little Mouse and Extraordinary Inhabitants'),
    (r'«Я&nbsp;живу в&nbsp;центре мира на&nbsp;одной не&nbsp;очень большой планете и&nbsp;чувствую себя совершенно особенным!»',
     '“I live in the center of the world on a not-so-big planet, and I feel completely special!”'),
    (r'путешественник по&nbsp;разным мирам', 'traveler across different worlds'),
    (r'извлекать особенное из&nbsp;самых, казалось&nbsp;бы, неособенных вещах', 'to discover the extraordinary in the most seemingly ordinary things'),
    (r'коренной житель одной маленькой планеты', 'native inhabitant of a small planet'),
    (r'вышивает крестиком, коллекционирует бегемотиков,', 'cross-stitching, collecting miniature hippos,'),
    (r'«В&nbsp;настоящем ничего не&nbsp;происходит значимого, все оно уже произошло в&nbsp;прошлом!»',
     '“Nothing truly meaningful happens in the present — everything has already happened in the past!”'),
    (r'Йозеф Архивариус', 'Joseph the Archivist'),
    (r'вернуться в&nbsp;прошлое и&nbsp;совершить много подвигов, например спасти принцессу Тойу', 'to return to the past and accomplish legendary deeds, such as rescuing Princess Toya'),
    (r'планета Архивариуса', 'Archivist\'s Planet'),
    (r'кормит рыбок в&nbsp;офисном фонтане, собирает открытки сельских местностей с&nbsp;гусями', 'feeds goldfish in the office fountain, collects postcards of countryside geese'),
    (r'«Удобства для любителей, а я&nbsp;— профессионал!»', '“Comfort is for amateurs — I am a professional!”'),
    (r'Перфектная Улитка', 'Matilda the Perfect Snail'),
    (r'продавать перфектное время', 'selling perfect time'),
    (r'избавить мир от&nbsp;бессмысленности', 'to rid the world of meaninglessness'),
    (r'мир бегущего времени', 'World of Running Time'),
    (r'собирать куски металлов и&nbsp;текстиля из&nbsp;потаенных мест невиданных миров', 'gathering rare metal and textile fragments from hidden realms of unseen worlds'),
    (r'«Хорошо там, где есть я!»', '“Happiness is wherever I am!”'),
    (r'Кот Мартин', 'Martin the Cat'),
    (r'писать мемуары и&nbsp;обучать Архивариуса кошачьим языкам и&nbsp;диалектам и&nbsp;фотографировать',
     'writing memoirs, teaching the Archivist feline dialects, and taking photographs'),
    (r'объединить всех котов в&nbsp;тайное вегетарианское общество', 'to unite all cats into a secret vegetarian society'),
    (r'доисторический', 'prehistoric'),
    (r'изучать различные диалекты кошачьи языков и&nbsp;вязать на&nbsp;спицах', 'studying feline dialects and knitting with wool needles'),
    (r'Главная цель:', 'Main Goal:'),
    (r'Призвание/профессия:', 'Vocation/Profession:'),
    (r'Происхождение:', 'Origin:'),
    (r'Хобби:', 'Hobbies:')
]

HEROES_DE = [
    (r'<title>[^<]*<\/title>', '<title>Die Helden von Uhrenstadt — Wo die Zeit entsteht</title>'),
    (r'content=\"Мышонок и необыкновенные жители[^\"]*\"', 'content=\"Die kleine Maus und die außergewöhnlichen Bewohner von Uhrenstadt.\"'),
    (r'Мышонок и необыкновенные жители', 'Die kleine Maus und die außergewöhnlichen Bewohner'),
    (r'«Я&nbsp;живу в&nbsp;центре мира на&nbsp;одной не&nbsp;очень большой планете и&nbsp;чувствую себя совершенно особенным!»',
     '„Ich lebe im Zentrum der Welt auf einem nicht allzu großen Planeten und fühle mich ganz besonders!“'),
    (r'путешественник по&nbsp;разным мирам', 'Reisender durch verschiedene Welten'),
    (r'извлекать особенное из&nbsp;самых, казалось&nbsp;бы, неособенных вещах', 'das Besondere aus den scheinbar gewöhnlichsten Dingen hervorzubringen'),
    (r'коренной житель одной маленькой планеты', 'Ureinwohner eines kleinen Planeten'),
    (r'вышивает крестиком, коллекционирует бегемотиков,', 'Stickt im Kreuzstich, sammelt kleine Flusspferdfiguren,'),
    (r'«В&nbsp;настоящем ничего не&nbsp;происходит значимого, все оно уже произошло в&nbsp;прошлом!»',
     '„In der Gegenwart geschieht nichts Bedeutendes — alles ist bereits in der Vergangenheit geschehen!“'),
    (r'Йозеф Архивариус', 'Josef der Archivar'),
    (r'вернуться в&nbsp;прошлое и&nbsp;совершить много подвигов, например спасти принцессу Тойу', 'in die Vergangenheit zurückzukehren und Heldentaten zu vollbringen, wie die Rettung von Prinzessin Toya'),
    (r'планета Архивариуса', 'Planet des Archivars'),
    (r'кормит рыбок в&nbsp;офисном фонтане, собирает открытки сельских местностей с&nbsp;гусями', 'füttert Fische im Brunnen, sammelt ländliche Postkarten mit Gänsen'),
    (r'«Удобства для любителей, а я&nbsp;— профессионал!»', '„Bequemlichkeit ist für Amateure — ich bin ein Profi!“'),
    (r'Перфектная Улитка', 'Mathilda die Perfekte Schnecke'),
    (r'продавать перфектное время', 'vollkommene Zeit verkaufen'),
    (r'избавить мир от&nbsp;бессмысленности', 'die Welt von der Sinnlosigkeit befreien'),
    (r'мир бегущего времени', 'Welt der rasenden Zeit'),
    (r'собирать куски металлов и&nbsp;текстиля из&nbsp;потаенных мест невиданных миров', 'Metalle und Textilien aus verborgenen Orten unerforschter Welten sammeln'),
    (r'«Хорошо там, где есть я!»', '„Gut ist es dort, wo ich bin!“'),
    (r'Кот Мартин', 'Kater Martin'),
    (r'писать мемуары и&nbsp;обучать Архивариуса кошачьим языкам и&nbsp;диалектам и&nbsp;фотографировать',
     'Memoiren schreiben, dem Archivar Katzensprachen beibringen und fotografieren'),
    (r'объединить всех котов в&nbsp;тайное вегетарианское общество', 'alle Katzen in einer geheimen vegetarischen Gesellschaft vereinen'),
    (r'доисторический', 'prähistorisch'),
    (r'изучать различные диалекты кошачьи языков и&nbsp;вязать на&nbsp;спицах', 'verschiedene Katzendialekte erforschen und mit Stricknadeln stricken'),
    (r'Главная цель:', 'Hauptziel:'),
    (r'Призвание/профессия:', 'Berufung/Beruf:'),
    (r'Происхождение:', 'Herkunft:'),
    (r'Хобби:', 'Hobbys:')
]

# 3. About Project Translations
ABOUT_EN = [
    (r'<title>[^<]*<\/title>', '<title>About Project — Honey of Milky Way</title>'),
    (r'О проекте \"Мед млечного пути\"', 'About Project \"Milky Way Honey\"'),
    (r'МЕД МЛЕЧНОГО ПУТИ', 'MILKY WAY HONEY'),
    (r'«МЕД МЛЕЧНОГО ПУТИ»&nbsp;— самое ценное во&nbsp;Вселенной\.', '“MILKY WAY HONEY” is the most precious substance in the Universe.'),
    (r'«Играющий ребёнок становится взрослым\. Играющий взрослый становится мудрецом\. Играющий мудрец становится Мышонком\!»',
     '“A playing child becomes an adult. A playing adult becomes a sage. A playing sage becomes the Little Mouse!”'),
    (r'«Мышонок с&nbsp;самого своего рождения проживает мир, в&nbsp;состоянии открытого сознания[^\"]*»',
     '“From his very birth, the Little Mouse experiences the world in a state of open wonder and pure heart.”'),
    (r'Мышонок живет на&nbsp;одной не&nbsp;очень большой планете в&nbsp;самом центре одного из&nbsp;таких миров\.',
     'The Little Mouse lives on a cozy little planet right at the center of such wondrous realms.'),
    (r'Мышонок чувствовал, что этот мед как-то всех объединяет,', 'The Little Mouse felt that this honey somehow unites all living beings,'),
    (r'Возможно это нектар доброты, возможно то, что рождается в&nbsp;душе при открытости миру\.',
     'Perhaps it is the nectar of kindness, born within our hearts when we open ourselves to the beauty of the world.'),
    (r'Когда у&nbsp;тебя хорошее настроение&nbsp;— это уже капелька меда\.',
     'When you are in a cheerful mood — that is already a sweet drop of honey.'),
    (r'И&nbsp;ты&nbsp;можешь ей&nbsp;поделиться с&nbsp;тем, у&nbsp;кого сегодня день не&nbsp;задался…',
     'And you can share it with someone whose day didn\'t go quite right...'),
    (r'Мы&nbsp;открыты к&nbsp;сотрудничеству и&nbsp;Вашим предложениям', 'We are open to partnerships, ideas and creative collaboration')
]

ABOUT_DE = [
    (r'<title>[^<]*<\/title>', '<title>Über das Projekt — Honig der Milchstraße</title>'),
    (r'О проекте \"Мед млечного пути\"', 'Über das Projekt „Honig der Milchstraße“'),
    (r'МЕД МЛЕЧНОГО ПУТИ', 'HONIG DER MILCHSTRASSE'),
    (r'«МЕД МЛЕЧНОГО ПУТИ»&nbsp;— самое ценное во&nbsp;Вселенной\.', '„HONIG DER MILCHSTRASSE“ ist das Wertvollste im gesamten Universum.'),
    (r'«Играющий ребёнок становится взрослым\. Играющий взрослый становится мудрецом\. Играющий мудрец становится Мышонком\!»',
     '„Ein spielendes Kind wird erwachsen. Ein spielender Erwachsener wird weise. Ein spielender Weiser wird zur kleinen Maus!“'),
    (r'«Мышонок с&nbsp;самого своего рождения проживает мир, в&nbsp;состоянии открытого сознания[^\"]*»',
     '„Von Geburt an erlebt die kleine Maus die Welt mit offenem Herzen und kindlicher Neugier.“'),
    (r'Мышонок живет на&nbsp;одной не&nbsp;очень большой планете в&nbsp;самом центре одного из&nbsp;таких миров\.',
     'Die kleine Maus lebt auf einem nicht allzu großen Planeten im Herzen einer dieser wunderbaren Welten.'),
    (r'Мышонок чувствовал, что этот мед как-то всех объединяет,', 'Die kleine Maus spürte, dass dieser Honig irgendwie alle Wesen miteinander verbindet,'),
    (r'Возможно это нектар доброты, возможно то, что рождается в&nbsp;душе при открытости миру\.',
     'Vielleicht ist es der Nektar der Güte, der in unserer Seele entsteht, wenn wir der Welt mit Offenheit begegnen.'),
    (r'Когда у&nbsp;тебя хорошее настроение&nbsp;— это уже капелька меда\.',
     'Wenn du gut gelaunt bist — ist das schon ein köstlicher Tropfen Honig.'),
    (r'И&nbsp;ты&nbsp;можешь ей&nbsp;поделиться с&nbsp;тем, у&nbsp;кого сегодня день не&nbsp;задался…',
     'Und du kannst ihn mit jemandem teilen, dessen Tag heute nicht so gut begonnen hat...'),
    (r'Мы&nbsp;открыты к&nbsp;сотрудничеству и&nbsp;Вашим предложениям', 'Wir freuen uns über Kooperationen, Ideen und Ihre Anregungen')
]

# 4. Creators Translations
CREATORS_EN = [
    (r'<title>[^<]*<\/title>', '<title>Creation Story — The Team Behind Mousekin</title>'),
    (r'История создания', 'Creation Story'),
    (r'Как мы создавали интерактивную сказку', 'How We Created the Interactive Story'),
    (r'Музыкальный продюсер в', 'Music Producer at'),
    (r'озвучила Мышонка на&nbsp;русском и&nbsp;английском языке', 'voiced the Little Mouse in Russian and English'),
    (r'«Да, можно сказать Мышонок нас познакомил\. Дело было так…»', '“Yes, you could say the Little Mouse brought us together. Here is how it happened…”'),
    (r'«История Мышонка понравилась с&nbsp;первого чтения[^\"]*»',
     '“We fell in love with the Little Mouse story from the very first reading — wise, tender tales like this touch both children and parents deeply.”'),
    (r'«Истории про маленького исследователя увлекают в&nbsp;волшебный мир[^\"]*»',
     '“Stories about the little explorer invite you into an enchanting world full of warmth and adventure.”')
]

CREATORS_DE = [
    (r'<title>[^<]*<\/title>', '<title>Entstehungsgeschichte — Das Team hinter der kleinen Maus</title>'),
    (r'История создания', 'Entstehungsgeschichte'),
    (r'Как мы создавали интерактивную сказку', 'Wie wir das interaktive Märchenbuch erschaffen haben'),
    (r'Музыкальный продюсер в', 'Musikproduzent bei'),
    (r'озвучила Мышонка на&nbsp;русском и&nbsp;английском языке', 'Sprecherstimme der kleinen Maus auf Russisch und Englisch'),
    (r'«Да, можно сказать Мышонок нас познакомил\. Дело было так…»', '„Ja, man könnte sagen, die kleine Maus hat uns zusammengebracht. Es geschah so…“'),
    (r'«История Мышонка понравилась с&nbsp;первого чтения[^\"]*»',
     '„Die Geschichte der kleinen Maus hat uns vom ersten Lesen an begeistert — solch kluge, warmherzige Märchen berühren Kinder wie Erwachsene gleichermaßen.“'),
    (r'«Истории про маленького исследователя увлекают в&nbsp;волшебный мир[^\"]*»',
     '„Geschichten über den kleinen Entdecker entführen in eine zauberhafte Welt voller Abenteuer und Wärme.“')
]

# 5. Reviews / Testimonials Translations
REVIEWS_EN = [
    (r'<title>[^<]*<\/title>', '<title>Reviews — The Little Mouse in Clocktown</title>'),
    (r'Отзывы', 'Reviews'),
    (r'Сказка о мышонке[^\"]*интересный', 'The Little Mouse tale — captivating and insightful'),
    (r'«В&nbsp;наше время хорошая детская сказка&nbsp;— большая редкость[^\"]*»',
     '“In our modern days, a truly great children\'s tale is rare. The story of the Little Mouse is exactly that rare treasure!”'),
    (r'«Восхитительно!\)\) мои маленькие племянники успели тебя полюбить[^\"]*»',
     '“Delightful! My little nephews fell in love with the story and keep asking to read it again and again.”'),
    (r'«Классно! Очень интересный и&nbsp;мудрый подход к&nbsp;объяснению ребёнку, что такое время[^\"]*»',
     '“Wonderful! A very gentle, wise approach to explaining to a child what Time truly is.”'),
    (r'«Какая офигенная, невероятная мудрая сказка! И&nbsp;как талантливо придумано![^\"]*»',
     '“What an astonishing, wise and imaginative tale! So beautifully crafted!”')
]

REVIEWS_DE = [
    (r'<title>[^<]*<\/title>', '<title>Rezensionen — Wo die Zeit entsteht</title>'),
    (r'Отзывы', 'Rezensionen'),
    (r'Сказка о мышонке[^\"]*интересный', 'Das Märchen von der kleinen Maus — bezaubernd und tiefsinnig'),
    (r'«В&nbsp;наше время хорошая детская сказка&nbsp;— большая редкость[^\"]*»',
     '„Heutzutage ist ein wirklich gutes Kindermärchen eine Seltenheit. Die Geschichte der kleinen Maus ist genau ein solcher Schatz!“'),
    (r'«Восхитительно!\)\) мои маленькие племянники успели тебя полюбить[^\"]*»',
     '„Bezaubernd! Meine kleinen Nichten und Neffen lieben das Buch und wollen die Geschichte immer wieder hören.“'),
    (r'«Классно! Очень интересный и&nbsp;мудрый подход к&nbsp;объяснению ребёнку, что такое время[^\"]*»',
     '„Klasse! Ein sehr liebevoller und kluger Weg, einem Kind zu erklären, was Zeit eigentlich bedeutet.“'),
    (r'«Какая офигенная, невероятная мудрая сказка! И&nbsp;как талантливо придумано![^\"]*»',
     '„Was für ein wunderbares, tiefsinniges Märchen! So herzerwärmend ausgedacht!“')
]

# 6. Privacy Policy
PRIVACY_EN = [
    (r'<title>[^<]*<\/title>', '<title>Privacy Policy — The Little Mouse in Clocktown</title>'),
    (r'Политика конфиденциальности', 'Privacy Policy'),
    (r'The Little Mouse in Clocktown', 'The Little Mouse in Clocktown')
]

PRIVACY_DE = [
    (r'<title>[^<]*<\/title>', '<title>Datenschutzerklärung — Wo die Zeit entsteht</title>'),
    (r'Политика конфиденциальности', 'Datenschutzerklärung'),
    (r'The Little Mouse in Clocktown', 'Wo die Zeit entsteht (Die kleine Maus in Uhrenstadt)')
]

def generate_pages():
    pages = [
        ('index.html', 'en/index.html', INDEX_EN, 'en'),
        ('index.html', 'de/index.html', INDEX_DE, 'de'),
        ('heroes.html', 'en/heroes.html', HEROES_EN, 'en'),
        ('heroes.html', 'de/heroes.html', HEROES_DE, 'de'),
        ('about_project.html', 'en/about_project.html', ABOUT_EN, 'en'),
        ('about_project.html', 'de/about_project.html', ABOUT_DE, 'de'),
        ('creators.html', 'en/creators.html', CREATORS_EN, 'en'),
        ('creators.html', 'de/creators.html', CREATORS_DE, 'de'),
        ('testimonials.html', 'en/testimonials.html', REVIEWS_EN, 'en'),
        ('testimonials.html', 'de/testimonials.html', REVIEWS_DE, 'de'),
        ('privacy.html', 'en/privacy.html', PRIVACY_EN, 'en'),
        ('privacy.html', 'de/privacy.html', PRIVACY_DE, 'de')
    ]

    for src_name, dst_name, specific_replacements, lang in pages:
        with open(src_name, 'r', encoding='utf-8') as f:
            c = f.read()

        c = make_absolute_assets(c)

        if lang == 'en':
            # Apply common EN menu
            for pat, rep in [
                (r'href=[\"\']/heroes[\"\']', 'href=\"/en/heroes\"'),
                (r'href=[\"\']/creators[\"\']', 'href=\"/en/creators\"'),
                (r'href=[\"\']/about_project[\"\']', 'href=\"/en/about_project\"'),
                (r'href=[\"\']/testimonials[\"\']', 'href=\"/en/testimonials\"'),
                (r'href=[\"\']/privacy[\"\']', 'href=\"/en/privacy\"'),
                (r'href=[\"\']/blog[\"\']', 'href=\"/blog\"'),
                (r'href=[\"\']/\"', 'href=\"/en\"'),
                (r'>Герои<', '>Heroes<'),
                (r'>История создания<', '>Creation Story<'),
                (r'>О проекте \"Мед млечного пути\"<', '>About Project<'),
                (r'>Отзывы<', '>Reviews<'),
                (r'>Блог Мышонка<', '>Mousekin Blog<'),
                (r'>Политика конфиденциальности<', '>Privacy Policy<'),
                (r'Мы не тратим деньги на рекламу, но нас рекомендуют друзья !', 'We don\'t spend money on advertising, but friends recommend us!')
            ]:
                c = re.sub(pat, rep, c)
            c = apply_replacements(c, specific_replacements)
            # Ensure English OG
            c = re.sub(r'og-preview-(?:ru|de)\.png', 'og-preview-en.png', c)
            c = re.sub(r'ru_RU|de_DE', 'en_US', c)

        elif lang == 'de':
            # Apply common DE menu
            for pat, rep in [
                (r'href=[\"\']/heroes[\"\']', 'href=\"/de/heroes\"'),
                (r'href=[\"\']/creators[\"\']', 'href=\"/de/creators\"'),
                (r'href=[\"\']/about_project[\"\']', 'href=\"/de/about_project\"'),
                (r'href=[\"\']/testimonials[\"\']', 'href=\"/de/testimonials\"'),
                (r'href=[\"\']/privacy[\"\']', 'href=\"/de/privacy\"'),
                (r'href=[\"\']/blog[\"\']', 'href=\"/blog\"'),
                (r'href=[\"\']/\"', 'href=\"/de\"'),
                (r'>Герои<', '>Helden<'),
                (r'>История создания<', '>Entstehungsgeschichte<'),
                (r'>О проекте \"Мед млечного пути\"<', '>Über das Projekt<'),
                (r'>Отзывы<', '>Rezensionen<'),
                (r'>Блог Мышонка<', '>Maus-Blog<'),
                (r'>Политика конфиденциальности<', '>Datenschutz<'),
                (r'Мы не тратим деньги на рекламу, но нас рекомендуют друзья !', 'Wir geben kein Geld für Werbung aus, aber Freunde empfehlen uns!')
            ]:
                c = re.sub(pat, rep, c)
            c = apply_replacements(c, specific_replacements)
            # Ensure German OG
            c = re.sub(r'og-preview-(?:ru|en)\.png', 'og-preview-de.png', c)
            c = re.sub(r'ru_RU|en_US', 'de_DE', c)

        with open(dst_name, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f'Generated {dst_name}')

    # Also keep en.html and de.html at root synchronized
    with open('en/index.html', 'r', encoding='utf-8') as f:
        c = f.read()
    with open('en.html', 'w', encoding='utf-8') as f:
        f.write(c)
    with open('clocktown.html', 'w', encoding='utf-8') as f:
        f.write(c)

    with open('de/index.html', 'r', encoding='utf-8') as f:
        c = f.read()
    with open('de.html', 'w', encoding='utf-8') as f:
        f.write(c)

    print('Updated en.html, clocktown.html and de.html at root.')

if __name__ == '__main__':
    generate_pages()
