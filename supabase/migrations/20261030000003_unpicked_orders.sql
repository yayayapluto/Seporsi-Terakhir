-- Status turunan "tidak diambil": reservasi lewat batas ambil.
-- Ditentukan server dari portions.expires_at (timestamptz, bukan jam klien).

alter type order_status add value if not exists 'unpicked';

-- Idempoten: hanya reserved + porsi kedaluwarsa yang berpindah.
-- Stok TIDAK dikembalikan: porsi sudah kedaluwarsa (mati), bukan dibatalkan.
create or replace function sweep_expired_orders()
returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer := 0;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  with moved as (
    update orders o set status = 'unpicked'
    from portions p
    where o.portion_id = p.id
      and o.status = 'reserved'
      and p.expires_at <= now()
    returning o.id
  )
  select count(*) into v_count from moved;
  return v_count;
end $$;

grant execute on function sweep_expired_orders() to authenticated;
