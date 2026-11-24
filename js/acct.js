/* AND.Furniture accounting (owner). Business report with previous-period comparison, ledger, bank-style statement, PDF + Excel.
   Every number comes from orders, order_events, products and the expenses table (the ledger). Nothing is estimated or invented. */
window.ANDAcct = (function () {
  var D = null, KINDS = ['purchase', 'expense', 'other_income'];
  var iso = function (x) { return x ? String(x).slice(0, 10) : ''; };
  var sum = function (a, k) { return (a || []).reduce(function (t, r) { return t + Number(r[k] || 0); }, 0); };
  var gr = function (a, b) { return b ? (a - b) / Math.abs(b) : null; };
  var pct = function (x) { return (Math.round(x * 1000) / 10) + '%'; };
  function all(sb, t) { var o = [], i = 0; return (async function () { for (;;) { var r = await sb.from(t).select('*').order('id').range(i, i + 999); if (r.error) throw r.error; o = o.concat(r.data || []); if (!r.data || r.data.length < 1000) return o; i += 1000; } })(); }
  async function load(sb) {
    var r = await Promise.all([all(sb, 'orders'), all(sb, 'expenses'), all(sb, 'products'), sb.from('order_events').select('order_id,status,created_at').in('status', ['delivered', 'cancelled']).order('created_at')]);
    var ev = { delivered: {}, cancelled: {} }; (r[3].data || []).forEach(function (e) { ev[e.status][e.order_id] = e.created_at; });
    r[0].forEach(function (o) { o._del = ev.delivered[o.id] || (o.status === 'delivered' ? o.updated_at : null); o._canc = ev.cancelled[o.id] || (o.status === 'cancelled' ? o.updated_at : null); o._ref = o.payment_status === 'refunded' ? o.updated_at : null; });
    return { os: r[0], ls: r[1], ps: r[2] };
  }
  function biz(d, f, t) {
    var inR = function (x) { var k = iso(x); return k && k >= f && k <= t; };
    var del = d.os.filter(function (o) { return o.status === 'delivered' && inR(o._del || o.created_at); }), placed = d.os.filter(function (o) { return inR(o.created_at); }), led = d.ls.filter(function (l) { return inR(l.spent_on); });
    var purchases = sum(led.filter(function (l) { return l.kind === 'purchase'; }), 'amount'), expenses = sum(led.filter(function (l) { return l.kind === 'expense'; }), 'amount'), other = sum(led.filter(function (l) { return l.kind === 'other_income'; }), 'amount');
    var items = function (o) { return Array.isArray(o.items) ? o.items : []; };
    var rev = sum(del, 'total'), n = del.length, units = del.reduce(function (s, o) { return s + items(o).reduce(function (a, x) { return a + (+x.qty || 1); }, 0); }, 0);
    var gross = rev - purchases, refundOrders = d.os.filter(function (o) { return o._ref && inR(o._ref); }), refunds = sum(refundOrders, 'total'), net = gross - expenses + other - refunds;
    var open = d.os.filter(function (o) { return ['delivered', 'cancelled'].indexOf(o.status) < 0; }), cancelled = placed.filter(function (o) { return o.status === 'cancelled'; }).length;
    var dd = del.filter(function (o) { return o._del; }).map(function (o) { return (new Date(o._del) - new Date(o.created_at)) / 864e5; }), fulfil = dd.length ? dd.reduce(function (a, b) { return a + b; }, 0) / dd.length : null;
    var key = function (o) { return o.user_id || o.email || o.phone; }, cust = {}, hist = {};
    del.forEach(function (o) { var k = key(o); if (!k) return; var c = cust[k] = cust[k] || { name: o.customer_name || o.email, n: 0, spend: 0 }; c.n++; c.spend += +o.total || 0; });
    d.os.filter(function (o) { return o.status === 'delivered' && iso(o._del || o.created_at) <= t; }).forEach(function (o) { var k = key(o); if (k) hist[k] = (hist[k] || 0) + 1; });
    var buyers = Object.keys(cust), repeat = buyers.length ? buyers.filter(function (k) { return hist[k] > 1; }).length / buyers.length : null;
    var mo = {}, mk = function (k) { return mo[k] = mo[k] || { m: k, rev: 0, pur: 0, exp: 0 }; };
    del.forEach(function (o) { mk(iso(o._del || o.created_at).slice(0, 7)).rev += +o.total || 0; }); led.forEach(function (l) { if (l.kind === 'purchase') mk(iso(l.spent_on).slice(0, 7)).pur += +l.amount; else if (l.kind === 'expense') mk(iso(l.spent_on).slice(0, 7)).exp += +l.amount; });
    var prod = {}; del.forEach(function (o) { items(o).forEach(function (x) { var k = x.name || x.title || x.id || '-', p = prod[k] = prod[k] || { name: k, u: 0, r: 0 }; p.u += +x.qty || 1; p.r += (+x.qty || 1) * (+x.price || 0); }); });
    var pay = {}; del.forEach(function (o) { var k = o.payment_method || '-', p = pay[k] = pay[k] || { k: k, n: 0, r: 0 }; p.n++; p.r += +o.total || 0; });
    var cat = {}; led.filter(function (l) { return l.kind !== 'other_income'; }).forEach(function (l) { var k = (l.category || '-') + '|' + l.kind, p = cat[k] = cat[k] || { c: l.category || '-', kind: l.kind, a: 0 }; p.a += +l.amount; });
    var live = d.ps.filter(function (p) { return p.active !== false; }), gpo = n ? gross / n : 0, by = function (a, k) { return function (x, y) { return y[k] - x[k]; }; };
    return { f: f, t: t, rev: rev, net: net, gross: gross, n: n, units: units, purchases: purchases, expenses: expenses, other: other, refunds: refunds, aov: n ? rev / n : null, cpo: n ? (purchases + expenses) / n : null, nm: rev ? net / rev : null, gm: rev ? gross / rev : null,
      placed: placed.length, cancelled: cancelled, cr: placed.length ? cancelled / placed.length : null, open: open.length,
      cod: sum(open.filter(function (o) { return o.payment_method === 'cod'; }), 'total'), awaiting: sum(open.filter(function (o) { return o.payment_method !== 'cod' && o.payment_status !== 'paid'; }), 'total'),
      fulfil: fulfil, repeat: repeat, be: gpo > 0 ? Math.ceil(expenses / gpo) : null, invUnits: sum(live, 'stock'), invValue: live.reduce(function (s, p) { return s + (+p.stock || 0) * (+p.price || 0); }, 0),
      months: Object.values(mo).sort(function (x, y) { return x.m.localeCompare(y.m); }), prods: Object.values(prod).sort(by(0, 'r')), pay: Object.values(pay).sort(by(0, 'r')), cats: Object.values(cat).sort(by(0, 'a')),
      top: Object.values(cust).sort(by(0, 'spend')).slice(0, 10), low: live.filter(function (p) { return (+p.stock || 0) <= 5; }).sort(function (x, y) { return x.stock - y.stock; }), led: led };
  }
  function pair(d, f, t) { var days = Math.round((new Date(t) - new Date(f)) / 864e5) + 1, pt = new Date(new Date(f) - 864e5).toISOString().slice(0, 10), pf = new Date(new Date(f) - days * 864e5).toISOString().slice(0, 10); return { B: biz(d, f, t), P: biz(d, pf, pt) }; }
  function statement(d) {
    var rows = [];
    d.os.filter(function (o) { return o.status === 'delivered'; }).forEach(function (o) { rows.push({ date: iso(o._del || o.created_at), ref: o.number, type: 'order', desc: (o.customer_name || '') + ' - ' + (o.payment_method || ''), debit: 0, credit: +o.total || 0 }); });
    d.ls.forEach(function (l) { var out = l.kind !== 'other_income'; rows.push({ date: iso(l.spent_on), ref: 'LDG-' + l.id, type: l.kind, desc: [l.category, l.supplier, l.note].filter(Boolean).join(' - '), debit: out ? +l.amount : 0, credit: out ? 0 : +l.amount }); });
    d.os.filter(function (o) { return o._ref; }).forEach(function (o) { rows.push({ date: iso(o._ref), ref: o.number, type: 'refund', desc: o.customer_name || '', debit: +o.total || 0, credit: 0 }); });
    rows.sort(function (x, y) { return x.date.localeCompare(y.date) || String(x.ref).localeCompare(String(y.ref)); }); var b = 0; rows.forEach(function (r) { b += r.credit - r.debit; r.bal = b; }); return rows;
  }
  function render(c) {
    var L = c.L, AR = c.AR, esc = c.esc, $ = c.$, sb = c.sb, money = c.money, toast = c.toast, view = $('#view');
    var st = c.state = c.state || {}, today = new Date().toISOString().slice(0, 10);
    st.f = st.f || new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10); st.t = st.t || today;
    var tl = { purchase: L('شراء مواد', 'Purchase (material)'), expense: L('مصروف', 'Expense'), other_income: L('دخل آخر', 'Other income'), order: L('طلب', 'Order'), refund: L('استرداد', 'Refund') };
    var cl = { supplier: L('مورد', 'Supplier'), shipping: L('شحن', 'Shipping'), rent: L('إيجار', 'Rent'), ads: L('إعلانات', 'Ads'), salary: L('مرتبات', 'Salaries'), other: L('أخرى', 'Other') };
    var E = function (x) { return x == null ? '-' : money(x); };
    var dl = function (a, b) { var g = gr(a, b); return g == null ? '' : '<span style="color:' + (g >= 0 ? '#2e8b57' : '#c0392b') + ';font-size:12px">' + (g >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(g * 100)) + '% ' + L('عن الفترة السابقة', 'vs previous') + '</span>'; };
    var k2 = function (t, v, s) { return '<div class="kpi"><b>' + v + '</b><span>' + t + '</span>' + (s ? '<div>' + s + '</div>' : '') + '</div>'; };
    var SC = { good: ['#2e8b57', L('على المسار', 'On track')], watch: ['#d68910', L('انتبه', 'Watch')], risk: ['#c0392b', L('يحتاج اهتماماً', 'Needs attention')], na: ['#95a5a6', L('لا بيانات', 'No data')] };
    function direction(B, P) {
      var g = gr(B.rev, P.rev), out = [], add = function (k, v, good, watch, val, guide) { out.push({ k: k, s: v == null ? 'na' : v >= good ? 'good' : v >= watch ? 'watch' : 'risk', val: val, guide: guide }); };
      add(L('هامش الربح الصافي', 'Net profit margin'), B.nm, .2, .1, B.nm == null ? '-' : pct(B.nm), L('جيد: 20% أو أكثر', 'Healthy: 20% or more'));
      add(L('هامش الربح الإجمالي (المبيعات ناقص المواد)', 'Gross margin (sales minus materials)'), B.gm, .5, .35, B.gm == null ? '-' : pct(B.gm), L('جيد: 50% أو أكثر', 'Healthy: 50% or more'));
      add(L('نمو الإيراد عن الفترة السابقة', 'Revenue growth vs previous period'), g, 0, -.1, g == null ? '-' : pct(g), L('جيد: لا يتراجع', 'Healthy: not shrinking'));
      add(L('نسبة الإلغاء', 'Cancellation rate'), B.cr == null ? null : 1 - B.cr, .95, .9, B.cr == null ? '-' : pct(B.cr), L('جيد: أقل من 5%', 'Healthy: under 5%'));
      add(L('سرعة التسليم', 'Delivery speed (order to delivered)'), B.fulfil == null ? null : 1 / (B.fulfil + 1), 1 / 6, 1 / 9, B.fulfil == null ? '-' : B.fulfil.toFixed(1) + ' ' + L('يوم', 'days'), L('جيد: 5 أيام أو أقل', 'Healthy: 5 days or less'));
      add(L('عملاء متكررون', 'Repeat customers'), B.repeat, .2, .1, B.repeat == null ? '-' : pct(B.repeat), L('جيد: 20% أو أكثر', 'Healthy: 20% or more'));
      add(L('الطلبات مقابل نقطة التعادل', 'Orders vs break-even'), B.be == null ? null : B.n / B.be, 1, .7, B.be == null ? '-' : B.n + ' / ' + B.be, L('طلبات تغطي المصروفات', 'Orders needed to cover expenses')); return out;
    }
    var tb = function (h, r) { return '<div class="tw"><table class="tbl"><tr>' + h.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr>' + (r.map(function (x) { return '<tr>' + x.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>'; }).join('') || '<tr><td colspan="' + h.length + '">' + L('لا يوجد شيء بعد.', 'Nothing yet.') + '</td></tr>') + '</table></div>'; };
    async function draw() {
      view.innerHTML = '<p class="help">…</p>';
      try { D = await load(sb); } catch (e) { view.innerHTML = '<div class="note err">' + esc(e.message) + '</div>'; return; }
      var pr = pair(D, st.f, st.t), B = pr.B, P = pr.P, rows = statement(D);
      var before = rows.filter(function (r) { return r.date < st.f; }), open = before.length ? before[before.length - 1].bal : 0, v = rows.filter(function (r) { return r.date >= st.f && r.date <= st.t; }), sin = sum(v, 'credit'), sout = sum(v, 'debit'), close = v.length ? v[v.length - 1].bal : open;
      c.cache = { B: B, P: P, v: v, open: open, sin: sin, sout: sout, close: close };
      var kp = '<div class="kpis">' + k2(L('الإيراد (طلبات مُسلّمة)', 'Revenue (delivered orders)'), E(B.rev), dl(B.rev, P.rev)) + k2(L('صافي الربح', 'Net profit'), E(B.net), dl(B.net, P.net)) + k2(L('هامش صافي', 'Net margin'), B.nm == null ? '-' : pct(B.nm)) + k2(L('هامش إجمالي', 'Gross margin'), B.gm == null ? '-' : pct(B.gm)) + '</div>' +
        '<div class="kpis">' + k2(L('طلبات مُسلّمة', 'Orders delivered'), B.n, dl(B.n, P.n)) + k2(L('متوسط قيمة الطلب', 'Average order value'), E(B.aov), dl(B.aov, P.aov)) + k2(L('وحدات مباعة', 'Units sold'), B.units) + k2(L('تكلفة الطلب', 'Cost per order'), E(B.cpo)) + '</div>' +
        '<div class="kpis">' + k2(L('نقد مستحق عند الاستلام', 'Cash to collect on delivery'), E(B.cod), L('طلبات قيد التنفيذ', 'orders in progress')) + k2(L('بانتظار تأكيد الدفع', 'Awaiting payment (non-COD)'), E(B.awaiting)) + k2(L('طلبات قيد التنفيذ', 'Orders in progress'), B.open) + k2(L('نسبة الإلغاء', 'Cancellation rate'), B.cr == null ? '-' : pct(B.cr), B.cancelled + ' ' + L('ملغي', 'cancelled')) + '</div>' +
        '<div class="kpis">' + k2(L('متوسط أيام التسليم', 'Avg days to deliver'), B.fulfil == null ? '-' : B.fulfil.toFixed(1)) + k2(L('عملاء متكررون', 'Repeat customers'), B.repeat == null ? '-' : pct(B.repeat)) + k2(L('طلبات لتغطية المصروفات', 'Orders to cover expenses'), B.be == null ? '-' : B.be) + k2(L('قيمة المخزون (بالسعر)', 'Stock value (at price)'), E(B.invValue), B.invUnits + ' ' + L('وحدة', 'units')) + '</div>' +
        '<div class="kpis">' + k2(L('استرداد (طلبات بحالة مستردة)', 'Refunds (orders marked refunded)'), E(B.refunds)) + k2(L('طلبات ملغاة', 'Cancelled orders'), B.cancelled) + '</div>';
      var dir = '<div class="panel"><h3>' + L('هل نسير في الاتجاه الصحيح؟', 'Are we heading the right way?') + '</h3><p class="help">' + L('حدود إرشادية، بالمقارنة مع الفترة السابقة بنفس الطول.', 'Guide thresholds, compared with the previous period of the same length.') + '</p>' + direction(B, P).map(function (x) { return '<p style="margin:8px 0"><span style="color:' + SC[x.s][0] + '">●</span> <b>' + x.k + '</b>: ' + x.val + ' <small>(' + SC[x.s][1] + ' · ' + x.guide + ')</small></p>'; }).join('') + '</div>';
      var mon = '<h3>' + L('شهرياً', 'By month') + '</h3>' + tb([L('الشهر', 'Month'), L('الإيراد', 'Revenue'), L('مشتريات', 'Purchases'), L('مصروفات', 'Expenses'), L('صافي', 'Net profit')], B.months.map(function (m) { return [m.m, E(m.rev), E(m.pur), E(m.exp), E(m.rev - m.pur - m.exp)]; }));
      var more = '<h3>' + L('أفضل المنتجات', 'Top products') + '</h3>' + tb([L('المنتج', 'Product'), L('وحدات', 'Units'), L('الإيراد', 'Revenue')], B.prods.slice(0, 10).map(function (p) { return [esc(p.name), p.u, E(p.r)]; })) +
        '<h3>' + L('طرق الدفع', 'Payment methods') + '</h3>' + tb([L('الطريقة', 'Method'), L('طلبات', 'Orders'), L('الإيراد', 'Revenue')], B.pay.map(function (p) { return [esc(p.k), p.n, E(p.r)]; })) +
        '<h3>' + L('المشتريات والمصروفات حسب النوع', 'Purchases and expenses by category') + '</h3>' + tb([L('النوع', 'Category'), L('الفئة', 'Kind'), L('المبلغ', 'Amount')], B.cats.map(function (p) { return [esc(cl[p.c] || p.c), tl[p.kind], E(p.a)]; })) +
        '<h3>' + L('أفضل العملاء', 'Top customers') + '</h3>' + tb([L('العميل', 'Customer'), L('طلبات', 'Orders'), L('الإنفاق', 'Spend')], B.top.map(function (p) { return [esc(p.name || '-'), p.n, E(p.spend)]; })) +
        '<h3>' + L('مخزون منخفض (5 أو أقل)', 'Low stock (5 or fewer)') + '</h3>' + tb([L('المنتج', 'Product'), L('المخزون', 'Stock')], B.low.map(function (p) { return [esc(AR ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar) || '-'), p.stock]; }));
      var led = D.ls.slice().sort(function (x, y) { return String(y.spent_on).localeCompare(String(x.spent_on)); }).slice(0, 200);
      var lg = '<div class="panel f"><h3>' + L('إضافة شراء / مصروف / دخل', 'Add purchase / expense / income') + '</h3><form id="ef" class="rowf noprint"><input type="date" name="d" value="' + today + '" required><select name="k">' + KINDS.map(function (k) { return '<option value="' + k + '">' + tl[k] + '</option>'; }).join('') + '</select><select name="c">' + Object.keys(cl).map(function (k) { return '<option value="' + k + '">' + cl[k] + '</option>'; }).join('') + '</select><input name="s" placeholder="' + L('المورد (اختياري)', 'Supplier (optional)') + '"><input name="n" placeholder="' + L('ملاحظة', 'Note') + '"><input name="a" type="number" min="0.01" step="0.01" required placeholder="' + L('المبلغ', 'Amount') + '"><button class="btn gold sm">' + L('إضافة', 'Add') + '</button></form></div>' +
        tb([L('التاريخ', 'Date'), L('النوع', 'Kind'), L('الفئة', 'Category'), L('المورد', 'Supplier'), L('ملاحظة', 'Note'), L('المبلغ', 'Amount'), ''], led.map(function (r) { return [r.spent_on, tl[r.kind] || r.kind, esc(cl[r.category] || r.category || ''), esc(r.supplier || ''), esc(r.note || ''), E(r.amount), '<button class="btn sm danger" data-del="' + r.id + '">&times;</button>']; }));
      var sm = '<div class="panel"><h3>' + L('كشف الحساب', 'Statement') + '</h3><p class="help">' + L('الداخل = طلبات مُسلّمة ودخل آخر. الخارج = مشتريات ومصروفات واسترداد. الرصيد يتراكم كالكشف البنكي.', 'Money in = delivered orders and other income. Money out = purchases, expenses and refunds. The balance runs like a bank statement.') + '</p><p>' + L('رصيد أول', 'Opening') + ' <b>' + E(open) + '</b> · ' + L('داخل', 'In') + ' <b>' + E(sin) + '</b> · ' + L('خارج', 'Out') + ' <b>' + E(sout) + '</b> · ' + L('رصيد ختامي', 'Closing') + ' <b>' + E(close) + '</b></p></div>' +
        tb([L('التاريخ', 'Date'), L('المرجع', 'Reference'), L('النوع', 'Type'), L('الوصف', 'Description'), L('خارج', 'Out'), L('داخل', 'In'), L('الرصيد', 'Balance')], v.map(function (r) { return [r.date, esc(r.ref), tl[r.type] || r.type, esc(r.desc), r.debit ? E(r.debit) : '', r.credit ? E(r.credit) : '', E(r.bal)]; }));
      view.innerHTML = '<div class="rowf noprint"><label>' + L('من', 'From') + '</label><input type="date" id="df" value="' + st.f + '"><label>' + L('إلى', 'To') + '</label><input type="date" id="dt" value="' + st.t + '"></div>' +
        '<div class="rowf noprint" style="margin:8px 0"><button class="btn gold sm" data-x="bizpdf">' + L('تقرير الأعمال PDF', 'Business report PDF') + '</button><button class="btn sm ghost" data-x="bizxl">' + L('تقرير الأعمال Excel', 'Business report Excel') + '</button><button class="btn gold sm" data-x="stpdf">' + L('كشف الحساب PDF', 'Statement PDF') + '</button><button class="btn sm ghost" data-x="stxl">' + L('كشف الحساب Excel', 'Statement Excel') + '</button><button class="btn sm ghost" data-x="orders">' + L('الطلبات خام Excel', 'Raw orders Excel') + '</button><button class="btn sm ghost" data-x="ledger">' + L('الدفتر خام Excel', 'Raw ledger Excel') + '</button></div>' +
        kp + dir + mon + more + lg + sm;
      $('#df').onchange = function () { st.f = this.value || st.f; draw(); }; $('#dt').onchange = function () { st.t = this.value || st.t; draw(); };
      $('#ef').onsubmit = async function (e) { e.preventDefault(); var f = e.target, r = await sb.from('expenses').insert({ spent_on: f.d.value, kind: f.k.value, category: f.c.value, supplier: f.s.value.trim() || null, note: f.n.value.trim() || null, amount: +f.a.value }); if (r.error) return toast(r.error.message); draw(); };
      view.onclick = async function (e) { var t = e.target; if (t.getAttribute && t.getAttribute('data-del') && confirm(L('حذف هذا السجل؟', 'Delete this entry?'))) { var r = await sb.from('expenses').delete().eq('id', t.getAttribute('data-del')); if (r.error) toast(r.error.message); draw(); return; } var x = t.getAttribute && t.getAttribute('data-x'); if (x) exportIt(x, t); };
    }
    function xl(name, sheets) {
      if (!window.XLSX) { toast(L('تعذر تحميل Excel', 'Excel library not loaded')); return; }
      var wb = XLSX.utils.book_new(); sheets.forEach(function (s) { XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s[1]), s[0].slice(0, 31)); }); XLSX.writeFile(wb, name + '.xlsx');
    }
    function lib() { return window.XLSX ? Promise.resolve() : new Promise(function (res, rej) { var s = document.createElement('script'); s.src = c.base + 'js/vendor/xlsx.full.min.js' + c.ver; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
    async function exportIt(x, btn) {
      var C = c.cache, B = C.B, P = C.P, nm = function (s) { return s + '-' + st.f + '_' + st.t; }; btn.disabled = true;
      try {
        var kp = [[L('الإيراد', 'Revenue'), E(B.rev)], [L('صافي الربح', 'Net profit'), E(B.net)], [L('هامش صافي', 'Net margin'), B.nm == null ? '-' : pct(B.nm)], [L('هامش إجمالي', 'Gross margin'), B.gm == null ? '-' : pct(B.gm)], [L('طلبات مُسلّمة', 'Orders delivered'), B.n], [L('متوسط قيمة الطلب', 'Average order value'), E(B.aov)], [L('مشتريات', 'Purchases'), E(B.purchases)], [L('مصروفات', 'Expenses'), E(B.expenses)]];
        var vr = C.v.map(function (r) { return [r.date, r.ref, tl[r.type] || r.type, r.desc, r.debit ? money(r.debit) : '', r.credit ? money(r.credit) : '', money(r.bal)]; });
        if (x === 'bizpdf') await ANDReport.pdf({ lang: AR ? 'ar' : 'en', file: nm('business-report'), title: L('تقرير الأعمال', 'Business report'), subtitle: st.f + ' - ' + st.t, kpis: kp,
          sections: [{ title: L('شهرياً', 'By month'), head: [L('الشهر', 'Month'), L('الإيراد', 'Revenue'), L('مشتريات', 'Purchases'), L('مصروفات', 'Expenses'), L('صافي', 'Net')], align: ['l', 'r', 'r', 'r', 'r'], rows: B.months.map(function (m) { return [m.m, money(m.rev), money(m.pur), money(m.exp), money(m.rev - m.pur - m.exp)]; }), empty: L('لا بيانات', 'No data') }, { title: L('أفضل المنتجات', 'Top products'), head: [L('المنتج', 'Product'), L('وحدات', 'Units'), L('الإيراد', 'Revenue')], align: ['l', 'r', 'r'], rows: B.prods.slice(0, 10).map(function (p) { return [p.name, p.u, money(p.r)]; }), empty: L('لا بيانات', 'No data') }] });
        else if (x === 'stpdf') await ANDReport.pdf({ lang: AR ? 'ar' : 'en', landscape: true, file: nm('statement'), title: L('كشف الحساب', 'Statement'), subtitle: st.f + ' - ' + st.t, kpis: [[L('رصيد أول', 'Opening'), E(C.open)], [L('داخل', 'In'), E(C.sin)], [L('خارج', 'Out'), E(C.sout)], [L('رصيد ختامي', 'Closing'), E(C.close)]],
          sections: [{ title: L('الحركة', 'Transactions'), head: [L('التاريخ', 'Date'), L('المرجع', 'Reference'), L('النوع', 'Type'), L('الوصف', 'Description'), L('خارج', 'Out'), L('داخل', 'In'), L('الرصيد', 'Balance')], align: ['l', 'l', 'l', 'l', 'r', 'r', 'r'], rows: vr, empty: L('لا حركة', 'No transactions') }] });
        else { await lib();
          if (x === 'bizxl') xl(nm('business-report'), [['Summary', [['Metric', 'Value', 'Previous period']].concat([['Revenue', B.rev, P.rev], ['Net profit', B.net, P.net], ['Gross profit', B.gross, P.gross], ['Purchases', B.purchases, P.purchases], ['Expenses', B.expenses, P.expenses], ['Other income', B.other, P.other], ['Refunds', B.refunds, P.refunds], ['Orders delivered', B.n, P.n], ['Units sold', B.units, P.units]])], ['Months', [['Month', 'Revenue', 'Purchases', 'Expenses']].concat(B.months.map(function (m) { return [m.m, m.rev, m.pur, m.exp]; }))], ['Products', [['Product', 'Units', 'Revenue']].concat(B.prods.map(function (p) { return [p.name, p.u, p.r]; }))]]);
          else if (x === 'stxl') xl(nm('statement'), [['Statement', [['Date', 'Reference', 'Type', 'Description', 'Out', 'In', 'Balance']].concat(C.v.map(function (r) { return [r.date, r.ref, r.type, r.desc, r.debit, r.credit, r.bal]; }))]]);
          else if (x === 'orders') xl(nm('orders'), [['Orders', [['Number', 'Created', 'Delivered', 'Status', 'Customer', 'Payment', 'Payment status', 'Total']].concat(D.os.filter(function (o) { var k = iso(o.created_at); return k >= st.f && k <= st.t; }).map(function (o) { return [o.number, iso(o.created_at), iso(o._del), o.status, o.customer_name, o.payment_method, o.payment_status, +o.total]; }))]]);
          else if (x === 'ledger') xl(nm('ledger'), [['Ledger', [['Date', 'Kind', 'Category', 'Supplier', 'Note', 'Amount']].concat(B.led.map(function (l) { return [l.spent_on, l.kind, l.category, l.supplier || '', l.note || '', +l.amount]; }))]]); }
      } catch (e) { toast(e.message || String(e)); } btn.disabled = false;
    }
    return draw();
  }
  return { render: render };
})();
