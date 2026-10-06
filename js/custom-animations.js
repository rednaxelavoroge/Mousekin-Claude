/* ========================================================
   Mousekin Clocktown — PWA & Multilingual Navigation Controller
   (Preserves 100% of original Tilda watercolor art and layout)
   ======================================================== */

(function () {
  'use strict';

  // 1. PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  // 2. Global PWA Controller Object
  let deferredPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('mkModalNativeBtn');
    if (btn) btn.style.display = 'flex';
  });

  window.MousekinPWA = {
    openInstallModal: function () {
      let modal = document.getElementById('mousekinInstallModal');
      if (!modal) {
        modal = createModal();
      }
      const stepsContainer = document.getElementById('mkModalSteps');
      const nativeBtn = document.getElementById('mkModalNativeBtn');

      if (isIOS) {
        stepsContainer.innerHTML = `
          <div class="mk-step-row">
            <div class="mk-step-num">1</div>
            <div class="mk-step-text">Нажмите кнопку <strong>«Поделиться»</strong> (<svg style="width:14px;height:14px;vertical-align:-2px;display:inline-block;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>) в нижней панели Safari</div>
          </div>
          <div class="mk-step-row">
            <div class="mk-step-num">2</div>
            <div class="mk-step-text">Прокрутите список и выберите <strong>«На экран "Домой"»</strong> (⊕)</div>
          </div>
          <div class="mk-step-row">
            <div class="mk-step-num">3</div>
            <div class="mk-step-text">Нажмите <strong>«Добавить»</strong> в правом верхнем углу</div>
          </div>
        `;
        if (nativeBtn) nativeBtn.style.display = 'none';
      } else if (deferredPrompt) {
        stepsContainer.innerHTML = `
          <div class="mk-step-row">
            <div class="mk-step-num">★</div>
            <div class="mk-step-text">Нажмите кнопку ниже, чтобы установить приложение на рабочий стол в 1 клик!</div>
          </div>
        `;
        if (nativeBtn) nativeBtn.style.display = 'flex';
      } else {
        stepsContainer.innerHTML = `
          <div class="mk-step-row">
            <div class="mk-step-num">1</div>
            <div class="mk-step-text">В меню вашего браузера (Chrome, Safari, Edge) нажмите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong></div>
          </div>
          <div class="mk-step-row">
            <div class="mk-step-num">2</div>
            <div class="mk-step-text">Книга станет доступна офлайн прямо с рабочего стола как нативное приложение!</div>
          </div>
        `;
        if (nativeBtn) nativeBtn.style.display = 'none';
      }

      modal.classList.add('open');
    },

    closeInstallModal: function () {
      const modal = document.getElementById('mousekinInstallModal');
      if (modal) modal.classList.remove('open');
    },

    triggerNativeInstall: async function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        try {
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            window.MousekinPWA.closeInstallModal();
          }
        } catch (err) {}
        deferredPrompt = null;
      }
    }
  };

  function createModal() {
    const overlay = document.createElement('div');
    overlay.id = 'mousekinInstallModal';
    overlay.className = 'mk-modal-overlay';
    overlay.innerHTML = `
      <div class="mk-modal-box">
        <button class="mk-modal-close-btn" onclick="MousekinPWA.closeInstallModal()" aria-label="Закрыть">✕</button>
        <div class="mk-modal-header">
          <div class="mk-modal-icon">
            <img src="/icons/icon-192.png" alt="Мышонок">
          </div>
          <div class="mk-modal-title">Установить сказку на телефон</div>
          <div class="mk-modal-desc">Приложение работает офлайн, без рекламы и без магазинов приложений!</div>
        </div>
        <div class="mk-modal-steps" id="mkModalSteps"></div>
        <button id="mkModalNativeBtn" class="mk-modal-btn-install" style="display:none;" onclick="MousekinPWA.triggerNativeInstall()">
          <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 3v13m0 0-4-4m4 4 4-4M5 19v2h14v-2"/></svg>
          Установить приложение
        </button>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        window.MousekinPWA.closeInstallModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.MousekinPWA.closeInstallModal();
      }
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  // 3. Inject "✨ Читать онлайн" and Language Switcher into Navigation Menus
  function enhanceMenu() {
    const currentPath = window.location.pathname.toLowerCase();
    let curLang = 'RU';
    if (currentPath.includes('/en') || currentPath.includes('/clocktown')) curLang = 'EN';
    else if (currentPath.includes('/de') || currentPath.includes('/uhrenstadt')) curLang = 'DE';

    const menuInfo = {
      RU: { text: 'Читать онлайн (PWA)', href: '/app/?lang=ru' },
      EN: { text: 'Read Online (PWA)', href: '/app/?lang=en' },
      DE: { text: 'Online lesen (PWA)', href: '/app/?lang=de' }
    }[curLang];

    // Determine current subpage for contextual switching
    let subSlug = '';
    if (currentPath.includes('heroes')) subSlug = 'heroes';
    else if (currentPath.includes('creators')) subSlug = 'creators';
    else if (currentPath.includes('about')) subSlug = 'about_project';
    else if (currentPath.includes('testimonials') || currentPath.includes('reviews')) subSlug = 'testimonials';
    else if (currentPath.includes('privacy')) subSlug = 'privacy';

    const ruHref = subSlug ? `/${subSlug}` : '/';
    const enHref = subSlug ? `/en/${subSlug}` : '/en';
    const deHref = subSlug ? `/de/${subSlug}` : '/de';

    const homeInfo = {
      RU: { text: 'На главную', href: '/' },
      EN: { text: 'To Home', href: '/en' },
      DE: { text: 'Zur Startseite', href: '/de' }
    }[curLang];

    const menus = document.querySelectorAll('.t280__menu, .t-menu__list');
    menus.forEach((menu) => {
      if (!menu.querySelector('.mk-menu-bar')) {
        const bar = document.createElement('div');
        bar.className = 'mk-menu-bar';
        bar.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <a href="${homeInfo.href}" class="mk-menu-home-btn" title="${homeInfo.text}">
              <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              <span>${homeInfo.text}</span>
            </a>
            <a href="${menuInfo.href}" class="mk-menu-read-btn">
              <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              ${menuInfo.text}
            </a>
          </div>
          <div class="mk-lang-switcher">
            <a href="${ruHref}" class="mk-lang-btn ${curLang === 'RU' ? 'active' : ''}">RU</a>
            <a href="${enHref}" class="mk-lang-btn ${curLang === 'EN' ? 'active' : ''}">EN</a>
            <a href="${deHref}" class="mk-lang-btn ${curLang === 'DE' ? 'active' : ''}">DE</a>
          </div>
        `;
        menu.prepend(bar);
      }
    });

    // Make Honey of Milky Way top logo clickable to return to home
    const logos = document.querySelectorAll('.t280__logo__content');
    logos.forEach((logo) => {
      if (!logo.closest('a')) {
        logo.style.cursor = 'pointer';
        logo.onclick = () => { window.location.href = homeInfo.href; };
      }
    });
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhanceMenu();
    });
  } else {
    enhanceMenu();
  }

})();
