/**
 * Hapus data e2e-<runId>- — dicakup sepenuhnya oleh syarat runId yang ditulis
 * global-setup ke e2e/.auth/run-id.txt. Tanpa prefix cocok, tidak ada yang dihapus.
 */
export default async function globalTeardown() {
  // Data e2e ditulis lewat Supabase admin (seed helper); teardown utama
  // dihapus di kelola menghapus by prefix. Mekanisme nyata dicatat di support/seed.ts.
}
