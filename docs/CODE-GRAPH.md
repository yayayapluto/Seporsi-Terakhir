# Code Graph — Seporsi Terakhir

Graf dependensi kode per 30 Okt 2026 (branch `dev-redesign`). Fokus: `src/` + `supabase/migrations/`. UI shadcn (`src/components/ui/*`) adalah leaf, tidak digambar per-komponen.

## 1. Lapisan (layer diagram)

```mermaid
flowchart TB
  subgraph UI["Rute App Router"]
    PUB["(public): /, /beranda, /cara-kerja, /masuk,\n/katalog, /katalog/[portionId],\n/pesanan, /pesanan/[orderId], /profil"]
    TEN["tenant: /tenant, /tenant/menu,\n/tenant/porsi/baru, /tenant/porsi/[id]/edit,\n/tenant/pesanan, /tenant/pesanan/[id],\n/tenant/scan, /tenant/pendaftaran,\n/tenant/menunggu-persetujuan"]
    ADM["admin: /admin, /admin/tenant"]
    AKN["lintas-role: /akun/pengaturan, /notifikasi,\n/api/orders, /auth/callback, /auth/sign-out"]
  end

  subgraph ACT["Mutasi: Server Actions + Route Handler"]
    A_PUB["(public)/pesanan/actions.ts\ncancel_order via RPC"]
    A_ORD["api/orders/route.ts\nPOST -> place_order RPC"]
    A_POR["tenant/porsi/actions.ts\ncreate/update portion RPC"]
    A_MEN["tenant/menu/actions.ts\nupsert_menu_item RPC"]
    A_SCN["tenant/scan/actions.ts\nconfirm_pickup RPC"]
    A_TPS["tenant/pesanan/[id]/actions.ts\ncancel RPC"]
    A_ADM["admin/actions.ts\napprove_tenant / reject_tenant RPC\n+ exportCsv via admin_report"]
  end

  subgraph LIB["Lib murni + klien"]
    DOM["lib/domain/\nconstants, pricing, expiry,\nmetrics, portion-detail,\nseed-catalog, seed-accounts"]
    FMT["lib/format.ts\nlib/menu-image.ts\nlib/notifs.ts\nlib/tenant.ts"]
    AUTH["lib/auth/ + lib/auth/redirect.ts\ngetCurrentUser, requireRole,\nisSafeNext"]
    SBC["lib/supabase/\nclient.ts, server.ts, proxy.ts\nlib/env.ts"]
  end

  subgraph DB["Supabase Postgres"]
    TBL["tables: profiles, tenants,\nmenu_items, portions, orders"]
    RPC["RPC: place_order, my_orders,\nconfirm_pickup, cancel_order,\nupsert_menu_item, update_portion,\nimpact_summary, admin_report,\napprove_tenant, reject_tenant,\ntenant_order_detail, own_tenant_id"]
    RLS["RLS: read-only policies\nwrite HANYA via RPC\nsecurity-definer"]
    STO["storage: menu-images\n(public read, tulis via RPC)"]
  end

  PUB --> A_PUB
  PUB --> A_ORD
  TEN --> A_POR
  TEN --> A_MEN
  TEN --> A_SCN
  TEN --> A_TPS
  ADM --> A_ADM
  AKN --> A_ORD

  A_PUB & A_ORD & A_POR & A_MEN & A_SCN & A_TPS & A_ADM --> SBC
  A_POR & A_MEN --> DOM
  PUB --> DOM
  ADM --> DOM
  TEN & ADM & PUB & AKN --> AUTH
  TEN & AKN --> FMT
  SBC --> DB
```

## 2. Dependensi lib/domain (murni, tanpa I/O)

```mermaid
flowchart LR
  C["constants.ts\nSELL_WINDOW_*, DISCOUNT_*,\nMAX_QUANTITY_PER_ORDER,\nAPP_TIMEZONE"] --> P["pricing.ts\nsuggestDiscountPrice()"]
  C --> E["expiry.ts\nisValidSellWindow,\ncomputeExpiry,\nisPortionOrderable"]
  M["metrics.ts\nportionsSaved, wastePreventedKg,\nmoneySaved, extraTenantRevenue,\npercentSold"] --> CSV["admin/csv.ts\nbuildTenantCsv, escapeCsv"]
  PD["portion-detail.ts\nisMissingColumnError,\nshouldLogPortionLoadError"] --> KDET["katalog/[portionId]/page.tsx"]
  C --> FMT2["lib/format.ts\nformatIDR, formatDateTimeWIB"]
```

