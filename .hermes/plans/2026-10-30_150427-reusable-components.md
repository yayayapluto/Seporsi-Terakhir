# Plan: Konsolidasi komponen & style duplikat (Siera world)

## Goal

Ganti ~60 blok className/style duplikat di 15+ file dengan 6 primitif bersama di `src/components/`, tanpa mengubah tampilan satu piksel pun.

## Current context / assumptions

- Stack: Next.js 16.4.3 App Router (`src/`), Tailwind v4, shadcn/ui + `buttonVariants`, Biome, `bun run check` = lint + typecheck + test. Tidak ada testing-library — vitest hanya untuk logika domain (`src/lib/domain`).
- Dunia visual "Siera" sudah dikunci di `docs/decisions.md`: card `rounded-[20px] border-[#E8ECE9] bg-white`, tile `bg-[#F1F5F2] text-[#2E7D4F]`, hero gradient `from-[#EAF5ED] to-white`, kicker tenant `text-xs font-bold tracking-widest text-primary`.
- Bukti duplikasi (hasil grep 30 Okt 2026):
  - Card `rounded-[20px] border border-[#E8ECE9] bg-white`: **22 kemunculan di 11 file** (katalog-list 3, katalog detail 3, pesanan detail 3, cara-kerja 3, pesanan-list 2, dst).
  - Shadow `shadow-[0_1px_2px_rgba(16,24,40,.04)]` menempel di sebagian card tapi tidak semua (inkonsisten — putuskan: ikutkan sebagai default).
  - Tile ikon `rounded-xl bg-[#F1F5F2]`: **8 kemunculan** (profil 2 via `ROW_TILE`/`CARD` lokal, katalog detail 1, pesanan detail 1, pesanan-list 1, notif-row 1, cara-kerja 2).
  - `function Field({icon,label,children})` **didefinisikan identik 2x**: `src/app/(public)/katalog/[portionId]/page.tsx` (±l.96) dan `src/app/(public)/pesanan/[orderId]/page.tsx` (±l.75).
  - Hero tenant (kicker + `text-3xl font-bold` + desc muted): di `tenant/page.tsx`, `tenant/scan/scanner-client.tsx`, `tenant/menu/page.tsx`, `tenant/pesanan/page.tsx`, `tenant/porsi/baru/page.tsx`.
  - Hero student (gradient card + judul): `beranda/page.tsx`, `katalog/page.tsx`, `pesanan/page.tsx`.
  - Section heading `text-[12px] font-semibold tracking-[0.02em] text-[#64746B]`: profil (3x), katalog detail (1x), pesanan detail (1x).
- Asumsi: tidak ada token CSS baru yang dibutuhkan; semua nilai sudah ada sebagai class inline. Jangan buat abstraksi untuk kasus sekali pakai.

## Architecture / proposed approach

Satu file primitif `src/components/siera.tsx` mengekspor 6 komponen tipis (pembungkus className + `cn`), mengikuti pola `EmptyState`/`OrderStatusBadge` yang sudah ada. Migrasi per kelompok halaman, satu commit per kelompok, verifikasi `bun run check` + `bun run build` tiap kelompok.

## Step-by-step tasks

### Task 1 — Buat `src/components/siera.tsx` (primitif, tanpa pemakai dulu)

Buat file persis ini:

```tsx
import type { ReactNode } from "react";
import { cn } from "cn";

/** Card Siera standar: putih, radius 20, border #E8ECE9, shadow 1px. */
export function SieraCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-[#E8ECE9] bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Tile ikon 40px (size-10), varian size-8 untuk baris rapat. */
export function SieraTile({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F2] text-[#2E7D4F]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Baris Field: ikon + label + isi. Pengganti `function Field` lokal. */
export function SieraField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string; "aria-hidden"?: boolean | "true" | "false" }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 py-3">
      <SieraTile>
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </SieraTile>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <dt className="text-[12px] font-semibold text-[#64746B]">{label}</dt>
        <dd className="min-w-0 text-sm font-semibold text-[#1C2826]">{children}</dd>
      </div>
    </div>
  );
}

/** Judul seksi kecil di atas grup card. */
export function SieraSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]">{children}</h2>
  );
}

/** Hero halaman student: gradient card + judul + subjudul. */
export function SieraHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] border border-[#E8ECE9] bg-gradient-to-b from-[#EAF5ED] to-white p-5">
      <p className="text-xs font-bold tracking-wide text-[#1E5A36]">{eyebrow}</p>
      <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826] lg:text-2xl">
        {title}
      </h1>
      <div className="text-sm text-[#1E5A36]">{children}</div>
    </div>
  );
}

/** Header halaman tenant: kicker + h1 + deskripsi. */
export function SieraTenantHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold tracking-widest text-primary">{kicker}</p>
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
```

Catatan: `SieraField` memakai `<dt>`/`<dd>` — pemakai lama membungkusnya dalam `<dl>`, jadi pastikan tiap situs pemakaian tetap di dalam `<dl>` (sudah begitu di kedua file Field saat ini).

