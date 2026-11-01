-- Kode pickup 4 digit untuk ketik manual (fallback kamera rusak).
-- pickup_token uuid tetap untuk QR; pickup_code char(4) unik untuk input OTP.
alter table orders add column pickup_code char(4);

-- Backfill: 4 digit acak unik untuk order existing.
do $$
declare
  r record;
  v_code char(4);
begin
  for r in select id from orders where pickup_code is null loop
    loop
      v_code := lpad((floor(random() * 10000))::integer::text, 4, '0');
      begin
        update orders set pickup_code = v_code where id = r.id;
        exit;
      exception when unique_violation then
        -- tabrakan: coba lagi
      end;
    end loop;
  end loop;
end $$;

alter table orders alter column pickup_code set not null;
create unique index orders_pickup_code_idx on orders (pickup_code);

-- Default untuk order baru: 4 digit acak; unique_violation di-retry oleh place_order.
create or replace function generate_pickup_code() returns char(4)
  language plpgsql as $$
declare
  v_code char(4);
begin
  loop
    v_code := lpad((floor(random() * 10000))::integer::text, 4, '0');
    exit when not exists (select 1 from orders where pickup_code = v_code);
  end loop;
  return v_code;
end $$;

-- Isi otomatis saat insert bila tidak diisi eksplisit.
create or replace function fill_pickup_code() returns trigger
  language plpgsql as $$
begin
  if new.pickup_code is null then
    new.pickup_code := generate_pickup_code();
  end if;
  return new;
end $$;

drop trigger if exists orders_fill_pickup_code on orders;
create trigger orders_fill_pickup_code
  before insert on orders
  for each row execute function fill_pickup_code();

-- Lookup order by kode 4 digit (tenant pemilik saja) — dipakai form manual scan.
create or replace function lookup_order_by_code(p_code char(4))
returns table (
  menu_name text,
  quantity integer,
  status order_status,
  discount_price_snapshot integer,
  tenant_id uuid
)
  language plpgsql security definer set search_path = public as $$
declare
  v_tenant_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select t.id into v_tenant_id from tenants t where t.owner_id = auth.uid();
  if v_tenant_id is null then raise exception 'tenant profile not found'; end if;

  return query
    select
      coalesce(mi.name, 'Menu'),
      o.quantity,
      o.status,
      o.discount_price_snapshot,
      p.tenant_id
    from orders o
      join portions p on p.id = o.portion_id
      left join menu_items mi on mi.id = p.menu_item_id
    where o.pickup_code = p_code
      and p.tenant_id = v_tenant_id;
end $$;

-- Konfirmasi pickup by kode 4 digit — guard sama dengan confirm_pickup.
create or replace function confirm_pickup_by_code(p_code char(4)) returns orders
  language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_portion portions%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_order from orders where pickup_code = p_code for update;
  if not found then raise exception 'order not found'; end if;
  select * into v_portion from portions where id = v_order.portion_id;

  if not exists (select 1 from tenants t
                  where t.id = v_portion.tenant_id and t.owner_id = auth.uid()) then
    raise exception 'only the owning tenant can confirm pickup';
  end if;
  if v_order.status <> 'reserved' then raise exception 'not_reserved'; end if;
  -- no pickup after expiry (food safety, BR-2)
  if now() >= v_portion.expires_at then raise exception 'expired'; end if;

  update orders set status = 'picked_up', picked_up_at = now()
   where id = v_order.id returning * into v_order;
  return v_order;
end $$;

grant execute on function lookup_order_by_code(char(4)) to authenticated;
grant execute on function confirm_pickup_by_code(char(4)) to authenticated;

-- Sertakan pickup_code di detail order tenant.
drop function if exists tenant_order_detail(uuid);
create function tenant_order_detail(p_order_id uuid)
returns table (
  order_id uuid,
  status order_status,
  quantity integer,
  created_at timestamptz,
  picked_up_at timestamptz,
  slot_start timestamptz,
  slot_end timestamptz,
  cooked_at timestamptz,
  normal_price_snapshot integer,
  discount_price_snapshot integer,
  menu_name text,
  buyer_name text,
  buyer_pickups integer,
  buyer_cancelled integer,
  pickup_token uuid,
  pickup_code char(4),
  expires_at timestamptz
)
  language plpgsql security definer set search_path = public as $$
declare
  v_is_admin boolean := false;
  v_allowed boolean := false;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    into v_is_admin;
  select exists (
    select 1 from orders o
      join portions p on p.id = o.portion_id
      join tenants t on t.id = p.tenant_id
    where o.id = p_order_id
      and (v_is_admin or t.owner_id = auth.uid())
  ) into v_allowed;
  if not v_allowed then raise exception 'forbidden'; end if;

  return query
    select
      o.id, o.status, o.quantity, o.created_at, o.picked_up_at,
      o.slot_start, o.slot_end, p.cooked_at,
      o.normal_price_snapshot, o.discount_price_snapshot,
      coalesce(mi.name, 'Menu'),
      coalesce(nullif(btrim(pr.full_name), ''), pr.email, 'Mahasiswa'),
      (select count(*)::integer from orders h
        where h.student_id = o.student_id and h.status = 'picked_up'),
      (select count(*)::integer from orders h
        where h.student_id = o.student_id and h.status = 'cancelled'),
      o.pickup_token,
      o.pickup_code,
      p.expires_at
    from orders o
      join portions p on p.id = o.portion_id
      left join menu_items mi on mi.id = p.menu_item_id
      left join profiles pr on pr.id = o.student_id
    where o.id = p_order_id;
end $$;

grant execute on function tenant_order_detail(uuid) to authenticated;
