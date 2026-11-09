import fs from "node:fs";
import path from "node:path";

const PROD_HOSTS = ["seporsi-terakhir.my.id", "re.seporsi-terakhir.my.id"];

export default async function globalSetup() {
  const baseURL = process.env.BASE_URL ?? "http://localhost:3001";
  const host = new URL(baseURL).hostname;
  if (PROD_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    throw new Error(`global-setup menolak host production: ${baseURL}`);
  }
  fs.mkdirSync(path.join(process.cwd(), "e2e", ".auth"), { recursive: true });
}
