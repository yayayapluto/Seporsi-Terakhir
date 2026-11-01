-- Tenant order detail + tenant-side cancel (approved brief: /tenant/pesanan/[id]).
--
-- tenant_order_detail: satu baris pesanan milik tenant + nama pemesan + agregat
-- riwayat pemesan (pickup selesai / batal). Guard: order harus lewat portion
-- milik tenant yang dimiliki auth.uid() (atau admin).
create or replace function tenant_order_detail(p_order_id uuid)
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
  buyer_cancelled integer
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
        where h.student_id = o.student_id and h.status = 'cancelled')
    from orders o
      join portions p on p.id = o.portion_id
      left join menu_items mi on mi.id = p.menu_item_id
      left join profiles pr on pr.id = o.student_id
    where o.id = p_order_id;
end $$;

-- Tenant cancels a reservation of their own portion: quota restored.
-- Student cancel_order guards student_id = auth.uid(); tenants need own path.
create or replace function tenant_cancel_order(p_order_id uuid) returns orders
  language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if not exists (
    select 1 from portions p
      join tenants t on t.id = p.tenant_id
    where p.id = v_order.portion_id
      and (t.owner_id = auth.uid()
        or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  ) then raise exception 'forbidden'; end if;
  if v_order.status <> 'reserved' then raise exception 'not_reserved'; end if;

  update orders set status = 'cancelled' where id = p_order_id returning * into v_order;
  update portions set quantity_remaining = quantity_remaining + v_order.quantity
   where id = v_order.portion_id;
  return v_order;
end $$;

grant execute on function tenant_order_detail(uuid) to authenticated;
grant execute on function tenant_cancel_order(uuid) to authenticated;
