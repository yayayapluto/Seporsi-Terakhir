import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const PW = process.env.SEED_PASSWORD ?? "";
if (!SUPABASE_URL || !ANON || !PW)
  throw new Error(
    "env e2e kurang: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SEED_PASSWORD",
  );
const REF = new globalThis.URL(SUPABASE_URL).hostname.split(".")[0];

const ACCOUNTS = {
  admin: "admin1793198479@yopmail.com",
  tenant: "warteg1793198479@yopmail.com",
  student: "rafi1793198479@yopmail.com",
} as const;

async function login(email: string) {
  const sb = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PW });
  if (error || !data.session) throw new Error(`login gagal ${email}: ${error?.message}`);
  // @supabase/ssr 0.12: base64URL(JSON sesi penuh) tanpa padding.
  const value = `base64-${Buffer.from(JSON.stringify(data.session)).toString("base64url")}`;
  return [{ name: `sb-${REF}-auth-token`, value, domain: "localhost", path: "/" }];
}

export default async function setup() {
  mkdirSync("tests/.auth", { recursive: true });
  for (const [role, email] of Object.entries(ACCOUNTS)) {
    const cookies = await login(email);
    writeFileSync(`tests/.auth/${role}.json`, JSON.stringify({ cookies, origins: [] }));
    console.log(`auth ok: ${role}`);
  }
}
