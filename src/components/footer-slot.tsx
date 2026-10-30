"use client";

import { usePathname } from "next/navigation";
import { SiteFooterMini } from "./site-footer";

const FULL_FOOTER_PATHS = new Set(["/", "/cara-kerja", "/masuk"]);

/** Footer minimal di semua halaman dalam; null di landing/cara-kerja/masuk. */
export function FooterSlot() {
  const pathname = usePathname();
  if (FULL_FOOTER_PATHS.has(pathname)) return null;
  return <SiteFooterMini />;
}
