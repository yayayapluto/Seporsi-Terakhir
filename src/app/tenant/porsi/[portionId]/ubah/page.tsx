import { Lightbulb } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { GuidedTour } from "@/components/guided-tour";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SieraList, SieraRailPage, SieraRowLink, SieraSection } from "@/components/siera";
import { SELL_WINDOW_DEFAULT_MINUTES } from "@/lib/domain/constants";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { parseTourParams } from "@/lib/tour-journey";
import { requireOwnTenant } from "../../../guard";
import { PortionForm, type PortionFormMenu } from "../../portion-form";

/** Edit porsi milik sendiri: jam masak, jendela jual, harga diskon, quantity. */
export default async function EditPorsiPage({
  params,
  searchParams,
}: {
  params: Promise<{ portionId: string }>;
  searchParams?: Promise<{ panduan?: string; langkah?: string; fresh?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const { forced: tourForced, journey: tourJourney, entryStep: tourEntry } = parseTourParams(sp);
  return (
    <>
      <GuidedTour
        tourKey="tenant-porsi-ubah"
        forced={tourForced}
        journey={tourJourney}
        entryStep={tourEntry}
        intro={{
          title: "Ubah porsi?",
          body: "Pastikan data benar sebelum posting. Menu, jumlah, diskon, jam masak.",
        }}
        steps={[
          {
            id: "porsi-edit-heading",
            target: "#tour-hero",
            title: "Cek porsi",
            body: "Pastikan porsi dan sisa quantity sesuai.",
          },
          {
            id: "porsi-edit-form",
            target: 'button[type="submit"]',
            title: "Simpan",
            body: "Klik simpan untuk update porsi di katalog sore ini.",
          },
        ]}
      />
      <Suspense fallback={<LoadingSpinner />}>
        <EditPorsiBody params={params} sp={sp} />
      </Suspense>
    </>
  );
}

async function EditPorsiBody({
  params,
  sp: _sp,
}: {
  params: Promise<{ portionId: string }>;
  sp: { panduan?: string; langkah?: string; fresh?: string };
}) {
  const tenant = await requireOwnTenant("/tenant/porsi/ubah");
  const { portionId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("portions")
    .select(
      "id, menu_item_id, quantity_posted, quantity_remaining, cooked_at, sell_window_minutes, release_at, discount_price, menu_items!inner(normal_price, tenant_id)",
    )
    .eq("id", portionId)
    .single();
  const mi = data?.menu_items as unknown as { normal_price: number; tenant_id: string } | null;
  if (!data || !mi || mi.tenant_id !== tenant.id) notFound();
  const normalPrice = mi.normal_price;
  const menusRes = await supabase
    .from("menu_items")
    .select("id, name, normal_price, is_active")
    .eq("tenant_id", tenant.id)
    .or(`is_active.eq.true,id.eq.${data.menu_item_id}`)
    .order("name", { ascending: true });
  const menus: PortionFormMenu[] = (menusRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    normalPrice: m.normal_price,
    isActive: m.is_active,
  }));
  // datetime-local WIB butuh "YYYY-MM-DDTHH:MM"; sv-SE kasih spasi → ganti T, potong detik.
  const cookedAtLocal = new Date(data.cooked_at)
    .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
    .replace(" ", "T")
    .slice(0, 16);
  const releaseAtLocal = data.release_at
    ? new Date(data.release_at)
        .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
        .replace(" ", "T")
        .slice(0, 16)
    : "";

  return (
    <>
      <AppHeader
        title="Ubah Porsi"
        trail={[{ label: "Kantin", href: ROUTES.tenant }, { label: "Ubah Porsi" }]}
      />
      <SieraRailPage
        asideLabel="Cek sebelum posting"
        main={
          <div className="flex min-w-0 flex-col gap-6 lg:gap-7">
            <div id="tour-hero" className="flex flex-col gap-2">
              <p className="text-[13px] font-bold text-[#2E7D4F]">EDIT PORSI</p>
              <h1 className="text-3xl leading-[1.2] font-extrabold tracking-[-0.02em] text-[#1C2826]">
                {tenant.name}
              </h1>
              <p className="text-[15px] leading-normal text-[#64746B]">
                Sisa {data.quantity_remaining} dari {data.quantity_posted} porsi belum terpesan.
              </p>
            </div>
            <PortionForm
              tenantName={tenant.name}
              menus={menus}
              initial={{
                portionId: data.id,
                menuItemId: data.menu_item_id,
                quantity: data.quantity_posted,
                cookedAtLocal,
                sellWindowMinutes: data.sell_window_minutes ?? SELL_WINDOW_DEFAULT_MINUTES,
                releaseAtLocal,
                discountPrice: data.discount_price,
                normalPrice,
              }}
            />
          </div>
        }
        aside={
          <SieraSection id="cek-posting-heading" label="Tips posting">
            <SieraList>
              <SieraRowLink
                href={ROUTES.tenantMenu}
                icon={Lightbulb}
                title="Menu belum ada? Daftar dulu"
                subtitle="Harga normal tentukan saran diskon"
              />
            </SieraList>
            <p className="px-1 pt-2 text-[12px] leading-relaxed text-[#64746B]">
              Checklist hidup tampil di samping form: menu, jumlah, diskon, jam masak.
            </p>
          </SieraSection>
        }
      />
    </>
  );
}
