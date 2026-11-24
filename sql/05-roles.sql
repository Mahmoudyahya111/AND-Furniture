-- Roles: owner (everything), admin (operations + accounting), staff (operations). Multiple owners allowed.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner','admin','staff','customer'));
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as
$$ select exists (select 1 from profiles where id=auth.uid() and role in ('owner','admin','staff')) $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists (select 1 from profiles where id=auth.uid() and role in ('owner','admin')) $$;
drop policy if exists "owner expenses" on expenses;
create policy "owner expenses" on expenses for all using (is_admin()) with check (is_admin());
create or replace function public.set_user_role(p_email text, p_role text) returns void
language plpgsql security definer set search_path=public as $$
declare e text := lower(trim(p_email));
begin
  if not is_owner() then raise exception 'owner only'; end if;
  if p_role not in ('owner','admin','staff','customer') then raise exception 'invalid role'; end if;
  if e = owner_email() and p_role <> 'owner' then raise exception 'the primary owner cannot be demoted; use ownership transfer'; end if;
  if exists (select 1 from profiles where id=auth.uid() and lower(email)=e) and p_role <> 'owner' then raise exception 'you cannot change your own role'; end if;
  update profiles set role=p_role where lower(email)=e;
  if not found then raise exception 'no account with this email'; end if;
end $$;
