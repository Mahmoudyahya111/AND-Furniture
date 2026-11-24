// AND.Furniture: order emails. Customer confirmation + staff copy when an order is placed. Off until the owner turns it on AND a sender is connected.
// Needs secrets SMTP_USER + SMTP_PASS (Gmail app password) or RESEND_API_KEY, set outside the repo. Sender and provider come from chat_alert_cfg, switches from order_mail_cfg (both owner-only).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const reply = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const SITE = Deno.env.get('SITE_URL') || 'https://mahmoudyahya111.github.io/AND-Furniture/';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

async function send(cfg: any, to: string[], subject: string, html: string, text: string) {
  const prov = cfg.provider === 'resend' ? 'resend' : 'gmail';
  const nm = cfg.from_name ? String(cfg.from_name).replace(/[<>"\r\n]/g, '') : 'AND.Furniture';
  if (prov === 'gmail') {
    // Gmail SMTP (port 465) with an app password kept as Supabase secrets SMTP_USER / SMTP_PASS. No domain needed.
    const su = Deno.env.get('SMTP_USER'), sp = Deno.env.get('SMTP_PASS');
    if (!su || !sp) return { ok: false, note: 'Gmail not connected yet (secrets SMTP_USER / SMTP_PASS missing)' };
    try {
      const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');
      const c = new SMTPClient({ connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: su, password: sp } } });
      try { for (const t of to) await c.send({ from: `${nm} <${su}>`, to: t, subject, content: text, html }); } finally { await c.close(); }
      return { ok: true, note: 'sent via gmail' };
    } catch (e) { return { ok: false, note: 'smtp: ' + String(e).slice(0, 200) }; }
  }
  // Resend with a verified domain: sender address comes from the admin settings, API key from the secret RESEND_API_KEY.
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { ok: false, note: 'Resend not connected yet (secret RESEND_API_KEY missing)' };
  if (!cfg.from_email) return { ok: false, note: 'sender address not set in Settings' };
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: `${nm} <${cfg.from_email}>`, to, subject, html, text }) });
  if (!r.ok) return { ok: false, note: `resend ${r.status}: ${(await r.text()).slice(0, 200)}` };
  return { ok: true, note: 'sent via resend' };
}
const money = (n: unknown) => Math.round(Number(n || 0)).toLocaleString('en-US') + ' EGP';
function orderHtml(o: any, staff: boolean) {
  const rows = (Array.isArray(o.items) ? o.items : []).map((i: any) => `<tr><td style="padding:6px;border-bottom:1px solid #eee">${esc(i.name || i.title || '')}${i.qty ? ' x ' + esc(String(i.qty)) : ''}</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:right">${money((Number(i.price) || 0) * (Number(i.qty) || 1))}</td></tr>`).join('');
  const intro = staff ? `<h2 style="margin:0 0 8px">New order ${esc(o.number)}</h2><p><b>${esc(o.customer_name)}</b><br>${esc(o.phone || '')}<br>${esc(o.email || '')}<br>${esc(o.governorate || '')} ${esc(o.address || '')}</p>` : `<h2 style="margin:0 0 8px">Thank you for your order</h2><p>Hello ${esc(o.customer_name)}, we received your order <b>${esc(o.number)}</b>. We will contact you to confirm it.</p>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px">${intro}<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table><p>Delivery: ${money(o.delivery_fee)}<br><b>Total: ${money(o.total)}</b><br>Payment: ${esc(o.payment_method || '')}</p>${staff ? `<p><a href="${SITE}admin.html">Open admin</a></p>` : `<p>You can follow your order in <a href="${SITE}account.html">your account</a>.</p>`}</div>`;
  const text = `${staff ? 'New order' : 'Thank you for your order'} ${o.number}\nTotal: ${money(o.total)}\nPayment: ${o.payment_method || ''}`;
  return { subject: staff ? `New order ${o.number} (${money(o.total)})` : `AND.Furniture: we received your order ${o.number}`, html, text };
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  let b: any; try { b = await req.json(); } catch { return reply({ error: 'Bad request' }, 400); }
  const { data: cfg } = await admin.from('order_mail_cfg').select('*').eq('id', 1).maybeSingle();
  const { data: snd } = await admin.from('chat_alert_cfg').select('provider,from_email,from_name').eq('id', 1).maybeSingle();
  // Owner action: is a provider connected?
  if (b.action === 'status') {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = jwt ? await admin.auth.getUser(jwt) : { data: null } as any;
    if (!u?.user) return reply({ error: 'Not signed in' }, 401);
    const { data: me } = await admin.from('profiles').select('role').eq('id', u.user.id).maybeSingle();
    if (me?.role !== 'owner') return reply({ error: 'Owner only' }, 403);
    return reply({ gmail_ready: !!(Deno.env.get('SMTP_USER') && Deno.env.get('SMTP_PASS')), resend_ready: !!Deno.env.get('RESEND_API_KEY'), provider: snd?.provider || 'gmail' });
  }
  if (b.action === 'refund') {   // owner only, after the refund is recorded. Gated by the same switches as the other order emails.
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = jwt ? await admin.auth.getUser(jwt) : { data: null } as any;
    if (!u?.user) return reply({ error: 'Not signed in' }, 401);
    const { data: me } = await admin.from('profiles').select('role').eq('id', u.user.id).maybeSingle();
    if (me?.role !== 'owner') return reply({ error: 'Owner only' }, 403);
    const rid = Number(b.order_id); if (!Number.isInteger(rid) || rid < 1) return reply({ error: 'Bad request' }, 400);
    if (!cfg?.enabled || cfg.customer === false || cfg.refund === false) return reply({ skipped: 'off' });
    const { data: o } = await admin.from('orders').update({ refund_emailed: true }).eq('id', rid).eq('refund_status', 'refunded').eq('refund_emailed', false).select('*').maybeSingle();
    if (!o || !o.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) return reply({ skipped: 'nothing to send' });
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px"><h2 style="margin:0 0 8px">Your refund</h2><p>We refunded <b>${money(o.refund_amount)}</b> for order <b>${esc(o.number)}</b>.</p><p><b>Note:</b> ${esc(o.refund_reason)}</p><p>Depending on your bank or wallet it can take a few days to show.</p></div>`;
    const r = await send(snd || {}, [o.email], `Refund for order ${o.number}`, html, `We refunded ${money(o.refund_amount)} for order ${o.number}. Note: ${o.refund_reason}`);
    await admin.from('order_mail_log').insert({ order_id: rid, sent: r.ok ? 1 : 0, note: 'refund: ' + r.note });
    return reply({ ok: r.ok });
  }
  const id = Number(b.order_id); if (!Number.isInteger(id) || id < 1) return reply({ error: 'Bad request' }, 400);
  if (!cfg?.enabled) return reply({ skipped: 'off' });
  const { data: o } = await admin.from('orders').update({ mailed_at: new Date().toISOString() }).eq('id', id).is('mailed_at', null).select('*').maybeSingle();
  if (!o) return reply({ skipped: 'already handled or no such order' });
  const notes: string[] = []; let sent = 0;
  if (cfg.customer && o.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) { const m = orderHtml(o, false); const r = await send(snd || {}, [o.email], m.subject, m.html, m.text); if (r.ok) sent++; notes.push('customer: ' + r.note); }
  if (cfg.staff) {
    const { data: ppl } = await admin.from('profiles').select('email').in('role', ['owner', 'admin']).not('email', 'is', null);
    const to = (ppl || []).map((p: any) => p.email).filter((e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
    if (to.length) { const m = orderHtml(o, true); const r = await send(snd || {}, to, m.subject, m.html, m.text); if (r.ok) sent += to.length; notes.push('staff: ' + r.note); } else notes.push('staff: no recipients');
  }
  await admin.from('order_mail_log').insert({ order_id: id, sent, note: notes.join(' | ').slice(0, 400) });
  return reply({ ok: sent > 0 });
});
