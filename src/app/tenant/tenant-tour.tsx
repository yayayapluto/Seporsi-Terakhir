"use client";

import { GuidedTour } from "@/components/guided-tour";

export function TenantTour({
  forced = false,
  auto = false,
  journey = false,
  next,
  journeyLabel,
  entryStep = null,
  fresh = false,
  userId = "anon",
}: {
  forced?: boolean;
  auto?: boolean;
  journey?: boolean;
  next?: string;
  journeyLabel?: string;
  entryStep?: number | null;
  fresh?: boolean;
  userId?: string;
}) {
  return (
    <GuidedTour
      tourKey="tenant"
      forced={forced}
      auto={auto}
      journey={journey}
      next={next}
      journeyLabel={journeyLabel}
      entryStep={entryStep}
      fresh={fresh}
      userId={userId}
      intro={{
        title: "Kelola kantinmu?",
        body: "Reservasi masuk, scan pickup, dan posting porsi dari sini. Bisa dilewati, dan diulang kapan saja.",
      }}
      steps={[
        {
          target: "#tour-hero",
          title: "Mulai dari sini",
          body: "Sapaan, nama kantin, dan ringkasan hari ini ada di kartu ini.",
        },
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
