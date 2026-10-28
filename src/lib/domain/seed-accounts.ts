import type { Role } from "@/lib/auth";

export interface SeedAccount {
  email: string;
  role: Role;
  placeholderId: string;
  fullName: string;
}

/**
 * Single source of truth untuk 9 akun seed (role + email + placeholder UUID
 * dari supabase/seed.sql). Dipakai scripts/seed-auth.ts untuk bikin auth.users
 * + remap tenants.owner_id. Bukan rahasia: password dev-only di docs/setup.md.
 */
export const SEED_ACCOUNTS: SeedAccount[] = [
  {
    email: "admin1793198479@yopmail.com",
    role: "admin",
    placeholderId: "11111111-1111-1111-1111-111111111111",
    fullName: "Admin BEM",
  },
  {
    email: "warteg1793198479@yopmail.com",
    role: "tenant",
    placeholderId: "22222222-2222-2222-2222-222222222222",
    fullName: "Bu Warteg",
  },
  {
    email: "kopi1793198479@yopmail.com",
    role: "tenant",
    placeholderId: "33333333-3333-3333-3333-333333333333",
    fullName: "Bang Kopi",
  },
  {
    email: "padang1793198479@yopmail.com",
    role: "tenant",
    placeholderId: "44444444-4444-4444-4444-444444444444",
    fullName: "Uni Padang",
  },
  {
    email: "soto1793198479@yopmail.com",
    role: "tenant",
    placeholderId: "55555555-5555-5555-5555-555555555555",
    fullName: "Cak Soto",
  },
  {
    email: "pecel1793198479@yopmail.com",
    role: "tenant",
    placeholderId: "66666666-6666-6666-6666-666666666666",
    fullName: "Mbak Pecel",
  },
  {
    email: "geprek1793198479@yopmail.com",
    role: "tenant",
    placeholderId: "77777777-7777-7777-7777-777777777777",
    fullName: "Mas Geprek",
  },
  {
    email: "rafi1793198479@yopmail.com",
    role: "student",
    placeholderId: "88888888-8888-8888-8888-888888888888",
    fullName: "Rafi Anggara",
  },
  {
    email: "sinta1793198479@yopmail.com",
    role: "student",
    placeholderId: "99999999-9999-9999-9999-999999999999",
    fullName: "Sinta Dewi",
  },
];
