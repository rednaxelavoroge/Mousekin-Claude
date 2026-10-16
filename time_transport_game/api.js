/**
 * Модульный API для интеграции игры «ВРЕМЯ транспорт» с книгой «Мышонок»
 * 
 * Четыре точки стыка по ТЗ:
 * 1. Вход: книга даёт конфиг и вызывает TimeTransport.open({ vehicleId, sceneId })
 * 2. Выход: игра генерирует события ('completed', 'assembled', 'garage_saved')
 * 3. Прогресс: сохраняется в единое хранилище (localStorage / callback)
 * 4. Закрытие: TimeTransport.close() очищает слой и возвращает управление книге
 */

class TimeTransportAPI {
  constructor() {
    this.listeners = {};
    this.storageKey = 'mousekin_transport_progress_v1';
    this.isOpen = false;
    this.initPostMessageBridge();
  }

  // Загрузка сохранённого гаража игрока
  getProgress() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      assembled: [], // 'scooter', 'monowheel', 'bike', 'moped'
      lastPlayed: null,
      stars: 0
    };
  }

  saveProgress(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.emit('progress_updated', data);
    } catch (e) {}
  }

  markAssembled(vehicleId) {
    const p = this.getProgress();
    const first = !p.assembled.includes(vehicleId);
    if (first) {
      p.assembled.push(vehicleId);
      p.lastPlayed = vehicleId;
      p.stars += 1;
      this.saveProgress(p);
      this.emit('transport_assembled', { vehicleId, progress: p });
    }
    // книга должна узнать о завершении и при повторной сборке: после каждой игры — задание
    this.notifyParent({ type: 'TIME_TRANSPORT_ASSEMBLED', vehicleId, progress: p, repeat: !first });
  }

  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  off(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => {
        try { fn(data); } catch (err) { console.error(err); }
      });
    }
  }

  // Обмен сообщениями с родительским окном (если открыто в iframe / оверлее)
  notifyParent(message) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  }

  initPostMessageBridge() {
    window.addEventListener('message', (e) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'START_VEHICLE' && data.vehicleId) {
        if (window.TimeTransportGameApp) {
          window.TimeTransportGameApp.selectVehicle(data.vehicleId);
        }
      } else if (data.type === 'CLOSE_GAME') {
        this.close();
      }
    });
  }

  close() {
    this.emit('close', {});
    this.notifyParent({ type: 'TIME_TRANSPORT_CLOSED' });
  }
}

export const TransportBridge = new TimeTransportAPI();
window.TransportBridge = TransportBridge;
