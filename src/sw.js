/* Service worker: оболочка в кэше при установке, медиа в кэше при первом обращении или кнопке «офлайн».
   Range-запросы (аудио) обслуживаются вручную: без этого Safari не воспроизводит звук из кэша. */
const V = '__VERSION__';
const CORE = __CORE__;
const SHELL = 'shell-' + V;
const MEDIA = 'media-' + V;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function rangeResponse(req) {
  const url = req.url;
  let res = await caches.match(url);
  if (!res) {
    const net = await fetch(url);
    if (!net.ok) return net;
    const c = await caches.open(MEDIA);
    await c.put(url, net.clone());
    res = net;
  }
  const buf = await res.arrayBuffer();
  const len = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = 0, end = len - 1;
  if (m) {
    if (m[1] === '' && m[2] !== '') { start = Math.max(0, len - parseInt(m[2], 10)); }
    else {
      start = m[1] ? parseInt(m[1], 10) : 0;
      end = m[2] ? Math.min(parseInt(m[2], 10), len - 1) : len - 1;
    }
  }
  if (start > end || start >= len) {
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + len } });
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Length': String(end - start + 1),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + len,
      'Accept-Ranges': 'bytes',
    },
  });
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const net = await fetch(req);
  if (net.ok && net.status === 200) {
    const c = await caches.open(MEDIA);
    c.put(req, net.clone());
  }
  return net;
}

async function shellStrategy(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  const refresh = fetch(req).then(async (net) => {
    if (net.ok && net.status === 200) {
      const c = await caches.open(SHELL);
      await c.put(req, net.clone());
    }
    return net;
  });
  if (hit) {
    refresh.catch(() => {});
    return hit;
  }
  try {
    return await refresh;
  } catch (err) {
    if (req.mode === 'navigate') {
      const idx = await caches.match('index.html') || await caches.match('./');
      if (idx) return idx;
    }
    throw err;
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.has('range')) {
    e.respondWith(rangeResponse(req).catch(() => fetch(req)));
    return;
  }
  if (/\/(img|snd|thumbs|ui|icons)\//.test(url.pathname)) {
    e.respondWith(cacheFirst(req).catch(() => fetch(req)));
    return;
  }
  e.respondWith(shellStrategy(req));
});
