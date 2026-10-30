"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/** Foto porsi dengan fallback placeholder bila file storage hilang/rusak. */
export function PortionImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 self-start rounded-[20px] border border-[#E8ECE9] bg-[#F4EFE6] text-[#64746B]"
        role="img"
        aria-label={`${alt} belum tersedia`}
      >
        <ImageOff className="size-8" aria-hidden />
        <span className="px-1 text-center text-xs leading-tight">Foto porsi belum tersedia</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      onError={() => setFailed(true)}
      className="aspect-[4/3] w-full self-start rounded-[20px] border border-[#E8ECE9] object-cover"
      sizes="(max-width: 1024px) 100vw, 50vw"
    />
  );
}
