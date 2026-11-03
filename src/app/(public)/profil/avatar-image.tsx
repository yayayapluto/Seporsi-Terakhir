"use client";

import Image from "next/image";
import { useState } from "react";
import { publicAvatarUrl } from "@/lib/avatar-image";

/** Foto avatar dengan fallback inisial bila file hilang/rusak. */
export function AvatarImage({ avatarPath, fullName }: { avatarPath: string; fullName: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
    return (
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#DCEBE0] text-base font-extrabold text-[#1E5A36]"
      >
        {initials || "•"}
      </span>
    );
  }
  return (
    <Image
      src={publicAvatarUrl(avatarPath)}
      alt={`Foto profil ${fullName}`}
      width={48}
      height={48}
      className="size-12 shrink-0 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
