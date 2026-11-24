-- AND chat console (additive). Mirrors TELEGANT: claim, transfer, close, presence, alias, survey, per-agent tracking.
alter table chats add column if not exists claimed_by uuid, add column if not exists claimed_name text, add column if not exists first_reply_at timestamptz,
  add column if not exists rating int, add column if not exists resolved boolean, add column if not exists feedback text;
alter table profiles add column if not exists chat_alias text;
create table if not exists agent_presence(user_id uuid primary key, status text not null default 'offline', since timestamptz default now());
create table if not exists presence_log(id bigint generated always as identity primary key, user_id uuid not null, status text not null, at timestamptz default now());
create table if not exists agent_logins(id bigint generated always as identity primary key, user_id uuid not null, login_at timestamptz default now(), logout_at timestamptz);
alter table agent_presence enable row level security; alter table presence_log enable row level security; alter table agent_logins enable row level security;
drop policy if exists staff_read_presence on agent_presence; create policy staff_read_presence on agent_presence for select using (can_chat());
drop policy if exists staff_read_plog on presence_log; create policy staff_read_plog on presence_log for select using (can_chat());
drop policy if exists staff_read_logins on agent_logins; create policy staff_read_logins on agent_logins for select using (can_chat());
create or replace function chat_display_name(u uuid) returns text language sql stable security definer set search_path=public as $$
  select coalesce(nullif(trim(chat_alias),''), 'Support') from profiles where id=u $$;
create or replace function set_presence(p text) returns void language plpgsql security definer set search_path=public as $$
begin if not can_chat() then raise exception 'not allowed'; end if;
  if p not in ('available','break','offline') then raise exception 'bad status'; end if;
  insert into agent_presence(user_id,status,since) values (auth.uid(),p,now()) on conflict (user_id) do update set status=p, since=now();
  insert into presence_log(user_id,status) values (auth.uid(),p); end $$;
create or replace function set_my_alias(p text) returns void language plpgsql security definer set search_path=public as $$
begin if not can_chat() then raise exception 'not allowed'; end if;
  update profiles set chat_alias=left(nullif(trim(coalesce(p,'')),''),30) where id=auth.uid(); end $$;
create or replace function agent_login() returns void language plpgsql security definer set search_path=public as $$
begin if not can_chat() then raise exception 'not allowed'; end if;
  if not exists (select 1 from agent_logins where user_id=auth.uid() and logout_at is null and login_at>now()-interval '10 minutes') then
    update agent_logins set logout_at=login_at where user_id=auth.uid() and logout_at is null;
    insert into agent_logins(user_id) values (auth.uid()); end if;
  insert into agent_presence(user_id,status) values (auth.uid(),'available') on conflict (user_id) do nothing; end $$;
create or replace function agent_logout() returns void language plpgsql security definer set search_path=public as $$
begin if not can_chat() then raise exception 'not allowed'; end if;
  update agent_logins set logout_at=now() where user_id=auth.uid() and logout_at is null;
  insert into agent_presence(user_id,status) values (auth.uid(),'offline') on conflict (user_id) do update set status='offline', since=now();
  insert into presence_log(user_id,status) values (auth.uid(),'offline'); end $$;
create or replace function staff_list() returns table(id uuid, name text, role text, status text) language plpgsql stable security definer set search_path=public as $$
begin if not can_chat() then raise exception 'not allowed'; end if;
  return query select p.id, coalesce(nullif(trim(p.chat_alias),''), p.full_name, split_part(p.email,'@',1)), p.role, coalesce(a.status,'offline')
   from profiles p left join agent_presence a on a.user_id=p.id where p.role in ('owner','admin','staff','support') order by 2; end $$;
