import type { Metadata } from "next";
import ForbiddenPage from "./forbidden";

export const metadata: Metadata = { title: "Akses ditolak" };

/** Alias konvensi unauthorized() — isi sama dengan forbidden. */
export default function Unauthorized() {
  return <ForbiddenPage />;
}
