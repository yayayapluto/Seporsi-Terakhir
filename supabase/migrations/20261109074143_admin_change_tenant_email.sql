-- Admin ubah email akun tenant (owner tenant TERTENTU, by tenant id).
-- Satu transaksi: email auth + verified, hapus semua sesi/token, salinan email
-- di profiles. Password tidak disentuh. Error message dipetakan server action
-- ke teks ramah (tidak pernah bocor raw DB error).
create or replace function admin_change_tenant_email(p_tenant_id uuid, p_new_email text)
returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_old_email text;
  v_new_email text;
begin
  if auth.uid() is null then raise exception 'admin only'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admin only';
  end if;

  v_new_email := lower(btrim(coalesce(p_new_email, '')));
  if v_new_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email'; end if;

  select owner_id into v_owner from tenants where id = p_tenant_id;
  if v_owner is null then raise exception 'tenant not found'; end if;

  select email into v_old_email from auth.users where id = v_owner;
  if v_old_email is null then raise exception 'tenant not found'; end if;
  if lower(v_old_email) = v_new_email then raise exception 'same email'; end if;

  if exists (select 1 from auth.users where id <> v_owner and lower(email) = v_new_email) then
    raise exception 'email taken';
  end if;

  update auth.users
     set email = v_new_email,
         email_confirmed_at = now(),
         confirmation_token = null,
         confirmation_sent_at = null,
         email_change = null,
         updated_at = now()
   where id = v_owner;

  update auth.identities
     set email = v_new_email, updated_at = now()
   where user_id = v_owner and provider = 'email';

  delete from auth.refresh_tokens where user_id = v_owner;
  delete from auth.sessions where user_id = v_owner;

  update profiles set email = v_new_email where id = v_owner;

  return v_new_email;
end $$;

grant execute on function admin_change_tenant_email(uuid, text) to authenticated;
