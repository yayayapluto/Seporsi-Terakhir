import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { homeForRole } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { LEGACY_REDIRECTS, legacyKatalogPesanan, legacyPorsiUbah } from "@/lib/routes";

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
  // Redirect 308 path lama → baru (bookmark/QR lama). Sebelum guard proteksi.
  const legacy = LEGACY_REDIRECTS[path] ?? legacyPorsiUbah(path) ?? legacyKatalogPesanan(path);
  if (legacy) {
    const dest = new URL(legacy + url.search, request.url);
    const redirect = NextResponse.redirect(dest, 308);
    for (const c of response.cookies.getAll()) redirect.cookies.set(c.name, c.value, c);
    return redirect;
  }
  // Alias /dasbor/* → rute dalam: URL cantik di browser, file tak pindah.
  // Guard dinilai dari path dalam, rewrite jalan setelah lolos guard.
  const DASBOR_PREFIXES = ["/beranda", "/profil", "/tenant", "/admin", "/notifikasi"];
  const isDasborAlias = path === "/dasbor" || path.startsWith("/dasbor/");
  const inner = isDasborAlias ? path.replace(/^\/dasbor/, "") || "/" : path;
  const isKnownAlias =
    !isDasborAlias || DASBOR_PREFIXES.some((p) => inner === p || inner.startsWith(`${p}/`));
  // /masuk bounces signed-in users home; /auth/* must run (code exchange).
  const isAuthPage = path === "/masuk";
  const isProtected =
    inner === "/beranda" ||
    inner.startsWith("/beranda/") ||
    inner.startsWith("/profil") ||
    inner.startsWith("/tenant") ||
    inner.startsWith("/admin");
  if (isAuthPage && user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = data?.role === "tenant" || data?.role === "admin" ? data.role : "student";
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }
  if (isProtected && !user) {
    const login = new URL("/masuk", request.url);
    login.searchParams.set("next", url.pathname + url.search);
    return NextResponse.redirect(login);
  }
  if (isDasborAlias && isKnownAlias) {
    url.pathname = inner;
    const rewrite = NextResponse.rewrite(url);
    for (const c of response.cookies.getAll()) rewrite.cookies.set(c.name, c.value, c);
    return rewrite;
  }
  return response;
}
