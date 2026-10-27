-- Phase 2: RLS. Reads open per role; writes ONLY via RPC (no direct insert/update).

alter table profiles enable row level security;
alter table tenants enable row level security;
alter table menu_items enable row level security;
alter table portions enable row level security;
alter table orders enable row level security;

-- profiles: readable by authenticated, no direct writes at all
create policy profiles_read on profiles for select to authenticated using (true);

-- tenants: approved visible to all; owners see own row even when pending
create policy tenants_read on tenants for select to authenticated
  using (is_approved or owner_id = auth.uid());

-- menu items: active items of approved tenants visible to all authenticated;
-- inactive/pending visible to the owning tenant
create policy menu_items_read on menu_items for select to authenticated
  using (
    (is_active and exists (
      select 1 from tenants t where t.id = menu_items.tenant_id and t.is_approved))
    or exists (
      select 1 from tenants t
      where t.id = menu_items.tenant_id and t.owner_id = auth.uid())
  );

-- portions: only data of approved tenants; buyers see active window rows,
-- owners see all their rows
create policy portions_read on portions for select to authenticated
  using (
    exists (select 1 from tenants t
            where t.id = portions.tenant_id and t.is_approved)
    and (
      (quantity_remaining > 0 and release_at <= now() and expires_at > now())
      or exists (select 1 from tenants t
                 where t.id = portions.tenant_id and t.owner_id = auth.uid())
    )
  );

-- orders: students see own, tenants see orders for their portions, admin sees all
create policy orders_read on orders for select to authenticated
  using (
    student_id = auth.uid()
    or exists (select 1 from portions p join tenants t on t.id = p.tenant_id
               where p.id = orders.portion_id and t.owner_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