Verifikasi:

```bash
bunx biome check src/components/siera.tsx && bun run typecheck
```

Expected: `Checked 1 file... No fixes applied`, `tsc --noEmit` tanpa error. Lalu commit: `git add src/components/siera.tsx && git commit -m "feat(ui): tambah primitif Siera bersama (Card/Tile/Field/Hero)"`.

### Task 2 — Migrasi `Field` duplikat (2 file, risiko terendah)

1. Di `src/app/(public)/katalog/[portionId]/page.tsx`: hapus definisi `function Field` lokal (±l.96–119), ganti import + semua pemakaian `<Field icon=` → `<SieraField icon=`. Import: `import { SieraField } from "@/components/siera";`. Hapus import `Clock3` jika tak terpakai? Tidak — `Field` memakai `typeof Clock3` sebagai tipe; setelah hapus, cek `Clock3` masih dipakai di tempat lain di file itu. Jika tidak, hapus dari import lucide.
2. Sama untuk `src/app/(public)/pesanan/[orderId]/page.tsx` (±l.75–97).

Verifikasi:

```bash
bunx biome check --write "src/app/(public)/katalog/[portionId]/page.tsx" "src/app/(public)/pesanan/[orderId]/page.tsx" && bun run typecheck && bun run test
```

Expected: biome bersih, `Tests 41 passed (41)`. Lalu `bun run build`, commit `refactor(ui): Field lokal → SieraField`.

Cek visual: tidak ada perubahan tampilan (class identik).

### Task 3 — Migrasi Card + Tile student (5 file)

Ganti blok card/Tile inline dengan `SieraCard`/`SieraTile`, satu file per sub-langkah (lebih mudah revert):

1. `src/app/(public)/profil/page.tsx`: `const CARD` → `SieraCard` (pertahankan `!p-0` dan `border-dashed` via `className`), `ROW_TILE` → `SieraTile`. `SieraSectionTitle` untuk 4 heading (`dampak-heading`, `tenant-heading`, `riwayat-heading`, `bantuan-heading`) — heading profil punya `id`, jadi teruskan: `<SieraSectionTitle>` tidak menerima id! Tambahkan prop `id?` ke `SieraSectionTitle` dulu (edit `siera.tsx`: `{ id, children }`, render `<h2 id={id} ...>`), baru pakai di profil.
2. `src/app/(public)/pesanan/pesanan-list.tsx`: filter card + `motion.ul` wrapper → `SieraCard` (ul tetap `motion.ul`, class digabung via className), tile Store → `SieraTile`.
3. `src/app/(public)/pesanan/[orderId]/page.tsx`: 3 section card + tile + ringkasan bayar aside → `SieraCard`/`SieraTile`; heading "Detail pesanan" → `SieraSectionTitle`.
4. `src/app/(public)/katalog/[portionId]/page.tsx`: header card, foto fallback (pertahankan `role="img"`), panel pesan aside, detail `dl` → `SieraCard`; tile di Field sudah tertangani Task 2.
5. `src/app/(public)/katalog/katalog-list.tsx`: 3 card + hero? (hero katalog di `katalog/page.tsx` — Task 4).

Per file, verifikasi: `bunx biome check --write <file> && bun run typecheck`. Setelah 5 file: `bun run test` (41 passed) + `bun run build`. Commit per file atau 1 commit kelompok: `refactor(ui): Card/Tile student → primitif Siera`.

Contoh pola ganti (profil):

```tsx
// sebelum
<section aria-label="Identitas" className={`${CARD} md:col-span-2`}>
// sesudah
<SieraCard className="md:col-span-2">
```

Awas: `SieraCard` me-render `div`, bukan `section` — jika `aria-label` di section penting (3 section profil + section katalog/pesanan detail), teruskan prop: tambahkan `as`? YAGNI — sebagai gantinya bungkus: biarkan `section aria-label` tetap, isi class card-nya diganti `SieraCard` di dalam? Itu nested div — boleh karena section bukan card. Aturan: elemen yang punya `aria-label`/`aria-labelledby` TETAP dipertahankan sebagai section/aside; `SieraCard` dipakai untuk div card polos. Untuk section ber-card (Ringkasan porsi, Panel pesan, Detail pesanan), tambahkan prop `className` saja tidak cukup karena tag beda. Keputusan: tambahkan prop opsional `ariaLabel`/`ariaLabelledby` + `tag`? Itu over-engineering. Keputusan final: `SieraCard` menerima `...rest: HTMLAttributes<HTMLDivElement>` dan pemakai section mengganti `<section aria-label>` → `<div role="region" aria-label>`? MENGUBAH SEMANTIK — jangan. Maka: untuk 5 section ber-label (2 di katalog detail, 2 di pesanan detail, 0 di profil? profil section Identitas/Dampak pakai aria — Dampak section punya heading + dl), PERTAHANKAN tag + aria, ganti hanya className-nya dengan string token yang diekspor: tambahkan `export const sieraCardClass = "rounded-[20px] border..."` dari `siera.tsx` untuk kasus ber-label. Ini satu baris tambahan di Task 1 — lakukan sekarang sebagai bagian Task 3a (edit siera.tsx + pakai di section ber-label).

