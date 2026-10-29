"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DateField } from "@/components/date-field";
import { Spinner } from "@/components/spinner";
import { TimeField } from "@/components/time-field";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SELL_WINDOW_DEFAULT_MINUTES,
  SELL_WINDOW_MAX_MINUTES,
  SELL_WINDOW_MIN_MINUTES,
} from "@/lib/domain/constants";
import { suggestDiscountPrice } from "@/lib/domain/pricing";
import { formatIDR } from "@/lib/format";
import { postPortion, updatePortion } from "./actions";
export interface PortionFormMenu {
  id: string;
  name: string;
  normalPrice: number;
  isActive?: boolean;
}

export interface PortionFormValues {
  portionId?: string;
  menuItemId: string;
  quantity: number;
  cookedAtLocal: string;
  sellWindowMinutes: number;
  releaseAtLocal: string;
  discountPrice: number;
  normalPrice: number;
}

export interface PortionYesterday {
  menuItemId: string;
  quantity: number;
  sellWindowMinutes: number;
  discountPrice: number;
}

const schema = z.object({
  menuItemId: z.string().min(1, "Pilih menu dulu."),
  quantity: z
    .string()
    .min(1, "Jumlah wajib diisi.")
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, "Jumlah harus lebih dari 0."),
  cookedAtLocal: z.string().min(1, "Jam masak wajib diisi."),
  sellWindowMinutes: z
    .string()
    .refine(
      (v) => Number(v) >= SELL_WINDOW_MIN_MINUTES && Number(v) <= SELL_WINDOW_MAX_MINUTES,
      `Jendela jual harus ${SELL_WINDOW_MIN_MINUTES}–${SELL_WINDOW_MAX_MINUTES} menit.`,
    ),
  releaseAtLocal: z.string(),
  discountPrice: z
    .string()
    .min(1, "Harga diskon wajib diisi.")
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, "Harga diskon harus lebih dari 0."),
});

const DRAFT_KEY = "porsi-baru-draft";

const MONTH = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-10-29T14:30" -> "29 Okt 14:30" (WIB, tanpa lib tanggal). */
function formatCookedShort(local: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return local.replace("T", " ");
  const [, , mo, d, h, mi] = m;
  return `${Number(d)} ${MONTH[Number(mo) - 1] ?? mo} ${h}:${mi}`;
}

