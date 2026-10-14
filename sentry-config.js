/* =========================================================================
   عبور إكسبريس — إعدادات Sentry (مراقبة الأخطاء)  v5.1.0
   - يُحمَّل قبل سكربت Sentry (Loader) لأنه يعرّف window.sentryOnLoad.
   - لا تسجيل شاشة (Replay) ولا قياس أداء. لا بيانات شخصية: الأرقام والبريد ورموز الدخول
     تُحجب، ويُحذف كل ما بعد ? و # من الروابط (روابط استعادة كلمة السر تحمل رموز دخول).
   - إن حُجب هذا الملف أو سكربت Sentry، يعمل التطبيق بصورة طبيعية.
   ========================================================================= */
window.sentryOnLoad = function () {
  var RE_JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
  var RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  // +967/+966 أو 00967/00966 بأي فواصل، ثم أرقام محلية يمنية 7xxxxxxxx وسعودية 05xxxxxxxx
  var RE_PHONE = /(?:\+|00)?(?:967|966)[\s-]?\d[\d\s-]{6,11}\d|\b0?7\d{8}\b|\b05\d{8}\b/g;
  var RE_LONGNUM = /\d{9,}/g;   // أي رقم طويل (هاتف بصيغة غريبة، معرّف...) يُحجب احتياطاً

  function scrubString(s) {
    if (typeof s !== 'string') return s;
    return s.replace(RE_JWT, '[token]').replace(RE_EMAIL, '[email]').replace(RE_PHONE, '[phone]').replace(RE_LONGNUM, '[num]');
  }
  function stripUrl(u) {
    if (typeof u !== 'string') return u;
    return scrubString(u.split('#')[0].split('?')[0]);
  }
  function scrubDeep(v, depth) {
    if (depth > 6 || v == null) return v;
    if (typeof v === 'string') return scrubString(v);
    if (Array.isArray(v)) return v.map(function (x) { return scrubDeep(x, depth + 1); });
    if (typeof v === 'object') {
      Object.keys(v).forEach(function (k) { v[k] = scrubDeep(v[k], depth + 1); });
    }
    return v;
  }

  var options = {
    dsn: 'https://02ec9669ffc0edabbbdba502f0076f5f@o4512211789086720.ingest.us.sentry.io/4512211800096768',
    release: 'ubour-express@5.1.0',
    environment: 'production',
    sendDefaultPii: false,
    maxBreadcrumbs: 20,
    tracesSampleRate: 0,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'Failed to fetch',                                   // ضعف الشبكة عند المستخدم
      'Load failed',                                       // نفس الشيء على سفاري
      'NetworkError when attempting to fetch resource',    // نفس الشيء على فايرفوكس
      'The operation was aborted',
      'AbortError'
    ],
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-(web-)?extension:/i],
    beforeBreadcrumb: function (b) {
      if (!b) return null;
      if (b.category === 'console') return null;           // قد تحوي بيانات المستخدم
      if (b.data) {
        ['url', 'from', 'to'].forEach(function (k) { if (b.data[k]) b.data[k] = stripUrl(b.data[k]); });
      }
      if (b.message) b.message = scrubString(b.message);
      return b;
    },
    beforeSend: function (event) {
      try {
        if (event.message) event.message = scrubString(event.message);
        if (event.exception && event.exception.values) {
          event.exception.values.forEach(function (ex) { if (ex.value) ex.value = scrubString(ex.value); });
        }
        if (event.request) {
          event.request.url = stripUrl(event.request.url);
          delete event.request.query_string;
          delete event.request.cookies;
          delete event.request.data;
          var ua = event.request.headers && event.request.headers['User-Agent'];
          event.request.headers = ua ? { 'User-Agent': ua } : {};
        }
        if (event.breadcrumbs) {
          var list = Array.isArray(event.breadcrumbs) ? event.breadcrumbs : event.breadcrumbs.values;
          if (Array.isArray(list)) {
            list.forEach(function (b) {
              if (b.message) b.message = scrubString(b.message);
              if (b.data) ['url', 'from', 'to'].forEach(function (k) { if (b.data[k]) b.data[k] = stripUrl(b.data[k]); });
            });
          }
        }
        if (event.extra) event.extra = scrubDeep(event.extra, 0);
        if (event.tags) event.tags = scrubDeep(event.tags, 0);
        delete event.user;
      } catch (e) { /* لا نعطّل الإرسال */ }
      return event;
    }
  };

  Sentry.init(options);
  try {
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    Sentry.setTag('display_mode', standalone ? 'standalone' : 'browser');
  } catch (e) { /* تجاهل */ }
};
