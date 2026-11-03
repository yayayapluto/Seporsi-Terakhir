-- Avatar pengguna: 1 foto per user di bucket `avatars` publik.
-- Tulis HANYA via RPC set_my_avatar (pola repo: no direct writes ke profiles).

-- Bucket public + limit 2MB + jpg/png/webp saja.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read avatar (profil butuh gambar tanpa login admin).
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');

-- Tulis folder sendiri: path <user_id>/avatar.<ext>.
drop policy if exists "avatars user write" on storage.objects;
create policy "avatars user write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars user update" on storage.objects;
create policy "avatars user update" on storage.objects
  for update to authenticated using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars user delete" on storage.objects;
create policy "avatars user delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Simpan path avatar milik sendiri: null = pertahankan, '' = hapus.
create or replace function set_my_avatar(p_avatar_path text default null)
returns profiles
language plpgsql security definer set search_path = public as $$
declare v_profile profiles%rowtype; v_path text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  v_path := nullif(btrim(coalesce(p_avatar_path, '')), '');
  if v_path is not null and v_path not like auth.uid()::text || '/%' then
    raise exception 'forbidden: bad avatar path';
  end if;
  update profiles set
    avatar_url = case
      when p_avatar_path is null then avatar_url
      when btrim(p_avatar_path) = '' then null
      else v_path end,
    updated_at = now()
  where id = auth.uid()
  returning * into v_profile;
  if not found then raise exception 'profile not found'; end if;
  return v_profile;
end $$;

grant execute on function set_my_avatar(text) to authenticated;
