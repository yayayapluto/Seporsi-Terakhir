# Wiki — Seporsi Terakhir (Porsi Terakhir)

Halaman ini ringkasan kerja codebase per 30 Okt 2026, branch `dev-redesign`. Detail graf dependensi: `docs/CODE-GRAPH.md`. Brief produk: `docs/product-brief.md`. Keputusan historis: `docs/decisions.md`.

## 1. Apa ini

Web app hiper-lokal satu kampus (pilot opt-in): tenant kantin menjual sisa makanan matang akhir hari ("Seporsi Terakhir") dengan diskon; mahasiswa pesan, ambil langsung dengan QR, bayar di tempat (cash/QRIS — sistem tidak memproses pembayaran). Setiap pickup ter-scan tercatat sebagai data dampak (SDG 12).

## 2. Stack

Next.js 16.4.3 (App Router, `src/`, alias `@/*`), React 19, Tailwind v4 (CSS-first, tanpa config), shadcn/ui + lucide-react, Biome (lint+format), Supabase (Postgres/Auth/RLS/RPC via `@supabase/supabase-js` + `@supabase/ssr`), Google sign-in via Supabase Auth, `react-qr-code` + `@yudiel/react-qr-scanner`, Zod + react-hook-form, Vitest (`bun run test`).

Perintah: `bun run dev` / `build` / `start`, `lint`, `format`, `typecheck`, `test`, `check` (= lint+typecheck+test), `db:push`, `db:migrations`, `db:types`, `db:seed`, `seed:auth`. Toolchain Bun, `bun.lock` dikomit, Node v24.21.0.

## 3. Struktur direktori

- `src/app/(public)/` — grup tanpa prefix URL: `/`, `/beranda`, `/cara-kerja`, `/masuk`, `/katalog`, `/katalog/[portionId]`, `/pesanan`, `/pesanan/[orderId]`, `/profil`. (URL tetap tanpa `/public`.)
- `src/app/tenant/` — `/tenant`, `/menu`, `/porsi/baru`, `/porsi/[id]/edit`, `/pesanan`, `/pesanan/[id]`, `/scan`, `/pendaftaran`, `/menunggu-persetujuan`. Guard: `guard.ts` → `requireOwnTenant`.
- `src/app/admin/` — `/admin` (dashboard impact + CSV), `/admin/tenant` (approve list).
- `src/app/akun/pengaturan`, `src/app/notifikasi` — lintas role. `src/app/api/orders/route.ts` — POST reservasi. `src/app/auth/*` — callback + sign-out.
- `src/components/ui/` — shadcn generated, jangan ditulis manual. Komponen app (`app-header`, `bottom-nav`, `nav-tabs`, `order-status-badge`, dst.) di sebelahnya.
- `src/lib/domain/` — logika murni + Vitest: `constants`, `pricing`, `expiry`, `metrics`, `portion-detail`, `seed-catalog`, `seed-accounts`.
- `src/lib/auth/` (`getCurrentUser`, `requireRole`, `redirect`), `src/lib/supabase/` (`client`, `server`, `proxy`), `src/lib/` (`env` Zod, `format` IDR/WIB, `tenant`, `notifs`, `menu-image`).
- `src/types/database.ts` — GENERATED (`bun run db:types`), jangan edit manual.
- `supabase/migrations/` — 13 file (`20261027*`–`20261029*`): skema, RPC, RLS, daily cap, portion details, fix menu/is_active/impact_summary, tenant_order_detail, realtime, menu-images, reject_tenant.
- `docs/` — brief, decisions, setup, design (Stitch), qa, wiki + code-graph (file ini).

## 4. Peran & rute

| Role | Home | Bisa akses |
|---|---|---|
| Anon | `/` landing, `/cara-kerja`, `/masuk` | katalog/pesanan/profil/tenant/admin redirect ke `/masuk?next=` (via `proxy.ts`) |
| student | `/beranda` | katalog, detail + order, pesanan + QR + batal, profil + badge, notifikasi (order selesai/batal), pengaturan |
| tenant (approved) | `/tenant` | dashboard, menu (CRUD + foto), porsi baru/edit (3 input: menu, jumlah, jam masak), pesanan + detail + cancel, scan QR buyer, notifikasi reservasi masuk |
| tenant belum daftar / pending | — | `/tenant/pendaftaran`, `/tenant/menunggu-persetujuan` (guard redirect) |
| admin | `/admin` | impact dashboard + CSV, approve/reject tenant (`/admin/tenant`), notifikasi tenant pending |

Login: Google (Supabase Auth) + email+password (`masuk/email-sign-in.tsx`). Setelah login → `homeForRole`. `isSafeNext` cegah open-redirect.

## 5. Alur utama

