"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { homeForRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

/**
 * CTA primer landing: default untuk anonim, diganti di client bila sesi
 * tenant/admin ada. Halaman landing tetap statis (tanpa getUser di server).
 */
export function LandingCta() {
  const [href, setHref] = useState<string>(ROUTES.katalog);
  const [label, setLabel] = useState("Lihat Porsi Hari Ini");
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const user = data.session?.user;
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        const role = profile?.role;
        if (role === "tenant" || role === "admin") {
          setHref(homeForRole(role));
          setLabel("Buka dasbor");
        }
      })
      .catch(() => {
        // anonim: default ditampilkan
      });
  }, []);
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center gap-2 rounded-[14px] bg-[#2E7D4F] px-5 py-3 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(46,125,79,0.25)]"
    >
      {label}
    </Link>
  );
}
