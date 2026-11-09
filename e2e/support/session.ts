import { createClient } from "@supabase/supabase-js";

/**
 * Bangun storageState Playwright dari kredensial seed (untuk test yang butuh
 * SESSI BARU di luar storageState file — mis. order berurutan akun yang sama
 * kena limit 2/hari). Format cookie seperti yang ditulis @supabase/ssr.
 */
export async function sessionCookies(email: string, password: string, baseURL: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("session butuh Supabase env");
  const db = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`login segar gagal: ${error?.message}`);
  const ref = new URL(url).hostname.split(".")[0] ?? "";
  const session = data.session;
  const payload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: "bearer",
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    user: data.user,
  });
  const cookieValue = `base64-${Buffer.from(payload, "utf8").toString("base64")}`;
  return [
    {
      name: `sb-${ref}-auth-token`,
      value: cookieValue,
      domain: new URL(baseURL).hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    },
  ];
}
