/**
 * Single source of truth untuk data seed demo SEMUA tabel
 * (profiles link by email, tenants, menu_items, portions, orders).
 * Dipakai scripts/seed-demo.ts. Harga IDR integer, diskon BR-6
 * (45% normal, kelipatan Rp500). cookedMinAgo relatif ke now()
 * agar lolos filter katalog BR-2 (release <= now < expires).
 */
export interface SeedMenu {
  tenantEmail: string;
  name: string;
  normalPrice: number;
  weightGrams: number;
  ingredients: string | null;
  allergenNote: string | null;
}

export interface SeedPortion {
  tenantEmail: string;
  menuName: string;
  qty: number;
  cookedMinAgo: number;
}

export interface SeedOrder {
  studentEmail: string;
  tenantEmail: string;
  menuName: string;
  qty: number;
  status: "reserved" | "picked_up";
  slotMinAhead?: number;
}

export const SEED_MENUS: SeedMenu[] = [
  {
    tenantEmail: "warteg1793198479@yopmail.com",
    name: "Nasi ayam + sayur",
    normalPrice: 15000,
    weightGrams: 350,
    ingredients: "Nasi, ayam goreng, sayur sop",
    allergenNote: null,
  },
  {
    tenantEmail: "warteg1793198479@yopmail.com",
    name: "Nasi telur + tempe",
    normalPrice: 12000,
    weightGrams: 300,
    ingredients: "Nasi, telur dadar, tempe orek",
    allergenNote: "Mengandung telur, kedelai",
  },
  {
    tenantEmail: "warteg1793198479@yopmail.com",
    name: "Mie goreng",
    normalPrice: 10000,
    weightGrams: 250,
    ingredients: "Mie, kol, telur",
    allergenNote: "Mengandung telur, gluten",
  },
  {
    tenantEmail: "kopi1793198479@yopmail.com",
    name: "Roti bakar coklat",
    normalPrice: 8000,
    weightGrams: 120,
    ingredients: "Roti, meses coklat, margarin",
    allergenNote: "Mengandung susu, gluten",
  },
  {
    tenantEmail: "kopi1793198479@yopmail.com",
    name: "Pisang goreng (isi 3)",
    normalPrice: 7000,
    weightGrams: 200,
    ingredients: "Pisang, tepung, gula aren",
    allergenNote: "Mengandung gluten",
  },
  {
    tenantEmail: "kopi1793198479@yopmail.com",
    name: "Indomie telur kornet",
    normalPrice: 13000,
    weightGrams: 280,
    ingredients: "Indomie, telur, kornet",
    allergenNote: "Mengandung telur, gluten",
  },
  {
    tenantEmail: "padang1793198479@yopmail.com",
    name: "Nasi rendang + sayur",
    normalPrice: 18000,
    weightGrams: 400,
    ingredients: "Nasi, rendang, sayur singkong",
    allergenNote: "Mengandung santan",
  },
  {
    tenantEmail: "padang1793198479@yopmail.com",
    name: "Nasi ayam pop",
    normalPrice: 16000,
    weightGrams: 380,
    ingredients: "Nasi, ayam pop, sambal",
    allergenNote: null,
  },
  {
    tenantEmail: "padang1793198479@yopmail.com",
    name: "Nasi telur balado",
    normalPrice: 12000,
    weightGrams: 320,
    ingredients: "Nasi, telur balado, kerupuk",
    allergenNote: "Mengandung telur",
  },
  {
    tenantEmail: "soto1793198479@yopmail.com",
    name: "Soto ayam + nasi",
    normalPrice: 13000,
    weightGrams: 350,
    ingredients: "Nasi, ayam suwir, kuah kuning, kol, telur rebus",
    allergenNote: "Mengandung telur",
  },
  {
    tenantEmail: "soto1793198479@yopmail.com",
    name: "Soto ayam tanpa nasi",
    normalPrice: 10000,
    weightGrams: 250,
    ingredients: "Ayam suwir, kuah kuning, kol, soun",
    allergenNote: null,
  },
  {
    tenantEmail: "pecel1793198479@yopmail.com",
    name: "Nasi pecel lengkap",
    normalPrice: 12000,
    weightGrams: 330,
    ingredients: "Nasi, pecel, rempeyek, telur",
    allergenNote: "Mengandung kacang, telur",
  },
  {
    tenantEmail: "pecel1793198479@yopmail.com",
    name: "Nasi pecel + telur",
    normalPrice: 14000,
    weightGrams: 370,
    ingredients: "Nasi, pecel, telur dadar",
    allergenNote: "Mengandung kacang, telur",
  },
  {
    tenantEmail: "geprek1793198479@yopmail.com",
    name: "Nasi ayam geprek sambal matah",
    normalPrice: 15000,
    weightGrams: 350,
    ingredients: "Nasi, ayam geprek, sambal matah",
    allergenNote: null,
  },
  {
    tenantEmail: "geprek1793198479@yopmail.com",
    name: "Nasi ayam geprek original",
    normalPrice: 13000,
    weightGrams: 340,
    ingredients: "Nasi, ayam geprek, sambal bawang",
    allergenNote: null,
  },
  {
    tenantEmail: "geprek1793198479@yopmail.com",
    name: "Mie geprek + telur",
    normalPrice: 11000,
    weightGrams: 300,
    ingredients: "Mie, sambal geprek, telur",
    allergenNote: "Mengandung telur, gluten",
  },
];

