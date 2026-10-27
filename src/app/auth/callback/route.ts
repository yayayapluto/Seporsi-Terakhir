import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { homeForRole, type Role } from "@/lib/auth";
import { resolveNext } from "@/lib/auth/redirect";
import { getEnv } from "@/lib/env";

/**
 * OAuth callback: exchange code for session, then redirect by role.
 * The `next` param survives the provider round-trip and is honored only
 * when it is a safe internal path; otherwise the user lands on their
 * role home.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");

  if (code) {
    const env = getEnv();
    const response = new Response(null, { status: 302 });
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
          setAll: (toSet) => {
            for (const { name, value, options } of toSet) {
              response.headers.append(
                "Set-Cookie",
                `${name}=${value}; Path=${options?.path ?? "/"}; HttpOnly; SameSite=Lax`,
              );
            }
          },
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let role: Role = "student";
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data?.role === "tenant" || data?.role === "admin") role = data.role;
      }
      const target = resolveNext(rawNext, homeForRole(role));
      response.headers.set("Location", target);
      return response;
    }
  }
  redirect("/masuk?error=oauth");
}
