import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchProgress, upsertProgress } from "@/lib/tour-progress-server";

/** GET ?tourId= — sumber kebenaran server untuk progres milik sendiri. */
export async function GET(req: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ ok: false }, { status: 401 });
  const tourId = new URL(req.url).searchParams.get("tourId") ?? "";
  const supabase = await createClient();
  const progress = await fetchProgress(supabase, current.user.id, tourId);
  return NextResponse.json({ ok: true, progress });
}

/** PUT — dipakai flush keepalive/beacon saat halaman disembunyikan. */
export async function PUT(req: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ ok: false }, { status: 401 });
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const restart =
    typeof body === "object" && body !== null
      ? (body as { restart?: unknown }).restart === true
      : false;
  const supabase = await createClient();
  const res = await upsertProgress(supabase, current.user.id, body, restart);
  if (!res.ok) return NextResponse.json(res, { status: 422 });
  return NextResponse.json({ ok: true });
}