/** Server Action dipanggil dari client form (default export tidak dipakai). */
export function PortionForm({
  menus,
  initial,
  yesterday,
  tenantName,
}: {
  menus: PortionFormMenu[];
  initial: PortionFormValues;
  yesterday?: PortionYesterday | null;
  tenantName?: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  // Saran terakhir yg ditulis otomatis; ketikan manual tak pernah ditimpa.
  const lastSuggested = useRef<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      menuItemId: initial.menuItemId,
      quantity: initial.quantity > 0 ? String(initial.quantity) : "",
      cookedAtLocal: initial.cookedAtLocal,
      sellWindowMinutes: String(initial.sellWindowMinutes),
      releaseAtLocal: initial.releaseAtLocal,
      discountPrice: initial.discountPrice > 0 ? String(initial.discountPrice) : "",
    },
  });
  // Draf lokal: pulihkan sekali saat mount (menu masih ada), simpan tiap berubah.
  const isNew = initial.portionId == null;
  const didRestore = useRef(false);
  const allValues = watch();
  // Hari-ini dari prop server (initial.cookedAtLocal) — sama persis SSR vs hydrate.
  // Jangan new Date() di render: server jam T0 vs client T1 = hydration mismatch.
  const [todayStr] = useState(() => initial.cookedAtLocal.slice(0, 10));
  useEffect(() => {
    if (!isNew) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = schema.safeParse(JSON.parse(raw));
        if (parsed.success && menus.some((m) => m.id === parsed.data.menuItemId)) {
          const cookedValid = parsed.data.cookedAtLocal >= `${todayStr}T00:00`;
          reset(
            cookedValid
              ? parsed.data
              : { ...parsed.data, cookedAtLocal: initial.cookedAtLocal, releaseAtLocal: "" },
          );
          setDraftRestored(true);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {
      // draf rusak → abaikan, pakai bawaan
    }
    didRestore.current = true;
  }, [isNew, menus, reset, todayStr, initial.cookedAtLocal]);
  useEffect(() => {
    if (!isNew || !didRestore.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(allValues));
    } catch {
      // mode privat/penuh → abaikan
    }
  }, [allValues, isNew]);

  const selectedId = watch("menuItemId");
  const selected = useMemo(
    () => menus.find((m) => m.id === selectedId) ?? null,
    [menus, selectedId],
  );
  const discountPrice = Number(watch("discountPrice") || 0);
  const quantity = Number(watch("quantity") || 0);
  const cookedAtLocal = watch("cookedAtLocal");
  const sellWindowMinutes = Number(watch("sellWindowMinutes") || 0);

  const total = discountPrice * quantity;
  const invalidDiscount =
    selected != null && discountPrice >= selected.normalPrice
      ? "Harga diskon harus di bawah harga normal."
      : null;

  const suggested = selected ? (suggestDiscountPrice(selected.normalPrice) ?? 0) : 0;

  // Habis ±pukul X: jam masak + jendela (parse WIB, tampil jam saja).
  const endsAt = useMemo(() => {
    if (!cookedAtLocal || !sellWindowMinutes) return null;
    const d = new Date(`${cookedAtLocal}:00+07:00`);
    if (Number.isNaN(d.getTime())) return null;
    const end = new Date(d.getTime() + sellWindowMinutes * 60_000);
    return end.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [cookedAtLocal, sellWindowMinutes]);

  const cookedTime = useMemo(() => cookedAtLocal.slice(11, 16) || "12:00", [cookedAtLocal]);

  function setCooked(datePart: string, timePart: string) {
    setValue("cookedAtLocal", `${datePart}T${timePart}`, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function suggestFor(menuId: string, currentDiscount: string) {
    const m = menus.find((x) => x.id === menuId);
    if (!m) return;
    const s = suggestDiscountPrice(m.normalPrice);
    if (s == null) return;
    // Isi saran hanya bila kosong atau masih bernilai saran lama — ketikan manual aman.
    if (currentDiscount === "" || currentDiscount === lastSuggested.current) {
      lastSuggested.current = String(s);
      setValue("discountPrice", String(s), { shouldDirty: true });
    }
  }

  function applyYesterday() {
    if (!yesterday) return;
    setValue("menuItemId", yesterday.menuItemId, { shouldDirty: true, shouldValidate: true });
    setValue("quantity", String(yesterday.quantity), { shouldDirty: true, shouldValidate: true });
    setValue("sellWindowMinutes", String(yesterday.sellWindowMinutes), {
      shouldDirty: true,
      shouldValidate: true,
    });
    lastSuggested.current = String(yesterday.discountPrice);
    setValue("discountPrice", String(yesterday.discountPrice), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // abaikan
    }
    setDraftRestored(false);
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    if (invalidDiscount) return;
    setFormError(null);
    const payload = {
      ...(initial.portionId ? { portionId: initial.portionId } : {}),
      menuItemId: values.menuItemId,
      quantity: Number(values.quantity),
      cookedAtLocal: values.cookedAtLocal,
      sellWindowMinutes: Number(values.sellWindowMinutes),
      releaseAtLocal: values.releaseAtLocal || undefined,
      discountPrice: Number(values.discountPrice),
    };
    const res = initial.portionId ? await updatePortion(payload) : await postPortion(payload);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    clearDraft();
    router.push("/tenant");
    router.refresh();
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex min-w-0 flex-col gap-6">
        {formError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </p>
        )}
        {draftRestored && isNew && (
          <p className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-input px-4 py-2 text-sm text-muted-foreground">
            Draf terakhir dipulihkan.
            <button type="button" className="underline" onClick={clearDraft}>
              Buang draf
            </button>
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="portion-menu" className="font-semibold">
            Menu
          </Label>
          <Select
            items={Object.fromEntries(
              menus.map((m) => [m.id, `${m.name} — ${formatIDR(m.normalPrice)}`]),
            )}
            value={selectedId || ""}
            onValueChange={(v) => {
              if (v == null) return;
              const id = String(v);
              setValue("menuItemId", id, { shouldDirty: true, shouldValidate: true });
              suggestFor(id, watch("discountPrice"));
            }}
          >
            <SelectTrigger id="portion-menu" className="h-11 w-full">
              <SelectValue placeholder="Pilih menu" />
            </SelectTrigger>
            <SelectContent>
              {menus.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} — {formatIDR(m.normalPrice)}
                  {m.isActive === false ? " (menu nonaktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.menuItemId && (
            <p className="text-sm text-destructive">{errors.menuItemId.message}</p>
          )}
          {menus.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Belum ada menu. Tambahkan menu dulu di halaman Menu.
            </p>
          )}
          {isNew && yesterday && menus.some((m) => m.id === yesterday.menuItemId) && (
            <button
              type="button"
              className="min-h-11 self-start text-sm text-muted-foreground underline"
              onClick={applyYesterday}
            >
              Pakai postingan terakhir
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="portion-qty" className="font-semibold">
            Jumlah porsi
          </Label>
          <Input id="portion-qty" type="text" inputMode="numeric" {...register("quantity")} />
          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
        </div>

        <fieldset className="flex flex-col gap-2 border-0 p-0">
          <legend className="p-0 font-semibold">Jam masak</legend>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
            <DateField
              id="portion-cooked-date"
              label="Tanggal masak"
              value={cookedAtLocal.slice(0, 10)}
              max={todayStr}
              onChange={(v) => setCooked(v || todayStr, cookedAtLocal.slice(11, 16) || "12:00")}
            />
            <TimeField
              id="portion-cooked-time"
              label="Jam"
              value={cookedTime}
              onChange={(t) => {
                const m = /^(\d{4}-\d{2}-\d{2})/.exec(cookedAtLocal);
                const part = m != null ? m[1] : todayStr;
                setCooked(part ?? todayStr, t);
              }}
            />
          </div>
          <input type="hidden" {...register("cookedAtLocal")} />
          {errors.cookedAtLocal && (
            <p className="text-sm text-destructive">{errors.cookedAtLocal.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Tanggal + jam kapan masakan matang, mis. hari ini {cookedTime} WIB.
          </p>
        </fieldset>
        <div className="flex flex-col gap-2">
          <Label htmlFor="portion-discount" className="font-semibold">
            Harga diskon (Rp)
          </Label>
          <Input
            id="portion-discount"
            type="text"
            inputMode="numeric"
            {...register("discountPrice")}
            aria-invalid={invalidDiscount ? true : undefined}
            aria-describedby={selected ? "discount-hint" : undefined}
          />
          {errors.discountPrice && (
            <p className="text-sm text-destructive">{errors.discountPrice.message}</p>
          )}
          {invalidDiscount ? (
            <p className="text-sm text-destructive">{invalidDiscount}</p>
          ) : (
            selected != null && (
              <p id="discount-hint" className="text-xs text-muted-foreground" aria-live="polite">
                Saran 45% dari {selected != null ? formatIDR(selected.normalPrice) : "–"}:{" "}
                <strong>{formatIDR(suggested)}</strong> — boleh disesuaikan, wajib di bawah harga
                normal.
              </p>
            )
          )}
        </div>

        <Accordion className="rounded-md border border-input px-4">
          <AccordionItem value="lanjutan">
            <AccordionTrigger className="min-h-11 py-3 text-sm font-semibold">
              Lanjutan (jendela jual, jadwal tampil)
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="portion-window" className="font-semibold">
                  Jendela jual (menit setelah jam masak)
                </Label>
                <Select
                  value={watch("sellWindowMinutes")}
                  onValueChange={(v) => {
                    if (v == null) return;
                    setValue("sellWindowMinutes", String(v), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  <SelectTrigger id="portion-window" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: (SELL_WINDOW_MAX_MINUTES - SELL_WINDOW_MIN_MINUTES) / 30 + 1 },
                      (_, i) => SELL_WINDOW_MIN_MINUTES + i * 30,
                    ).map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m} menit{m === SELL_WINDOW_DEFAULT_MINUTES ? " (disarankan)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sellWindowMinutes && (
                  <p className="text-sm text-destructive">{errors.sellWindowMinutes.message}</p>
                )}
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  {endsAt
                    ? `Porsi hilang dari katalog sekitar pukul ${endsAt} WIB.`
                    : "Porsi otomatis kedaluwarsa dan hilang dari katalog setelah jendela ini."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="portion-release" className="font-semibold">
                  Jadwal tampil{" "}
                  <span className="font-normal text-muted-foreground">(opsional)</span>
                </Label>
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <DateField
                    id="portion-release-date"
                    label="Tanggal tampil"
                    value={watch("releaseAtLocal").slice(0, 10)}
                    min={todayStr}
                    onChange={(v) => {
                      const cur = watch("releaseAtLocal");
                      const t = cur.slice(11, 16) || "12:00";
                      setValue("releaseAtLocal", v ? `${v}T${t}` : "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                  <TimeField
                    id="portion-release-time"
                    label="Jam"
                    value={watch("releaseAtLocal").slice(11, 16)}
                    allowClear
                    onChange={(t) => {
                      if (!t) {
                        setValue("releaseAtLocal", "", { shouldDirty: true, shouldValidate: true });
                        return;
                      }
                      const cur = watch("releaseAtLocal");
                      const d = cur.slice(0, 10);
                      setValue("releaseAtLocal", `${d || todayStr}T${t}`, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                </div>
                {errors.releaseAtLocal && (
                  <p className="text-sm text-destructive">{errors.releaseAtLocal.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Kosongkan untuk langsung tampil di katalog setelah disimpan.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="text-xs text-muted-foreground">Semua kolom wajib kecuali jadwal tampil.</p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/tenant"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-input px-4 text-sm font-medium"
          >
            Kembali ke dasbor
          </Link>
          <Button type="submit" disabled={isSubmitting || menus.length === 0 || !!invalidDiscount}>
            {isSubmitting ? (
              <>
                <Spinner />
                Menyimpan…
              </>
            ) : initial.portionId ? (
              "Simpan perubahan"
            ) : (
              "Posting porsi"
            )}
          </Button>
        </div>
      </form>
      <aside aria-label="Pratinjau katalog" className="min-w-0 md:sticky md:top-20">
        <p className="text-xs font-bold tracking-widest text-primary">PRATINJAU</p>
        <div className="mt-2 flex flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
            <ImageOff className="size-8" aria-hidden />
            <span className="text-xs">tidak ada gambar</span>
          </div>
          <div className="flex flex-1 flex-col gap-1 p-3">
            <p className="line-clamp-2 min-h-10 break-words text-[15px] font-bold leading-snug">
              {selected != null ? selected.name : "Pilih menu dulu"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {selected != null
                ? `${tenantName ? `${tenantName} · ` : ""}Dimasak ${cookedAtLocal ? formatCookedShort(cookedAtLocal) : "–"}${quantity > 0 ? ` · Sisa ${quantity}` : ""}`
                : "Nama tenant · jam masak · sisa tampil di sini"}
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-sm">
              <s className="text-[11px] text-muted-foreground">
                {selected != null ? formatIDR(selected.normalPrice) : "–"}
              </s>
              <strong className="text-base">
                {discountPrice > 0 ? formatIDR(discountPrice) : "–"}
              </strong>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {total > 0
                ? `Potensi ${formatIDR(total)} — bayar di tempat, tanpa biaya platform.`
                : endsAt
                  ? `Hilang dari katalog sekitar pukul ${endsAt} WIB.`
                  : "Isi harga untuk melihat potensi penerimaan."}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
