import { GuidedTour } from "@/components/guided-tour";
import { requireOwnTenant } from "../guard";
import { ScannerClient } from "./scanner-client";

/** Scanner pickup: kamera mobile-first, konfirmasi via Server Action. */
export default async function ScanPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  await requireOwnTenant("/tenant/scan");
  const sp = (await searchParams) ?? {};
  const tourForced = sp.mode === "onboarding";
  return (
    <>
      <ScannerClient />
      <GuidedTour
        tourKey="tenant-scan"
        forced={tourForced}
        intro={{
          title: "Scan pickup?",
          body: "Arahkan kamera ke QR mahasiswa, konfirmasi setelah terima bayar. Itu saja.",
        }}
        steps={[
          {
            target: '[data-tour="scanner"]',
            title: "Bidik QR-nya",
            body: "Kamera membaca kode pickup dari layar mahasiswa otomatis.",
          },
          {
            target: '[data-tour="manual"]',
            title: "Kamera bermasalah?",
            body: "Minta kode pickup dari layar mahasiswa, tempel manual di sini.",
          },
        ]}
      />
    </>
  );
}
