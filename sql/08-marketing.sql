-- Marketing workspace storage (strategy plan, content calendar posts, campaigns). Additive. Owner/admin only.
create table if not exists public.marketing_items (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('plan','post','campaign')),
  data jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(), created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.marketing_items enable row level security;
drop policy if exists "admins manage marketing" on marketing_items;
create policy "admins manage marketing" on marketing_items for all using (is_admin()) with check (is_admin());
