-- Email alert on new chat. Additive. Config is private (owner only), not in public site_settings.
create extension if not exists pg_net with schema extensions;
create table if not exists public.chat_alert_cfg(
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  mode text not null default 'all' check (mode in ('all','selected')),
  ids uuid[] not null default '{}',
  from_email text, from_name text
);
insert into public.chat_alert_cfg(id) values (1) on conflict do nothing;
alter table public.chat_alert_cfg enable row level security;
drop policy if exists chat_alert_cfg_owner on public.chat_alert_cfg;
create policy chat_alert_cfg_owner on public.chat_alert_cfg for all to authenticated using (public.is_owner()) with check (public.is_owner());
revoke all on public.chat_alert_cfg from anon; grant select, insert, update on public.chat_alert_cfg to authenticated;
alter table public.chats add column if not exists alerted_at timestamptz;
create table if not exists public.chat_alert_log(id bigserial primary key, created_at timestamptz default now(), chat_id bigint, sent int default 0, note text);
alter table public.chat_alert_log enable row level security;
drop policy if exists chat_alert_log_owner on public.chat_alert_log;
create policy chat_alert_log_owner on public.chat_alert_log for select to authenticated using (public.is_owner());
revoke all on public.chat_alert_log from anon; grant select on public.chat_alert_log to authenticated;

create or replace function public.chat_alert_on_new() returns trigger language plpgsql security definer set search_path to 'public','extensions' as $f$
declare en boolean;
begin
  select enabled into en from chat_alert_cfg where id=1;
  if coalesce(en,false) then
    begin
      perform net.http_post(url := 'https://cwsacjdetdspaqzgjcuw.supabase.co/functions/v1/chat-notify',
        headers := jsonb_build_object('Content-Type','application/json'),
        body := jsonb_build_object('chat_id', new.id), timeout_milliseconds := 5000);
    exception when others then null; end;
  end if;
  return new;
end $f$;
revoke all on function public.chat_alert_on_new() from public, anon, authenticated;

drop trigger if exists chat_alert_new on public.chats;
create trigger chat_alert_new after insert on public.chats for each row execute function public.chat_alert_on_new();
alter table public.chat_alert_cfg add column if not exists provider text not null default 'gmail' check (provider in ('gmail','resend'));
