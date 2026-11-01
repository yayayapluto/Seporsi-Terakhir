-- Visibilitas gerai di katalog: admin bisa sembunyikan/tampilkan tanpa menghapus.
alter table tenants add column if not exists is_listed boolean not null default true;

create or replace function set_tenant_listed(p_tenant_id uuid, p_listed boolean)
returns tenants
language plpgsql security definer set search_path = public as $$
declare v_tenant tenants%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admin only';
  end if;
  update tenants set is_listed = p_listed, updated_at = now()
   where id = p_tenant_id returning * into v_tenant;
  if not found then raise exception 'tenant not found'; end if;
  return v_tenant;
end $$;

grant execute on function set_tenant_listed(uuid, boolean) to authenticated;
