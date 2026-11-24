-- AND refund flow (owner only), modeled on TELEGANT. Additive.
alter table public.orders add column if not exists refund_status text, add column if not exists refund_amount numeric, add column if not exists refund_reason text, add column if not exists refunded_at timestamptz, add column if not exists refund_emailed boolean not null default false;
alter table public.order_mail_cfg add column if not exists refund boolean not null default true;
create or replace function public.refund_order(p_order bigint, p_amount numeric, p_reason text) returns void language plpgsql security definer set search_path to 'public' as $f$
declare o orders;
begin
  if not coalesce(is_owner(), false) then raise exception 'Only the owner can refund'; end if;
  select * into o from orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  if o.refund_status = 'refunded' then raise exception 'This order is already refunded'; end if;
  if o.payment_status <> 'paid' then raise exception 'Only a paid order can be refunded'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > o.total then raise exception 'Refund must be between 1 and the order total (% EGP)', o.total; end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Please write a short note for the refund'; end if;
  update orders set refund_status = 'refunded', refund_amount = p_amount, refund_reason = left(trim(p_reason), 500), refunded_at = now(), payment_status = 'refunded', updated_at = now() where id = p_order;
  insert into order_events(order_id, status, note, by_user) values (p_order, 'refunded', left(trim(p_reason), 500), auth.uid());
end $f$;
revoke all on function public.refund_order(bigint, numeric, text) from public, anon; grant execute on function public.refund_order(bigint, numeric, text) to authenticated;
