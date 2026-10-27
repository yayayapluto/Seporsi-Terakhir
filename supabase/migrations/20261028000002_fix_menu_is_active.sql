-- Fix: upsert_menu_item update branch must not re-activate menus on price-only edits.
-- Split from 20261028000001 (never applied anywhere — Docker down — so no divergence).
create or replace function upsert_menu_item(
  p_name text, p_normal_price integer,
  p_id uuid default null, p_avg_weight_grams integer default null,
  p_is_active boolean default true,
  p_ingredients text default null, p_allergen_note text default null
) returns menu_items
language plpgsql security definer set search_path = public as $$
declare v_tid uuid; v_menu menu_items%rowtype;
begin
  v_tid := own_tenant_id();
  if p_name is null or btrim(p_name) = '' then raise exception 'name required'; end if;
  if p_normal_price is null or p_normal_price <= 0 then raise exception 'invalid normal price'; end if;
  if p_avg_weight_grams is not null and p_avg_weight_grams <= 0 then raise exception 'invalid weight'; end if;
  if p_id is null then
    begin
      insert into menu_items (tenant_id, name, normal_price, avg_weight_grams, is_active, ingredients, allergen_note)
      values (v_tid, btrim(p_name), p_normal_price, p_avg_weight_grams,
        coalesce(p_is_active, true),
        nullif(btrim(coalesce(p_ingredients, '')), ''), nullif(btrim(coalesce(p_allergen_note, '')), ''))
      returning * into v_menu;
    exception when unique_violation then
      raise exception 'menu name already used';
    end;
  else
    select * into v_menu from menu_items where id = p_id;
    if not found then raise exception 'menu not found'; end if;
    if v_menu.tenant_id <> v_tid then raise exception 'forbidden'; end if;
    begin
      update menu_items set
        name = btrim(p_name), normal_price = p_normal_price,
        avg_weight_grams = p_avg_weight_grams,
        is_active = coalesce(p_is_active, v_menu.is_active),
        ingredients = nullif(btrim(coalesce(p_ingredients, '')), ''),
        allergen_note = nullif(btrim(coalesce(p_allergen_note, '')), '')
      where id = p_id returning * into v_menu;
    exception when unique_violation then
      raise exception 'menu name already used';
    end;
  end if;
  return v_menu;
end $$;
