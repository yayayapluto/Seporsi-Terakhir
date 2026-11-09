"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ACCEPT,
  ImageUploader,
  MAX_ORIGINAL_BYTES,
  processToWebp,
} from "@/components/image-uploader";
import { Photo } from "@/components/photo";
import { SaleConditions } from "@/components/sale-conditions";
import { SieraAlert, SieraList, SieraPhotoPicker, SieraSectionTitle } from "@/components/siera";
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
import { toast } from "@/components/ui/toast";
import { DISCOUNT_PRICE_RATIO_DEFAULT } from "@/lib/domain/constants";
import { suggestDiscountPrice } from "@/lib/domain/pricing";
import { formatIDR } from "@/lib/format";
import { publicMenuImageUrl } from "@/lib/menu-image";
import { confirmUpload, createUploadUrl } from "@/lib/photo-actions";
import { BUCKET_BY_KIND } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
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
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
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
    setGenerating(false);
    setGeneratedUrl(null);
    setPendingFile(null);
    setPendingPreview(null);
  }, [editing, reset]);

  // Bersihkan object URL pratinjau saat berganti atau unmount.
  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  function choosePending(file: File | null) {
    setFormError(null);
    if (!file) {
      setPendingFile(null);
      setPendingPreview(null);
      return;
    }
    if (!ACCEPT.includes(file.type)) {
      setPendingFile(null);
      setPendingPreview(null);
      setFormError("Format foto harus JPG, PNG, atau WebP");
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setPendingFile(null);
      setPendingPreview(null);
      setFormError("Foto terlalu besar (maks 10 MB)");
      return;
    }
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  }

  /** Unggah foto menu setelah baris menu dibuat; mengembalikan pesan galat atau null. */
  async function uploadPendingPhoto(menuId: string, file: File): Promise<string | null> {
    const blob = await processToWebp(file, "menu_photo");
    if (!blob) return "Foto gagal diproses.";
    const up = await createUploadUrl({
      kind: "menu_photo",
      targetId: menuId,
      originalBytes: file.size,
    });
    if (!up.ok) return up.error;
    const client = createClient();
    const { error: upErr } = await client.storage
      .from(BUCKET_BY_KIND.menu_photo)
      .uploadToSignedUrl(up.path, up.token, blob);
    if (upErr) return "Gagal mengunggah foto. Coba lagi.";
    const conf = await confirmUpload({ kind: "menu_photo", targetId: menuId, path: up.path });
    return conf.ok ? null : conf.error;
  }

  async function generateAi() {
    if (!editing) return;
    const name = watch("name").trim();
    if (!name) return;
    setGenerating(true);
    setFormError(null);
    setGeneratedUrl(null);
    try {
      const res = await fetch("/api/ai-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuName: name }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        url?: string;
        path?: string;
        provider?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.ok || !data.url) {
        setFormError(data?.error ?? "Gagal membuat gambar AI. Coba lagi.");
        return;
      }
      setGeneratedUrl(data.url);
      // Non-placeholder: konfirmasi path ke menu ini (path tersimpan = foto menu).
      if (data.provider !== "placeholder" && typeof data.path === "string") {
        const conf = await confirmUpload({
          kind: "menu_photo",
          targetId: editing.id,
          path: data.path,
        });
        if (conf.ok) {
          toast.add({ type: "success", title: "Foto menu diperbarui" });
          router.refresh();
        } else {
          setFormError(conf.error);
        }
      } else {
        toast.add({ type: "success", title: "Ilustrasi placeholder" });
      }
    } catch {
      setFormError("Gagal membuat gambar AI. Coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

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
    if (!editing && pendingFile) {
      const photoError = await uploadPendingPhoto(res.id, pendingFile);
      if (photoError) {
        toast.add({
          type: "error",
          title: "Menu tersimpan, foto gagal diunggah",
          description: photoError,
        });
      } else {
        toast.add({ type: "success", title: "Menu dan foto tersimpan" });
      }
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
              <SieraPhotoPicker
                inputId="menu-photo"
                photoPreview={pendingPreview}
                previewAlt="Pratinjau foto menu"
                onFile={choosePending}
                onRemove={() => choosePending(null)}
              />
            )}
            {editing && (
              <div className="flex flex-col gap-2">
                {generatedUrl && (
                  <Image
                    src={generatedUrl}
                    alt={`Ilustrasi AI ${watch("name") || "Menu"}`}
                    width={640}
                    height={480}
                    unoptimized
                    className="aspect-[4/3] w-full rounded-xl border border-line object-cover"
                  />
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  disabled={busy || generating || watch("name").trim() === ""}
                  onClick={() => void generateAi()}
                >
                  {generating ? (
                    <>
                      <Spinner />
                      Membuat…
                    </>
                  ) : (
                    "Buat gambar AI"
                  )}
                </Button>
              </div>
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
