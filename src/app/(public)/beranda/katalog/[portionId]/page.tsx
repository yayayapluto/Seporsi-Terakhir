import { cn } from "cn";
import { Clock3, ImageOff, Store, Timer, TriangleAlert, Wheat } from "lucide-react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { GuidedTour } from "@/components/guided-tour";
import {
  attachMissingIngredientColumns,
  isMissingColumnError,
  shouldLogPortionLoadError,
} from "@/lib/domain/portion-detail";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { publicMenuImageUrl } from "@/lib/menu-image";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "./order-form";
import { PortionImage } from "./portion-image";

export interface PortionDetail {
  id: string;
  menuName: string;
  ingredients: string | null;
  allergenNote: string | null;
  normalPrice: number;
  tenantName: string;
  tenantLocation: string | null;
  quantityPosted: number;
  quantityRemaining: number;
  cookedAt: string;
  expiresAt: string;
  releaseAt: string;
  discountPrice: number;
  imageUrl: string | null;
}

const PortionId = z.string().uuid();

async function loadRelated(tenantName: string, excludeId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("portions")
    .select("id, discount_price, tenants!inner(name), menu_items!inner(name)")
    .eq("tenants.name", tenantName)
    .neq("id", excludeId)
    .gt("expires_at", now)
    .order("expires_at", { ascending: true })
    .limit(3);
  return (data ?? []).map((r) => {
    const menu = r.menu_items as unknown as { name: string } | { name: string }[];
    const m = Array.isArray(menu) ? menu[0] : menu;
    return {
      id: String(r.id),
      menuName: m?.name ?? "Menu",
      discountPrice: Number(r.discount_price),
    };
  });
}

async function loadPortion(portionId: string): Promise<PortionDetail | null> {
  const supabase = await createClient();
  const base =
    "id, quantity_posted, quantity_remaining, cooked_at, expires_at, release_at, discount_price, tenants!inner(name, location_note)";
  const t0 = Date.now();
  const full = await supabase
    .from("portions")
    .select(`${base}, menu_items!inner(name, normal_price, ingredients, allergen_note, image_path)`)
    .eq("id", portionId)
    .maybeSingle();
  // ponytail: log sementara Fase 1 ukur ms query; hapus sebelum Fase 2.
  console.log(`[ukur] katalog.detail ${Date.now() - t0}ms`);
  // ponytail: hosted ketinggalan migrasi kolom baru → fallback select minimal, bukan halaman mati.
  // Nol baris maybeSingle (habis/kedaluwarsa/RLS) = sah: diam, tanpa log.
  let row = full.data;
  if (full.error && isMissingColumnError(full.error.message)) {
    const retry = await supabase
      .from("portions")
      .select(`${base}, menu_items!inner(name, normal_price, image_path)`)
      .eq("id", portionId)
      .maybeSingle();
    if (retry.error || !retry.data) {
      if (shouldLogPortionLoadError(retry.error)) {
        console.error("[katalog-detail] load gagal", portionId, retry.error?.message);
      }
      return null;
    }
    row = attachMissingIngredientColumns(retry.data) as unknown as typeof full.data;
  } else if (full.error || !row) {
    if (shouldLogPortionLoadError(full.error)) {
      console.error("[katalog-detail] load gagal", portionId, full.error?.message);
    }
    return null;
  }
  if (!row) return null;
  const data = row;
  const menu = data.menu_items as unknown as {
    name: string;
    normal_price: number;
    ingredients?: string | null;
    allergen_note?: string | null;
    image_path?: string | null;
  };
  const tenant = data.tenants as unknown as { name: string; location_note: string | null };
  return {
    id: data.id,
    menuName: menu.name,
    ingredients: menu.ingredients ?? null,
    allergenNote: menu.allergen_note ?? null,
    normalPrice: menu.normal_price,
    tenantName: tenant.name,
    tenantLocation: tenant.location_note,
    quantityPosted: data.quantity_posted,
    quantityRemaining: data.quantity_remaining,
    cookedAt: data.cooked_at,
    expiresAt: data.expires_at,
    releaseAt: data.release_at,
    discountPrice: data.discount_price,
    imageUrl: menu.image_path ? publicMenuImageUrl(menu.image_path) : null,
  };
}

