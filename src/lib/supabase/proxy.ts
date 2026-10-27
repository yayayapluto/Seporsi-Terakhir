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
 * Proxy refreshes the Supabase session on every request, then enforces
 * coarse route gates: auth pages bounce logged-in users home, protected
 * routes bounce anonymous users to /masuk.
 */
export async function updateSession(request: NextRequest) {
  const response = await refreshSession(request);
  const {
    data: { user },
  } = await createServerClient(
    getEnv().NEXT_PUBLIC_SUPABASE_URL,
    getEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
    },
  ).auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/masuk" || path.startsWith("/auth/");
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
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  return response;
}
