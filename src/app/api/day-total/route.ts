import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { wibTodayRange } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

/** Total porsi hari ini (WIB) milik student — diambil client agar katalog bisa di-cache. */
export async function GET() {
  const current = await requireRole("/beranda/katalog", "student");
  const supabase = await createClient();
  const { dayStartUtc, dayEndIso } = wibTodayRange();
  const { data: orders } = await supabase
    .from("orders")
    .select("quantity")
    .eq("student_id", current.user.id)
    .neq("status", "cancelled")
    .gte("created_at", dayStartUtc)
    .lt("created_at", dayEndIso);
  const dayTotal = ((orders ?? []) as { quantity: number }[]).reduce((s, o) => s + o.quantity, 0);
  return NextResponse.json({ dayTotal });
}
