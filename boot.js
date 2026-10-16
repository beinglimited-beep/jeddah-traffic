/* Loads app.js only if Leaflet loaded; otherwise shows a clear message. */
(function(){
  var m=document.getElementById('map');
  if(!window.L){
    m.innerHTML='<div class="mapfail"><b>Map library did not load.</b><br>Leaflet (free, from a public CDN) could not be reached. Check your internet connection, then reload.<br>'+
      '<span dir="rtl">تعذّر تحميل مكتبة الخريطة. تحقق من الاتصال ثم أعد تحميل الصفحة.</span><br><button class="b" onclick="location.reload()">Reload / إعادة التحميل</button></div>';
    return;
  }
  var s=document.createElement('script');s.src='app.js';document.body.appendChild(s);
})();
