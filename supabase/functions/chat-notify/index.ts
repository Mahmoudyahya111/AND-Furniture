// AND.Furniture: email owner/support staff when a customer starts a new chat (one email per chat).
// Needs secrets SMTP_USER + SMTP_PASS (Gmail app password) or RESEND_API_KEY, set outside the repo. Config lives in the private table chat_alert_cfg.
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
function mail(name: string, msg: string, at: Date, id: number | string) {
  const when = at.toLocaleString('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' }) + ' (Cairo)';
  const link = SITE + 'chat-admin.html';
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px"><h2 style="margin:0 0 8px">New customer chat #${esc(String(id))}</h2><p><b>Customer:</b> ${esc(name)}<br><b>Time:</b> ${esc(when)}</p><p style="background:#faf6f0;border-left:4px solid #c9a45c;padding:10px 12px;white-space:pre-wrap">${esc(msg)}</p><p><a href="${link}" style="background:#c9a45c;color:#1b130d;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Open chat console</a></p><p style="color:#888;font-size:12px">AND.Furniture. You get this because you are a team member with chat alerts on.</p></div>`;
  return { subject: `New chat #${id} from ${name}`, html, text: `New customer chat #${id}\nCustomer: ${name}\nTime: ${when}\n\n${msg}\n\nOpen: ${link}` };
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  let b: any; try { b = await req.json(); } catch { return reply({ error: 'Bad request' }, 400); }
  const { data: cfg } = await admin.from('chat_alert_cfg').select('*').eq('id', 1).maybeSingle();
  // Owner actions: provider status and a test email.
  if (b.action) {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = jwt ? await admin.auth.getUser(jwt) : { data: null } as any;
    if (!u?.user) return reply({ error: 'Not signed in' }, 401);
    const { data: me } = await admin.from('profiles').select('role,email').eq('id', u.user.id).maybeSingle();
    if (!me || me.role !== 'owner') return reply({ error: 'Owner only' }, 403);
    if (b.action === 'status') return reply({ gmail_ready: !!(Deno.env.get('SMTP_USER') && Deno.env.get('SMTP_PASS')), resend_ready: !!Deno.env.get('RESEND_API_KEY'), provider: cfg?.provider || 'gmail' });
    if (b.action === 'test') { const m = mail('Test customer', 'This is a test alert. Real alerts show the first message of the new chat.', new Date(), 'TEST'); const r = await send(cfg || {}, [me.email], '[Test] ' + m.subject, m.html, m.text); return reply(r, r.ok ? 200 : 400); }
    return reply({ error: 'Unknown action' }, 400);
  }
  // New chat alert: no sign-in, but only fires once per real chat and only when the owner turned it on.
  const id = Number(b.chat_id); if (!Number.isInteger(id) || id < 1) return reply({ error: 'Bad request' }, 400);
  if (!cfg?.enabled) return reply({ skipped: 'off' });
  const { data: claim } = await admin.from('chats').update({ alerted_at: new Date().toISOString() }).eq('id', id).is('alerted_at', null).select('id,visitor_name,created_at').maybeSingle();
  if (!claim) return reply({ skipped: 'already alerted or no such chat' });
  const { data: m } = await admin.from('chat_messages').select('body').eq('chat_id', id).eq('sender', 'visitor').order('id').limit(1).maybeSingle();
  let q = admin.from('profiles').select('id,email').in('role', ['owner', 'support']).not('email', 'is', null);
  if (cfg.mode === 'selected') q = q.in('id', cfg.ids?.length ? cfg.ids : ['00000000-0000-0000-0000-000000000000']);
  const { data: ppl } = await q;
  const to = (ppl || []).map((p: any) => p.email).filter((e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  if (!to.length) { await admin.from('chat_alert_log').insert({ chat_id: id, sent: 0, note: 'no recipients' }); return reply({ skipped: 'no recipients' }); }
  const e = mail(claim.visitor_name || 'Visitor', m?.body || '(no message)', new Date(claim.created_at), id);
  const r = await send(cfg, to, e.subject, e.html, e.text);
  await admin.from('chat_alert_log').insert({ chat_id: id, sent: r.ok ? to.length : 0, note: r.note });
  return reply({ ok: r.ok });
});
