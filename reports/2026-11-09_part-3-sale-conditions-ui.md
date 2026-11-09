# Proof — Part 3: sale conditions di UI

Tanggal: 2026-11-09 (Asia/Jakarta)
Branch: `dev`

## Komponen bersama
- `src/components/sale-conditions.tsx` → `SaleConditions` (commit `144c80d`)
- Amber box sesuai spec: `bg-[#fdf0d5] text-[#7a4a00] rounded-xl px-3 py-2`,
  ikon `Info` 18px `shrink-0`, teks `text-[13px] font-semibold leading-snug`,
  label **"Syarat: "** bold, teks penuh membungkus, tanpa truncate/line-clamp.
- `sale_conditions` NULL/kosong → render tidak ada apa-apa (tidak ada baris kosong).

## Permukaan yang dipasang (satu commit per permukaan)
| Permukaan | Commit | Lokasi |
|---|---|---|
| Katalog (kartu grid + tampilan list) | `58bd7c8` | `katalog/page.tsx` (select+type) + `katalog-list.tsx` (setelah "Dimasak", sebelum harga) |
| Detail porsi buyer | `10e55eb` | `[portionId]/page.tsx` (select+type, box di kartu header setelah baris harga, + daftar "Porsi sejenis") |
| Post porsi tenant | `9766145` | `portion-form.tsx` (`PortionFormMenu.saleConditions`, box langsung di bawah select menu) + loader `tambah/page.tsx` & `[portionId]/ubah/page.tsx` |
| Daftar porsi tenant (dasbor) | `edacbe5` | `tenant/page.tsx` (`ActivePortion.saleConditions` + box per baris porsi) |
| Kartu beranda | `33e8f9f` | `soon-grid.tsx` + loader `beranda/page.tsx` (setelah "Dimasak", sebelum harga) |
| Kartu pesanan + detail pesanan buyer | `aeee945` | `pesanan/page.tsx` + `pesanan-list.tsx` (box di kartu) + `[orderId]/page.tsx` (baris "Syarat penjualan" di kartu Detail pesanan) |
| Menu Saya (daftar menu tenant) | `9ac208a` | `menu-saya/page.tsx` + `menu-manager.tsx` |
| Daftar + detail pesanan tenant | `a4bcd5e` | `tenant/pesanan/page.tsx` + `tenant/pesanan/[id]/page.tsx` (baris "Syarat penjualan"; data via join RLS-safe, tanpa RPC baru) |

## Data pendukung
- Migrasi `20261109073015_my_orders_sale_conditions.sql` (commit `c5aee40`):
  `my_orders()` sekarang mengembalikan `sale_conditions` dari menu — buyer tetap
  melihat syarat setelah memesan, tanpa bergantung pada RLS `portions_read`
  (porsi kedaluwarsa bisa tak terbaca buyer). `src/types/database.ts` diregenerasi.

## Yang sengaja TIDAK diubah
- Teks notifikasi (dikecualikan spec).
- Kartu "Pesanan aktif" di beranda (tidak merender harga).
- Halaman operasional tenant (hanya agregat angka, tanpa baris menu+harga).
- Layout desktop di luar penambahan baris kondisi; mobile full-width di dalam kartu.

## Verifikasi
- `bun run typecheck` → exit 0 ✅
- `bun run lint` → `Checked 257 files`, exit 0 ✅
- `bun run check` → 20 file / 108 test passed ✅
- `bun run build` → sukses (semua route dynamic ter-render) ✅
- Dev server user (port 3001) hidup; `/masuk` 200, `/beranda/katalog` 307 (redirect auth, wajar) ✅

## Belum terverifikasi
- Render visual box di layar nyata untuk porsi conditional (butuh tenant memposting
  porsi dari menu conditional, misalnya Kantin Ibu 'Is "Bento 1").
- Perilaku pada lebar 360px dengan teks syarat panjang (desain: membungkus penuh,
  tidak ada overflow karena `min-w-0` di semua parent).
