import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Seed data terisolasi untuk e2e: semua record bernama `e2e-<runId>-*`,
 * dibuat lewat service client (dev saja). Teardown menghapus by prefix.
 */
export interface E2ESeed {
  runId: string;
  admin: { email: string; password: string };
  mitra: { email: string; password: string; tenantId: string; menuId: string; portionId: string };
  buyer: { email: string; password: string };
  buyer2: { email: string; password: string };
  pendingTenantId: string;
  pendingOwnerId: string;
}

const adminClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("seed butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
};

export const RUN_ID = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
const email = (role: string) => `e2e-${RUN_ID}-${role}@yopmail.com`;

export async function createTestData(): Promise<E2ESeed> {
  const db = adminClient();
  const password = `E2e@${RUN_ID}Pass!`;

  async function makeAccount(role: string, name: string) {
    const em = email(role);
    const { data, error } = await db.auth.admin.createUser({
      email: em,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error || !data.user) throw new Error(`createUser ${role}: ${error?.message}`);
    const id = data.user.id;
    const { error: pErr } = await db
      .from("profiles")
      .upsert({ id, email: em, full_name: name, role });
    if (pErr) throw pErr;
    return { id, email: em, password };
  }

  const admin = await makeAccount("admin", "Admin E2E");
  const mitra = await makeAccount("tenant", "Mitra E2E");
  const buyer = await makeAccount("student", "Buyer E2E");
  const buyer2 = await makeAccount("student", "Buyer2 E2E");
  const pendingOwner = await makeAccount("tenant", "Pending E2E");

  const { data: tenantRow, error: tErr } = await db
    .from("tenants")
    .insert({
      owner_id: mitra.id,
      name: `e2e-${RUN_ID}-tenant`,
      is_approved: true,
      is_listed: true,
    })
    .select("id")
    .single();
  if (tErr) throw tErr;
  const tenantId = tenantRow.id as string;
  const { data: pendingRow, error: pendErr } = await db
    .from("tenants")
    .insert({ owner_id: pendingOwner.id, name: `e2e-${RUN_ID}-pending`, is_approved: false })
    .select("id")
    .single();
  if (pendErr) throw pendErr;

  const { data: menuRow, error: mErr } = await db
    .from("menu_items")
    .insert({
      tenant_id: tenantId,
      name: `e2e-${RUN_ID}-menu`,
      normal_price: 15000,
      is_active: true,
      safety_tier: "conditional",
      sale_conditions: `Syarat uji e2e ${RUN_ID}.`,
    })
    .select("id")
    .single();
  if (mErr) throw mErr;
  const menuId = menuRow.id as string;

  const cooked = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data: portionRow, error: pErr } = await db
    .from("portions")
    .insert({
      tenant_id: tenantId,
      menu_item_id: menuId,
      quantity_posted: 5,
      quantity_remaining: 5,
      cooked_at: cooked,
      sell_window_minutes: 180,
      release_at: cooked,
      discount_price: 5000,
    })
    .select("id")
    .single();
  if (pErr) throw pErr;

  return {
    runId: RUN_ID,
    admin,
    mitra: { email: mitra.email, password, tenantId, menuId, portionId: portionRow.id as string },
    buyer,
    buyer2,
    pendingTenantId: pendingRow.id as string,
    pendingOwnerId: pendingOwner.id,
  };
}

export async function teardownData() {
  const db = adminClient();
  const { data: tenants } = await db.from("tenants").select("id").like("name", `e2e-${RUN_ID}-%`);
  for (const t of tenants ?? []) {
    const { data: portions } = await db.from("portions").select("id").eq("tenant_id", t.id);
    for (const p of portions ?? []) {
      await db.from("orders").delete().eq("portion_id", p.id);
    }
    await db.from("portions").delete().eq("tenant_id", t.id);
    await db.from("menu_items").delete().eq("tenant_id", t.id);
    await db.from("tenants").delete().eq("id", t.id);
  }
  const { data: profiles } = await db
    .from("profiles")
    .select("id")
    .like("email", `e2e-${RUN_ID}-%`);
  for (const p of profiles ?? []) {
    await db.auth.admin.deleteUser(p.id as string);
  }
}
