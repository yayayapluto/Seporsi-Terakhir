import { ArrowLeft, ImageOff, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  attachMissingIngredientColumns,
  isMissingColumnError,
  shouldLogPortionLoadError,
} from "@/lib/domain/portion-detail";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "./order-form";

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
}

const PortionId = z.string().uuid();

async function loadPortion(portionId: string): Promise<PortionDetail | null> {
  const supabase = await createClient();
  const base =
    "id, quantity_posted, quantity_remaining, cooked_at, expires_at, release_at, discount_price, tenants!inner(name, location_note)";
  const full = await supabase
    .from("portions")
    .select(`${base}, menu_items!inner(name, normal_price, ingredients, allergen_note)`)
    .eq("id", portionId)
    .maybeSingle();
  // ponytail: hosted ketinggalan migrasi kolom baru → fallback select minimal, bukan halaman mati.
  // Nol baris maybeSingle (habis/kedaluwarsa/RLS) = sah: diam, tanpa log.
  let row = full.data;
  if (full.error && isMissingColumnError(full.error.message)) {
    const retry = await supabase
      .from("portions")
      .select(`${base}, menu_items!inner(name, normal_price)`)
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
  };
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-sm font-semibold text-muted-foreground sm:w-40">{label}</dt>
      <dd className="min-w-0 text-sm font-medium">{children}</dd>
    </div>
  );
}

function DetailBody({ portion }: { portion: PortionDetail | null }) {
  if (!portion) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-10 text-center">
        <div>
          <p className="font-bold">Porsi tidak tersedia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Porsi ini mungkin sudah terjual habis, kedaluwarsa, atau belum dirilis tenant. Cek
            katalog untuk porsi lain yang masih tersedia.
          </p>
        </div>
        <Link
          href="/katalog"
          className="inline-flex h-11 w-fit items-center self-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  const remaining = portion.quantityRemaining;
  const low = remaining > 0 && remaining < 3;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)_minmax(0,5fr)] lg:gap-8">
      <div
        className="flex aspect-square w-full flex-col items-center justify-center gap-2 self-start rounded-xl bg-muted text-muted-foreground"
        role="img"
        aria-label={`Foto ${portion.menuName} belum tersedia`}
      >
        <ImageOff className="size-8" aria-hidden />
        <span className="text-sm">tidak ada gambar</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl font-bold">{formatIDR(portion.discountPrice)}</p>
          <s className="text-sm text-muted-foreground">{formatIDR(portion.normalPrice)}</s>
          {portion.normalPrice > portion.discountPrice && (
            <span className="text-sm font-semibold text-primary">
              Hemat {formatIDR(portion.normalPrice - portion.discountPrice)}
            </span>
          )}
        </div>
        <p className="mt-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${low ? "bg-accent/15 text-accent-strong" : "bg-secondary text-secondary-foreground"}`}
          >
            Sisa {remaining} porsi{low ? " · hampir habis" : ""}
          </span>
        </p>
        <dl className="mt-4 divide-y divide-border border-y">
          <Info label="Dimasak">{formatDateTimeWIB(new Date(portion.cookedAt))} WIB</Info>
          <Info label="Bisa diambil sampai">
            {formatDateTimeWIB(new Date(portion.expiresAt))} WIB
          </Info>
          {portion.ingredients == null && portion.allergenNote == null ? (
            <Info label="Bahan & alergen">
              <span className="font-normal text-muted-foreground">
                Belum dicantumkan tenant — tanya tenant saat ambil bila ada alergi.
              </span>
            </Info>
          ) : (
            <>
              <Info label="Bahan">
                {portion.ingredients ?? (
                  <span className="font-normal text-muted-foreground">
                    Belum dicantumkan tenant
                  </span>
                )}
              </Info>
              <Info label="Alergen">
                {portion.allergenNote ?? (
                  <span className="font-normal text-muted-foreground">
                    Belum dicantumkan tenant
                  </span>
                )}
              </Info>
            </>
          )}
        </dl>
        <div className="mt-4 flex items-center gap-3 rounded-xl border bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Store className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{portion.tenantName}</p>
            {portion.tenantLocation && (
              <p className="truncate text-sm text-muted-foreground">{portion.tenantLocation}</p>
            )}
          </div>
        </div>
      </div>
      <aside className="h-fit rounded-xl border bg-card p-4 lg:sticky lg:top-20">
        <h2 className="text-sm font-bold">Atur jumlah dan jam ambil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Stok tersisa: {remaining}</p>
        <div className="mt-4">
          <OrderForm
            portionId={portion.id}
            discountPrice={portion.discountPrice}
            quantityRemaining={remaining}
            releaseAt={portion.releaseAt}
            expiresAt={portion.expiresAt}
          />
        </div>
      </aside>
    </div>
  );
}

export default async function PortionDetailPage({
  params,
}: {
  params: Promise<{ portionId: string }>;
}) {
  const { portionId } = await params;
  if (!PortionId.safeParse(portionId).success) notFound();
  const portion = await loadPortion(portionId);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/katalog"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Katalog
        </Link>
        {portion ? (
          <>
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">{portion.menuName}</h1>
            <p className="text-muted-foreground">
              dari {portion.tenantName}
              {portion.tenantLocation ? ` · ${portion.tenantLocation}` : ""}
            </p>
          </>
        ) : (
          <h1 className="text-balance text-2xl font-bold sm:text-3xl">Porsi tidak tersedia</h1>
        )}
      </div>
      <DetailBody portion={portion} />
    </div>
  );
}
