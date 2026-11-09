import fs from "node:fs";
import path from "node:path";
import { SEED_ACCOUNTS } from "../src/lib/domain/seed-accounts";
import { sessionCookies } from "./support/session";

const PROD_HOSTS = ["seporsi-terakhir.my.id", "re.seporsi-terakhir.my.id"];

// Muat .env.local ke process.env (Playwright tidak memuat env otomatis).
for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
  if (m && m[1] && process.env[m[1]] == null) process.env[m[1]] = m[2];
}

export default async function globalSetup() {
  const baseURL = process.env.BASE_URL ?? "http://localhost:3001";
  const host = new URL(baseURL).hostname;
  if (PROD_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    throw new Error(`global-setup menolak host production: ${baseURL}`);
  }
  const authDir = path.join(process.cwd(), "e2e", ".auth");
  fs.mkdirSync(authDir, { recursive: true });

  // Buat storageState segar dari kredensial seed (hindari JWT basi).
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error("SEED_PASSWORD belum diset di .env.local");
  for (const role of ["admin", "tenant", "student"] as const) {
    const acct = SEED_ACCOUNTS.find((a) => a.role === role);
    if (!acct) continue;
    const cookies = await sessionCookies(acct.email, password, baseURL);
    const file = role === "student" ? "buyer" : role === "tenant" ? "mitra" : "admin";
    fs.writeFileSync(path.join(authDir, `${file}.json`), JSON.stringify({ cookies, origins: [] }));
  }
}
