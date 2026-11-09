// bun run storage:setup — idempoten: buat/update 3 bucket foto publik.
// Public read-by-URL saja; TIDAK ada storage policy tulis untuk anon/
// authenticated — semua tulis lewat server action (service role).
// Butuh: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di env.
import { createClient } from "@supabase/supabase-js";

const BUCKETS = ["avatars", "tenant-logos", "menu-photos"] as const;
const FILE_SIZE_LIMIT = 512 * 1024; // 512 KB
const ALLOWED_MIME_TYPES = ["image/webp", "image/jpeg", "image/png"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey)
  throw new Error("Butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: existing, error: listErr } = await db.storage.listBuckets();
if (listErr) throw listErr;
const existingIds = new Set((existing ?? []).map((b) => b.id));

for (const bucket of BUCKETS) {
  if (existingIds.has(bucket)) {
    const { error } = await db.storage.updateBucket(bucket, {
      public: true,
      fileSizeLimit: FILE_SIZE_LIMIT,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });
    if (error) throw new Error(`update bucket ${bucket}: ${error.message}`);
    console.log(`updated ${bucket}`);
  } else {
    const { error } = await db.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: FILE_SIZE_LIMIT,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });
    if (error) throw new Error(`create bucket ${bucket}: ${error.message}`);
    console.log(`created ${bucket}`);
  }
}
console.log("storage:setup OK");
