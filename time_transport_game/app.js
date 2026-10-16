/**
 * ИГРА «ВРЕМЯ ТРАНСПОРТ» — ИГРОВОЙ ДВИЖОК
 * Автор сказки: Игорь Африкян
 */

import { DIALOGUES } from './dialogues.js';
import { sound } from './audio.js';
import { TransportBridge } from './api.js';

// Парные авторские часы для каждого транспорта
const VEHICLE_CLOCKS = {
  scooter: {
    name: 'Часы-кукушка на пне',
    img: 'assets/clocks/clock_scooter.webp'
  },
  bike: {
    name: 'Напольные дедушкины часы',
    img: 'assets/clocks/clock_bike.webp'
  },
  moped: {
    name: 'Сферические часы в кольцах',
    img: 'assets/clocks/clock_moped.webp'
  }
};

// Канонические спрайты и выверенные координаты героев на каждом транспорте
const HERO_SPRITES = {
  mouse: {
    name: 'Мышонок',
    icon: 'assets/characters/mouse_avatar.png',
    bike: {
      img: 'assets/characters/mouse_cyclist_clean.webp',
      style: 'width: 54%; left: 32%; top: -34%;'
    },
    scooter: {
      img: 'assets/characters/mouse_scooter_strawhat_clean.webp',
      style: 'width: 44%; left: 28%; top: -12%;'
    },
    moped: {
      img: 'assets/characters/mouse_moped_driver_clean.webp',
      style: 'width: 42%; left: 17%; top: -24%;'
    },
    monowheel: {
      img: 'assets/characters/mouse_cyclist_clean.webp',
      style: 'width: 65%; left: 18%; top: -56%;'
    }
  },
  snail: {
    name: 'Улитка',
    icon: 'assets/characters/snail_avatar.png',
    bike: {
      img: 'assets/characters/snail_full.webp',
      style: 'width: 28%; left: 30%; top: -38%;'
    },
    scooter: {
      img: 'assets/characters/snail_full.webp',
      style: 'width: 28%; left: 36%; top: -12%;'
    },
    moped: {
      img: 'assets/characters/snail_full.webp',
      style: 'width: 26%; left: 28%; top: -22%;'
    },
    monowheel: {
      img: 'assets/characters/snail_full.webp',
      style: 'width: 42%; left: 28%; top: -38%;'
    }
  },
  cat: {
    name: 'Кот Мартин',
    icon: 'assets/characters/cat_avatar.png',
    bike: {
      img: 'assets/characters/cat_full.webp',
      style: 'width: 44%; left: 22%; top: -16%;'
    },
    scooter: {
      img: 'assets/characters/cat_full.webp',
      style: 'width: 44%; left: 26%; top: 38%;'
    },
    moped: {
      img: 'assets/characters/cat_full.webp',
      style: 'width: 42%; left: 20%; top: 2%;'
    },
    monowheel: {
      img: 'assets/characters/cat_full.webp',
      style: 'width: 65%; left: 16%; top: -15%;'
    }
  },
  archivist: {
    name: 'Йозеф-архивариус',
    icon: 'assets/characters/archivist_avatar.png',
    bike: {
      img: 'assets/characters/archivist_full.webp',
      style: 'width: 27%; left: 29%; top: -33%;'
    },
    scooter: {
      img: 'assets/characters/archivist_full.webp',
      style: 'width: 27%; left: 35%; top: -10%;'
    },
    moped: {
      img: 'assets/characters/archivist_full.webp',
      style: 'width: 25%; left: 28%; top: -18%;'
    },
    monowheel: {
      img: 'assets/characters/archivist_full.webp',
      style: 'width: 40%; left: 28%; top: -34%;'
    }
  }
};

