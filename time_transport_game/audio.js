/**
 * Аудиосистема игры «ВРЕМЯ транспорт»
 * Сочетает студийные дорожки сказки «Мышонок» и мгновенный синтезатор Web Audio API
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicAudio = null;
    this.rideAudio = null;
    this.isMuted = false;
    this.musicEnabled = true;
    this.currentMusicSrc = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.musicAudio) {
      this.musicAudio.muted = this.isMuted;
    }
    if (this.rideAudio) {
      this.rideAudio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  // --- СИНТЕЗАТОР ЭФФЕКТОВ (Web Audio API) ---

  // Щелчок шестерёнки при взятии/отпускании
  playGearTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Волшебный щелчок при точной установке детали в паз
  playSnapSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Механический щелчок
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, t);
    osc1.frequency.exponentialRampToValueAtTime(1400, t + 0.06);
    gain1.gain.setValueAtTime(0.35, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // 2. Золотой перезвон (chime)
    [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      const delay = t + idx * 0.04;
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq, delay);
      gain2.gain.setValueAtTime(0.18, delay);
      gain2.gain.exponentialRampToValueAtTime(0.0001, delay + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(delay);
      osc2.stop(delay + 0.28);
    });
  }

  // Ошибка / деталь отпущена мимо
  playMiss() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Звонок будильника (Времясипед)
  playAlarmBell() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const time = t + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 1760 : 1975.5, time);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.05);
    }
  }

  // Мышиный гудок (Времямопед)
  playMouseHorn() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.linearRampToValueAtTime(1174.66, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Победный фанфарный аккорд при завершении сборки
  playCompletionFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + i * 0.08;
      const duration = 0.5;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // --- ВОСПРОИЗВЕДЕНИЕ СТУДИЙНЫХ АУДИОТРЕКОВ ---

  playMusic(src = 'assets/audio/theme_clocktown.mp3') {
    if (!this.musicEnabled) return;
    try {
      if (this.musicAudio && this.currentMusicSrc === src && !this.musicAudio.paused) {
        return;
      }
      if (this.musicAudio) {
        this.musicAudio.pause();
      }
      this.musicAudio = new Audio(src);
      this.musicAudio.loop = true;
      this.musicAudio.volume = 0.35;
      this.musicAudio.muted = this.isMuted;
      this.currentMusicSrc = src;
      this.musicAudio.play().catch(() => {
        // User gesture needed on mobile
      });
    } catch (e) {
      console.warn('Audio playback prevented:', e);
    }
  }

  stopMusic() {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
    }
  }

  playRideTrack() {
    try {
      if (!this.rideAudio) {
        this.rideAudio = new Audio('assets/audio/bicycle_ride.mp3');
        this.rideAudio.loop = true;
      }
      this.rideAudio.volume = 0.45;
      this.rideAudio.muted = this.isMuted;
      this.rideAudio.play().catch(() => {});
    } catch (e) {}
  }

  stopRideTrack() {
    if (this.rideAudio) {
      this.rideAudio.pause();
      this.rideAudio.currentTime = 0;
    }
  }

  playCharacterSfx(charKey) {
    if (this.isMuted) return;
    try {
      let file = null;
      if (charKey === 'cat') file = 'assets/audio/cat_purr.mp3';
      else if (charKey === 'snail') file = 'assets/audio/snail_shoes.mp3';
      else if (charKey === 'archivist') file = 'assets/audio/dust.mp3';
      else file = 'assets/audio/spring.mp3';

      if (file) {
        const sfx = new Audio(file);
        sfx.volume = 0.55;
        sfx.play().catch(() => {});
      }
    } catch (e) {}
  }
}

export const sound = new SoundEngine();
