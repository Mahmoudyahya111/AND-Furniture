/* Meta (Facebook) Pixel for the storefront. Loads ONLY when an owner has saved a numeric Pixel ID in admin > Settings.
   Also remembers UTM / fbclid on the first visit (30 days) so orders can be attributed to a campaign. */
(function () {
  var AND = window.AND; if (!AND) return;
  var UK = 'and_utm', page = document.body.getAttribute('data-page') || '', ready = false, queue = [];
  /* ---- UTM capture (stored locally, sent with the order, no third party involved) ---- */
  try {
    var q = new URLSearchParams(location.search), keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'], got = {};
    keys.forEach(function (k) { if (q.get(k)) got[k] = String(q.get(k)).slice(0, 120); });
    if (Object.keys(got).length) { got.landing = location.pathname.split('/').pop() || 'index.html'; got.ts = Date.now(); localStorage.setItem(UK, JSON.stringify(got)); }
  } catch (e) { }
  var px = AND.px = { id: null, utm: function () { try { var u = JSON.parse(localStorage.getItem(UK)); if (u && Date.now() - u.ts < 30 * 864e5) return u; } catch (e) { } return null; } };
  function track(ev, data, opt) { if (!px.id || !window.fbq) { if (px.id) queue.push([ev, data, opt]); return; } try { opt ? fbq('track', ev, data || {}, opt) : fbq('track', ev, data || {}); } catch (e) { } }
  px.track = track;
  function load(id) {
    if (!/^\d{8,20}$/.test(id) || window.fbq) return;
    /* standard Meta Pixel base code */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    px.id = id; fbq('init', id); fbq('track', 'PageView'); ready = true; queue.splice(0).forEach(function (a) { track(a[0], a[1], a[2]); });
  }
  var cur = function (extra) { return Object.assign({ currency: 'EGP' }, extra || {}); };
  /* ---- hook into settings load ---- */
  var ols = AND.loadSettings; AND.loadSettings = async function () { var s = await ols.apply(this, arguments); try { var id = s && s.pixel && String(s.pixel.id || '').trim(); if (id) { load(id); afterLoad(); } } catch (e) { } return s; };
  var did = false;
  async function afterLoad() { if (did) return; did = true;
    try {
      if (page === 'product') { var c = await AND.catalog(), p = c.byId[new URLSearchParams(location.search).get('id')]; if (p) track('ViewContent', cur({ content_type: 'product', content_ids: [String(p.id)], content_name: AND.pick(p, 'name'), value: Number(p.price) })); }
      if (page === 'cart' && AND.cart.count()) { var c2 = await AND.catalog(), v = 0, ids = []; AND.cart.get().forEach(function (it) { var p = c2.byId[it.id]; if (p) { v += Number(p.price) * it.qty; ids.push(String(p.id)); } }); track('InitiateCheckout', cur({ value: v, num_items: AND.cart.count(), content_ids: ids, content_type: 'product' })); }
    } catch (e) { }
  }
  /* AddToCart */
  if (AND.cart) { var oa = AND.cart.add; AND.cart.add = function (id, qty) { var r = oa.apply(this, arguments); AND.catalog().then(function (c) { var p = c.byId[id]; if (p) track('AddToCart', cur({ content_type: 'product', content_ids: [String(id)], content_name: AND.pick(p, 'name'), value: Number(p.price) * (qty || 1) })); }); return r; }; }
  /* Purchase (called by the checkout page after the order is saved) */
  px.purchase = function (order, lines) { var ids = (lines || []).map(function (l) { return String(l.id); }); track('Purchase', cur({ value: Number(order && order.total) || 0, content_type: 'product', content_ids: ids, num_items: (lines || []).reduce(function (a, l) { return a + (l.qty || 1); }, 0) }), { eventID: order && order.number ? String(order.number) : undefined }); };
  /* Contact: WhatsApp button or chat opened */
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.wa-fab,a[href*="wa.me"],.chat-fab'); if (t) track('Contact', cur({ content_name: t.classList.contains('chat-fab') ? 'chat' : 'whatsapp' })); }, true);
})();
