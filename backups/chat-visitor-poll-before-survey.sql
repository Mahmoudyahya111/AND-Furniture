CREATE OR REPLACE FUNCTION public.chat_visitor_poll(p_token text, p_after bigint DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c chats%rowtype;
begin
  select * into c from chats where token=p_token order by id desc limit 1;
  if not found then return jsonb_build_object('status','none','messages','[]'::jsonb); end if;
  return jsonb_build_object('status',c.status,'messages',
    (select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'sender',m.sender,'body',m.body,'at',m.created_at) order by m.id),'[]') from chat_messages m where m.chat_id=c.id and m.id>p_after));
end $function$

