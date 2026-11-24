-- Analytics (first-party, no personal data). Additive.
create or replace function public.can_view_analytics() returns boolean language sql stable security definer set search_path to 'public' as $f$ select exists (select 1 from profiles where id=auth.uid() and role in ('owner','admin')) $f$;
create table if not exists public.page_events(
  id bigserial primary key,
  created_at timestamptz not null default now(),
  session_id text not null,
  event text not null default 'view' check (event in ('view','engage')),
  path text not null,
  title text,
  secs int,
  referrer_host text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  has_fbclid boolean not null default false,
  channel text not null default 'direct',
  platform text,
  device text,
  inapp boolean not null default false
);
create index if not exists page_events_created on public.page_events(created_at desc);
create index if not exists page_events_chan on public.page_events(channel, created_at desc);
alter table public.page_events enable row level security;
drop policy if exists page_events_staff_read on public.page_events;
create policy page_events_staff_read on public.page_events for select to authenticated using (public.can_view_analytics());
revoke all on public.page_events from anon, authenticated; grant select on public.page_events to authenticated;
grant usage, select on sequence public.page_events_id_seq to anon, authenticated;

create or replace function public.track_event(p_session text, p_event text, p_path text, p_title text, p_secs int, p_ref text, p_source text, p_medium text, p_campaign text, p_content text, p_term text, p_fbclid boolean, p_device text, p_inapp boolean)
returns void language plpgsql security definer set search_path to 'public' as $f$
declare ch text; pf text; src text := lower(coalesce(nullif(left(p_source,60),''),'')); med text := lower(coalesce(nullif(left(p_medium,60),''),'')); rh text := lower(coalesce(left(p_ref,100),''));
        fbsrc boolean; paidmed boolean; fbref boolean;
begin
  if p_session is null or length(p_session) < 8 or length(p_session) > 64 or p_path is null or length(p_path) > 200 then return; end if;
  if p_event not in ('view','engage') then return; end if;
  fbsrc := src ~ '^(fb|facebook|meta|ig|instagram|an|audience_network|messenger)' or src like '%facebook%' or src like '%instagram%';
  paidmed := med ~ '(cpc|ppc|paid|cpm|cpv|ads?$|social_paid|paid_social|boost)';
  fbref := rh ~ '(^|\.)(facebook\.com|fb\.com|fb\.me|instagram\.com|messenger\.com|l\.facebook\.com|lm\.facebook\.com|l\.instagram\.com)$';
  if (fbsrc and paidmed) or (p_fbclid and paidmed) then ch := 'meta_paid';
  elsif p_fbclid or fbsrc then ch := 'meta_click';
  elsif fbref then ch := 'meta_organic';
  elsif rh <> '' then ch := 'referral';
  else ch := 'direct'; end if;
  pf := case when src like '%insta%' or src = 'ig' or rh like '%instagram%' then 'instagram' when fbsrc or p_fbclid or fbref then 'facebook' else null end;
  if p_event = 'engage' then
    insert into page_events(session_id,event,path,secs,channel,device) values (p_session,'engage',left(p_path,200),least(greatest(coalesce(p_secs,0),0),1800),'direct',left(p_device,12));
    return;
  end if;
  insert into page_events(session_id,event,path,title,referrer_host,utm_source,utm_medium,utm_campaign,utm_content,utm_term,has_fbclid,channel,platform,device,inapp)
  values (p_session,'view',left(p_path,200),left(p_title,120),nullif(rh,''),nullif(src,''),nullif(med,''),nullif(left(p_campaign,100),''),nullif(left(p_content,100),''),nullif(left(p_term,100),''),coalesce(p_fbclid,false),ch,pf,left(p_device,12),coalesce(p_inapp,false));
end $f$;
grant execute on function public.track_event(text,text,text,text,int,text,text,text,text,text,text,boolean,text,boolean) to anon, authenticated;

create or replace function public.analytics_summary(p_days int default 30) returns jsonb language plpgsql stable security definer set search_path to 'public' as $f$
declare since timestamptz := now() - make_interval(days => least(greatest(p_days,1),365)); r jsonb;
begin
  if not public.can_view_analytics() then raise exception 'not allowed'; end if;
  with v as (select * from page_events where event='view' and created_at >= since),
  e as (select path, session_id, sum(secs) s from page_events where event='engage' and created_at >= since group by 1,2),
  sess as (select session_id, count(*) n from v group by 1)
  select jsonb_build_object(
    'views',(select count(*) from v),
    'visitors',(select count(distinct session_id) from v),
    'avg_secs',(select round(avg(s))::int from e),
    'pages_per_session',(select round(avg(n)::numeric,1) from sess),
    'bounce_pct',(select case when count(*)=0 then null else round(100.0*count(*) filter (where n=1)/count(*)) end from sess),
    'inapp_views',(select count(*) from v where inapp),
    'days',(select coalesce(jsonb_agg(x order by x->>'d'),'[]') from (select jsonb_build_object('d',to_char(created_at at time zone 'Africa/Cairo','YYYY-MM-DD'),'views',count(*),'visitors',count(distinct session_id)) x from v group by to_char(created_at at time zone 'Africa/Cairo','YYYY-MM-DD')) q),
    'pages',(select coalesce(jsonb_agg(x order by (x->>'views')::int desc),'[]') from (select jsonb_build_object('path',v.path,'title',max(v.title),'views',count(*),'visitors',count(distinct v.session_id),'avg_secs',(select round(avg(s))::int from e where e.path=v.path)) x from v group by v.path order by count(*) desc limit 20) q),
    'channels',(select coalesce(jsonb_agg(x order by (x->>'views')::int desc),'[]') from (select jsonb_build_object('ch',channel,'views',count(*),'visitors',count(distinct session_id)) x from v group by channel) q),
    'devices',(select coalesce(jsonb_agg(x),'[]') from (select jsonb_build_object('device',coalesce(device,'?'),'visitors',count(distinct session_id)) x from v group by device) q),
    'meta_by_page',(select coalesce(jsonb_agg(x order by (x->>'paid_views')::int desc, (x->>'click_views')::int desc),'[]') from (select jsonb_build_object('path',path,'title',max(title),'paid_visitors',count(distinct session_id) filter (where channel='meta_paid'),'paid_views',count(*) filter (where channel='meta_paid'),'click_visitors',count(distinct session_id) filter (where channel='meta_click'),'click_views',count(*) filter (where channel='meta_click'),'organic_visitors',count(distinct session_id) filter (where channel='meta_organic'),'organic_views',count(*) filter (where channel='meta_organic')) x from v where channel like 'meta_%' group by path) q),
    'campaigns',(select coalesce(jsonb_agg(x order by (x->>'views')::int desc),'[]') from (select jsonb_build_object('campaign',coalesce(utm_campaign,'(no campaign tag)'),'source',utm_source,'medium',utm_medium,'content',utm_content,'platform',platform,'ch',channel,'views',count(*),'visitors',count(distinct session_id)) x from v where channel in ('meta_paid','meta_click') group by utm_campaign,utm_source,utm_medium,utm_content,platform,channel order by count(*) desc limit 30) q)
  ) into r;
  return r;
end $f$;
revoke all on function public.analytics_summary(int) from public, anon; grant execute on function public.analytics_summary(int) to authenticated;
