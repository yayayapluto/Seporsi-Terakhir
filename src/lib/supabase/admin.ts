import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — SERVER ONLY (jangan pernah diimpor dari client
 * component). Bypass RLS untuk tugas admin terotorisasi saja (mis. unggah
 * foto via signed URL, pengecekan objek storage).
 *
 * Di runtime Cloudflare, secret worker dibaca dari konteks Cloudflare
 * (bukan process.env); di dev/next polos dari process.env.
 */
async function serviceKey(): Promise<string | undefined> {
  const direct = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (direct) return direct;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const v = (ctx.env as Record<string, string | undefined>).SUPABASE_SERVICE_ROLE_KEY;
    if (v) return v;
  } catch {
    // bukan runtime Cloudflare — biarkan undefined
  }
  return undefined;
}

export async function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = await serviceKey();
  if (!url || !key) throw new Error("Service role belum dikonfigurasi.");
  return createClient(url, key, { auth: { persistSession: false } });
}
