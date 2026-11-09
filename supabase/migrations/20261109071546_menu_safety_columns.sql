-- Menu safety: tier 'safe' | 'conditional' (NULL = not vetted) + sale conditions
-- (NULL = no conditions). Nullable, no backfill. Portions join menu_items via
-- menu_item_id (they do not copy name/price), so no column needed there.
alter table menu_items
  add column if not exists safety_tier text
    check (safety_tier is null or safety_tier in ('safe', 'conditional')),
  add column if not exists sale_conditions text;
