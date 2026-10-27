-- Portion details (ingredients/allergens), tenant write RPCs, history + admin report.
-- RLS has ONLY select policies, so every write goes through security-definer RPCs.

alter table menu_items
  add column if not exists ingredients text,
  add column if not exists allergen_note text;

-- admin needs to list pending applications (tenants_read hides them)
drop policy if exists tenants_admin_read on tenants;
create policy tenants_admin_read on tenants for select to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- student order history with menu/tenant names.
-- Direct join fails because portions_read hides expired/sold-out rows from buyers.
create or replace function my_orders()
returns table (
  order_id uuid, status order_status, quantity integer, created_at timestamptz,
  slot_start timestamptz, slot_end timestamptz, picked_up_at timestamptz,
  normal_price_snapshot integer, discount_price_snapshot integer,
  avg_weight_snapshot integer, menu_name text, tenant_name text,
  tenant_location text, portion_id uuid, pickup_eligible boolean
)
language sql security definer set search_path = public stable as $$
  select o.id, o.status, o.quantity, o.created_at,
    o.slot_start, o.slot_end, o.picked_up_at,
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

-- helper: own approved tenant or raise
create or replace function own_tenant_id() returns uuid
language plpgsql security definer set search_path = public stable as $$
declare v_tenant tenants%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_tenant from tenants where owner_id = auth.uid();
  if not found then raise exception 'tenant not found'; end if;
  if not v_tenant.is_approved then raise exception 'tenant not approved'; end if;
  return v_tenant.id;
end $$;

-- tenant create/update own menu item. Unique (tenant_id,name) -> friendly error.
create or replace function upsert_menu_item(
  p_name text, p_normal_price integer,
  p_id uuid default null, p_avg_weight_grams integer default null,
  p_is_active boolean default true,
  p_ingredients text default null, p_allergen_note text default null
) returns menu_items
language plpgsql security definer set search_path = public as $$
declare v_tid uuid; v_menu menu_items%rowtype;
begin
  v_tid := own_tenant_id();
  if p_name is null or btrim(p_name) = '' then raise exception 'name required'; end if;
  if p_normal_price is null or p_normal_price <= 0 then raise exception 'invalid normal price'; end if;
  if p_avg_weight_grams is not null and p_avg_weight_grams <= 0 then raise exception 'invalid weight'; end if;
  if p_id is null then
    begin
      insert into menu_items (tenant_id, name, normal_price, avg_weight_grams, is_active, ingredients, allergen_note)
      values (v_tid, btrim(p_name), p_normal_price, p_avg_weight_grams,
        coalesce(p_is_active, true),
        nullif(btrim(coalesce(p_ingredients, '')), ''), nullif(btrim(coalesce(p_allergen_note, '')), ''))
      returning * into v_menu;
    exception when unique_violation then
      raise exception 'menu name already used';
    end;
  else
    select * into v_menu from menu_items where id = p_id;
    if not found then raise exception 'menu not found'; end if;
    if v_menu.tenant_id <> v_tid then raise exception 'forbidden'; end if;
    begin
      update menu_items set
        name = btrim(p_name), normal_price = p_normal_price,
        avg_weight_grams = p_avg_weight_grams,
        is_active = coalesce(p_is_active, v_menu.is_active),
        ingredients = nullif(btrim(coalesce(p_ingredients, '')), ''),
        allergen_note = nullif(btrim(coalesce(p_allergen_note, '')), '')
      where id = p_id returning * into v_menu;
    exception when unique_violation then
      raise exception 'menu name already used';
    end;
  end if;
  return v_menu;
end $$;