1. Tenant set harga normal sekali per menu (`upsert_menu_item`), upload 1 foto per menu (bucket `menu-images`, 2MB, jpg/png/webp, public read).
2. Tenant posting porsi: menu + jumlah + jam masak (BR-3 wajib + tampil). Harga diskon auto-saran 45% → Rp500 terdekat, bisa edit. Jendela jual 120–240 mnt pasca-masak, default 180 (BR-2). Expired = tidak orderable, tidak tampil.
3. Student order di `/katalog/[portionId]` → `POST /api/orders` → RPC `place_order` (atomic decrement, cek expired/release/kuota, cap 2/pesanan + 2 porsi/hari WIB, cancelled tak dihitung, admin exempt). Sukses → `/pesanan/[orderId]` (QR `pickup_token` + slot + status live via Realtime).
4. Bayar di tempat, tunjukkan QR. Tenant scan (`/tenant/scan`, `@yudiel/react-qr-scanner`) → `confirm_pickup` → `picked_up`. Atau batal (student/tenant) → `cancel_order` → kuota kembali.
5. Dampak: `portions saved` = count pickup ter-scan; `waste kg` = terjual × bobot rata-rata menu (null bila bobot tak ada — bedakan "no data" vs 0); `hemat` = (normal−diskon) × porsi; `revenue` = nilai transaksi pickup; `% sold` = terjual/diposting. Admin lihat di `/admin` (`impact_summary`), unduh CSV (`buildTenantCsv`, escape anti formula-inject).

## 6. Domain rules → kode

BR-1 (matang saja): konvensi form + SOP `cara-kerja`, tanpa cek kimia di kode. BR-2: `constants.SELL_WINDOW_*` + `expiry.ts` + filter SQL `expires_at/release_at` + RPC. BR-3: `cooked_at` wajib di form + tampil di katalog/detail/pesanan (`my_orders.cooked_at`). BR-4/5: `ingredients`/`allergen_note` opsional tapi tampil bila diisi (`portion-detail.ts` toleran kolom hilang). BR-6: `pricing.suggestDiscountPrice` (45%, Rp500, floor Rp500, selalu < normal). BR-7: fee 0 — tidak ada kode fee. BR-8: opt-in — guard pendaftaran/approval, tanpa partisipasi paksa. Tambahan: `MAX_QUANTITY_PER_ORDER = 2` (usulan, enforced di RPC).

## 7. DB & RPC (ringkas)

Tabel: `profiles(id, role, ...)`, `tenants(owner_id unique, name, is_approved)`, `menu_items(tenant_id, name, normal_price, avg_weight_grams, is_active, ingredients, allergen_note, image_path)`, `portions(tenant_id, menu_item_id, quantity_posted/remaining, cooked_at, sell_window, release_at, expires_at)`, `orders(portion_id, student_id, quantity, status, slot_start/end, pickup_token, snapshots harga/bobot)`.
RPC tulis (security-definer, cek auth+role di dalam; RLS tanpa policy tulis langsung): `place_order`, `cancel_order`, `confirm_pickup`, `create/update_portion`, `upsert_menu_item`, `approve/reject_tenant`, view: `my_orders`, `tenant_order_detail`, `impact_summary`, `admin_report`, helper `own_tenant_id`. Realtime: `orders replica identity full` + publication. Seed: `supabase/seed.sql` (6 tenant, 16 menu, 12 porsi incl. 1 expired bukti filter) via `scripts/seed.ts` (= `db reset`).

## 8. Konvensi

Server Components default; `"use client"` hanya bila perlu. Mutasi = Server Actions; validasi Zod di boundary. Tidak ada business rule hanya-di-UI — enforced server/RLS/RPC. Tanggal `Intl.DateTimeFormat` + `Asia/Jakarta` (tanpa lib tanggal); IDR integer via `formatIDR`. Design token Stitch di `globals.css` (Plus Jakarta Sans + Inter, primer `#2E7D4F`, aksen `#F28C28`, kanvas `#FFFBF5`); mobile-first, light-only, copy Indonesia. Jangan: edit `database.ts`, pakai service-role di klien, tambah Tailwind config/ESLint, ubah DB tanpa migrasi, campur package manager, tambah dep tanpa catatan di `decisions.md`, bangun P1 (push notif, leaderboard, waste-trend).

## 9. Cara kerja lokal

1. `bun install`, isi `.env` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — lihat `docs/setup.md`).
2. `bun run dev`. DB hosted linked (tanpa Docker): `bun run db:push`, `bun run db:seed`.
3. `bun run check` (lint+typecheck+test) lalu `bun run build`. Satu commit per fase + catat di `decisions.md`.

## 10. Status & yang belum diverifikasi

Sesuai `decisions.md`: order/cancel/scan/approve/CSV butuh DB + login sungguhan (Docker mati saat itu; verifikasi di tangan owner via seed). Notifikasi realtime per-role sudah masuk (29 Okt). P1 (FR-08/09/15) eksplisit jangan dibangun. Sebelum pakai dokumen ini sebagai acuan deploy, re-run `git status` + `bun run check` + `bun run build` karena branch aktif `dev-redesign` (22 modified / 19 untracked saat snapshot).
