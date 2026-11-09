"use client";

import { cn } from "cn";
import { ImageOff, Store } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { getPublicImageUrl } from "@/lib/storage";

/**
 * Foto dari Supabase Storage (public read-by-URL) dengan fallback placeholder:
 * - menu: placeholder "Foto menu" (seperti sebelumnya)
 * - initials: inisial nama (avatar)
 * - store: ikon toko (logo tenant)
 * Path kosong/rusak → placeholder yang sama, tanpa mengubah ukurannya.
 */
export function Photo({
  bucket,
  path,
  alt,
  className,
  sizes,
  priority = false,
  placeholder = "menu",
  initials,
}: {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  placeholder?: "menu" | "initials" | "store";
  initials?: string;
}) {
  const [broken, setBroken] = useState(false);
  const url = getPublicImageUrl(bucket, path);

  if (url && !broken) {
    return (
      <div className={cn("relative overflow-hidden bg-[#e9efe9]", className)}>
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="object-cover"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  if (placeholder === "initials") {
    return (
      <div
        aria-label={alt}
        role="img"
        className={cn(
          "flex items-center justify-center bg-[#e9efe9] font-bold text-[#64746B]",
          className,
        )}
      >
        <span aria-hidden>{initials ?? "?"}</span>
      </div>
    );
  }
  if (placeholder === "store") {
    return (
      <div
        aria-label={alt}
        role="img"
        className={cn("flex items-center justify-center bg-[#e9efe9] text-[#64746B]", className)}
      >
        <Store className="size-1/3" aria-hidden />
      </div>
    );
  }
  return (
    <div
      aria-label={alt}
      role="img"
      className={cn(
        "flex flex-col items-center justify-center bg-[#e9efe9] text-[#98928a]",
        className,
      )}
    >
      <ImageOff className="size-5" aria-hidden />
      <span className="px-1 text-center text-xs leading-tight font-semibold">Foto menu</span>
    </div>
  );
}
