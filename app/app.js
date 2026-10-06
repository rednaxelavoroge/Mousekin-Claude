/* Движок ридера для Tigerbooks/Oskar picture book.
   Читает data/book.json и data/scene_NNN.json, которые собрал build.py из оригинального APK. */
(() => {
'use strict';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('mp.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mp.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};

const I18N = {
  RU: { open: 'Открыть книгу', ios: 'Чтобы установить на iPhone: Поделиться → На экран «Домой»', tap: 'Нажмите, чтобы включить звук',
        dl: 'Скачиваю для офлайна', dlDone: 'Готово: книга работает без интернета', dlFail: 'Не удалось скачать часть файлов', page: 'Страницы',
        closeText: 'Закрыть субтитры', text: 'Субтитры', home: 'На сайт' },
  EN: { open: 'Open the book', ios: 'To install on iPhone: Share → Add to Home Screen', tap: 'Tap to turn on sound',
        dl: 'Downloading for offline', dlDone: 'Done: the book works offline', dlFail: 'Some files failed to download', page: 'Pages',
        closeText: 'Hide subtitles', text: 'Subtitles', home: 'To website' },
  DE: { open: 'Buch öffnen', ios: 'Installation auf dem iPhone: Teilen → Zum Home-Bildschirm', tap: 'Tippen, um den Ton einzuschalten',
        dl: 'Lade für Offline herunter', dlDone: 'Fertig: Das Buch funktioniert offline', dlFail: 'Einige Dateien konnten nicht geladen werden', page: 'Seiten',
        closeText: 'Untertitel ausblenden', text: 'Untertitel', home: 'Zur Website' },
};

let book = null, lang = 'RU', cur = -1, busy = false, tickMs = 50, curScene = null, started = false;
const S = { narr: store.get('narr', true), sfx: store.get('sfx', true), text: store.get('text', true), hints: store.get('hints', true) };
const dataCache = new Map();
const L = { vw: 0, vh: 0, portrait: false, topPad: 56, safeT: 0, safeB: 0 };
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const t = (k) => (I18N[lang] || I18N.EN)[k];

/* ------------------------------------------------------------ утилиты */
async function fetchJSON(u) {
  const r = await fetch(u);
  if (!r.ok) throw new Error(u + ' ' + r.status);
  return r.json();
}
function toast(msg, ms) {
  const el = $('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, ms || 2600);
}
function loadImg(url) {
  return new Promise((res) => { const im = new Image(); im.onload = im.onerror = () => res(); im.src = url; });
}
function withTimeout(p, ms) { return Promise.race([p, new Promise((r) => setTimeout(r, ms))]); }

/* ---------------------------------------------------------------- звук */
const Aud = {
  narr: new Audio(), amb: new Audio(), pool: [new Audio(), new Audio(), new Audio(), new Audio()],
  ok: false, ambUrl: null, resume: [],
  init() {
    for (const a of [this.narr, this.amb, ...this.pool]) { a.preload = 'auto'; a.setAttribute('playsinline', ''); }
    this.amb.loop = true;
    const duck = () => this.duck();
    this.narr.addEventListener('play', duck);
    this.narr.addEventListener('pause', duck);
    this.narr.addEventListener('ended', () => { duck(); clearHighlight(); });
  },
  unlock() {
    if (this.ok) return;
    this.ok = true;
    const silent = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    for (const a of [this.narr, this.amb, ...this.pool]) {
      try { a.src = silent; const p = a.play(); if (p && p.then) p.then(() => a.pause()).catch(() => {}); } catch (e) { /* ignore */ }
    }
  },
  duck() { this.amb.volume = (!this.narr.paused && !this.narr.ended) ? 0.28 : 0.7; },
  stopNarr() { try { this.narr.pause(); } catch (e) {} clearHighlight(); },
  playNarr(url) {
    if (!S.narr || !url) return;
    this.narr.loop = false;
    this.narr.src = url;
    const p = this.narr.play();
    if (p && p.catch) p.catch(() => toast(t('tap'), 3200));
  },
  ambient(url) {
    if (!S.sfx || !url) return;
    if (this.ambUrl !== url) { this.ambUrl = url; this.amb.src = url; }
    this.duck();
    const p = this.amb.play();
    if (p && p.catch) p.catch(() => {});
  },
  stopAmbient() {
    const a = this.amb;
    this.ambUrl = null;
    const v0 = a.volume, t0 = performance.now();
    (function fade(now) {
      const k = Math.min(1, (now - t0) / 350);
      a.volume = v0 * (1 - k);
      if (k < 1) requestAnimationFrame(fade); else { a.pause(); Aud.duck(); }
    })(t0);
  },
  sfx(url, sid) {
    if (!S.sfx || !url) return;
    for (const a of this.pool) if (a.dataset.sid === sid && !a.paused && !a.ended) return; // не накладывать тот же звук
    const el = this.pool.find((a) => a.paused || a.ended) || this.pool[0];
    el.dataset.sid = sid; el.loop = false; el.src = url; el.volume = 1;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  },
  pauseAll() {
    this.resume = [this.narr, this.amb, ...this.pool].filter((a) => !a.paused && !a.ended);
    this.resume.forEach((a) => a.pause());
  },
  resumeAll() { this.resume.forEach((a) => { const p = a.play(); if (p && p.catch) p.catch(() => {}); }); this.resume = []; },
  applyToggles() {
    if (!S.sfx) { this.pool.forEach((a) => a.pause()); this.amb.pause(); } else if (curScene && this.ambUrl) { this.amb.play().catch(() => {}); }
    if (!S.narr) this.stopNarr();
  },
};

function playSound(sc, sid, loop) {
  const url = sc.d.sounds[sid];
  if (!url) return;
  if (loop) { Aud.ambient(url); return; }
  if (/Narration(EN|RU|DE)_mp3_id$/.test(sid)) {      // озвучка названия: тот же канал, что и чтение текста
    if (!S.narr) return;
    Aud.playNarr(url);
    return;
  }
  Aud.sfx(url, sid);
}

/* ----------------------------------------------------------- анимации */
const running = new Set();
let raf = 0;

function decode(sc, rec, si) {
  const key = si + '|' + rec.o.i;
  let c = sc.cache.get(key);
  if (c) return c;
  const flat = sc.d.seqs[si];
  let n = 0;
  for (let i = 0; i < flat.length; n++) {
    const mask = flat[i + 1];
    i += 2 + ((mask & 1) ? 2 : 0) + ((mask & 2) ? 1 : 0) + ((mask & 4) ? 2 : 0) + ((mask & 8) ? 1 : 0);
  }
  const T = new Int32Array(n), ST = new Float32Array(n * 6);
  let x = rec.px, y = rec.py, r = rec.o.r, sx = rec.o.sx, sy = rec.o.sy, a = rec.o.o, tick = 0, f = 0;
  for (let i = 0; i < flat.length; f++) {
    const m = flat[i], mask = flat[i + 1];
    i += 2;
    if (mask & 1) { x = flat[i++]; y = flat[i++]; }
    if (mask & 2) { r = flat[i++]; }
    if (mask & 4) { sx = flat[i++]; sy = flat[i++]; }
    if (mask & 8) { a = flat[i++]; }
    T[f] = tick;
    tick += m > 0 ? m : 1;
    const b = f * 6;
    ST[b] = x; ST[b + 1] = y; ST[b + 2] = r; ST[b + 3] = sx; ST[b + 4] = sy; ST[b + 5] = a;
  }
  c = { T, ST, n, D: tick };
  sc.cache.set(key, c);
  return c;
}

function applyFrame(tr, f) {
  const ST = tr.d.ST, b = f * 6, rec = tr.rec;
  rec.el.style.transform = 'translate(' + (ST[b] - rec.px) + 'px,' + (ST[b + 1] - rec.py) + 'px) rotate(' +
    ST[b + 2] + 'deg) scale(' + ST[b + 3] + ',' + ST[b + 4] + ')';
  rec.el.style.opacity = ST[b + 5];
  tr.f = f;
}

function startAnim(sc, id) {
  const a = sc.d.anims[id];
  if (!a || (a.l && a.l !== lang) || sc.running.has(id)) return false;
  const tracks = [];
  for (const [oid, si, rep] of a.t) {
    const rec = sc.els.get(oid);
    if (!rec) continue;
    const d = decode(sc, rec, si);
    if (!d.n) continue;
    tracks.push({ rec, d, loop: rep === 0, f: -1, end: false });
  }
  if (!tracks.length) return false;
  const inst = { sc, id, tracks, t0: performance.now() };
  sc.running.set(id, inst);
  running.add(inst);
  for (const tr of tracks) { tr.rec.cur = tr; applyFrame(tr, 0); }
  if (!raf) raf = requestAnimationFrame(loop);
  return true;
}

function loop(now) {
  raf = 0;
  for (const inst of running) {
    const tk = Math.floor((now - inst.t0) / tickMs);
    let alive = false;
    for (const tr of inst.tracks) {
      if (tr.rec.cur !== tr || tr.end) continue;
      const d = tr.d;
      let tt = tk;
      if (tr.loop) tt = d.D ? tt % d.D : 0;
      else if (tt >= d.D) { if (tr.f !== d.n - 1) applyFrame(tr, d.n - 1); tr.end = true; continue; }
      let f = tr.f;
      if (f < 0 || tt < d.T[f]) { f = 0; tr.f = -1; }
      while (f + 1 < d.n && d.T[f + 1] <= tt) f++;
      if (f !== tr.f) applyFrame(tr, f);
      alive = true;
    }
    if (!alive) { running.delete(inst); inst.sc.running.delete(inst.id); }
  }
  updateHighlight();
  if (running.size || (!Aud.narr.paused && !Aud.narr.ended)) raf = requestAnimationFrame(loop);
}
function kick() { if (!raf) raf = requestAnimationFrame(loop); }

/* -------------------------------------------------------------- сцена */
class Scene {
  constructor(idx, d) {
    this.idx = idx; this.d = d; this.cache = new Map(); this.els = new Map(); this.running = new Map();
    this.touchables = []; this.region = d.region; this.s = 1;
  }
  build() {
    const d = this.d;
    const box = this.box = document.createElement('div'); box.className = 'box';
    const cv = this.canvas = document.createElement('div'); cv.className = 'canvas';
    if (d.bg) { const bg = new Image(); bg.className = 'bg'; bg.draggable = false; bg.src = d.bg; cv.appendChild(bg); }
    d.objs.forEach((o, z) => {
      if (o.l && o.l !== lang) return;
      const el = document.createElement('div');
      el.className = 'o';
      el.style.cssText = 'left:' + o.x + 'px;top:' + o.y + 'px;width:' + o.w + 'px;height:' + o.h +
        'px;transform-origin:' + (o.a[0] * 100) + '% ' + (o.a[1] * 100) + '%;opacity:' + o.o + ';z-index:' + (z + 1) +
        ';transform:rotate(' + o.r + 'deg) scale(' + o.sx + ',' + o.sy + ')';
      if (o.s) { const im = new Image(); im.decoding = 'async'; im.draggable = false; im.src = o.s; el.appendChild(im); }
      cv.appendChild(el);
      const rec = { o, el, px: o.x + o.a[0] * o.w, py: o.y + o.a[1] * o.h, touch: d.touch[o.i] || null, cur: null };
      this.els.set(o.i, rec);
      if (rec.touch) this.touchables.push(rec);
    });
    const hint = this.hintEl = document.createElement('div');
    hint.className = 'hint';
    if (book.hintImg) { const im = new Image(); im.src = book.hintImg; hint.appendChild(im); }
    cv.appendChild(hint);
    box.appendChild(cv);
    const sh = document.createElement('div'); sh.className = 'shade'; box.appendChild(sh);
  }
  layout() {
    const rw = this.region[2], rh = this.region[3];
    let s, bx, by;
    if (L.portrait) { s = L.vw / rw; bx = 0; by = L.topPad; }
    else { s = Math.min(L.vw / rw, L.vh / rh); bx = (L.vw - rw * s) / 2; by = (L.vh - rh * s) / 2; }
    this.s = s; this.bx = bx; this.by = by; this.bw = rw * s; this.bh = rh * s;
    const st = this.box.style;
    st.left = bx + 'px'; st.top = by + 'px'; st.width = this.bw + 'px'; st.height = this.bh + 'px';
    this.canvas.style.transform = 'translate(' + (-this.region[0] * s) + 'px,' + (-this.region[1] * s) + 'px) scale(' + s + ')';
  }
  hit(cx, cy) {
    const bb = this.box.getBoundingClientRect();
    if (cx < bb.left || cx > bb.right || cy < bb.top || cy > bb.bottom) return null;
    for (let i = this.touchables.length - 1; i >= 0; i--) {
      const r = this.touchables[i];
      if (r.o.s && parseFloat(r.el.style.opacity) < 0.05) continue;
      const b = r.el.getBoundingClientRect();
      if (cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom) return r;
    }
    return null;
  }
  start() {
    for (const [anim, snd, loopSnd] of this.d.start) {
      if (snd) playSound(this, snd, !!loopSnd);
      if (anim) startAnim(this, anim);
    }
  }
  stop() {
    for (const inst of this.running.values()) running.delete(inst);
    this.running.clear();
  }
  trigger(rec) {
    for (const [anim, snd, loopSnd] of rec.touch) {
      if (snd) playSound(this, snd, !!loopSnd);
      if (anim) startAnim(this, anim);
    }
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
  }
}

/* -------------------------------------------------------------- макет */
function measureSafe() {
  const p = document.createElement('div');
  p.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(p);
  const cs = getComputedStyle(p);
  L.safeT = parseFloat(cs.paddingTop) || 0; L.safeB = parseFloat(cs.paddingBottom) || 0;
  p.remove();
}
function layout() {
  L.vw = window.innerWidth; L.vh = window.innerHeight;
  L.portrait = L.vh > L.vw * 1.15;
  L.topPad = L.safeT + 58;
  for (const el of document.querySelectorAll('.box')) if (el._scene) el._scene.layout();
  layoutText();
}
function layoutText() {
  const sc = curScene, p = $('textPanel');
  if (!sc) return;
  const tx = sc.d.text[lang];
  const base = tx ? tx.fs / 26 : 1;
  const st = p.style;
  for (const id of ['navPrev', 'navNext']) $(id).style.top = L.portrait ? (sc.by + sc.bh / 2) + 'px' : '';
  if (L.portrait) {
    const fs = Math.max(16, Math.min(24, L.vw * 0.046)) * base;
    st.fontSize = fs + 'px';
    st.left = '10px'; st.right = '10px'; st.width = 'auto';
    st.top = (sc.by + sc.bh + 10) + 'px'; st.bottom = 'auto'; st.maxHeight = 'none';
  } else {
    const fs = Math.max(15, Math.min(24, 21 * sc.s * 1.08)) * base;
    const pw = Math.min(sc.bw * 0.88, 820);
    st.fontSize = fs + 'px';
    st.width = pw + 'px'; st.right = 'auto'; st.left = (sc.bx + (sc.bw - pw) / 2) + 'px';
    st.top = 'auto'; st.bottom = Math.max(12, L.vh - (sc.by + sc.bh) + 12) + 'px'; st.maxHeight = 'none';
  }
}

/* ----------------------------------------------- текст и озвучка слов */
let words = [], timing = [], hlIdx = -1, textLines = [], curLineIdx = -1;

function buildSubtitleLines(tx) {
  if (!tx || !tx.tok) return [];
  const paragraphs = [];
  let curP = [], wIdx = 0;
  for (const tok of tx.tok) {
    if (tok === '\n') {
      if (curP.length) paragraphs.push(curP);
      curP = [];
    } else {
      curP.push({ tok, i: wIdx, t: tx.t ? tx.t[wIdx] : null });
      wIdx++;
    }
  }
  if (curP.length) paragraphs.push(curP);

  const lines = [];
  for (const p of paragraphs) {
    let curLine = [], curLen = 0;
    for (const item of p) {
      const tok = item.tok;
      const addLen = tok.length + (curLine.length ? 1 : 0);
      curLine.push(item);
      curLen += addLen;
      const isSentEnd = /[.!?…]$/.test(tok) || tok.endsWith('...') || tok.endsWith('?!') || tok.endsWith('!?');
      const isClauseEnd = /[,;:—–-]$/.test(tok);
      if (isSentEnd && curLine.length >= 3) {
        lines.push(curLine);
        curLine = []; curLen = 0;
      } else if ((curLen >= 45 || curLine.length >= 8) && isClauseEnd) {
        lines.push(curLine);
        curLine = []; curLen = 0;
      } else if (curLen >= 65 || curLine.length >= 12) {
        lines.push(curLine);
        curLine = []; curLen = 0;
      }
    }
    if (curLine.length) lines.push(curLine);
  }

  return lines.map((ln) => {
    const start = ln[0].t ? ln[0].t[0] : 0;
    const end = ln[ln.length - 1].t ? ln[ln.length - 1].t[1] : 9999;
    return { tokens: ln, start, end };
  });
}

function showSubtitleLine(idx) {
  if (idx < 0 || idx >= textLines.length) return;
  curLineIdx = idx;
  const inner = $('textInner');
  inner.textContent = '';
  words = [];
  const line = textLines[idx];
  const frag = document.createDocumentFragment();
  for (const item of line.tokens) {
    const sp = document.createElement('span');
    sp.className = 'w';
    sp.dataset.i = item.i;
    sp.textContent = item.tok;
    frag.appendChild(sp);
    frag.appendChild(document.createTextNode(' '));
    words.push(sp);
  }
  inner.appendChild(frag);
  if (hlIdx >= 0) {
    const active = words.find((w) => +w.dataset.i === hlIdx);
    if (active) active.classList.add('on');
  }
}

function renderText(sc) {
  const p = $('textPanel'), inner = $('textInner');
  const tx = sc.d.text[lang];
  inner.textContent = '';
  words = []; timing = []; hlIdx = -1; textLines = []; curLineIdx = -1;
  if (!tx || !sc.d.tb.visible) { p.hidden = true; return; }
  inner.style.setProperty('--hl', tx.color || '#91bac1');
  timing = tx.t || [];
  textLines = buildSubtitleLines(tx);
  p.hidden = false;
  p.classList.toggle('off', !S.text);
  if (textLines.length) showSubtitleLine(0);
  layoutText();
}

function clearHighlight() {
  if (hlIdx >= 0) {
    for (const w of words) if (+w.dataset.i === hlIdx) w.classList.remove('on');
  }
  hlIdx = -1;
}

function updateHighlight() {
  if (!textLines.length) return;
  const a = Aud.narr;
  if (a.paused && !a.ended) return;
  const ct = a.currentTime;

  let activeLineIdx = 0;
  for (let i = 0; i < textLines.length; i++) {
    const ln = textLines[i], nxt = textLines[i + 1];
    const until = nxt ? nxt.start : ln.end + 0.35;
    if (ct >= ln.start && ct < until) { activeLineIdx = i; break; }
    if (ct >= until) activeLineIdx = i;
  }
  if (activeLineIdx !== curLineIdx) {
    showSubtitleLine(activeLineIdx);
  }

  let idx = -1;
  for (let i = 0; i < timing.length; i++) {
    const tm = timing[i];
    if (!tm) continue;
    if (tm[0] <= ct) idx = i; else break;
  }
  if (idx >= 0) {
    const tm = timing[idx], nxt = timing[idx + 1];
    const until = Math.max(tm[1], nxt ? nxt[0] : tm[1]) + 0.05;
    if (ct > until + 0.35) idx = -1;
  }
  if (idx === hlIdx) return;
  if (hlIdx >= 0) {
    for (const w of words) if (+w.dataset.i === hlIdx) w.classList.remove('on');
  }
  hlIdx = idx;
  if (idx >= 0) {
    for (const w of words) {
      if (+w.dataset.i === idx) w.classList.add('on');
    }
  }
}

function narrate(sc) {
  Aud.stopNarr();
  const tx = sc.d.text[lang];
  if (tx && tx.audio) Aud.playNarr(tx.audio);
  kick();
}

/* ------------------------------------------------------------ подсказки */
const Hints = {
  timer: 0, idx: 0, pass: 0, sc: null,
  cfg(k, d) { const v = parseFloat(book.hint && book.hint[k]); return isNaN(v) ? d : v; },
  reset(sc) {
    this.stop(); this.sc = sc; this.idx = 0; this.pass = 0;
    this.schedule(this.cfg('initial_wait', 2.8) * 1000);
  },
  stop() { clearTimeout(this.timer); if (this.sc) this.sc.hintEl.classList.remove('on'); },
  schedule(ms) {
    clearTimeout(this.timer);
    if (!S.hints || !this.sc || !this.sc.touchables.length) return;
    this.timer = setTimeout(() => this.show(), ms);
  },
  show() {
    const sc = this.sc;
    if (!sc || sc !== curScene || this.pass >= this.cfg('repeat', 1)) return;
    const list = sc.touchables;
    const rec = list[this.idx % list.length];
    this.idx++;
    if (this.idx >= list.length) { this.idx = 0; this.pass++; }
    const b = rec.el.getBoundingClientRect(), cb = sc.canvas.getBoundingClientRect();
    const cx = (b.left + b.width / 2 - cb.left) / sc.s, cy = (b.top + b.height / 2 - cb.top) / sc.s;
    const vis = sc.region;
    if (cx < 0 || cx > 1024 || cy < vis[1] || cy > vis[1] + vis[3] || (rec.o.s && parseFloat(rec.el.style.opacity) < 0.05)) {
      this.schedule(200); return;
    }
    const h = sc.hintEl;
    h.style.left = cx + 'px'; h.style.top = cy + 'px';
    h.classList.add('on');
    const dur = this.cfg('duration', 3.3) * 1000;
    this.timer = setTimeout(() => { h.classList.remove('on'); this.schedule(this.cfg('delay', 3) * 1000); }, dur);
  },
  interacted() { this.stop(); this.schedule(this.cfg('postpone_wait', 2) * 1000); },
};

/* ------------------------------------------------------------ навигация */
async function loadScene(n) {
  let d = dataCache.get(n);
  if (!d) { d = await fetchJSON(book.scenes[n].data); dataCache.set(n, d); }
  return d;
}
async function preload(d) {
  const urls = new Set();
  if (d.bg) urls.add(d.bg);
  for (const o of d.objs) if (o.s && (!o.l || o.l === lang)) urls.add(o.s);
  await withTimeout(Promise.all([...urls].map(loadImg)), 9000);
}
function prefetchNeighbours(n) {
  for (const k of [n + 1, n - 1]) {
    if (k < 0 || k >= book.scenes.length) continue;
    loadScene(k).then((d) => { const bg = d.bg; if (bg) loadImg(bg); for (const o of d.objs) if (o.s && (!o.l || o.l === lang)) loadImg(o.s); }).catch(() => {});
  }
}
function updateNav() {
  $('navPrev').disabled = cur <= 0;
  $('navNext').disabled = cur >= book.scenes.length - 1;
  $('pageNo').textContent = (cur + 1) + ' / ' + book.scenes.length;
}

async function goTo(n, opts) {
  opts = opts || {};
  if (busy || n < 0 || n >= book.scenes.length || (n === cur && !opts.force)) return;
  busy = true;
  $('loader').hidden = false;
  try {
    const d = await loadScene(n);
    await preload(d);
    const old = curScene;
    const dir = opts.dir != null ? opts.dir : (n >= cur ? 1 : -1);
    const sc = new Scene(n, d);
    sc.build();
    sc.box._scene = sc;
    $('viewport').appendChild(sc.box);
    sc.layout();
    const animate = !!old && !opts.instant && !reduceMotion;
    Aud.stopNarr();
    if (old) old.stop();
    Hints.stop();
    $('loader').hidden = true;

    const finish = () => {
      if (old) old.box.remove();
      sc.box.style.transition = ''; sc.box.style.transform = ''; sc.box.classList.remove('turning'); sc.box.style.zIndex = '';
    };
    const enter = () => {
      curScene = sc; cur = n;
      renderText(sc); updateNav();
      if (!opts.keepAmbient) { if (Aud.ambUrl) Aud.stopAmbient(); }
      sc.start(); narrate(sc); Hints.reset(sc);
      store.set('page', n);
      prefetchNeighbours(n);
    };

    if (!animate) { finish(); enter(); busy = false; return; }

    const DUR = 760;
    if (dir > 0) {
      old.box.style.zIndex = 3; sc.box.style.zIndex = 2;
      old.box.classList.add('turning');
      old.box.style.transition = 'transform ' + DUR + 'ms cubic-bezier(.55,.05,.25,1)';
      requestAnimationFrame(() => requestAnimationFrame(() => { old.box.style.transform = 'rotateY(-108deg)'; }));
    } else {
      sc.box.style.zIndex = 3; old.box.style.zIndex = 2;
      sc.box.classList.add('turning');
      sc.box.style.transform = 'rotateY(-108deg)';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        sc.box.style.transition = 'transform ' + DUR + 'ms cubic-bezier(.25,.05,.45,1)';
        sc.box.style.transform = 'rotateY(0deg)';
      }));
    }
    setTimeout(enter, DUR * 0.5);
    await new Promise((r) => setTimeout(r, DUR + 40));
    finish();
  } catch (e) {
    console.error(e);
    $('loader').hidden = true;
  } finally {
    busy = false;
  }
}
const next = () => goTo(cur + 1, { dir: 1 });
const prev = () => goTo(cur - 1, { dir: -1 });

/* --------------------------------------------------------------- ввод */
let lastHit = 0;
function bindInput() {
  const app = $('app');
  let down = null;
  app.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ui,#pages,#start,#textClose')) { down = null; return; }
    down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, inText: !!e.target.closest('#textPanel') };
  });
  app.addEventListener('pointercancel', () => { down = null; });
  app.addEventListener('pointerup', (e) => {
    if (!down || down.id !== e.pointerId) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y, dt = performance.now() - down.t;
    const d = down; down = null;
    if (busy) return;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 900) { dx < 0 ? next() : prev(); return; }
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14 && curScene && !d.inText) {
      const rec = curScene.hit(e.clientX, e.clientY);   // клик по панели текста не срабатывает по скрытым под ней объектам сцены
      if (rec) { lastHit = performance.now(); curScene.trigger(rec); Hints.interacted(); }
    }
  });
  window.addEventListener('keydown', (e) => {
    if (!started || !$('pages').hidden) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  });
  $('navPrev').onclick = prev; $('navNext').onclick = next;

  $('textInner').addEventListener('click', (e) => {
    if (performance.now() - lastHit < 500) return;
    const w = e.target.closest('.w');
    const a = Aud.narr;
    if (w) {
      const tm = timing[+w.dataset.i];
      if (tm && curScene && curScene.d.text[lang] && curScene.d.text[lang].audio) {
        if (!S.narr) { S.narr = true; store.set('narr', true); syncToggles(); }
        if (!a.src || !a.src.endsWith(curScene.d.text[lang].audio)) a.src = curScene.d.text[lang].audio;
        const go = () => { a.currentTime = tm[0]; const p = a.play(); if (p && p.catch) p.catch(() => {}); kick(); };
        if (a.readyState >= 1) go(); else a.addEventListener('loadedmetadata', go, { once: true });
      }
    } else if (curScene && curScene.d.text[lang] && curScene.d.text[lang].audio) {
      if (a.paused || a.ended) { if (a.ended || !a.src) { narrateForce(); } else { a.play().catch(() => {}); kick(); } }
      else a.pause();
    }
  });
}
function narrateForce() {
  if (!S.narr) { S.narr = true; store.set('narr', true); syncToggles(); }
  if (curScene) narrate(curScene);
}

