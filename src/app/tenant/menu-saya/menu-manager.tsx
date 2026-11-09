"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUploader } from "@/components/image-uploader";
import { Photo } from "@/components/photo";
import { SaleConditions } from "@/components/sale-conditions";
import { SieraAlert, SieraList, SieraSectionTitle } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DISCOUNT_PRICE_RATIO_DEFAULT } from "@/lib/domain/constants";
import { suggestDiscountPrice } from "@/lib/domain/pricing";
import { formatIDR } from "@/lib/format";
import { publicMenuImageUrl } from "@/lib/menu-image";
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const normalPrice = Number(watch("normalPrice") || 0);
  const suggestion = normalPrice > 1 ? suggestDiscountPrice(normalPrice) : null;

  const isActive = watch("isActive");

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
    // imagePath legacy tidak dipakai — foto baru lewat ImageUploader (photo_path).
    const res = await saveMenuItem({
      id: editing?.id ?? null,
      name: values.name,
      normalPrice: Number(values.normalPrice),
      avgWeightGrams: weight,
      isActive: values.isActive,
      ingredients: values.ingredients || undefined,
      allergenNote: values.allergenNote || undefined,
      imagePath: null,
    });
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const busy = isSubmitting;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SieraSectionTitle>
          Menu terdaftar{items.length > 0 ? ` (${items.length})` : ""}
        </SieraSectionTitle>
        <Button type="button" data-tour="tambah-menu" className="min-h-11" onClick={openNew}>
          + Tambah menu
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-line bg-white p-6 text-center">
          <p className="font-semibold">Belum ada menu</p>
          <p className="-mt-2 text-sm text-[#64746B]">
            Tambahkan menu dulu sebelum memposting porsi sisa.
          </p>
          <Button type="button" variant="outline" className="min-h-11" onClick={openNew}>
            + Tambah menu pertama
          </Button>
        </div>
      ) : (
        <SieraList data-tour="menu-list">
          {items.map((m) => (
            <li
              key={m.id}
              className="flex min-h-16 flex-col justify-center gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
            >
              {m.photoPath ? (
                <Photo
                  bucket="menu-photos"
                  path={m.photoPath}
                  alt={`Foto ${m.name}`}
                  sizes="64px"
                  className="size-16 shrink-0 rounded-lg"
                />
              ) : m.imagePath ? (
                <Image
                  src={publicMenuImageUrl(m.imagePath)}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground"
                >
                  Tanpa foto
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-bold leading-snug max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                  {m.name}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Harga normal {formatIDR(m.normalPrice)}
                  {m.avgWeightGrams ? ` · ±${m.avgWeightGrams} g/porsi` : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.isActive ? "Aktif" : "Nonaktif"}
                  {m.ingredients ? ` · Bahan: ${m.ingredients}` : " · Bahan belum dicantumkan"}
                  {m.allergenNote ? ` · Alergen: ${m.allergenNote}` : ""}
                </p>
                <SaleConditions conditions={m.saleConditions} className="mt-1.5" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() => openEdit(m)}
              >
                Edit
              </Button>
            </li>
          ))}
        </SieraList>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit menu" : "Tambah menu"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError && <SieraAlert variant="error">{formError}</SieraAlert>}
            {editing ? (
              <ImageUploader
                kind="menu_photo"
                targetId={editing.id}
                currentPath={editing.photoPath}
                shape="wide"
                onChanged={() => router.refresh()}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                Simpan menu dulu, lalu tambah foto lewat Edit menu.
              </p>
            )}
            <div className="flex flex-col gap-1">
              <Label htmlFor="menu-name" className="font-semibold">
                Nama menu <span aria-hidden="true">*</span>
              </Label>
              <Input id="menu-name" type="text" className="h-11" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="menu-price" className="font-semibold">
                Harga normal (Rp) <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="menu-price"
                type="text"
                inputMode="numeric"
                step={1}
                className="h-11"
                {...register("normalPrice")}
              />
              {errors.normalPrice && (
                <p className="text-sm text-destructive">{errors.normalPrice.message}</p>
              )}
              {suggestion != null && (
                <p className="text-xs text-muted-foreground">
                  Rekomendasi diskon {Math.round(DISCOUNT_PRICE_RATIO_DEFAULT * 100)}% saat posting:{" "}
                  <strong>{formatIDR(suggestion)}</strong>. Diskon final ditentukan saat posting
                  porsi.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="menu-weight" className="font-semibold">
                Berat rata-rata (gram){" "}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="menu-weight"
                type="text"
                inputMode="numeric"
                className="h-11"
                {...register("avgWeightGrams")}
              />
              {errors.avgWeightGrams && (
                <p className="text-sm text-destructive">{errors.avgWeightGrams.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Dipakai untuk estimasi sampah makanan dicegah.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="menu-ingredients" className="font-semibold">
                Bahan <span className="font-normal text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="menu-ingredients"
                type="text"
                placeholder="Misal: nasi, ayam bumbu bali, sambal"
                className="h-11"
                {...register("ingredients")}
              />
              {errors.ingredients && (
                <p className="text-sm text-destructive">{errors.ingredients.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="menu-allergen" className="font-semibold">
                Catatan alergen{" "}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="menu-allergen"
                type="text"
                placeholder="Misal: mengandung kacang, telur"
                className="h-11"
                {...register("allergenNote")}
              />
              {errors.allergenNote && (
                <p className="text-sm text-destructive">{errors.allergenNote.message}</p>
              )}
            </div>
            <Label htmlFor="menu-active">
              <Checkbox
                id="menu-active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked === true)}
              />
              Menu aktif (tampil di pemilih posting porsi)
            </Label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="min-h-11" disabled={busy}>
                {busy ? (
                  <>
                    <Spinner />
                    Menyimpan…
                  </>
                ) : (
                  "Simpan menu"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
