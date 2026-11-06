"use client";

import { Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PickupCountdown } from "@/components/pickup-countdown";
import { sweepLatePickups } from "../actions";

/**
 * Banner countdown batas ambil 15 menit untuk pembeli. Saat menyentuh 00:00,
 * sapu server (flag unpicked + stok kembali) lalu refresh halaman → status pindah.
 */
export function PickupDeadlineBanner({ deadlineIso }: { deadlineIso: string }) {
  const router = useRouter();
  const onExpire = useCallback(() => {
    void sweepLatePickups().then(() => router.refresh());
  }, [router]);

  return (
    <section
      aria-label="Batas waktu ambil"
      className="flex items-center gap-3 rounded-2xl border border-[#B45309]/20 bg-[#FEF3C7] p-4"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#B45309]"
      >
        <Timer className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#1C2826]">
          Ambil dalam{" "}
          <PickupCountdown deadlineIso={deadlineIso} onExpire={onExpire} className="tabular-nums" />
        </p>
        <p className="mt-0.5 text-[13px] text-[#92400E]">
          Lewat batas ini pesanan ditandai telat diambil dan porsi kembali ke katalog.
        </p>
      </div>
    </section>
  );
}
