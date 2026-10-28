// bun run seed:auth <password> — DEV-ONLY, idempoten, hosted/lokal.
// createUser NORMAL (tanpa custom id) → trigger handle_new_user bikin
// profile id-asli → remap tenants.owner_id placeholder → id asli.
// Tak ada update PK; guard role lolos via service_role claim.
// JANGAN pakai service key / password ini di prod.
import { createClient } from "@supabase/supabase-js";
import { SEED_ACCOUNTS } from "../src/lib/domain/seed-accounts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rawPassword = process.argv[2] ?? process.env.SEED_PASSWORD;
if (!url || !serviceKey)
  throw new Error("Butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
if (!rawPassword || rawPassword.length < 6) throw new Error("Usage: bun run seed:auth <password>");
const password: string = rawPassword;

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
async function resolveId(email: string, fullName: string): Promise<string> {
  // listUsers rusak di project ini ("Database error finding users"),
  // jadi create langsung; kalau email sudah ada, ambil id dari profiles.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (!error) return data.user.id;
  if (!error.message.toLowerCase().includes("already")) throw error;
  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single()
    .throwOnError();
  if (!prof || typeof prof.id !== "string") throw new Error(`profil tak ketemu: ${email}`);
  const { error: pwErr } = await admin.auth.admin.updateUserById(prof.id, { password });
  if (pwErr) throw pwErr;
  return prof.id;
}

for (const a of SEED_ACCOUNTS) {
  const id = await resolveId(a.email, a.fullName);
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id, email: a.email, full_name: a.fullName });
  if (pErr) throw pErr;
  // service_role lolos guard_profile_role (claims role) → update langsung sah
  const { error: rErr } = await admin.from("profiles").update({ role: a.role }).eq("id", id);
  if (rErr) throw rErr;
  const { error: tErr } = await admin
    .from("tenants")
    .update({ owner_id: id, is_approved: a.role === "tenant" })
    .eq("owner_id", a.placeholderId);
  if (tErr) throw tErr;
  console.log("ok", a.role, a.email);
}
console.log("seed:auth OK");