class TimeTransportApp {
  constructor() {
    this.vehiclesData = null;
    this.currentVehicleId = 'scooter';
    this.currentVehicle = null;
    this.selectedHero = 'mouse';
    this.placedParts = new Set();
    this.draggedPart = null;
    this.dragAvatar = null;
    this.dragPointerOffset = { x: 0, y: 0 };
    this.hintTimer = null;
    this.rideIsFast = false;
    const urlParams = new URLSearchParams(window.location.search);
    this.isEmbed = urlParams.get('embed') === '1' || window.self !== window.top;

    // DOM Elements
    this.root = document.getElementById('game-root');
    this.screens = {
      menu: document.getElementById('menu-screen'),
      workshop: document.getElementById('workshop-screen'),
      celebrate: document.getElementById('celebrate-screen'),
      ride: document.getElementById('ride-screen'),
      garage: document.getElementById('garage-screen')
    };

    this.blueprintCanvas = document.getElementById('blueprint-canvas');
    this.blueprintGhost = document.getElementById('blueprint-ghost');
    this.partsShelf = document.getElementById('parts-shelf');
    this.assemblyTitle = document.getElementById('assembly-title');
    this.assemblyProgress = document.getElementById('assembly-progress');
    this.mouseBubble = document.getElementById('mouse-bubble');

    this.init();
  }

  async init() {
    this.setupHeaderControls();
    await this.loadTransportData();
    this.renderMenuCards();
    this.setupDragEvents();
    this.setupRideControls();
    this.setupCelebrateControls();

    // Запуск с главного меню или по прямому параметру URL (?vehicle=scooter&hero=snail)
    const urlParams = new URLSearchParams(window.location.search);
    const targetVehicle = urlParams.get('vehicle');
    const testCelebrate = urlParams.get('test_celebrate');
    const testRide = urlParams.get('test_ride');
    const testGarage = urlParams.get('test_garage');
    const targetHero = urlParams.get('hero');

    if (targetHero && HERO_SPRITES[targetHero]) {
      this.selectedHero = targetHero;
    }

    if (testCelebrate && this.vehiclesData[testCelebrate]) {
      this.selectVehicle(testCelebrate);
      this.celebrateVehicleCompletion();
    } else if (testRide && this.vehiclesData[testRide]) {
      this.currentVehicleId = testRide;
      this.currentVehicle = this.vehiclesData[testRide];
      this.startTestDrive();
    } else if (testGarage) {
      this.showScreen('garage');
    } else if (targetVehicle && this.vehiclesData[targetVehicle]) {
      this.selectVehicle(targetVehicle);
    } else {
      this.showScreen('menu');
    }
    sound.playMusic('assets/audio/theme_clocktown.mp3');

    // Экспорт в глобальный скоуп для консоли и API
    window.TimeTransportGameApp = this;
  }

  // Загрузка данных транспортов
  async loadTransportData() {
    try {
      const res = await fetch('assets/transport_data.json');
      this.vehiclesData = await res.json();
    } catch (e) {
      console.error('Failed to load transport_data.json', e);
    }
  }

  // Переключение экранов
  showScreen(screenName) {
    Object.keys(this.screens).forEach(key => {
      if (this.screens[key]) {
        this.screens[key].classList.toggle('active', key === screenName);
      }
    });

    if (screenName === 'menu') {
      this.renderMenuCards();
      sound.playMusic('assets/audio/theme_clocktown.mp3');
      sound.stopRideTrack();
    } else if (screenName === 'garage') {
      this.renderGarage();
    } else if (screenName === 'ride') {
      sound.stopMusic();
      sound.playRideTrack();
    }
  }

