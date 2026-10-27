import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

async function refreshSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const env = getEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  // Touch session so expired tokens refresh before Server Components run.
  await supabase.auth.getUser();
  return response;
}

/**
 * Proxy refreshes the Supabase session once per request, then enforces
 * coarse route gates: auth pages bounce logged-in users home, protected
 * routes bounce anonymous users to /masuk.
 */
export async function updateSession(request: NextRequest) {
  const response = await refreshSession(request);
  // Read the mutated request cookies (refresh writes back here) — the
  // response only carries Set-Cookie deltas, which getUser can't parse.
  const supabase = createServerClient(
    getEnv().NEXT_PUBLIC_SUPABASE_URL,
    getEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();
  const path = url.pathname;
  // /masuk bounces signed-in users home; /auth/* must run (code exchange).
  const isAuthPage = path === "/masuk";
  const isProtected =
    path.startsWith("/katalog") ||
    path.startsWith("/pesanan") ||
    path.startsWith("/profil") ||
    path.startsWith("/tenant") ||
    path.startsWith("/admin");

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (isProtected && !user) {
    const login = new URL("/masuk", request.url);
    login.searchParams.set("next", url.pathname + url.search);
    return NextResponse.redirect(login);
  }
  return response;
}
