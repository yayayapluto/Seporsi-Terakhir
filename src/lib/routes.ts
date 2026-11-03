/** URL terpusat + label breadcrumb. Satu sumber kebenaran path. */

export const ROUTES = {
  beranda: "/beranda",
  katalog: "/beranda/katalog",
  pesanan: "/beranda/pesanan",
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
  profilPengaturan: "/profil/pengaturan",
  profilKeamanan: "/profil/keamanan",
  profilNotifikasi: "/profil/notifikasi",
  profilPrivasi: "/profil/privasi",
  profilBantuan: "/profil/bantuan",
  profilEdit: "/profil/pengaturan/profil",
  tenantOperasional: "/tenant/operasional",
} as const;

export function tenantPorsiUbah(portionId: string): string {
  return `/tenant/porsi/${portionId}/ubah`;
}

export function katalogDetail(portionId: string): string {
  return `/beranda/katalog/${portionId}`;
}

export function pesananDetail(orderId: string): string {
  return `/beranda/pesanan/${orderId}`;
}

/** Redirect 308 path lama → baru (bookmark/QR lama). */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/tenant/porsi/baru": ROUTES.tenantPorsiTambah,
  "/tenant/menu": ROUTES.tenantMenu,
  "/tenant/menunggu-persetujuan": ROUTES.tenantMenunggu,
  "/katalog": ROUTES.katalog,
  "/pesanan": ROUTES.pesanan,
  "/akun/pengaturan": ROUTES.profilPengaturan,
  "/akun/keamanan": ROUTES.profilKeamanan,
  "/akun/notifikasi": ROUTES.profilNotifikasi,
  "/akun/privasi": ROUTES.profilPrivasi,
  "/akun/bantuan": ROUTES.profilBantuan,
};

export function legacyPorsiUbah(pathname: string): string | null {
  const m = /^\/tenant\/porsi\/([^/]+)\/edit\/?$/.exec(pathname);
  if (!m) return null;
  return tenantPorsiUbah(m[1] as string);
}

export function legacyKatalogPesanan(pathname: string): string | null {
  let m = /^\/katalog\/([^/]+)\/?$/.exec(pathname);
  if (m) return katalogDetail(m[1] as string);
  m = /^\/pesanan\/([^/]+)\/?$/.exec(pathname);
  if (m) return pesananDetail(m[1] as string);
  return null;
}
