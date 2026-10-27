"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

/** Server Action dipanggil dari client form (default export tidak dipakai). */
export function PortionForm({
  menus,
  initial,
}: {
  menus: PortionFormMenu[];
  initial: PortionFormValues;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const selectedId = watch("menuItemId");
  const selected = useMemo(
    () => menus.find((m) => m.id === selectedId) ?? null,
    [menus, selectedId],
  );
  const discountPrice = Number(watch("discountPrice") || 0);
  const quantity = Number(watch("quantity") || 0);

  const total = discountPrice * quantity;
  const invalidDiscount =
    selected != null && discountPrice >= selected.normalPrice
      ? "Harga diskon harus di bawah harga normal."
      : null;

  async function onSubmit(values: z.infer<typeof schema>) {
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
    router.push("/tenant");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {formError}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="portion-menu" className="text-sm font-semibold">
          Menu <span aria-hidden="true">*</span>
        </label>
        <select
          id="portion-menu"
          {...register("menuItemId", {
            onChange: (e) => {
              const m = menus.find((x) => x.id === e.target.value);
              if (m) {
                const s = suggestDiscountPrice(m.normalPrice);
                if (s != null) setValue("discountPrice", String(s));
              }
            },
          })}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
        >
          <option value="">Pilih menu</option>
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {formatIDR(m.normalPrice)}
            </option>
          ))}
        </select>
        {errors.menuItemId && (
          <p className="text-sm text-destructive">{errors.menuItemId.message}</p>
        )}
        {menus.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Belum ada menu. Tambahkan menu dulu di halaman Menu.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="portion-qty" className="text-sm font-semibold">
          Jumlah porsi <span aria-hidden="true">*</span>
        </label>
        <input
          id="portion-qty"
          type="text"
          inputMode="numeric"
          {...register("quantity")}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
        />
        {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="portion-cooked" className="text-sm font-semibold">
          Jam masak <span aria-hidden="true">*</span>
        </label>
        <input
          id="portion-cooked"
          type="datetime-local"
          {...register("cookedAtLocal")}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
        />
        {errors.cookedAtLocal && (
          <p className="text-sm text-destructive">{errors.cookedAtLocal.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="portion-window" className="text-sm font-semibold">
          Jendela jual (menit setelah jam masak) <span aria-hidden="true">*</span>
        </label>
        <select
          id="portion-window"
          {...register("sellWindowMinutes")}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
        >
          {Array.from(
            { length: (SELL_WINDOW_MAX_MINUTES - SELL_WINDOW_MIN_MINUTES) / 30 + 1 },
            (_, i) => SELL_WINDOW_MIN_MINUTES + i * 30,
          ).map((m) => (
            <option key={m} value={m}>
              {m} menit{m === SELL_WINDOW_DEFAULT_MINUTES ? " (disarankan)" : ""}
            </option>
          ))}
        </select>
        {errors.sellWindowMinutes && (
          <p className="text-sm text-destructive">{errors.sellWindowMinutes.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Porsi otomatis kedaluwarsa dan hilang dari katalog setelah jendela ini.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="portion-release" className="text-sm font-semibold">
          Jam mulai jual <span className="font-normal text-muted-foreground">(opsional)</span>
        </label>
        <input
          id="portion-release"
          type="datetime-local"
          {...register("releaseAtLocal")}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
        />
        {errors.releaseAtLocal && (
          <p className="text-sm text-destructive">{errors.releaseAtLocal.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Kosongkan untuk langsung tampil di katalog setelah disimpan.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="portion-discount" className="text-sm font-semibold">
          Harga diskon (Rp) <span aria-hidden="true">*</span>
        </label>
        <input
          id="portion-discount"
          type="text"
          inputMode="numeric"
          {...register("discountPrice")}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
          aria-invalid={invalidDiscount ? true : undefined}
        />
        {errors.discountPrice && (
          <p className="text-sm text-destructive">{errors.discountPrice.message}</p>
        )}
        {invalidDiscount ? (
          <p className="text-sm text-destructive">{invalidDiscount}</p>
        ) : (
          selected != null && (
            <p className="text-xs text-muted-foreground">
              Rekomendasi 45% dari {formatIDR(selected.normalPrice)}:{" "}
              <strong>{formatIDR(suggestDiscountPrice(selected.normalPrice) ?? 0)}</strong> — boleh
              disesuaikan, wajib di bawah harga normal.
            </p>
          )
        )}
      </div>

      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          Potensi nilai transaksi: <strong className="text-foreground">{formatIDR(total)}</strong>
          {quantity > 1 ? ` (${quantity} porsi)` : ""} — bayar di tempat, tanpa biaya platform.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-11 items-center rounded-lg border px-4 text-sm font-semibold transition-colors hover:bg-[#F3EFE6]"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting || menus.length === 0}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640] disabled:opacity-70"
        >
          {isSubmitting ? "Menyimpan…" : initial.portionId ? "Simpan perubahan" : "Posting porsi"}
        </button>
      </div>
    </form>
  );
}
