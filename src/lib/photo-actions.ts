"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { BUCKET_BY_KIND, isValidPhotoPath, MAX_OBJECT_BYTES, type PhotoKind } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const InputSchema = z.object({
  kind: z.enum(["avatar", "tenant_logo", "menu_photo"]),
  targetId: z.string().uuid(),
});

const ConfirmSchema = InputSchema.extend({
  path: z.string().min(1),
});

type Authed =
  | { ok: true; userId: string; tenantId: string | null }
  | { ok: false; error: string; status: 401 | 403 };

function adminOrNull() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/** Otorisasi server per kind; tak pernah percaya id dari client tanpa cek kepemilikan. */
async function authorize(kind: PhotoKind, targetId: string): Promise<Authed> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Kamu tidak punya akses", status: 401 };
  const userId = current.user.id;

  if (kind === "avatar") {
    if (targetId !== userId) return { ok: false, error: "Kamu tidak punya akses", status: 403 };
    return { ok: true, userId, tenantId: null };
  }

  const supabase = await createClient();
  if (kind === "tenant_logo") {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, owner_id")
      .eq("id", targetId)
      .maybeSingle();
    if (!tenant || tenant.owner_id !== userId)
      return { ok: false, error: "Kamu tidak punya akses", status: 403 };
    return { ok: true, userId, tenantId: targetId };
  }

  const { data: menu } = await supabase
    .from("menu_items")
    .select("id, tenant_id, tenants!inner(owner_id)")
    .eq("id", targetId)
    .maybeSingle();
  if (!menu) return { ok: false, error: "Kamu tidak punya akses", status: 403 };
  const tenant = menu.tenants as unknown as { owner_id: string } | null;
  if (!tenant || tenant.owner_id !== userId)
    return { ok: false, error: "Kamu tidak punya akses", status: 403 };
  return { ok: true, userId, tenantId: menu.tenant_id };
}

// Batas ringan: 20 permintaan/user/menit per proses server.
const hits = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (hits.get(userId) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= 20) {
    hits.set(userId, arr);
    return true;
  }
  arr.push(now);
  hits.set(userId, arr);
  return false;
}

function revalidateFor(kind: PhotoKind) {
  if (kind === "avatar") {
    revalidatePath("/profil");
    revalidatePath("/beranda");
  } else if (kind === "tenant_logo") {
    revalidatePath("/tenant");
    revalidatePath("/beranda/katalog");
  } else {
    revalidatePath("/tenant/menu-saya");
    revalidatePath("/tenant");
    revalidatePath("/beranda/katalog");
    revalidatePath("/beranda");
  }
}

async function currentPath(
  kind: PhotoKind,
  targetId: string,
  tenantId: string | null,
): Promise<string | null> {
  const admin = adminOrNull();
  if (!admin) return null;
  if (kind === "avatar") {
    const { data } = await admin
      .from("profiles")
      .select("avatar_path")
      .eq("id", targetId)
      .maybeSingle();
    return data?.avatar_path ?? null;
  }
  if (kind === "tenant_logo") {
    const { data } = await admin
      .from("tenants")
      .select("logo_path")
      .eq("id", targetId)
      .maybeSingle();
    return data?.logo_path ?? null;
  }
  const { data } = await admin
    .from("menu_items")
    .select("photo_path")
    .eq("id", targetId)
    .maybeSingle();
  void tenantId;
  return data?.photo_path ?? null;
}

async function writePath(kind: PhotoKind, targetId: string, path: string | null): Promise<void> {
  const admin = adminOrNull();
  if (!admin) return;
  if (kind === "avatar") {
    await admin.from("profiles").update({ avatar_path: path }).eq("id", targetId);
  } else if (kind === "tenant_logo") {
    await admin.from("tenants").update({ logo_path: path }).eq("id", targetId);
  } else {
    await admin.from("menu_items").update({ photo_path: path }).eq("id", targetId);
  }
}

export async function createUploadUrl(input: {
  kind: PhotoKind;
  targetId: string;
  originalBytes?: number;
}): Promise<
  | { ok: true; signedUrl: string; token: string; path: string }
  | { ok: false; error: string; status: 400 | 401 | 403 | 429 | 500 }
> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Kamu tidak punya akses", status: 403 };
  const { kind, targetId } = parsed.data;
  // Batas seragam semua foto: file asli maksimal 10 MB (validasi ulang di server).
  if (input.originalBytes != null && input.originalBytes > 10 * 1024 * 1024)
    return { ok: false, error: "Foto terlalu besar (maks 10 MB)", status: 400 };
  const auth = await authorize(kind, targetId);
  if (!auth.ok) return { ok: false, error: auth.error, status: auth.status };
  if (rateLimited(auth.userId))
    return { ok: false, error: "Gagal mengunggah. Coba lagi.", status: 429 };

  const random = crypto.randomUUID();
  const bucket = BUCKET_BY_KIND[kind];
  const path =
    kind === "avatar"
      ? `${auth.userId}/${random}.webp`
      : kind === "tenant_logo"
        ? `${auth.tenantId}/${random}.webp`
        : `${auth.tenantId}/${targetId}/${random}.webp`;

  const admin = adminOrNull();
  if (!admin) return { ok: false, error: "Layanan unggah belum tersedia. Coba lagi.", status: 500 };
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[photo] createSignedUploadUrl gagal:", error?.message);
    return { ok: false, error: "Gagal mengunggah. Coba lagi.", status: 500 };
  }
  return { ok: true, signedUrl: data.signedUrl, token: data.token, path };
}

export async function confirmUpload(input: {
  kind: PhotoKind;
  targetId: string;
  path: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = ConfirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Kamu tidak punya akses" };
  const { kind, targetId, path } = parsed.data;
  const auth = await authorize(kind, targetId);
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!isValidPhotoPath(kind, path)) return { ok: false, error: "Gagal mengunggah. Coba lagi." };

  const bucket = BUCKET_BY_KIND[kind];
  const admin = adminOrNull();
  if (!admin) return { ok: false, error: "Layanan unggah belum tersedia. Coba lagi." };
  const { data: obj, error: dlErr } = await admin.storage.from(bucket).download(path);
  if (dlErr || !obj) return { ok: false, error: "Gagal mengunggah. Coba lagi." };
  if (obj.size > MAX_OBJECT_BYTES || !["image/webp", "image/jpeg", "image/png"].includes(obj.type))
    return { ok: false, error: "Gagal mengunggah. Coba lagi." };

  const old = await currentPath(kind, targetId, auth.tenantId);
  await writePath(kind, targetId, path);
  if (old && old !== path) {
    void admin.storage.from(bucket).remove([old]);
  }
  revalidateFor(kind);
  return { ok: true };
}

export async function removePhoto(input: {
  kind: PhotoKind;
  targetId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Kamu tidak punya akses" };
  const { kind, targetId } = parsed.data;
  const auth = await authorize(kind, targetId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const bucket = BUCKET_BY_KIND[kind];
  const admin = adminOrNull();
  if (!admin) return { ok: false, error: "Layanan unggah belum tersedia. Coba lagi." };
  const old = await currentPath(kind, targetId, auth.tenantId);
  await writePath(kind, targetId, null);
  if (old) void admin.storage.from(bucket).remove([old]);
  revalidateFor(kind);
  return { ok: true };
}
