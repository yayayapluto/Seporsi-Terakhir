/**
 * Helper foto (client-safe): URL publik + pemetaan kind→bucket + bentuk path.
 * Otorisasi server ada di lib/photo-actions.ts.
 *
 * Path objek (tanpa awalan bucket):
 * - avatar:      {userId}/{random}.webp
 * - tenant_logo: {tenantId}/{random}.webp
 * - menu_photo:  {tenantId}/{menuId}/{random}.webp
 */
export type PhotoKind = "avatar" | "tenant_logo" | "menu_photo";

export const BUCKET_BY_KIND: Record<PhotoKind, string> = {
  avatar: "avatars",
  tenant_logo: "tenant-logos",
  menu_photo: "menu-photos",
};

export const MAX_OBJECT_BYTES = 512 * 1024; // 512 KB (sesuai bucket)

export function getPublicImageUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path || path.trim() === "") return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const RANDOM = "[A-Za-z0-9-]+";

/** Validasi bentuk path untuk kind tertentu (kepemilikan dicek di server action). */
export function isValidPhotoPath(kind: PhotoKind, path: string): boolean {
  if (kind === "menu_photo") return new RegExp(`^${UUID}/${UUID}/${RANDOM}\\.webp$`).test(path);
  return new RegExp(`^${UUID}/${RANDOM}\\.webp$`).test(path);
}
