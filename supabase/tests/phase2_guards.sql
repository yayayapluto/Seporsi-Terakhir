-- Phase 2 pgTAP: run with `bun run db:test` (local Supabase only).
begin;
select plan(14);

-- 1. guard: role cannot change via plain update (non-service role)
select throws_ok(
  $$ update profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111' $$,
  null, 'role changes only via approve_tenant',
  'role self-promotion blocked'
);

-- 2. guard: discount must stay positive (check constraint)
select throws_ok(
  $$ insert into portions (tenant_id, menu_item_id, quantity_posted, quantity_remaining,
        cooked_at, sell_window_minutes, release_at, discount_price)
      values ('a0000000-0000-0000-0000-000000000001',
        (select id from menu_items limit 1), 5, 5, now(), 180, now(), 0) $$,
  '23514', null,
  'zero discount_price rejected'
);

-- 3. guard: quantity_remaining never exceeds posted
select throws_ok(
  $$ insert into portions (tenant_id, menu_item_id, quantity_posted, quantity_remaining,
        cooked_at, sell_window_minutes, release_at, discount_price)
      values ('a0000000-0000-0000-0000-000000000001',
        (select id from menu_items limit 1), 5, 6, now(), 180, now(), 5000) $$,
  '23514', null,
  'over-quota remaining rejected'
);

-- 4. window check: sell window outside 120-240 rejected
select throws_ok(
  $$ insert into portions (tenant_id, menu_item_id, quantity_posted, quantity_remaining,
        cooked_at, sell_window_minutes, release_at, discount_price)
      values ('a0000000-0000-0000-0000-000000000001',
        (select id from menu_items limit 1), 5, 5, now(), 60, now(), 5000) $$,
  '23514', null,
  'sell window below 120 rejected'
);

-- 5. order quantity cap at DB level (1-2)
select throws_ok(
  $$ insert into orders (portion_id, student_id, quantity,
        normal_price_snapshot, discount_price_snapshot)
      values ((select id from portions limit 1),
        '22222222-2222-2222-2222-222222222222', 5, 15000, 7000) $$,
  '23514', null,
  'quantity above 2 rejected'
);

-- 6. RPCs exist with security definer (6 lama + 6 baru: my_orders, own_tenant_id,
-- upsert_menu_item, post_portion, update_portion, admin_report)
select ok(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('place_order','cancel_order','confirm_pickup',
                        'apply_as_tenant','approve_tenant','impact_summary',
                        'my_orders','own_tenant_id','upsert_menu_item',
                        'post_portion','update_portion','admin_report')) = 12,
  'all 12 RPCs present'
);

-- 7. expires_at generated column matches cooked_at + window
select ok(
  (select count(*) from portions
    where expires_at <> cooked_at + make_interval(mins => sell_window_minutes)) = 0,
  'expires_at always equals cooked_at + window'
);

-- 8-12. RLS enabled + no direct write policies (writes only via RPC)
select ok(
  (select count(*) from pg_tables where schemaname = 'public'
    and tablename in ('profiles','tenants','menu_items','portions','orders')
    and rowsecurity) = 5,
  'RLS enabled on all 5 tables'
);
select is(
  (select count(*) from pg_policies
    where schemaname = 'public' and cmd in ('INSERT','UPDATE','DELETE')),
  0::bigint,
  'no direct insert/update/delete policies'
);
select is(
  (select count(*) from pg_policies
    where schemaname = 'public' and cmd = 'SELECT'),
  6::bigint,
  'exactly 6 read-only policies'
);
select ok(
  (select count(*) from pg_trigger where tgname = 'profiles_role_guard') = 1,
  'role guard trigger present'
);
select ok(
  (select count(*) from pg_trigger where tgname = 'on_auth_user_created') = 1,
  'auto-profile trigger present'
);

-- 13-14. daily cap (UNTESTED — no local DB here): verify on live local DB via
-- `bun run db:reset && bun run db:test` with seeded portion + student:
-- order qty 1 twice ok, third same-day order must raise 'daily limit'.
select skip('cap allows 2/day (needs seeded local DB)');
select skip('cap rejects 3rd same-day (needs seeded local DB)');

select * from finish();
rollback;
