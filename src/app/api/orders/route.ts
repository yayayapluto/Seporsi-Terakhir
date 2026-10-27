import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  portionId: z.string().uuid(),
  quantity: z.number().int().min(1).max(2).default(1),
  slotStart: z.string().datetime().optional(),
  slotEnd: z.string().datetime().optional(),
});

/**
 * POST /api/orders — reserve a portion via place_order RPC.
 * Atomic decrement + window checks live in the DB; this is a thin wrapper
 * mapping RPC failures to readable Indonesian errors.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data pesanan tidak valid." }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Masuk dulu untuk memesan." }, { status: 401 });
  const { data, error } = await supabase.rpc("place_order", {
    p_portion_id: parsed.data.portionId,
    p_quantity: parsed.data.quantity,
    p_slot_start: parsed.data.slotStart ?? null,
    p_slot_end: parsed.data.slotEnd ?? null,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("sold_out")) {
      return NextResponse.json({ error: "Porsi habis terjual." }, { status: 409 });
    }
    if (msg.includes("expired")) {
      return NextResponse.json({ error: "Porsi sudah kedaluwarsa." }, { status: 410 });
    }
    if (msg.includes("not_released")) {
      return NextResponse.json({ error: "Porsi belum mulai dijual." }, { status: 409 });
    }
    if (msg.includes("daily limit")) {
      return NextResponse.json(
        { error: "Batas harian tercapai: maksimal 2 porsi per hari." },
        { status: 429 },
      );
    }
    if (msg.includes("slot")) {
      return NextResponse.json({ error: "Slot pickup tidak valid." }, { status: 400 });
    }
    if (msg.includes("quantity")) {
      return NextResponse.json({ error: "Maksimal 2 porsi per pesanan." }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memesan. Coba lagi." }, { status: 400 });
  }
  const orderId = (data as unknown as { id?: string } | null)?.id ?? null;
  return NextResponse.json({ ok: true, orderId }, { status: 201 });
}
