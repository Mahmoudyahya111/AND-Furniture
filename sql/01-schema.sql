-- AND.Furniture schema. Safe to run more than once. Run in Supabase SQL editor (or via the management API).
create extension if not exists pgcrypto;

-- ---------- settings (public readable, owner writable) ----------
create table if not exists public.site_settings (key text primary key, value jsonb not null, updated_at timestamptz default now());

-- ---------- profiles & roles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text, phone text,
  role text not null default 'customer' check (role in ('owner','staff','customer')),
  created_at timestamptz default now()
);

create or replace function public.owner_email() returns text language sql stable security definer set search_path=public as
$$ select lower(coalesce((select value #>> '{}' from site_settings where key='owner_email'),'')) $$;

create or replace function public.my_role() returns text language sql stable security definer set search_path=public as
$$ select coalesce((select role from profiles where id=auth.uid()),'anon') $$;

create or replace function public.is_owner() returns boolean language sql stable security definer set search_path=public as
$$ select exists (select 1 from profiles where id=auth.uid() and role='owner') $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as
$$ select exists (select 1 from profiles where id=auth.uid() and role in ('owner','staff')) $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,full_name,role) values (new.id, lower(new.email), new.raw_user_meta_data->>'full_name',
    case when lower(new.email)=owner_email() then 'owner' else 'customer' end)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "own or staff reads profile" on profiles;
create policy "own or staff reads profile" on profiles for select using (id=auth.uid() or is_staff());
drop policy if exists "own updates name phone" on profiles;
create policy "own updates name phone" on profiles for update using (id=auth.uid()) with check (id=auth.uid() and role=public.my_role());

alter table public.site_settings enable row level security;
drop policy if exists "anyone reads settings" on site_settings;
create policy "anyone reads settings" on site_settings for select using (key <> 'owner_email' or is_owner());
drop policy if exists "owner writes settings" on site_settings;
create policy "owner writes settings" on site_settings for all using (is_owner() and key<>'owner_email') with check (is_owner() and key<>'owner_email');

-- Owner handover: only the current owner can change the owner email.
create or replace function public.transfer_ownership(p_email text, p_demote_me boolean default false) returns void
language plpgsql security definer set search_path=public as $$
declare e text := lower(trim(p_email)); me uuid := auth.uid();
begin
  if e is null or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email'; end if;
  if not is_owner() then raise exception 'owner only'; end if;
  insert into site_settings(key,value) values ('owner_email', to_jsonb(e)) on conflict (key) do update set value=excluded.value, updated_at=now();
  update profiles set role='owner' where lower(email)=e;
  if p_demote_me and me is not null and not exists (select 1 from profiles where id=me and lower(email)=e) then
    update profiles set role='staff' where id=me;
  end if;
end $$;

create or replace function public.set_user_role(p_email text, p_role text) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not is_owner() then raise exception 'owner only'; end if;
  if p_role not in ('staff','customer') then raise exception 'role must be staff or customer'; end if;
  update profiles set role=p_role where lower(email)=lower(trim(p_email)) and role<>'owner';
end $$;


-- ---------- catalog ----------
create table if not exists public.categories (
  id bigint generated always as identity primary key, slug text unique not null,
  name_ar text not null, name_en text not null, sort int default 0, active boolean default true
);
create table if not exists public.products (
  id bigint generated always as identity primary key, slug text unique not null,
  category_id bigint references categories(id) on delete set null,
  name_ar text not null, name_en text not null, desc_ar text default '', desc_en text default '',
  price numeric(12,2) not null check (price>=0), compare_at numeric(12,2),
  stock int not null default 10 check (stock>=0), images text[] not null default '{}',
  is_placeholder boolean not null default true,
  dimensions text default '', material_ar text default '', material_en text default '',
  colors text[] not null default '{}',
  featured boolean default false, active boolean default true, sort int default 0, created_at timestamptz default now()
);
alter table categories enable row level security; alter table products enable row level security;
drop policy if exists "public reads categories" on categories; create policy "public reads categories" on categories for select using (active or is_staff());
drop policy if exists "staff writes categories" on categories; create policy "staff writes categories" on categories for all using (is_staff()) with check (is_staff());
drop policy if exists "public reads products" on products; create policy "public reads products" on products for select using (active or is_staff());
drop policy if exists "staff writes products" on products; create policy "staff writes products" on products for all using (is_staff()) with check (is_staff());

-- ---------- orders ----------
create sequence if not exists public.order_seq start 1001;
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  number text unique not null default ('AND-' || nextval('public.order_seq')),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null, phone text not null, email text, governorate text, address text not null, notes text,
  items jsonb not null, subtotal numeric(12,2) not null, delivery_fee numeric(12,2) not null default 0, total numeric(12,2) not null,
  payment_method text not null default 'cod' check (payment_method in ('cod','instapay','wallet','bank')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  status text not null default 'new' check (status in ('new','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.order_events (
  id bigint generated always as identity primary key, order_id bigint references orders(id) on delete cascade,
  status text, note text, by_user uuid, created_at timestamptz default now()
);
alter table orders enable row level security; alter table order_events enable row level security;
drop policy if exists "staff or own orders" on orders; create policy "staff or own orders" on orders for select using (is_staff() or user_id=auth.uid());
drop policy if exists "staff updates orders" on orders; create policy "staff updates orders" on orders for update using (is_staff()) with check (is_staff());
drop policy if exists "owner deletes orders" on orders; create policy "owner deletes orders" on orders for delete using (is_owner());
drop policy if exists "staff or own events" on order_events; create policy "staff or own events" on order_events for select using (is_staff() or exists (select 1 from orders o where o.id=order_id and o.user_id=auth.uid()));

-- Server-side checkout: prices and stock come from the products table, never from the browser.
create or replace function public.place_order(p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
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
end $$;
grant execute on function public.place_order(jsonb) to anon, authenticated;

create or replace function public.track_order(p_number text, p_phone text) returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders%rowtype;
begin
  select * into o from orders where upper(number)=upper(trim(p_number)) and right(regexp_replace(phone,'\D','','g'),10) = right(regexp_replace(p_phone,'\D','','g'),10) and length(regexp_replace(p_phone,'\D','','g'))>=8;
  if not found then return null; end if;
  return jsonb_build_object('number',o.number,'status',o.status,'payment_status',o.payment_status,'total',o.total,'delivery_fee',o.delivery_fee,'items',o.items,'created_at',o.created_at,
    'events',(select coalesce(jsonb_agg(jsonb_build_object('status',status,'at',created_at) order by created_at),'[]') from order_events where order_id=o.id));
end $$;
grant execute on function public.track_order(text,text) to anon, authenticated;

create or replace function public.set_order_status(p_order bigint, p_status text, p_note text default null) returns void language plpgsql security definer set search_path=public as $$
declare o orders%rowtype;
begin
  if not is_staff() then raise exception 'staff only'; end if;
  if p_status not in ('new','confirmed','preparing','out_for_delivery','delivered','cancelled') then raise exception 'bad status'; end if;
  select * into o from orders where id=p_order for update;
  if not found then raise exception 'no such order'; end if;
  if p_status='cancelled' and o.status<>'cancelled' then
    update products p set stock = p.stock + (l->>'qty')::int from jsonb_array_elements(o.items) l where p.id=(l->>'id')::bigint;
  end if;
  update orders set status=p_status, updated_at=now(),
    payment_status = case when p_status='delivered' and payment_method='cod' then 'paid' else payment_status end where id=p_order;
  insert into order_events(order_id,status,note,by_user) values (p_order,p_status,p_note,auth.uid());
end $$;

create or replace function public.set_payment_status(p_order bigint, p_status text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_staff() then raise exception 'staff only'; end if;
  if p_status not in ('unpaid','paid','refunded') then raise exception 'bad status'; end if;
  update orders set payment_status=p_status, updated_at=now() where id=p_order;
end $$;

-- ---------- accounting: expenses ----------
create table if not exists public.expenses (
  id bigint generated always as identity primary key, spent_on date not null default current_date,
  category text not null default 'other', note text, amount numeric(12,2) not null check (amount>=0), created_at timestamptz default now()
);
alter table expenses enable row level security;
drop policy if exists "owner expenses" on expenses; create policy "owner expenses" on expenses for all using (is_owner()) with check (is_owner());

-- ---------- chat (guests use a random token kept in their browser) ----------
create table if not exists public.chats (
  id bigint generated always as identity primary key, token text not null, visitor_name text, status text not null default 'open' check (status in ('open','closed')),
  assigned_to uuid references auth.users(id) on delete set null, created_at timestamptz default now(), last_at timestamptz default now(), unread_staff int default 0
);
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key, chat_id bigint references chats(id) on delete cascade,
  sender text not null check (sender in ('visitor','staff')), staff_id uuid, body text not null, created_at timestamptz default now()
);
create index if not exists chats_token_idx on chats(token); create index if not exists chat_messages_chat_idx on chat_messages(chat_id, id);
alter table chats enable row level security; alter table chat_messages enable row level security;
drop policy if exists "staff reads chats" on chats; create policy "staff reads chats" on chats for select using (is_staff());
drop policy if exists "staff reads chat messages" on chat_messages; create policy "staff reads chat messages" on chat_messages for select using (is_staff());

create or replace function public.chat_visitor_send(p_token text, p_name text, p_body text) returns bigint language plpgsql security definer set search_path=public as $$
declare c chats%rowtype; b text := left(trim(coalesce(p_body,'')),2000);
begin
  if length(coalesce(p_token,''))<16 or b='' then raise exception 'bad request'; end if;
  select * into c from chats where token=p_token and status='open' order by id desc limit 1;
  if not found then insert into chats(token,visitor_name) values (p_token, left(nullif(trim(coalesce(p_name,'')),''),60)) returning * into c; end if;
  insert into chat_messages(chat_id,sender,body) values (c.id,'visitor',b);
  update chats set last_at=now(), unread_staff=unread_staff+1, visitor_name=coalesce(visitor_name,left(nullif(trim(coalesce(p_name,'')),''),60)) where id=c.id;
  return c.id;
end $$;
create or replace function public.chat_visitor_poll(p_token text, p_after bigint default 0) returns jsonb language plpgsql security definer set search_path=public as $$
declare c chats%rowtype;
begin
  select * into c from chats where token=p_token order by id desc limit 1;
  if not found then return jsonb_build_object('status','none','messages','[]'::jsonb); end if;
  return jsonb_build_object('status',c.status,'messages',
    (select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'sender',m.sender,'body',m.body,'at',m.created_at) order by m.id),'[]') from chat_messages m where m.chat_id=c.id and m.id>p_after));
end $$;
create or replace function public.chat_staff_send(p_chat bigint, p_body text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_staff() then raise exception 'staff only'; end if;
  if length(trim(coalesce(p_body,'')))=0 then raise exception 'empty'; end if;
  insert into chat_messages(chat_id,sender,staff_id,body) values (p_chat,'staff',auth.uid(),left(trim(p_body),2000));
  update chats set last_at=now(), unread_staff=0, assigned_to=coalesce(assigned_to,auth.uid()) where id=p_chat;
end $$;
create or replace function public.chat_staff_set(p_chat bigint, p_status text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_staff() then raise exception 'staff only'; end if;
  update chats set status=p_status, unread_staff=0 where id=p_chat;
end $$;
grant execute on function public.chat_visitor_send(text,text,text), public.chat_visitor_poll(text,bigint) to anon, authenticated;

-- ---------- KPIs for the dashboard (staff only) ----------
create or replace function public.dashboard_kpis(p_days int default 30) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare since timestamptz := now() - make_interval(days => greatest(1,p_days)); r jsonb;
begin
  if not is_staff() then raise exception 'staff only'; end if;
  select jsonb_build_object(
    'orders', count(*) filter (where status<>'cancelled'),
    'new_orders', count(*) filter (where status='new'),
    'revenue', coalesce(sum(total) filter (where status<>'cancelled'),0),
    'collected', coalesce(sum(total) filter (where payment_status='paid'),0),
    'avg_order', coalesce(round(avg(total) filter (where status<>'cancelled'),2),0),
    'cancelled', count(*) filter (where status='cancelled'),
    'delivered', count(*) filter (where status='delivered')) into r from orders where created_at>=since;
  return r || jsonb_build_object('low_stock',(select count(*) from products where active and stock<=3),
     'open_chats',(select count(*) from chats where status='open'),
     'daily',(select coalesce(jsonb_agg(jsonb_build_object('d',d,'orders',n,'revenue',rev) order by d),'[]') from
        (select created_at::date d, count(*) n, sum(total) rev from orders where created_at>=since and status<>'cancelled' group by 1) x));
end $$;

-- ---------- storage for product images ----------
insert into storage.buckets (id,name,public) values ('product-images','product-images',true) on conflict (id) do nothing;
drop policy if exists "public reads product images" on storage.objects; create policy "public reads product images" on storage.objects for select using (bucket_id='product-images');
drop policy if exists "staff uploads product images" on storage.objects; create policy "staff uploads product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.is_staff());
drop policy if exists "staff manages product images" on storage.objects; create policy "staff manages product images" on storage.objects for update to authenticated using (bucket_id='product-images' and public.is_staff());
drop policy if exists "staff deletes product images" on storage.objects; create policy "staff deletes product images" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.is_staff());

-- ---------- default settings ----------
insert into site_settings(key,value) values
 ('owner_email', '"mahmoudyahya66@gmail.com"'),
 ('store', '{"name_ar":"AND.Furniture","name_en":"AND.Furniture","tagline_ar":"حلول متكاملة للأثاث المنزلي لإن راحتك بتبدأ من بيتك","tagline_en":"Furnish your home with style","phone":"+201226071020","whatsapp":"201226071020","email":"","facebook":"https://www.facebook.com/AND.Furniture26","address_ar":"","address_en":"","map_url":""}'),
 ('hours', '{"sat":"","sun":"","mon":"","tue":"","wed":"","thu":"","fri":"","note_ar":"","note_en":""}'),
 ('delivery_fee','150'),('free_delivery_over','25000'),
 ('payment_methods','{"cod":true,"instapay":false,"wallet":false,"bank":false,"instapay_handle":"","wallet_number":"","bank_details":""}')
on conflict (key) do nothing;

-- Catch-up: if the owner already signed up before this script ran, promote them.
update profiles set role='owner' where lower(email)=owner_email();
