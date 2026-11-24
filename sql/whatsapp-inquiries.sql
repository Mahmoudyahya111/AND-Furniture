-- AND: WhatsApp inquiries (separate from orders). Additive. A click on "Order on WhatsApp" is logged here; staff convert it to a real order after chatting.
create table if not exists public.whatsapp_inquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  product_id bigint, product_name text, color text, qty int not null default 1,
  page text, utm jsonb,
  status text not null default 'new' check (status in ('new','converted','dismissed')),
  order_number text, handled_at timestamptz
);
alter table public.whatsapp_inquiries enable row level security;
drop policy if exists wi_staff_read on public.whatsapp_inquiries;
create policy wi_staff_read on public.whatsapp_inquiries for select using (is_staff());
drop policy if exists wi_staff_update on public.whatsapp_inquiries;
create policy wi_staff_update on public.whatsapp_inquiries for update using (is_staff()) with check (is_staff());
-- no insert/delete policies: rows are created only by the RPC below.
create or replace function public.log_whatsapp_inquiry(p jsonb) returns void language plpgsql security definer set search_path=public as $$
declare pr products%rowtype; q int;
begin
  if coalesce((select value from site_settings where key='wa_order_enabled'),'true'::jsonb) = 'false'::jsonb then return; end if;
  if p is null or jsonb_typeof(p)<>'object' then return; end if;
  select * into pr from products where id=nullif(p->>'id','')::bigint and active; if not found then return; end if;
  if (select count(*) from whatsapp_inquiries where created_at > now()-interval '10 minutes') >= 60 then return; end if;
  q := greatest(1, least(20, coalesce(nullif(p->>'qty','')::int,1)));
  insert into whatsapp_inquiries(product_id,product_name,color,qty,page,utm)
  values (pr.id, pr.name_en, left(nullif(p->>'color',''),40), q, left(coalesce(p->>'page',''),120), case when jsonb_typeof(p->'utm')='object' and length(p->>'utm')<600 then p->'utm' end);
end $$;
grant execute on function public.log_whatsapp_inquiry(jsonb) to anon, authenticated;
create or replace function public.convert_inquiry(p_id bigint, p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare w whatsapp_inquiries%rowtype; r jsonb;
begin
  if not is_staff() then raise exception 'not allowed'; end if;
  select * into w from whatsapp_inquiries where id=p_id for update;
  if not found or w.status<>'new' then raise exception 'inquiry not open'; end if;
  if w.product_id is null then raise exception 'product missing'; end if;
  r := place_order(p || jsonb_build_object('items', jsonb_build_array(jsonb_build_object('id',w.product_id,'qty',w.qty,'color',coalesce(w.color,'')))));
  update orders set user_id=null, notes=left(coalesce(notes||' | ','')||'WhatsApp inquiry #'||w.id,500) where number=r->>'number';
  update whatsapp_inquiries set status='converted', order_number=r->>'number', handled_at=now() where id=w.id;
  return r;
end $$;
revoke execute on function public.convert_inquiry(bigint,jsonb) from anon;
grant execute on function public.convert_inquiry(bigint,jsonb) to authenticated;
