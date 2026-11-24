// Owner-only team management. Uses the service role on the server; the key never reaches the browser.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const ROLES = ["owner", "admin", "staff", "support"];
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Not signed in" }, 401);
  const { data: u, error: ue } = await admin.auth.getUser(jwt);
  if (ue || !u?.user) return json({ error: "Not signed in" }, 401);
  const { data: me } = await admin.from("profiles").select("role,email").eq("id", u.user.id).maybeSingle();
  if (!me || me.role !== "owner") return json({ error: "Owner only" }, 403);
  let b: any; try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Enter a valid email" }, 400);
  const pw = b.password == null ? null : String(b.password);
  if (pw !== null && pw.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
  const { data: so } = await admin.from("site_settings").select("value").eq("key", "owner_email").maybeSingle();
  const primary = String(so?.value ?? "").toLowerCase();
  if (b.action === "create_user") {
    const role = String(b.role || "staff"); if (!ROLES.includes(role)) return json({ error: "Invalid role" }, 400);
    if (!pw) return json({ error: "Password required" }, 400);
    const { data: ex } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    let id = ex?.id as string | undefined;
    if (id) { if (email === primary || id === u.user.id) return json({ error: "Use the dedicated controls for this account" }, 400); const r = await admin.auth.admin.updateUserById(id, { password: pw, email_confirm: true }); if (r.error) return json({ error: r.error.message }, 400); }
    else { const r = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { full_name: String(b.full_name || "") } }); if (r.error) return json({ error: r.error.message }, 400); id = r.data.user!.id; }
    for (let i = 0; i < 5; i++) { const { data: p } = await admin.from("profiles").select("id").eq("id", id).maybeSingle(); if (p) break; await new Promise((r) => setTimeout(r, 200)); }
    const up = await admin.from("profiles").update({ role, ...(b.full_name ? { full_name: String(b.full_name) } : {}) }).eq("id", id);
    if (up.error) return json({ error: up.error.message }, 400);
    return json({ ok: true, existed: !!ex, email, role });
  }
  if (b.action === "set_password") {
    if (!pw) return json({ error: "Password required" }, 400);
    const { data: t } = await admin.from("profiles").select("id,role").eq("email", email).maybeSingle();
    if (!t) return json({ error: "No account with this email" }, 404);
    if (t.role === "customer") return json({ error: "Only team members can be managed here" }, 400);
    if (email === primary && t.id !== u.user.id) return json({ error: "The primary owner's password can only be changed by the primary owner" }, 403);
    const r = await admin.auth.admin.updateUserById(t.id, { password: pw, email_confirm: true });
    if (r.error) return json({ error: r.error.message }, 400);
    return json({ ok: true });
  }
  return json({ error: "Unknown action" }, 400);
});
