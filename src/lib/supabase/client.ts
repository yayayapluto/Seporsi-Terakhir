import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Browser-side Supabase client (anon key, RLS-enforced). Singleton: auth
 * events only notify listeners on the same instance, so fresh instances
 * per call leave SiteHeader's onAuthStateChange stale after signOut.
 */
export function createClient(): SupabaseClient {
  if (!cached) {
    const env = getEnv();
    cached = createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return cached;
}
