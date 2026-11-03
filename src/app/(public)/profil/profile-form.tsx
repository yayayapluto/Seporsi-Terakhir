"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { SieraAlert } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicAvatarUrl } from "@/lib/avatar-image";
import { createClient } from "@/lib/supabase/client";
import { saveMyAvatar, saveMyProfile } from "./actions";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

/** Form edit nama + avatar pengguna. Avatar via bucket `avatars`, tri-state. */
export function MyProfileForm({
  initialName,
  initialAvatarPath,
  userId,
}: {
  initialName: string;
  initialAvatarPath: string | null;
  userId: string;
}) {
  const [name, setName] = useState(initialName);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialAvatarPath ? publicAvatarUrl(initialAvatarPath) : null,
  );
  const [removePhoto, setRemovePhoto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const objectUrl = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function onPhotoChange(file: File | null) {
    setError(null);
    if (!file) {
      setPhotoFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Foto harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Foto maksimal 2 MB.");
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setPhotoPreview(objectUrl.current);
    setPhotoFile(file);
    setRemovePhoto(false);
  }

  /** Upload ke storage; null = pertahankan, "" = hapus, undefined = gagal. */
  async function resolveAvatarPath(): Promise<string | null | undefined> {
    if (removePhoto) return "";
    if (!photoFile) return null;
    setUploading(true);
    try {
      const ext =
        photoFile.type === "image/png" ? "png" : photoFile.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/avatar.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, photoFile, { contentType: photoFile.type, upsert: true });
      if (error) {
        setError("Gagal mengunggah foto. Coba lagi.");
        return undefined;
      }
      return path;
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const avatarPath = await resolveAvatarPath();
      if (avatarPath === undefined) return;
      const res = await saveMyProfile({ fullName: name });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const avatarRes = await saveMyAvatar({ avatarPath });
      if (!avatarRes.ok) setError(avatarRes.error);
      else {
        setSaved(true);
        setPhotoFile(null);
        setRemovePhoto(false);
      }
    });
  }

  const busy = pending || uploading;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      {saved && <SieraAlert variant="success">Tersimpan. Profilmu sudah diperbarui.</SieraAlert>}
      <div className="flex items-center gap-3">
        {photoPreview ? (
          <Image
            src={photoPreview}
            alt="Pratinjau foto profil"
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground"
          >
            Tanpa foto
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            id="my-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="h-11"
            onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
          />
          {photoPreview && (
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setPhotoFile(null);
                setPhotoPreview(null);
                setRemovePhoto(initialAvatarPath != null);
                if (objectUrl.current) {
                  URL.revokeObjectURL(objectUrl.current);
                  objectUrl.current = null;
                }
              }}
              className="min-h-11 self-start px-0 text-sm"
            >
              Hapus foto
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">JPG/PNG/WebP, maksimal 2 MB.</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="my-name">Nama tampilan</Label>
        <Input
          id="my-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          className="min-h-11"
          autoComplete="name"
        />
      </div>
      <Button type="submit" disabled={busy} className="min-h-11 w-full">
        {busy ? (
          <>
            <Spinner />
            {uploading ? "Mengunggah…" : "Menyimpan…"}
          </>
        ) : (
          "Simpan profil"
        )}
      </Button>
    </form>
  );
}
