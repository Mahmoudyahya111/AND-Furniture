/* Page logic for the public store. Each page sets <body data-page="..."> and loads app.js then this file. */
(function () {
  'use strict';
  var AND = window.AND, $ = AND.$, t = AND.t, esc = AND.esc, P = document.body.getAttribute('data-page');
  var pages = {};

  pages.home = async function () {
    var c = await AND.catalog(), s = AND.settings.store;
    $('#hero-t').textContent = AND.pick(s, 'tagline'); $('#hero-sub').textContent = AND.lang === 'ar' ? 'Furnish your home with style' : s.tagline_en || 'Furnish your home with style';
    $('#cats').innerHTML = c.cats.map(function (k) { return '<a class="cat" href="shop.html?cat=' + esc(k.slug) + '">' + esc(AND.pick(k, 'name')) + '</a>'; }).join('');
    var f = c.prods.filter(function (p) { return p.featured; }); if (!f.length) f = c.prods;
    $('#feat').innerHTML = f.slice(0, 8).map(AND.productCard).join('');
    $('#why').innerHTML = ['why1', 'why2', 'why3', 'why4'].map(function (k, i) { return '<div class="panel"><div style="font-size:1.6rem">' + ['🚚', '💵', '🪵', '💬'][i] + '</div><b>' + t(k) + '</b></div>'; }).join('');
  };

  pages.shop = async function () {
    var c = await AND.catalog(), q = new URLSearchParams(location.search), cat = q.get('cat') || '', term = '', sort = 'new';
    var pills = $('#pills'), grid = $('#grid');
    function draw() {
      pills.innerHTML = '<button class="pill' + (!cat ? ' on' : '') + '" data-c="">' + t('allcats') + '</button>' + c.cats.map(function (k) { return '<button class="pill' + (cat === k.slug ? ' on' : '') + '" data-c="' + esc(k.slug) + '">' + esc(AND.pick(k, 'name')) + '</button>'; }).join('');
      var cid = (c.cats.filter(function (k) { return k.slug === cat; })[0] || {}).id;
      var list = c.prods.filter(function (p) { return (!cid || p.category_id === cid) && (!term || (p.name_ar + ' ' + p.name_en).toLowerCase().indexOf(term) > -1); });
      if (sort === 'low') list.sort(function (a, b) { return a.price - b.price; }); else if (sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
      grid.innerHTML = list.length ? list.map(AND.productCard).join('') : '<div class="empty" style="grid-column:1/-1">' + t('nores') + '</div>';
    }
    pills.onclick = function (e) { var b = e.target.closest('.pill'); if (!b) return; cat = b.getAttribute('data-c'); history.replaceState(null, '', cat ? '?cat=' + cat : 'shop.html'); draw(); };
    $('#q').placeholder = t('search'); $('#q').oninput = function () { term = this.value.trim().toLowerCase(); draw(); };
    var so = $('#sort'); so.innerHTML = '<option value="new">' + t('s_new') + '</option><option value="low">' + t('s_low') + '</option><option value="high">' + t('s_high') + '</option>'; so.onchange = function () { sort = this.value; draw(); };
    draw();
  };

  pages.product = async function () {
    var c = await AND.catalog(), id = new URLSearchParams(location.search).get('id'), p = c.byId[id];
    if (!p) { $('#pd').innerHTML = '<div class="empty">' + t('nores') + '</div>'; return; }
    document.title = AND.pick(p, 'name') + ' | AND.Furniture';
    var imgs = (p.images && p.images.length ? p.images : ['img/ph/' + p.slug + '.svg']), color = (p.colors && p.colors[0]) || '', qty = 1, sale = p.compare_at && Number(p.compare_at) > Number(p.price), out = p.stock <= 0;
    function draw(cur) {
      $('#pd').innerHTML = '<div><div class="main"><img id="mainimg" src="' + esc(imgs[cur || 0]) + '" alt="' + esc(AND.pick(p, 'name')) + '"></div>' + (imgs.length > 1 ? '<div class="thumbs">' + imgs.map(function (u, i) { return '<img src="' + esc(u) + '" data-i="' + i + '" class="' + (i === (cur || 0) ? 'on' : '') + '" alt="">'; }).join('') + '</div>' : '') +
        (p.is_placeholder ? '<p class="ph-note">' + t('ph') + '</p>' : '') + '</div><div><a href="shop.html" style="color:var(--muted)">&larr; ' + t('back') + '</a><h1>' + esc(AND.pick(p, 'name')) + '</h1><div class="price">' + AND.money(p.price) + (sale ? '<s>' + AND.money(p.compare_at) + '</s>' : '') + '</div>' +
        '<p>' + esc(AND.pick(p, 'desc')) + '</p>' + (p.colors && p.colors.length ? '<b>' + t('color') + '</b><div class="swatches">' + p.colors.map(function (k) { return '<button data-col="' + esc(k) + '" class="' + (k === color ? 'on' : '') + '">' + esc(k) + '</button>'; }).join('') + '</div>' : '') +
        '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0"><div class="qty"><button id="mi">&minus;</button><span id="qv">' + qty + '</span><button id="pl">+</button></div><button class="btn gold" id="addb"' + (out ? ' disabled' : '') + '>' + (out ? t('out') : t('add')) + '</button>' +
        '<a class="btn wa" target="_blank" rel="noopener" href="' + esc(AND.waLink(t('whapp') + ' ' + AND.pick(p, 'name'))) + '">' + t('wa') + '</a></div>' +
        '<div class="spec">' + (p.dimensions ? '<div><span>' + t('dims') + '</span><span dir="auto">' + esc(p.dimensions) + '</span></div>' : '') + (AND.pick(p, 'material') ? '<div><span>' + t('material') + '</span><span>' + esc(AND.pick(p, 'material')) + '</span></div>' : '') +
        '<div><span>' + t('instock') + '</span><span>' + (out ? t('out') : p.stock <= 5 ? p.stock + ' ' + t('left') : '✓') + '</span></div></div></div>';
      $('#pd').onclick = function (e) {
        var x = e.target; if (x.getAttribute('data-i') != null) draw(+x.getAttribute('data-i'));
        if (x.getAttribute('data-col')) { color = x.getAttribute('data-col'); AND.$$('.swatches button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-col') === color); }); }
        if (x.id === 'mi') { qty = Math.max(1, qty - 1); $('#qv').textContent = qty; } if (x.id === 'pl') { qty = Math.min(Math.min(20, p.stock || 1), qty + 1); $('#qv').textContent = qty; }
        if (x.id === 'addb') { AND.cart.add(p.id, qty, color); AND.toast(t('added')); }
      };
    }
    draw(0);
  };

  pages.cart = async function () {
    var c = await AND.catalog(), box = $('#cartbox'), done = false;
    function totals(lines) { var sub = lines.reduce(function (s, l) { return s + l.p.price * l.qty; }, 0), S = AND.settings, fee = sub ? S.delivery_fee : 0; if (S.free_delivery_over > 0 && sub >= S.free_delivery_over) fee = 0; return { sub: sub, fee: fee, total: sub + fee }; }
    function lines() { return AND.cart.get().map(function (l) { return { id: l.id, qty: l.qty, color: l.color, p: c.byId[l.id] }; }).filter(function (l) { return l.p; }); }
    function draw() {
      var L = lines(); if (!L.length) { box.innerHTML = '<div class="empty"><p>' + t('cartempty') + '</p><a class="btn" href="shop.html">' + t('shopnow') + '</a></div>'; return; }
      var T = totals(L), pm = AND.settings.payment_methods || { cod: true }, s = AND.settings;
      var gov = AND.GOVS.map(function (g) { var a = g.split('|'); return '<option value="' + esc(a[0]) + '">' + esc(AND.lang === 'ar' ? a[0] : a[1]) + '</option>'; }).join('');
      var pays = ['cod', 'instapay', 'wallet', 'bank'].filter(function (k) { return pm[k] || k === 'cod'; }).map(function (k, i) { return '<label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="radio" name="pm" value="' + k + '" style="width:auto;min-height:0"' + (i === 0 ? ' checked' : '') + '> ' + t(k) + '</label>'; }).join('');
      box.innerHTML = '<div class="two"><div class="panel">' + L.map(function (l, i) { return '<div class="line"><img src="' + esc((l.p.images && l.p.images[0]) || 'img/ph/' + l.p.slug + '.svg') + '" alt=""><div class="nm">' + esc(AND.pick(l.p, 'name')) + (l.color ? '<br><small style="color:var(--muted)">' + esc(l.color) + '</small>' : '') + '<br><small>' + AND.money(l.p.price) + '</small></div><div class="qty"><button data-q="-1" data-i="' + i + '">&minus;</button><span>' + l.qty + '</span><button data-q="1" data-i="' + i + '">+</button></div><button class="iconbtn" data-rm="' + i + '" aria-label="' + t('remove') + '">&times;</button></div>'; }).join('') + '</div>' +
        '<form class="panel f" id="ck"><h2 style="margin:0">' + t('checkout') + '</h2>' +
        '<div><label>' + t('cname') + '</label><input name="n" required maxlength="120" autocomplete="name"></div><div class="row"><div><label>' + t('cphone') + '</label><input name="p" required type="tel" inputmode="tel" dir="ltr" pattern="[0-9+ ()\\-]{8,20}" autocomplete="tel"></div><div><label>' + t('cemail') + '</label><input name="e" type="email" dir="ltr" autocomplete="email"></div></div>' +
        '<div><label>' + t('gov') + '</label><select name="g" required><option value="">' + t('choose') + '</option>' + gov + '</select></div><div><label>' + t('addr') + '</label><textarea name="a" required rows="2" maxlength="400" autocomplete="street-address"></textarea></div><div><label>' + t('notes') + '</label><input name="o" maxlength="500"></div>' +
        '<div><label>' + t('pay') + '</label>' + pays + '<div id="paydet" class="note" style="display:none;margin-top:8px"></div></div>' +
        '<div class="sum"><div><span>' + t('subtotal') + '</span><span>' + AND.money(T.sub) + '</span></div><div><span>' + t('delivery') + '</span><span>' + (T.fee ? AND.money(T.fee) : t('free')) + '</span></div><div class="tot"><span>' + t('total') + '</span><span>' + AND.money(T.total) + '</span></div></div>' +
        '<div id="cerr"></div><button class="btn gold" id="pb">' + t('place') + '</button></form></div>';
      var f = $('#ck'); AND.sb && AND.sb.auth.getSession().then(function (r) { var u = r.data.session && r.data.session.user; if (u && !f.n.value) { f.e.value = u.email || ''; f.n.value = (u.user_metadata && u.user_metadata.full_name) || localStorage.getItem('and_name') || ''; } });
      function det() { var v = f.pm.value || (f.pm[0] && f.pm[0].value), d = $('#paydet'), x = ''; if (v === 'instapay' && pm.instapay_handle) x = 'InstaPay: ' + pm.instapay_handle; if (v === 'wallet' && pm.wallet_number) x = t('wallet') + ': ' + pm.wallet_number; if (v === 'bank' && pm.bank_details) x = pm.bank_details; d.style.display = x ? 'block' : 'none'; d.textContent = x ? x + ' - ' + t('paynote') : ''; }
      f.onchange = det; det();
      f.onsubmit = async function (e) {
        e.preventDefault(); var er = $('#cerr'); er.innerHTML = ''; if (!AND.live) { er.innerHTML = '<div class="note err">' + t('demo') + '</div>'; return; }
        var b = $('#pb'); b.disabled = true; b.textContent = t('placing');
        var r = await AND.sb.rpc('place_order', { p: { customer_name: f.n.value, phone: f.p.value, email: f.e.value, governorate: f.g.value, address: f.a.value, notes: f.o.value, payment_method: f.pm.value || 'cod', items: lines().map(function (l) { return { id: l.id, qty: l.qty, color: l.color }; }) } });
        if (r.error) { er.innerHTML = '<div class="note err">' + esc(/stock|unavailable/i.test(r.error.message) ? r.error.message : t('err')) + '</div>'; b.disabled = false; b.textContent = t('place'); return; }
        localStorage.setItem('and_name', f.n.value); AND.cart.clear();
        box.innerHTML = '<div class="panel" style="text-align:center;max-width:560px;margin:auto"><div style="font-size:3rem">✅</div><h2>' + t('thanks') + '</h2><p>' + t('ordno') + ': <b dir="ltr">' + esc(r.data.number) + '</b></p><p>' + AND.money(r.data.total) + '</p><p class="note">' + t('savenum') + '</p><a class="btn" href="track.html?n=' + encodeURIComponent(r.data.number) + '&p=' + encodeURIComponent(f.p.value) + '">' + t('trackbtn') + '</a></div>';
        window.scrollTo(0, 0);
      };
    }
    box.onclick = function (e) {
      var q = e.target.getAttribute('data-q'), rm = e.target.getAttribute('data-rm'), cc = AND.cart.get(), L = lines();
      if (q != null) { var it = L[+e.target.getAttribute('data-i')]; cc.forEach(function (x) { if (x.id === it.id && (x.color || '') === (it.color || '')) x.qty = Math.max(1, Math.min(20, x.qty + (+q))); }); AND.cart.set(cc); draw(); }
      if (rm != null) { var r = L[+rm]; AND.cart.set(cc.filter(function (x) { return !(x.id === r.id && (x.color || '') === (r.color || '')); })); draw(); }
    };
    draw();
  };

  pages.track = async function () {
    var q = new URLSearchParams(location.search), f = $('#tf'), out = $('#tout');
    f.n.placeholder = 'AND-1001'; f.n.value = q.get('n') || ''; f.p.value = q.get('p') || '';
    async function go() {
      out.innerHTML = ''; if (!AND.live) { out.innerHTML = '<div class="note err">' + t('demo') + '</div>'; return; }
      var r = await AND.sb.rpc('track_order', { p_number: f.n.value, p_phone: f.p.value });
      if (r.error || !r.data) { out.innerHTML = '<div class="note err">' + t('tnone') + '</div>'; return; }
      var o = r.data, flow = ['new', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'], at = flow.indexOf(o.status), canc = o.status === 'cancelled';
      out.innerHTML = '<div class="panel"><h2 dir="ltr" style="text-align:start">' + esc(o.number) + '</h2>' + (canc ? '<div class="note err">' + AND.statusLabel('cancelled') + '</div>' : '<div class="steps">' + flow.map(function (s, i) { return '<div class="' + (i <= at ? 'on' : '') + '">' + AND.statusLabel(s) + '</div>'; }).join('') + '</div>') +
        o.items.map(function (l) { return '<div class="line"><div class="nm">' + esc(AND.lang === 'ar' ? l.name_ar : l.name_en) + ' &times; ' + l.qty + '</div><div>' + AND.money(l.price * l.qty) + '</div></div>'; }).join('') +
        '<div class="sum"><div><span>' + t('delivery') + '</span><span>' + (Number(o.delivery_fee) ? AND.money(o.delivery_fee) : t('free')) + '</span></div><div class="tot"><span>' + t('total') + '</span><span>' + AND.money(o.total) + '</span></div></div></div>';
    }
    f.onsubmit = function (e) { e.preventDefault(); go(); }; if (f.n.value && f.p.value) go();
  };

  pages.contact = async function () {
    var s = AND.settings.store, h = AND.settings.hours || {}, days = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'], any = days.some(function (d) { return h[d]; });
    var addr = AND.pick(s, 'address');
    $('#cinfo').innerHTML = '<div class="panel"><h3>' + t('visit') + '</h3><p>' + (addr ? esc(addr) : '<span style="color:var(--muted)">' + t('soon') + '</span>') + '</p>' + (s.map_url ? '<a class="btn ghost sm" target="_blank" rel="noopener" href="' + esc(s.map_url) + '">Google Maps</a>' : '') + '<h3 style="margin-top:18px">' + t('phone') + '</h3><p><a dir="ltr" href="tel:' + esc(s.phone) + '">' + esc(s.phone) + '</a></p><a class="btn wa" target="_blank" rel="noopener" href="' + esc(AND.waLink(t('whapp'))) + '">' + t('wa') + '</a></div>' +
      '<div class="panel"><h3>' + t('hours') + '</h3>' + (any ? '<table class="hours">' + days.map(function (d) { return '<tr><td>' + t('d_' + d) + '</td><td dir="ltr" style="text-align:end">' + (h[d] ? esc(h[d]) : t('closed')) + '</td></tr>'; }).join('') + '</table>' + (AND.pick(h, 'note') ? '<p class="note" style="margin-top:10px">' + esc(AND.pick(h, 'note')) + '</p>' : '') : '<p style="color:var(--muted)">' + t('soon') + '</p>') + '</div>';
  };
  pages.about = async function () { $('#ab').innerHTML = '<p>' + t('aboutP1') + '</p><p>' + t('aboutP2') + '</p><p>' + t('aboutP3') + '</p>'; $('#why').innerHTML = ['why1', 'why2', 'why3', 'why4'].map(function (k, i) { return '<div class="panel"><div style="font-size:1.6rem">' + ['🚚', '💵', '🪵', '💬'][i] + '</div><b>' + t(k) + '</b></div>'; }).join(''); };

  pages.account = async function () {
    var box = $('#acbox'); if (!AND.live) { box.innerHTML = '<div class="note err">' + t('demo') + '</div>'; return; }
    var sess = (await AND.sb.auth.getSession()).data.session;
    if (!sess) {
      var mode = 'in';
      (function draw() {
        box.innerHTML = '<form class="panel f" id="af" style="max-width:440px;margin:auto"><h2>' + (mode === 'in' ? t('signin') : t('signup')) + '</h2>' + (mode === 'up' ? '<div><label>' + t('fname') + '</label><input name="n" required></div>' : '') + '<div><label>' + t('email') + '</label><input name="e" type="email" dir="ltr" required autocomplete="email"></div><div><label>' + t('pass') + '</label><input name="p" type="password" minlength="8" required autocomplete="' + (mode === 'in' ? 'current-password' : 'new-password') + '"></div><div id="aer"></div><button class="btn gold">' + (mode === 'in' ? t('signin') : t('signup')) + '</button><a href="#" id="sw">' + (mode === 'in' ? t('signup') : t('signin')) + '</a>' + (mode === 'in' ? '<a href="#" id="fg">' + t('forgot') + '</a>' : '') + '</form>';
        $('#sw').onclick = function (e) { e.preventDefault(); mode = mode === 'in' ? 'up' : 'in'; draw(); };
        if ($('#fg')) $('#fg').onclick = async function (e) { e.preventDefault(); var em = $('#af').e.value; if (!em) return; await AND.sb.auth.resetPasswordForEmail(em, { redirectTo: new URL('account.html', location.href).href }); $('#aer').innerHTML = '<div class="note okb">' + t('resetsent') + '</div>'; };
        $('#af').onsubmit = async function (e) {
          e.preventDefault(); var f = e.target, r = mode === 'in' ? await AND.sb.auth.signInWithPassword({ email: f.e.value, password: f.p.value }) : await AND.sb.auth.signUp({ email: f.e.value, password: f.p.value, options: { data: { full_name: f.n.value }, emailRedirectTo: new URL('account.html', location.href).href } });
          if (r.error) { $('#aer').innerHTML = '<div class="note err">' + esc(r.error.message) + '</div>'; return; }
          if (mode === 'up' && !r.data.session) { $('#aer').innerHTML = '<div class="note okb">' + t('checkmail') + '</div>'; return; } location.reload();
        };
      })(); return;
    }
    var role = (await AND.sb.rpc('my_role')).data, o = await AND.sb.from('orders').select('number,status,total,created_at,items').order('created_at', { ascending: false });
    box.innerHTML = '<div class="panel"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center"><div><b>' + esc(sess.user.email) + '</b></div><div style="display:flex;gap:8px">' + (role === 'owner' || role === 'staff' ? '<a class="btn sm gold" href="admin.html">' + t('admin') + '</a>' : '') + '<button class="btn sm ghost" id="so">' + t('logout') + '</button></div></div></div><h3 style="margin-top:20px">' + t('myorders') + '</h3>' +
      ((o.data || []).length ? o.data.map(function (x) { return '<a class="panel" style="display:flex;justify-content:space-between;margin-bottom:10px;text-decoration:none" href="track.html?n=' + esc(x.number) + '"><b dir="ltr">' + esc(x.number) + '</b><span>' + AND.statusLabel(x.status) + '</span><span>' + AND.money(x.total) + '</span></a>'; }).join('') : '<p class="empty">' + t('noorders') + '</p>');
    $('#so').onclick = async function () { await AND.sb.auth.signOut(); location.reload(); };
  };

  AND.boot(P, pages[P]);
})();
(function () {
  var AND = window.AND, t = AND.t, set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  document.addEventListener('DOMContentLoaded', function () {});
  var iv = setInterval(function () { if (!document.getElementById('burger')) return; clearInterval(iv);
    set('c1', t('shopnow')); set('c2', t('chatus')); set('h-cats', t('browse')); set('h-feat', t('featured')); set('va', t('viewall'));
    set('th', t('track')); set('tl1', t('tnum')); set('tl2', t('tphone')); set('tb', t('tfind')); set('ch', t('contact')); set('ah', t('aboutT'));
    var x = document.querySelector('[data-x]'); if (x) x.textContent = AND.lang === 'ar' ? 'أثاث منزلي بخامات مختارة وتوصيل لكل المحافظات والدفع عند الاستلام.' : 'Home furniture in carefully chosen materials, delivered across Egypt, with cash on delivery.';
    var c2 = document.getElementById('c2'); if (c2) c2.onclick = function (e) { e.preventDefault(); document.querySelector('.chat-fab').click(); };
  }, 30);
})();
