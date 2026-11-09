-- AI image: cache hasil generate + quota harian per tenant (3/hari, WIB).
-- Tulis hanya via RPC security definer; baca hanya owner tenant.
create table if not exists ai_image_cache (
  prompt_hash text primary key,
  image_path text not null,
  model text not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_image_quota (
  tenant_id uuid not null references tenants (id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (tenant_id, day)
);

alter table ai_image_cache enable row level security;
alter table ai_image_quota enable row level security;

drop policy if exists ai_image_cache_owner_read on ai_image_cache;
create policy ai_image_cache_owner_read on ai_image_cache
  for select to authenticated using (true);

drop policy if exists ai_image_quota_owner_read on ai_image_quota;
create policy ai_image_quota_owner_read on ai_image_quota
  for select to authenticated
  using (exists (
    select 1 from tenants t
    where t.id = ai_image_quota.tenant_id and t.owner_id = auth.uid()
  ));

-- Cache: hit bila hash sama (prompt + model + size sama persis).
create or replace function get_cached_image(p_hash text)
returns text
  language sql security definer set search_path = public stable as $$
  select image_path from ai_image_cache where prompt_hash = p_hash;
$$;

create or replace function save_cached_image(p_hash text, p_path text, p_model text)
returns void
  language sql security definer set search_path = public as $$
  insert into ai_image_cache (prompt_hash, image_path, model)
  values (p_hash, p_path, p_model)
  on conflict (prompt_hash) do update
    set image_path = excluded.image_path, model = excluded.model, created_at = now();
$$;

-- Quota: 3/hari/tenant, batas hari Asia/Jakarta. Satu upsert atomik yang
-- hanya menaikkan bila count < 3. false = kuota habis (tanpa menambah count).
create or replace function consume_ai_quota()
returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_tid uuid;
  v_day date := (now() at time zone 'Asia/Jakarta')::date;
  v_count integer;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into v_tid from tenants where owner_id = auth.uid();
  if v_tid is null then raise exception 'tenant not found'; end if;

  insert into ai_image_quota (tenant_id, day, count)
  values (v_tid, v_day, 1)
  on conflict (tenant_id, day) do update
    set count = ai_image_quota.count + 1
    where ai_image_quota.count < 3
  returning count into v_count;

  -- Tidak ada baris dikembalikan = hit kondisi count < 3 -> kuota habis.
  return v_count is not null;
end $$;

-- Refund: turunkan count hari ini, tidak pernah di bawah 0.
create or replace function refund_ai_quota()
returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_tid uuid;
  v_day date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into v_tid from tenants where owner_id = auth.uid();
  if v_tid is null then return; end if;
  update ai_image_quota
     set count = greatest(count - 1, 0)
   where tenant_id = v_tid and day = v_day;
end $$;

grant execute on function get_cached_image(text) to authenticated;
grant execute on function save_cached_image(text, text, text) to authenticated;
grant execute on function consume_ai_quota() to authenticated;
grant execute on function refund_ai_quota() to authenticated;
