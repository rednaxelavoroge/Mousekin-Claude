/* ========================================================
   Mousekin Clocktown — Modern Fairy-Tale Animations & PWA Controller
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
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

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
      // Configure steps based on platform
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

  // 3. Canvas Star Dust & Floating Gears in Hero Cover
  function initHeroCanvas() {
    const heroCover = document.querySelector('#rec11695452 .t-cover') || document.querySelector('.t-cover');
    if (!heroCover) return;

    // Ensure relative positioning
    heroCover.style.position = 'relative';

    const canvas = document.createElement('canvas');
    canvas.id = 'mousekinHeroCanvas';
    heroCover.insertBefore(canvas, heroCover.firstChild);

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = heroCover.offsetWidth);
    let height = (canvas.height = heroCover.offsetHeight);

    window.addEventListener('resize', () => {
      if (!heroCover) return;
      width = canvas.width = heroCover.offsetWidth;
      height = canvas.height = heroCover.offsetHeight;
    });

    // Particle definition: Golden Stars and Floating Gears
    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.7 + 0.3,
      alphaSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3
    }));

    const gears = [
      { x: width * 0.15, y: height * 0.25, r: 42, teeth: 10, angle: 0, speed: 0.004, alpha: 0.22 },
      { x: width * 0.85, y: height * 0.3, r: 60, teeth: 14, angle: 0, speed: -0.003, alpha: 0.25 },
      { x: width * 0.82, y: height * 0.75, r: 35, teeth: 8, angle: 0, speed: 0.005, alpha: 0.2 }
    ];

    function drawGear(g) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      ctx.strokeStyle = `rgba(245, 210, 110, ${g.alpha})`;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      const step = (Math.PI * 2) / (g.teeth * 2);
      for (let i = 0; i < g.teeth * 2; i++) {
        const rad = i % 2 === 0 ? g.r : g.r - 8;
        const a = i * step;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner hub circle
      ctx.beginPath();
      ctx.arc(0, 0, g.r * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    });
    observer.observe(heroCover);

    function animate() {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        // Animate and draw gears
        for (const g of gears) {
          g.angle += g.speed;
          drawGear(g);
        }

        // Animate and draw stars
        for (const s of stars) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < 0) s.x = width;
          if (s.x > width) s.x = 0;
          if (s.y < 0) s.y = height;
          if (s.y > height) s.y = 0;

          s.alpha += s.alphaSpeed;
          if (s.alpha > 0.95 || s.alpha < 0.2) {
            s.alphaSpeed = -s.alphaSpeed;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 235, 150, ${s.alpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  // 4. Floating Bottom Dock (Sliding Quick Launch)
  function initFloatingDock() {
    if (isStandalone) return; // Don't show inside standalone PWA

    const dock = document.createElement('div');
    dock.className = 'mk-dock';
    dock.id = 'mousekinDock';
    dock.innerHTML = `
      <div class="mk-dock-avatar">
        <img src="/icons/icon-192.png" alt="Мышонок">
      </div>
      <div class="mk-dock-info">
        <div class="mk-dock-title">Там, где заводится время</div>
        <div class="mk-dock-sub">Интерактивная книга (PWA)</div>
      </div>
      <a href="/app/" class="mk-dock-btn">
        <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Читать онлайн
      </a>
      <button class="mk-dock-btn" style="background:rgba(255,255,255,0.15);color:#fff!important;border:1px solid rgba(255,255,255,0.3);box-shadow:none;" onclick="MousekinPWA.openInstallModal()">
        📲 Установить
      </button>
      <button class="mk-dock-close" onclick="document.getElementById('mousekinDock').remove()" aria-label="Закрыть">✕</button>
    `;

    document.body.appendChild(dock);

    let dismissed = false;
    window.addEventListener('scroll', () => {
      if (dismissed) return;
      if (window.scrollY > 400) {
        dock.classList.add('visible');
      } else {
        dock.classList.remove('visible');
      }
    }, { passive: true });
  }

  // 5. Inject "✨ Читать онлайн" into Navigation Menus
  function enhanceMenu() {
    const menus = document.querySelectorAll('.t280__menu, .t-menu__list');
    menus.forEach((menu) => {
      if (!menu.querySelector('.mk-menu-read-btn')) {
        const btn = document.createElement('a');
        btn.className = 'mk-menu-read-btn';
        btn.href = '/app/';
        btn.innerHTML = `
          <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Читать онлайн
        `;
        menu.prepend(btn);
      }
    });
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initHeroCanvas();
      initFloatingDock();
      enhanceMenu();
    });
  } else {
    initHeroCanvas();
    initFloatingDock();
    enhanceMenu();
  }

})();
