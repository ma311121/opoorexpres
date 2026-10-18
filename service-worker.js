/* =========================================================================
   عبور إكسبريس — Service Worker (v5.4)
   • صفحات و JS: الشبكة أولاً (تصل التحديثات الأمنية فوراً) ثم الكاش دون اتصال.
   • الأيقونات والصور: الكاش أولاً مع تحديث في الخلفية.
   • الطلبات الخارجية (Supabase وCDN) لا يتدخل فيها نهائياً — لا تُخزَّن بيانات المستخدمين.
   عند أي تحديث للملفات غيّر CACHE_VERSION.
   ========================================================================= */
const CACHE_VERSION = 'ubour-v5.4.3';

const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './sentry-config.js',
  './privacy.html',
  './terms.html',
  './legal.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo-mark.png',
  './logo-full.png'
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
  if (url.pathname.endsWith('.apk')) return;                  // ملف التطبيق يُنزَّل مباشرة دون تخزين

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

// عند الضغط على تنبيه الجهاز: نُظهر نافذة التطبيق أو نفتحها
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// تنبيهات Web Push القادمة من الخادم (حتى والتطبيق مغلق). يجب عرض إشعار مع كل دفعة (متطلب iOS).
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || 'عبور إكسبريس';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: data.tag || undefined,       // نفس معرّف التنبيه الداخلي: لا تكرار عند وصول الاثنين
    lang: 'ar', dir: 'rtl',
    data: { url: data.url || './' }
  }));
});
