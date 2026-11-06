"use client";

import { useEffect, useState } from "react";
import { pickupRemainingLabel, pickupRemainingMs } from "@/lib/domain/pickup-deadline";

/**
 * Countdown batas ambil 15 menit. Render awal dari deadline (SSR-safe: label
 * dihitung dari jam server saat render, lalu klien menyinkron tiap detik).
 * Saat menyentuh 00:00 panggil onExpire sekali (sweep + refresh), tanpa polling.
 */
export function PickupCountdown({
  deadlineIso,
  onExpire,
  className,
}: {
  deadlineIso: string;
  onExpire?: () => void;
  className?: string;
}) {
  const deadline = new Date(deadlineIso);
  const [msLeft, setMsLeft] = useState(() => pickupRemainingMs(deadline));

  useEffect(() => {
    setMsLeft(pickupRemainingMs(deadline));
    const id = setInterval(() => {
      const left = pickupRemainingMs(deadline);
      setMsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  const expired = msLeft <= 0;
  return (
    <span className={className} data-state={expired ? "expired" : "running"}>
      {expired ? "Batas ambil lewat" : pickupRemainingLabel(msLeft)}
    </span>
  );
}
