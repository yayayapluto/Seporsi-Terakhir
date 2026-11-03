import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { homeForRole, type Role } from "@/lib/auth";
import { isDevLoginAllowed, isDevLoginEmail } from "@/lib/auth/dev-login";
import { resolveNext } from "@/lib/auth/redirect";
import { getEnv } from "@/lib/env";

const querySchema = z.object({
  email: z.string().email("Email tidak valid."),
  next: z.string().optional(),
});

function denied() {
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}

async function handleLogin(request: NextRequest) {
  // Guard 1: mati total di production. Cek PALING AWAL, sebelum baca input apa pun.
  if (!isDevLoginAllowed(process.env.NODE_ENV)) return denied();

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    email: url.searchParams.get("email") ?? "",
    next: url.searchParams.get("next") ?? undefined,
  });
  // Guard 2: email harus di allowlist SEED_ACCOUNTS ( anti enumerasi lintas akun).
  if (!parsed.success || !isDevLoginEmail(parsed.data.email)) return denied();

  // SEED_PASSWORD hanya dibaca server-side di sini. Jangan pernah kirim ke client,
  // jangan masukkan ke getEnv() (dipakai browser client), jangan log.
  const password = process.env.SEED_PASSWORD;
  if (!password) return NextResponse.json({ error: "SEED_PASSWORD belum diset." }, { status: 500 });

  const env = getEnv();
  const response = NextResponse.redirect(new URL("/", request.url));
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Anon key + password seed (sama seperti global-setup E2E). Bukan service-role.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password,
  });
  if (error || !data.user) return denied();

  let role: Role = "student";
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (profile?.role === "tenant" || profile?.role === "admin") role = profile.role;

  response.headers.set("Location", resolveNext(parsed.data.next, homeForRole(role)));
  revalidatePath("/", "layout");
  return response;
}

export async function GET(request: NextRequest) {
  return handleLogin(request);
}

export async function POST(request: NextRequest) {
  return handleLogin(request);
}
