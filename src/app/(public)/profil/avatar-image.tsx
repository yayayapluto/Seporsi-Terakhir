"use client";

import { Avatar, AvatarFallback, AvatarImage as AvatarImg } from "@/components/ui/avatar";
import { publicAvatarUrl } from "@/lib/avatar-image";

/** Foto avatar di atas primitif shadcn Avatar; fallback inisial bila file hilang/rusak. */
export function AvatarImage({ avatarPath, fullName }: { avatarPath: string; fullName: string }) {
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <Avatar className="size-12 bg-[#DCEBE0] text-base font-extrabold text-[#1E5A36]">
      <AvatarImg src={publicAvatarUrl(avatarPath)} alt={`Foto profil ${fullName}`} />
      <AvatarFallback className="bg-[#DCEBE0] text-base font-extrabold text-[#1E5A36]">
        <span aria-hidden>{initials || "•"}</span>
      </AvatarFallback>
    </Avatar>
  );
}
