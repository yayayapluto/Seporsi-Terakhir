import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canTransition,
  type TourProgress,
  type TourStatus,
  tourProgressPayload,
} from "@/lib/tour-progress";

interface Row {
  tour_id: string;
  status: string;
  current_step_id: string | null;
  furthest_step_id: string | null;
  version: number;
  updated_at: string;
  completed_at: string | null;
}

function toProgress(tourId: string, row: Row): TourProgress {
  return {
    tourId,
    version: row.version,
    status: row.status as TourStatus,
    currentStepId: row.current_step_id,
    furthestStepId: row.furthest_step_id,
    updatedAt: new Date(row.updated_at).getTime(),
    ...(row.completed_at ? { completedAt: new Date(row.completed_at).getTime() } : {}),
  };
}

const COLS =
  "tour_id, status, current_step_id, furthest_step_id, version, updated_at, completed_at";

export async function fetchProgress(
  supabase: SupabaseClient,
  userId: string,
  tourId: string,
): Promise<TourProgress | null> {
  if (!tourProgressPayload.shape.tourId.safeParse(tourId).success) return null;
  const { data, error } = await supabase
    .from("tour_progress")
    .select(COLS)
    .eq("user_id", userId)
    .eq("tour_id", tourId)
    .maybeSingle();
  if (error || !data) return null;
  return toProgress(tourId, data as Row);
}

export async function upsertProgress(
  supabase: SupabaseClient,
  userId: string,
  input: unknown,
  restart = false,
): Promise<{ ok: true; progress: TourProgress } | { ok: false; error: string }> {
  const parsed = tourProgressPayload.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data progres tidak valid." };
  const p = parsed.data;
  const { data: existing } = await supabase
    .from("tour_progress")
    .select("status")
    .eq("user_id", userId)
    .eq("tour_id", p.tourId)
    .maybeSingle();
  const from = (existing?.status as TourStatus | undefined) ?? "in_progress";
  if (!canTransition(from, p.status, restart)) {
    return { ok: false, error: "Status final tidak bisa diubah." };
  }
  const final = p.status !== "in_progress";
  const { data, error } = await supabase
    .from("tour_progress")
    .upsert(
      {
        user_id: userId,
        tour_id: p.tourId,
        status: p.status,
        current_step_id: final ? null : p.currentStepId,
        furthest_step_id: p.furthestStepId,
        version: p.version,
        updated_at: new Date().toISOString(),
        completed_at: final ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,tour_id" },
    )
    .select(COLS)
    .single();
  if (error || !data) return { ok: false, error: "Gagal menyimpan progres." };
  return { ok: true, progress: toProgress(p.tourId, data as Row) };
}