/* -------------------------------------------------------- панель страниц */
function buildPages() {
  const g = $('pagesGrid');
  g.textContent = '';
  book.scenes.forEach((sc, i) => {
    const b = document.createElement('button');
    if (i === cur) b.className = 'cur';
    const src = sc.thumbs[lang] || sc.thumbs[''] || sc.bg;
    if (src) { const im = new Image(); im.loading = 'lazy'; im.src = src; im.alt = ''; b.appendChild(im); }
    const sp = document.createElement('span'); sp.textContent = i + 1; b.appendChild(sp);
    b.onclick = () => { $('pages').hidden = true; goTo(i, { dir: i > cur ? 1 : -1 }); };
    g.appendChild(b);
  });
}

/* ------------------------------------------------------ язык и настройки */
function buildLangButtons(host, onPick) {
  host.textContent = '';
  for (const l of book.langs) {
    const b = document.createElement('button');
    b.textContent = l; b.dataset.l = l;
    b.className = l === lang ? 'on' : '';
    b.onclick = () => onPick(l);
    host.appendChild(b);
  }
}
function syncLangButtons() {
  for (const host of [$('langs'), $('startLangs')]) for (const b of host.children) b.classList.toggle('on', b.dataset.l === lang);
  document.documentElement.lang = lang.toLowerCase();
  $('startBtn').textContent = t('open');
  if ($('textClose')) $('textClose').title = $('textClose').ariaLabel = t('closeText');
  if ($('btnText')) $('btnText').title = $('btnText').ariaLabel = t('text');
  if ($('btnHome')) $('btnHome').title = $('btnHome').ariaLabel = t('home');
}
function setLang(l) {
  if (l === lang) return;
  lang = l; store.set('lang', l);
  syncLangButtons();
  if (started && curScene) goTo(cur, { force: true, instant: true, keepAmbient: true });
  refreshOfflineBadge();
}
function syncToggles() {
  $('btnNarr').classList.toggle('muted', !S.narr);
  $('btnSfx').classList.toggle('muted', !S.sfx);
  $('btnText').classList.toggle('muted', !S.text);
  $('textPanel').classList.toggle('off', !S.text);
}
function bindToolbar() {
  $('btnNarr').onclick = () => { S.narr = !S.narr; store.set('narr', S.narr); syncToggles(); if (S.narr) narrateForce(); else Aud.stopNarr(); };
  $('btnSfx').onclick = () => { S.sfx = !S.sfx; store.set('sfx', S.sfx); syncToggles(); Aud.applyToggles(); if (S.sfx && curScene) curScene.d.start.forEach(([, snd, lp]) => { if (snd && lp) playSound(curScene, snd, true); }); };
  $('btnText').onclick = () => { S.text = !S.text; store.set('text', S.text); syncToggles(); };
  $('textClose').onclick = () => { S.text = false; store.set('text', false); syncToggles(); };
  $('btnPages').onclick = () => { buildPages(); $('pages').hidden = false; };
  $('pagesClose').onclick = () => { $('pages').hidden = true; };
}

