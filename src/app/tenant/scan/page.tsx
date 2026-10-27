import { requireOwnTenant } from "../guard";
import { ScannerClient } from "./scanner-client";

/** Scanner pickup: kamera mobile-first, konfirmasi via Server Action. */
export default async function ScanPage() {
  await requireOwnTenant("/tenant/scan");
  return <ScannerClient />;
}
