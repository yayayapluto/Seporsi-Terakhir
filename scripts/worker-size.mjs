// bun run worker:size — ukur ukuran gzip handler server Worker; gagal > 2,5 MB.
// Butuh .open-next sudah di-build (bunx opennextjs-cloudflare build).
import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const TARGET = ".open-next/server-functions/default/handler.mjs";
const LIMIT = 2.5 * 1024 * 1024;

if (!existsSync(TARGET)) {
  console.error(`belum ada build: ${TARGET} (jalankan opennextjs-cloudflare build dulu)`);
  process.exit(1);
}
const bytes = readFileSync(TARGET);
const gz = gzipSync(bytes).length;
console.log(`handler.mjs: ${(bytes.length / 1048576).toFixed(2)} MB, gzip ${(gz / 1048576).toFixed(2)} MB`);
if (gz > LIMIT) {
  console.error(`LEBIH DARI 2,5 MB gzip (${(gz / 1048576).toFixed(2)} MB) — langgar budget free plan`);
  process.exit(1);
}
console.log("worker size OK");
