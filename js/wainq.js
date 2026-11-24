/* AND admin: WhatsApp inquiries list under Orders (staff) + owner-only on/off switch in Settings. Additive wrapper, loads after admin.js. */
(function () {
  function init() {
    var A = window.ANDAdmin; if (!A || !A.V) return setTimeout(init, 300);
    var V = A.V, sb = A.sb, L = A.L, esc = A.esc, $ = A.$;
    var origO = V.orders, origS = V.settings;
    V.orders = async function () {
      await origO.apply(this, arguments);
      var v = $('#view'); if (!v) return; var panel = document.createElement('div'); panel.className = 'panel'; panel.style.marginTop = '18px'; panel.id = 'wip';
      panel.innerHTML = '<h3>' + L('استفسارات واتساب', 'WhatsApp inquiries') + '</h3><p class="help">' + L('نقرات زر "اطلب عبر واتساب". ليست طلبات حتى تحوّلها بعد التواصل مع العميل.', 'Clicks on "Order on WhatsApp". Not orders until you convert one after talking to the customer.') + '</p><div id="wil" class="help">…</div>';
      v.appendChild(panel); load();
    };
    async function load() {
      var r = await sb.from('whatsapp_inquiries').select('*').eq('status', 'new').order('created_at', { ascending: false }).limit(100), b = $('#wil'); if (!b) return;
      if (r.error) { b.innerHTML = '<div class="note err">' + esc(r.error.message) + '</div>'; return; }
      if (!r.data.length) { b.textContent = L('لا توجد بيانات بعد', 'No data yet'); return; }
      b.className = ''; b.innerHTML = '<div class="tw"><table class="tbl"><tr><th>' + L('التاريخ', 'Date') + '</th><th>' + L('المنتج', 'Product') + '</th><th>' + L('الكمية', 'Qty') + '</th><th></th></tr>' + r.data.map(function (w) {
        return '<tr><td>' + esc(new Date(w.created_at).toLocaleString()) + '</td><td>' + esc(w.product_name || '') + (w.color ? '<br><small>' + esc(w.color) + '</small>' : '') + '</td><td>' + w.qty + '</td><td><button class="btn sm gold" data-wc="' + w.id + '">' + L('تحويل إلى طلب', 'Convert to order') + '</button> <button class="btn sm ghost" data-wd="' + w.id + '">' + L('تجاهل', 'Dismiss') + '</button></td></tr>';
      }).join('') + '</table></div>';
      b.onclick = async function (e) {
        var c = e.target.getAttribute('data-wc'), d = e.target.getAttribute('data-wd');
        if (d) { var x = await sb.from('whatsapp_inquiries').update({ status: 'dismissed', handled_at: new Date().toISOString() }).eq('id', d); if (x.error) return A.toast(x.error.message); load(); }
        if (c) form(c);
      };
    }
    function form(id) {
      var m = A.modal('<h3>' + L('تحويل إلى طلب', 'Convert to order') + '</h3><form class="f" id="wcf"><div><label>' + L('اسم العميل', 'Customer name') + '</label><input name="n" required maxlength="120"></div><div><label>' + L('الهاتف', 'Phone') + '</label><input name="p" required type="tel" dir="ltr" pattern="[0-9+ ()\\-]{8,20}"></div><div><label>' + L('المحافظة', 'Governorate') + '</label><input name="g" required maxlength="60"></div><div><label>' + L('العنوان', 'Address') + '</label><textarea name="a" required rows="2" maxlength="400"></textarea></div><div><label>' + L('الدفع', 'Payment') + '</label><select name="pm"><option value="cod">COD</option><option value="instapay">InstaPay</option><option value="wallet">Wallet</option><option value="bank">Bank</option></select></div><div id="wce"></div><button class="btn gold" type="submit">' + L('إنشاء الطلب', 'Create order') + '</button></form>');
      var f = (m && m.querySelector ? m : document).querySelector('#wcf');
      f.onsubmit = async function (e) {
        e.preventDefault(); var r = await sb.rpc('convert_inquiry', { p_id: +id, p: { customer_name: f.n.value, phone: f.p.value, governorate: f.g.value, address: f.a.value, payment_method: f.pm.value, notes: '' } });
        if (r.error) { $('#wce').innerHTML = '<div class="note err">' + esc(r.error.message) + '</div>'; return; }
        A.toast(L('تم إنشاء الطلب ', 'Order created ') + r.data.number); document.querySelector('.modal') && document.querySelector('.modal').remove(); A.go ? A.go('orders') : load();
      };
    }
    V.settings = async function () {
      await origS.apply(this, arguments);
      if (A.role() !== 'owner') return; var v = $('#view'); if (!v) return;
      var cur = await sb.from('site_settings').select('value').eq('key', 'wa_order_enabled').maybeSingle(), on = !(cur.data && cur.data.value === false);
      if (!$('#view')) return; var p = document.createElement('div'); p.className = 'panel f'; p.style.marginTop = '18px';
      p.innerHTML = '<h3>' + L('زر "اطلب عبر واتساب"', '"Order on WhatsApp" button') + '</h3><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="wae" style="width:auto"' + (on ? ' checked' : '') + '> ' + L('إظهار الزر في صفحة المنتج', 'Show the button on product pages') + '</label><p class="help">' + L('زر الدردشة/واتساب العائم لا يتأثر. المالك فقط يستطيع التغيير.', 'The floating chat/WhatsApp contact button is not affected. Owner only.') + '</p><div id="wao"></div>';
      v.appendChild(p);
      $('#wae').onchange = async function () { var x = await sb.from('site_settings').upsert({ key: 'wa_order_enabled', value: this.checked }); $('#wao').innerHTML = '<div class="note ' + (x.error ? 'err' : 'okb') + '">' + (x.error ? esc(x.error.message) : L('تم الحفظ', 'Saved')) + '</div>'; };
    };
  }
  init();
})();
