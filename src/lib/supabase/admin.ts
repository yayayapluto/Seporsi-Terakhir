import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — SERVER ONLY (jangan pernah diimpor dari client
 * component). Bypass RLS untuk tugas admin terotorisasi saja (mis. unggah
 * foto via signed URL, pengecekan objek storage).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Service role belum dikonfigurasi.");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
