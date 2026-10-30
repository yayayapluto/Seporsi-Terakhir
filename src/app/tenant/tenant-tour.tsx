"use client";

import { GuidedTour } from "@/components/guided-tour";

export function TenantTour({
  forced = false,
  userId = "anon",
}: {
  forced?: boolean;
  userId?: string;
}) {
  return (
    <GuidedTour
      tourKey="tenant"
      forced={forced}
      userId={userId}
      intro={{
        title: "Kelola kantinmu?",
        body: "Reservasi masuk, scan pickup, dan posting porsi dari sini. Bisa dilewati, dan diulang kapan saja.",
      }}
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
