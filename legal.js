/* عبور إكسبريس — أزرار صفحتي الشروط والخصوصية (ملف خارجي لأن سياسة الأمان تمنع السكربت المضمّن) */
(function () {
  var KEY = 'ubour_terms_accepted';

  function backToApp() {
    window.close();                                                   // يغلق التبويب إن سمح المتصفح (فتحه التطبيق في تبويب جديد)
    setTimeout(function () { window.location.href = './'; }, 450);   // وإلا نعود لصفحة التطبيق
  }

  var accept = document.getElementById('btn-accept');
  if (accept) {
    accept.addEventListener('click', function () {
      try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* تجاهل */ }
      accept.textContent = '✔ تم تسجيل موافقتك';
      accept.disabled = true;
      setTimeout(backToApp, 350);
    });
  }

  var backs = document.querySelectorAll('[data-back]');
  for (var i = 0; i < backs.length; i++) {
    backs[i].addEventListener('click', function (e) { e.preventDefault(); backToApp(); });
  }
})();
