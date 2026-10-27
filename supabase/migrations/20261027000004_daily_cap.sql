-- Phase 3: daily per-student order cap (matches katalog + FAQ copy:
-- max 2 portions per student per day). Cancelled orders don't count;
-- tenant/admin-placed orders are exempt by role check below.
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

  -- daily cap (BR pilot rule): students max 2 portions/day across orders.
  -- cancelled orders refund quota, so they don't count.
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    select coalesce(sum(quantity), 0) into v_day_total
      from orders
     where student_id = auth.uid()
       and status <> 'cancelled'
       and created_at >= date_trunc('day', now());
    if v_day_total + p_quantity > v_max_qty then
      raise exception 'daily limit: max % portions per day', v_max_qty;
    end if;
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
