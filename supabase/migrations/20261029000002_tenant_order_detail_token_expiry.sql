-- P0 pickup proof + P2 expiry on tenant order detail.
-- Exposes orders.pickup_token (uuid, manual-code fallback) and
-- portions.expires_at (batas ambil) through tenant_order_detail.
-- Guard unchanged: order must belong to auth.uid()'s tenant (or admin).
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
      p.expires_at
    from orders o
      join portions p on p.id = o.portion_id
      left join menu_items mi on mi.id = p.menu_item_id
      left join profiles pr on pr.id = o.student_id
    where o.id = p_order_id;
end $$;

grant execute on function tenant_order_detail(uuid) to authenticated;
