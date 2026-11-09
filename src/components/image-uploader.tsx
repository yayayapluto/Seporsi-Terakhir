"use client";

import { Camera, ImageOff, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { FormSheet } from "@/components/form-sheet";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { confirmUpload, createUploadUrl, removePhoto } from "@/lib/photo-actions";
import { BUCKET_BY_KIND, getPublicImageUrl, type PhotoKind } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const TARGET_BYTES = 400 * 1024;
const QUALITIES = [0.82, 0.74, 0.66, 0.58, 0.5];

function canvasDims(kind: PhotoKind): { w: number; h: number } {
  return kind === "menu_photo" ? { w: 1280, h: 720 } : { w: 512, h: 512 };
}

async function processToWebp(file: File, kind: PhotoKind): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file);
  const { w, h } = canvasDims(kind);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null;
  }
  const scale = Math.max(w / bitmap.width, h / bitmap.height);
  const dw = bitmap.width * scale;
  const dh = bitmap.height * scale;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, (w - dw) / 2, (h - dh) / 2, dw, dh);
  bitmap.close();

  for (const q of QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", q),
    );
    if (blob && blob.size <= TARGET_BYTES) return blob;
    if (blob && q === QUALITIES[QUALITIES.length - 1]) return blob;
  }
  return null;
}

/**
 * Unggah foto (avatar/logo menu) — satu alur untuk semua kind:
 * validasi → proses canvas WebP → signed upload → konfirmasi server.
 */
export function ImageUploader({
  kind,
  targetId,
  currentPath,
  shape,
  onChanged,
  avatarName,
}: {
  kind: PhotoKind;
  targetId: string;
  currentPath: string | null;
  shape: "circle" | "wide";
  onChanged?: (newPath: string | null) => void;
  /** Bila di-set, komponen tampil sebagai avatar 56px yang bisa di-tap (kartu identitas). */
  avatarName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [processed, setProcessed] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const bucket = BUCKET_BY_KIND[kind];
  const currentUrl = getPublicImageUrl(bucket, currentPath);

  function reset() {
    setPreview(null);
    setProcessed(null);
    setError(null);
    setBusy(false);
    setConfirmingDelete(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setError("Format foto harus JPG, PNG, atau WebP");
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setError("Foto terlalu besar (maks 10 MB)");
      return;
    }
    setBusy(true);
    try {
      const blob = await processToWebp(file, kind);
      if (!blob) {
        setError("Gagal mengunggah. Coba lagi.");
        return;
      }
      setPreview(URL.createObjectURL(blob));
      setProcessed(blob);
    } catch {
      setError("Gagal mengunggah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!processed) return;
    setBusy(true);
    setError(null);
    try {
      const up = await createUploadUrl({ kind, targetId });
      if (!up.ok) {
        setError(
          up.error === "Kamu tidak punya akses"
            ? "Kamu tidak punya akses"
            : "Gagal mengunggah. Coba lagi.",
        );
        return;
      }
      const client = createClient();
      const { error: upErr } = await client.storage
        .from(bucket)
        .uploadToSignedUrl(up.path, up.token, processed);
      if (upErr) {
        setError("Gagal mengunggah. Coba lagi.");
        return;
      }
      const conf = await confirmUpload({ kind, targetId, path: up.path });
      if (!conf.ok) {
        setError(conf.error);
        return;
      }
      toast.add({ type: "success", title: "Foto diperbarui" });
      onChanged?.(up.path);
      setOpen(false);
      reset();
    } finally {
      setBusy(false);
    }
  }

  async function hapus() {
    setBusy(true);
    setError(null);
    const res = await removePhoto({ kind, targetId });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.add({ type: "success", title: "Foto diperbarui" });
    onChanged?.(null);
    setOpen(false);
    reset();
  }

  const sheet = (
    <FormSheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
      title={confirmingDelete ? "Hapus foto?" : "Ubah foto"}
    >
      {confirmingDelete ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[#64746B]">Foto saat ini akan dihapus dari tampilan.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={busy}
              onClick={() => void hapus()}
            >
              {busy ? (
                <>
                  <Spinner />
                  Menghapus…
                </>
              ) : (
                "Hapus"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="foto-input">Pilih foto</Label>
            <Input
              id="foto-input"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <p className="text-xs text-[#64746B]">JPG, PNG, atau WebP. Maksimum 10 MB.</p>
          </div>
          {preview && (
            <Image
              src={preview}
              alt="Pratinjau foto"
              width={shape === "circle" ? 128 : 640}
              height={shape === "circle" ? 128 : 360}
              unoptimized
              className={
                shape === "circle"
                  ? "size-32 rounded-full object-cover"
                  : "aspect-video w-full rounded-xl object-cover"
              }
            />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={busy || !processed}
              onClick={() => void save()}
            >
              {busy ? (
                <>
                  <Spinner />
                  Mengunggah…
                </>
              ) : (
                "Simpan foto"
              )}
            </Button>
          </div>
        </div>
      )}
    </FormSheet>
  );

  if (avatarName != null) {
    const initials = avatarName
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <div className="flex min-h-11 min-w-11 shrink-0">
        <button
          type="button"
          aria-label="Ubah foto"
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
        >
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={`Foto profil ${avatarName}`}
              width={56}
              height={56}
              className="size-14 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-14 items-center justify-center rounded-full bg-[#DCEBE0] text-xl font-extrabold text-[#1E5A36]"
            >
              {initials || "•"}
            </span>
          )}
        </button>
        {sheet}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt="Foto"
            width={shape === "circle" ? 56 : 256}
            height={shape === "circle" ? 56 : 144}
            className={
              shape === "circle"
                ? "size-14 shrink-0 rounded-full object-cover"
                : "aspect-video w-full max-w-64 rounded-xl object-cover"
            }
          />
        ) : (
          <span
            aria-hidden
            className={
              shape === "circle"
                ? "flex size-14 shrink-0 items-center justify-center rounded-full bg-[#E9EFE9] text-[#64746B]"
                : "flex aspect-video w-full max-w-64 items-center justify-center rounded-xl bg-[#E9EFE9] text-[#64746B]"
            }
          >
            <ImageOff className="size-5" />
          </span>
        )}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => {
              reset();
              setOpen(true);
            }}
          >
            <Camera className="size-4" aria-hidden />
            Ubah foto
          </Button>
          {currentPath && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                reset();
                setConfirmingDelete(true);
                setOpen(true);
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              Hapus foto
            </Button>
          )}
        </div>
      </div>

      {sheet}
    </div>
  );
}
