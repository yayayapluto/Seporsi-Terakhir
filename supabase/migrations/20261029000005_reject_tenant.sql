-- Admin rejects a tenant application: deletes the row so the applicant
-- (still role student) can re-apply. Guard mirrors approve_tenant.
create or replace function reject_tenant(p_tenant_id uuid) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admin only';
  end if;
  delete from tenants where id = p_tenant_id;
  if not found then raise exception 'tenant not found'; end if;
end $$;
