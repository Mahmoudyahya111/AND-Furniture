-- AND: order emails (customer confirmation + staff copy). Additive. OFF by default; needs a connected sender to actually send.
create extension if not exists pg_net with schema extensions;
create table if not exists public.order_mail_cfg(id int primary key default 1 check (id = 1), enabled boolean not null default false, customer boolean not null default true, staff boolean not null default true);
insert into public.order_mail_cfg(id) values (1) on conflict do nothing;
alter table public.order_mail_cfg enable row level security;
drop policy if exists order_mail_cfg_owner on public.order_mail_cfg;
create policy order_mail_cfg_owner on public.order_mail_cfg for all to authenticated using (public.is_owner()) with check (public.is_owner());
revoke all on public.order_mail_cfg from anon; grant select, insert, update on public.order_mail_cfg to authenticated;
alter table public.orders add column if not exists mailed_at timestamptz;
create table if not exists public.order_mail_log(id bigserial primary key, created_at timestamptz default now(), order_id bigint, sent int default 0, note text);
alter table public.order_mail_log enable row level security;
drop policy if exists order_mail_log_owner on public.order_mail_log;
create policy order_mail_log_owner on public.order_mail_log for select to authenticated using (public.is_owner());
revoke all on public.order_mail_log from anon; grant select on public.order_mail_log to authenticated;
create or replace function public.order_mail_on_new() returns trigger language plpgsql security definer set search_path to 'public','extensions' as $f$
declare en boolean;
begin
  select enabled into en from order_mail_cfg where id=1;
  if coalesce(en,false) then
    begin
      perform net.http_post(url := 'https://cwsacjdetdspaqzgjcuw.supabase.co/functions/v1/order-notify', headers := jsonb_build_object('Content-Type','application/json'), body := jsonb_build_object('order_id', new.id), timeout_milliseconds := 5000);
    exception when others then null; end;
  end if;
  return new;
end $f$;
revoke all on function public.order_mail_on_new() from public, anon, authenticated;
drop trigger if exists order_mail_new on public.orders;
create trigger order_mail_new after insert on public.orders for each row execute function public.order_mail_on_new();
