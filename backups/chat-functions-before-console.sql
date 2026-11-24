CREATE OR REPLACE FUNCTION public.can_chat()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists (select 1 from profiles where id=auth.uid() and role in ('owner','admin','staff','support')) $function$
;

CREATE OR REPLACE FUNCTION public.chat_staff_send(p_chat bigint, p_body text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not can_chat() then raise exception 'not allowed'; end if;
  if length(trim(coalesce(p_body,'')))=0 then raise exception 'empty'; end if;
  insert into chat_messages(chat_id,sender,staff_id,body) values (p_chat,'staff',auth.uid(),left(trim(p_body),2000));
  update chats set last_at=now(), unread_staff=0, assigned_to=coalesce(assigned_to,auth.uid()) where id=p_chat;
end $function$
;

CREATE OR REPLACE FUNCTION public.chat_staff_set(p_chat bigint, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not can_chat() then raise exception 'not allowed'; end if;
  if p_status not in ('open','closed') then raise exception 'bad status'; end if;
  update chats set status=p_status, unread_staff=0,
    closed_by = case when p_status='closed' then coalesce(closed_by, auth.uid()) else null end,
    closed_at = case when p_status='closed' then coalesce(closed_at, now()) else null end
  where id=p_chat;
end $function$
;


