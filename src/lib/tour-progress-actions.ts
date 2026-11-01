"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TourProgress } from "@/lib/tour-progress";
import { fetchProgress, upsertProgress } from "@/lib/tour-progress-server";

/** Throttle ringan per pengguna+tur (best-effort, anti-spam dobel-klik). */
const lastWrite = new Map<string, number>();

export async function getTourProgress(tourId: string): Promise<TourProgress | null> {
  const current = await getCurrentUser();
  if (!current) return null;
  const supabase = await createClient();
  return fetchProgress(supabase, current.user.id, tourId);
}

export async function saveTourProgress(
  input: unknown,
  opts?: { restart?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Masuk dulu." };
  const parsed =
    typeof input === "object" && input !== null
      ? (input as { tourId?: unknown }).tourId
      : undefined;
  const key = `${current.user.id}:${String(parsed ?? "")}`;
  const now = Date.now();
  const last = lastWrite.get(key) ?? 0;
  if (now - last < 800 && !opts?.restart) return { ok: true };
  lastWrite.set(key, now);
  const supabase = await createClient();
  const res = await upsertProgress(supabase, current.user.id, input, opts?.restart ?? false);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}
