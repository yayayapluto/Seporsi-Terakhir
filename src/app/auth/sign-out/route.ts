import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side sign-out: clears the httpOnly auth cookies that the
 * browser client cannot delete on its own. Without this, the proxy
 * still sees a session after logout and bounces /masuk → /,
 * so the user can never log in again.
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
