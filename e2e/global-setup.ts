import fs from "node:fs";
import path from "node:path";

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
  fs.mkdirSync(path.join(process.cwd(), "e2e", ".auth"), { recursive: true });
}
