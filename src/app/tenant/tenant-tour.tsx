"use client";

import { GuidedTour } from "@/components/guided-tour";

export function TenantTour() {
  return (
    <GuidedTour
      tourKey="tenant"
      steps={[
        {
          target: '[data-tour="reservasi"]',
          title: "Reservasi menunggu",
          body: "Daftar mahasiswa yang sudah kunci porsi. Ketuk nama untuk detail.",
        },
        {
          target: '[data-tour="scan"]',
          title: "Scan saat serah terima",
          body: "Pindai QR mahasiswa, tekan konfirmasi, terima bayar di kasir.",
        },
        {
          target: '[data-tour="tambah-porsi"]',
          title: "Posting sisa sore ini",
          body: "Maksimal 3 ketukan: menu, jumlah, jam masak.",
        },
      ]}
    />
  );
}