/* --------------------------------------------------------------- офлайн */
let assetsList = null;
async function refreshOfflineBadge() {
  const btn = $('btnOffline');
  btn.classList.toggle('done', !!store.get('off.' + book.v + '.' + lang, false));
}
async function downloadOffline() {
  const btn = $('btnOffline'), badge = $('offlineBadge');
  if (!('caches' in window)) { toast('Offline is not supported in this browser'); return; }
  try {
    if (!assetsList) assetsList = await fetchJSON('data/assets.json');
    const urls = [...new Set([...(assetsList.common || []), ...(assetsList[lang] || [])])];
    const cache = await caches.open('media-' + book.v);
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    toast(t('dl') + ' (' + urls.length + ')', 3000);
    let done = 0, failed = 0, i = 0;
    badge.classList.add('show');
    const worker = async () => {
      while (i < urls.length) {
        const u = urls[i++];
        try { if (!(await cache.match(u))) await cache.add(u); } catch (e) { failed++; }
        done++; badge.textContent = Math.round(done * 100 / urls.length) + '%';
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    badge.classList.remove('show');
    if (failed) { toast(t('dlFail') + ': ' + failed, 4000); }
    else { store.set('off.' + book.v + '.' + lang, true); btn.classList.add('done'); toast(t('dlDone'), 3500); }
  } catch (e) {
    console.error(e); badge.classList.remove('show'); toast(t('dlFail'), 4000);
  }
}

/* ----------------------------------------------------------------- старт */
async function boot() {
  Aud.init();
  measureSafe();
  try { book = await fetchJSON('data/book.json'); }
  catch (e) { $('startNote').textContent = 'data/book.json: ' + e.message; return; }
  tickMs = book.tickMs || 50;
  const nav = (navigator.language || 'en').slice(0, 2).toUpperCase();
  const urlLang = (new URLSearchParams(location.search).get('lang') || '').toUpperCase();
  lang = (urlLang && book.langs.includes(urlLang)) ? urlLang : (store.get('lang', null) || (book.langs.includes(nav) ? nav : book.defaultLang));
  document.title = book.title;
  $('startTitle').textContent = book.title;
  $('startAuthor').textContent = book.author || '';
  if (book.cover) $('startBg').style.backgroundImage = 'url(' + book.cover + ')';
  buildLangButtons($('langs'), setLang);
  buildLangButtons($('startLangs'), setLang);
  syncLangButtons(); syncToggles();
  bindInput(); bindToolbar();
  $('btnOffline').onclick = downloadOffline;
  refreshOfflineBadge();
  layout();
  let rz = 0;
  const onResize = () => { clearTimeout(rz); rz = setTimeout(layout, 60); };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  document.addEventListener('visibilitychange', () => { if (document.hidden) Aud.pauseAll(); else Aud.resumeAll(); });

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (ios && !standalone) $('startNote').textContent = t('ios');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const b = $('btnInstall'); b.hidden = false;
    b.onclick = async () => { b.hidden = true; e.prompt(); try { await e.userChoice; } catch (x) {} };
  });

  const sb = $('startBtn');
  sb.disabled = false;
  sb.onclick = async () => {
    Aud.unlock();
    started = true;
    sb.disabled = true;
    const first = (() => { const p = store.get('page', 0); return typeof p === 'number' && p >= 0 && p < book.scenes.length ? p : 0; })();
    ['topbar', 'navPrev', 'navNext', 'pageNo'].forEach((id) => { $(id).hidden = false; });
    await goTo(first, { instant: true });
    $('start').style.transition = 'opacity .5s'; $('start').style.opacity = 0;
    setTimeout(() => { $('start').hidden = true; }, 520);
  };

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  }
  window.__mp = { goTo, next, prev, get scene() { return curScene; }, get lang() { return lang; }, setLang, S, Aud, running };
}
boot();
})();
