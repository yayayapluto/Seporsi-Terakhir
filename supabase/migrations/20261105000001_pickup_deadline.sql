-- Batas ambil 15 menit terpisah dari expiry porsi (BR-2).
-- expiry porsi = jendela jual dari cooked_at (makanan mati, stok tidak kembali).
-- pickup_deadline_at = now() saat pesan + 15 menit (porsi hidup; lewat batas,
-- porsi di-flag 'unpicked' DAN stoknya dikembalikan ke katalog).

alter table orders add column pickup_deadline_at timestamptz;

-- Backfill order lama: pakai created_at + 15 menit (best effort, historis).
update orders set pickup_deadline_at = created_at + interval '15 minutes'
 where pickup_deadline_at is null;

alter table orders alter column pickup_deadline_at set not null;

create index orders_pickup_deadline_idx on orders (pickup_deadline_at)
  where status = 'reserved';

-- place_order: isi batas ambil 15 menit saat reservasi dibuat.
create or replace function place_order(
  p_portion_id uuid, p_quantity integer,
  p_slot_start timestamptz default null, p_slot_end timestamptz default null
) returns orders
  language plpgsql security definer set search_path = public as $$
declare
  v_portion portions%rowtype;
  v_menu menu_items%rowtype;
  v_tenant tenants%rowtype;
  v_order orders%rowtype;
  v_max_qty constant integer := 2;
  v_day_total integer;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > v_max_qty then
    raise exception 'quantity must be between 1 and %', v_max_qty;
  end if;

  select * into v_portion from portions where id = p_portion_id for update;
  if not found then raise exception 'portion not found'; end if;
  select * into v_menu from menu_items where id = v_portion.menu_item_id;
  select * into v_tenant from tenants where id = v_portion.tenant_id;

  if not v_tenant.is_approved then raise exception 'tenant not approved'; end if;
  if not v_menu.is_active then raise exception 'menu not active'; end if;

  if exists (select 1 from profiles p
             where p.id = auth.uid() and p.role = 'tenant'
               and exists (select 1 from tenants t
                           where t.owner_id = auth.uid() and t.id = v_portion.tenant_id)) then
    raise exception 'tenant cannot order own portion';
  end if;

  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    select coalesce(sum(quantity), 0) into v_day_total
      from orders
     where student_id = auth.uid()
       and status <> 'cancelled'
       and date_trunc('day', created_at at time zone 'Asia/Jakarta')
         = date_trunc('day', now() at time zone 'Asia/Jakarta');
    if v_day_total + p_quantity > v_max_qty then
      raise exception 'daily limit: max % portions per day', v_max_qty;
    end if;
  end if;

  if now() < v_portion.release_at then raise exception 'not_released'; end if;
  if now() >= v_portion.expires_at then raise exception 'expired'; end if;

  if p_slot_start is not null and p_slot_end is not null then
    if p_slot_end <= p_slot_start then raise exception 'invalid slot'; end if;
    if p_slot_end > v_portion.expires_at then raise exception 'slot past expiry'; end if;
    if p_slot_start < v_portion.release_at then raise exception 'slot before release'; end if;
  elsif (p_slot_start is null) <> (p_slot_end is null) then
    raise exception 'slot must have both start and end';
  end if;

  update portions
     set quantity_remaining = quantity_remaining - p_quantity
   where id = p_portion_id and quantity_remaining >= p_quantity;
  if not found then raise exception 'sold_out'; end if;

  insert into orders (portion_id, student_id, quantity,
      slot_start, slot_end,
      normal_price_snapshot, discount_price_snapshot, avg_weight_snapshot,
      pickup_deadline_at)
  values (p_portion_id, auth.uid(), p_quantity,
      p_slot_start, p_slot_end,
      v_menu.normal_price, v_portion.discount_price, v_menu.avg_weight_grams,
      now() + interval '15 minutes')
  returning * into v_order;
  return v_order;
end $$;

-- Lewat batas ambil 15 menit: flag 'unpicked' + kembalikan stok ke katalog.
-- Berbeda dari sweep_expired_orders (porsi mati, stok tidak kembali).
-- Idempoten: hanya reserved + porsi masih hidup (belum expiry) yang dipindah;
-- porsi yang sudah expiry ditangani sweep_expired_orders (tanpa restock).
create or replace function sweep_late_pickups()
returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  with late as (
    update orders o set status = 'unpicked'
    from portions p
    where o.portion_id = p.id
      and o.status = 'reserved'
      and o.pickup_deadline_at <= now()
      and p.expires_at > now()
    returning o.id, o.portion_id, o.quantity
  ),
  restocked as (
    select portion_id, sum(quantity)::integer as qty from late group by portion_id
  )
  update portions p
     set quantity_remaining = least(p.quantity_posted, p.quantity_remaining + r.qty)
    from restocked r
   where p.id = r.portion_id;

  select count(*) into v_count
    from orders
   where status = 'unpicked'
     and pickup_deadline_at <= now();
  return v_count;
end $$;

grant execute on function sweep_late_pickups() to authenticated;

-- my_orders: sertakan batas ambil untuk countdown pembeli.
drop function if exists my_orders();
create or replace function my_orders()
returns table (
  order_id uuid, status order_status, quantity integer, created_at timestamptz,
  slot_start timestamptz, slot_end timestamptz, picked_up_at timestamptz,
  cooked_at timestamptz, pickup_deadline_at timestamptz,
  normal_price_snapshot integer, discount_price_snapshot integer,
  avg_weight_snapshot integer, menu_name text, tenant_name text,
  tenant_location text, portion_id uuid, pickup_eligible boolean
)
language sql security definer set search_path = public stable as $$
  select o.id, o.status, o.quantity, o.created_at,
    o.slot_start, o.slot_end, o.picked_up_at,
    p.cooked_at,
    o.pickup_deadline_at,
    o.normal_price_snapshot, o.discount_price_snapshot,
    o.avg_weight_snapshot, m.name, t.name, t.location_note, o.portion_id,
    (o.status = 'reserved')
  from orders o
  join portions p on p.id = o.portion_id
  join menu_items m on m.id = p.menu_item_id
  join tenants t on t.id = p.tenant_id
  where o.student_id = auth.uid()
  order by o.created_at desc;
$$;

grant execute on function my_orders() to authenticated;

-- tenant_order_detail: sertakan batas ambil untuk countdown penjual.
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
  pickup_deadline_at timestamptz,
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
      o.pickup_deadline_at,
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
