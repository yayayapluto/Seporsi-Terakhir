"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { suggestDiscountPrice } from "@/lib/domain/pricing";
import { formatIDR } from "@/lib/format";
import { saveMenuItem } from "./actions";
import type { MenuItemRow } from "./page";

const schema = z.object({
  name: z.string().trim().min(1, "Nama menu wajib diisi."),
  normalPrice: z
    .string()
    .min(1, "Harga normal wajib diisi.")
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, "Harga normal harus lebih dari 0."),
  avgWeightGrams: z
    .string()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), "Berat harus lebih dari 0."),
  ingredients: z.string().trim().max(500, "Bahan maksimal 500 karakter."),
  allergenNote: z.string().trim().max(300, "Catatan alergen maksimal 300 karakter."),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  name: "",
  normalPrice: "",
  avgWeightGrams: "",
  ingredients: "",
  allergenNote: "",
  isActive: true,
};

function toValues(item: MenuItemRow | null): Values {
  if (!item) return EMPTY;
  return {
    name: item.name,
    normalPrice: String(item.normalPrice),
    avgWeightGrams: item.avgWeightGrams == null ? "" : String(item.avgWeightGrams),
    ingredients: item.ingredients ?? "",
    allergenNote: item.allergenNote ?? "",
    isActive: item.isActive,
  };
}

export function MenuManager({ items }: { items: MenuItemRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MenuItemRow | null>(null);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const normalPrice = Number(watch("normalPrice") || 0);
  const suggestion = normalPrice > 1 ? suggestDiscountPrice(normalPrice) : null;

  useEffect(() => {
    reset(toValues(editing));
    setFormError(null);
  }, [editing, reset]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(item: MenuItemRow) {
    setEditing(item);
    setOpen(true);
  }

  async function onSubmit(values: Values) {
    setFormError(null);
    const weight = values.avgWeightGrams === "" ? null : Number(values.avgWeightGrams);
    const res = await saveMenuItem({
      id: editing?.id ?? null,
      name: values.name,
      normalPrice: Number(values.normalPrice),
      avgWeightGrams: weight,
      isActive: values.isActive,
      ingredients: values.ingredients || undefined,
      allergenNote: values.allergenNote || undefined,
    });
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <output className="text-sm text-muted-foreground">{items.length} menu</output>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
        >
          + Tambah menu
        </button>
      </div>

      {items.length === 0 ? (
        <div className="border-b py-10 text-center">
          <p className="font-semibold">Belum ada menu</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan menu dulu sebelum memposting porsi sisa.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border-b">
          {items.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <h2 className="font-bold leading-snug">{m.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Harga normal {formatIDR(m.normalPrice)}
                  {m.avgWeightGrams ? ` · ±${m.avgWeightGrams} g/porsi` : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.isActive ? "Aktif" : "Nonaktif"}
                  {m.ingredients ? ` · Bahan: ${m.ingredients}` : " · Bahan belum dicantumkan"}
                  {m.allergenNote ? ` · Alergen: ${m.allergenNote}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(m)}
                className="inline-flex h-10 shrink-0 items-center rounded-lg border px-4 text-sm font-semibold transition-colors hover:bg-[#F3EFE6]"
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-dialog-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-popover p-5 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="menu-dialog-title" className="text-lg font-bold">
                {editing ? "Edit menu" : "Tambah menu"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-3">
              {formError && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {formError}
                </p>
              )}
              <div className="flex flex-col gap-1">
                <label htmlFor="menu-name" className="text-sm font-semibold">
                  Nama menu <span aria-hidden="true">*</span>
                </label>
                <input
                  id="menu-name"
                  type="text"
                  {...register("name")}
                  className="h-11 rounded-lg border bg-card px-3 text-sm"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="menu-price" className="text-sm font-semibold">
                  Harga normal (Rp) <span aria-hidden="true">*</span>
                </label>
                <input
                  id="menu-price"
                  type="text"
                  inputMode="numeric"
                  step={1}
                  {...register("normalPrice")}
                  className="h-11 rounded-lg border bg-card px-3 text-sm"
                />
                {errors.normalPrice && (
                  <p className="text-sm text-destructive">{errors.normalPrice.message}</p>
                )}
                {suggestion != null && (
                  <p className="text-xs text-muted-foreground">
                    Rekomendasi diskon 45% saat posting: <strong>{formatIDR(suggestion)}</strong>.
                    Diskon final ditentukan saat posting porsi.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="menu-weight" className="text-sm font-semibold">
                  Berat rata-rata (gram){" "}
                  <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <input
                  id="menu-weight"
                  type="text"
                  inputMode="numeric"
                  {...register("avgWeightGrams")}
                  className="h-11 rounded-lg border bg-card px-3 text-sm"
                />
                {errors.avgWeightGrams && (
                  <p className="text-sm text-destructive">{errors.avgWeightGrams.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Dipakai untuk estimasi sampah makanan dicegah.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="menu-ingredients" className="text-sm font-semibold">
                  Bahan <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <input
                  id="menu-ingredients"
                  type="text"
                  placeholder="Misal: nasi, ayam bumbu bali, sambal"
                  {...register("ingredients")}
                  className="h-11 rounded-lg border bg-card px-3 text-sm"
                />
                {errors.ingredients && (
                  <p className="text-sm text-destructive">{errors.ingredients.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="menu-allergen" className="text-sm font-semibold">
                  Catatan alergen{" "}
                  <span className="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <input
                  id="menu-allergen"
                  type="text"
                  placeholder="Misal: mengandung kacang, telur"
                  {...register("allergenNote")}
                  className="h-11 rounded-lg border bg-card px-3 text-sm"
                />
                {errors.allergenNote && (
                  <p className="text-sm text-destructive">{errors.allergenNote.message}</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" {...register("isActive")} className="size-4 rounded" />
                Menu aktif (tampil di pemilih posting porsi)
              </label>
              <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold transition-colors hover:bg-[#F3EFE6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#256640] disabled:opacity-70"
                >
                  {isSubmitting ? "Menyimpan…" : "Simpan menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
