-- Phase 5: impact_summary pake sum(quantity) + guard admin-only (BUG-001, BUG-002).
create or replace function impact_summary(p_from timestamptz default null, p_to timestamptz default null)
  returns table (portions_saved bigint, waste_grams bigint, money_saved bigint, revenue bigint, posted bigint)
  language sql security definer set search_path = public stable as $$
  select
    -- porsi diselamatkan = jumlah item picked_up (bukan jumlah order).
    coalesce(sum(case when o.status = 'picked_up' then o.quantity end), 0),
    coalesce(sum(case when o.status = 'picked_up' then o.quantity * coalesce(o.avg_weight_snapshot, 0) end), 0),
    coalesce(sum(case when o.status = 'picked_up'
      then o.quantity * greatest(o.normal_price_snapshot - o.discount_price_snapshot, 0) end), 0),
    coalesce(sum(case when o.status = 'picked_up' then o.quantity * o.discount_price_snapshot end), 0),
    coalesce((select sum(quantity_posted) from portions p
               where (p_from is null or p.created_at >= p_from)
                 and (p_to is null or p.created_at < p_to)), 0)
  from orders o
  where (p_from is null or o.created_at >= p_from)
    and (p_to is null or o.created_at < p_to)
    -- agregat global: admin only, sama kayak admin_report.
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- BUG-003: update_portion tolak menu nonaktif + release di luar jendela jual.
create or replace function update_portion(
  p_portion_id uuid, p_menu_item_id uuid default null, p_quantity integer default null,
  p_cooked_at timestamptz default null, p_sell_window_minutes integer default null,
  p_release_at timestamptz default null, p_discount_price integer default null
) returns portions
language plpgsql security definer set search_path = public as $$
declare v_tid uuid; v_p portions%rowtype; v_menu menu_items%rowtype;
  v_qty integer; v_cooked timestamptz; v_window integer; v_release timestamptz;
  v_disc integer; v_menu_id uuid;
begin
  v_tid := own_tenant_id();
  select * into v_p from portions where id = p_portion_id for update;
  if not found then raise exception 'portion not found'; end if;
  if v_p.tenant_id <> v_tid then raise exception 'forbidden'; end if;
  v_menu_id := coalesce(p_menu_item_id, v_p.menu_item_id);
  select * into v_menu from menu_items where id = v_menu_id;
  if not found or v_menu.tenant_id <> v_tid then raise exception 'forbidden'; end if;
  v_qty := coalesce(p_quantity, v_p.quantity_posted);
  if v_qty <= 0 then raise exception 'invalid quantity'; end if;
  if v_qty <> v_p.quantity_posted
     and exists (select 1 from orders o where o.portion_id = p_portion_id and o.status = 'reserved') then
    raise exception 'portion has active reservations';
  end if;
  v_cooked := coalesce(p_cooked_at, v_p.cooked_at);
  v_window := coalesce(p_sell_window_minutes, v_p.sell_window_minutes);
  if v_window < 120 or v_window > 240 then raise exception 'invalid sell window'; end if;
  v_release := coalesce(p_release_at, v_p.release_at);
  v_disc := coalesce(p_discount_price, v_p.discount_price);
  if v_disc <= 0 then raise exception 'invalid discount price'; end if;
  if v_disc >= v_menu.normal_price then raise exception 'discount must be below normal'; end if;
  if not v_menu.is_active then raise exception 'menu not active'; end if;
  if v_release > v_cooked + (v_window || ' minutes')::interval then
    raise exception 'release past expiry'; end if;
  update portions set
    menu_item_id = v_menu_id,
    quantity_posted = v_qty,
    quantity_remaining = greatest(v_qty - (v_p.quantity_posted - v_p.quantity_remaining), 0),
    cooked_at = v_cooked, sell_window_minutes = v_window,
    release_at = v_release, discount_price = v_disc
  where id = p_portion_id returning * into v_p;
  return v_p;
end $$;
