-- Tren harian pickup untuk dasbor admin (WIB day buckets).
create or replace function impact_daily(p_from timestamptz default null, p_to timestamptz default null)
returns table (day date, saved bigint)
language sql security definer set search_path = public stable as $$
  select (o.picked_up_at at time zone 'Asia/Jakarta')::date,
    coalesce(sum(o.quantity), 0)
  from orders o
  where o.status = 'picked_up' and o.picked_up_at is not null
    and (p_from is null or o.picked_up_at >= p_from)
    and (p_to is null or o.picked_up_at < p_to)
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  group by 1 order by 1;
$$;

grant execute on function impact_daily(timestamptz, timestamptz) to authenticated;
