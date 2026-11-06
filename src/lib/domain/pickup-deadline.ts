// Batas ambil 15 menit (BR-2 turunan): porsi hidup, beda dari expiry makanan.

/** Menit batas ambil setelah pesan dikunci. */
export const PICKUP_DEADLINE_MINUTES = 15;

/** Deadline = bookedAt + 15 menit. Null bila tanggal invalid. */
export function computePickupDeadline(bookedAt: Date): Date | null {
  if (Number.isNaN(bookedAt.getTime())) return null;
  return new Date(bookedAt.getTime() + PICKUP_DEADLINE_MINUTES * 60_000);
}

/** Sisa milidetik sampai deadline; 0 bila sudah lewat. */
export function pickupRemainingMs(deadline: Date, now: Date = new Date()): number {
  return Math.max(0, deadline.getTime() - now.getTime());
}

/** Label countdown mm:ss (di bawah 1 jam). Selalu >= 00:00. */
export function pickupRemainingLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
