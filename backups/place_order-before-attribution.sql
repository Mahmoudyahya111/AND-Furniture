CREATE OR REPLACE FUNCTION public.place_order(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare it jsonb; prod products%rowtype; qty int; lines jsonb := '[]'; sub numeric := 0; fee numeric := 0; free_over numeric; flat numeric;
        gov text := trim(coalesce(p->>'governorate','')); o orders%rowtype; pm text := coalesce(p->>'payment_method','cod');
begin
  if coalesce(trim(p->>'customer_name'),'')='' or coalesce(trim(p->>'phone'),'')='' or coalesce(trim(p->>'address'),'')='' then raise exception 'missing details'; end if;
  if (p->>'phone') !~ '^[0-9+ ()-]{8,20}$' then raise exception 'invalid phone'; end if;
  if pm not in ('cod','instapay','wallet','bank') then pm := 'cod'; end if;
  if jsonb_typeof(p->'items')<>'array' or jsonb_array_length(p->'items')=0 then raise exception 'empty cart'; end if;
  if jsonb_array_length(p->'items')>40 then raise exception 'too many items'; end if;
  for it in select * from jsonb_array_elements(p->'items') loop
    qty := greatest(1, least(20, coalesce((it->>'qty')::int,1)));
    select * into prod from products where id=(it->>'id')::bigint and active for update;
    if not found then raise exception 'product unavailable'; end if;
    if prod.stock < qty then raise exception 'not enough stock for %', prod.name_en; end if;
    update products set stock = stock - qty where id=prod.id;
    sub := sub + prod.price*qty;
    lines := lines || jsonb_build_object('id',prod.id,'name_ar',prod.name_ar,'name_en',prod.name_en,'price',prod.price,'qty',qty,'color',nullif(it->>'color',''),'image',prod.images[1]);
  end loop;
  select coalesce((value #>> '{}')::numeric,0) into flat from site_settings where key='delivery_fee';
  select coalesce((value #>> '{}')::numeric,0) into free_over from site_settings where key='free_delivery_over';
  fee := coalesce(flat,0); if coalesce(free_over,0)>0 and sub>=free_over then fee := 0; end if;
  insert into orders(user_id,customer_name,phone,email,governorate,address,notes,items,subtotal,delivery_fee,total,payment_method)
  values (auth.uid(), left(trim(p->>'customer_name'),120), trim(p->>'phone'), nullif(left(trim(coalesce(p->>'email','')),160),''), left(gov,60),
          left(trim(p->>'address'),400), left(nullif(trim(coalesce(p->>'notes','')),''),500), lines, sub, fee, sub+fee, pm) returning * into o;
  insert into order_events(order_id,status,note) values (o.id,'new','Order placed');
  return jsonb_build_object('number',o.number,'total',o.total,'delivery_fee',o.delivery_fee);
end $function$
