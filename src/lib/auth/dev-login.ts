import { SEED_ACCOUNTS } from "@/lib/domain/seed-accounts";

const ALLOWLIST: Record<string, true> = Object.fromEntries(
  SEED_ACCOUNTS.map((a) => [a.email.toLowerCase(), true]),
);

/** Email boleh dipakai dev-login hanya bila terdaftar di SEED_ACCOUNTS. */
export function isDevLoginEmail(email: string): boolean {
  return ALLOWLIST[email.trim().toLowerCase()] === true;
}
/**
 * Dev-login hanya hidup di development/test.
 * Panggil dengan process.env.NODE_ENV dari server route.
 * Production (termasuk preview/staging yang NODE_ENV=production) → false → 404.
 */
export function isDevLoginAllowed(nodeEnv: string | undefined): boolean {
  return nodeEnv === "development" || nodeEnv === "test";
}
