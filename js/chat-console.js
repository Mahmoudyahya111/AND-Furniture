/* AND.Furniture support console: claim, transfer, close, presence, alias, survey result, canned replies. Staff only (RLS + server checks). */
(function () {
  'use strict';
  var CFG = window.AND_CFG || {}, AR = localStorage.getItem('and_lang') !== 'en', L = function (a, e) { return AR ? a : e; };
  document.documentElement.lang = AR ? 'ar' : 'en'; document.documentElement.dir = AR ? 'rtl' : 'ltr';
  var $ = function (s) { return document.querySelector(s); }, esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var sb = window.supabase.createClient(CFG.url, CFG.key), me = null, role = '', prof = {}, chats = [], staff = [], sel = null, key = '', filt = 'active', q = '', pres = 'offline', DOT = { available: '#2ecc71', break: '#f39c12', offline: '#95a5a6' };
  var app = $('#app');
  var PS = { available: L('متاح', 'Available'), break: L('استراحة', 'On break'), offline: L('غير متصل', 'Offline') };
  var CAN = [[L('أهلا بك، كيف أساعدك؟', 'Welcome, how can I help?'), L('أهلا بك في AND.Furniture، كيف أقدر أساعدك؟', 'Welcome to AND.Furniture, how can I help you?')], [L('لحظة من فضلك', 'One moment'), L('لحظة من فضلك، أراجع الأمر وأرد عليك.', 'One moment please, I am checking and will reply.')], [L('هل من شيء آخر؟', 'Anything else?'), L('هل هناك شيء آخر أقدر أساعدك به؟', 'Is there anything else I can help with?')]];
  var err = function (r) { if (r && r.error) { alert(r.error.message); return true; } return false; };
  var ago = function (t) { var s = (Date.now() - new Date(t)) / 1000; return s < 60 ? L('الآن', 'now') : s < 3600 ? Math.floor(s / 60) + L(' د', 'm') : s < 86400 ? Math.floor(s / 3600) + L(' س', 'h') : new Date(t).toLocaleDateString(); };
  var nm = function (c) { return c.visitor_name || (L('زائر', 'Visitor') + ' #' + c.id); };
  async function login() {
    app.innerHTML = '<div style="max-width:380px;margin:60px auto;padding:20px"><div class="pane" style="padding:22px"><h2 style="margin:0 0 12px">' + L('دخول فريق الدعم', 'Support sign in') + '</h2><form id="lf"><div class="row"><input type="email" id="le" placeholder="Email" style="flex:1;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink)" required></div><div class="row"><input type="password" id="lp2" placeholder="' + L('كلمة المرور', 'Password') + '" style="flex:1;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink)" required></div><div class="row"><button class="b p" style="flex:1">' + L('دخول', 'Sign in') + '</button></div><div id="le2" style="color:var(--bad);margin-top:8px"></div></form></div></div>';
    $('#lf').onsubmit = async function (e) { e.preventDefault(); var r = await sb.auth.signInWithPassword({ email: $('#le').value.trim(), password: $('#lp2').value }); if (r.error) { $('#le2').textContent = r.error.message; return; } location.reload(); };
  }
  function shell() {
    app.innerHTML = '<header><b class="t">' + L('مركز الدعم', 'Support console') + '</b><span class="pres"><span id="pd">●</span><select id="ps">' + ['available', 'break', 'offline'].map(function (k) { return '<option value="' + k + '">' + PS[k] + '</option>'; }).join('') + '</select></span>' +
      '<input type="text" id="al" maxlength="30" placeholder="' + L('الاسم الذي يراه العميل', 'Name customers see') + '" style="width:170px"><a class="b" href="admin.html">' + L('لوحة التحكم', 'Dashboard') + '</a><a class="b" href="index.html">' + L('الموقع', 'Website') + '</a><button class="b" id="out">' + L('خروج', 'Sign out') + '</button></header>' +
      '<main><div class="pane" id="lp"><div class="tabs" id="tabs"></div><input type="text" class="sr" id="sq" placeholder="' + L('بحث برقم المحادثة أو اسم العميل', 'Search chat number or customer') + '"><div id="list"></div></div><div class="pane" id="conv"><div class="empty">' + L('اختر محادثة للبدء', 'Select a chat to start') + '</div></div></main>';
    $('#al').value = prof.chat_alias || '';
    $('#ps').onchange = async function () { err(await sb.rpc('set_presence', { p: $('#ps').value })); loadPres(); };
    $('#al').onchange = async function () { if (!err(await sb.rpc('set_my_alias', { p: $('#al').value }))) { $('#al').blur(); prof.chat_alias = $('#al').value; } };
    $('#tabs').onclick = function (e) { if (e.target.dataset.f) { filt = e.target.dataset.f; list(); } };
    $('#sq').oninput = function (e) { q = e.target.value.toLowerCase().trim(); list(); };
    $('#list').onclick = function (e) { var d = e.target.closest('[data-c]'); if (!d) return; sel = +d.dataset.c; key = ''; document.body.classList.add('insel'); list(); };
    $('#conv').onclick = onConv;
    $('#conv').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 're') $('#snd').click(); });
    $('#out').onclick = async function () { await sb.rpc('agent_logout'); await sb.auth.signOut(); location.reload(); };
    sb.rpc('agent_login').then(function () { return sb.rpc('staff_list'); }).then(function (r) { staff = r.data || []; loadPres(); list(); });
    setInterval(list, 4000);
    setInterval(async function () { await sb.rpc('agent_login'); loadPres(); var r = await sb.rpc('staff_list'); staff = r.data || staff; }, 60000);
  }
  async function loadPres() { var r = await sb.from('agent_presence').select('status').eq('user_id', me.id).maybeSingle(); pres = (r.data && r.data.status) || 'offline'; $('#ps').value = pres; $('#pd').style.color = DOT[pres]; }
  var F = { active: function (c) { return c.status !== 'closed'; }, mine: function (c) { return c.claimed_by === me.id && c.status !== 'closed'; }, closed: function (c) { return c.status === 'closed'; }, all: function () { return true; } };
  function tabs() { $('#tabs').innerHTML = [['active', L('نشطة', 'Active')], ['mine', L('محادثاتي', 'Mine')], ['closed', L('مغلقة', 'Closed')], ['all', L('الكل', 'All')]].map(function (a) { return '<button data-f="' + a[0] + '" class="' + (a[0] === filt ? 'on' : '') + '">' + a[1] + ' (' + chats.filter(F[a[0]]).length + ')</button>'; }).join(''); }
  async function list() {
    var r = await sb.from('chats').select('*').order('last_at', { ascending: false }).limit(300); if (r.error) return; chats = r.data || []; tabs();
    var v = chats.filter(F[filt]).filter(function (c) { return !q || (c.id + ' ' + nm(c)).toLowerCase().indexOf(q) >= 0; });
    $('#list').innerHTML = v.map(function (c) { var st = c.status === 'closed' ? L('مغلقة', 'Closed') : c.claimed_name ? esc(c.claimed_name) : L('بانتظار موظف', 'Waiting'); return '<div class="it ' + (c.id === sel ? 'on' : '') + '" data-c="' + c.id + '"><div class="r"><b>#' + c.id + ' ' + esc(nm(c)) + (c.unread_staff > 0 ? '<span class="unr">' + c.unread_staff + '</span>' : '') + '</b><span class="tag ' + (c.status === 'closed' ? 'cl' : '') + '">' + st + '</span></div><small>' + ago(c.last_at) + (c.rating ? ' · ' + '★'.repeat(c.rating) : '') + '</small></div>'; }).join('') || '<div class="empty">' + L('لا توجد محادثات', 'No chats here.') + '</div>';
    if (sel) await conv();
  }
  async function conv() {
    var c = chats.filter(function (x) { return x.id === sel; })[0]; if (!c) return; var k = c.id + c.status + c.claimed_by + pres;
    if (k !== key) {
      key = k; var mine = c.claimed_by === me.id, canTake = ['owner', 'admin'].indexOf(role) >= 0, foot;
      if (c.status === 'closed') foot = '<small>' + L('أغلقت ', 'Closed ') + (c.closed_at ? new Date(c.closed_at).toLocaleString() : '') + ' · ' + L('التقييم: ', 'Rating: ') + (c.rating ? '★'.repeat(c.rating) + (c.resolved === true ? L(' · تم الحل', ' · resolved') : c.resolved === false ? L(' · لم تُحل', ' · not resolved') : '') : L('لم يقيّم', 'not rated')) + (c.feedback ? ' · “' + esc(c.feedback) + '”' : '') + '</small>';
      else if (!c.claimed_by) foot = '<button class="b p" id="take">' + L('استلام المحادثة', 'Take this chat') + '</button>' + (pres !== 'available' ? ' <small style="color:var(--muted)">' + L('اجعل حالتك متاحا أولا.', 'Set yourself to Available first.') + '</small>' : '');
      else if (mine) foot = '<div class="canned">' + CAN.map(function (x, i) { return '<button data-cn="' + i + '">' + esc(x[0]) + '</button>'; }).join('') + '</div><div class="row"><input type="text" id="re" placeholder="' + L('اكتب ردا…', 'Write a reply…') + '" maxlength="500"><button class="b p" id="snd">' + L('إرسال', 'Send') + '</button></div><div class="row"><select id="to">' + staff.filter(function (s) { return s.id !== me.id; }).map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + ' (' + PS[s.status] + ')</option>'; }).join('') + '</select><button class="b" id="tr">' + L('تحويل', 'Transfer') + '</button><button class="b" id="cl">' + L('إغلاق المحادثة', 'Close chat') + '</button></div>';
      else foot = '<small>' + L('يتولى هذه المحادثة ', 'This chat is handled by ') + esc(c.claimed_name) + '.</small> ' + (canTake ? '<button class="b" id="take">' + L('استلام', 'Take over') + '</button> <button class="b" id="cl">' + L('إغلاق', 'Close chat') + '</button>' : '');
      $('#conv').innerHTML = '<div class="ch"><div><button class="b back" id="bk">' + (AR ? '→' : '←') + '</button> <b>#' + c.id + '</b> · ' + esc(nm(c)) + '<br><small style="color:var(--muted)">' + L('بدأت ', 'started ') + new Date(c.created_at).toLocaleString() + '</small></div><span class="tag ' + (c.status === 'closed' ? 'cl' : '') + '">' + (c.status === 'closed' ? L('مغلقة', 'Closed') : c.claimed_name ? L('يتولاها ', 'Handled by ') + esc(c.claimed_name) : L('بانتظار موظف', 'Waiting for an agent')) + '</span></div><div id="msgs"></div><div class="ft">' + foot + '</div>';
    }
    var m = (await sb.from('chat_messages').select('*').eq('chat_id', c.id).order('id')).data || [], box = $('#msgs'); if (!box) return;
    box.innerHTML = m.map(function (x) { return x.sender === 'system' ? '<div class="m sy">' + esc(x.body) + '</div>' : '<div class="m ' + (x.sender === 'staff' ? 'st' : 'cu') + '">' + esc(x.body) + '<small>' + (x.sender === 'staff' ? esc(c.claimed_name || L('الدعم', 'Support')) : esc(nm(c))) + ' · ' + new Date(x.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</small></div>'; }).join(''); box.scrollTop = box.scrollHeight;
    if (c.unread_staff > 0 && c.claimed_by === me.id) sb.from('chats').update({ unread_staff: 0 }).eq('id', c.id);
  }
  async function onConv(e) {
    var t = e.target, c = chats.filter(function (x) { return x.id === sel; })[0]; if (t.id === 'bk') { document.body.classList.remove('insel'); return; } if (!c) return;
    if (t.dataset.cn != null) { $('#re').value = CAN[+t.dataset.cn][1]; $('#re').focus(); return; }
    var i = t.id; if (['take', 'snd', 'tr', 'cl'].indexOf(i) < 0) return;
    if (i === 'take') { if (err(await sb.rpc('chat_claim', { p_chat: c.id }))) return; }
    if (i === 'snd') { var v = $('#re').value.trim(); if (!v) return; $('#re').value = ''; if (err(await sb.rpc('chat_staff_send', { p_chat: c.id, p_body: v }))) return; }
    if (i === 'tr') { if (!$('#to').value) return; if (err(await sb.rpc('chat_transfer', { p_chat: c.id, p_to: $('#to').value }))) return; }
    if (i === 'cl') { if (!confirm(L('إغلاق هذه المحادثة؟ سيتمكن العميل من تقييم الخدمة.', 'Close this chat? The customer can then rate the service.'))) return; if (err(await sb.rpc('chat_close', { p_chat: c.id }))) return; }
    key = ''; list();
  }
  (async function () {
    var s = (await sb.auth.getSession()).data.session; if (!s) return login(); me = s.user; role = (await sb.rpc('my_role')).data;
    if (['owner', 'admin', 'staff', 'support'].indexOf(role) < 0) { app.innerHTML = '<div style="max-width:480px;margin:60px auto;padding:20px"><div class="pane" style="padding:22px"><h2>' + L('لا تملك صلاحية الدخول', 'No access') + '</h2><a class="b" href="index.html">' + L('الموقع', 'Website') + '</a></div></div>'; return; }
    prof = (await sb.from('profiles').select('*').eq('id', me.id).maybeSingle()).data || {}; shell();
  })();
})();
