-- Tenant edit profil gerai sendiri (nama + catatan lokasi). Tanpa syarat approved
-- agar tenant menunggu verifikasi tetap bisa melengkapi data.
create or replace function update_tenant_profile(p_name text, p_location_note text default null)
returns tenants
language plpgsql security definer set search_path = public as $$
declare v_tenant tenants%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_name is null or btrim(p_name) = '' then raise exception 'name required'; end if;
  if char_length(btrim(p_name)) > 80 then raise exception 'name too long'; end if;
  if p_location_note is not null and char_length(btrim(p_location_note)) > 200 then
    raise exception 'location too long';
  end if;
  update tenants
    set name = btrim(p_name),
        location_note = nullif(btrim(coalesce(p_location_note, '')), ''),
        updated_at = now()
    where owner_id = auth.uid()
    returning * into v_tenant;
  if not found then raise exception 'tenant not found'; end if;
  return v_tenant;
end $$;