-- tenant posts a portion. expires_at filled by trigger from cooked_at + window.
create or replace function post_portion(
  p_menu_item_id uuid, p_quantity integer, p_cooked_at timestamptz,
  p_discount_price integer, p_sell_window_minutes integer default 180,
  p_release_at timestamptz default null
) returns portions
language plpgsql security definer set search_path = public as $$
declare v_tid uuid; v_menu menu_items%rowtype; v_p portions%rowtype; v_release timestamptz;
begin
  v_tid := own_tenant_id();
  select * into v_menu from menu_items where id = p_menu_item_id;
  if not found then raise exception 'menu not found'; end if;
  if v_menu.tenant_id <> v_tid then raise exception 'forbidden'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'invalid quantity'; end if;
  if p_cooked_at is null then raise exception 'cook time required'; end if;
  if p_sell_window_minutes is null or p_sell_window_minutes < 120 or p_sell_window_minutes > 240 then
    raise exception 'invalid sell window';
  end if;
  if p_discount_price is null or p_discount_price <= 0 then raise exception 'invalid discount price'; end if;
  if p_discount_price >= v_menu.normal_price then raise exception 'discount must be below normal'; end if;
  v_release := coalesce(p_release_at, p_cooked_at);
  insert into portions (tenant_id, menu_item_id, quantity_posted, quantity_remaining,
      cooked_at, sell_window_minutes, release_at, discount_price)
  values (v_tid, p_menu_item_id, p_quantity, p_quantity,
      p_cooked_at, p_sell_window_minutes, v_release, p_discount_price)
  returning * into v_p;
  return v_p;
end $$;

-- tenant edits own portion. Quantity change blocked while reservations are active.
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
  update portions set
    menu_item_id = v_menu_id,
    quantity_posted = v_qty,
    quantity_remaining = greatest(v_qty - (v_p.quantity_posted - v_p.quantity_remaining), 0),
    cooked_at = v_cooked, sell_window_minutes = v_window,
    release_at = v_release, discount_price = v_disc
  where id = p_portion_id returning * into v_p;
  return v_p;
end $$;

-- admin per-tenant breakdown for dashboard + CSV.
-- portions_read/menu_items_read grant admin no extra rows, so aggregate here.
create or replace function admin_report(p_from timestamptz default null, p_to timestamptz default null)
returns table (
  tenant_name text, portions_posted bigint, portions_picked_up bigint,
  revenue bigint, money_saved bigint, waste_grams bigint
)
language sql security definer set search_path = public stable as $$
  select t.name,
    coalesce((select sum(p.quantity_posted) from portions p
      where p.tenant_id = t.id
        and (p_from is null or p.created_at >= p_from)
        and (p_to is null or p.created_at < p_to)), 0),
    coalesce((select sum(o.quantity) from orders o join portions p on p.id = o.portion_id
      where p.tenant_id = t.id and o.status = 'picked_up'
        and (p_from is null or o.created_at >= p_from)
        and (p_to is null or o.created_at < p_to)), 0),
    coalesce((select sum(o.quantity * o.discount_price_snapshot) from orders o join portions p on p.id = o.portion_id
      where p.tenant_id = t.id and o.status = 'picked_up'
        and (p_from is null or o.created_at >= p_from)
        and (p_to is null or o.created_at < p_to)), 0),
    coalesce((select sum(o.quantity * greatest(o.normal_price_snapshot - o.discount_price_snapshot, 0))
      from orders o join portions p on p.id = o.portion_id
      where p.tenant_id = t.id and o.status = 'picked_up'
        and (p_from is null or o.created_at >= p_from)
        and (p_to is null or o.created_at < p_to)), 0),
    coalesce((select sum(o.quantity * coalesce(o.avg_weight_snapshot, 0)) from orders o join portions p on p.id = o.portion_id
      where p.tenant_id = t.id and o.status = 'picked_up'
        and (p_from is null or o.created_at >= p_from)
        and (p_to is null or o.created_at < p_to)), 0)
  from tenants t
  where exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  order by t.name;
$$;

grant execute on function my_orders() to authenticated;
grant execute on function own_tenant_id() to authenticated;
grant execute on function upsert_menu_item(text, integer, uuid, integer, boolean, text, text) to authenticated;
grant execute on function post_portion(uuid, integer, timestamptz, integer, integer, timestamptz) to authenticated;
grant execute on function update_portion(uuid, uuid, integer, timestamptz, integer, timestamptz, integer) to authenticated;
grant execute on function admin_report(timestamptz, timestamptz) to authenticated;