create or replace function chat_claim(p_chat bigint) returns void language plpgsql security definer set search_path=public as $$
declare c chats%rowtype; r text;
begin if not can_chat() then raise exception 'not allowed'; end if;
  select role into r from profiles where id=auth.uid();
  select * into c from chats where id=p_chat for update; if not found then raise exception 'chat not found'; end if;
  if c.status='closed' then raise exception 'this chat is closed'; end if;
  if c.claimed_by is not null and c.claimed_by<>auth.uid() and r not in ('owner','admin') then raise exception 'already handled by %', c.claimed_name; end if;
  update chats set claimed_by=auth.uid(), claimed_name=chat_display_name(auth.uid()), assigned_to=auth.uid(), unread_staff=0 where id=p_chat; end $$;
create or replace function chat_transfer(p_chat bigint, p_to uuid) returns void language plpgsql security definer set search_path=public as $$
declare c chats%rowtype;
begin if not can_chat() then raise exception 'not allowed'; end if;
  select * into c from chats where id=p_chat for update; if not found then raise exception 'chat not found'; end if;
  if c.claimed_by is distinct from auth.uid() and (select role from profiles where id=auth.uid()) not in ('owner','admin') then raise exception 'only the agent handling this chat can transfer it'; end if;
  if not exists (select 1 from profiles where id=p_to and role in ('owner','admin','staff','support')) then raise exception 'unknown agent'; end if;
  update chats set claimed_by=p_to, claimed_name=chat_display_name(p_to), assigned_to=p_to where id=p_chat;
  insert into chat_messages(chat_id,sender,staff_id,body) values (p_chat,'system',null,'Chat transferred to '||chat_display_name(p_to)); end $$;
create or replace function chat_close(p_chat bigint) returns void language plpgsql security definer set search_path=public as $$
begin if not can_chat() then raise exception 'not allowed'; end if;
  update chats set status='closed', closed_by=coalesce(closed_by,auth.uid()), closed_at=coalesce(closed_at,now()), unread_staff=0 where id=p_chat; end $$;
create or replace function chat_staff_send(p_chat bigint, p_body text) returns void language plpgsql security definer set search_path=public as $$
begin if not can_chat() then raise exception 'not allowed'; end if;
  if length(trim(coalesce(p_body,'')))=0 then raise exception 'empty'; end if;
  insert into chat_messages(chat_id,sender,staff_id,body) values (p_chat,'staff',auth.uid(),left(trim(p_body),2000));
  update chats set last_at=now(), unread_staff=0, first_reply_at=coalesce(first_reply_at,now()),
    claimed_by=coalesce(claimed_by,auth.uid()), claimed_name=coalesce(claimed_name,chat_display_name(auth.uid())), assigned_to=coalesce(assigned_to,auth.uid()) where id=p_chat; end $$;
-- visitor satisfaction survey, by chat token (only on a closed chat, once)
create or replace function chat_visitor_rate(p_token text, p_rating int, p_resolved boolean, p_fb text) returns void language plpgsql security definer set search_path=public as $$
begin if length(coalesce(p_token,''))<16 or p_rating not between 1 and 5 then raise exception 'bad request'; end if;
  update chats set rating=p_rating, resolved=p_resolved, feedback=left(p_fb,1000) where id=(select id from chats where token=p_token and status='closed' and rating is null order by id desc limit 1);
  if not found then raise exception 'survey already sent or chat not found'; end if; end $$;
-- lock down: staff functions are not callable signed out
revoke execute on function set_presence(text), set_my_alias(text), agent_login(), agent_logout(), staff_list(), chat_claim(bigint), chat_transfer(bigint,uuid), chat_close(bigint), chat_staff_send(bigint,text), chat_display_name(uuid) from public, anon;
grant execute on function set_presence(text), set_my_alias(text), agent_login(), agent_logout(), staff_list(), chat_claim(bigint), chat_transfer(bigint,uuid), chat_close(bigint), chat_staff_send(bigint,text) to authenticated;
revoke execute on function chat_visitor_rate(text,int,boolean,text) from public; grant execute on function chat_visitor_rate(text,int,boolean,text) to anon, authenticated;
alter table chat_messages drop constraint chat_messages_sender_check; alter table chat_messages add constraint chat_messages_sender_check check (sender in ('visitor','staff','system'));
