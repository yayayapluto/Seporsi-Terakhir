# Proof — Fitur admin ubah email tenant

Tanggal: 2026-11-09 (Asia/Jakarta)
Branch: `dev`
Role: ada admin role (`profiles.role='admin'`) + area `/admin` — tidak perlu role baru.

## Server (satu transaksi di RPC)
- Migrasi `20261109074143_admin_change_tenant_email.sql` (commit `551c9de`):
  RPC `admin_change_tenant_email(p_tenant_id, p_new_email)` security-definer —
  cek admin di dalam RPC, validasi format, target = owner dari tenant id
  (buyer/admin/tak dikenal ditolak), tolak email sama & email terpakai
  (case-insensitive), update `auth.users` (email + `email_confirmed_at=now()`,
  token konfirmasi dibersihkan) + `auth.identities` (provider email) +
  `profiles`, hapus `auth.refresh_tokens` + `auth.sessions` user itu
  (semua sesi mati), password tidak disentuh.
- Server action `changeTenantEmail` di `src/app/admin/actions.ts`: cek ulang
  login + role admin (non-admin → "Khusus admin."), Zod trim/lowercase/email,
  petakan error: format → "Format email tidak valid", sama →
  "Email baru sama dengan email saat ini", taken/unique →
  "Email sudah dipakai akun lain", lain → "Gagal menyimpan. Coba lagi."
  (tanpa raw DB error), lalu `revalidatePath("/admin/tenant")`.
- Migrasi `20261109074246_admin_audit_logs.sql` (commit `0a5a461`):
  tabel `admin_audit_logs` (admin, tenant, target user, old/new email, action,
  waktu; FK SET NULL; RLS tanpa policy) + RPC diperbarui menulis satu baris
  per perubahan dalam transaksi yang sama. Tanpa password/token/session.

## UI (commit per bagian)
- `d5f3e94`: email owner tampil (membungkus) di tiap baris tenant + tombol
  "Ubah email" outline `min-h-11` (loader join `profiles` by `owner_id`).
- `a3a6793`: dialog via `FormSheet` (dialog tengah desktop, bottom sheet mobile
  `max-h-[85dvh]`, tombol di bawah full-width di mobile) — judul "Ubah email
  tenant", nama tenant + "Email saat ini: ...", input "Email baru" (`type=email`,
  `autocomplete="off"`, `h-12`, `text-base`/16px, label di atas), notice amber
  persis gaya sale-conditions ("Tenant akan keluar dari semua perangkat dan
  harus login dengan email baru."), Batal/Simpan (spinner inline saat menyimpan),
  error di bawah field, sukses → toast "Email tenant diperbarui" + daftar
  diperbarui lokal tanpa reload.

## Verifikasi
- RPC dipanggil sebagai tenant login (Prayata Resto) →
  error `admin only` (tidak ada perubahan data) ✅ (server action memetakan
  menjadi "Khusus admin.")
- `bun run typecheck` exit 0, `bun run lint` exit 0 (258 files),
  `bun run check` 108 test passed, `bun run build` sukses ✅

## Belum terverifikasi
- Perubahan email sukses end-to-end sebagai admin (butuh sesi admin; tidak
  dijalankan agar tidak mengubah data email tenant asli).
- Perilaku keyboard mobile (sheet `max-h-[85dvh]` + konten scroll).
