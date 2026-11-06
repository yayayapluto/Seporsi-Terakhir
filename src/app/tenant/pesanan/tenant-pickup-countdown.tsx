"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { sweepLatePickups } from "@/app/tenant/pesanan/actions";
import { PickupCountdown } from "@/components/pickup-countdown";

/**
 * Countdown batas ambil 15 menit di sisi penjual (dasbor/detail pesanan).
 * Saat menyentuh 00:00, sapu server lalu refresh → reservasi pindah status.
 */
export function TenantPickupCountdown({
  deadlineIso,
  className,
}: {
  deadlineIso: string;
  className?: string;
}) {
  const router = useRouter();
  const onExpire = useCallback(() => {
    void sweepLatePickups().then(() => router.refresh());
  }, [router]);

  return <PickupCountdown deadlineIso={deadlineIso} onExpire={onExpire} className={className} />;
}
