import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { ScanSkeleton } from "@/components/ui/skeleton-blocks";
import { createClient } from "@/lib/supabase/server";
import { getJourneyNext, parseTourParams } from "@/lib/tour-journey";
import { requireOwnTenant } from "../guard";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = { title: "Scan Pickup" };

export interface LastPickup {
  menuName: string;
  quantity: number;
  pickedUpAt: string;
  totalPrice: number;
}

/** Pickup terakhir tenant untuk rel kanan. Query ringan limit 1. */
async function loadLastPickup(tenantId: string): Promise<LastPickup | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "quantity, picked_up_at, discount_price_snapshot, portions!inner(menu_item_id, menu_items!inner(name), tenant_id)",
    )
    .eq("portions.tenant_id", tenantId)
    .eq("status", "picked_up")
    .order("picked_up_at", { ascending: false })
    .limit(1);
  const row = (data as unknown as Record<string, unknown>[] | null)?.[0];
  if (!row || row.picked_up_at == null) return null;
  const portion = row.portions as unknown as {
    menu_items?: { name: string } | { name: string }[] | null;
  } | null;
  const menu = Array.isArray(portion?.menu_items) ? portion.menu_items[0] : portion?.menu_items;
  return {
    menuName: menu?.name ?? "Menu",
    quantity: Number(row.quantity ?? 0),
    pickedUpAt: String(row.picked_up_at),
    totalPrice: Number(row.quantity ?? 0) * Number(row.discount_price_snapshot ?? 0),
  };
}

/** Scanner pickup: kamera mobile-first, konfirmasi via Server Action. */
export default function ScanPage({ searchParams }: { searchParams?: Promise<{ mode?: string }> }) {
  return (
    <>
      <AppHeader
        title="Scan pickup"
        trail={[{ label: "Kantin", href: "/tenant" }, { label: "Scan" }]}
      />
      <Suspense fallback={<ScanSkeleton />}>
        <ScanBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ScanBody({ searchParams }: { searchParams?: Promise<{ mode?: string }> }) {
  const tenant = await requireOwnTenant("/tenant/scan");
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  const lastPickup = await loadLastPickup(tenant.id);
  const hour = new Date().getHours();
  const greet =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 19
          ? "Selamat sore"
          : "Selamat malam";
  return (
    <>
      <ScannerClient lastPickup={lastPickup} greet={greet} tenantName={tenant.name} />
      <GuidedTour
        tourKey="tenant-scan"
        forced={tourForced}
        journey={tourJourney}
        next={tourJourney ? (getJourneyNext("/tenant/scan") ?? undefined) : undefined}
        journeyLabel="Bagian 2 dari 4 · Scan"
        entryStep={tourEntry}
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