  setupHeaderControls() {
    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        btnMute.textContent = isMuted ? '🔇' : '🔊';
        btnMute.title = isMuted ? 'Включить звук' : 'Выключить звук';
      });
    }

    const btnHome = document.getElementById('btn-home');
    if (btnHome) {
      btnHome.addEventListener('click', () => {
        this.showScreen('menu');
      });
    }

    const btnGarage = document.getElementById('btn-garage');
    if (btnGarage) {
      btnGarage.addEventListener('click', () => {
        this.showScreen('garage');
      });
    }
  }

  // --- 1. ГЛАВНОЕ МЕНЮ ---
  renderMenuCards() {
    const grid = document.getElementById('vehicles-grid');
    if (!grid || !this.vehiclesData) return;

    const progress = TransportBridge.getProgress();
    grid.innerHTML = '';

    const list = ['scooter', 'monowheel', 'bike', 'moped'];
    list.forEach(vId => {
      const v = this.vehiclesData[vId];
      if (!v) return;

      const isAssembled = progress.assembled.includes(vId);
      const card = document.createElement('div');
      card.className = `vehicle-card ${isAssembled ? 'assembled' : ''}`;
      const ctaText = this.isEmbed
        ? (isAssembled ? 'Собрать 🔨' : 'Начать сборку 🔨')
        : (isAssembled ? 'Собрать заново 🔄' : 'Начать сборку 🔨');
      card.innerHTML = `
        <div class="card-status-badge">
          ${isAssembled ? '✨ Собрано' : '⚙️ Мастерская'}
        </div>
        <div class="card-img-wrap">
          <img src="assets/${v.full_image}" alt="${v.title}">
        </div>
        <h3 class="card-title">${v.title}</h3>
        <p class="card-desc">${v.tagline}</p>
        <button class="card-cta">${ctaText}</button>
      `;

      card.addEventListener('click', () => {
        sound.playGearTick();
        this.selectVehicle(vId);
      });

      grid.appendChild(card);
    });
  }

  // --- 2. МАСТЕРСКАЯ СБОРКИ ---
  selectVehicle(vId) {
    this.currentVehicleId = vId;
    this.currentVehicle = this.vehiclesData[vId];
    if (!this.currentVehicle) return;

    this.placedParts.clear();
    this.showScreen('workshop');

    this.assemblyTitle.textContent = this.currentVehicle.title;
    this.updateProgressBadge();

    // Динамическая адаптация пропорций чертежа под точные размеры PSD
    this.blueprintCanvas.style.aspectRatio = `${this.currentVehicle.width} / ${this.currentVehicle.height}`;

    // Загрузка чертежа и силуэта
    this.blueprintGhost.src = `assets/${this.currentVehicle.ghost_image}`;

    // Очистка старых установленных деталей
    const oldPlaced = this.blueprintCanvas.querySelectorAll('.part-placed, .part-slot');
    oldPlaced.forEach(el => el.remove());

    // Создание пазов-слотов на чертеже
    this.currentVehicle.parts.forEach((part, idx) => {
      const slot = document.createElement('div');
      slot.className = 'part-slot';
      slot.id = `slot-${part.id}`;
      slot.style.left = `${part.leftPct}%`;
      slot.style.top = `${part.topPct}%`;
      slot.style.width = `${part.widthPct}%`;
      slot.style.height = `${part.heightPct}%`;
      if (this.currentVehicleId === 'monowheel') {
        const badge = document.createElement('span');
        badge.className = 'slot-badge';
        badge.textContent = String(idx + 1);
        slot.appendChild(badge);
      }
      this.blueprintCanvas.appendChild(slot);
    });

    // Хранитель времени текущего чертежа (парные авторские часы)
    const clockInfo = VEHICLE_CLOCKS[this.currentVehicleId];
    const stage = document.getElementById('blueprint-stage');
    let keeper = document.getElementById('blueprint-clock-keeper');
    if (!keeper && stage) {
      keeper = document.createElement('div');
      keeper.id = 'blueprint-clock-keeper';
      keeper.className = 'blueprint-clock-keeper';
      stage.appendChild(keeper);
    }
    if (keeper) {
      if (clockInfo) {
        keeper.style.display = 'flex';
        keeper.innerHTML = `
          <img class="clock-keeper-img" src="${clockInfo.img}" alt="${clockInfo.name}">
          <div class="clock-keeper-meta">
            <span class="clock-keeper-badge">Хранитель времени</span>
            <span class="clock-keeper-name">${clockInfo.name}</span>
          </div>
        `;
      } else {
        keeper.style.display = 'none';
      }
    }

    // Наполнение полки деталями в перемешанном порядке
    this.populatePartsShelf();
    this.resetHintTimer();
  }

  populatePartsShelf() {
    this.partsShelf.innerHTML = '<span class="shelf-title">Детали для сборки</span>';

    // Случайное перемешивание деталей для интереса ребенка
    const shuffled = [...this.currentVehicle.parts].sort(() => Math.random() - 0.5);

    shuffled.forEach(part => {
      const item = document.createElement('div');
      item.className = 'shelf-item';
      item.id = `shelf-item-${part.id}`;
      item.dataset.partId = part.id;
      item.title = part.name;

      item.innerHTML = `
        <img src="assets/${part.fileWebp || part.file}" alt="${part.name}">
        <span class="shelf-item-label">${part.name}</span>
      `;

      this.partsShelf.appendChild(item);
    });
  }

  updateProgressBadge() {
    const total = this.currentVehicle.parts.length;
    const current = this.placedParts.size;
    this.assemblyProgress.textContent = `${current} из ${total}`;
  }

  // --- DRAG AND DROP ЛОГИКА ---
  setupDragEvents() {
    // Делегирование Pointer Events для поддержки мыши и тач-скрина
    const onPointerDown = (e) => {
      const shelfItem = e.target.closest('.shelf-item');
      if (!shelfItem || shelfItem.classList.contains('dragging')) return;

      const partId = shelfItem.dataset.partId;
      const part = this.currentVehicle.parts.find(p => p.id === partId);
      if (!part) return;

      sound.init();
      sound.playGearTick();

      this.draggedPart = part;
      shelfItem.classList.add('dragging');

      // Создаем плавающий клон под курсором
      this.dragAvatar = document.createElement('div');
      this.dragAvatar.className = 'drag-avatar';
      this.dragAvatar.innerHTML = `<img src="assets/${part.fileWebp || part.file}">`;
      document.body.appendChild(this.dragAvatar);

      this.updateAvatarPosition(e.clientX, e.clientY);

      // Подсвечиваем целевой слот на чертеже
      const targetSlot = document.getElementById(`slot-${part.id}`);
      if (targetSlot) targetSlot.classList.add('highlight');

      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!this.draggedPart || !this.dragAvatar) return;
      this.updateAvatarPosition(e.clientX, e.clientY);
    };

    const onPointerUp = (e) => {
      if (!this.draggedPart) return;

      const part = this.draggedPart;
      const shelfItem = document.getElementById(`shelf-item-${part.id}`);
      const targetSlot = document.getElementById(`slot-${part.id}`);
      if (targetSlot) targetSlot.classList.remove('highlight');

      // Проверка попадания в целевой слот
      const isHit = this.checkSlotCollision(e.clientX, e.clientY, targetSlot);

      if (isHit) {
        if (this.currentVehicleId === 'monowheel') {
          const order = ['wheel', 'frame', 'pedal', 'saddle'];
          const nextIndex = this.placedParts.size;
          const expectedId = order[nextIndex];
          if (part.id !== expectedId) {
            if (shelfItem) shelfItem.classList.remove('dragging');
            sound.playMiss();
            const expPart = this.currentVehicle.parts.find(p => p.id === expectedId);
            this.showCustomMousePraise('Сначала поставь деталь №' + (nextIndex + 1) + ' — ' + (expPart ? expPart.name : ''));
            const expSlot = document.getElementById(`slot-${expectedId}`);
            if (expSlot) {
              expSlot.classList.add('highlight');
              setTimeout(() => expSlot.classList.remove('highlight'), 2500);
            }
            if (this.dragAvatar) {
              this.dragAvatar.remove();
              this.dragAvatar = null;
            }
            this.draggedPart = null;
            return;
          }
        }
        // Успешная установка
        this.placePartOnBlueprint(part);
        if (shelfItem) shelfItem.remove();
        sound.playSnapSuccess();
        this.showRandomMousePraise();
        this.spawnGoldenSparks(e.clientX, e.clientY);

        // Проверка завершения сборки транспорта
        if (this.placedParts.size === this.currentVehicle.parts.length) {
          setTimeout(() => this.celebrateVehicleCompletion(), 500);
        }
      } else {
        // Промах — возвращаем деталь на полку
        if (shelfItem) shelfItem.classList.remove('dragging');
        sound.playMiss();
      }

      // Удаляем плавающий аватар
      if (this.dragAvatar) {
        this.dragAvatar.remove();
        this.dragAvatar = null;
      }
      this.draggedPart = null;
      this.resetHintTimer();
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Кнопка подсказки
    const btnHint = document.getElementById('btn-hint');
    if (btnHint) {
      btnHint.addEventListener('click', () => {
        this.triggerHint();
      });
    }
  }

  updateAvatarPosition(clientX, clientY) {
    if (this.dragAvatar) {
      this.dragAvatar.style.left = `${clientX}px`;
      this.dragAvatar.style.top = `${clientY}px`;
    }
  }

  checkSlotCollision(clientX, clientY, slotEl) {
    if (!slotEl) return false;
    const rect = slotEl.getBoundingClientRect();

    // Увеличенный радиус захвата для удобства маленьких детей (допуск +45px)
    const padding = 45;
    return (
      clientX >= rect.left - padding &&
      clientX <= rect.right + padding &&
      clientY >= rect.top - padding &&
      clientY <= rect.bottom + padding
    );
  }

  placePartOnBlueprint(part) {
    this.placedParts.add(part.id);
    this.updateProgressBadge();

    const placed = document.createElement('div');
    placed.className = 'part-placed';
    placed.id = `placed-${part.id}`;
    placed.style.left = `${part.leftPct}%`;
    placed.style.top = `${part.topPct}%`;
    placed.style.width = `${part.widthPct}%`;
    placed.style.height = `${part.heightPct}%`;

    placed.innerHTML = `<img src="assets/${part.fileWebp || part.file}" alt="${part.name}">`;
    this.blueprintCanvas.appendChild(placed);
  }

  // Всплывающая похвала от Мышонка
  showRandomMousePraise() {
    const praiseList = DIALOGUES.mousePraise;
    const phrase = praiseList[Math.floor(Math.random() * praiseList.length)];
    if (this.mouseBubble) {
      this.mouseBubble.textContent = phrase;
      this.mouseBubble.classList.add('show');
      setTimeout(() => {
        this.mouseBubble.classList.remove('show');
      }, 2500);
    }
  }

  showCustomMousePraise(phrase) {
    if (this.mouseBubble) {
      this.mouseBubble.textContent = phrase;
      this.mouseBubble.classList.add('show');
      setTimeout(() => {
        this.mouseBubble.classList.remove('show');
      }, 3000);
    }
  }

  // Подсказка контура
  triggerHint() {
    sound.playGearTick();
    const unplaced = this.currentVehicle.parts.filter(p => !this.placedParts.has(p.id));
    if (unplaced.length === 0) return;

    const nextPart = unplaced[0];
    const slot = document.getElementById(`slot-${nextPart.id}`);
    const shelfItem = document.getElementById(`shelf-item-${nextPart.id}`);

    if (slot) {
      slot.classList.add('highlight');
      setTimeout(() => slot.classList.remove('highlight'), 2500);
    }
    if (shelfItem) {
      shelfItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      shelfItem.style.borderColor = 'var(--gold-primary)';
      shelfItem.style.boxShadow = '0 0 15px var(--gold-primary)';
      setTimeout(() => {
        shelfItem.style.borderColor = '';
        shelfItem.style.boxShadow = '';
      }, 2500);
    }
  }

  resetHintTimer() {
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      this.triggerHint();
    }, 8500);
  }

  // Золотые частицы при установке детали
  spawnGoldenSparks(x, y) {
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 8 + 4;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = Math.random() > 0.5 ? '#f59e0b' : '#fef08a';
      p.style.boxShadow = '0 0 8px #f59e0b';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 70 + 20;
      const destX = x + Math.cos(angle) * dist;
      const destY = y + Math.sin(angle) * dist;

      p.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${destX - x}px, ${destY - y}px) scale(0)`, opacity: 0 }
      ], {
        duration: 600,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      }).onfinish = () => p.remove();
    }
  }

  // Генерация HTML для транспорта с выбранным героем верхом
  getVehicleRiderHTML(vehicleId = this.currentVehicleId, heroKey = this.selectedHero) {
    const v = (this.vehiclesData && this.vehiclesData[vehicleId]) || this.currentVehicle;
    if (!v) return '';

    const hero = HERO_SPRITES[heroKey] || HERO_SPRITES.mouse;
    const config = hero[vehicleId] || hero.bike;
    const vehicleImg = v.full_image_webp ? `assets/${v.full_image_webp}` : `assets/${v.full_image}`;

    let accessoryHtml = '';
    if (config.accessory) {
      accessoryHtml = `<img class="rider-accessory" src="${config.accessory}" style="${config.accessoryStyle || ''}" alt="Аксессуар">`;
    }

    return `
      <div class="composite-stage" style="aspect-ratio: ${v.width} / ${v.height};">
        <img class="revived-vehicle" src="${vehicleImg}" alt="${v.title}">
        <img class="rider-sprite rider-${heroKey}" src="${config.img}" style="${config.style}" alt="${hero.name}">
        ${accessoryHtml}
      </div>
    `;
  }

  // --- 3. ОЖИВЛЕНИЕ ТРАНСПОРТА И ДИАЛОГИ ---
  celebrateVehicleCompletion() {
    clearTimeout(this.hintTimer);
    TransportBridge.markAssembled(this.currentVehicleId);
    sound.playCompletionFanfare();

    this.showScreen('celebrate');

    // Отрисовываем транспорт с текущим выбранным героем
    this.updateStageVisual();

    // Загрузка диалогов персонажей для собранного транспорта
    const dialogueSet = DIALOGUES[this.currentVehicleId] || DIALOGUES.scooter;
    this.renderCameoTabs(dialogueSet);
    const activeChar = (dialogueSet.assembled && dialogueSet.assembled[this.selectedHero]) || dialogueSet.assembled.mouse;
    this.showCharacterDialogue(activeChar);

    // Праздничный салют конфетти
    for (let i = 0; i < 35; i++) {
      setTimeout(() => {
        this.spawnGoldenSparks(
          window.innerWidth * (0.2 + Math.random() * 0.6),
          window.innerHeight * (0.2 + Math.random() * 0.5)
        );
      }, i * 40);
    }

    if (this.isEmbed) {
      const btnTestDrive = document.getElementById('btn-test-drive');
      const btnToGarage = document.getElementById('btn-to-garage');
      const btnEmbedFinish = document.getElementById('btn-embed-finish');
      if (btnTestDrive) btnTestDrive.style.display = 'none';
      if (btnToGarage) btnToGarage.style.display = 'none';
      if (btnEmbedFinish) btnEmbedFinish.style.display = 'block';
    }
  }

  updateStageVisual(heroKey = this.selectedHero) {
    this.selectedHero = heroKey;
    const stage = document.getElementById('celebrate-stage');
    if (stage) {
      stage.innerHTML = this.getVehicleRiderHTML(this.currentVehicleId, this.selectedHero);
    }
  }

  renderCameoTabs(dialogueSet) {
    const tabsRow = document.getElementById('cameo-tabs');
    if (!tabsRow) return;
    tabsRow.innerHTML = '';

    const heroes = [
      { key: 'mouse', name: 'Мышонок', icon: 'assets/characters/mouse_avatar.png' },
      { key: 'snail', name: 'Улитка', icon: 'assets/characters/snail_avatar.png' },
      { key: 'cat', name: 'Кот Мартин', icon: 'assets/characters/cat_avatar.png' },
      { key: 'archivist', name: 'Йозеф', icon: 'assets/characters/archivist_avatar.png' }
    ];

    heroes.forEach(h => {
      const charData = dialogueSet.assembled ? dialogueSet.assembled[h.key] : null;
      if (!charData) return;

      const btn = document.createElement('button');
      btn.className = `cameo-tab-btn ${h.key === this.selectedHero ? 'active' : ''}`;
      btn.innerHTML = `<img src="${h.icon}" alt="${h.name}"> <span>${h.name}</span>`;

      btn.addEventListener('click', () => {
        tabsRow.querySelectorAll('.cameo-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedHero = h.key;
        sound.playCharacterSfx(h.key);
        // Немедленно обновляем верхнюю сцену с новым наездником!
        this.updateStageVisual(h.key);
        this.showCharacterDialogue(charData);

        // Маленький золотой акцент при выборе героя
        const stage = document.getElementById('celebrate-stage');
        if (stage) {
          const rect = stage.getBoundingClientRect();
          this.spawnGoldenSparks(rect.left + rect.width / 2, rect.top + rect.height / 3);
        }
      });

      tabsRow.appendChild(btn);
    });
  }

  showCharacterDialogue(charData) {
    if (!charData) return;
    const avatar = document.getElementById('char-avatar');
    const name = document.getElementById('char-name');
    const quote = document.getElementById('char-quote');
    const story = document.getElementById('char-story');

    if (avatar) avatar.src = charData.avatar;
    if (name) name.textContent = charData.name;
    if (quote) quote.textContent = charData.quote;
    if (story) story.textContent = charData.story;
  }

  setupCelebrateControls() {
    const btnTestDrive = document.getElementById('btn-test-drive');
    if (btnTestDrive) {
      btnTestDrive.addEventListener('click', () => {
        this.startTestDrive();
      });
    }

    const btnToGarage = document.getElementById('btn-to-garage');
    if (btnToGarage) {
      btnToGarage.addEventListener('click', () => {
        this.showScreen('garage');
      });
    }

    const btnEmbedFinish = document.getElementById('btn-embed-finish');
    if (btnEmbedFinish) {
      btnEmbedFinish.addEventListener('click', () => {
        sound.stopMusic();
        sound.stopRideTrack();
        TransportBridge.notifyParent({ type: 'TIME_TRANSPORT_FINISHED', vehicleId: this.currentVehicleId });
      });
    }
  }

  // --- 4. ТЕСТ-ДРАЙВ ПО ГОРОДУ ЧАСОВ ---
  startTestDrive() {
    this.showScreen('ride');
    this.updateRideActor();
    this.updateRideHeroSwitcherUI();
    const h = this.screens.ride ? this.screens.ride.clientHeight : window.innerHeight;
    const cycleWidth = Math.round(h * (8801 / 1240));
    const track = document.getElementById('ride-track');
    if (track) {
      track.style.setProperty('--cycle-width', `${cycleWidth}px`);
    }
    sound.playRideTrack();
  }

  updateRideActor() {
    const actor = document.getElementById('ride-actor');
    if (actor && this.currentVehicle) {
      actor.innerHTML = this.getVehicleRiderHTML(this.currentVehicleId, this.selectedHero);
    }
  }

  updateRideHeroSwitcherUI() {
    const switcher = document.getElementById('ride-hero-switcher');
    if (!switcher) return;
    switcher.querySelectorAll('.ride-hero-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hero === this.selectedHero);
    });
  }

  setupRideControls() {
    const btnHorn = document.getElementById('btn-ride-horn');
    if (btnHorn) {
      btnHorn.addEventListener('click', () => {
        if (this.selectedHero === 'cat') {
          sound.playCharacterSfx('cat');
        } else if (this.selectedHero === 'snail') {
          sound.playCharacterSfx('snail');
        } else if (this.selectedHero === 'archivist') {
          sound.playCharacterSfx('archivist');
        } else if (this.currentVehicleId === 'moped') {
          sound.playMouseHorn();
        } else {
          sound.playAlarmBell();
        }
      });
    }

    const btnSpeed = document.getElementById('btn-ride-speed');
    const track = document.getElementById('ride-track');
    if (btnSpeed && track) {
      btnSpeed.addEventListener('click', () => {
        this.rideIsFast = !this.rideIsFast;
        track.classList.toggle('fast', this.rideIsFast);
        btnSpeed.textContent = this.rideIsFast ? '⏳ Обычный ход' : '⚡ Быстрое Время!';
        sound.playGearTick();
      });
    }

    const btnBackToWorkshop = document.getElementById('btn-ride-back');
    if (btnBackToWorkshop) {
      btnBackToWorkshop.addEventListener('click', () => {
        this.showScreen('menu');
      });
    }

    // Переключение героя прямо во время поездки по городу
    const switcher = document.getElementById('ride-hero-switcher');
    if (switcher) {
      switcher.addEventListener('click', (e) => {
        const btn = e.target.closest('.ride-hero-btn');
        if (!btn || !btn.dataset.hero) return;
        const heroKey = btn.dataset.hero;
        if (this.selectedHero === heroKey) return;

        this.selectedHero = heroKey;
        this.updateRideActor();
        this.updateRideHeroSwitcherUI();
        sound.playCharacterSfx(heroKey);

        const actor = document.getElementById('ride-actor');
        if (actor) {
          const rect = actor.getBoundingClientRect();
          this.spawnGoldenSparks(rect.left + rect.width / 2, rect.top + rect.height / 3);
        }
      });
    }
  }

  // --- 5. ГАРАЖ ВРЕМЕНИ ---
  renderGarage() {
    const grid = document.getElementById('garage-showcase');
    if (!grid || !this.vehiclesData) return;

    const progress = TransportBridge.getProgress();
    grid.innerHTML = '';

    const list = ['scooter', 'monowheel', 'bike', 'moped'];
    list.forEach(vId => {
      const v = this.vehiclesData[vId];
      if (!v) return;

      const isUnlocked = progress.assembled.includes(vId);
      const clock = VEHICLE_CLOCKS[vId];
      const ped = document.createElement('div');
      ped.className = `garage-pedestal ${isUnlocked ? 'unlocked' : 'locked'}`;

      ped.innerHTML = `
        <div class="pedestal-img-wrap">
          <img class="pedestal-vehicle-img" src="assets/${v.full_image_webp || v.full_image}" alt="${v.title}">
          ${clock ? `<img class="pedestal-clock-img" src="${clock.img}" alt="${clock.name}" title="${clock.name}">` : ''}
        </div>
        <h4 class="pedestal-name">${v.title}</h4>
        ${clock ? `<div class="pedestal-clock-title">🕰️ ${clock.name}</div>` : ''}
        <div class="pedestal-status">${isUnlocked ? '⭐ Готов к поездкам' : '🔒 Ещё не собран'}</div>
        <button class="primary-btn" style="width: 100%; font-size: 0.9rem;">
          ${isUnlocked ? 'Прокатиться 🚀' : 'Собрать 🔨'}
        </button>
      `;

      ped.querySelector('button').addEventListener('click', () => {
        if (isUnlocked) {
          this.currentVehicleId = vId;
          this.currentVehicle = this.vehiclesData[vId];
          this.startTestDrive();
        } else {
          this.selectVehicle(vId);
        }
      });

      grid.appendChild(ped);
    });
  }
}

// Запуск при готовности DOM
window.addEventListener('DOMContentLoaded', () => {
  new TimeTransportApp();
});
