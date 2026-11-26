// 콩콩 파티게임: 한 번 열면 인터넷 없이도 열리도록 파일을 저장해 둡니다.
// 게임을 고친 뒤에는 아래 버전 숫자를 올려 주세요.
const VERSION = 'kongkong-v10';
// 확대 사진 퀴즈 사진은 버전이 바뀌어도 지우지 않는 별도 보관함에 둡니다.
const IMG = 'kk-img';
const FILES = ['./', './index.html', './manifest.json', './kk-icon-192.png', './kk-icon-512.png', './kk-icon-maskable.png', './kk-apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== IMG).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 게임 파일: 인터넷이 되면 새 버전을, 안 되면 저장해 둔 버전을 씁니다
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // 확대 사진 퀴즈 사진: 저장해 둔 것을 먼저 쓰고, 없으면 받아서 저장합니다
  if (url.hostname === 'upload.wikimedia.org' || url.hostname === 'thumb.wikimedia.org') {
    e.respondWith(caches.open(IMG).then(c => c.match(req.url).then(hit => hit ||
      fetch(req.url, { mode: 'cors', credentials: 'omit' }).then(r => { if (r.ok) c.put(req.url, r.clone()); return r; })
        .catch(() => fetch(req)))));
    return;
  }
  // 글꼴: 저장해 둔 것을 먼저 씁니다
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })));
  }
});
