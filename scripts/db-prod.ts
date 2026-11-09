// bun run db:prod — WIPE fake seed tenant-side data, seed REAL tenants + menus.
// Default = dry run (prints plan, touches nothing). Execute: bun run db:prod -- --yes
// Needs (never committed): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// TENANT_DEFAULT_PASSWORD. Fake seed data comes from bun run db:seed — do NOT
// change that script; this one replaces its tenant-side rows only.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

interface TenantSeed {
  name: string;
  email: string;
}

const TENANTS: TenantSeed[] = [
  { name: "Ayam Penyet Bang Dower", email: "AyamPenyetBangDower@yopmail.com" },
  { name: "Kantin Bu Ghin", email: "KantinBuGhin@yopmail.com" },
  { name: "Kantin Bucin Cindy", email: "KantinBucinCindy@yopmail.com" },
  { name: "Kantin Ibu 'Is", email: "KantinIbuIs@yopmail.com" },
  { name: "Kantin Royani", email: "KantinRoyani@yopmail.com" },
  { name: "Kantin Zoya", email: "KantinZoya@yopmail.com" },
  { name: "Prayata Resto", email: "PrayataResto@yopmail.com" },
  { name: "Warung Samping Prayata", email: "WarungSampingPrayata@yopmail.com" },
];

interface MenuSeed {
  tenant: string;
  name: string;
  normalPrice: number;
  safetyTier: "safe" | "conditional";
  saleConditions: string | null;
}

const MENUS: MenuSeed[] = [
  {
    tenant: "Warung Samping Prayata",
    name: "Nasi Ayam Bakar",
    normalPrice: 20000,
    safetyTier: "safe",
    saleConditions: null,
  },
  {
    tenant: "Warung Samping Prayata",
    name: "Nasi Ayam Bakar Hemat",
    normalPrice: 15000,
    safetyTier: "safe",
    saleConditions: null,
  },
  {
    tenant: "Ayam Penyet Bang Dower",
    name: "Sate Taichan + Nasi/Lontong",
    normalPrice: 20000,
    safetyTier: "safe",
    saleConditions: null,
  },
  {
    tenant: "Kantin Bu Ghin",
    name: "Nasi Ayam Bakar",
    normalPrice: 15000,
    safetyTier: "safe",
    saleConditions: null,
  },
  {
    tenant: "Kantin Bu Ghin",
    name: "Nasi Sate Taichan",
    normalPrice: 20000,
    safetyTier: "safe",
    saleConditions: null,
  },
  {
    tenant: "Kantin Bucin Cindy",
    name: "Ayam BBQ",
    normalPrice: 15000,
    safetyTier: "safe",
    saleConditions: null,
  },
  {
    tenant: "Prayata Resto",
    name: "Nasi Ayam Bakar Bumbu Rujak",
    normalPrice: 18000,
    safetyTier: "safe",
    saleConditions: null,
  },
  {
    tenant: "Prayata Resto",
    name: "Nasi Putih",
    normalPrice: 5000,
    safetyTier: "safe",
    saleConditions: null,
  },
  {
    tenant: "Kantin Ibu 'Is",
    name: "Bento 1 (Nasi, 3 Egg roll, salad)",
    normalPrice: 18000,
    safetyTier: "conditional",
    saleConditions: "Salad dipisah atau dihilangkan. Egg roll dipanggang, bukan digoreng.",
  },
  {
    tenant: "Kantin Ibu 'Is",
    name: "Bento 2 (Nasi, 3 shrimp roll, salad)",
    normalPrice: 18000,
    safetyTier: "conditional",
    saleConditions: "Salad dipisah atau dihilangkan. Shrimp roll dipanggang, bukan digoreng.",
  },
  {
    tenant: "Kantin Ibu 'Is",
    name: "Bento 3 (Nasi, 2 Egg Roll, 1 Shrimp Roll, salad)",
    normalPrice: 18000,
    safetyTier: "conditional",
    saleConditions:
      "Salad dipisah atau dihilangkan. Egg roll dan shrimp roll dipanggang, bukan digoreng.",
  },
  {
    tenant: "Kantin Ibu 'Is",
    name: "Bento 5 (Nasi, 1 Egg roll, 1 Shrimp Roll, 1 Chicken Teriyaki, Salad)",
    normalPrice: 23000,
    safetyTier: "conditional",
    saleConditions:
      "Salad dipisah atau dihilangkan. Egg roll dan shrimp roll dipanggang, bukan digoreng. Saus teriyaki kental, tidak berkuah.",
  },
  {
    tenant: "Kantin Ibu 'Is",
    name: "Bento 6 (Nasi, 1 Egg roll, 1 Shrimp Roll, 1 Beef Teriyaki, Salad)",
    normalPrice: 26000,
    safetyTier: "conditional",
    saleConditions:
      "Salad dipisah atau dihilangkan. Egg roll dan shrimp roll dipanggang, bukan digoreng. Saus teriyaki kental, tidak berkuah.",
  },
  {
    tenant: "Kantin Ibu 'Is",
    name: "Chicken Teriyaki + Nasi + Salad",
    normalPrice: 18000,
    safetyTier: "conditional",
    saleConditions: "Salad dipisah atau dihilangkan. Saus teriyaki kental, tidak berkuah.",
  },
  {
    tenant: "Kantin Ibu 'Is",
    name: "Beef Teriyaki + Nasi + Salad",
    normalPrice: 20000,
    safetyTier: "conditional",
    saleConditions: "Salad dipisah atau dihilangkan. Saus teriyaki kental, tidak berkuah.",
  },
  {
    tenant: "Kantin Royani",
    name: "Siomay",
    normalPrice: 12000,
    safetyTier: "conditional",
    saleConditions: "Saus dipisah. Jendela jual pendek.",
  },
  {
    tenant: "Kantin Zoya",
    name: "Dimsum (isi 4)",
    normalPrice: 12000,
    safetyTier: "conditional",
    saleConditions: "Saus dipisah. Jendela jual pendek.",
  },
  {
    tenant: "Prayata Resto",
    name: "Nasi Ayam Bakar Solo",
    normalPrice: 18000,
    safetyTier: "conditional",
    saleConditions: "Bumbu ungkep dipastikan tanpa santan.",
  },
  {
    tenant: "Prayata Resto",
    name: "Nasi Ikan nila (goreng/bakar)",
    normalPrice: 20000,
    safetyTier: "conditional",
    saleConditions: "Hanya versi bakar, bukan goreng. Jendela jual pendek.",
  },
  {
    tenant: "Prayata Resto",
    name: "Sate-Satean",
    normalPrice: 5000,
    safetyTier: "conditional",
    saleConditions: "Hanya sate daging atau ayam, bukan kulit atau usus.",
  },
];

