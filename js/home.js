/* AND.Furniture premium home page (additive). Visuals are designed SVG scenes so the site does not look empty.
   TO USE REAL PHOTOS: put image URLs below (relative path or full URL). Anything left empty keeps the designed visual. */
(function () {
  var AND = window.AND; if (!AND || document.body.getAttribute('data-page') !== 'home') return;
  var IMG = {
    hero: ['', '', ''],               /* 3 full-bleed hero photos (living, bedroom, dining) */
    rooms: {}                         /* by category slug, e.g. { 'living-room': 'img/rooms/living.jpg' } */
  };
  var ar = AND.lang === 'ar', $ = function (s, r) { return (r || document).querySelector(s); }, esc = AND.esc;
  var X = ar ? {
    k: ['غرف المعيشة', 'غرف النوم', 'السفرة'], h: ['بيتك يستحق أن يكون أجمل', 'نوم هادئ في غرفة تشبهك', 'مائدة تجمع كل العائلة'],
    p: ['أثاث مصمم بعناية بخامات مختارة.', 'غرف نوم متكاملة بتفاصيل أنيقة وراحة تدوم.', 'سفر وطاولات بتصاميم عملية ودافئة.'],
    scroll: 'اكتشف', trust: ['', 'دفع عند الاستلام', 'خامات مختارة بعناية', 'دعم عبر الشات وواتساب'], dfee: 'رسوم التوصيل', free: 'توصيل مجاني فوق', egp: 'ج.م',
    rooms: 'تسوق حسب الغرفة', roomsP: 'اختر الغرفة وابدأ من التصميم الذي يعجبك.', explore: 'استكشف', n: 'قطعة',
    stats: [['منتج متاح', 'p'], ['قسم', 'c'], ['طرق دفع متاحة', 'm']],
    storyK: 'لماذا AND.Furniture', storyH: 'أثاث يُصنع ليعيش معك', storyP: 'نختار كل قطعة لتجمع بين الشكل الأنيق والراحة اليومية، ونرافقك بعد الطلب.',
    howH: 'كيف تطلب', how: [['اختر', 'تصفح الأقسام واختر القطعة واللون المناسبين.'], ['اطلب', 'أكمل بياناتك وادفع عند الاستلام أو بالطريقة التي تفضلها.'], ['نؤكد', 'نتابع معك بخصوص طلبك.'], ['استلم', 'تتابع طلبك برقم الطلب.']],
    tH: 'آراء العملاء', tNote: 'نماذج لآراء العملاء، تُستبدل بآراء حقيقية قريباً.',
    tt: [['تعامل راقٍ وقطعة بنفس جمال الصور.', 'عميل نموذجي'], ['الطلب كان سهل والتواصل سريع جداً.', 'عميلة نموذجية'], ['أحببت الخامات وطريقة التوصيل.', 'عميل نموذجي']],
    ctaH: 'جاهز تجهز بيتك؟', ctaP: 'اسألنا عن أي قطعة أو تصميم خاص. ', c1: 'تصفح المنتجات', c2: 'تحدث معنا'
  } : {
    k: ['Living rooms', 'Bedrooms', 'Dining'], h: ['A home that feels like you', 'Quiet nights, beautifully made', 'The table everyone gathers at'],
    p: ['Carefully designed furniture in chosen materials.', 'Complete bedrooms with elegant detail and lasting comfort.', 'Dining sets and tables, practical and warm.'],
    scroll: 'Discover', trust: ['', 'Cash on delivery', 'Carefully chosen materials', 'Support by chat and WhatsApp'], dfee: 'Delivery fee', free: 'Free delivery over', egp: 'EGP',
    rooms: 'Shop by room', roomsP: 'Pick a room and start with the design you love.', explore: 'Explore', n: 'pieces',
    stats: [['Products available', 'p'], ['Collections', 'c'], ['Payment methods', 'm']],
    storyK: 'Why AND.Furniture', storyH: 'Furniture made to live with you', storyP: 'We pick every piece to balance elegant looks with everyday comfort, and stay with you after you order.',
    howH: 'How it works', how: [['Choose', 'Browse the collections and pick your piece and colour.'], ['Order', 'Add your details and pay on delivery or the way you prefer.'], ['Confirm', 'We follow up with you about your order.'], ['Receive', 'Track your order with its order number.']],
    tH: 'What customers say', tNote: 'Sample reviews, to be replaced with real customer reviews soon.',
    tt: [['Refined service and a piece as good as the photos.', 'Sample customer'], ['Ordering was easy and replies were quick.', 'Sample customer'], ['Loved the materials and the delivery.', 'Sample customer']],
    ctaH: 'Ready to furnish your home?', ctaP: 'Ask us about any piece or a custom design.', c1: 'Browse products', c2: 'Talk to us'
  };
  /* ---- designed room scenes ---- */
  var G = '#c9a45c', C = '#faf6f0';
  function win(x, y, w, h) { return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#f6e7c4" opacity=".92"/><path d="M' + (x + w / 2) + ' ' + y + 'v' + h + 'M' + x + ' ' + (y + h / 2) + 'h' + w + '" stroke="#6b5a4c" stroke-width="5"/><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="none" stroke="#6b5a4c" stroke-width="8"/></g><path d="M' + x + ' ' + (y + h) + 'L' + (x - 120) + ' 560H' + (x + w - 40) + 'Z" fill="url(#bm)" opacity=".5"/>'; }
  var defs = '<defs><linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".7"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></linearGradient><linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3b2f"/><stop offset="1" stop-color="#2a2019"/></linearGradient><radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>';
  var base = '<rect width="1200" height="700" fill="#3a2e25"/><rect y="520" width="1200" height="180" fill="url(#fl)"/>';
  var scenes = [
    /* living */ defs + base + win(150, 120, 210, 260) + '<rect x="470" y="150" width="190" height="130" rx="4" fill="#2a2019" stroke="' + G + '" stroke-width="4"/><circle cx="535" cy="215" r="34" fill="' + G + '" opacity=".75"/><path d="M490 270q45-55 90-20t60 20z" fill="#a8552a" opacity=".8"/>' +
      '<ellipse cx="760" cy="590" rx="330" ry="38" fill="#a8552a" opacity=".55"/><ellipse cx="760" cy="590" rx="250" ry="26" fill="none" stroke="' + G + '" stroke-width="3" opacity=".7"/>' +
      '<g><rect x="470" y="400" width="560" height="120" rx="34" fill="#8a7560"/><rect x="450" y="360" width="80" height="170" rx="30" fill="#6b5a4c"/><rect x="970" y="360" width="80" height="170" rx="30" fill="#6b5a4c"/><rect x="520" y="340" width="460" height="110" rx="36" fill="#7a6653"/><rect x="560" y="510" width="16" height="40" fill="#2a2019"/><rect x="930" y="510" width="16" height="40" fill="#2a2019"/><rect x="600" y="372" width="90" height="70" rx="14" fill="' + G + '"/><rect x="820" y="380" width="90" height="62" rx="14" fill="#a8552a"/></g>' +
      '<g><ellipse cx="1110" cy="190" rx="90" ry="90" fill="url(#gl)"/><rect x="1106" y="200" width="8" height="330" fill="' + G + '"/><path d="M1070 200h80l-14-60h-52z" fill="#f6e7c4"/><ellipse cx="1110" cy="534" rx="36" ry="8" fill="' + G + '"/></g>' +
      '<g><rect x="660" y="540" width="190" height="14" rx="5" fill="#c9a45c"/><rect x="676" y="552" width="8" height="38" fill="#c9a45c"/><rect x="826" y="552" width="8" height="38" fill="#c9a45c"/></g>',
    /* bedroom */ defs + base + win(880, 110, 220, 250) + '<rect x="250" y="140" width="130" height="170" rx="4" fill="#2a2019" stroke="' + G + '" stroke-width="4"/><path d="M270 290q40-90 90 0z" fill="#a8552a" opacity=".7"/>' +
      '<rect x="420" y="200" width="460" height="140" rx="30" fill="#5a4a3c"/><rect x="400" y="330" width="500" height="170" rx="22" fill="#8a7560"/><rect x="400" y="440" width="500" height="80" rx="18" fill="#6b5a4c"/><rect x="450" y="345" width="170" height="60" rx="26" fill="#faf6f0" opacity=".95"/><rect x="680" y="345" width="170" height="60" rx="26" fill="#faf6f0" opacity=".95"/><rect x="400" y="410" width="500" height="26" fill="' + G + '" opacity=".85"/>' +
      '<g><rect x="290" y="420" width="80" height="100" rx="8" fill="#6b5a4c"/><ellipse cx="330" cy="395" rx="46" ry="50" fill="url(#gl)"/><rect x="326" y="400" width="8" height="22" fill="' + G + '"/><path d="M304 402h52l-10-30h-32z" fill="#f6e7c4"/></g><g><rect x="930" y="420" width="80" height="100" rx="8" fill="#6b5a4c"/><ellipse cx="970" cy="395" rx="46" ry="50" fill="url(#gl)"/><path d="M944 402h52l-10-30h-32z" fill="#f6e7c4"/></g>' +
      '<ellipse cx="650" cy="600" rx="380" ry="34" fill="#c9a45c" opacity=".35"/>',
    /* dining */ defs + base + win(120, 110, 200, 250) + '<g><rect x="520" y="60" width="4" height="150" fill="' + G + '"/><path d="M470 250q54-70 108 0z" fill="#f6e7c4"/><path d="M470 250q54-70 108 0z" fill="none" stroke="' + G + '" stroke-width="4"/><ellipse cx="524" cy="262" rx="90" ry="40" fill="url(#gl)"/><rect x="760" y="60" width="4" height="150" fill="' + G + '"/><path d="M710 250q54-70 108 0z" fill="#f6e7c4"/><path d="M710 250q54-70 108 0z" fill="none" stroke="' + G + '" stroke-width="4"/><ellipse cx="764" cy="262" rx="90" ry="40" fill="url(#gl)"/></g>' +
      '<rect x="380" y="400" width="520" height="30" rx="10" fill="#8a7560"/><rect x="410" y="428" width="22" height="130" fill="#6b5a4c"/><rect x="850" y="428" width="22" height="130" fill="#6b5a4c"/><circle cx="640" cy="388" r="22" fill="' + G + '"/><rect x="590" y="372" width="100" height="10" rx="5" fill="#faf6f0" opacity=".7"/>' +
      [[330, 0], [470, 0], [710, 0], [850, 0]].map(function (c) { return '<g><rect x="' + c[0] + '" y="350" width="70" height="100" rx="18" fill="#6b5a4c"/><rect x="' + c[0] + '" y="440" width="70" height="26" rx="8" fill="#a8552a"/><rect x="' + (c[0] + 8) + '" y="466" width="9" height="90" fill="#2a2019"/><rect x="' + (c[0] + 53) + '" y="466" width="9" height="90" fill="#2a2019"/></g>'; }).join('') +
      '<ellipse cx="640" cy="610" rx="400" ry="34" fill="#a8552a" opacity=".4"/>'
  ];
  function scene(i) { var im = IMG.hero[i]; return im ? '<div class="hx-img" style="background-image:url(\'' + esc(im) + '\')"></div>' : '<svg class="hx-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + scenes[i] + '</svg>'; }
  /* ---- hero ---- */
  var hero = $('#hx');
  if (hero) {
    hero.innerHTML = [0, 1, 2].map(function (i) { return '<div class="hx-slide' + (i ? '' : ' on') + '"><div class="hx-bg" data-par>' + scene(i) + '</div><div class="hx-shade"></div><div class="wrap hx-copy"><div class="kicker">' + X.k[i] + '</div><h1>' + X.h[i] + '</h1><p>' + X.p[i] + '</p><div class="cta"><a class="btn gold" href="shop.html">' + X.c1 + '</a><a class="btn ghost" href="contact.html">' + X.c2 + '</a></div></div></div>'; }).join('') +
      '<div class="hx-dots">' + [0, 1, 2].map(function (i) { return '<button aria-label="' + (i + 1) + '"' + (i ? '' : ' class="on"') + '></button>'; }).join('') + '</div><a class="hx-scroll" href="#rooms"><span>' + X.scroll + '</span><i></i></a>';
    var sl = [].slice.call(hero.querySelectorAll('.hx-slide')), dots = [].slice.call(hero.querySelectorAll('.hx-dots button')), cur = 0, tm;
    var go = function (n) { cur = (n + 3) % 3; sl.forEach(function (s, i) { s.classList.toggle('on', i === cur); dots[i].classList.toggle('on', i === cur); }); };
    var run = function () { clearInterval(tm); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) tm = setInterval(function () { go(cur + 1); }, 6500); };
    dots.forEach(function (d, i) { d.onclick = function () { go(i); run(); }; });
    var sx = 0; hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true }); hero.addEventListener('touchend', function (e) { var d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) { go(cur + (d < 0 ? 1 : -1) * (ar ? -1 : 1)); run(); } }, { passive: true }); run();
    var par = [].slice.call(hero.querySelectorAll('[data-par]')), tick = 0;
    addEventListener('scroll', function () { if (tick) return; tick = requestAnimationFrame(function () { tick = 0; var y = Math.min(scrollY, 900); par.forEach(function (p) { p.style.transform = 'translate3d(0,' + (y * .25) + 'px,0) scale(1.08)'; }); }); }, { passive: true });
  }
  /* ---- trust strip, rooms, stats, story, how, testimonials, cta ---- */
  var ICON = ['<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z"/>', '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>', '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>', '<path d="M4 5h16v11H9l-5 4z"/>'];
  function buildTrust() {
  var dl = (function () { var f = Number(AND.settings.delivery_fee), fo = Number(AND.settings.free_delivery_over); if (isNaN(f)) return ''; return X.dfee + ': ' + (f === 0 ? '0' : f) + ' ' + X.egp + (fo > 0 ? ' · ' + X.free + ' ' + fo + ' ' + X.egp : ''); })(); X.trust[0] = dl || X.trust[0]; var tr = $('#trust'); if (tr) tr.innerHTML = '<div class="wrap trust-in">' + X.trust.filter(Boolean).map(function (s, i) { return '<div class="tb"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICON[i] + '</svg><span>' + s + '</span></div>'; }).join('') + '</div>';
  }
  var tint = ['linear-gradient(145deg,#6b5a4c,#3a2e25)', 'linear-gradient(145deg,#8a6a3a,#4a3b2f)', 'linear-gradient(145deg,#a8552a,#4b3427)', 'linear-gradient(145deg,#5d6b57,#2f3a2f)', 'linear-gradient(145deg,#7a6653,#2a2019)'];
  AND.catalog().then(function (c) {
    buildTrust();
    var h = $('#h-cats'); if (h) h.textContent = X.rooms; var rp = $('#rooms-p'); if (rp) rp.textContent = X.roomsP;
    var wide = function (i, n) { var rest = (n - 1) % 4; return rest && i > n - 1 - rest ? 4 / rest : 0; };
    var box = $('#cats'); if (box) { box.className = 'tiles'; box.innerHTML = c.cats.slice(0, 8).map(function (k, i) {
      var ps = c.prods.filter(function (p) { return p.category_id === k.id; }), im = IMG.rooms[k.slug] || (ps[0] && ps[0].images && ps[0].images[0]) || '', n = ps.length;
      return '<a class="tile' + (i === 0 ? ' big' : '') + (wide(i, Math.min(8, c.cats.length)) ? ' w' + wide(i, Math.min(8, c.cats.length)) : '') + '" href="shop.html?cat=' + esc(k.slug) + '" style="background:' + tint[i % 5] + '">' + (im ? '<img src="' + esc(im) + '" alt="" loading="lazy">' : '') + '<span class="tile-sh"></span><span class="tile-t"><small>' + n + ' ' + X.n + '</small><b>' + esc(AND.pick(k, 'name')) + '</b><em>' + X.explore + ' <i>&rarr;</i></em></span></a>'; }).join(''); }
    var st = $('#stats'); if (st) { st.innerHTML = '<div class="wrap stats-in">' + X.stats.map(function (s) { var pm = AND.settings.payment_methods || { cod: true }, v = s[1] === 'p' ? c.prods.length : s[1] === 'c' ? c.cats.length : (pm.cod !== false ? 1 : 0) + (pm.instapay ? 1 : 0) + (pm.wallet ? 1 : 0) + (pm.bank ? 1 : 0); return '<div class="stat"><b data-n="' + v + '">0</b><span>' + s[0] + '</span></div>'; }).join('') + '</div>'; countersInit(st); }
  });
  var sy = $('#story'); if (sy) sy.innerHTML = '<div class="wrap story-in"><div class="story-art" data-rv>' + '<svg viewBox="0 0 400 460" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9a45c"/><stop offset="1" stop-color="#6b5a4c"/></linearGradient></defs><rect width="400" height="460" rx="28" fill="url(#sg)"/><circle cx="300" cy="120" r="64" fill="#faf6f0" opacity=".18"/><rect x="60" y="270" width="280" height="80" rx="26" fill="#faf6f0" opacity=".92"/><rect x="40" y="240" width="60" height="130" rx="24" fill="#faf6f0" opacity=".7"/><rect x="300" y="240" width="60" height="130" rx="24" fill="#faf6f0" opacity=".7"/><rect x="90" y="360" width="12" height="30" fill="#3a2e25"/><rect x="298" y="360" width="12" height="30" fill="#3a2e25"/></svg><img class="story-logo" src="img/logo-512.png" alt="AND.Furniture" width="120" height="120"></div>' +
    '<div data-rv><div class="kicker">' + X.storyK + '</div><h2>' + X.storyH + '</h2><p class="lead">' + X.storyP + '</p><div id="why" class="whys"></div></div></div>';
  var hw = $('#how'); if (hw) hw.innerHTML = '<div class="wrap"><h2 class="ctr">' + X.howH + '</h2><ol class="steps">' + X.how.map(function (s, i) { return '<li data-rv><span class="sn">' + (i + 1) + '</span><b>' + s[0] + '</b><p>' + s[1] + '</p></li>'; }).join('') + '</ol></div>';
  var ts = $('#testi'); if (ts) ts.remove();
  var cb = $('#cta'); if (cb) cb.innerHTML = '<div class="wrap cta-in" data-rv><h2>' + X.ctaH + '</h2><p>' + X.ctaP + '</p><div class="cta"><a class="btn gold" href="shop.html">' + X.c1 + '</a><a class="btn ghost" href="contact.html">' + X.c2 + '</a></div></div>';
  function countersInit(root) {
    var els = [].slice.call(root.querySelectorAll('[data-n]')), done = false;
    var run = function () { if (done) return; done = true; els.forEach(function (e) { var to = +e.getAttribute('data-n'), t0 = performance.now(); (function f(t) { var p = Math.min(1, (t - t0) / 1400); e.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString(ar ? 'ar-EG' : 'en-US'); if (p < 1) requestAnimationFrame(f); })(t0); }); };
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: .3 }).observe(root); } else run();
  }
})();
