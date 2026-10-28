-- my_orders now exposes portions.cooked_at (BR-3: cook time mandatory + visible).
-- Buyers already see cook time on katalog/portion detail; exposing it for own
-- order history is consistent. CREATE OR REPLACE keeps existing grants.
create or replace function my_orders()
returns table (
  order_id uuid, status order_status, quantity integer, created_at timestamptz,
  slot_start timestamptz, slot_end timestamptz, picked_up_at timestamptz,
  cooked_at timestamptz,
  normal_price_snapshot integer, discount_price_snapshot integer,
  avg_weight_snapshot integer, menu_name text, tenant_name text,
  tenant_location text, portion_id uuid, pickup_eligible boolean
)
language sql security definer set search_path = public stable as $$
  select o.id, o.status, o.quantity, o.created_at,
    o.slot_start, o.slot_end, o.picked_up_at,
    p.cooked_at,
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
