// bun run seed — reset DB lokal: migrasi + supabase/seed.sql dimuat ulang.
// Butuh Docker + `supabase start`. Verifikasi: buka /katalog (hitung "N porsi tersedia").
import { execSync } from "node:child_process";

execSync("supabase db reset", { stdio: "inherit" });
console.log("seed OK — buka /katalog untuk lihat data.");
