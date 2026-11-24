-- Additive migration: furniture-specific product fields. Safe to run more than once. Nothing is dropped or renamed.
alter table public.products
  add column if not exists sku text,
  add column if not exists width_cm numeric(7,1),
  add column if not exists depth_cm numeric(7,1),
  add column if not exists height_cm numeric(7,1),
  add column if not exists weight_kg numeric(7,1),
  add column if not exists assembly_ar text default '',
  add column if not exists assembly_en text default '',
  add column if not exists warranty_months int,
  add column if not exists origin_ar text default '',
  add column if not exists origin_en text default '',
  add column if not exists care_ar text default '',
  add column if not exists care_en text default '',
  add column if not exists lead_time_days int,
  add column if not exists low_stock_threshold int not null default 3 check (low_stock_threshold >= 0);
