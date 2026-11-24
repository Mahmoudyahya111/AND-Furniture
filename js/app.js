/* AND.Furniture shared core: i18n, settings, catalog, cart, layout, chat widget. No build step. */
(function () {
  'use strict';
  var CFG = window.AND_CFG || {};
  var AND = (window.AND = {});
  var $ = AND.$ = function (s, r) { return (r || document).querySelector(s); };
  AND.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  AND.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- i18n ---------- */
  var D = {
    ar: { home: 'الرئيسية', shop: 'المتجر', about: 'من نحن', contact: 'تواصل معنا', track: 'تتبع الطلب', cart: 'السلة', account: 'حسابي', login: 'تسجيل الدخول', logout: 'خروج',
      shopnow: 'تسوق الآن', chatus: 'تحدث معنا', browse: 'تصفح الأقسام', featured: 'مختارات لك', viewall: 'عرض الكل', add: 'أضف للسلة', added: 'تمت الإضافة للسلة', out: 'نفد المخزون', sale: 'عرض',
      search: 'ابحث عن منتج...', allcats: 'كل الأقسام', sort: 'الترتيب', s_new: 'الأحدث', s_low: 'السعر: الأقل', s_high: 'السعر: الأعلى', nores: 'لا توجد منتجات مطابقة.',
      egp: 'ج.م', qty: 'الكمية', color: 'اللون', dims: 'المقاس', material: 'الخامة', instock: 'متوفر', left: 'متبقي', ph: 'صورة توضيحية مؤقتة', back: 'رجوع',
      cartempty: 'سلتك فارغة.', subtotal: 'المجموع الفرعي', delivery: 'التوصيل', free: 'مجاني', total: 'الإجمالي', checkout: 'إتمام الطلب', remove: 'حذف',
      cname: 'الاسم بالكامل', cphone: 'رقم الموبايل', cemail: 'البريد الإلكتروني (اختياري)', gov: 'المحافظة', choose: 'اختر', addr: 'العنوان بالتفصيل', notes: 'ملاحظات (اختياري)',
      pay: 'طريقة الدفع', cod: 'الدفع عند الاستلام', instapay: 'إنستاباي', wallet: 'محفظة إلكترونية', bank: 'تحويل بنكي', place: 'تأكيد الطلب', placing: 'جارٍ إرسال الطلب...',
      thanks: 'تم استلام طلبك', ordno: 'رقم الطلب', savenum: 'احتفظ برقم الطلب ورقم موبايلك لتتبع الطلب.', trackbtn: 'تتبع الطلب', paynote: 'بعد التحويل أرسل لنا إيصال الدفع على واتساب مع رقم الطلب.',
      stNew: 'تم الاستلام', stConfirmed: 'تم التأكيد', stPreparing: 'قيد التجهيز', stOut: 'خرج للتوصيل', stDelivered: 'تم التسليم', stCancelled: 'ملغي',
      tnum: 'رقم الطلب', tphone: 'رقم الموبايل المستخدم في الطلب', tfind: 'بحث', tnone: 'لم نجد طلباً بهذه البيانات. تأكد من الرقم والموبايل.',
      email: 'البريد الإلكتروني', pass: 'كلمة المرور', signin: 'دخول', signup: 'إنشاء حساب', fname: 'الاسم', forgot: 'نسيت كلمة المرور؟', resetsent: 'أرسلنا رابط إعادة التعيين إلى بريدك.', checkmail: 'تحقق من بريدك لتأكيد الحساب.',
      myorders: 'طلباتي', noorders: 'لا توجد طلبات بعد.', admin: 'لوحة الإدارة',
      aboutT: 'من نحن', aboutP1: 'AND.Furniture متجر أثاث منزلي مصري، هدفه تجهيز بيتك بحلول كاملة وأنيقة بأسعار واضحة.', aboutP2: 'نوفر غرف المعيشة والنوم والسفرة والدواليب وغرف الأطفال والمكاتب، مع توصيل لجميع المحافظات.', aboutP3: 'فريقنا يساعدك في اختيار الألوان والمقاسات المناسبة لمساحة بيتك، تواصل معنا في أي وقت.',
      why1: 'توصيل لكل المحافظات', why2: 'دفع عند الاستلام', why3: 'خامات مختارة بعناية', why4: 'دعم مباشر عبر الشات وواتساب',
      visit: 'عنواننا', hours: 'مواعيد العمل', phone: 'الهاتف', soon: 'سيتم الإعلان عنه قريباً', closed: 'مغلق',
      d_sat: 'السبت', d_sun: 'الأحد', d_mon: 'الإثنين', d_tue: 'الثلاثاء', d_wed: 'الأربعاء', d_thu: 'الخميس', d_fri: 'الجمعة',
      chatT: 'الدعم المباشر', chatHi: 'أهلاً بك! اكتب رسالتك وسنرد عليك في أقرب وقت.', chatPh: 'اكتب رسالتك...', send: 'إرسال', yourname: 'اسمك',
      err: 'حدث خطأ، حاول مرة أخرى.', demo: 'المتجر يعمل بوضع العرض ولم يتصل بقاعدة البيانات بعد، لا يمكن إرسال الطلبات الآن.', wa: 'اطلب عبر واتساب', follow: 'تابعنا', links: 'روابط', needlogin: 'سجّل الدخول أولاً',
      rights: 'جميع الحقوق محفوظة', shipnote: 'رسوم التوصيل تُحسب تلقائياً', whapp: 'مرحباً AND.Furniture، أريد الاستفسار عن' },
    en: { home: 'Home', shop: 'Shop', about: 'About', contact: 'Contact', track: 'Track order', cart: 'Cart', account: 'My account', login: 'Sign in', logout: 'Sign out',
      shopnow: 'Shop now', chatus: 'Chat with us', browse: 'Browse categories', featured: 'Featured pieces', viewall: 'View all', add: 'Add to cart', added: 'Added to cart', out: 'Out of stock', sale: 'Sale',
      search: 'Search products...', allcats: 'All categories', sort: 'Sort', s_new: 'Newest', s_low: 'Price: low to high', s_high: 'Price: high to low', nores: 'No matching products.',
      egp: 'EGP', qty: 'Quantity', color: 'Colour', dims: 'Size', material: 'Material', instock: 'In stock', left: 'left', ph: 'Temporary placeholder image', back: 'Back',
      cartempty: 'Your cart is empty.', subtotal: 'Subtotal', delivery: 'Delivery', free: 'Free', total: 'Total', checkout: 'Checkout', remove: 'Remove',
      cname: 'Full name', cphone: 'Mobile number', cemail: 'Email (optional)', gov: 'Governorate', choose: 'Choose', addr: 'Full address', notes: 'Notes (optional)',
      pay: 'Payment method', cod: 'Cash on delivery', instapay: 'InstaPay', wallet: 'Mobile wallet', bank: 'Bank transfer', place: 'Place order', placing: 'Placing order...',
      thanks: 'We received your order', ordno: 'Order number', savenum: 'Keep your order number and mobile number to track the order.', trackbtn: 'Track order', paynote: 'After transferring, send us the payment receipt on WhatsApp with your order number.',
      stNew: 'Received', stConfirmed: 'Confirmed', stPreparing: 'Preparing', stOut: 'Out for delivery', stDelivered: 'Delivered', stCancelled: 'Cancelled',
      tnum: 'Order number', tphone: 'Mobile number used on the order', tfind: 'Find', tnone: 'No order found with these details. Check the number and mobile.',
      email: 'Email', pass: 'Password', signin: 'Sign in', signup: 'Create account', fname: 'Name', forgot: 'Forgot password?', resetsent: 'We sent a reset link to your email.', checkmail: 'Check your email to confirm the account.',
      myorders: 'My orders', noorders: 'No orders yet.', admin: 'Admin panel',
      aboutT: 'About us', aboutP1: 'AND.Furniture is an Egyptian home furniture store that furnishes your home with complete, elegant solutions at clear prices.', aboutP2: 'We offer living rooms, bedrooms, dining sets, wardrobes, kids rooms and home offices, with delivery to all governorates.', aboutP3: 'Our team helps you choose colours and sizes that fit your space. Reach out any time.',
      why1: 'Delivery to all governorates', why2: 'Cash on delivery', why3: 'Carefully chosen materials', why4: 'Live support by chat and WhatsApp',
      visit: 'Our address', hours: 'Working hours', phone: 'Phone', soon: 'Will be announced soon', closed: 'Closed',
      d_sat: 'Saturday', d_sun: 'Sunday', d_mon: 'Monday', d_tue: 'Tuesday', d_wed: 'Wednesday', d_thu: 'Thursday', d_fri: 'Friday',
      chatT: 'Live support', chatHi: 'Welcome! Write your message and we will reply as soon as we can.', chatPh: 'Type your message...', send: 'Send', yourname: 'Your name',
      err: 'Something went wrong, please try again.', demo: 'The store is in demo mode and not connected to its database yet, so orders cannot be placed.', wa: 'Order on WhatsApp', follow: 'Follow us', links: 'Links', needlogin: 'Please sign in first',
      rights: 'All rights reserved', shipnote: 'Delivery fee is calculated automatically', whapp: 'Hello AND.Furniture, I would like to ask about' }
  };
  AND.GOVS = ['القاهرة|Cairo', 'الجيزة|Giza', 'الإسكندرية|Alexandria', 'القليوبية|Qalyubia', 'الشرقية|Sharqia', 'الدقهلية|Dakahlia', 'الغربية|Gharbia', 'المنوفية|Monufia', 'البحيرة|Beheira', 'كفر الشيخ|Kafr El Sheikh', 'دمياط|Damietta', 'بورسعيد|Port Said', 'الإسماعيلية|Ismailia', 'السويس|Suez', 'شمال سيناء|North Sinai', 'جنوب سيناء|South Sinai', 'الفيوم|Fayoum', 'بني سويف|Beni Suef', 'المنيا|Minya', 'أسيوط|Asyut', 'سوهاج|Sohag', 'قنا|Qena', 'الأقصر|Luxor', 'أسوان|Aswan', 'البحر الأحمر|Red Sea', 'الوادي الجديد|New Valley', 'مطروح|Matrouh'];
  AND.lang = (function () { var l = localStorage.getItem('and_lang'); return l === 'en' ? 'en' : 'ar'; })();
  var t = AND.t = function (k) { return (D[AND.lang] && D[AND.lang][k]) || D.en[k] || k; };
  AND.pick = function (o, f) { return (AND.lang === 'ar' ? o[f + '_ar'] || o[f + '_en'] : o[f + '_en'] || o[f + '_ar']) || ''; };
  AND.money = function (n) { return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ' + t('egp'); };
  AND.setLang = function (l) { localStorage.setItem('and_lang', l); location.reload(); };
  document.documentElement.lang = AND.lang; document.documentElement.dir = AND.lang === 'ar' ? 'rtl' : 'ltr';

  AND.toast = function (m) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2400); };

  /* ---------- backend ---------- */
  AND.live = !!(CFG.url && CFG.key && window.supabase);
  AND.sb = AND.live ? window.supabase.createClient(CFG.url, CFG.key) : null;

  var DEFAULT_SET = { store: { name_ar: 'AND.Furniture', name_en: 'AND.Furniture', tagline_ar: 'حلول متكاملة للأثاث المنزلي لإن راحتك بتبدأ من بيتك', tagline_en: 'Furnish your home with style', phone: '+201226071020', whatsapp: '201226071020', email: '', facebook: 'https://www.facebook.com/AND.Furniture26', address_ar: '', address_en: '', map_url: '' }, hours: {}, delivery_fee: 150, free_delivery_over: 25000, payment_methods: { cod: true } };
  AND.settings = JSON.parse(JSON.stringify(DEFAULT_SET));
  AND.loadSettings = async function () {
    if (!AND.live) return AND.settings;
    try {
      var r = await AND.sb.from('site_settings').select('key,value');
      if (r.data) r.data.forEach(function (x) { if (x.key !== 'owner_email') AND.settings[x.key] = x.value; });
      AND.settings.delivery_fee = Number(AND.settings.delivery_fee) || 0; AND.settings.free_delivery_over = Number(AND.settings.free_delivery_over) || 0;
    } catch (e) { /* keep defaults */ }
    return AND.settings;
  };
  var catalog = null;
  AND.catalog = async function () {
    if (catalog) return catalog;
    var cats = [], prods = [];
    if (AND.live) {
      try {
        var a = await AND.sb.from('categories').select('*').eq('active', true).order('sort');
        var b = await AND.sb.from('products').select('*').eq('active', true).order('sort');
        if (!a.error && !b.error) { cats = a.data; prods = b.data; }
      } catch (e) {}
    }
    if (!prods.length && !AND.live) {
      var seed = await (await fetch('data/products.json')).json();
      cats = seed.categories.map(function (c, i) { c.id = i + 1; return c; });
      prods = seed.products.map(function (p, i) { var c = cats.filter(function (x) { return x.slug === p.cat; })[0]; p.id = i + 1; p.category_id = c && c.id; p.is_placeholder = true; p.active = true; return p; });
    }
    catalog = { cats: cats, prods: prods, byId: {} };
    prods.forEach(function (p) { catalog.byId[p.id] = p; });
    return catalog;
  };

  /* ---------- cart ---------- */
  var CK = 'and_cart_v1';
  AND.cart = {
    get: function () { try { return JSON.parse(localStorage.getItem(CK)) || []; } catch (e) { return []; } },
    set: function (c) { localStorage.setItem(CK, JSON.stringify(c)); AND.cartBadge(); },
    add: function (id, qty, color) {
      var c = this.get(), k = c.filter(function (x) { return x.id === id && (x.color || '') === (color || ''); })[0];
      if (k) k.qty = Math.min(20, k.qty + qty); else c.push({ id: id, qty: qty, color: color || '' });
      this.set(c);
    },
    count: function () { return this.get().reduce(function (s, x) { return s + x.qty; }, 0); },
    clear: function () { this.set([]); }
  };
  AND.cartBadge = function () { var n = AND.cart.count(); AND.$$('.cart-badge').forEach(function (b) { b.textContent = n; b.style.display = n ? 'grid' : 'none'; }); };

  AND.productCard = function (p) {
    var out = p.stock <= 0, sale = p.compare_at && Number(p.compare_at) > Number(p.price);
    var img = (p.images && p.images[0]) || 'img/ph/' + p.slug + '.svg';
    return '<article class="card"><a class="im" href="product.html?id=' + p.id + '" aria-label="' + AND.esc(AND.pick(p, 'name')) + '"><img loading="lazy" src="' + AND.esc(img) + '" alt="' + AND.esc(AND.pick(p, 'name')) + '">' +
      (out ? '<span class="tag out">' + t('out') + '</span>' : sale ? '<span class="tag">' + t('sale') + '</span>' : '') + '</a><div class="bd"><h3><a href="product.html?id=' + p.id + '" style="text-decoration:none">' + AND.esc(AND.pick(p, 'name')) + '</a></h3>' +
      '<div class="price">' + AND.money(p.price) + (sale ? '<s>' + AND.money(p.compare_at) + '</s>' : '') + '</div>' +
      (p.is_placeholder ? '<div class="ph-note">' + t('ph') + '</div>' : '') +
      '<button class="btn sm gold" data-add="' + p.id + '"' + (out ? ' disabled' : '') + '>' + (out ? t('out') : t('add')) + '</button></div></article>';
  };
  AND.bindAdd = function (root) {
    (root || document).addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-add]'); if (!b || b.disabled) return;
      AND.catalog().then(function (c) { var p = c.byId[b.getAttribute('data-add')]; AND.cart.add(p.id, 1, (p.colors && p.colors[0]) || ''); AND.toast(t('added')); });
    });
  };

  /* ---------- layout ---------- */
  AND.layout = function (page) {
    var s = AND.settings.store, nm = AND.pick(s, 'name');
    var links = [['index.html', 'home', 'home'], ['shop.html', 'shop', 'shop'], ['about.html', 'about', 'about'], ['contact.html', 'contact', 'contact'], ['track.html', 'track', 'track']];
    $('#hdr').outerHTML = '<header class="top"><div class="wrap bar"><button class="iconbtn burger" aria-label="menu" id="burger">&#9776;</button><a class="brand" href="index.html"><img src="img/logo-96.jpg" alt="AND.Furniture logo" width="44" height="44"><span>' + AND.esc(nm) + '</span></a>' +
      '<nav class="links" id="nav">' + links.map(function (l) { return '<a href="' + l[0] + '"' + (page === l[2] ? ' class="on"' : '') + '>' + t(l[1]) + '</a>'; }).join('') + '</nav><div class="sp"></div>' +
      '<button class="iconbtn" id="langbtn">' + (AND.lang === 'ar' ? 'EN' : 'عربي') + '</button><a class="iconbtn" href="account.html" id="acct">' + t('login') + '</a>' +
      '<a class="iconbtn" href="cart.html" aria-label="' + t('cart') + '"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.5L21 8H6"/></svg><span class="badge cart-badge" style="display:none">0</span></a></div></header>';
    var wa = String(s.whatsapp || '').replace(/\D/g, '');
    $('#ftr').outerHTML = '<footer class="foot"><div class="wrap"><div class="fg"><div><h4>' + AND.esc(nm) + '</h4><p>' + AND.esc(AND.pick(s, 'tagline')) + '</p></div>' +
      '<div><h4>' + t('links') + '</h4><p>' + links.map(function (l) { return '<a href="' + l[0] + '">' + t(l[1]) + '</a>'; }).join('<br>') + '</p></div>' +
      '<div><h4>' + t('contact') + '</h4><p>' + (s.phone ? '<a href="tel:' + AND.esc(s.phone) + '" dir="ltr">' + AND.esc(s.phone) + '</a><br>' : '') + (s.email ? '<a href="mailto:' + AND.esc(s.email) + '">' + AND.esc(s.email) + '</a><br>' : '') +
      (s.facebook ? '<a href="' + AND.esc(s.facebook) + '" target="_blank" rel="noopener">Facebook</a>' : '') + '</p></div></div><div class="fine">&copy; ' + new Date().getFullYear() + ' ' + AND.esc(nm) + '. ' + t('rights') + '.</div></div></footer>' +
      (wa ? '<a class="wa-fab" target="_blank" rel="noopener" aria-label="WhatsApp" href="https://wa.me/' + wa + '"><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-1.9.9-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.8-.1 1.4z"/></svg></a>' : '');
    $('#burger').onclick = function () { $('#nav').classList.toggle('open'); };
    $('#langbtn').onclick = function () { AND.setLang(AND.lang === 'ar' ? 'en' : 'ar'); };
    AND.cartBadge(); AND.chatInit();
    if (AND.live) AND.sb.auth.getSession().then(function (r) { var u = r.data.session; if (u) { $('#acct').textContent = t('account'); } });
  };

  /* ---------- customer chat widget (polls; guests identified by a random token) ---------- */
  AND.chatInit = function () {
    var fab = document.createElement('button'); fab.className = 'chat-fab'; fab.setAttribute('aria-label', t('chatT')); fab.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
    var box = document.createElement('div'); box.className = 'chat-box';
    box.innerHTML = '<header><span>' + t('chatT') + '</span><button aria-label="close">&times;</button></header><div class="msgs"></div><form class="chat-in"><input maxlength="2000" placeholder="' + t('chatPh') + '" aria-label="' + t('chatPh') + '"><button class="btn sm gold">' + t('send') + '</button></form>';
    document.body.appendChild(box); document.body.appendChild(fab);
    var token = localStorage.getItem('and_chat_token'); if (!token) { token = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()) + '-' + Math.random().toString(36).slice(2); localStorage.setItem('and_chat_token', token); }
    var msgs = $('.msgs', box), last = 0, timer = null, seen = {};
    function add(m) { if (seen[m.id]) return; seen[m.id] = 1; last = Math.max(last, m.id); var d = document.createElement('div'); d.className = 'm ' + (m.sender === 'visitor' ? 'v' : 's'); d.textContent = m.body; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; }
    function hello() { var d = document.createElement('div'); d.className = 'm s'; d.textContent = t('chatHi'); msgs.appendChild(d); }
    hello();
    async function poll() { if (!AND.live) return; var r = await AND.sb.rpc('chat_visitor_poll', { p_token: token, p_after: last }); if (r.data && r.data.messages) r.data.messages.forEach(add); }
    function open() { box.classList.add('open'); poll(); clearInterval(timer); timer = setInterval(poll, 4000); setTimeout(function () { $('input', box).focus(); }, 50); }
    function close() { box.classList.remove('open'); clearInterval(timer); }
    fab.onclick = function () { box.classList.contains('open') ? close() : open(); };
    $('header button', box).onclick = close;
    $('form', box).onsubmit = async function (e) {
      e.preventDefault(); var i = $('input', box), v = i.value.trim(); if (!v) return;
      if (!AND.live) { AND.toast(t('demo')); return; }
      i.value = ''; var nm = localStorage.getItem('and_name') || '';
      var r = await AND.sb.rpc('chat_visitor_send', { p_token: token, p_name: nm, p_body: v });
      if (r.error) { AND.toast(t('err')); i.value = v; return; } poll();
    };
  };

  AND.statusLabel = function (s) { return t({ new: 'stNew', confirmed: 'stConfirmed', preparing: 'stPreparing', out_for_delivery: 'stOut', delivered: 'stDelivered', cancelled: 'stCancelled' }[s] || s); };
  AND.waLink = function (txt) { var w = String(AND.settings.store.whatsapp || '').replace(/\D/g, ''); return 'https://wa.me/' + w + '?text=' + encodeURIComponent(txt || ''); };
  AND.boot = async function (page, fn) {
    await AND.loadSettings(); AND.layout(page); AND.bindAdd(document);
    try { if (fn) await fn(); } catch (e) { console.error(e); var m = $('#main'); if (m) m.insertAdjacentHTML('afterbegin', '<div class="wrap"><div class="note err">' + t('err') + '</div></div>'); }
  };
})();