const TRUNCATE_TABLES = ["orders", "portions", "menu_items", "tenants"];
const DRY_NOTE = "Dry run — nothing touched. Re-run with: bun run db:prod -- --yes";

const password = process.env.TENANT_DEFAULT_PASSWORD;
if (!password) {
  console.log("set TENANT_DEFAULT_PASSWORD");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
}

let host = url;
try {
  host = new URL(url).host;
} catch {
  // keep raw value if not parseable
}

console.log(`db:prod target host: ${host}  database: postgres`);
console.log(`will truncate (cascade): ${TRUNCATE_TABLES.join(", ")}`);
console.log(
  "will delete fake tenant-owner auth users + profiles only (seed marker *1793198479@yopmail.com, role tenant)",
);
console.log("will NOT touch: student/buyer/admin accounts, tour_progress (non-tenant-side)");
console.log(
  `will insert: ${TENANTS.length} tenants, ${MENUS.length} menus, ${MENUS.length} portions (1 per menu), ${TENANTS.length} tenant accounts`,
);
console.log(
  "placeholder values: none (location_note NULL; is_approved=true, is_active=true app defaults)",
);
console.log("NOTE: 'Warung Samping Prayata' is a placeholder name — rename when confirmed");

const execute = process.argv.includes("--yes");
if (!execute) {
  console.log(DRY_NOTE);
  process.exit(0);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// Fake tenant owners: seed-marker email AND role tenant (students share the
// marker but are never deleted). Also require owning a to-be-truncated
// tenant when possible — never add an owner unless BOTH hold, so re-runs
// can't delete the real accounts db:prod itself just created.
const fakeOwners = new Set<string>();
const { data: markerProfiles, error: markerErr } = await db
  .from("profiles")
  .select("id,email,role")
  .ilike("email", "%1793198479@yopmail.com")
  .eq("role", "tenant");
if (markerErr) throw markerErr;
const { data: oldTenants, error: oldErr } = await db.from("tenants").select("owner_id");
if (oldErr) throw oldErr;
const oldOwnerIds = new Set(
  (oldTenants ?? []).map((t) => t.owner_id).filter((id): id is string => typeof id === "string"),
);
for (const p of markerProfiles ?? []) {
  if (typeof p.id === "string" && oldOwnerIds.has(p.id)) fakeOwners.add(p.id);
}

// Create/find one login account per tenant, mirroring scripts/seed-auth.ts:
// admin.createUser (email_confirm + full_name metadata) → upsert profile →
// service_role role update (guard bypassed by service_role claim, see
// guard_profile_role). Existing accounts: matched case-insensitively by
// email, reconnected to the tenant, password left unchanged.
async function ensureTenantAccount(tenant: TenantSeed): Promise<{ id: string; email: string }> {
  const { data: existing } = await db
    .from("profiles")
    .select("id,email")
    .ilike("email", tenant.email)
    .limit(1);
  const found = existing?.[0];
  if (found && typeof found.id === "string" && typeof found.email === "string") {
    const { error: roleErr } = await db
      .from("profiles")
      .update({ role: "tenant", full_name: tenant.name })
      .eq("id", found.id);
    if (roleErr) throw roleErr;
    return { id: found.id, email: found.email };
  }
  const { data, error } = await db.auth.admin.createUser({
    email: tenant.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: tenant.name },
  });
  if (error || !data.user) throw error ?? new Error(`createUser failed: ${tenant.email}`);
  const user = data.user;
  const { error: pErr } = await db.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: tenant.name,
  });
  if (pErr) throw pErr;
  const { error: rErr } = await db.from("profiles").update({ role: "tenant" }).eq("id", user.id);
  if (rErr) throw rErr;
  return { id: user.id, email: user.email ?? tenant.email };
}

