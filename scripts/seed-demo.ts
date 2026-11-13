// bun run db:seed — DEV-ONLY, idempoten, hosted/lokal.
// Isi SEMUA tabel demo: tenants (link by email), menu_items, portions segar,
// orders contoh. Butuh: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// di env (.env.local, git-ignored) + auth users sudah ada (bun run seed:auth).
// JANGAN pakai service key ini di prod.
import { createClient } from "@supabase/supabase-js";
import { SEED_MENUS, SEED_ORDERS, SEED_PORTIONS } from "../src/lib/domain/seed-catalog";

const NAMES: Record<string, { name: string; loc: string }> = {
  "warteg1793198479@yopmail.com": { name: "Warteg Barokah", loc: "Kantin blok A no. 3" },
  "kopi1793198479@yopmail.com": { name: "Kopi Pojok", loc: "Selasar perpustakaan" },
  "padang1793198479@yopmail.com": { name: "Masakan Padang Uni", loc: "Pujasera utama" },
  "soto1793198479@yopmail.com": { name: "Soto Lamongan Cak No", loc: "Kantin gedung C" },
  "pecel1793198479@yopmail.com": { name: "Pecel Madiun Mbak Sri", loc: "Kantin vokasi" },
  "geprek1793198479@yopmail.com": { name: "Ayam Geprek Mas Boy", loc: "Kantin gedung B" },
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey)
  throw new Error("Butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const disc = (n: number) => Math.round((n * 0.45) / 500) * 500;

// email -> id (profiles + tenants + menus resolusi bertahap)
const profId: Record<string, string> = {};
for (const email of [
  ...Object.keys(NAMES),
  "rafi1793198479@yopmail.com",
  "sinta1793198479@yopmail.com",
]) {
  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single()
    .throwOnError();
  if (!data || typeof data.id !== "string")
    throw new Error(`profiles tak ada: ${email} (jalanin seed:auth dulu)`);
  profId[email] = data.id;
}
// tenants upsert by owner_id
const tenantId: Record<string, string> = {};
for (const [email, v] of Object.entries(NAMES)) {
  const { data } = await db
    .from("tenants")
    .upsert(
      { owner_id: profId[email], name: v.name, location_note: v.loc, is_approved: true },
      { onConflict: "owner_id" },
    )
    .select("id")
    .single()
    .throwOnError();
  if (!data || typeof data.id !== "string") throw new Error(`tenant gagal: ${email}`);
  tenantId[email] = data.id;
}
// menus upsert by (tenant_id, name)
const menuId: Record<string, string> = {};
for (const m of SEED_MENUS) {
  const tid = tenantId[m.tenantEmail];
  const base = {
    tenant_id: tid,
    name: m.name,
    normal_price: m.normalPrice,
    avg_weight_grams: m.weightGrams,
    is_active: true,
  };
  // hosted kadang belum apply migrasi portion_details: coba lengkap dulu,
  // fallback ke base bila schema cache menolak kolom ingredients.
  const full = await db
    .from("menu_items")
    .upsert(
      { ...base, ingredients: m.ingredients, allergen_note: m.allergenNote },
      { onConflict: "tenant_id,name" },
    )
    .select("id")
    .single();
  let mid: string;
  if (!full.error && full.data && typeof full.data.id === "string") mid = full.data.id;
  else {
    const { data: menu } = await db
      .from("menu_items")
      .upsert(base, { onConflict: "tenant_id,name" })
      .select("id")
      .single()
      .throwOnError();
    if (!menu || typeof menu.id !== "string") throw new Error(`menu gagal: ${m.name}`);
    mid = menu.id;
  }
  menuId[`${m.tenantEmail}|${m.name}`] = mid;
}
// portions: skip yg sudah punya porsi aktif hari ini
let porsiBaru = 0;
const portionId: Record<string, string> = {};
for (const p of SEED_PORTIONS) {
  const key = `${p.tenantEmail}|${p.menuName}`;
  const mid = menuId[key];
  const { data: aktif } = await db
    .from("portions")
    .select("id")
    .eq("menu_item_id", mid)
    .gt("quantity_remaining", 0)
    .gt("expires_at", new Date().toISOString())
    .limit(1);
  if (aktif && aktif.length > 0) {
    const first = aktif[0];
    if (!first || typeof first.id !== "string") throw new Error(`porsi rusak: ${key}`);
    portionId[key] ??= first.id;
    continue;
  }
  const cooked = new Date(Date.now() - p.cookedMinAgo * 60000).toISOString();
  const normal =
    SEED_MENUS.find((m) => m.tenantEmail === p.tenantEmail && m.name === p.menuName)?.normalPrice ??
    0;
  const { data: ins } = await db
    .from("portions")
    .insert({
      tenant_id: tenantId[p.tenantEmail],
      menu_item_id: mid,
      quantity_posted: p.qty,
      quantity_remaining: p.qty,
      cooked_at: cooked,
      sell_window_minutes: 180,
      release_at: cooked,
      discount_price: disc(normal),
    })
    .select("id")
    .single()
    .throwOnError();
  if (!ins || typeof ins.id !== "string") throw new Error(`porsi gagal: ${key}`);
  portionId[key] = ins.id;
  porsiBaru++;
}
// orders contoh: idempoten by (student,portion,status)
for (const o of SEED_ORDERS) {
  const key = `${o.tenantEmail}|${o.menuName}`;
  const pid = portionId[key];
  const sid = profId[o.studentEmail];
  const menu = SEED_MENUS.find((m) => m.tenantEmail === o.tenantEmail && m.name === o.menuName);
  if (!menu || !pid || !sid) throw new Error(`order tak ketemu target: ${key}`);
  const { data: ada } = await db
    .from("orders")
    .select("id")
    .eq("student_id", sid)
    .eq("portion_id", pid)
    .eq("status", o.status)
    .limit(1);
  if (ada && ada.length > 0) continue;
  const slotStart = new Date(Date.now() + (o.slotMinAhead ?? 30) * 60000).toISOString();
  const { error } = await db.from("orders").insert({
    portion_id: pid,
    student_id: sid,
    quantity: o.qty,
    status: o.status,
    slot_start: slotStart,
    slot_end: new Date(new Date(slotStart).getTime() + 30 * 60000).toISOString(),
    normal_price_snapshot: menu.normalPrice,
    discount_price_snapshot: disc(menu.normalPrice),
    avg_weight_snapshot: menu.weightGrams,
    picked_up_at: o.status === "picked_up" ? new Date().toISOString() : null,
    pickup_deadline_at: new Date(Date.now() + 15 * 60000).toISOString(),
  });
  if (error) throw error;
  const { data: stok } = await db
    .from("portions")
    .select("quantity_remaining")
    .eq("id", pid)
    .single()
    .throwOnError();
  if (!stok || typeof stok.quantity_remaining !== "number" || stok.quantity_remaining < o.qty)
    throw new Error(`stok tak cukup: ${key}`);
  const { error: sErr } = await db
    .from("portions")
    .update({ quantity_remaining: stok.quantity_remaining - o.qty })
    .eq("id", pid);
  if (sErr) throw sErr;
}
// Riwayat 30 hari (WIB) untuk grafik dasbor admin: porsi lampau sold-out
// + pesanan picked_up tersebar per hari. Deterministik per (hari, urutan):
// LCG seed tetap, jadi idempoten & bentuk grafik stabil antar re-run.
const STUDENT_EMAILS = ["rafi1793198479@yopmail.com", "sinta1793198479@yopmail.com"];
const DAYS_BACK = 30;
const todayIso = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
  .toISOString()
  .slice(0, 10);
let riwayatBaru = 0;
for (let d = DAYS_BACK; d >= 1; d--) {
  const dayIso = new Date(
    new Date(`${todayIso}T00:00:00+07:00`).getTime() - d * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
  // 3–8 pesanan per hari, sedikit tren naik menjelang hari ini.
  const pairs = 3 + Math.floor(((DAYS_BACK - d) * 5) / DAYS_BACK) + (d % 2);
  for (let i = 0; i < pairs; i++) {
    let s = (d * 104729 + i * 7919 + 42) % 2147483647;
    const rnd = () => {
      s = (s * 48271) % 2147483647;
      return s / 2147483647;
    };
    const menu = SEED_MENUS[Math.floor(rnd() * SEED_MENUS.length)];
    const studentEmail = STUDENT_EMAILS[Math.floor(rnd() * STUDENT_EMAILS.length)];
    if (!menu || !studentEmail) throw new Error("seed riwayat rusak");
    const qty = 1 + Math.floor(rnd() * 2);
    const hour = 9 + Math.floor(rnd() * 10);
    const minute = Math.floor(rnd() * 12) * 5;
    const cooked = new Date(
      `${dayIso}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+07:00`,
    );
    const key = `${menu.tenantEmail}|${menu.name}`;
    const mid = menuId[key];
    if (!mid) throw new Error(`menu tak ketemu: ${key}`);
    const { data: ada } = await db
      .from("portions")
      .select("id")
      .eq("menu_item_id", mid)
      .eq("cooked_at", cooked.toISOString())
      .limit(1);
    if (ada && ada.length > 0) continue;
    const sisa = Math.floor(rnd() * 3); // 0–2 porsi tak laku (hangus, stok mati)
    const { data: ins } = await db
      .from("portions")
      .insert({
        tenant_id: tenantId[menu.tenantEmail],
        menu_item_id: mid,
        quantity_posted: qty + sisa,
        quantity_remaining: sisa,
        cooked_at: cooked.toISOString(),
        sell_window_minutes: 180,
        release_at: cooked.toISOString(),
        discount_price: disc(menu.normalPrice),
        created_at: cooked.toISOString(),
      })
      .select("id")
      .single()
      .throwOnError();
    if (!ins || typeof ins.id !== "string") throw new Error(`porsi riwayat gagal: ${key}`);
    const created = new Date(cooked.getTime() + (2 + Math.floor(rnd() * 50)) * 60000);
    const pickedUp = new Date(created.getTime() + (2 + Math.floor(rnd() * 10)) * 60000);
    const { error: oErr } = await db.from("orders").insert({
      portion_id: ins.id,
      student_id: profId[studentEmail],
      quantity: qty,
      status: "picked_up",
      slot_start: cooked.toISOString(),
      slot_end: new Date(cooked.getTime() + 30 * 60000).toISOString(),
      normal_price_snapshot: menu.normalPrice,
      discount_price_snapshot: disc(menu.normalPrice),
      avg_weight_snapshot: menu.weightGrams,
      created_at: created.toISOString(),
      picked_up_at: pickedUp.toISOString(),
      pickup_deadline_at: new Date(created.getTime() + 15 * 60000).toISOString(),
    });
    if (oErr) throw oErr;
    riwayatBaru++;
  }
}
console.log(
  `db:seed OK (porsi baru: ${porsiBaru}, riwayat grafik baru: ${riwayatBaru}, sisanya sudah ada)`,
);
