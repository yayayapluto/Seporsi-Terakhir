-- Buyer live-status: siarkan perubahan orders via Supabase Realtime.
-- RLS orders_read tetap berlaku: subscriber hanya terima row milik sendiri.

alter table orders replica identity full;

alter publication supabase_realtime add table orders;