### Task 4 — Migrasi Hero (5 file)

1. `katalog/page.tsx`, `pesanan/page.tsx`: blok hero gradient → `<SieraHero eyebrow title>`.
2. `beranda/page.tsx`: hero section (punya `id="tour-hero"` + `lg:p-6` + `lg:col-span-2`) — PERTAHANKAN section + id (target tur!), ganti hanya inner class? Hero beranda strukturnya beda (ada sapaan + info). Keputusan: JANGAN migrasi hero beranda (struktur khusus, target tur) — catat sebagai pengecualian di commit message.
3. Tenant: `tenant/page.tsx`, `tenant/menu/page.tsx`, `tenant/pesanan/page.tsx`, `tenant/porsi/baru/page.tsx`, `tenant/scan/scanner-client.tsx`: blok kicker+h1+desc → `<SieraTenantHeader kicker title>`.
4. `cara-kerja/page.tsx`: 3 card + 5 blok pola shadow — ganti card ke `SieraCard`, tile ke `SieraTile`. (File publik informatif; pola sama.)

Verifikasi per file seperti Task 3. Commit: `refactor(ui): Hero student/tenant → primitif Siera`.

### Task 5 — Sapu akhir + buktikan nol duplikat

1. `src/components/notif-row.tsx`, `nav-tabs.tsx`, `loading-skeleton.tsx`: masing-masing 1–3 kemunculan pola card — ganti ke `SieraCard` bila strukturnya cocok persis; bila varian skeleton (ukuran beda-beda), BIARKAN (varian loading bukan duplikat semantik).
2. Jalankan bukti hitung:

```bash
grep -rn 'rounded-\[20px\] border border-\[#E8ECE9\] bg-white' src --include="*.tsx" | grep -v "components/siera.tsx"
```

Expected: **nol baris** (atau hanya daftar pengecualian yang dicatat: hero beranda, skeleton).

```bash
grep -rn 'function Field(' src --include="*.tsx"; grep -rn 'ROW_TILE\|const CARD' src --include="*.tsx"
```

Expected: nol baris.

3. Gate penuh:

```bash
bun run check && bun run build
```

Expected: lint 0 error pada file scope (catat: repo masih punya 5 error pre-existing di luar scope — `soon-scroller.tsx`, `katalog-list.tsx:287,375`, `notifikasi/page.tsx` — JANGAN disentuh), typecheck lolos, `Tests 41 passed (41)`, build sukses.
4. Commit akhir + catat pengecualian di `docs/decisions.md` (satu baris per pengecualian: hero beranda, skeleton variants).

## Tests / validation

Tidak ada testing-library, jadi TDD unit-test tidak diterapkan untuk komponen presentasional (menambah harness hanya untuk ini melanggar YAGNI). Sebagai gantinya, tiap task memakai siklus verifikasi yang sama:

1. Tulis perubahan minimal per file.
2. `bunx biome check --write <file>` → expected: bersih setelah write.
3. `bun run typecheck` → expected: tanpa error.
4. Setelah tiap kelompok: `bun run test` → expected `Tests 41 passed (41)`; `bun run build` → expected sukses.
5. `git diff --stat` sebelum commit — expected: hanya file task itu; bila melebar, `git checkout` file lain.
6. Commit per kelompok (5 commit total), pesan conventional-commit Bahasa Indonesia campur seperti riwayat (`refactor(ui): ...`).

## Risks, tradeoffs, and open questions

- **Risiko utama: pergeseran visual tak sengaja.** Mitigasi: `SieraCard` memakai shadow yang di sebagian situs lama TIDAK ada (card tanpa shadow di katalog-list filter? cek per situs: bila situs lama tanpa shadow, teruskan `className="shadow-none"`). Aturan: cocokkan piksel, jangan "perbaiki" — bila ragu, `git diff` class per class.
- **Section ber-label**: diputuskan via `sieraCardClass` (string token), bukan prop `as` — menjaga semantik ARIA/`<dl>` tetap valid.
- **Hero beranda tidak dimigrasi** (struktur khusus + target tur `tour-hero`).
- **Skeleton loading tidak dimigrasi** (varian ukuran = kebutuhan, bukan duplikat).
- **Tradeoff `siera.tsx` vs file per komponen**: satu file dipilih karena 6 primitif kecil dan kohesif; pecah bila file >200 baris.
- **Open question**: warna `#E8ECE9`/`#64746B`/`#1E5A36` muncul 100+ kali — kandidat token CSS `@theme` berikutnya, TAPI di luar scope plan ini (butuh keputusan desain + migrasi massal; ajukan plan terpisah).
- **Open question**: `soon-scroller.tsx` untracked + 5 lint error pre-existing di luar scope — jangan sentuh di plan ini.
