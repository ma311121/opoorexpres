/* =========================================================================
   عبور إكسبريس — Service Worker (v5.0)
   • صفحات و JS: الشبكة أولاً (تصل التحديثات الأمنية فوراً) ثم الكاش دون اتصال.
   • الأيقونات والصور: الكاش أولاً مع تحديث في الخلفية.
   • الطلبات الخارجية (Supabase وCDN) لا يتدخل فيها نهائياً — لا تُخزَّن بيانات المستخدمين.
   عند أي تحديث للملفات غيّر CACHE_VERSION.
   ========================================================================= */
const CACHE_VERSION = 'ubour-v5.0.0';

const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo-mark.png',
  './icons/logo-full.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // كل ملف على حدة: غياب ملف واحد لا يُفشل تثبيت الـ Service Worker كاملاً
      .then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;           // لا نتدخل في Supabase/CDN

  const isCode = request.mode === 'navigate' || /\.(?:html|js|json)$/.test(url.pathname) || url.pathname.endsWith('/');

  if (isCode) {
    // الشبكة أولاً
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // الكاش أولاً مع تحديث بالخلفية (الصور والأيقونات)
  event.respondWith(
    caches.match(request).then((hit) => {
      const refresh = fetch(request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || refresh;
    })
  );
});
