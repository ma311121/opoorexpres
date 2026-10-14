# عبور إكسبريس | Ubour Express

تطبيق ويب تقدّمي (PWA) لنقل الركاب، مبني بـ HTML/CSS/JavaScript ومتصل بـ Supabase.

| الملف | الوظيفة |
|---|---|
| `index.html` | هيكل الصفحات والأنماط (بلا JavaScript مضمّن) |
| `app.js` | منطق التطبيق (إعدادات، قاعدة بيانات، مصادقة، واجهة) |
| `service-worker.js` | العمل دون اتصال (غيّر `CACHE_VERSION` عند أي تحديث) |
| `manifest.json`, `icons/`, `favicon.ico` | إعدادات التثبيت والأيقونات |
| `_headers`, `_redirects` | ترويسات الأمان وإعادة التوجيه (Netlify / Cloudflare Pages) |
| `.well-known/assetlinks.json` | يُملأ ببصمة الـAPK ليفتح التطبيق بلا شريط عنوان |

المفتاح في `app.js` هو المفتاح العام `publishable` (مقصود). لا تضع `service_role` في أي ملف هنا أبداً.
