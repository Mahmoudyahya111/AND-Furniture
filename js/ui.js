/* AND.Furniture storefront polish layer (additive): scroll reveal, skeletons, quick view, mini-cart drawer, product lightbox.
   Remove the <script src="js/ui.js"> and <link href="css/modern.css"> tags to get the previous look back. */
(function () {
  var AND = window.AND; if (!AND) return;
  var ar = AND.lang === 'ar', $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); }, esc = AND.esc;
  var T = ar ? { qv: 'نظرة سريعة', close: 'إغلاق', add: 'أضف للسلة', full: 'عرض التفاصيل', cart: 'سلة المشتريات', empty: 'السلة فارغة', sub: 'الإجمالي الفرعي', co: 'إتمام الطلب', view: 'عرض السلة', rm: 'حذف', cont: 'متابعة التسوق', color: 'اللون', zoom: 'تكبير', prev: 'السابق', next: 'التالي', out: 'غير متوفر' }
    : { qv: 'Quick view', close: 'Close', add: 'Add to cart', full: 'View full details', cart: 'Your cart', empty: 'Your cart is empty', sub: 'Subtotal', co: 'Checkout', view: 'View cart', rm: 'Remove', cont: 'Continue shopping', color: 'Color', zoom: 'Zoom', prev: 'Previous', next: 'Next', out: 'Out of stock' };
  var page = document.body.getAttribute('data-page') || '';
  document.documentElement.classList.add('js-rv');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- scroll reveal ---- */
  var io = ('IntersectionObserver' in window && !reduce) ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: .05 }) : null;
  function reveal(root) { $$('.card,.cat,section.sec .sec-head,.panel,.hero .wrap>div,.hero .art', root).forEach(function (el, i) { if (el.classList.contains('rv')) return; el.classList.add('rv'); el.style.setProperty('--d', Math.min(i % 6, 5) * 60 + 'ms'); if (io) io.observe(el); else el.classList.add('in'); }); }
  /* ---- skeletons ---- */
  function skel() { $$('.grid').forEach(function (g) { if (!g.children.length) { g.classList.add('has-skel'); g.innerHTML = new Array(6).join('<div class="card skel"><div class="im"></div><div class="bd"><i></i><i class="s"></i><i class="b"></i></div></div>') + '<div class="card skel"><div class="im"></div><div class="bd"><i></i><i class="s"></i><i class="b"></i></div></div>'; } }); }
  /* ---- quick view buttons ---- */
  function decorate(root) { $$('.card .im', root).forEach(function (im) { if (im.querySelector('.qv')) return; var m = /id=([^&]+)/.exec(im.getAttribute('href') || ''); if (!m) return; var b = document.createElement('button'); b.type = 'button'; b.className = 'qv'; b.setAttribute('data-qv', m[1]); b.setAttribute('aria-label', T.qv); b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg><span>' + T.qv + '</span>'; im.appendChild(b); }); }
  function obs() { var m = $('#main'); if (!m) return; var run = function () { decorate(m); reveal(m); $$('.grid.has-skel', m).forEach(function (g) { if (g.querySelector('.card:not(.skel)')) { g.classList.remove('has-skel'); } }); }; new MutationObserver(run).observe(m, { childList: true, subtree: true }); run(); }

  /* ---- modal helper ---- */
  var lastFocus = null;
  function overlay(cls, html) { lastFocus = document.activeElement; var o = document.createElement('div'); o.className = 'ov ' + cls; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.innerHTML = html; document.body.appendChild(o); document.documentElement.classList.add('noscroll'); requestAnimationFrame(function () { o.classList.add('on'); var f = $('button,a', o); if (f) f.focus(); });
    o.close = function () { o.classList.remove('on'); document.documentElement.classList.remove('noscroll'); setTimeout(function () { o.remove(); }, 220); if (lastFocus && lastFocus.focus) lastFocus.focus(); document.removeEventListener('keydown', kd); };
    function kd(e) { if (e.key === 'Escape') o.close(); } document.addEventListener('keydown', kd);
    o.addEventListener('click', function (e) { if (e.target === o || e.target.closest('[data-close]')) o.close(); }); return o; }

  /* ---- quick view ---- */
  async function quick(id) { var c = await AND.catalog(), p = c.byId[id]; if (!p) return; var imgs = p.images && p.images.length ? p.images : ['img/ph/' + p.slug + '.svg'], out = p.stock <= 0, sale = p.compare_at && Number(p.compare_at) > Number(p.price), col = (p.colors && p.colors[0]) || '';
    var o = overlay('qvm', '<div class="sheet"><button class="x" data-close aria-label="' + T.close + '">&times;</button><div class="qg"><div class="qi"><img src="' + esc(imgs[0]) + '" alt="' + esc(AND.pick(p, 'name')) + '"></div><div class="qt"><h3>' + esc(AND.pick(p, 'name')) + '</h3><div class="price">' + AND.money(p.price) + (sale ? '<s>' + AND.money(p.compare_at) + '</s>' : '') + '</div><p>' + esc(AND.pick(p, 'desc')) + '</p>' +
      (p.colors && p.colors.length > 1 ? '<b>' + T.color + '</b><div class="swatches">' + p.colors.map(function (k, i) { return '<button type="button" data-col="' + esc(k) + '" class="' + (i ? '' : 'on') + '">' + esc(k) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="qa"><button class="btn gold" data-qadd ' + (out ? 'disabled' : '') + '>' + (out ? T.out : T.add) + '</button><a class="btn ghost" href="product.html?id=' + p.id + '">' + T.full + '</a></div></div></div></div>');
    o.addEventListener('click', function (e) { var b = e.target.closest('[data-col]'); if (b) { col = b.getAttribute('data-col'); $$('[data-col]', o).forEach(function (x) { x.classList.toggle('on', x === b); }); } if (e.target.closest('[data-qadd]')) { AND.cart.add(p.id, 1, col); o.close(); } }); }

  /* ---- mini cart drawer ---- */
  var drawer = null;
  async function drawCart() { var c = await AND.catalog(), items = AND.cart.get(), sub = 0; var rows = items.map(function (it, i) { var p = c.byId[it.id]; if (!p) return ''; sub += Number(p.price) * it.qty; var img = (p.images && p.images[0]) || 'img/ph/' + p.slug + '.svg';
      return '<div class="dl"><img src="' + esc(img) + '" alt=""><div class="dn"><b>' + esc(AND.pick(p, 'name')) + '</b>' + (it.color ? '<small>' + esc(it.color) + '</small>' : '') + '<div class="qty sm"><button data-q="' + i + '|-1" aria-label="-">&minus;</button><span>' + it.qty + '</span><button data-q="' + i + '|1" aria-label="+">+</button></div></div><div class="dp">' + AND.money(Number(p.price) * it.qty) + '<button class="rm" data-rm="' + i + '">' + T.rm + '</button></div></div>'; }).join('');
    $('.dbody', drawer).innerHTML = rows || '<div class="empty">' + T.empty + '</div>'; $('.dfoot', drawer).innerHTML = items.length ? '<div class="dsub"><span>' + T.sub + '</span><b>' + AND.money(sub) + '</b></div><a class="btn gold" href="cart.html">' + T.co + '</a><button class="btn ghost" data-close>' + T.cont + '</button>' : '<button class="btn ghost" data-close>' + T.cont + '</button>'; }
  function openCart() { if (drawer) return; drawer = overlay('drw', '<aside class="drawer"><div class="dh"><h3>' + T.cart + '</h3><button class="x" data-close aria-label="' + T.close + '">&times;</button></div><div class="dbody"></div><div class="dfoot"></div></aside>'); var cl = drawer.close; drawer.close = function () { cl(); drawer = null; }; drawer.addEventListener('click', async function (e) { var q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]'), c = AND.cart.get(); if (q) { var a = q.getAttribute('data-q').split('|'), it = c[+a[0]]; if (it) { it.qty = Math.max(1, Math.min(20, it.qty + +a[1])); AND.cart.set(c); drawCart(); } } if (r) { c.splice(+r.getAttribute('data-rm'), 1); AND.cart.set(c); drawCart(); } }); drawCart(); }
  if (AND.cart && page !== 'cart') { var oa = AND.cart.add; AND.cart.add = function () { var r = oa.apply(this, arguments); setTimeout(function () { var t = $('.toast'); if (t) t.remove(); openCart(); }, 0); return r; }; }
  document.addEventListener('click', function (e) { var cl = e.target.closest && e.target.closest('a[href="cart.html"]'); if (cl && !e.metaKey && !e.ctrlKey && page !== 'cart' && cl.classList.contains('iconbtn')) { e.preventDefault(); openCart(); } var q = e.target.closest && e.target.closest('[data-qv]'); if (q) { e.preventDefault(); e.stopPropagation(); quick(q.getAttribute('data-qv')); } }, true);

  /* ---- product gallery: hover zoom, lightbox with swipe ---- */
  function gallery() { var d = $('#pd'); if (!d) return;
    d.addEventListener('mousemove', function (e) { var m = e.target.closest && e.target.closest('.main'); if (!m || !matchMedia('(hover:hover)').matches) return; var r = m.getBoundingClientRect(); m.classList.add('zm'); var im = $('img', m); im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; });
    d.addEventListener('mouseout', function (e) { var m = e.target.closest && e.target.closest('.main'); if (m && !m.contains(e.relatedTarget)) m.classList.remove('zm'); });
    d.addEventListener('click', function (e) { var m = e.target.closest && e.target.closest('.main'); if (!m) return; var imgs = $$('.thumbs img', d).map(function (i) { return i.getAttribute('src'); }); var cur = $('#mainimg').getAttribute('src'); if (!imgs.length) imgs = [cur]; var idx = Math.max(0, imgs.indexOf(cur)); lightbox(imgs, idx); }); }
  function lightbox(imgs, idx) { var o = overlay('lbx', '<button class="x" data-close aria-label="' + T.close + '">&times;</button>' + (imgs.length > 1 ? '<button class="nv pv" aria-label="' + T.prev + '">&#8249;</button><button class="nv nx" aria-label="' + T.next + '">&#8250;</button>' : '') + '<div class="lz"><img alt="" src="' + esc(imgs[idx]) + '"></div><div class="lc">' + (idx + 1) + ' / ' + imgs.length + '</div>'), im = $('img', o), sc = 1, x0 = null, tx = 0, ty = 0;
    function go(n) { idx = (n + imgs.length) % imgs.length; sc = 1; tx = ty = 0; im.style.transform = ''; im.src = imgs[idx]; $('.lc', o).textContent = (idx + 1) + ' / ' + imgs.length; }
    var pv = $('.pv', o), nx = $('.nx', o); if (pv) { pv.onclick = function () { go(idx + (ar ? 1 : -1)); }; nx.onclick = function () { go(idx + (ar ? -1 : 1)); }; }
    im.addEventListener('dblclick', function () { sc = sc > 1 ? 1 : 2.2; tx = ty = 0; im.style.transform = 'scale(' + sc + ')'; });
    o.addEventListener('keydown', function () { }); document.addEventListener('keydown', function kk(e) { if (!document.body.contains(o)) { document.removeEventListener('keydown', kk); return; } if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });
    var lz = $('.lz', o); lz.addEventListener('touchstart', function (e) { x0 = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true }); lz.addEventListener('touchend', function (e) { if (x0 == null || sc > 1) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); x0 = null; }, { passive: true });
    lz.addEventListener('wheel', function (e) { e.preventDefault(); sc = Math.max(1, Math.min(4, sc + (e.deltaY < 0 ? .3 : -.3))); im.style.transform = 'scale(' + sc + ')'; }, { passive: false }); }

  /* ---- header shadow on scroll ---- */
  var hd = function () { var h = $('header.top'); if (h) h.classList.toggle('sc', window.scrollY > 8); }; window.addEventListener('scroll', hd, { passive: true });
  function init() { skel(); obs(); gallery(); hd(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