export const SEED_PORTIONS: SeedPortion[] = [
  {
    tenantEmail: "warteg1793198479@yopmail.com",
    menuName: "Nasi ayam + sayur",
    qty: 10,
    cookedMinAgo: 30,
  },
  {
    tenantEmail: "warteg1793198479@yopmail.com",
    menuName: "Nasi telur + tempe",
    qty: 5,
    cookedMinAgo: 45,
  },
  { tenantEmail: "warteg1793198479@yopmail.com", menuName: "Mie goreng", qty: 7, cookedMinAgo: 60 },
  {
    tenantEmail: "kopi1793198479@yopmail.com",
    menuName: "Roti bakar coklat",
    qty: 8,
    cookedMinAgo: 100,
  },
  {
    tenantEmail: "kopi1793198479@yopmail.com",
    menuName: "Pisang goreng (isi 3)",
    qty: 6,
    cookedMinAgo: 20,
  },
  {
    tenantEmail: "kopi1793198479@yopmail.com",
    menuName: "Indomie telur kornet",
    qty: 9,
    cookedMinAgo: 25,
  },
  {
    tenantEmail: "padang1793198479@yopmail.com",
    menuName: "Nasi rendang + sayur",
    qty: 12,
    cookedMinAgo: 40,
  },
  {
    tenantEmail: "padang1793198479@yopmail.com",
    menuName: "Nasi ayam pop",
    qty: 10,
    cookedMinAgo: 55,
  },
  {
    tenantEmail: "padang1793198479@yopmail.com",
    menuName: "Nasi telur balado",
    qty: 8,
    cookedMinAgo: 70,
  },
  {
    tenantEmail: "soto1793198479@yopmail.com",
    menuName: "Soto ayam + nasi",
    qty: 15,
    cookedMinAgo: 15,
  },
  {
    tenantEmail: "soto1793198479@yopmail.com",
    menuName: "Soto ayam tanpa nasi",
    qty: 6,
    cookedMinAgo: 90,
  },
  {
    tenantEmail: "pecel1793198479@yopmail.com",
    menuName: "Nasi pecel lengkap",
    qty: 10,
    cookedMinAgo: 50,
  },
  {
    tenantEmail: "pecel1793198479@yopmail.com",
    menuName: "Nasi pecel + telur",
    qty: 8,
    cookedMinAgo: 10,
  },
  {
    tenantEmail: "geprek1793198479@yopmail.com",
    menuName: "Nasi ayam geprek sambal matah",
    qty: 12,
    cookedMinAgo: 35,
  },
  {
    tenantEmail: "geprek1793198479@yopmail.com",
    menuName: "Nasi ayam geprek original",
    qty: 10,
    cookedMinAgo: 25,
  },
  {
    tenantEmail: "geprek1793198479@yopmail.com",
    menuName: "Mie geprek + telur",
    qty: 7,
    cookedMinAgo: 80,
  },
];

/** Contoh riwayat: rafi pesan 2 (1 picked_up + 1 reserved), sinta 1 picked_up. */
export const SEED_ORDERS: SeedOrder[] = [
  {
    studentEmail: "rafi1793198479@yopmail.com",
    tenantEmail: "soto1793198479@yopmail.com",
    menuName: "Soto ayam + nasi",
    qty: 1,
    status: "picked_up",
    slotMinAhead: 30,
  },
  {
    studentEmail: "rafi1793198479@yopmail.com",
    tenantEmail: "geprek1793198479@yopmail.com",
    menuName: "Nasi ayam geprek original",
    qty: 1,
    status: "reserved",
    slotMinAhead: 60,
  },
  {
    studentEmail: "sinta1793198479@yopmail.com",
    tenantEmail: "padang1793198479@yopmail.com",
    menuName: "Nasi rendang + sayur",
    qty: 1,
    status: "picked_up",
    slotMinAhead: 45,
  },
];
export const SEED_TENANT_EMAILS: string[] = [
  "warteg1793198479@yopmail.com",
  "kopi1793198479@yopmail.com",
  "padang1793198479@yopmail.com",
  "soto1793198479@yopmail.com",
  "pecel1793198479@yopmail.com",
  "geprek1793198479@yopmail.com",
];
