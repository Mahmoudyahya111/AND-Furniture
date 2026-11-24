-- AND accounting parity: the existing expenses table becomes the ledger (additive). Old rows stay expenses.
alter table public.expenses add column if not exists kind text not null default 'expense';
alter table public.expenses add column if not exists supplier text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='expenses_kind_check') then
    alter table public.expenses add constraint expenses_kind_check check (kind in ('purchase','expense','other_income'));
  end if;
end $$;