import {
  SieraField,
  SieraRailPage,
  SieraSection,
  SieraSectionTitle,
  sieraCardClass,
} from "@/components/siera";

function DetailBody({
  portion,
  related,
}: {
  portion: PortionDetail | null;
  related: { id: string; menuName: string; discountPrice: number }[];
}) {
  if (!portion) {
    return (
      <EmptyState
        title="Porsi tidak tersedia"
        hint="Porsi ini sudah habis, lewat masa ambil, atau belum dibuka tenant. Lihat porsi lain yang masih ada di katalog."
        ctaHref={ROUTES.katalog}
        ctaLabel="Kembali ke katalog"
      />
    );
  }

  const remaining = portion.quantityRemaining;
  const soldOut = remaining <= 0;
  const low = remaining > 0 && remaining < 3;
  const leftMin = Math.max(
    0,
    Math.floor((+new Date(portion.expiresAt).getTime() - Date.now()) / 60000),
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
      {/* Detail Header Card */}
      <section
        aria-label="Ringkasan porsi"
        className={cn(sieraCardClass, "flex flex-col gap-3 p-5")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${soldOut ? "bg-[#F1F5F2] text-[#64746B]" : low ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#DCEBE0] text-[#1E5A36]"}`}
          >
            {soldOut ? "Habis" : `Sisa ${remaining} porsi${low ? " · hampir habis" : ""}`}
          </span>
          {!soldOut && leftMin < 60 && (
            <span className="inline-flex items-center rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-bold text-[#92400E]">
              {leftMin <= 5 ? "Segera ambil" : `Batas ambil ${leftMin} mnt lagi`}
            </span>
          )}
        </div>
        <h1 className="text-balance text-xl leading-snug font-extrabold tracking-tight text-[#1C2826] sm:text-2xl">
          {portion.menuName}
        </h1>
        <p className="text-sm text-[#64746B]">
          dari {portion.tenantName}
          {portion.tenantLocation ? ` · ${portion.tenantLocation}` : ""}
        </p>
        <span aria-hidden className="border-t border-dashed border-line" />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <del className="text-xs text-[#64746B]">
              <span className="sr-only">Harga awal: </span>
              {formatIDR(portion.normalPrice)}
            </del>
            <strong className="text-2xl font-extrabold text-accent-strong">
              {formatIDR(portion.discountPrice)}
            </strong>
          </p>
          <p className="text-[13px] text-[#64746B]">
            Ambil sampai {formatDateTimeWIB(new Date(portion.expiresAt))} WIB
          </p>
        </div>
      </section>

      <SieraRailPage
        asideLabel="Panel pesan dan info"
        main={
          <>
            {/* Foto */}
            <div>
              {portion.imageUrl ? (
                <PortionImage src={portion.imageUrl} alt={`Foto ${portion.menuName}`} />
              ) : (
                <div
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 self-start rounded-[20px] border border-line bg-[#F4EFE6] text-[#64746B]"
                  role="img"
                  aria-label={`Foto ${portion.menuName} belum tersedia`}
                >
                  <ImageOff className="size-8" aria-hidden />
                  <span className="px-1 text-center text-xs leading-tight">
                    Foto porsi belum tersedia
                  </span>
                </div>
              )}
            </div>

            {/* Detail */}
            <section aria-label="Detail porsi" className="flex min-w-0 flex-col gap-2">
              <div className="flex min-h-11 items-center">
                <SieraSectionTitle>Detail porsi</SieraSectionTitle>
              </div>
              <dl
                className={cn(
                  sieraCardClass,
                  "flex flex-col divide-y divide-dashed divide-line px-4",
                )}
              >
                <SieraField icon={Clock3} label="Dimasak">
                  {formatDateTimeWIB(new Date(portion.cookedAt))} WIB
                </SieraField>
                <SieraField icon={Timer} label="Batas ambil">
                  {formatDateTimeWIB(new Date(portion.expiresAt))} WIB
                </SieraField>
                {portion.ingredients == null && portion.allergenNote == null ? (
                  <SieraField icon={Wheat} label="Bahan & alergen">
                    <span className="font-normal text-[#64746B]">
                      Belum dicantumkan tenant. Tanya langsung saat ambil kalau kamu punya alergi.
                    </span>
                  </SieraField>
                ) : (
                  <>
                    <SieraField icon={Wheat} label="Bahan">
                      {portion.ingredients ?? (
                        <span className="font-normal text-[#64746B]">Belum dicantumkan tenant</span>
                      )}
                    </SieraField>
                    <SieraField icon={TriangleAlert} label="Alergen">
                      {portion.allergenNote ?? (
                        <span className="font-normal text-[#64746B]">Belum dicantumkan tenant</span>
                      )}
                    </SieraField>
                  </>
                )}
                <SieraField icon={Store} label="Tenant">
                  {portion.tenantName}
                  {portion.tenantLocation ? (
                    <span className="block truncate font-normal text-[#64746B]">
                      {portion.tenantLocation}
                    </span>
                  ) : null}
                </SieraField>
              </dl>
            </section>
          </>
        }
        aside={
          <>
            {/* Panel pesan */}
            <aside aria-label="Panel pesan" className={cn(sieraCardClass, "h-fit p-4")}>
              <h2 className="text-[15px] font-bold text-[#1C2826]">Atur jumlah</h2>
              <p className="mt-0.5 text-[13px] text-[#64746B]">Stok tersisa: {remaining}</p>
              <span aria-hidden className="my-3 block border-t border-dashed border-line" />
              <div className="mt-4">
                <OrderForm
                  portionId={portion.id}
                  discountPrice={portion.discountPrice}
                  quantityRemaining={remaining}
                  expiresAt={portion.expiresAt}
                />
              </div>
            </aside>

            {/* Cara ambil */}
            <SieraSection id="cara-ambil" label="Cara ambil">
              <ol
                className={cn(sieraCardClass, "flex flex-col gap-2 p-4 text-[13px] text-[#64746B]")}
              >
                <li>1. Pesan porsi lalu simpan QR pickup.</li>
                <li>2. Tunjukkan QR ke tenant sebelum batas ambil.</li>
                <li>3. Bayar di tempat lalu bawa pulang.</li>
              </ol>
            </SieraSection>

            {related.length > 0 && (
              <SieraSection id="sejenis-heading" label="Porsi sejenis">
                <ul
                  className={cn(sieraCardClass, "flex flex-col divide-y divide-dashed divide-line")}
                >
                  {related.map((r) => (
                    <li key={r.id}>
                      <a
                        href={`${ROUTES.katalog}/${r.id}`}
                        className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <span className="truncate text-sm font-bold text-[#1C2826]">
                          {r.menuName}
                        </span>
                        <span className="shrink-0 text-sm font-extrabold text-accent-strong">
                          {formatIDR(r.discountPrice)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </SieraSection>
            )}
          </>
        }
      />
    </div>
  );
}

export default async function PortionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ portionId: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const { portionId } = await params;
  const sp = (await searchParams) ?? {};
  const tourForced = sp.mode === "onboarding";
  if (!PortionId.safeParse(portionId).success) notFound();
  const portion = await loadPortion(portionId);
  const related = portion ? await loadRelated(portion.tenantName, portionId) : [];
  return (
    <>
      <AppHeader
        title={portion?.menuName ?? "Detail Porsi"}
        trail={[
          { label: "Beranda", href: ROUTES.beranda },
          { label: "Katalog", href: ROUTES.katalog },
          { label: portion?.menuName ?? "Detail Porsi" },
        ]}
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-8 md:px-8">
        <DetailBody portion={portion} related={related} />
        <GuidedTour
          tourKey="katalog-detail"
          forced={tourForced}
          intro={{
            title: "Cara baca halaman porsi?",
            body: "Cek stok, jam ambil, dan harga rescue di sini. Kalau cocok, kunci porsinya sebelum habis.",
          }}
          steps={[
            {
              target: '[aria-label="Ringkasan porsi"]',
              title: "Stok dan harga",
              body: "Sisa porsi, harga rescue, dan batas waktu ambil. Yang hampir habis ditandai jelas.",
            },
            {
              target: '[aria-label="Panel pesan"]',
              title: "Kunci porsimu",
              body: "Atur jumlah, lalu pesan. Porsi terkunci atas namamu dan muncul di halaman Pesanan.",
            },
            {
              target: '[aria-label="Detail porsi"]',
              title: "Dimasak kapan?",
              body: "Jam masak, bahan, dan alergen. Kalau ragu soal alergi, tanya tenant saat ambil.",
            },
          ]}
        />
      </div>
    </>
  );
}
