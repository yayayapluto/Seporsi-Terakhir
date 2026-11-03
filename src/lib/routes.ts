/** URL terpusat + label breadcrumb. Satu sumber kebenaran path. */

export const ROUTES = {
  beranda: "/beranda",
  katalog: "/katalog",
  pesanan: "/pesanan",
  profil: "/profil",
  notifikasi: "/notifikasi",
  masuk: "/masuk",
  caraKerja: "/cara-kerja",
  admin: "/admin",
  adminTenant: "/admin/tenant",
  tenant: "/tenant",
  tenantScan: "/tenant/scan",
  tenantPesanan: "/tenant/pesanan",
  tenantProfil: "/tenant/profil",
  tenantPendaftaran: "/tenant/pendaftaran",
  tenantMenunggu: "/tenant/menunggu",
  tenantMenu: "/tenant/menu-saya",
  tenantPorsiTambah: "/tenant/porsi/tambah",
  akunPengaturan: "/akun/pengaturan",
  akunKeamanan: "/akun/keamanan",
  akunNotifikasi: "/akun/notifikasi",
  akunPrivasi: "/akun/privasi",
  akunBantuan: "/akun/bantuan",
  tenantOperasional: "/tenant/operasional",
} as const;

export function tenantPorsiUbah(portionId: string): string {
  return `/tenant/porsi/${portionId}/ubah`;
}

export function katalogDetail(portionId: string): string {
  return `/katalog/${portionId}`;
}

export function pesananDetail(orderId: string): string {
  return `/pesanan/${orderId}`;
}

/** Redirect 308 path lama → baru (bookmark/QR lama). */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/tenant/porsi/baru": ROUTES.tenantPorsiTambah,
  "/tenant/menu": ROUTES.tenantMenu,
  "/tenant/menunggu-persetujuan": ROUTES.tenantMenunggu,
};

export function legacyPorsiUbah(pathname: string): string | null {
  const m = /^\/tenant\/porsi\/([^/]+)\/edit\/?$/.exec(pathname);
  if (!m) return null;
  return tenantPorsiUbah(m[1] as string);
}
