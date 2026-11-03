"use client";

import { usePathname } from "next/navigation";
import { SiteFooterMini } from "./site-footer";

const FULL_FOOTER_PATHS: Record<string, true> = {
  "/": true,
  "/masuk": true,
};

/** Footer halaman dalam: border full-bleed, isi sejajar konten. */
export function AppFooter() {
  const pathname = usePathname();
  if (FULL_FOOTER_PATHS[pathname]) return null;
  return (
    <div className="w-full border-t border-line bg-white">
      <SiteFooterMini bare />
    </div>
  );
}