const accounts: Array<{ tenant: TenantSeed; id: string; email: string }> = [];
for (const tenant of TENANTS) {
  const acc = await ensureTenantAccount(tenant);
  accounts.push({ tenant, id: acc.id, email: acc.email });
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const tenantRows = accounts
  .map((a) => `  (${q(a.id)}, ${q(a.tenant.name)}, NULL, true)`)
  .join(",\n");
const menuRows = MENUS.map((m) => {
  const acc = accounts.find((a) => a.tenant.name === m.tenant);
  if (!acc) throw new Error(`tenant tak ada: ${m.tenant}`);
  const conditions = m.saleConditions === null ? "NULL" : q(m.saleConditions);
  return `  ((select id from tenants where owner_id = ${q(acc.id)}), ${q(m.name)}, ${m.normalPrice}, ${q(m.safetyTier)}, ${conditions}, true)`;
}).join(",\n");
const fakeIds = [...fakeOwners];

// Seeding porsi: 1 porsi per menu agar katalog langsung hidup. Cooked
// bervariasi (hub jendela demo "hampir habis" sampai segar); stok hidup.
const MINUTES_AGO = [25, 40, 80, 140, 30, 100, 170];
const portionRows = MENUS.map((m, i) => {
  const acc = accounts.find((a) => a.tenant.name === m.tenant);
  if (!acc) throw new Error(`tenant tak ada: ${m.tenant}`);
  const mins = MINUTES_AGO[i % MINUTES_AGO.length] ?? 25;
  const qty = 3 + (i % 4);
  const discount = Math.round((m.normalPrice * 0.45) / 500) * 500;
  return `  ((select id from tenants where owner_id = ${q(acc.id)}),
    (select id from menu_items where tenant_id = (select id from tenants where owner_id = ${q(acc.id)}) and name = ${q(m.name)}),
    ${qty}, ${qty}, now() - interval '${mins} minutes', 180, now() - interval '${mins} minutes', ${discount})`;
}).join(",\n");

const sql = `-- db:prod: wipe fake tenant-side data, seed real tenants + menus + portions.
begin;
truncate table public.orders, public.portions, public.menu_items, public.tenants cascade;
delete from auth.users where id in (${fakeIds.map(q).join(", ") || "null::uuid"});
insert into public.tenants (owner_id, name, location_note, is_approved)
values
${tenantRows};
insert into public.menu_items (tenant_id, name, normal_price, safety_tier, sale_conditions, is_active)
values
${menuRows};
insert into public.portions (tenant_id, menu_item_id, quantity_posted, quantity_remaining,
  cooked_at, sell_window_minutes, release_at, discount_price)
values
${portionRows};
commit;
`;

const dir = mkdtempSync(join(tmpdir(), "db-prod-"));
const file = join(dir, "db-prod.sql");
writeFileSync(file, sql, "utf8");

// supabase db query --linked executes the file against the linked project
// database; the explicit begin/commit keeps wipe+seed in one transaction
// (any error rolls back everything).
execFileSync("bunx", ["supabase", "db", "query", "--linked", "--file", file], {
  stdio: "inherit",
});

console.log(`tables truncated: ${TRUNCATE_TABLES.join(", ")}`);
console.log(`fake tenant-owner accounts removed: ${fakeIds.length}`);
console.log(`tenants inserted: ${TENANTS.length}`);
console.log(`menus inserted: ${MENUS.length}`);
console.log(`portions inserted: ${MENUS.length}`);
console.log("placeholder values used: none (location_note NULL)");
console.log("tenant -> email:");
for (const a of accounts) console.log(`  ${a.tenant.name} -> ${a.email}`);
