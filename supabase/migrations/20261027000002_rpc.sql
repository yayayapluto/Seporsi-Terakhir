-- Phase 2: RPCs (security definer, role + auth checks inside).
-- All mutations go through these; no direct insert/update policies.

-- student reserves a portion: atomic decrement, expiry/release/role enforced
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
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > v_max_qty then
    raise exception 'quantity must be between 1 and %', v_max_qty;
  end if;

  select * into v_portion from portions where id = p_portion_id for update;
  if not found then raise exception 'portion not found'; end if;
  select * into v_menu from menu_items where id = v_portion.menu_item_id;
  select * into v_tenant from tenants where id = v_portion.tenant_id;

  -- tenant must be approved and tenant-owned menu data must be active
  if not v_tenant.is_approved then raise exception 'tenant not approved'; end if;
  if not v_menu.is_active then raise exception 'menu not active'; end if;

  -- role: students and admins may order, owning tenant may not self-order
  if exists (select 1 from profiles p
             where p.id = auth.uid() and p.role = 'tenant'
               and exists (select 1 from tenants t
                           where t.owner_id = auth.uid() and t.id = v_portion.tenant_id)) then
    raise exception 'tenant cannot order own portion';
  end if;

  -- window enforcement (BR-2): released and not expired
  if now() < v_portion.release_at then raise exception 'not_released'; end if;
  if now() >= v_portion.expires_at then raise exception 'expired'; end if;

  -- slot sanity: end after start, pickup must fit inside sell window
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
      normal_price_snapshot, discount_price_snapshot, avg_weight_snapshot)
  values (p_portion_id, auth.uid(), p_quantity,
      p_slot_start, p_slot_end,
      v_menu.normal_price, v_portion.discount_price, v_menu.avg_weight_grams)
  returning * into v_order;
  return v_order;
end $$;

-- student cancels own reservation, quota restored
create or replace function cancel_order(p_order_id uuid) returns orders
  language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.student_id <> auth.uid()
     and not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'forbidden';
  end if;
  if v_order.status <> 'reserved' then raise exception 'not_reserved'; end if;

  update orders set status = 'cancelled' where id = p_order_id returning * into v_order;
  update portions set quantity_remaining = quantity_remaining + v_order.quantity
   where id = v_order.portion_id;
  return v_order;
end $$;

-- owning tenant scans buyer QR: confirm pickup, food-safety expiry guard
create or replace function confirm_pickup(p_pickup_token uuid) returns orders
  language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_portion portions%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_order from orders where pickup_token = p_pickup_token for update;
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

-- student applies to become a tenant (open to all authenticated users)
create or replace function apply_as_tenant(p_name text, p_location_note text default null)
  returns tenants
  language plpgsql security definer set search_path = public as $$
declare
  v_tenant tenants%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_name is null or btrim(p_name) = '' then raise exception 'name required'; end if;
  if exists (select 1 from tenants where owner_id = auth.uid()) then
    raise exception 'already applied';
  end if;
  insert into tenants (owner_id, name, location_note)
  values (auth.uid(), btrim(p_name), nullif(btrim(coalesce(p_location_note, '')), ''))
  returning * into v_tenant;
  return v_tenant;
end $$;

-- admin approves a tenant: flips is_approved and promotes owner role
create or replace function approve_tenant(p_tenant_id uuid) returns tenants
  language plpgsql security definer set search_path = public as $$
declare
  v_tenant tenants%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admin only';
  end if;
  update tenants set is_approved = true where id = p_tenant_id returning * into v_tenant;
  if not found then raise exception 'tenant not found'; end if;
  -- guard_profile_role blocks plain role updates; transaction-local flag (leak-proof).
  perform set_config('app.role_guard_bypass', 'on', true);
  update profiles set role = 'tenant' where id = v_tenant.owner_id;
  return v_tenant;
end $$;

-- impact dashboard aggregate (reads picked_up snapshots)
create or replace function impact_summary(p_from timestamptz default null, p_to timestamptz default null)
  returns table (portions_saved bigint, waste_grams bigint, money_saved bigint, revenue bigint, posted bigint)
  language sql security definer set search_path = public stable as $$
  select
    count(*) filter (where o.status = 'picked_up'),
    coalesce(sum(case when o.status = 'picked_up' then o.quantity * coalesce(o.avg_weight_snapshot, 0) end), 0),
    coalesce(sum(case when o.status = 'picked_up'
      then o.quantity * greatest(o.normal_price_snapshot - o.discount_price_snapshot, 0) end), 0),
    coalesce(sum(case when o.status = 'picked_up' then o.quantity * o.discount_price_snapshot end), 0),
    coalesce((select sum(quantity_posted) from portions p
               where (p_from is null or p.created_at >= p_from)
                 and (p_to is null or p.created_at < p_to)), 0)
  from orders o
  where (p_from is null or o.created_at >= p_from)
    and (p_to is null or o.created_at < p_to);
$$;
