import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { formatDateTimeWIB, formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "./order-form";

/** Detail satu porsi. Anon sudah ditolak proxy (/katalog*). */

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
  const { data, error } = await supabase
    .from("portions")
    .select(
      "id, quantity_posted, quantity_remaining, cooked_at, expires_at, release_at, discount_price, menu_items!inner(name, normal_price, ingredients, allergen_note), tenants!inner(name, location_note)",
    )
    .eq("id", portionId)
    .maybeSingle();
  if (error || !data) return null;
  const menu = data.menu_items as unknown as {
    name: string;
    normal_price: number;
    ingredients: string | null;
    allergen_note: string | null;
  };
  const tenant = data.tenants as unknown as { name: string; location_note: string | null };
  return {
    id: data.id,
    menuName: menu.name,
    ingredients: menu.ingredients,
    allergenNote: menu.allergen_note,
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
    <div className="flex gap-3 py-2">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium">{children}</dd>
    </div>
  );
}

function DetailBody({ portion }: { portion: PortionDetail | null }) {
  if (!portion) {
    return (
      <>
        <div className="border-b py-10 text-center">
          <p className="font-bold">Porsi tidak tersedia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Porsi ini mungkin sudah terjual habis, kedaluwarsa, atau belum dirilis tenant. Cek
            katalog untuk porsi lain yang masih tersedia.
          </p>
        </div>
        <Link
          href="/katalog"
          className="inline-flex h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
        >
          Kembali ke katalog
        </Link>
      </>
    );
  }

  const remaining = portion.quantityRemaining;
  const pct =
    portion.quantityPosted > 0
      ? Math.max(0, Math.min(100, Math.round((remaining / portion.quantityPosted) * 100)))
      : 0;
  const low = remaining > 0 && remaining < 3;

  return (
    <>
      <div className="flex flex-col gap-1 border-b pb-6">
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold">{formatIDR(portion.discountPrice)}</p>
          <s className="text-sm text-muted-foreground">{formatIDR(portion.normalPrice)}</s>
          <span className="text-sm font-semibold text-primary">
            Hemat {formatIDR(portion.normalPrice - portion.discountPrice)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">
            Sisa {remaining} porsi
            {low && <span className="ml-2 text-[#DE7819]">hampir habis</span>}
          </span>
          <div
            className="h-2 w-40 overflow-hidden rounded-full bg-[#EAF4EC]"
            role="img"
            aria-label={`Sisa ${remaining} dari ${portion.quantityPosted} porsi`}
          >
            <div
              className={`h-full rounded-full ${low ? "bg-[#F28C28]" : "bg-[#2E7D4F]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <dl className="divide-y divide-border border-b">
        <Info label="Dimasak">{formatDateTimeWIB(new Date(portion.cookedAt))} WIB</Info>
        <Info label="Bisa diambil sampai">
          {formatDateTimeWIB(new Date(portion.expiresAt))} WIB
        </Info>
        <Info label="Bahan">
          {portion.ingredients ?? <span className="font-normal">Belum dicantumkan tenant</span>}
        </Info>
        <Info label="Alergen">
          {portion.allergenNote ?? <span className="font-normal">Belum dicantumkan tenant</span>}
        </Info>
      </dl>

      <div className="border-b pb-8 pt-6">
        <OrderForm
          portionId={portion.id}
          discountPrice={portion.discountPrice}
          quantityRemaining={remaining}
        />
      </div>
    </>
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-primary">KATALOG PORSI TERAKHIR</p>
        {portion ? (
          <>
            <h1 className="text-3xl font-bold">{portion.menuName}</h1>
            <p className="text-muted-foreground">
              dari {portion.tenantName}
              {portion.tenantLocation ? ` · ${portion.tenantLocation}` : ""}
            </p>
          </>
        ) : (
          <h1 className="text-3xl font-bold">Porsi tidak tersedia</h1>
        )}
      </div>
      <DetailBody portion={portion} />
    </div>
  );
}