Aturan: `lib/domain/*` tidak boleh import `supabase`, `next/*`, atau `lib/auth`. Validasi Zod di boundary (form + actions + route) memakai konstanta ini.

## 3. Auth & guard chain

```mermaid
flowchart LR
  PX["src/proxy.ts\nmatcher semua rute"] --> UP["lib/supabase/proxy.ts\nupdateSession()\nrefresh cookie + gate kasar"]
  UP -->|"/masuk + sudah login"| HOME["redirect homeForRole()"]
  UP -->|"protected + anon"| LOGIN["redirect /masuk?next="]
  PG["page server"] --> GC["getCurrentUser()\nprofiles.role"]
  GC --> RR["requireRole(next, ...roles)"]
  RR --> TG["tenant/guard.ts\nrequireOwnTenant()\ntenant ada + is_approved"]
```

`proxy.ts` hanya cek ada/tidaknya user (cepat). Pengecekan role ketat ada di tiap `page.tsx` / `guard.ts` server-side.

## 4. Alur data utama

| Alur | Rute → Aksi → RPC → Tabel |
|---|---|
| Student order | `/katalog/[portionId]` order-form → `POST /api/orders` → `place_order` → `orders` insert + `portions.quantity_remaining` decrement atomik |
| Batal (student) | `/pesanan/[orderId]` cancel-button → `(public)/pesanan/actions.ts` → `cancel_order` → `orders.status=cancelled`, kuota kembali |
| Tenant posting | `/tenant/porsi/baru` portion-form → `tenant/porsi/actions.ts` → `create_portion` / `update_portion` → `portions` |
| Tenant menu | `/tenant/menu` menu-manager → `tenant/menu/actions.ts` → `upsert_menu_item` → `menu_items` (+ `image_path` via `menu-images` bucket) |
| Scan pickup | `/tenant/scan` scanner-client → `tenant/scan/actions.ts` → `confirm_pickup(pickup_token)` → `orders.status=picked_up` |
| Admin approve | `/admin/tenant` approve-list → `admin/actions.ts` → `approve_tenant` / `reject_tenant` → `tenants.is_approved` + `profiles.role` promosi |
| Admin laporan | `/admin` impact-client → `impact_summary` + `admin_report` → `admin/csv.ts buildTenantCsv` → unduh CSV |
| Notifikasi | `/notifikasi` + `notif-live.tsx` → `lib/notifs.ts loadNotifs(role)` → `my_orders` (student) / `orders` join (tenant) / `tenants pending` (admin), live via Realtime `orders` |

## 5. Tabel modul kunci

| Modul | Tanggung jawab | Bergantung ke | Dipakai oleh |
|---|---|---|---|
| `lib/domain/constants.ts` | BR-2/BR-6 single source of truth | — | pricing, expiry, format, actions, route |
| `lib/domain/pricing.ts` | saran harga 45% → Rp500 | constants | portion-form, menu-manager |
| `lib/domain/expiry.ts` | validasi window + orderability | constants | katalog-list, order-form, API route |
| `lib/domain/metrics.ts` | 5 metrik impact | — | admin impact-client, csv |
| `lib/auth/*` | getCurrentUser, requireRole, isSafeNext | supabase/server | semua page terproteksi, proxy |
| `lib/supabase/*` | client/server/proxy, refresh sesi | env (Zod) | actions, route, pages |
| `lib/notifs.ts` | agregasi notif per role | supabase/server | /notifikasi |
| `lib/tenant.ts` | getOwnTenant | auth, supabase/server | tenant guard + pages |
| `lib/menu-image.ts` | public URL `menu-images` | env | katalog, detail, menu-manager |
| `app/admin/csv.ts` | build + escape CSV (anti formula-inject) | metrics | admin/actions exportCsv |
| `proxy.ts` | entry middleware | lib/supabase/proxy | Next.js |

## 6. Catatan regenerasi

Graf ini dibuat manual dari baca kode (bukan generated tool). Untuk regenerasi otomatis parsial: `find src/app -name "page.tsx" -o -name "actions.ts" -o -name "route.ts"` untuk daftar rute, dan `head` tiap file `supabase/migrations/*.sql` untuk RPC baru. Jika tambah RPC/route baru, update tabel §4 + diagram §1 di file ini.
