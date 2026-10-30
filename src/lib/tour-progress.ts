/** Status progres tur: satu objek per pengguna per tur, tanpa PII. */
import { z } from "zod";

export const TOUR_VERSION = 1;
export const STALE_DAYS = 7;
const STALE_MS = STALE_DAYS * 86_400_000;
/** Batas kedaluwarsa progres/rantai (milidetik). */
export const STALE_AFTER_MS = STALE_MS;

export type TourStatus = "in_progress" | "completed" | "skipped";

export interface TourProgress {
  tourId: string;
  version: number;
  status: TourStatus;
  currentStepId: string | null;
  furthestStepId: string | null;
  updatedAt: number;
  completedAt?: number;
}

export function progressKey(userId: string, tourId: string): string {
  return `tour:${userId}:${tourId}`;
}

export function stepIdFor(
  tourKey: string,
  step: { target: string; id?: string },
  _index = 0,
): string {
  return step.id ?? `${tourKey}:${step.target}`;
}

export function isStale(updatedAt: number, now: number = Date.now()): boolean {
  return now - updatedAt > STALE_MS;
}

/** Rekonsiliasi lokal vs server: final selalu menang, sisanya yang terbaru. */
export function reconcile(
  local: TourProgress | null,
  remote: TourProgress | null,
): TourProgress | null {
  if (!local) return remote;
  if (!remote) return local;
  const localFinal = local.status !== "in_progress";
  const remoteFinal = remote.status !== "in_progress";
  if (localFinal && !remoteFinal) return local;
  if (remoteFinal && !localFinal) return remote;
  return remote.updatedAt >= local.updatedAt ? remote : local;
}

export type StartAction =
  | { action: "hide" }
  | { action: "reset" }
  | { action: "resume"; index: number }
  | { action: "fresh" };

/** TourId yang boleh disimpan — sama dengan tourKey GuidedTour yang ada. */
export const ALLOWED_TOUR_IDS = [
  "beranda",
  "katalog",
  "katalog-detail",
  "pesanan",
  "pesanan-detail",
  "profil",
  "tenant",
  "tenant-menu",
  "tenant-porsi",
  "tenant-pesanan",
  "tenant-scan",
  "admin",
] as const;

const STEP_ID = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9:_.#\-[\]="'> ]+$/);

export const tourProgressPayload = z.object({
  tourId: z.enum(ALLOWED_TOUR_IDS),
  status: z.enum(["in_progress", "completed", "skipped"]),
  currentStepId: STEP_ID.nullable(),
  furthestStepId: STEP_ID.nullable(),
  version: z.number().int().min(1).max(999),
});

export type TourProgressInput = z.infer<typeof tourProgressPayload>;

/** Final tidak boleh mundur kecuali restart eksplisit. */
export function canTransition(from: TourStatus, to: TourStatus, restart: boolean): boolean {
  if (from !== "in_progress" && to === "in_progress" && !restart) return false;
  return true;
}

/**
 * Keputusan mulai berdasar progres tersimpan + definisi langkah saat ini.
 * stepIds = id stabil tiap langkah sesuai urutan.
 */
export function resolveStart(
  saved: TourProgress | null,
  stepIds: string[],
  version: number,
  fresh: boolean,
): StartAction {
  if (fresh) return { action: "reset" };
  if (!saved) return { action: "fresh" };
  if (saved.version !== version) {
    return saved.status === "in_progress" ? { action: "reset" } : { action: "hide" };
  }
  if (saved.status !== "in_progress") return { action: "hide" };
  const at = (id: string | null) => (id == null ? -1 : stepIds.indexOf(id));
  const cur = at(saved.currentStepId);
  if (cur >= 0) return { action: "resume", index: cur };
  const far = at(saved.furthestStepId);
  if (far >= 0) return { action: "resume", index: far };
  return { action: "resume", index: 0 };
}
