/**
 * Hint empty-state katalog beranda berdasarkan jam WIB.
 * Batas mengikuti ritme operasional: posting 15.30–16.30, ambil s.d. 18.30.
 */
export function emptyCatalogHint(hourWIB: number): string {
  if (!Number.isFinite(hourWIB) || hourWIB < 0 || hourWIB >= 24)
    return "Biasanya kantin mulai posting sekitar 15.30–16.30. Cek lagi nanti sore.";
  if (hourWIB < 12)
    return "Kantin baru mulai posting sekitar jam 15.30–16.30 nanti. Cek lagi sore ini.";
  if (hourWIB < 15) return "Kantin mulai posting sekitar jam 15.30. Cek lagi sebentar lagi.";
  if (hourWIB < 17)
    return "Kantin lagi posting porsinya sekarang. Muat ulang buat lihat yang sudah masuk.";
  if (hourWIB < 19)
    return "Jendela ambil hampir tutup (sampai 18.30). Lihat sisa yang masih ada di katalog.";
  return "Jendela hari ini sudah tutup. Katalog baru dibuka lagi besok sekitar jam 15.30.";
}
