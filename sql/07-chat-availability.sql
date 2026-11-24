-- Chat availability: setting "chat" = {"mode":"hours"|"manual","manual_on":true|false}; default follows working hours.
insert into site_settings(key,value) values ('chat','{"mode":"hours","manual_on":true}') on conflict (key) do nothing;
create or replace function public.chat_status() returns jsonb language plpgsql stable security definer set search_path=public as $$
declare c jsonb := coalesce((select value from site_settings where key='chat'),'{}'::jsonb); h jsonb := coalesce((select value from site_settings where key='hours'),'{}'::jsonb);
  mode text := coalesce(c->>'mode','hours'); nowc timestamp := (now() at time zone 'Africa/Cairo'); k text; v text; m text[]; st int; en int; cur int; online boolean; anyh boolean := false;
begin
  if mode='manual' then return jsonb_build_object('mode','manual','online',coalesce((c->>'manual_on')::boolean,true)); end if;
  k := (array['sun','mon','tue','wed','thu','fri','sat'])[extract(dow from nowc)::int+1];
  select bool_or(coalesce(h->>d,'')<>'') into anyh from unnest(array['sat','sun','mon','tue','wed','thu','fri']) d;
  if not coalesce(anyh,false) then return jsonb_build_object('mode','hours','online',true,'note','no hours set'); end if;
  v := coalesce(h->>k,''); m := regexp_match(v, '(\d{1,2}):(\d{2})\s*[^0-9]+\s*(\d{1,2}):(\d{2})');
  if m is null then return jsonb_build_object('mode','hours','online',false); end if;
  st := m[1]::int*60+m[2]::int; en := m[3]::int*60+m[4]::int; cur := extract(hour from nowc)::int*60+extract(minute from nowc)::int;
  online := case when en>st then cur>=st and cur<en else cur>=st or cur<en end;
  return jsonb_build_object('mode','hours','online',online);
end $$;
grant execute on function public.chat_status() to anon, authenticated;
