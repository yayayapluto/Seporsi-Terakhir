-- Phase 2: enums, tables, auto-profile trigger.
-- Conventions: English identifiers, timestamptz everywhere, integer IDR.

create type user_role as enum ('student', 'tenant', 'admin');
create type order_status as enum ('reserved', 'picked_up', 'cancelled');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade unique,
  name text not null,
  location_note text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  normal_price integer not null check (normal_price > 0),
  avg_weight_grams integer check (avg_weight_grams is null or avg_weight_grams > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table portions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  menu_item_id uuid not null references menu_items (id) on delete restrict,
  quantity_posted integer not null check (quantity_posted > 0),
  quantity_remaining integer not null check (quantity_remaining >= 0),
  cooked_at timestamptz not null,
  sell_window_minutes integer not null default 180
    check (sell_window_minutes between 120 and 240),
  release_at timestamptz not null,
  discount_price integer not null check (discount_price > 0),
  expires_at timestamptz
    generated always as (cooked_at + make_interval(mins => sell_window_minutes)) stored,
  created_at timestamptz not null default now(),
  check (quantity_remaining <= quantity_posted)
);
-- now() is not immutable so it cannot appear in an index predicate;
-- the time filters live in queries/RLS instead.
create index portions_active_idx on portions (release_at, expires_at)
  where quantity_remaining > 0;

create table orders (
  id uuid primary key default gen_random_uuid(),
  portion_id uuid not null references portions (id) on delete restrict,
  student_id uuid not null references profiles (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 2),
  status order_status not null default 'reserved',
  pickup_token uuid not null unique default gen_random_uuid(),
  slot_start timestamptz,
  slot_end timestamptz,
  picked_up_at timestamptz,
  normal_price_snapshot integer not null check (normal_price_snapshot > 0),
  discount_price_snapshot integer not null check (discount_price_snapshot > 0),
  avg_weight_snapshot integer check (avg_weight_snapshot is null or avg_weight_snapshot > 0),
  created_at timestamptz not null default now()
);
create index orders_student_idx on orders (student_id);
create index orders_portion_idx on orders (portion_id);
create index orders_token_idx on orders (pickup_token);

-- updated_at maintenance
create or replace function touch_updated_at() returns trigger
  language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();
create trigger tenants_touch before update on tenants
  for each row execute function touch_updated_at();
create trigger menu_items_touch before update on menu_items
  for each row execute function touch_updated_at();

-- auto-create profile on signup (default role student, never from client input)
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    (new.raw_user_meta_data ->> 'avatar_url'))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- role changes only via approve_tenant RPC (service_role / guarded bypass), never self-serve
create or replace function guard_profile_role() returns trigger
  language plpgsql set search_path = public as $$
declare
  claims_role text := coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '');
begin
  if old.role is distinct from new.role
     and claims_role <> 'service_role'
     -- approve_tenant sets this transaction-local flag before promoting the owner
     and coalesce(current_setting('app.role_guard_bypass', true), '') <> 'on' then
    raise exception 'role changes only via approve_tenant';
  end if;
  return new;
end $$;

create trigger profiles_role_guard before update of role on profiles
  for each row execute function guard_profile_role();
