-- Chat support role (read-only orders + chats only) and chat KPI tracker. Additive.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner','admin','staff','support','customer'));
-- can_chat(): everyone on the team who may read orders and answer chats. is_staff() is unchanged and EXCLUDES support,
-- so every write policy / RPC that uses is_staff() keeps support out.
create or replace function public.can_chat() returns boolean language sql stable security definer set search_path=public as
$$ select exists (select 1 from profiles where id=auth.uid() and role in ('owner','admin','staff','support')) $$;
drop policy if exists "staff or own orders" on orders;
create policy "staff or own orders" on orders for select using (can_chat() or user_id=auth.uid());
drop policy if exists "staff or own events" on order_events;
create policy "staff or own events" on order_events for select using (can_chat() or exists (select 1 from orders o where o.id=order_id and o.user_id=auth.uid()));
drop policy if exists "staff reads chats" on chats; create policy "staff reads chats" on chats for select using (can_chat());
drop policy if exists "staff reads chat messages" on chat_messages; create policy "staff reads chat messages" on chat_messages for select using (can_chat());
alter table public.chats add column if not exists closed_by uuid references auth.users(id) on delete set null;
alter table public.chats add column if not exists closed_at timestamptz;
create or replace function public.chat_staff_send(p_chat bigint, p_body text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not can_chat() then raise exception 'not allowed'; end if;
  if length(trim(coalesce(p_body,'')))=0 then raise exception 'empty'; end if;
  insert into chat_messages(chat_id,sender,staff_id,body) values (p_chat,'staff',auth.uid(),left(trim(p_body),2000));
  update chats set last_at=now(), unread_staff=0, assigned_to=coalesce(assigned_to,auth.uid()) where id=p_chat;
end $$;
create or replace function public.chat_staff_set(p_chat bigint, p_status text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not can_chat() then raise exception 'not allowed'; end if;
  if p_status not in ('open','closed') then raise exception 'bad status'; end if;
  update chats set status=p_status, unread_staff=0,
    closed_by = case when p_status='closed' then coalesce(closed_by, auth.uid()) else null end,
    closed_at = case when p_status='closed' then coalesce(closed_at, now()) else null end
  where id=p_chat;
end $$;
create or replace function public.set_user_role(p_email text, p_role text) returns void
language plpgsql security definer set search_path=public as $$
declare e text := lower(trim(p_email));
begin
  if not is_owner() then raise exception 'owner only'; end if;
  if p_role not in ('owner','admin','staff','support','customer') then raise exception 'invalid role'; end if;
  if e = owner_email() and p_role <> 'owner' then raise exception 'the primary owner cannot be demoted; use ownership transfer'; end if;
  if exists (select 1 from profiles where id=auth.uid() and lower(email)=e) and p_role <> 'owner' then raise exception 'you cannot change your own role'; end if;
  update profiles set role=p_role where lower(email)=e;
  if not found then raise exception 'no account with this email'; end if;
end $$;

-- KPI tracker. Owner/admin see every agent; other chat members see only their own row.
create or replace function public.chat_kpis(p_from date, p_to date) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare f timestamptz := (p_from::timestamp at time zone 'Africa/Cairo'); t timestamptz := ((p_to + 1)::timestamp at time zone 'Africa/Cairo'); res jsonb; adm boolean := is_admin();
begin
  if not can_chat() then raise exception 'not allowed'; end if;
  if p_to < p_from or p_to - p_from > 366 then raise exception 'bad date range'; end if;
  with turns as (
    select v.chat_id, v.created_at vt, s.staff_id, s.created_at st,
           not exists (select 1 from chat_messages e where e.chat_id=v.chat_id and e.id<v.id) as is_first
    from chat_messages v
    left join lateral (select x.staff_id, x.created_at from chat_messages x where x.chat_id=v.chat_id and x.sender='staff' and x.id>v.id order by x.id limit 1) s on true
    where v.sender='visitor' and v.created_at>=f and v.created_at<t
      and not exists (select 1 from chat_messages p where p.chat_id=v.chat_id and p.id<v.id and p.sender='visitor' and p.id=(select max(id) from chat_messages q where q.chat_id=v.chat_id and q.id<v.id))
  ), ans as (
    select staff_id, is_first, extract(epoch from st-vt) sec from turns where st is not null and staff_id is not null
  ), sm as (
    select staff_id, count(*) msgs, count(distinct chat_id) chats from chat_messages where sender='staff' and created_at>=f and created_at<t and staff_id is not null group by staff_id
  ), rs as (
    select closed_by, count(*) n from chats where closed_at>=f and closed_at<t and closed_by is not null group by closed_by
  ), ag as (
    select p.id, p.email, p.full_name, p.role, coalesce(sm.msgs,0) messages, coalesce(sm.chats,0) chats, coalesce(rs.n,0) resolved,
      (select round(avg(sec)) from ans a where a.staff_id=p.id and a.is_first) first_avg,
      (select round(percentile_cont(0.5) within group (order by sec)::numeric) from ans a where a.staff_id=p.id and a.is_first) first_median,
      (select round(avg(sec)) from ans a where a.staff_id=p.id) avg_resp,
      (select round(percentile_cont(0.5) within group (order by sec)::numeric) from ans a where a.staff_id=p.id) median_resp,
      (select count(*) from ans a where a.staff_id=p.id) answered,
      (select round(avg(extract(epoch from c.closed_at-c.created_at))) from chats c where c.closed_by=p.id and c.closed_at>=f and c.closed_at<t) resolution_avg,
      (select count(*) from chats c where c.status='open' and c.assigned_to=p.id) workload,
      (select max(m.created_at) from chat_messages m where m.staff_id=p.id) last_active
    from profiles p left join sm on sm.staff_id=p.id left join rs on rs.closed_by=p.id
    where (sm.staff_id is not null or rs.closed_by is not null) and (adm or p.id=auth.uid())
  )
  select jsonb_build_object(
    'from',p_from,'to',p_to,'scope',case when adm then 'all' else 'own' end,
    'agents',(select coalesce(jsonb_agg(to_jsonb(ag) order by chats desc, messages desc),'[]') from ag),
    'daily',(select coalesce(jsonb_agg(jsonb_build_object('day',d::date,
        'chats',(select count(*) from chats c where c.created_at>=(d::timestamp at time zone 'Africa/Cairo') and c.created_at<((d::date+1)::timestamp at time zone 'Africa/Cairo')),
        'visitor',(select count(*) from chat_messages m where m.sender='visitor' and m.created_at>=(d::timestamp at time zone 'Africa/Cairo') and m.created_at<((d::date+1)::timestamp at time zone 'Africa/Cairo')),
        'staff',(select count(*) from chat_messages m where m.sender='staff' and m.created_at>=(d::timestamp at time zone 'Africa/Cairo') and m.created_at<((d::date+1)::timestamp at time zone 'Africa/Cairo'))
      ) order by d),'[]') from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d),
    'totals',jsonb_build_object(
      'chats',(select count(*) from chats where created_at>=f and created_at<t),
      'resolved',(select count(*) from chats where closed_at>=f and closed_at<t),
      'open_now',(select count(*) from chats where status='open'),
      'waiting_now',(select count(*) from chats c where c.status='open' and (select m.sender from chat_messages m where m.chat_id=c.id order by m.id desc limit 1)='visitor'),
      'first_avg',(select round(avg(sec)) from ans where is_first),
      'avg_resp',(select round(avg(sec)) from ans))
  ) into res;
  return res;
end $$;
grant execute on function public.chat_kpis(date,date), public.can_chat() to authenticated;

-- Per-conversation tracker. Derived status: waiting (open, customer wrote last), pending (open, we wrote last), resolved (closed).
create or replace function public.chat_conversations(p_from date, p_to date, p_agent uuid default null) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare f timestamptz := (p_from::timestamp at time zone 'Africa/Cairo'); t timestamptz := ((p_to + 1)::timestamp at time zone 'Africa/Cairo'); adm boolean := is_admin(); res jsonb;
begin
  if not can_chat() then raise exception 'not allowed'; end if;
  if p_to < p_from or p_to - p_from > 366 then raise exception 'bad date range'; end if;
  select coalesce(jsonb_agg(x order by x.created_at desc),'[]') into res from (
    select c.id, c.visitor_name, c.created_at, c.last_at, c.closed_at,
      case when c.status='closed' then 'resolved' when (select m.sender from chat_messages m where m.chat_id=c.id order by m.id desc limit 1)='visitor' then 'waiting' else 'pending' end as status,
      c.assigned_to, (select coalesce(nullif(p.full_name,''),p.email) from profiles p where p.id=c.assigned_to) as agent,
      (select count(*) from chat_messages m where m.chat_id=c.id and m.sender='visitor') as visitor_msgs,
      (select count(*) from chat_messages m where m.chat_id=c.id and m.sender='staff') as staff_msgs,
      (select round(extract(epoch from (select min(s.created_at) from chat_messages s where s.chat_id=c.id and s.sender='staff') - (select min(v.created_at) from chat_messages v where v.chat_id=c.id and v.sender='visitor')))) as first_response_sec,
      case when c.closed_at is not null then round(extract(epoch from c.closed_at-c.created_at)) end as resolution_sec
    from chats c
    where c.created_at>=f and c.created_at<t
      and (p_agent is null or c.assigned_to=p_agent)
      and (adm or c.assigned_to=auth.uid() or c.assigned_to is null)
    order by c.created_at desc limit 500) x;
  return res;
end $$;
grant execute on function public.chat_conversations(date,date,uuid) to authenticated;
