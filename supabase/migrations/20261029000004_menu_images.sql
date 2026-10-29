-- Menu photo: 1 foto per menu (bukan per porsi — posting tetap 3 ketuk, BR-8).
-- Public read (katalog butuh gambar tanpa login); tulis HANYA via RPC (RLS tulis nol, pola repo).

alter table menu_items
  add column if not exists image_path text;

-- Bucket public + limit 2MB + jpg/png/webp saja.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read foto menu (katalog publik). Tulis tetap lewat RPC security-definer.
drop policy if exists "menu-images public read" on storage.objects;
create policy "menu-images public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'menu-images');

drop policy if exists "menu-images tenant write" on storage.objects;
create policy "menu-images tenant write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'menu-images'
    and exists (
      select 1 from tenants t
      where t.owner_id = auth.uid()
      -- path: <tenant_id>/<menu_id>.jpg — tenant hanya tulis folder sendiri
      and (storage.foldername(name))[1] = t.id::text
    )
  );

drop policy if exists "menu-images tenant update" on storage.objects;
create policy "menu-images tenant update" on storage.objects
  for update to authenticated using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from tenants t
      where t.owner_id = auth.uid()
      and (storage.foldername(name))[1] = t.id::text
    )
  );

drop policy if exists "menu-images tenant delete" on storage.objects;
create policy "menu-images tenant delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from tenants t
      where t.owner_id = auth.uid()
      and (storage.foldername(name))[1] = t.id::text
    )
  );

-- upsert_menu_item: tambah p_image_path (nullable; null = pertahankan, '' = hapus).
create or replace function upsert_menu_item(
  p_name text, p_normal_price integer,
  p_id uuid default null, p_avg_weight_grams integer default null,
  p_is_active boolean default true,
  p_ingredients text default null, p_allergen_note text default null,
  p_image_path text default null
) returns menu_items
language plpgsql security definer set search_path = public as $$
 declare v_tid uuid; v_menu menu_items%rowtype; v_path text;
begin
  select id into v_tid from tenants where owner_id = auth.uid();
  if v_tid is null then raise exception 'forbidden: no tenant'; end if;
  if p_normal_price is null or p_normal_price <= 0 then raise exception 'invalid normal price'; end if;
   v_path := nullif(btrim(coalesce(p_image_path, '')), '');
   if v_path is not null and v_path not like v_tid::text || '/%' then
     raise exception 'forbidden: bad image path';
   end if;
   if p_id is null then
    begin
      insert into menu_items (tenant_id, name, normal_price, avg_weight_grams, is_active, ingredients, allergen_note, image_path)
      values (v_tid, btrim(p_name), p_normal_price, p_avg_weight_grams,
        coalesce(p_is_active, true),
        nullif(btrim(coalesce(p_ingredients, '')), ''), nullif(btrim(coalesce(p_allergen_note, '')), ''),
         v_path)
      returning * into v_menu;
    exception when unique_violation then
      raise exception 'menu name already used';
    end;
  else
    select * into v_menu from menu_items where id = p_id and tenant_id = v_tid;
    if not found then raise exception 'forbidden: not own menu'; end if;
    update menu_items set
      name = btrim(p_name),
      normal_price = p_normal_price,
      avg_weight_grams = p_avg_weight_grams,
      is_active = coalesce(p_is_active, is_active),
      ingredients = nullif(btrim(coalesce(p_ingredients, '')), ''),
      allergen_note = nullif(btrim(coalesce(p_allergen_note, '')), ''),
       image_path = case
         when p_image_path is null then image_path
         when btrim(p_image_path) = '' then null
         else v_path end
      where id = p_id returning * into v_menu;
  end if;
  return v_menu;
end $$;

drop function if exists upsert_menu_item(text, integer, uuid, integer, boolean, text, text);
grant execute on function upsert_menu_item(text, integer, uuid, integer, boolean, text, text, text) to authenticated;
